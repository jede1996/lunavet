const petService = require('../../src/modules/pets/pet.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const { ValidationError, ForbiddenError, NotFoundError, ConflictError } = require('../../src/core/errors');

describe('PetService - Gestión de Pacientes, Relación Multi-dueño y Fotos BLOB', () => {
  let primaryOwner;
  let secondaryOwner;
  let thirdUser;
  let vetUser;

  // Buffer JPEG legítimo
  const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('historial_titularidad').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [u1] = await db('usuarios').insert({
      email: 'dueno1@test.com',
      password_hash: 'hash',
      nombre: 'Dueño',
      apellido: 'Principal',
      rol: 'cliente',
      activo: true
    });
    primaryOwner = { id: u1, rol: 'cliente' };

    const [u2] = await db('usuarios').insert({
      email: 'dueno2@test.com',
      password_hash: 'hash',
      nombre: 'Dueño',
      apellido: 'Secundario',
      rol: 'cliente',
      activo: true
    });
    secondaryOwner = { id: u2, rol: 'cliente' };

    const [u3] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Usuario',
      apellido: 'Ajeno',
      rol: 'cliente',
      activo: true
    });
    thirdUser = { id: u3, rol: 'cliente' };

    const [v1] = await db('usuarios').insert({
      email: 'vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Dr.',
      apellido: 'Veterinario',
      rol: 'veterinario',
      activo: true
    });
    vetUser = { id: v1, rol: 'veterinario' };
  });

  describe('Creación y Consulta de Mascotas', () => {
    test('debe crear una mascota, asignar al creador como propietario principal y cifrar notas', async () => {
      const pet = await petService.createPet({
        nombre: 'Luna',
        especie: 'Canino',
        raza: 'Golden Retriever',
        fechaNacimiento: '2022-05-10',
        sexo: 'hembra',
        color: 'Dorado',
        esterilizado: true,
        microchip: 'CHIP-998811',
        notas: 'Alérgica al polen y sensible del estómago.'
      }, primaryOwner);

      expect(pet.id).toBeDefined();
      expect(pet.nombre).toBe('Luna');
      expect(pet.notas).toBe('Alérgica al polen y sensible del estómago.');

      // Verificar que en base de datos las notas están cifradas con AES-256-GCM
      const rawInDb = await db('mascotas').where('id', pet.id).first();
      expect(rawInDb.notas_cifradas.startsWith('enc:v1:')).toBe(true);

      // Verificar relación N:M
      const rel = await db('usuarios_mascotas').where({ mascota_id: pet.id, usuario_id: primaryOwner.id }).first();
      expect(rel.es_propietario_principal).toBeTruthy();
    });

    test('debe rechazar creación si faltan campos obligatorios o el microchip está duplicado', async () => {
      await expect(petService.createPet({ nombre: 'SoloNombre' }, primaryOwner))
        .rejects.toThrow(ValidationError);

      await petService.createPet({
        nombre: 'Mascota1',
        especie: 'Felino',
        raza: 'Siamés',
        microchip: 'CHIP-UNICO-1'
      }, primaryOwner);

      await expect(petService.createPet({
        nombre: 'Mascota2',
        especie: 'Felino',
        raza: 'Persa',
        microchip: 'CHIP-UNICO-1'
      }, primaryOwner)).rejects.toThrow(ConflictError);
    });

    test('debe permitir acceso de lectura a dueños y personal clínico, y denegarlo a terceros', async () => {
      const pet = await petService.createPet({
        nombre: 'Rocky',
        especie: 'Canino',
        raza: 'Bulldog'
      }, primaryOwner);

      // Propietario principal puede leer
      const readByOwner = await petService.getPetById(pet.id, primaryOwner);
      expect(readByOwner.id).toBe(pet.id);

      // Veterinario puede leer
      const readByVet = await petService.getPetById(pet.id, vetUser);
      expect(readByVet.id).toBe(pet.id);

      // Usuario ajeno no puede leer
      await expect(petService.getPetById(pet.id, thirdUser))
        .rejects.toThrow(ForbiddenError);
    });
  });

  describe('Relación Multi-dueño y Transferencia de Titularidad', () => {
    let petId;

    beforeEach(async () => {
      const pet = await petService.createPet({
        nombre: 'Max',
        especie: 'Canino',
        raza: 'Labrador'
      }, primaryOwner);
      petId = pet.id;
    });

    test('debe permitir al propietario principal añadir y remover cotitulares', async () => {
      // Añadir cotitular
      const addRes = await petService.addCoOwner(petId, 'dueno2@test.com', primaryOwner);
      expect(addRes.success).toBe(true);

      // Cotitular ahora puede consultar la mascota
      const petConsultada = await petService.getPetById(petId, secondaryOwner);
      expect(petConsultada.id).toBe(petId);
      expect(petConsultada.duenos).toHaveLength(2);

      // No se puede añadir dos veces al mismo usuario
      await expect(petService.addCoOwner(petId, 'dueno2@test.com', primaryOwner))
        .rejects.toThrow(ConflictError);

      // Remover cotitular
      const remRes = await petService.removeCoOwner(petId, secondaryOwner.id, primaryOwner);
      expect(remRes.success).toBe(true);

      // Cotitular ya no puede consultar
      await expect(petService.getPetById(petId, secondaryOwner))
        .rejects.toThrow(ForbiddenError);
    });

    test('debe impedir que un cotitular gestione dueños o modifique la mascota', async () => {
      await petService.addCoOwner(petId, 'dueno2@test.com', primaryOwner);

      // Cotitular intenta añadir otro cotitular
      await expect(petService.addCoOwner(petId, 'ajeno@test.com', secondaryOwner))
        .rejects.toThrow(ForbiddenError);

      // Cotitular intenta transferir la titularidad
      await expect(petService.transferOwnership(petId, 'dueno2@test.com', 'motivo', secondaryOwner))
        .rejects.toThrow(ForbiddenError);

      // Cotitular intenta actualizar datos
      await expect(petService.updatePet(petId, { nombre: 'NuevoNombre' }, secondaryOwner))
        .rejects.toThrow(ForbiddenError);
    });

    test('debe ejecutar la transferencia de titularidad y registrar el historial legal inmutable', async () => {
      const transferRes = await petService.transferOwnership(
        petId,
        'dueno2@test.com',
        'Cambio de tutor por mudanza internacional',
        primaryOwner
      );

      expect(transferRes.success).toBe(true);

      // Verificar que el dueño secundario ahora es propietario principal
      const newAccess = await petService.checkUserPetAccess(petId, secondaryOwner);
      expect(newAccess.isPrimaryOwner).toBe(true);

      // El dueño anterior ahora es cotitular
      const oldAccess = await petService.checkUserPetAccess(petId, primaryOwner);
      expect(oldAccess.isPrimaryOwner).toBe(false);
      expect(oldAccess.canRead).toBe(true);

      // Verificar registro en historial_titularidad
      const logs = await db('historial_titularidad').where('mascota_id', petId);
      expect(logs).toHaveLength(1);
      expect(logs[0].usuario_anterior_id).toBe(primaryOwner.id);
      expect(logs[0].usuario_nuevo_id).toBe(secondaryOwner.id);
      expect(logs[0].motivo).toContain('mudanza');
    });
  });

  describe('Almacenamiento y Streaming de Fotografías BLOB', () => {
    let petId;

    beforeEach(async () => {
      const pet = await petService.createPet({
        nombre: 'Milo',
        especie: 'Felino',
        raza: 'Común Europeo'
      }, primaryOwner);
      petId = pet.id;
    });

    test('debe almacenar la fotografía en la tabla archivos_adjuntos como BLOB', async () => {
      const fileObj = {
        buffer: validJpegBuffer,
        mimeType: 'image/jpeg',
        originalName: 'milo_foto.jpg'
      };

      const res = await petService.uploadPetPhoto(petId, fileObj, primaryOwner);
      expect(res.success).toBe(true);
      expect(res.photoUrl).toBe(`/api/pets/${petId}/photo`);

      const photoInDb = await db('archivos_adjuntos')
        .where({ entidad_tipo: 'mascota_foto', entidad_id: petId })
        .first();

      expect(photoInDb).toBeDefined();
      expect(photoInDb.mime_type).toBe('image/jpeg');
      expect(photoInDb.tamano_bytes).toBe(validJpegBuffer.length);

      const retrieved = await petService.getPetPhotoBlob(petId);
      expect(retrieved.buffer).toEqual(validJpegBuffer);
    });

    test('debe reemplazar la fotografía existente al subir una nueva', async () => {
      const fileObj1 = { buffer: validJpegBuffer, mimeType: 'image/jpeg', originalName: 'foto1.jpg' };
      await petService.uploadPetPhoto(petId, fileObj1, primaryOwner);

      const fileObj2 = { buffer: validJpegBuffer, mimeType: 'image/jpeg', originalName: 'foto2.jpg' };
      const res = await petService.uploadPetPhoto(petId, fileObj2, primaryOwner);

      expect(res.success).toBe(true);

      const count = await db('archivos_adjuntos').where({ entidad_tipo: 'mascota_foto', entidad_id: petId }).count('id as cnt');
      expect(count[0].cnt).toBe(1);
    });

    test('debe rechazar archivos que no sean imágenes o estén corruptos', async () => {
      const fakeFile = {
        buffer: Buffer.from('archivo falso'),
        mimeType: 'image/jpeg',
        originalName: 'hack.jpg'
      };

      await expect(petService.uploadPetPhoto(petId, fakeFile, primaryOwner))
        .rejects.toThrow();

      // Archivo con tipo MIME PDF en lugar de imagen
      const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      await expect(petService.uploadPetPhoto(petId, {
        buffer: validPdfBuffer,
        mimeType: 'application/pdf',
        originalName: 'doc.pdf'
      }, primaryOwner)).rejects.toThrow(ValidationError);
    });

    test('debe lanzar NotFoundError al pedir foto de una mascota que no tiene', async () => {
      await expect(petService.getPetPhotoBlob(petId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Casos límite y validaciones adicionales', () => {
    test('Staff creando mascota con propietarioId válido e inválido', async () => {
      // Válido
      const pet = await petService.createPet({
        nombre: 'Bella',
        especie: 'Canino',
        raza: 'Poodle',
        propietarioId: primaryOwner.id
      }, vetUser);

      expect(pet.nombre).toBe('Bella');
      const rel = await db('usuarios_mascotas').where({ mascota_id: pet.id, usuario_id: primaryOwner.id }).first();
      expect(rel.es_propietario_principal).toBeTruthy();

      // Inválido
      await expect(petService.createPet({
        nombre: 'Error',
        especie: 'Canino',
        raza: 'Mix',
        propietarioId: 99999
      }, vetUser)).rejects.toThrow(NotFoundError);
    });

    test('Actualización de campos y conflictos de microchip', async () => {
      const pet = await petService.createPet({ nombre: 'Original', especie: 'Canino', raza: 'Beagle' }, primaryOwner);
      const _pet2 = await petService.createPet({ nombre: 'Otro', especie: 'Felino', raza: 'Común', microchip: 'CHIP-DUP-1' }, primaryOwner);

      // Actualizar todos los campos
      const updated = await petService.updatePet(pet.id, {
        nombre: 'Modificado',
        especie: 'Canino Actualizado',
        raza: 'Beagle Puro',
        fechaNacimiento: '2021-01-01',
        sexo: 'macho',
        color: 'Tricolor',
        esterilizado: true,
        microchip: 'CHIP-NUEVO-1',
        notas: 'Nuevas notas médicas'
      }, primaryOwner);

      expect(updated.nombre).toBe('Modificado');
      expect(updated.color).toBe('Tricolor');
      expect(updated.esterilizado).toBe(true);
      expect(updated.microchip).toBe('CHIP-NUEVO-1');

      // Intentar asignar microchip duplicado
      await expect(petService.updatePet(pet.id, { microchip: 'CHIP-DUP-1' }, primaryOwner))
        .rejects.toThrow(ConflictError);

      // Actualizar mascota inexistente
      await expect(petService.updatePet(99999, { nombre: 'Nada' }, vetUser))
        .rejects.toThrow(NotFoundError);
    });

    test('Errores en addCoOwner, removeCoOwner y transferOwnership', async () => {
      const pet = await petService.createPet({ nombre: 'Testy', especie: 'Ave', raza: 'Loro' }, primaryOwner);

      // addCoOwner usuario no existente
      await expect(petService.addCoOwner(pet.id, 'noexiste@correo.com', primaryOwner))
        .rejects.toThrow(NotFoundError);

      // removeCoOwner usuario que no es cotitular
      await expect(petService.removeCoOwner(pet.id, thirdUser.id, primaryOwner))
        .rejects.toThrow(NotFoundError);

      // removeCoOwner no puede remover al propietario principal
      await expect(petService.removeCoOwner(pet.id, primaryOwner.id, primaryOwner))
        .rejects.toThrow(ForbiddenError);

      // transferOwnership a usuario inexistente
      await expect(petService.transferOwnership(pet.id, 'fantasma@correo.com', 'motivo', primaryOwner))
        .rejects.toThrow(NotFoundError);

      // transferOwnership al mismo dueño principal
      await expect(petService.transferOwnership(pet.id, 'dueno1@test.com', 'motivo', primaryOwner))
        .rejects.toThrow(ConflictError);

      // transferOwnership a usuario que NO era cotitular previamente
      const directTransfer = await petService.transferOwnership(pet.id, 'ajeno@test.com', 'Regalo', primaryOwner);
      expect(directTransfer.success).toBe(true);
    });
  });
});
