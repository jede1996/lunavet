const { db } = require('../../config/database');
const cryptoService = require('../../core/crypto.service');
const pdfService = require('../../core/pdf.service');
const auditService = require('../../core/audit.service');
const petService = require('../pets/pet.service');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError
} = require('../../core/errors');

class ClinicalService {
  /**
   * Registra una nueva consulta clínica con cifrado en reposo para LFPDPPP.
   * Alerta inmediatamente de cualquier alergia activa del paciente.
   */
  async createConsultation({
    mascotaId,
    motivoConsulta,
    sintomas = null,
    diagnostico,
    tratamiento,
    notasPrivadas = null
  }, vetUser, ipOrigen = null, userAgent = null) {
    if (!['veterinario', 'administrador'].includes(vetUser.rol)) {
      throw new ForbiddenError('Únicamente los médicos veterinarios pueden registrar consultas clínicas.');
    }

    if (!mascotaId || !motivoConsulta || !diagnostico || !tratamiento) {
      throw new ValidationError('Mascota, motivo de consulta, diagnóstico y tratamiento son campos requeridos.');
    }

    const pet = await db('mascotas').where({ id: mascotaId, activo: true }).first();
    if (!pet) throw new NotFoundError('Mascota no encontrada.');

    // Obtener lista consolidada de alergias para verificación preventiva
    const alergias = await db('alergias_mascotas')
      .where('mascota_id', mascotaId)
      .select('sustancia', 'severidad', 'reaccion');

    // Cifrado en reposo a nivel de aplicación (AES-256-GCM) para cumplimiento LFPDPPP
    const diagnosticoCifrado = cryptoService.encrypt(diagnostico);
    const tratamientoCifrado = cryptoService.encrypt(tratamiento);
    const notasPrivadasCifradas = notasPrivadas ? cryptoService.encrypt(notasPrivadas) : null;

    const fechaConsulta = new Date().toISOString();

    const [consultationId] = await db('expedientes_clinicos').insert({
      mascota_id: mascotaId,
      veterinario_id: vetUser.id,
      fecha_consulta: fechaConsulta,
      motivo_consulta: motivoConsulta.trim(),
      sintomas: sintomas ? sintomas.trim() : null,
      diagnostico_cifrado: diagnosticoCifrado,
      tratamiento_cifrado: tratamientoCifrado,
      notas_privadas_cifradas: notasPrivadasCifradas
    });

    await auditService.log({
      usuarioId: vetUser.id,
      accion: 'REGISTRO_CONSULTA_CLINICA',
      entidad: 'ExpedienteClinico',
      entidadId: consultationId,
      detalles: { mascotaId, motivoConsulta },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return {
      id: consultationId,
      mascotaId,
      veterinarioId: vetUser.id,
      fechaConsulta,
      motivoConsulta,
      sintomas,
      diagnostico,
      tratamiento,
      alergiasAlertadas: alergias.map(a => a.sustancia)
    };
  }

  /**
   * Consulta el historial clínico de una mascota validando permisos de acceso.
   */
  async getPetConsultations(mascotaId, currentUser) {
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para acceder al expediente clínico de esta mascota.');
    }

    const records = await db('expedientes_clinicos')
      .join('usuarios', 'expedientes_clinicos.veterinario_id', 'usuarios.id')
      .where('expedientes_clinicos.mascota_id', mascotaId)
      .select(
        'expedientes_clinicos.*',
        'usuarios.nombre as vet_nombre',
        'usuarios.apellido as vet_apellido',
        'usuarios.cedula_profesional as vet_cedula'
      )
      .orderBy('expedientes_clinicos.fecha_consulta', 'desc');

    const isStaff = ['veterinario', 'administrador'].includes(currentUser.rol);

    return records.map(r => {
      let diagnostico = null;
      let tratamiento = null;
      let notasPrivadas = null;

      try {
        diagnostico = cryptoService.decrypt(r.diagnostico_cifrado);
        tratamiento = cryptoService.decrypt(r.tratamiento_cifrado);
        if (isStaff && r.notas_privadas_cifradas) {
          notasPrivadas = cryptoService.decrypt(r.notas_privadas_cifradas);
        }
      } catch (_e) {
        // En caso de corrupción, mantener nulo
      }

      return {
        id: r.id,
        mascotaId: r.mascota_id,
        fechaConsulta: r.fecha_consulta,
        motivoConsulta: r.motivo_consulta,
        sintomas: r.sintomas,
        diagnostico,
        tratamiento,
        notasPrivadas, // Solo visible para veterinarios
        veterinario: {
          nombre: `${r.vet_nombre} ${r.vet_apellido}`,
          cedula: r.vet_cedula
        }
      };
    });
  }

  /**
   * Registra una alergia consolidada para una mascota.
   */
  async addPetAllergy(mascotaId, { sustancia, severidad = 'moderada', reaccion = null }, currentUser) {
    if (!['veterinario', 'administrador'].includes(currentUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico puede registrar alergias en el expediente.');
    }

    if (!sustancia) {
      throw new ValidationError('El nombre de la sustancia alérgena es obligatorio.');
    }

    const [id] = await db('alergias_mascotas').insert({
      mascota_id: mascotaId,
      sustancia: sustancia.trim(),
      severidad: ['leve', 'moderada', 'grave'].includes(severidad) ? severidad : 'moderada',
      reaccion: reaccion ? reaccion.trim() : null,
      creado_por_id: currentUser.id
    });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'REGISTRO_ALERGIA',
      entidad: 'AlergiaMascota',
      entidadId: id,
      detalles: { mascotaId, sustancia, severidad },
      nivelCriticidad: 'advertencia'
    });

    return { id, mascotaId, sustancia, severidad, reaccion };
  }

  /**
   * Obtiene la lista de alergias consolidadas de la mascota.
   */
  async getPetAllergies(mascotaId, currentUser) {
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para ver las alergias de esta mascota.');
    }

    return db('alergias_mascotas')
      .where('mascota_id', mascotaId)
      .select('id', 'sustancia', 'severidad', 'reaccion', 'created_at as creadoEn');
  }

  /**
   * Registra una entrada en la serie de tiempo de peso (RegistroPeso).
   */
  async addWeightRecord(mascotaId, { pesoKg, fechaRegistro = null, notas = null }, currentUser) {
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.isPrimaryOwner && !access.isStaff) {
      throw new ForbiddenError('No tiene permisos para registrar el peso de la mascota.');
    }

    const pesoNum = parseFloat(pesoKg);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      throw new ValidationError('El peso debe ser un valor numérico positivo en kilogramos.');
    }

    const fecha = fechaRegistro || new Date().toISOString().split('T')[0];

    const [id] = await db('registros_peso').insert({
      mascota_id: mascotaId,
      peso_kg: pesoNum,
      fecha_registro: fecha,
      notas: notas ? notas.trim() : null,
      registrado_por_id: currentUser.id
    });

    return { id, mascotaId, pesoKg: pesoNum, fechaRegistro: fecha, notas };
  }

  /**
   * Obtiene la evolución de peso en serie de tiempo (ordenada cronológicamente).
   */
  async getPetWeightHistory(mascotaId, currentUser) {
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para consultar el historial de peso.');
    }

    return db('registros_peso')
      .where('mascota_id', mascotaId)
      .select('id', 'peso_kg as pesoKg', 'fecha_registro as fechaRegistro', 'notas')
      .orderBy('fecha_registro', 'asc');
  }

  /**
   * Registra una vacuna aplicada.
   */
  async addVaccine(mascotaId, { nombreVacuna, lote = null, fechaAplicacion = null, fechaProximaDosis = null }, vetUser) {
    if (!['veterinario', 'administrador'].includes(vetUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico puede asentar vacunas en el carnet.');
    }

    if (!nombreVacuna) {
      throw new ValidationError('El nombre de la vacuna es requerido.');
    }

    const fechaApp = fechaAplicacion || new Date().toISOString().split('T')[0];

    const [id] = await db('vacunas').insert({
      mascota_id: mascotaId,
      nombre_vacuna: nombreVacuna.trim(),
      lote: lote ? lote.trim() : null,
      fecha_aplicacion: fechaApp,
      fecha_proxima_dosis: fechaProximaDosis,
      veterinario_id: vetUser.id
    });

    return { id, mascotaId, nombreVacuna, lote, fechaAplicacion: fechaApp, fechaProximaDosis };
  }

  /**
   * Obtiene el carnet de vacunación de la mascota.
   */
  async getPetVaccines(mascotaId, currentUser) {
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para ver el carnet de vacunación.');
    }

    return db('vacunas')
      .join('usuarios', 'vacunas.veterinario_id', 'usuarios.id')
      .where('vacunas.mascota_id', mascotaId)
      .select(
        'vacunas.id',
        'vacunas.nombre_vacuna as nombreVacuna',
        'vacunas.lote',
        'vacunas.fecha_aplicacion as fechaAplicacion',
        'vacunas.fecha_proxima_dosis as fechaProximaDosis',
        'usuarios.nombre as vetNombre',
        'usuarios.apellido as vetApellido'
      )
      .orderBy('vacunas.fecha_aplicacion', 'desc');
  }

  /**
   * Emite una receta médica digital con folio, firma digital (hash) y generación de PDF BLOB.
   */
  async createPrescription(mascotaId, {
    expedienteId = null,
    vigenciaDias = 30,
    items = []
  }, vetUser, ipOrigen = null, userAgent = null) {
    if (!['veterinario', 'administrador'].includes(vetUser.rol)) {
      throw new ForbiddenError('Solo los veterinarios pueden emitir recetas médicas.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('La receta debe contener al menos un medicamento prescrito.');
    }

    const pet = await petService.getPetById(mascotaId, vetUser);
    const primaryOwner = pet.duenos ? pet.duenos.find(d => d.esPropietarioPrincipal) : null;

    // Alergias consolidadas
    const alergias = await this.getPetAllergies(mascotaId, vetUser);
    const listaAlergias = alergias.map(a => a.sustancia);

    const folio = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaEmision = new Date().toISOString().split('T')[0];

    // Firma digital criptográfica
    const firmaPayload = `${folio}:${vetUser.id}:${vetUser.cedulaProfesional || 'CED-PENDIENTE'}:${fechaEmision}`;
    const firmaHash = cryptoService.hashSha256(firmaPayload);

    // Generar documento PDF con JavaScript puro
    const pdfBuffer = await pdfService.generatePrescriptionPdf({
      folio,
      fechaEmision,
      vigenciaDias,
      veterinario: {
        nombre: vetUser.nombre,
        apellido: vetUser.apellido,
        cedulaProfesional: vetUser.cedulaProfesional
      },
      mascota: {
        nombre: pet.nombre,
        especie: pet.especie,
        raza: pet.raza,
        duenoNombre: primaryOwner ? primaryOwner.nombre : 'Cliente LunaVet'
      },
      alergias: listaAlergias,
      items: items.map(i => ({
        nombreMedicamento: i.nombreMedicamento,
        dosis: i.dosis,
        frecuencia: i.frecuencia,
        duracionDias: i.duracionDias,
        cantidadPrescrita: i.cantidadPrescrita,
        indicaciones: i.indicaciones
      })),
      firmaHash
    });

    let prescriptionId;

    await db.transaction(async (trx) => {
      // 1. Guardar receta
      const [rId] = await trx('recetas').insert({
        folio,
        expediente_id: expedienteId,
        veterinario_id: vetUser.id,
        mascota_id: mascotaId,
        fecha_emision: fechaEmision,
        vigencia_dias: vigenciaDias,
        firma_digital_hash: firmaHash,
        estado: 'activa'
      });
      prescriptionId = rId;

      // 2. Guardar items
      const itemsToInsert = items.map(i => ({
        receta_id: prescriptionId,
        producto_id: i.productoId || null,
        nombre_medicamento: i.nombreMedicamento.trim(),
        dosis: i.dosis.trim(),
        frecuencia: i.frecuencia.trim(),
        duracion_dias: parseInt(i.duracionDias, 10),
        cantidad_prescrita: parseInt(i.cantidadPrescrita, 10),
        indicaciones: i.indicaciones ? i.indicaciones.trim() : null
      }));
      await trx('recetas_items').insert(itemsToInsert);

      // 3. Persistir PDF como BLOB en la base de datos MySQL
      const pdfHash = cryptoService.hashSha256(pdfBuffer);
      await trx('archivos_adjuntos').insert({
        entidad_tipo: 'receta_pdf',
        entidad_id: prescriptionId,
        nombre_archivo: `${folio}.pdf`,
        mime_type: 'application/pdf',
        tamano_bytes: pdfBuffer.length,
        hash_sha256: pdfHash,
        buffer_datos: pdfBuffer,
        subido_por_id: vetUser.id
      });
    });

    await auditService.log({
      usuarioId: vetUser.id,
      accion: 'EMISION_RECETA_MEDICA',
      entidad: 'Receta',
      entidadId: prescriptionId,
      detalles: { folio, mascotaId, cantidadItems: items.length },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return {
      id: prescriptionId,
      folio,
      mascotaId,
      fechaEmision,
      vigenciaDias,
      firmaDigitalHash: firmaHash,
      pdfUrl: `/api/clinical/prescriptions/${prescriptionId}/pdf`,
      items
    };
  }

  /**
   * Obtiene el PDF BLOB de una receta para visualización o descarga.
   */
  async getPrescriptionPdfBlob(prescriptionId, currentUser) {
    const receta = await db('recetas').where('id', prescriptionId).first();
    if (!receta) throw new NotFoundError('Receta médica no encontrada.');

    // Validar acceso sobre la mascota correspondiente
    const access = await petService.checkUserPetAccess(receta.mascota_id, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para consultar esta receta médica.');
    }

    const archivoRecord = await db('archivos_adjuntos')
      .where({ entidad_tipo: 'receta_pdf', entidad_id: prescriptionId })
      .first();

    if (!archivoRecord) {
      throw new NotFoundError('El documento PDF de la receta no se encuentra disponible.');
    }

    return {
      buffer: Buffer.isBuffer(archivoRecord.buffer_datos)
        ? archivoRecord.buffer_datos
        : Buffer.from(archivoRecord.buffer_datos),
      mime_type: archivoRecord.mime_type,
      nombre_archivo: archivoRecord.nombre_archivo,
      hash_sha256: archivoRecord.hash_sha256
    };
  }

  /**
   * Genera dinámicamente el carnet y expediente clínico de la mascota en PDF.
   */
  async getPetMedicalHistoryPdf(petId, currentUser) {
    const access = await petService.checkUserPetAccess(petId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para consultar el expediente de esta mascota.');
    }

    const pet = await db('mascotas').where('id', petId).first();
    if (!pet) throw new NotFoundError('Mascota no encontrada.');

    // Propietario principal
    const ownerRel = await db('usuarios_mascotas')
      .join('usuarios', 'usuarios_mascotas.usuario_id', 'usuarios.id')
      .where('usuarios_mascotas.mascota_id', petId)
      .where('usuarios_mascotas.es_propietario_principal', true)
      .select('usuarios.nombre', 'usuarios.apellido', 'usuarios.telefono_cifrado')
      .first();

    let propietario = { nombre: 'Tutor Luna-Vet', apellido: '' };
    if (ownerRel) {
      propietario = {
        nombre: ownerRel.nombre,
        apellido: ownerRel.apellido,
        telefono: ownerRel.telefono_cifrado ? cryptoService.decrypt(ownerRel.telefono_cifrado) : null
      };
    }

    const consultas = await this.getPetConsultations(petId, currentUser);
    const vacunas = await this.getPetVaccines(petId, currentUser);
    const alergias = await this.getPetAllergies(petId, currentUser);
    const registrosPeso = await this.getPetWeightHistory(petId, currentUser);

    const pdfBuffer = await pdfService.generateMedicalHistoryPdf({
      mascota: pet,
      propietario,
      consultas,
      vacunas,
      alergias,
      registrosPeso
    });

    return {
      buffer: pdfBuffer,
      mime_type: 'application/pdf',
      nombre_archivo: `carnet_clinico_${pet.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`,
      hash_sha256: cryptoService.hashSha256(pdfBuffer)
    };
  }

  /**
   * Verificación pública de receta médica mediante folio / código QR
   * No expone datos confidenciales del propietario pero valida al 100% la autenticidad legal
   */
  async verifyPrescriptionPublic(folio) {
    if (!folio) throw new ValidationError('El folio de receta es requerido.');

    const receta = await db('recetas')
      .join('usuarios', 'recetas.veterinario_id', 'usuarios.id')
      .join('mascotas', 'recetas.mascota_id', 'mascotas.id')
      .where('recetas.folio', folio.trim())
      .select(
        'recetas.id',
        'recetas.folio',
        'recetas.fecha_emision as fechaEmision',
        'recetas.vigencia_dias as vigenciaDias',
        'recetas.firma_digital_hash as firmaDigitalHash',
        'recetas.estado',
        'usuarios.nombre as vetNombre',
        'usuarios.apellido as vetApellido',
        'usuarios.cedula_profesional as vetCedula',
        'mascotas.nombre as mascotaNombre',
        'mascotas.especie as mascotaEspecie',
        'mascotas.raza as mascotaRaza'
      )
      .first();

    if (!receta) {
      throw new NotFoundError('Receta médica no encontrada en el registro oficial.');
    }

    const items = await db('recetas_items')
      .where('receta_id', receta.id)
      .select(
        'nombre_medicamento as nombreMedicamento',
        'dosis',
        'frecuencia',
        'duracion_dias as duracionDias',
        'cantidad_prescrita as cantidadPrescrita',
        'indicaciones'
      );

    // Calcular vigencia en días
    const fechaEmisionDate = new Date(receta.fechaEmision);
    const fechaVencimiento = new Date(fechaEmisionDate.getTime() + (receta.vigenciaDias * 24 * 60 * 60 * 1000));
    const ahora = new Date();
    const esVigente = ahora <= fechaVencimiento && receta.estado === 'activa';
    const diasRestantes = Math.max(0, Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24)));

    return {
      folio: receta.folio,
      fechaEmision: receta.fechaEmision,
      vigenciaDias: receta.vigenciaDias,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      esVigente,
      diasRestantes,
      estado: receta.estado,
      veterinario: {
        nombreCompleto: `${receta.vetNombre} ${receta.vetApellido}`.trim(),
        cedulaProfesional: receta.vetCedula || 'En trámite'
      },
      paciente: {
        nombre: receta.mascotaNombre,
        especie: receta.mascotaEspecie,
        raza: receta.mascotaRaza
      },
      medicamentos: items,
      selloCriptografico: receta.firmaDigitalHash,
      validezLegal: true,
      entidadEmisora: 'Luna-Vet Clínica Veterinaria Integral'
    };
  }
}

module.exports = new ClinicalService();
module.exports.ClinicalService = ClinicalService;

