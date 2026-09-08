const pdfService = require('../../src/core/pdf.service');

describe('PdfService - Generación de Documentos PDF en JavaScript Puro (cPanel Seguro)', () => {
  test('debe generar un buffer PDF válido para una receta médica con firma digital y alerta de alergias', async () => {
    const data = {
      folio: 'REC-TEST-001',
      fechaEmision: '2026-09-06',
      vigenciaDias: 30,
      veterinario: {
        nombre: 'Valeria',
        apellido: 'Méndez',
        cedulaProfesional: 'CED-12345678'
      },
      mascota: {
        nombre: 'Luna',
        especie: 'Canino',
        raza: 'Husky Siberiano',
        duenoNombre: 'Carlos Morales'
      },
      alergias: ['Penicilina', 'Sulfamidas'],
      items: [
        {
          nombreMedicamento: 'Amoxicilina + Ácido Clavulánico 250mg',
          dosis: '1 tableta',
          frecuencia: 'cada 12 horas',
          duracionDias: 7,
          cantidadPrescrita: 14,
          indicaciones: 'Administrar con comida para evitar malestar gástrico.'
        },
        {
          nombreMedicamento: 'Meloxicam 1mg',
          dosis: '0.5 tableta',
          frecuencia: 'cada 24 horas',
          duracionDias: 3,
          cantidadPrescrita: 2,
          indicaciones: 'Antiinflamatorio post-consulta.'
        }
      ],
      firmaHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const pdfBuffer = await pdfService.generatePrescriptionPdf(data);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verificar bytes mágicos de PDF (%PDF)
    const magicBytes = pdfBuffer.slice(0, 4).toString('ascii');
    expect(magicBytes).toBe('%PDF');
  });

  test('debe generar la receta correctamente cuando no hay alergias reportadas', async () => {
    const data = {
      folio: 'REC-TEST-002',
      fechaEmision: '2026-09-06',
      vigenciaDias: 15,
      veterinario: { nombre: 'Roberto', apellido: 'Gómez' },
      mascota: { nombre: 'Michi', especie: 'Felino', raza: 'Común' },
      alergias: [],
      items: [
        {
          nombreMedicamento: 'Desparasitante Felino',
          dosis: '1 pipeta',
          frecuencia: 'dosis única',
          duracionDias: 1,
          cantidadPrescrita: 1
        }
      ],
      firmaHash: 'hash123'
    };

    const pdfBuffer = await pdfService.generatePrescriptionPdf(data);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  test('debe generar un carnet de vacunación y expediente clínico oficial en PDF', async () => {
    const data = {
      mascota: {
        id: 1,
        nombre: 'Max',
        especie: 'Canino',
        raza: 'Golden Retriever',
        sexo: 'macho',
        color: 'Dorado',
        esterilizado: true,
        microchip: '982000123456789'
      },
      propietario: {
        nombre: 'Sofía',
        apellido: 'López',
        telefono: '+52 744 123 4567'
      },
      consultas: [
        {
          fecha_consulta: '2026-08-15',
          motivo_consulta: 'Revisión anual y esquema de vacunación',
          diagnostico: 'Paciente sano y en peso óptimo',
          tratamiento: 'Refuerzo de quíntuple y desparasitación'
        }
      ],
      vacunas: [
        {
          nombre_vacuna: 'Rabia Anual',
          lote: 'L-RAB-2026',
          fecha_aplicacion: '2026-08-15',
          fecha_proxima_dosis: '2027-08-15'
        }
      ],
      alergias: ['Polen', 'Cefalexina'],
      registrosPeso: [
        { peso_kg: 28.5, fecha_registro: '2026-08-15' }
      ]
    };

    const pdfBuffer = await pdfService.generateMedicalHistoryPdf(data);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  test('debe generar la plantilla imprimible de placa QR en PDF', async () => {
    const data = {
      mascota: {
        id: 10,
        nombre: 'Rocky',
        especie: 'Canino',
        raza: 'Bulldog Francés',
        microchip: 'CHIP-998877'
      },
      propietario: {
        nombre: 'Eduardo',
        telefono: '+52 744 555 6677'
      },
      contactoEmergencia: '+52 744 555 6677'
    };

    const pdfBuffer = await pdfService.generateQrTagPdf(data);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  test('debe generar el comprobante Click & Collect de pedido en PDF', async () => {
    const data = {
      pedido: {
        id: 5,
        folio: 'PED-20260907-001',
        total: 650.00,
        metodo_pago: 'spei',
        estado: 'listo_recoleccion',
        comprobante_interno_hash: 'abc123hash',
        creado_en: '2026-09-07T00:00:00.000Z'
      },
      items: [
        {
          nombre: 'NexGard Spectra 15-30kg',
          cantidad: 1,
          precio_unitario: 450.00,
          subtotal: 450.00
        },
        {
          nombre: 'Shampoo Hipoalergénico 250ml',
          cantidad: 1,
          precio_unitario: 200.00,
          subtotal: 200.00
        }
      ],
      cliente: {
        nombre: 'Laura',
        apellido: 'Martínez',
        email: 'laura@ejemplo.com'
      }
    };

    const pdfBuffer = await pdfService.generateOrderReceiptPdf(data);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.slice(0, 4).toString('ascii')).toBe('%PDF');
  });
});
