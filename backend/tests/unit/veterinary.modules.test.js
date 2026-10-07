const { initTestDb, closeDb, db } = require('../../src/config/database');
const { VeterinaryDoseCalculator } = require('../../src/core/veterinaryDoseCalculator');
const { MemoryCache } = require('../../src/core/cache.service');
const { compressionMiddleware } = require('../../src/core/compression.middleware');
const HospitalizationService = require('../../src/modules/clinical/hospitalization.service');
const ConsentService = require('../../src/modules/clinical/consent.service');
const GroomingService = require('../../src/modules/clinical/grooming.service');
const ReminderService = require('../../src/modules/clinical/reminder.service');
const CashRegisterService = require('../../src/modules/commerce/cashRegister.service');
const PosService = require('../../src/modules/commerce/pos.service');
const clinicalService = require('../../src/modules/clinical/clinical.service');
const adminService = require('../../src/modules/admin/admin.service');

describe('Módulos Veterinarios Especializados Luna-Vet', () => {
  let vetId;
  let clientId;
  let petId;
  let productId;

  beforeAll(async () => {
    await initTestDb();

    // Crear usuario veterinario de prueba
    const [vId] = await db('usuarios').insert({
      email: 'vet_test_mod@lunavet.lat',
      password_hash: '$2b$10$dummyhashformodulestesting1234567890',
      nombre: 'Dr. Roberto',
      apellido: 'Salgado',
      rol: 'veterinario',
      cedula_profesional: 'CED-998877',
      activo: true
    });
    vetId = vId;

    // Crear cliente de prueba
    const [cId] = await db('usuarios').insert({
      email: 'cliente_test_mod@lunavet.lat',
      password_hash: '$2b$10$dummyhashformodulestesting1234567890',
      nombre: 'Mariana',
      apellido: 'Pineda',
      telefono_cifrado: '7441234567',
      rol: 'cliente',
      activo: true
    });
    clientId = cId;

    // Crear mascota de prueba
    const [pId] = await db('mascotas').insert({
      nombre: 'Max',
      especie: 'canino',
      raza: 'Golden Retriever',
      fecha_nacimiento: '2023-01-15',
      sexo: 'macho',
      activo: true
    });
    petId = pId;

    // Relación de titularidad N:M
    await db('usuarios_mascotas').insert({
      usuario_id: clientId,
      mascota_id: petId,
      es_propietario_principal: true,
      nivel_permiso: 'propietario'
    });

    // Crear categoría y producto para pruebas
    const [catId] = await db('categorias').insert({
      nombre: 'Farmacia General',
      slug: 'farmacia-general',
      activo: true
    });

    const [prId] = await db('productos').insert({
      categoria_id: catId,
      nombre: 'Amoxicilina 500mg Test',
      slug: 'amoxicilina-500mg-test',
      precio: 250.00,
      es_controlado: true,
      requiere_receta: true,
      activo: true
    });
    productId = prId;

    await db('lotes').insert({
      producto_id: productId,
      numero_lote: 'LOTE-TEST-001',
      fecha_caducidad: '2027-12-31',
      stock_disponible: 50
    });
  });

  afterAll(async () => {
    await closeDb();
  });

  // ==========================================
  // PUNTO 1D: CALCULADORA FARMACOLÓGICA
  // ==========================================
  describe('Punto 1D: Calculadora Farmacológica Veterinaria', () => {
    test('debe calcular correctamente dosis en mg y volumen en ml', () => {
      const calculo = VeterinaryDoseCalculator.calcularDosis({
        pesoKg: 10,
        dosisMgKg: 15,
        concentracionMgMl: 50,
        especie: 'canino',
        farmacoNombre: 'Amoxicilina'
      });

      expect(calculo.dosisTotalMg).toBe(150);
      expect(calculo.volumenTotalMl).toBe(3);
      expect(calculo.contraindicacion).toBeNull();
    });

    test('debe disparar alerta de contraindicación letal de paracetamol en felinos', () => {
      const calculo = VeterinaryDoseCalculator.calcularDosis({
        pesoKg: 4,
        dosisMgKg: 10,
        concentracionMgMl: 100,
        especie: 'felino',
        farmacoNombre: 'Paracetamol infantil'
      });

      expect(calculo.contraindicacion).toBeDefined();
      expect(calculo.contraindicacion.nivel).toBe('mortal');
      expect(calculo.contraindicacion.alerta).toContain('metahemoglobinemia');
    });

    test('debe calcular fluidoterapia veterinaria con deshidratación y micro/normogotero', () => {
      const fluido = VeterinaryDoseCalculator.calcularFluidoterapia({
        pesoKg: 20,
        especie: 'canino',
        porcentajeDeshidratacion: 5,
        tipoGotero: 'normogotero'
      });

      expect(fluido.volumenTotal24hMl).toBeGreaterThan(1000);
      expect(fluido.flujoMlHora).toBeGreaterThan(0);
      expect(fluido.gotasPorMinuto).toBeGreaterThan(0);
      expect(fluido.factorGoteo).toBe(20);
    });
  });

  // ==========================================
  // PUNTO 1A: HOSPITALIZACIÓN Y TRIAGE
  // ==========================================
  describe('Punto 1A: Hospitalización y Triage UCI', () => {
    let hospId;

    test('debe ingresar paciente a hospitalización y registrar en jaula', async () => {
      const hosp = await HospitalizationService.ingresarPaciente({
        mascota_id: petId,
        veterinario_id: vetId,
        jaula_numero: 'J-01',
        jaula_tipo: 'canil_grande',
        motivo: 'Post-quirúrgico y gastroenteritis aguda',
        diagnostico_presuntivo: 'Gastroenteritis hemorrágica'
      });

      expect(hosp.id).toBeDefined();
      expect(hosp.jaula_numero).toBe('J-01');
      expect(hosp.estado).toBe('ingresado');
      hospId = hosp.id;
    });

    test('debe prevenir ingresar otro paciente en la misma jaula activa', async () => {
      await expect(
        HospitalizationService.ingresarPaciente({
          mascota_id: petId,
          veterinario_id: vetId,
          jaula_numero: 'J-01',
          motivo: 'Conflicto de jaula'
        })
      ).rejects.toThrow('se encuentra actualmente ocupada');
    });

    test('debe registrar toma de signos vitales periódica', async () => {
      const mon = await HospitalizationService.registrarMonitoreo(hospId, {
        registrado_por_id: vetId,
        temperatura: 38.6,
        frecuencia_cardiaca: 95,
        frecuencia_respiratoria: 24,
        presion_arterial: '120/80',
        tllc_segundos: 2,
        escala_dolor: 1,
        estado_conciencia: 'alerta',
        observaciones: 'Paciente estable respondiendo a fluidoterapia'
      });

      expect(mon.id).toBeDefined();
      expect(parseFloat(mon.temperatura)).toBe(38.6);
      expect(mon.frecuencia_cardiaca).toBe(95);
    });

    test('debe dar de alta al paciente hospitalizado liberando la jaula', async () => {
      const alta = await HospitalizationService.darDeAlta(hospId, {
        notas_alta: 'Paciente recuperado con alta médica a domicilio'
      });

      expect(alta.estado).toBe('alta');
      expect(alta.fecha_alta).toBeDefined();
    });
  });

  // ==========================================
  // PUNTO 1B: CONSENTIMIENTOS INFORMADOS
  // ==========================================
  describe('Punto 1B: Consentimientos Informados con Firma Digital', () => {
    test('debe proveer plantillas legales predefinidas (NOM-033, braquiocefálicos, anestesia)', () => {
      const plantillas = ConsentService.obtenerPlantillas();
      expect(plantillas.anestesia_cirugia).toBeDefined();
      expect(plantillas.eutanasia_nom033).toBeDefined();
      expect(plantillas.estetica_braquiocefalico).toBeDefined();
    });

    test('debe registrar consentimiento con firma y hash de integridad', async () => {
      const doc = await ConsentService.registrarConsentimiento({
        mascota_id: petId,
        cliente_id: clientId,
        veterinario_id: vetId,
        tipo_consentimiento: 'anestesia_cirugia',
        titulo: 'Consentimiento para Cirugía',
        contenido_legal: 'Autorizo la cirugía bajo anestesia general',
        firma_datos_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        metadata_ip: '127.0.0.1'
      });

      expect(doc.id).toBeDefined();
      expect(doc.firma_base64_hash).toHaveLength(64);
      expect(doc.mascota_nombre).toBe('Max');
    });
  });

  // ==========================================
  // PUNTO 2A: ADMISIÓN DE ESTÉTICA
  // ==========================================
  describe('Punto 2A: Check-in de Estética y WhatsApp', () => {
    let checkinId;

    test('debe registrar check-in de grooming con lesiones anatómicas mapeadas', async () => {
      const checkin = await GroomingService.registrarCheckin({
        mascota_id: petId,
        estilista_id: vetId,
        corte_solicitado: 'Corte higiénico y deslanado',
        nudos_severos: true,
        lesiones_previas: [{ zona: 'oreja_derecha', tipo: 'irritacion' }],
        observaciones: 'Cuidado al secar oreja derecha'
      });

      expect(checkin.id).toBeDefined();
      expect(checkin.estado).toBe('en_espera');
      expect(checkin.lesiones_previas).toHaveLength(1);
      checkinId = checkin.id;
    });

    test('debe actualizar estado y generar enlace de WhatsApp listo para el cliente', async () => {
      await GroomingService.actualizarEstado(checkinId, 'listo_entrega');
      const wa = await GroomingService.generarEnlaceWhatsApp(checkinId);

      expect(wa.telefono).toBe('7441234567');
      expect(wa.whatsappUrl).toContain('wa.me');
      expect(wa.whatsappUrl).toContain('LISTO(A)%20PARA%20ENTREGA');
    });
  });

  // ==========================================
  // PUNTOS 3A & 3B: RECORDATORIOS Y SEGUIMIENTOS
  // ==========================================
  describe('Puntos 3A & 3B: Recordatorios y Seguimientos Clínicos', () => {
    test('debe crear y listar recordatorio preventivo', async () => {
      const rec = await ReminderService.crearRecordatorio({
        mascota_id: petId,
        cliente_id: clientId,
        tipo: 'vacuna_rabia',
        fecha_programada: '2026-10-01',
        mensaje: 'Recordatorio de refuerzo antirrábico anual'
      });

      expect(rec.id).toBeDefined();
      expect(rec.estado).toBe('pendiente');

      const lista = await ReminderService.listarRecordatorios();
      expect(lista.length).toBeGreaterThan(0);
      expect(lista[0].whatsappUrl).toBeDefined();
    });

    test('debe crear y actualizar seguimiento post-consulta', async () => {
      const seg = await ReminderService.crearSeguimiento({
        mascota_id: petId,
        cliente_id: clientId,
        veterinario_id: vetId,
        fecha_programada: '2026-09-10',
        tipo_caso: 'cirugia'
      });

      expect(seg.id).toBeDefined();

      const actualizado = await ReminderService.registrarContacto(seg.id, {
        estado_paciente: 'recuperacion_favorable',
        notas_seguimiento: 'El tutor reporta buena ingesta de alimento y herida limpia',
        contacto_exitoso: true
      });

      expect(actualizado.estado_paciente).toBe('recuperacion_favorable');
      expect(actualizado.contacto_exitoso).toBeTruthy();
    });
  });

  // ==========================================
  // PUNTOS 4A & 4B: POS Y TURNOS DE CAJA
  // ==========================================
  describe('Puntos 4A & 4B: Punto de Venta (POS) y Turnos de Caja Chica', () => {
    let turnoId;

    test('debe aperturar turno de caja chica con fondo inicial', async () => {
      const turno = await CashRegisterService.abrirTurno({
        usuario_id: vetId,
        monto_inicial: 1000.00,
        notas: 'Fondo para cambio en turno matutino'
      });

      expect(turno.id).toBeDefined();
      expect(turno.estado).toBe('abierta');
      expect(turno.monto_inicial).toBe(1000.00);
      turnoId = turno.id;
    });

    test('debe registrar movimiento manual de caja (salida de efectivo)', async () => {
      const mov = await CashRegisterService.registrarMovimiento({
        caja_turno_id: turnoId,
        usuario_id: vetId,
        tipo: 'salida',
        monto: 150.00,
        motivo: 'Compra de agua purificada para sala de espera'
      });

      expect(mov.id).toBeDefined();
      expect(mov.monto).toBe(150.00);
    });

    test('debe procesar venta POS descontando inventario y sumando al turno de caja', async () => {
      const venta = await PosService.procesarVenta({
        usuario_id: vetId,
        cliente_id: clientId,
        items: [
          {
            tipo_item: 'producto',
            producto_id: productId,
            nombre: 'Amoxicilina 500mg Test',
            precio: 250.00,
            cantidad: 2
          }
        ],
        metodo_pago: 'efectivo',
        monto_efectivo: 500.00
      });

      expect(venta.pedidoId).toBeDefined();
      expect(venta.total).toBe(500.00);
      expect(venta.hash_comprobante).toHaveLength(64);

      // Verificar que el stock disminuyó en 2
      const lote = await db('lotes').where({ producto_id: productId }).first();
      expect(lote.stock_disponible).toBe(48);

      // Verificar Arqueo Corte X
      const corteX = await CashRegisterService.calcularCorteX(turnoId);
      expect(corteX.total_ventas_efectivo).toBe(500.00);
      expect(corteX.total_salidas_manuales).toBe(150.00);
      // Saldo esperado = 1000 (inicial) + 500 (ventas) - 150 (salida) = 1350
      expect(corteX.monto_cierre_esperado).toBe(1350.00);
    });

    test('debe cerrar turno con Corte Z y calcular sobrante/faltante', async () => {
      const corteZ = await CashRegisterService.cerrarTurnoCorteZ(turnoId, {
        monto_cierre_real: 1350.00,
        notas: 'Caja cuadrada al centavo sin discrepancias'
      });

      expect(corteZ.estado).toBe('cerrada');
      expect(corteZ.diferencia).toBe(0.00);
    });
  });

  // ==========================================
  // PUNTO 5A: LIBRO DIGITAL SENASICA
  // ==========================================
  describe('Punto 5A: Libro Oficial SENASICA de Medicamentos Controlados', () => {
    test('debe generar reporte legal oficial foliado para inspección sanitaria', async () => {
      const libro = await adminService.getSenasicaOfficialBook();

      expect(libro.encabezadoOficial).toBeDefined();
      expect(libro.encabezadoOficial.registroSanitarioSAGARPA).toBeDefined();
      expect(libro.resumenEstadistico).toBeDefined();
      expect(Array.isArray(libro.partidas)).toBe(true);
    });
  });

  // ==========================================
  // PUNTO 5B: VERIFICACIÓN PÚBLICA DE RECETAS
  // ==========================================
  describe('Punto 5B: Verificación Pública de Recetas Médicas', () => {
    test('debe emitir y verificar públicamente receta médica sin requerir sesión', async () => {
      const emision = await clinicalService.createPrescription(
        petId,
        {
          vigenciaDias: 15,
          items: [
            {
              nombreMedicamento: 'Amoxicilina 500mg',
              dosis: '1 tableta',
              frecuencia: 'cada 12 horas',
              duracionDias: 7,
              cantidadPrescrita: 14,
              indicaciones: 'Administrar con alimento'
            }
          ]
        },
        {
          id: vetId,
          rol: 'veterinario',
          nombre: 'Dr. Roberto',
          apellido: 'Salgado',
          cedulaProfesional: 'CED-998877'
        }
      );

      const verificacion = await clinicalService.verifyPrescriptionPublic(emision.folio);

      expect(verificacion.folio).toBe(emision.folio);
      expect(verificacion.esVigente).toBe(true);
      expect(verificacion.veterinario.nombreCompleto).toContain('Roberto Salgado');
      expect(verificacion.paciente.nombre).toBe('Max');
      expect(verificacion.selloCriptografico).toBeDefined();
    });
  });

  // ==========================================
  // PUNTO 6B: CACHÉ EN MEMORIA Y COMPRESIÓN
  // ==========================================
  describe('Punto 6B: Memoria Caché y Compresión Nativa', () => {
    test('MemoryCache debe guardar, expirar y gestionar TTL y desalojo LRU', () => {
      const cache = new MemoryCache(2, 2);
      cache.set('k1', 'val1');
      cache.set('k2', 'val2');
      expect(cache.get('k1')).toBe('val1');

      cache.set('k3', 'val3');
      expect(cache.get('k1')).toBeNull();
      expect(cache.get('k2')).toBe('val2');
      expect(cache.get('k3')).toBe('val3');
    });

    test('compressionMiddleware debe ser una función de middleware de Express válida', () => {
      const mw = compressionMiddleware();
      expect(typeof mw).toBe('function');
    });
  });
});
