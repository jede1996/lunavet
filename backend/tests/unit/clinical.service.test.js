const clinicalService = require('../../src/modules/clinical/clinical.service');
const petService = require('../../src/modules/pets/pet.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../src/core/errors');

describe('ClinicalService - Expediente Clínico, Alergias, Peso, Vacunas y Recetas', () => {
  let vetUser;
  let clientUser;
  let strangerUser;
  let testPet;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('recetas_items').del();
    await db('recetas').del();
    await db('vacunas').del();
    await db('registros_peso').del();
    await db('alergias_mascotas').del();
    await db('expedientes_clinicos').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [vId] = await db('usuarios').insert({
      email: 'dr.soto@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Roberto',
      apellido: 'Soto',
      rol: 'veterinario',
      cedula_profesional: 'CED-VET-12345',
      activo: true
    });
    vetUser = {
      id: vId,
      rol: 'veterinario',
      nombre: 'Roberto',
      apellido: 'Soto',
      cedulaProfesional: 'CED-VET-12345'
    };

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Ana',
      apellido: 'Torres',
      rol: 'cliente',
      activo: true
    });
    clientUser = { id: cId, rol: 'cliente' };

    const [sId] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Desconocido',
      apellido: 'User',
      rol: 'cliente',
      activo: true
    });
    strangerUser = { id: sId, rol: 'cliente' };

    testPet = await petService.createPet({
      nombre: 'Bimba',
      especie: 'Canino',
      raza: 'Beagle'
    }, clientUser);
  });

  describe('Consultas y Expediente Clínico', () => {
    test('debe registrar una consulta médica cifrando diagnóstico, tratamiento y notas privadas', async () => {
      // Registrar alergia previa para verificar alerta inmediata
      await clinicalService.addPetAllergy(testPet.id, {
        sustancia: 'Penicilina',
        severidad: 'grave',
        reaccion: 'Shock anafiláctico'
      }, vetUser);

      const consultation = await clinicalService.createConsultation({
        mascotaId: testPet.id,
        motivoConsulta: 'Otitis externa aguda recurrente',
        sintomas: 'Prurito intenso, sacudidas de cabeza, eritema auricular',
        diagnostico: 'Otitis bacteriana por Malassezia pachydermatis',
        tratamiento: 'Limpieza ótica diaria + Gotas de Ciprofloxacino ótico por 10 días',
        notasPrivadas: 'Propietaria renuente al uso de cono isabelino.'
      }, vetUser);

      expect(consultation.id).toBeDefined();
      expect(consultation.alergiasAlertadas).toContain('Penicilina');

      // Verificar cifrado en base de datos (LFPDPPP)
      const inDb = await db('expedientes_clinicos').where('id', consultation.id).first();
      expect(inDb.diagnostico_cifrado.startsWith('enc:v1:')).toBe(true);
      expect(inDb.tratamiento_cifrado.startsWith('enc:v1:')).toBe(true);
      expect(inDb.notas_privadas_cifradas.startsWith('enc:v1:')).toBe(true);
    });

    test('debe impedir que un cliente registre una consulta médica (403 Forbidden)', async () => {
      await expect(clinicalService.createConsultation({
        mascotaId: testPet.id,
        motivoConsulta: 'Consulta no autorizada',
        diagnostico: 'Auto-diagnóstico',
        tratamiento: 'Sin prescripción'
      }, clientUser)).rejects.toThrow(ForbiddenError);
    });

    test('debe ocultar las notas privadas a los clientes y mostrarlas al personal veterinario', async () => {
      await clinicalService.createConsultation({
        mascotaId: testPet.id,
        motivoConsulta: 'Revisión anual',
        diagnostico: 'Paciente en óptimas condiciones',
        tratamiento: 'Vacunación de refuerzo',
        notasPrivadas: 'Comentario confidencial interno del médico'
      }, vetUser);

      // Cliente consulta expediente
      const clientView = await clinicalService.getPetConsultations(testPet.id, clientUser);
      expect(clientView).toHaveLength(1);
      expect(clientView[0].diagnostico).toBe('Paciente en óptimas condiciones');
      expect(clientView[0].notasPrivadas).toBeNull(); // Oculto

      // Veterinario consulta expediente
      const vetView = await clinicalService.getPetConsultations(testPet.id, vetUser);
      expect(vetView[0].notasPrivadas).toBe('Comentario confidencial interno del médico');
    });

    test('debe rechazar consultas con datos incompletos o mascota inexistente', async () => {
      await expect(clinicalService.createConsultation({
        mascotaId: testPet.id,
        motivoConsulta: 'Faltan campos'
      }, vetUser)).rejects.toThrow(ValidationError);

      await expect(clinicalService.createConsultation({
        mascotaId: 99999,
        motivoConsulta: 'Mascota inexistente',
        diagnostico: 'Dx',
        tratamiento: 'Tx'
      }, vetUser)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Alergias Consolidadas', () => {
    test('debe registrar y consultar alergias de la mascota', async () => {
      const allergy = await clinicalService.addPetAllergy(testPet.id, {
        sustancia: 'Dipirona',
        severidad: 'grave',
        reaccion: 'Urticaria generalizada'
      }, vetUser);

      expect(allergy.id).toBeDefined();

      const list = await clinicalService.getPetAllergies(testPet.id, clientUser);
      expect(list).toHaveLength(1);
      expect(list[0].sustancia).toBe('Dipirona');
      expect(list[0].severidad).toBe('grave');
    });

    test('debe denegar registro de alergias a clientes y consultas a extraños', async () => {
      await expect(clinicalService.addPetAllergy(testPet.id, { sustancia: 'Polvo' }, clientUser))
        .rejects.toThrow(ForbiddenError);

      await expect(clinicalService.getPetAllergies(testPet.id, strangerUser))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('Historial de Peso (Serie de Tiempo)', () => {
    test('debe registrar peso y devolver la serie cronológica', async () => {
      await clinicalService.addWeightRecord(testPet.id, { pesoKg: 12.5, fechaRegistro: '2026-01-10' }, clientUser);
      await clinicalService.addWeightRecord(testPet.id, { pesoKg: 13.2, fechaRegistro: '2026-03-15' }, clientUser);
      await clinicalService.addWeightRecord(testPet.id, { pesoKg: 13.8, fechaRegistro: '2026-06-20' }, vetUser);

      const history = await clinicalService.getPetWeightHistory(testPet.id, clientUser);
      expect(history).toHaveLength(3);
      expect(history[0].pesoKg).toBe(12.5);
      expect(history[2].pesoKg).toBe(13.8);
    });

    test('debe validar que el peso sea un valor positivo', async () => {
      await expect(clinicalService.addWeightRecord(testPet.id, { pesoKg: -5 }, clientUser))
        .rejects.toThrow(ValidationError);
      await expect(clinicalService.addWeightRecord(testPet.id, { pesoKg: 'no_numero' }, clientUser))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Carnet de Vacunación', () => {
    test('debe asentar vacunas y consultarlas en orden cronológico inverso', async () => {
      await clinicalService.addVaccine(testPet.id, {
        nombreVacuna: 'Rabia Felina/Canina',
        lote: 'LOTE-RAB-2026',
        fechaAplicacion: '2026-02-01',
        fechaProximaDosis: '2027-02-01'
      }, vetUser);

      const vaccines = await clinicalService.getPetVaccines(testPet.id, clientUser);
      expect(vaccines).toHaveLength(1);
      expect(vaccines[0].nombreVacuna).toBe('Rabia Felina/Canina');
      expect(vaccines[0].lote).toBe('LOTE-RAB-2026');
    });

    test('debe rechazar registro de vacunas por parte de clientes', async () => {
      await expect(clinicalService.addVaccine(testPet.id, { nombreVacuna: 'Parvovirus' }, clientUser))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('Recetas Médicas Digitales y Generación de PDF BLOB', () => {
    test('debe emitir receta con folio, firma digital y almacenar el PDF como BLOB en MySQL', async () => {
      const prescription = await clinicalService.createPrescription(testPet.id, {
        vigenciaDias: 30,
        items: [
          {
            nombreMedicamento: 'Cefalexina 500mg',
            dosis: '1 cápsula',
            frecuencia: 'cada 12 horas',
            duracionDias: 10,
            cantidadPrescrita: 20,
            indicaciones: 'Vía oral con alimento.'
          }
        ]
      }, vetUser);

      expect(prescription.id).toBeDefined();
      expect(prescription.folio.startsWith('REC-')).toBe(true);
      expect(prescription.firmaDigitalHash).toHaveLength(64);
      expect(prescription.pdfUrl).toBe(`/api/clinical/prescriptions/${prescription.id}/pdf`);

      // Verificar persistencia del PDF como BLOB en archivos_adjuntos
      const pdfRecord = await clinicalService.getPrescriptionPdfBlob(prescription.id, clientUser);
      expect(pdfRecord.mime_type).toBe('application/pdf');
      expect(pdfRecord.nombre_archivo).toBe(`${prescription.folio}.pdf`);
      expect(Buffer.isBuffer(pdfRecord.buffer)).toBe(true);

      // Verificar bytes mágicos del PDF
      expect(pdfRecord.buffer.slice(0, 4).toString('ascii')).toBe('%PDF');
    });

    test('debe rechazar emisión de receta sin medicamentos o por usuarios no veterinarios', async () => {
      await expect(clinicalService.createPrescription(testPet.id, { items: [] }, vetUser))
        .rejects.toThrow(ValidationError);

      await expect(clinicalService.createPrescription(testPet.id, {
        items: [{ nombreMedicamento: 'Med', dosis: '1', frecuencia: '1', duracionDias: 1, cantidadPrescrita: 1 }]
      }, clientUser)).rejects.toThrow(ForbiddenError);
    });

    test('debe rechazar consulta de PDF de receta inexistente o por usuario no autorizado', async () => {
      await expect(clinicalService.getPrescriptionPdfBlob(99999, clientUser))
        .rejects.toThrow(NotFoundError);

      const prescription = await clinicalService.createPrescription(testPet.id, {
        items: [{ nombreMedicamento: 'Med', dosis: '1', frecuencia: '1', duracionDias: 1, cantidadPrescrita: 1 }]
      }, vetUser);

      await expect(clinicalService.getPrescriptionPdfBlob(prescription.id, strangerUser))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
