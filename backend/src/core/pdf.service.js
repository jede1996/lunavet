const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class PdfService {
  /**
   * Genera el documento PDF de una receta médica digital veterinaria usando JavaScript puro.
   */
  async generatePrescriptionPdf({
    folio,
    fechaEmision,
    vigenciaDias = 30,
    veterinario,
    mascota,
    alergias = [],
    items = [],
    firmaHash
  }) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Receta Médica - Folio ${folio}`,
          Author: `LunaVet - ${veterinario.nombre} ${veterinario.apellido}`,
          Subject: 'Receta Médica Digital Veterinaria'
        }
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Encabezado Institucional
      doc.rect(40, 40, 515, 60).fill('#1e293b'); // Pizarra oscura elegante
      doc.fillColor('#FFFFFF')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('CLÍNICA VETERINARIA LUNA-VET', 55, 52);
      
      doc.fontSize(10)
        .font('Helvetica')
        .text('Plataforma de Salud y Bienestar Animal · Acapulco, Gro. · lunavet.lat', 55, 76);

      // 2. Metadatos de la Receta
      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      doc.text(`Folio: ${folio}`, 40, 115, { align: 'left' });
      doc.text(`Fecha de Emisión: ${fechaEmision}`, 40, 130);
      doc.text(`Vigencia: ${vigenciaDias} días`, 40, 145);

      doc.text(`Médico Responsable: Dr(a). ${veterinario.nombre} ${veterinario.apellido}`, 300, 115, { align: 'right' });
      doc.text(`Cédula Profesional: ${veterinario.cedulaProfesional || 'En trámite'}`, 300, 130, { align: 'right' });

      // Línea divisoria
      doc.moveTo(40, 165).lineTo(555, 165).strokeColor('#E0E0E0').stroke();

      // 3. Datos del Paciente
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('DATOS DEL PACIENTE', 40, 175);
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`Paciente: ${mascota.nombre} (${mascota.especie} / ${mascota.raza})`, 40, 192);
      doc.text(`Propietario / Tutor: ${mascota.duenoNombre || 'Registrado en sistema'}`, 40, 207);

      // Alerta destacada de alergias consolidadas
      const alertaAlergias = alergias.length > 0 
        ? `ALERGIAS REPORTADAS: ${alergias.join(', ').toUpperCase()}`
        : 'SIN ALERGIAS CONOCIDAS REGISTRADAS';
      
      const alertaColor = alergias.length > 0 ? '#C0392B' : '#27AE60';
      doc.rect(40, 225, 515, 22).fill(alergias.length > 0 ? '#FDEDEC' : '#EAFAF1');
      doc.fillColor(alertaColor).font('Helvetica-Bold').fontSize(9)
        .text(alertaAlergias, 50, 231);

      // Línea divisoria
      doc.moveTo(40, 255).lineTo(555, 255).strokeColor('#E0E0E0').stroke();

      // 4. Prescripción de Medicamentos
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('INDICACIONES Y PRESCRIPCIÓN MÉDICA', 40, 265);

      let currentY = 285;
      doc.fontSize(9).font('Helvetica');

      items.forEach((item, index) => {
        doc.fillColor('#2C3E50').font('Helvetica-Bold')
          .text(`${index + 1}. ${item.nombreMedicamento} — Cantidad: ${item.cantidadPrescrita}`, 45, currentY);

        currentY += 14;
        doc.font('Helvetica').fillColor('#555555')
          .text(`   Dosis: ${item.dosis} | Frecuencia: ${item.frecuencia} | Duración: ${item.duracionDias} días`, 45, currentY);

        if (item.indicaciones) {
          currentY += 13;
          doc.font('Helvetica-Oblique').fillColor('#666666')
            .text(`   Indicaciones: ${item.indicaciones}`, 45, currentY);
        }

        currentY += 20;
      });

      // 5. Firma Digital y Trazabilidad Regulatoria
      const footerY = Math.max(currentY + 30, 680);
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#CCCCCC').stroke();

      doc.fontSize(8).font('Helvetica').fillColor('#777777');
      doc.text('Documento firmado electrónicamente conforme a los lineamientos de dispensación veterinaria.', 40, footerY + 8, { align: 'center' });
      doc.text(`Firma Digital (Hash SHA-256): ${firmaHash || 'NO_HASH'}`, 40, footerY + 20, { align: 'center' });
      doc.text('Verificable en app.lunavet.lat con el folio único de esta receta.', 40, footerY + 32, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Genera el expediente clínico y carnet oficial de vacunación de la mascota en PDF.
   */
  async generateMedicalHistoryPdf({
    mascota,
    propietario = {},
    consultas = [],
    vacunas = [],
    alergias = [],
    registrosPeso = []
  }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Carnet y Expediente Clínico - ${mascota.nombre}`,
            Author: 'Clínica Veterinaria Luna-Vet',
            Subject: 'Expediente Clínico Veterinario Oficial'
          }
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // 1. Encabezado Oficial
        doc.rect(40, 40, 515, 65).fill('#0f172a');
        doc.fillColor('#38bdf8')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('CLÍNICA VETERINARIA LUNA-VET', 55, 52);

        doc.fillColor('#cbd5e1')
          .fontSize(9)
          .font('Helvetica')
          .text('CARNET DE SALUD Y EXPEDIENTE CLÍNICO OFICIAL', 55, 74)
          .text('Av. Peña Blanca Etapa 38, Coloso, Acapulco · Tel: +52 744 213 0868', 55, 87);

        // 2. Ficha de la Mascota y Propietario
        let y = 120;
        doc.roundedRect(40, y, 515, 90, 6).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text('DATOS DE IDENTIFICACIÓN', 55, y + 10);

        doc.font('Helvetica').fontSize(9).fillColor('#334155');
        doc.text(`Paciente: ${mascota.nombre}`, 55, y + 28);
        doc.text(`Especie / Raza: ${mascota.especie} · ${mascota.raza}`, 55, y + 42);
        doc.text(`Sexo: ${mascota.sexo === 'macho' ? 'Macho' : mascota.sexo === 'hembra' ? 'Hembra' : 'No especificado'}`, 55, y + 56);
        doc.text(`Esterilizado: ${mascota.esterilizado ? 'Sí' : 'No'}`, 55, y + 70);

        doc.text(`Microchip: ${mascota.microchip || 'No asignado'}`, 310, y + 28);
        doc.text(`Color: ${mascota.color || 'No registrado'}`, 310, y + 42);
        doc.text(`Tutor / Propietario: ${propietario.nombre || ''} ${propietario.apellido || ''}`, 310, y + 56);
        doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-MX')}`, 310, y + 70);

        // Alerta de Alergias
        y += 100;
        const alertaText = alergias.length > 0
          ? `ALERGIAS IDENTIFICADAS: ${alergias.map(a => typeof a === 'string' ? a : a.sustancia).join(', ').toUpperCase()}`
          : 'SIN ALERGIAS CONOCIDAS REGISTRADAS';
        const isAlert = alergias.length > 0;
        doc.rect(40, y, 515, 20).fill(isAlert ? '#fee2e2' : '#f0fdf4');
        doc.fillColor(isAlert ? '#991b1b' : '#166534').font('Helvetica-Bold').fontSize(9).text(alertaText, 55, y + 6);

        // 3. Carnet de Vacunación
        y += 32;
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text('REGISTRO DE VACUNACIÓN', 40, y);
        y += 16;

        // Tabla cabecera
        doc.rect(40, y, 515, 18).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8);
        doc.text('VACUNA / BIOLÓGICO', 48, y + 5);
        doc.text('LOTE', 210, y + 5);
        doc.text('FECHA APLICACIÓN', 300, y + 5);
        doc.text('PRÓXIMA DOSIS', 420, y + 5);
        y += 18;

        if (vacunas.length === 0) {
          doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8).text('No hay registros de vacunas asentadas.', 48, y + 6);
          y += 20;
        } else {
          vacunas.slice(0, 6).forEach(v => {
            doc.fillColor('#334155').font('Helvetica').fontSize(8);
            doc.text(v.nombre_vacuna || v.nombreVacuna || 'Vacuna', 48, y + 5);
            doc.text(v.lote || 'N/A', 210, y + 5);
            doc.text(v.fecha_aplicacion ? new Date(v.fecha_aplicacion).toLocaleDateString('es-MX') : 'N/A', 300, y + 5);
            doc.text(v.fecha_proxima_dosis ? new Date(v.fecha_proxima_dosis).toLocaleDateString('es-MX') : 'Refuerzo anual', 420, y + 5);
            doc.moveTo(40, y + 17).lineTo(555, y + 17).strokeColor('#f1f5f9').stroke();
            y += 18;
          });
        }

        // 4. Historial de Consultas Recientes
        y += 15;
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text('HISTORIAL CLÍNICO Y CONSULTAS', 40, y);
        y += 16;

        if (consultas.length === 0) {
          doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8).text('Sin consultas previas registradas en el expediente digital.', 40, y);
          y += 20;
        } else {
          consultas.slice(0, 4).forEach((c, idx) => {
            doc.rect(40, y, 515, 45).fill('#f8fafc');
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
            const fechaStr = c.fecha_consulta ? new Date(c.fecha_consulta).toLocaleDateString('es-MX') : 'Consulta';
            doc.text(`Consulta #${idx + 1} (${fechaStr}) — Motivo: ${c.motivo_consulta || 'Revisión'}`, 48, y + 6);
            
            doc.fillColor('#475569').font('Helvetica').fontSize(8);
            doc.text(`Diagnóstico: ${c.diagnostico || 'Evaluado en clínica'}`, 48, y + 18, { width: 490, height: 12 });
            doc.text(`Tratamiento: ${c.tratamiento || 'Indicaciones médicas asentadas'}`, 48, y + 30, { width: 490, height: 12 });
            y += 50;
          });
        }

        // 5. Historial de Peso
        if (registrosPeso.length > 0 && y < 700) {
          y += 10;
          doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('EVOLUCIÓN DE PESO', 40, y);
          y += 14;
          const ultimosPesos = registrosPeso.slice(0, 5).map(p => `${p.peso_kg} kg (${new Date(p.fecha_registro).toLocaleDateString('es-MX')})`).join('  ·  ');
          doc.fillColor('#334155').font('Helvetica').fontSize(8).text(ultimosPesos, 40, y);
          y += 15;
        }

        // Footer
        doc.moveTo(40, 780).lineTo(555, 780).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(7);
        doc.text('Documento expedido por el Sistema Integral Luna-Vet Acapulco. Válido como carnet oficial de salud veterinaria.', 40, 786, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Genera plantilla imprimible para Placa / Medalla de Identificación QR.
   */
  async generateQrTagPdf({
    mascota,
    propietario = {},
    qrPayload = null,
    contactoEmergencia = '+52 744 213 0868'
  }) {
    const qrText = qrPayload || `https://lunavet.lat/qr?mascota=${encodeURIComponent(mascota.nombre)}&id=${mascota.id}`;
    const qrBuffer = await QRCode.toBuffer(qrText, {
      width: 300,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
          info: {
            Title: `Placa QR Imprimible - ${mascota.nombre}`,
            Author: 'Clínica Veterinaria Luna-Vet'
          }
        });

        const buffers = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', err => reject(err));

        // Encabezado Guía de Impresión
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16)
          .text('PLANTILLA IMPRIMIBLE DE IDENTIFICACIÓN QR', 40, 40, { align: 'center' });
        doc.fillColor('#64748b').font('Helvetica').fontSize(9)
          .text('Recorta por la línea punteada para plastificar o adherir al collar / placa de tu mascota.', 40, 62, { align: 'center' });

        // Tarjeta Placa Imprimible (Medida estándar placa / credencial collar)
        const startX = 140;
        const startY = 100;
        const cardW = 315;
        const cardH = 430;

        // Marco recortable exterior punteado
        doc.roundedRect(startX, startY, cardW, cardH, 16)
          .dash(4, { space: 3 })
          .strokeColor('#94a3b8')
          .stroke();
        doc.undash();

        // Cabecera de la Placa
        doc.roundedRect(startX + 6, startY + 6, cardW - 12, 64, 12).fill('#0f172a');
        doc.fillColor('#f8fafc').font('Helvetica-Bold').fontSize(16)
          .text(`🐾 ${mascota.nombre.toUpperCase()}`, startX + 16, startY + 20, { align: 'center', width: cardW - 32 });
        doc.fillColor('#38bdf8').font('Helvetica').fontSize(9)
          .text(`${mascota.especie} · ${mascota.raza || 'Compañero Animal'}`, startX + 16, startY + 44, { align: 'center', width: cardW - 32 });

        // Contenedor QR
        const qrSize = 180;
        const qrX = startX + (cardW - qrSize) / 2;
        const qrY = startY + 84;
        doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).fill('#f8fafc');
        doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8).strokeColor('#e2e8f0').stroke();
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

        // Leyenda Escaneo
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11)
          .text('¡ESCÁNAME SI ME ENCUENTRAS!', startX + 16, qrY + qrSize + 16, { align: 'center', width: cardW - 32 });

        // Datos de Contacto de Emergencia
        const phone = contactoEmergencia || propietario.telefono || '+52 744 213 0868';
        doc.roundedRect(startX + 20, qrY + qrSize + 36, cardW - 40, 50, 8).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica').fontSize(8)
          .text('Contacto Urgente con Dueño o Clínica:', startX + 26, qrY + qrSize + 44, { align: 'center', width: cardW - 52 });
        doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(13)
          .text(`📞 ${phone}`, startX + 26, qrY + qrSize + 60, { align: 'center', width: cardW - 52 });

        // Microchip y Folio
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
          .text(`Microchip: ${mascota.microchip || 'N/A'} · ID Luna-Vet: #${mascota.id}`, startX + 16, startY + cardH - 24, { align: 'center', width: cardW - 32 });

        // Instrucciones abajo
        doc.fillColor('#64748b').font('Helvetica').fontSize(8)
          .text('Consejo: Para mayor durabilidad contra el agua y sol de Acapulco, coloca cinta transparente o lamina la placa antes de fijarla al collar.', 60, 560, { align: 'center', width: 475 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Genera el recibo o comprobante de compra Click & Collect de farmacia en PDF.
   */
  async generateOrderReceiptPdf({
    pedido,
    items = [],
    cliente = {}
  }) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Comprobante de Compra - ${pedido.folio}`,
          Author: 'Farmacia Luna-Vet Acapulco'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // Encabezado
      doc.rect(40, 40, 515, 60).fill('#047857'); // Verde esmeralda farmacia
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('LUNA-VET · FARMACIA & TIENDA', 55, 52);
      doc.fontSize(9).font('Helvetica').text('Comprobante Oficial de Pedido Click & Collect · Acapulco, Gro.', 55, 76);

      // Metadatos
      let y = 120;
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10);
      doc.text(`Folio de Pedido: ${pedido.folio}`, 40, y);
      doc.text(`Fecha: ${new Date(pedido.creado_en || Date.now()).toLocaleString('es-MX')}`, 40, y + 14);
      doc.text(`Método de Pago: ${(pedido.metodo_pago || 'SPEI').toUpperCase()}`, 40, y + 28);
      doc.text(`Estado: ${(pedido.estado || 'listo_recoleccion').toUpperCase()}`, 40, y + 42);

      doc.text(`Cliente: ${cliente.nombre || ''} ${cliente.apellido || ''}`, 300, y, { align: 'right' });
      doc.text(`Email: ${cliente.email || 'Registrado'}`, 300, y + 14, { align: 'right' });
      doc.text('Entrega: Mostrador Clínica El Coloso', 300, y + 28, { align: 'right' });

      y += 70;
      // Tabla de productos
      doc.rect(40, y, 515, 18).fill('#f1f5f9');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
      doc.text('PRODUCTO / MEDICAMENTO', 48, y + 5);
      doc.text('CANTIDAD', 280, y + 5);
      doc.text('P. UNITARIO', 360, y + 5);
      doc.text('TOTAL', 470, y + 5);
      y += 18;

      items.forEach(it => {
        doc.fillColor('#334155').font('Helvetica').fontSize(8);
        doc.text(it.nombre || it.nombre_medicamento || 'Producto Veterinario', 48, y + 5);
        doc.text(String(it.cantidad || 1), 295, y + 5);
        doc.text(`$${Number(it.precio_unitario || 0).toFixed(2)}`, 365, y + 5);
        doc.text(`$${Number(it.subtotal || 0).toFixed(2)}`, 475, y + 5);
        doc.moveTo(40, y + 17).lineTo(555, y + 17).strokeColor('#f1f5f9').stroke();
        y += 18;
      });

      // Total
      y += 10;
      doc.rect(340, y, 215, 30).fill('#f8fafc');
      doc.roundedRect(340, y, 215, 30, 4).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12)
        .text(`TOTAL PAGADO: $${Number(pedido.total || 0).toFixed(2)} MXN`, 350, y + 9);

      // Indicaciones Click & Collect
      y += 60;
      doc.roundedRect(40, y, 515, 60, 6).fill('#ecfdf5');
      doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(9)
        .text('INSTRUCCIONES PARA RECOLECCIÓN EN CLÍNICA:', 55, y + 10);
      doc.font('Helvetica').fontSize(8)
        .text('Presenta este comprobante (impreso o digital) y una identificación oficial en Av. Peña Blanca Etapa 38, Coloso.', 55, y + 26)
        .text('Horario de farmacia: Lunes a Sábado de 09:00 a 20:00 hrs. En medicamentos controlados, presenta tu receta original.', 55, y + 40);

      // Hash de seguridad
      y += 85;
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(7);
      doc.text(`Hash Criptográfico de Auditoría: ${pedido.comprobante_interno_hash || 'SHA256_HASH'}`, 40, y, { align: 'center' });

      doc.end();
    });
  }
}

module.exports = new PdfService();
module.exports.PdfService = PdfService;
