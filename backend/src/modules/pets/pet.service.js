const { db } = require('../../config/database');
const cryptoService = require('../../core/crypto.service');
const blobService = require('../../core/blob.service');
const auditService = require('../../core/audit.service');
const pdfService = require('../../core/pdf.service');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../core/errors');

class PetService {
  /**
   * Formatea y descifra las notas confidenciales de la mascota para el cliente/staff.
   */
  formatPet(pet) {
    if (!pet) return null;
    let notas = null;
    if (pet.notas_cifradas) {
      try {
        notas = cryptoService.decrypt(pet.notas_cifradas);
      } catch (_e) {
        notas = null;
      }
    }

    return {
      id: pet.id,
      nombre: pet.nombre,
      especie: pet.especie,
      raza: pet.raza,
      fechaNacimiento: pet.fecha_nacimiento || null,
      sexo: pet.sexo,
      color: pet.color || null,
      esterilizado: Boolean(pet.esterilizado),
      microchip: pet.microchip || null,
      notas,
      activo: Boolean(pet.activo),
      creadoEn: pet.created_at || pet.creado_en
    };
  }

  /**
   * Verifica los permisos que un usuario tiene sobre una mascota dada.
   * Personal de staff (admin, vet, recepcionista) tiene permisos operativos.
   * Para clientes, se consulta la tabla usuarios_mascotas.
   * @param {number} petId 
   * @param {Object} user 
   * @returns {Promise<{ canRead: boolean, isOwner: boolean, isPrimaryOwner: boolean }>}
   */
  async checkUserPetAccess(petId, user) {
    if (['administrador', 'veterinario', 'recepcionista'].includes(user.rol)) {
      return { canRead: true, isOwner: false, isPrimaryOwner: true, isStaff: true };
    }

    const relation = await db('usuarios_mascotas')
      .where({ mascota_id: petId, usuario_id: user.id })
      .first();

    if (!relation) {
      return { canRead: false, isOwner: false, isPrimaryOwner: false, isStaff: false };
    }

    return {
      canRead: true,
      isOwner: true,
      isPrimaryOwner: Boolean(relation.es_propietario_principal),
      nivelPermiso: relation.nivel_permiso,
      isStaff: false
    };
  }

  /**
   * Registra una nueva mascota y asigna al creador como propietario principal.
   */
  async createPet(data, currentUser, ipOrigen = null, userAgent = null) {
    const {
      nombre,
      especie,
      raza,
      fechaNacimiento = null,
      sexo = 'desconocido',
      color = null,
      esterilizado = false,
      microchip = null,
      notas = null,
      propietarioId = null // Si un recepcionista/admin registra la mascota para un cliente
    } = data;

    if (!nombre || !especie || !raza) {
      throw new ValidationError('Nombre, especie y raza son campos obligatorios.');
    }

    // Si hay microchip, verificar unicidad
    if (microchip) {
      const existingChip = await db('mascotas').where('microchip', microchip.trim()).first();
      if (existingChip) {
        throw new ConflictError(`El número de microchip '${microchip}' ya se encuentra registrado.`);
      }
    }

    // Determinar quién será el propietario principal
    let primaryOwnerId = currentUser.id;
    if (['administrador', 'veterinario', 'recepcionista'].includes(currentUser.rol) && propietarioId) {
      primaryOwnerId = propietarioId;
    }

    // Validar que el propietario exista
    const ownerUser = await db('usuarios').where('id', primaryOwnerId).first();
    if (!ownerUser) {
      throw new NotFoundError('El propietario especificado no existe.');
    }

    const notasCifradas = notas ? cryptoService.encrypt(notas) : null;

    const [petId] = await db('mascotas').insert({
      nombre: nombre.trim(),
      especie: especie.trim(),
      raza: raza.trim(),
      fecha_nacimiento: fechaNacimiento,
      sexo: ['macho', 'hembra', 'desconocido'].includes(sexo) ? sexo : 'desconocido',
      color: color ? color.trim() : null,
      esterilizado: Boolean(esterilizado),
      microchip: microchip ? microchip.trim() : null,
      notas_cifradas: notasCifradas,
      activo: true
    });

    // Crear relación como propietario principal
    await db('usuarios_mascotas').insert({
      usuario_id: primaryOwnerId,
      mascota_id: petId,
      es_propietario_principal: true,
      nivel_permiso: 'administracion'
    });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'CREAR_MASCOTA',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: { nombre, especie, primaryOwnerId },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    const newPet = await db('mascotas').where('id', petId).first();
    return this.formatPet(newPet);
  }

  /**
   * Obtiene la ficha de una mascota validando los permisos de acceso.
   */
  async getPetById(petId, currentUser) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para consultar la información de esta mascota.');
    }

    const pet = await db('mascotas').where({ id: petId, activo: true }).first();
    if (!pet) throw new NotFoundError('Mascota no encontrada.');

    // Obtener dueños asociados
    const owners = await db('usuarios_mascotas')
      .join('usuarios', 'usuarios_mascotas.usuario_id', 'usuarios.id')
      .where('usuarios_mascotas.mascota_id', petId)
      .select(
        'usuarios.id',
        'usuarios.email',
        'usuarios.nombre',
        'usuarios.apellido',
        'usuarios_mascotas.es_propietario_principal',
        'usuarios_mascotas.nivel_permiso'
      );

    const formatted = this.formatPet(pet);
    formatted.duenos = owners.map(o => ({
      id: o.id,
      email: o.email,
      nombre: `${o.nombre} ${o.apellido}`,
      esPropietarioPrincipal: Boolean(o.es_propietario_principal),
      nivelPermiso: o.nivel_permiso
    }));

    return formatted;
  }

  /**
   * Lista las mascotas a las que tiene acceso el usuario actual.
   * Si es cliente, solo sus mascotas. Si es staff, lista todas con paginación.
   */
  async listPets(currentUser, { limit = 50, offset = 0, busqueda = '' } = {}) {
    if (['administrador', 'veterinario', 'recepcionista'].includes(currentUser.rol)) {
      let query = db('mascotas').where('activo', true).orderBy('id', 'desc');
      if (busqueda) {
        query = query.where(function() {
          this.where('nombre', 'like', `%${busqueda}%`)
            .orWhere('raza', 'like', `%${busqueda}%`)
            .orWhere('microchip', 'like', `%${busqueda}%`);
        });
      }
      const pets = await query.limit(Math.min(limit, 100)).offset(offset);
      return pets.map(p => this.formatPet(p));
    }

    // Cliente: solo mascotas vinculadas
    const pets = await db('usuarios_mascotas')
      .join('mascotas', 'usuarios_mascotas.mascota_id', 'mascotas.id')
      .where('usuarios_mascotas.usuario_id', currentUser.id)
      .andWhere('mascotas.activo', true)
      .select('mascotas.*', 'usuarios_mascotas.es_propietario_principal')
      .orderBy('mascotas.id', 'desc');

    return pets.map(p => ({
      ...this.formatPet(p),
      esPropietarioPrincipal: Boolean(p.es_propietario_principal)
    }));
  }

  /**
   * Actualiza los datos de la mascota.
   * Requiere ser propietario principal o personal de staff.
   */
  async updatePet(petId, updateData, currentUser, ipOrigen = null, userAgent = null) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.isPrimaryOwner && !access.isStaff) {
      throw new ForbiddenError('Únicamente el propietario principal o el personal clínico pueden modificar la mascota.');
    }

    const pet = await db('mascotas').where({ id: petId, activo: true }).first();
    if (!pet) throw new NotFoundError('Mascota no encontrada.');

    const fieldsToUpdate = {};
    if (updateData.nombre) fieldsToUpdate.nombre = updateData.nombre.trim();
    if (updateData.especie) fieldsToUpdate.especie = updateData.especie.trim();
    if (updateData.raza) fieldsToUpdate.raza = updateData.raza.trim();
    if (updateData.fechaNacimiento !== undefined) fieldsToUpdate.fecha_nacimiento = updateData.fechaNacimiento;
    if (updateData.sexo) fieldsToUpdate.sexo = updateData.sexo;
    if (updateData.color !== undefined) fieldsToUpdate.color = updateData.color;
    if (updateData.esterilizado !== undefined) fieldsToUpdate.esterilizado = Boolean(updateData.esterilizado);
    if (updateData.notas !== undefined) {
      fieldsToUpdate.notas_cifradas = updateData.notas ? cryptoService.encrypt(updateData.notas) : null;
    }

    if (updateData.microchip !== undefined && updateData.microchip !== pet.microchip) {
      if (updateData.microchip) {
        const existing = await db('mascotas')
          .where('microchip', updateData.microchip.trim())
          .andWhereNot('id', petId)
          .first();
        if (existing) {
          throw new ConflictError(`El microchip '${updateData.microchip}' ya está en uso.`);
        }
        fieldsToUpdate.microchip = updateData.microchip.trim();
      } else {
        fieldsToUpdate.microchip = null;
      }
    }

    await db('mascotas').where('id', petId).update(fieldsToUpdate);

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'ACTUALIZAR_MASCOTA',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: fieldsToUpdate,
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    const updated = await db('mascotas').where('id', petId).first();
    return this.formatPet(updated);
  }

  /**
   * Añade un cotitular (dueño adicional con permiso de lectura).
   * Solo el propietario principal o el personal clínico pueden añadir cotitulares.
   */
  async addCoOwner(petId, newOwnerEmail, currentUser, ipOrigen = null, userAgent = null) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.isPrimaryOwner && !access.isStaff) {
      throw new ForbiddenError('Solo el propietario principal puede gestionar los cotitulares de la mascota.');
    }

    const cleanEmail = newOwnerEmail.toLowerCase().trim();
    const targetUser = await db('usuarios').where('email', cleanEmail).first();
    if (!targetUser) {
      throw new NotFoundError(`No existe ninguna cuenta de usuario registrada con el correo '${cleanEmail}'.`);
    }

    const existingRelation = await db('usuarios_mascotas')
      .where({ mascota_id: petId, usuario_id: targetUser.id })
      .first();

    if (existingRelation) {
      throw new ConflictError('El usuario ya se encuentra registrado como dueño de esta mascota.');
    }

    await db('usuarios_mascotas').insert({
      usuario_id: targetUser.id,
      mascota_id: petId,
      es_propietario_principal: false,
      nivel_permiso: 'lectura'
    });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'AGREGAR_COTITULAR',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: { nuevoDuenoId: targetUser.id, email: cleanEmail },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return { success: true, message: `Cotitular '${cleanEmail}' asociado exitosamente.` };
  }

  /**
   * Remueve un cotitular. No se puede remover al propietario principal con este método.
   */
  async removeCoOwner(petId, targetUserId, currentUser, ipOrigen = null, userAgent = null) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.isPrimaryOwner && !access.isStaff) {
      throw new ForbiddenError('Solo el propietario principal puede gestionar los cotitulares de la mascota.');
    }

    const relation = await db('usuarios_mascotas')
      .where({ mascota_id: petId, usuario_id: targetUserId })
      .first();

    if (!relation) {
      throw new NotFoundError('El usuario indicado no es cotitular de esta mascota.');
    }

    if (relation.es_propietario_principal) {
      throw new ForbiddenError('No se puede remover al propietario principal. Utilice la transferencia de titularidad.');
    }

    await db('usuarios_mascotas')
      .where({ mascota_id: petId, usuario_id: targetUserId })
      .del();

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'REMOVER_COTITULAR',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: { cotitularRemovidoId: targetUserId },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return { success: true, message: 'Cotitular removido exitosamente.' };
  }

  /**
   * Transfiere la titularidad principal a otro usuario.
   * Guarda registro histórico inmutable en historial_titularidad para trazabilidad legal.
   */
  async transferOwnership(petId, newOwnerEmail, motivo = 'Transferencia voluntaria', currentUser, ipOrigen = null, userAgent = null) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.isPrimaryOwner && !access.isStaff) {
      throw new ForbiddenError('Únicamente el propietario principal actual o un administrador pueden transferir la titularidad.');
    }

    const cleanEmail = newOwnerEmail.toLowerCase().trim();
    const newOwner = await db('usuarios').where('email', cleanEmail).first();
    if (!newOwner) {
      throw new NotFoundError(`El usuario destinatario '${cleanEmail}' no existe.`);
    }

    const currentPrimary = await db('usuarios_mascotas')
      .where({ mascota_id: petId, es_propietario_principal: true })
      .first();

    if (currentPrimary && currentPrimary.usuario_id === newOwner.id) {
      throw new ConflictError('El usuario indicado ya es el propietario principal de esta mascota.');
    }

    // Ejecutar la transferencia atómicamente
    await db.transaction(async (trx) => {
      // 1. Quitar titularidad principal actual
      if (currentPrimary) {
        await trx('usuarios_mascotas')
          .where({ id: currentPrimary.id })
          .update({ es_propietario_principal: false, nivel_permiso: 'lectura' });
      }

      // 2. Si el nuevo dueño ya era cotitular, elevarlo a principal; si no, insertarlo
      const existingNewOwnerRelation = await trx('usuarios_mascotas')
        .where({ mascota_id: petId, usuario_id: newOwner.id })
        .first();

      if (existingNewOwnerRelation) {
        await trx('usuarios_mascotas')
          .where({ id: existingNewOwnerRelation.id })
          .update({ es_propietario_principal: true, nivel_permiso: 'administracion' });
      } else {
        await trx('usuarios_mascotas').insert({
          usuario_id: newOwner.id,
          mascota_id: petId,
          es_propietario_principal: true,
          nivel_permiso: 'administracion'
        });
      }

      // 3. Registrar en historial_titularidad (trazabilidad legal)
      await trx('historial_titularidad').insert({
        mascota_id: petId,
        usuario_anterior_id: currentPrimary ? currentPrimary.usuario_id : null,
        usuario_nuevo_id: newOwner.id,
        transferido_por_id: currentUser.id,
        motivo: motivo || 'Transferencia de propiedad'
      });
    });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'TRANSFERIR_TITULARIDAD',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: {
        anteriorDuenoId: currentPrimary ? currentPrimary.usuario_id : null,
        nuevoDuenoId: newOwner.id,
        motivo
      },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'critico'
    });

    return {
      success: true,
      message: `Titularidad de la mascota transferida exitosamente a '${cleanEmail}'.`
    };
  }

  /**
   * Sube o actualiza la fotografía de la mascota persistida como LONGBLOB en archivos_adjuntos.
   */
  async uploadPetPhoto(petId, fileObj, currentUser, ipOrigen = null, userAgent = null) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para modificar la fotografía de esta mascota.');
    }

    // Validar y sanitizar archivo binario contra bytes mágicos
    const validated = blobService.validateFile(fileObj);

    // Solo permitir imágenes para perfil
    if (!validated.mimeType.startsWith('image/')) {
      throw new ValidationError('La fotografía de la mascota debe ser una imagen válida (JPEG, PNG o WebP).');
    }

    // Verificar si ya existía una foto para reemplazarla
    const existingPhoto = await db('archivos_adjuntos')
      .where({ entidad_tipo: 'mascota_foto', entidad_id: petId })
      .first();

    if (existingPhoto) {
      await db('archivos_adjuntos')
        .where('id', existingPhoto.id)
        .update({
          nombre_archivo: validated.filename,
          mime_type: validated.mimeType,
          tamano_bytes: validated.size,
          hash_sha256: validated.hashSha256,
          buffer_datos: validated.buffer,
          subido_por_id: currentUser.id
        });
    } else {
      await db('archivos_adjuntos').insert({
        entidad_tipo: 'mascota_foto',
        entidad_id: petId,
        nombre_archivo: validated.filename,
        mime_type: validated.mimeType,
        tamano_bytes: validated.size,
        hash_sha256: validated.hashSha256,
        buffer_datos: validated.buffer,
        subido_por_id: currentUser.id
      });
    }

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'SUBIR_FOTO_MASCOTA',
      entidad: 'Mascota',
      entidadId: petId,
      detalles: { filename: validated.filename, sizeBytes: validated.size },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return {
      success: true,
      message: 'Fotografía de mascota almacenada exitosamente en la base de datos (BLOB).',
      photoUrl: `/api/pets/${petId}/photo`,
      hashSha256: validated.hashSha256
    };
  }

  /**
   * Obtiene el registro binario BLOB de la foto de la mascota.
   */
  async getPetPhotoBlob(petId) {
    const photoRecord = await db('archivos_adjuntos')
      .where({ entidad_tipo: 'mascota_foto', entidad_id: petId })
      .first();

    if (!photoRecord) {
      throw new NotFoundError('La mascota no tiene fotografía registrada.');
    }

    return {
      buffer: Buffer.isBuffer(photoRecord.buffer_datos) 
        ? photoRecord.buffer_datos 
        : Buffer.from(photoRecord.buffer_datos),
      mime_type: photoRecord.mime_type,
      nombre_archivo: photoRecord.nombre_archivo,
      hash_sha256: photoRecord.hash_sha256
    };
  }

  /**
   * Genera la plantilla imprimible de placa de identificación QR en PDF.
   */
  async getPetQrTagPdf(petId, currentUser) {
    const access = await this.checkUserPetAccess(petId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para generar la placa de esta mascota.');
    }

    const pet = await db('mascotas').where('id', petId).first();
    if (!pet) throw new NotFoundError('Mascota no encontrada.');

    const ownerRel = await db('usuarios_mascotas')
      .join('usuarios', 'usuarios_mascotas.usuario_id', 'usuarios.id')
      .where('usuarios_mascotas.mascota_id', petId)
      .where('usuarios_mascotas.es_propietario_principal', true)
      .select('usuarios.nombre', 'usuarios.apellido', 'usuarios.telefono_cifrado')
      .first();

    let propietario = { nombre: 'Tutor', apellido: '', telefono: '+52 744 213 0868' };
    if (ownerRel) {
      propietario = {
        nombre: ownerRel.nombre,
        apellido: ownerRel.apellido,
        telefono: ownerRel.telefono_cifrado ? cryptoService.decrypt(ownerRel.telefono_cifrado) : '+52 744 213 0868'
      };
    }

    const pdfBuffer = await pdfService.generateQrTagPdf({
      mascota: pet,
      propietario,
      contactoEmergencia: propietario.telefono
    });

    return {
      buffer: pdfBuffer,
      mime_type: 'application/pdf',
      nombre_archivo: `placa_qr_${pet.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`,
      hash_sha256: cryptoService.hashSha256(pdfBuffer)
    };
  }
}

module.exports = new PetService();
module.exports.PetService = PetService;
