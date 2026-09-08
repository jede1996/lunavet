import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useBrand } from '../../contexts/BrandContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api.client';

export function QRGenerator({ initialMode = 'mascota', initialData = {}, onDone = null }) {
  const { brand } = useBrand();
  const { isDark } = useTheme();

  // Tipo de contenido
  const [contentType, setContentType] = useState(initialMode); // 'mascota' | 'whatsapp' | 'cita' | 'ubicacion' | 'wifi' | 'url'

  // Datos para Mascota / Placa
  const [petName, setPetName] = useState(initialData.petName || 'Luna');
  const [petSpecies, setPetSpecies] = useState(initialData.petSpecies || 'Perro');
  const [petBreed, setPetBreed] = useState(initialData.petBreed || 'Mestizo');
  const [ownerName, setOwnerName] = useState(initialData.ownerName || 'Familia García');
  const [emergencyPhone, setEmergencyPhone] = useState(initialData.emergencyPhone || '7442130868');
  const [petNotes, setPetNotes] = useState(initialData.petNotes || '¡Hola! Estoy perdido. Por favor llama a mi familia.');

  // Datos para WhatsApp
  const [waPhone, setWaPhone] = useState(brand.whatsapp || '7442130868');
  const [waMessage, setWaMessage] = useState('Hola Luna-Vet, deseo solicitar información o agendar una consulta.');

  // Datos para Citas
  const [appointmentUrl, setAppointmentUrl] = useState(window.location.origin + '/citas');

  // Datos para Ubicación
  const [locationUrl, setLocationUrl] = useState('https://maps.google.com/?q=Av.+Peña+Blanca+Etapa+38+El+Coloso+Acapulco');

  // Datos para Wi-Fi
  const [wifiSsid, setWifiSsid] = useState('LunaVet-Clientes');
  const [wifiPassword, setWifiPassword] = useState('MascotasFelices2026');
  const [wifiType, setWifiType] = useState('WPA');

  // Datos para URL / Texto Libre
  const [customText, setCustomText] = useState(window.location.origin);

  // Opciones de Personalización Visual
  const [fgColor, setFgColor] = useState('#0284c7'); // Azul Luna-Vet
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerLogo, setCenterLogo] = useState('luna-vet'); // 'luna-vet' | 'huella' | 'cruz' | 'corazon' | 'custom' | 'none'
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [frameTemplate, setFrameTemplate] = useState(initialMode === 'mascota' ? 'placa' : 'clinica'); // 'none' | 'placa' | 'clinica' | 'poster'
  const [qrSize, setQrSize] = useState(320);
  const [eccLevel, setEccLevel] = useState('H'); // High para soportar logo central

  // Estado de descarga / copia
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Referencias a elementos Canvas
  const qrCanvasRef = useRef(null);
  const compositeCanvasRef = useRef(null);

  // Paletas de color recomendadas
  const COLOR_PALETTES = [
    { name: 'Azul Luna-Vet', hex: '#0284c7' },
    { name: 'Morado Real', hex: '#7c3aed' },
    { name: 'Verde Esmeralda', hex: '#059669' },
    { name: 'Carmesí Alerta', hex: '#e11d48' },
    { name: 'Naranja Cálido', hex: '#ea580c' },
    { name: 'Negro Clásico', hex: '#0f172a' }
  ];

  // Calcular el contenido exacto del QR según el tipo seleccionado
  const computeQrPayload = () => {
    switch (contentType) {
      case 'mascota': {
        const cleanPhone = emergencyPhone.replace(/\D/g, '');
        // Genera enlace directo a WhatsApp con datos de auxilio para escaneo rápido con cualquier smartphone
        const msg = encodeURIComponent(
          `¡Hola! Encontré a tu mascota ${petName} (${petSpecies} - ${petBreed}). Su placa de identificación indica este número.`
        );
        return `https://wa.me/52${cleanPhone || '7442130868'}?text=${msg}`;
      }
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/\D/g, '');
        const msg = encodeURIComponent(waMessage);
        return `https://wa.me/52${cleanPhone || '7442130868'}?text=${msg}`;
      }
      case 'cita':
        return appointmentUrl;
      case 'ubicacion':
        return locationUrl;
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPassword};;`;
      case 'url':
      default:
        return customText || window.location.origin;
    }
  };

  // Generar el código QR base y dibujar sobre el canvas compuesto
  useEffect(() => {
    let isMounted = true;

    async function generateQR() {
      try {
        const payload = computeQrPayload();
        if (!payload) return;

        // 1. Renderizar QR base en canvas interno
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, payload, {
          width: qrSize,
          margin: 2,
          errorCorrectionLevel: eccLevel,
          color: {
            dark: fgColor,
            light: bgColor
          }
        });

        if (!isMounted) return;

        // 2. Preparar el canvas de destino visible
        const targetCanvas = qrCanvasRef.current;
        if (!targetCanvas) return;

        // Determinar dimensiones según la plantilla de marco
        let targetWidth = qrSize;
        let targetHeight = qrSize;

        if (frameTemplate === 'placa') {
          targetWidth = qrSize + 60;
          targetHeight = qrSize + 160;
        } else if (frameTemplate === 'clinica') {
          targetWidth = qrSize + 60;
          targetHeight = qrSize + 140;
        } else if (frameTemplate === 'poster') {
          targetWidth = qrSize + 80;
          targetHeight = qrSize + 180;
        }

        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        const ctx = targetCanvas.getContext('2d');
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // 3. Dibujar fondo y marco si aplica
        if (frameTemplate === 'none') {
          // Solo QR
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(qrCanvas, 0, 0);
          drawCenterBadge(ctx, targetWidth / 2, targetHeight / 2, qrSize);
        } else if (frameTemplate === 'placa') {
          // Formato: Placa de Identificación de Mascota
          drawPetTagFrame(ctx, qrCanvas, targetWidth, targetHeight);
        } else if (frameTemplate === 'clinica') {
          // Formato: Credencial Clínica Oficial
          drawClinicFrame(ctx, qrCanvas, targetWidth, targetHeight);
        } else if (frameTemplate === 'poster') {
          // Formato: Póster Escanéame
          drawPosterFrame(ctx, qrCanvas, targetWidth, targetHeight);
        }
      } catch (err) {
        console.error('[QRGenerator] Error al generar código QR:', err);
      }
    }

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [
    contentType,
    petName,
    petSpecies,
    petBreed,
    ownerName,
    emergencyPhone,
    petNotes,
    waPhone,
    waMessage,
    appointmentUrl,
    locationUrl,
    wifiSsid,
    wifiPassword,
    wifiType,
    customText,
    fgColor,
    bgColor,
    centerLogo,
    customLogoUrl,
    frameTemplate,
    qrSize,
    eccLevel
  ]);

  // Dibuja el icono central dentro del código QR
  const drawCenterBadge = (ctx, cx, cy, baseQrSize) => {
    if (centerLogo === 'none') return;

    const badgeSize = Math.round(baseQrSize * 0.24);
    const radius = Math.round(badgeSize / 2);

    // Fondo blanco circular para el icono con sombra
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    // Borde fino del color del QR
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Dibujar icono o texto según el preset
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (centerLogo === 'luna-vet') {
      // Dibujar Luna Creciente y Huellita
      ctx.beginPath();
      ctx.arc(cx - 3, cy, radius * 0.65, 0.7 * Math.PI, 1.7 * Math.PI, false);
      ctx.fillStyle = fgColor;
      ctx.fill();

      // Huellita pequeña
      ctx.font = `${Math.round(badgeSize * 0.5)}px Arial, sans-serif`;
      ctx.fillText('🐾', cx + 4, cy);
    } else if (centerLogo === 'huella') {
      ctx.font = `${Math.round(badgeSize * 0.65)}px Arial, sans-serif`;
      ctx.fillText('🐾', cx, cy + 2);
    } else if (centerLogo === 'cruz') {
      // Cruz médica
      const barW = Math.round(badgeSize * 0.22);
      const barH = Math.round(badgeSize * 0.62);
      ctx.fillStyle = fgColor;
      ctx.fillRect(cx - barW / 2, cy - barH / 2, barW, barH);
      ctx.fillRect(cx - barH / 2, cy - barW / 2, barH, barW);
    } else if (centerLogo === 'corazon') {
      ctx.font = `${Math.round(badgeSize * 0.65)}px Arial, sans-serif`;
      ctx.fillText('❤️', cx, cy + 2);
    } else if (centerLogo === 'custom' && customLogoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = customLogoUrl;
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - radius, cy - radius, badgeSize, badgeSize);
        ctx.restore();
      };
    }
    ctx.restore();
  };

  // Helper para calcular contraste de texto sobre el fondo dinámico del marco
  const getContrastColor = (hex) => {
    if (!hex || hex.length < 6) return '#0f172a';
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#0f172a' : '#ffffff';
  };

  // Dibuja el marco decorativo estilo "Placa de Mascota"
  const drawPetTagFrame = (ctx, qrCanvas, w, h) => {
    const textColor = getContrastColor(bgColor);
    const subtextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.75)' : '#64748b';

    // Fondo de tarjeta con esquinas redondeadas según bgColor
    ctx.save();
    drawRoundedRect(ctx, 4, 4, w - 8, h - 8, 20);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Franja superior estilizada con color de acento
    ctx.save();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(4, 4, w - 8, 48, [18, 18, 0, 0]) : ctx.rect(4, 4, w - 8, 48);
    ctx.fillStyle = fgColor;
    ctx.fill();

    // Texto superior estilizado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLACA DE IDENTIFICACIÓN', w / 2, 22);
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText('ESCANÉAME SI ME ENCUENTRAS', w / 2, 38);
    ctx.restore();

    // Dibujar QR centrado
    const qrX = (w - qrSize) / 2;
    const qrY = 58;
    ctx.drawImage(qrCanvas, qrX, qrY);

    // Dibujar Icono central sobre el QR
    drawCenterBadge(ctx, w / 2, qrY + qrSize / 2, qrSize);

    // Franja inferior estilizada con datos de la mascota
    ctx.fillStyle = textColor;
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🐾 ${petName.toUpperCase()} 🐾`, w / 2, qrY + qrSize + 24);

    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = subtextColor;
    ctx.fillText(`${petSpecies} • ${petBreed || 'Mestizo'}`, w / 2, qrY + qrSize + 44);

    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = fgColor;
    ctx.fillText(`📞 WhatsApp: ${emergencyPhone}`, w / 2, qrY + qrSize + 66);

    ctx.restore();
  };

  // Dibuja el marco decorativo estilo "Credencial Clínica Oficial"
  const drawClinicFrame = (ctx, qrCanvas, w, h) => {
    const textColor = getContrastColor(bgColor);
    const subtextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.75)' : '#64748b';

    ctx.save();
    drawRoundedRect(ctx, 4, 4, w - 8, h - 8, 18);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Encabezado estilizado
    ctx.fillStyle = fgColor;
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(brand.nombreCompleto || 'Clínica Veterinaria Luna-Vet', w / 2, 30);

    ctx.fillStyle = subtextColor;
    ctx.font = '10.5px system-ui, -apple-system, sans-serif';
    ctx.fillText(brand.slogan || '¡Porque no son solo mascotas, sino familia!', w / 2, 46);

    // QR
    const qrX = (w - qrSize) / 2;
    const qrY = 56;
    ctx.drawImage(qrCanvas, qrX, qrY);
    drawCenterBadge(ctx, w / 2, qrY + qrSize / 2, qrSize);

    // Pie de la credencial estilizado
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Escanéalo con la cámara de tu smartphone', w / 2, qrY + qrSize + 24);

    ctx.fillStyle = subtextColor;
    ctx.font = '10.5px system-ui, -apple-system, sans-serif';
    ctx.fillText('El Coloso, Acapulco • Tel: ' + (brand.telefono || '744 213 0868'), w / 2, qrY + qrSize + 42);

    ctx.restore();
  };

  // Dibuja el marco decorativo estilo "Póster de Mostrador"
  const drawPosterFrame = (ctx, qrCanvas, w, h) => {
    const textColor = getContrastColor(bgColor);
    const subtextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.75)' : '#64748b';

    ctx.save();
    drawRoundedRect(ctx, 4, 4, w - 8, h - 8, 20);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Banner superior
    ctx.save();
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(4, 4, w - 8, 55, [18, 18, 0, 0]) : ctx.rect(4, 4, w - 8, 55);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📱 ESCANEA EL CÓDIGO QR', w / 2, 28);
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(brand.nombreCompleto || 'Luna-Vet Acapulco', w / 2, 45);
    ctx.restore();

    // QR
    const qrX = (w - qrSize) / 2;
    const qrY = 68;
    ctx.drawImage(qrCanvas, qrX, qrY);
    drawCenterBadge(ctx, w / 2, qrY + qrSize / 2, qrSize);

    // Texto inferior
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡Acceso Inmediato desde tu Teléfono!', w / 2, qrY + qrSize + 26);

    ctx.fillStyle = subtextColor;
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText('Apunta tu cámara hacia el código para abrir', w / 2, qrY + qrSize + 44);

    ctx.restore();
  };

  // Helper para rectángulos con esquinas redondeadas
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Descargar imagen en formato PNG de alta resolución
  const handleDownloadPNG = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `lunavet-qr-${contentType}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setFeedback({ type: 'success', message: '¡Imagen QR descargada exitosamente en formato PNG de alta resolución!' });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Descargar en formato SVG vectorial
  const handleDownloadSVG = async () => {
    try {
      const payload = computeQrPayload();
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: eccLevel,
        color: {
          dark: fgColor,
          light: bgColor
        }
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `lunavet-qr-${contentType}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: '¡Código QR vectorial (SVG) descargado con éxito!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Error al exportar SVG: ' + err.message });
    }
  };

  // Copiar imagen PNG al portapapeles
  const handleCopyClipboard = async () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setFeedback({ type: 'success', message: '¡Imagen QR copiada al portapapeles! Puedes pegarla en Word, WhatsApp o Photoshop.' });
        setTimeout(() => setCopied(false), 3000);
        setTimeout(() => setFeedback(null), 4000);
      });
    } catch (err) {
      setFeedback({ type: 'warning', message: 'No se pudo copiar directamente al portapapeles. Usa el botón "Descargar PNG".' });
    }
  };

  // Descargar plantilla PDF imprimible
  const handleDownloadPdf = async () => {
    if (!initialData.petId) {
      handlePrint();
      return;
    }
    setDownloadingPdf(true);
    try {
      const blob = await api.downloadBlob(`/pets/${initialData.petId}/qr-pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Placa_QR_${(petName || 'Mascota').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: '¡Plantilla PDF para placa descargada exitosamente!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Error al descargar PDF: ' + err.message });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Imprimir directamente
  const handlePrint = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const safePhone = String(brand?.telefono || '744 213 0868').replace(/[^0-9+\s()-]/g, '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR Luna-Vet</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            img {
              max-width: 90%;
              height: auto;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              border-radius: 12px;
            }
            .info {
              margin-top: 15px;
              color: #64748b;
              font-size: 12px;
              text-align: center;
            }
            @media print {
              img { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Código QR Luna-Vet" />
          <div class="info">
            Impreso desde Luna-Vet Acapulco • Tel: ${safePhone}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Manejador de subida de imagen para logo central
  const handleCustomLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogoUrl(reader.result);
      setCenterLogo('custom');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card border-0 rounded-4 p-4 shadow-sm" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 small mb-4 shadow-sm`}>
          {feedback.message}
          <button type="button" className="btn-close py-2" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* COLUMNA IZQUIERDA: CONTROLES Y DATOS */}
        <div className="col-lg-7">
          {/* Selector de Caso de Uso / Preset */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary mb-2">
              <i className="bi bi-grid-fill me-1 text-primary"></i> 1. ¿Qué deseas generar con este Código QR?
            </label>
            <div className="row g-2">
              {/* Opción 1: Placa de Mascota */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'mascota' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('mascota');
                    setFrameTemplate('placa');
                    setCenterLogo('luna-vet');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-tag-fill me-1"></i> Placa de Mascota
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>Para collares / rescate</div>
                </button>
              </div>

              {/* Opción 2: WhatsApp Luna-Vet */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'whatsapp' ? 'btn-success text-white shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('whatsapp');
                    setFrameTemplate('clinica');
                    setCenterLogo('luna-vet');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-whatsapp me-1"></i> WhatsApp Directo
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>Chat con clínica</div>
                </button>
              </div>

              {/* Opción 3: Agendar Cita */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'cita' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('cita');
                    setFrameTemplate('poster');
                    setCenterLogo('luna-vet');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-calendar-check me-1"></i> Agendar Cita
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>Portal de reservas</div>
                </button>
              </div>

              {/* Opción 4: Ubicación Google Maps */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'ubicacion' ? 'btn-danger text-white shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('ubicacion');
                    setFrameTemplate('clinica');
                    setCenterLogo('luna-vet');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-geo-alt-fill me-1"></i> Ubicación Clínica
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>El Coloso, Acapulco</div>
                </button>
              </div>

              {/* Opción 5: Wi-Fi Sala de Espera */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'wifi' ? 'btn-warning text-dark shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('wifi');
                    setFrameTemplate('poster');
                    setCenterLogo('luna-vet');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-wifi me-1"></i> Wi-Fi Clientes
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>Conexión automática</div>
                </button>
              </div>

              {/* Opción 6: Enlace Libre */}
              <div className="col-6 col-md-4">
                <button
                  type="button"
                  className={`btn w-100 h-100 p-2 text-start rounded-3 small ${
                    contentType === 'url' ? 'btn-info text-white shadow-sm' : 'qr-option-btn'
                  }`}
                  onClick={() => {
                    setContentType('url');
                    setFrameTemplate('none');
                  }}
                >
                  <div className="fw-bold mb-1">
                    <i className="bi bi-link-45deg me-1"></i> Enlace / Texto
                  </div>
                  <div className="opacity-75" style={{ fontSize: '11px' }}>URL personalizada</div>
                </button>
              </div>
            </div>
          </div>

          {/* Formulario de Contenido según la opción activa */}
          <div className="p-3 qr-well-surface rounded-3 border mb-4">
            {contentType === 'mascota' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-shield-heart-fill text-danger me-2"></i>
                  Datos de la Placa de Mascota
                </h6>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Nombre de la Mascota</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      placeholder="Ej. Max"
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Especie</label>
                    <select
                      className="form-select form-select-sm"
                      value={petSpecies}
                      onChange={e => setPetSpecies(e.target.value)}
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Ave">Ave</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Raza</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={petBreed}
                      onChange={e => setPetBreed(e.target.value)}
                      placeholder="Ej. Golden Retriever"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Teléfono / WhatsApp de Auxilio</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={emergencyPhone}
                      onChange={e => setEmergencyPhone(e.target.value)}
                      placeholder="10 dígitos"
                      required
                    />
                  </div>
                </div>

                <div className="mb-1">
                  <label className="form-label small fw-semibold">Nombre del Tutor / Familia</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ej. Familia Gómez"
                  />
                </div>
              </div>
            )}

            {contentType === 'whatsapp' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-whatsapp text-success me-2"></i>
                  Parámetros de Chat de WhatsApp
                </h6>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Número Telefónico (México)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    placeholder="Ej. 744 213 0868"
                  />
                </div>
                <div className="mb-1">
                  <label className="form-label small fw-semibold">Mensaje Prediseñado al Iniciar Chat</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}

            {contentType === 'cita' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-calendar-plus text-primary me-2"></i>
                  Enlace para Agendar Cita
                </h6>
                <label className="form-label small fw-semibold">URL de la Plataforma de Citas</label>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  value={appointmentUrl}
                  onChange={e => setAppointmentUrl(e.target.value)}
                />
                <div className="form-text small">
                  Al escanear, el usuario abrirá directamente el asistente de agendamiento de Luna-Vet Acapulco.
                </div>
              </div>
            )}

            {contentType === 'ubicacion' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-map-fill text-danger me-2"></i>
                  Enlace de Navegación Google Maps
                </h6>
                <label className="form-label small fw-semibold">URL de Google Maps / Waze</label>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  value={locationUrl}
                  onChange={e => setLocationUrl(e.target.value)}
                />
                <div className="form-text small">
                  Abre la ruta satelital hacia la Clínica en Av. Peña Blanca, U.H. El Coloso.
                </div>
              </div>
            )}

            {contentType === 'wifi' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-wifi text-warning me-2"></i>
                  Datos de Conexión Wi-Fi
                </h6>
                <div className="row g-2 mb-2">
                  <div className="col-8">
                    <label className="form-label small fw-semibold">Nombre de la Red (SSID)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={wifiSsid}
                      onChange={e => setWifiSsid(e.target.value)}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">Seguridad</label>
                    <select
                      className="form-select form-select-sm"
                      value={wifiType}
                      onChange={e => setWifiType(e.target.value)}
                    >
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Sin Contraseña</option>
                    </select>
                  </div>
                </div>
                <div className="mb-1">
                  <label className="form-label small fw-semibold">Contraseña del Wi-Fi</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={wifiPassword}
                    onChange={e => setWifiPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {contentType === 'url' && (
              <div>
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-link-45deg me-2 text-primary"></i>
                  Texto Libre o Enlace Web Personalizado
                </h6>
                <label className="form-label small fw-semibold">Texto o Dirección Web a Codificar</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="https://... o cualquier texto"
                ></textarea>
              </div>
            )}
          </div>

          {/* Personalización Visual y Estilos */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-palette-fill text-info me-2"></i>
              2. Personalización Visual del Código QR
            </h6>

            {/* 1. Color del QR */}
            <div className="mb-3">
              <label className="form-label small fw-semibold d-flex justify-content-between">
                <span>Color de los Módulos del QR:</span>
                <code>{fgColor}</code>
              </label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {COLOR_PALETTES.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm ${
                      fgColor === p.hex ? (isDark ? 'border-light border-3' : 'border-dark border-3') : 'border'
                    }`}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: p.hex,
                      outline: fgColor === p.hex ? (isDark ? '2px solid #ffffff' : '2px solid #000000') : 'none'
                    }}
                    onClick={() => setFgColor(p.hex)}
                    title={p.name}
                  >
                    {fgColor === p.hex && <i className="bi bi-check text-white fs-6"></i>}
                  </button>
                ))}
                <input
                  type="color"
                  className="form-control form-control-color border-0 rounded-circle"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  title="Color personalizado libre"
                  style={{ width: '34px', height: '34px' }}
                />
              </div>
            </div>

            {/* 2. Color de Fondo */}
            <div className="mb-3">
              <label className="form-label small fw-semibold d-flex justify-content-between">
                <span>Color de Fondo:</span>
                <code>{bgColor}</code>
              </label>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm px-3 rounded-pill border ${bgColor === '#ffffff' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                  onClick={() => setBgColor('#ffffff')}
                >
                  Blanco
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 rounded-pill border ${bgColor === '#fffbeb' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                  onClick={() => setBgColor('#fffbeb')}
                >
                  Cálido / Crema
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 rounded-pill border ${bgColor === '#f8fafc' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                  onClick={() => setBgColor('#f8fafc')}
                >
                  Gris Suave
                </button>
                <input
                  type="color"
                  className="form-control form-control-color border-0 rounded-circle ms-2"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  title="Fondo libre"
                  style={{ width: '34px', height: '34px' }}
                />
              </div>
            </div>

            {/* 3. Icono Central */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Icono Central Incrustado:</label>
              <div className="row g-2">
                <div className="col-4 col-sm-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${centerLogo === 'luna-vet' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setCenterLogo('luna-vet')}
                  >
                    🌙🐾 Luna-Vet
                  </button>
                </div>
                <div className="col-4 col-sm-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${centerLogo === 'huella' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setCenterLogo('huella')}
                  >
                    🐾 Huella
                  </button>
                </div>
                <div className="col-4 col-sm-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${centerLogo === 'cruz' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setCenterLogo('cruz')}
                  >
                    ➕ Cruz Médica
                  </button>
                </div>
                <div className="col-4 col-sm-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${centerLogo === 'corazon' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setCenterLogo('corazon')}
                  >
                    ❤️ Corazón
                  </button>
                </div>
                <div className="col-6 col-sm-4">
                  <label className={`btn btn-sm w-100 rounded-3 text-center cursor-pointer ${centerLogo === 'custom' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}>
                    <i className="bi bi-camera me-1"></i> Foto Propia
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleCustomLogoUpload}
                    />
                  </label>
                </div>
                <div className="col-6 col-sm-4">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${centerLogo === 'none' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setCenterLogo('none')}
                  >
                    Sin Icono
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Plantilla de Marco para Imprimir */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Plantilla / Marco de Presentación:</label>
              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${frameTemplate === 'placa' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setFrameTemplate('placa')}
                  >
                    🏷️ Placa Mascota
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${frameTemplate === 'clinica' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setFrameTemplate('clinica')}
                  >
                    🏥 Credencial Clínica
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${frameTemplate === 'poster' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setFrameTemplate('poster')}
                  >
                    📄 Póster Mostrador
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 rounded-3 text-center ${frameTemplate === 'none' ? 'btn-primary text-white shadow-sm' : 'qr-option-btn'}`}
                    onClick={() => setFrameTemplate('none')}
                  >
                    🔳 Solo Código QR
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Resolución y Redundancia */}
            <div className="row g-3">
              <div className="col-md-7">
                <label className="form-label small fw-semibold d-flex justify-content-between">
                  <span>Tamaño / Resolución de Exportación:</span>
                  <span>{qrSize} x {qrSize} px</span>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="200"
                  max="800"
                  step="20"
                  value={qrSize}
                  onChange={e => setQrSize(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small fw-semibold">Corrección de Error</label>
                <select
                  className="form-select form-select-sm"
                  value={eccLevel}
                  onChange={e => setEccLevel(e.target.value)}
                >
                  <option value="H">Alta (30% - Óptimo para logos)</option>
                  <option value="Q">Cuartil (25%)</option>
                  <option value="M">Media (15%)</option>
                  <option value="L">Baja (7%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PREVISUALIZADOR EN VIVO ESTILIZADO */}
        <div className="col-lg-5">
          <div className="sticky-top" style={{ top: '90px', zIndex: 10 }}>
            <div className="card rounded-4 p-3 p-md-4 text-center qr-preview-card shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1 rounded-pill small">
                  <i className="bi bi-eye-fill me-1"></i> Vista Previa
                </span>
                <span className="badge bg-success-subtle text-success small rounded-pill px-2 py-1">
                  <i className="bi bi-check-circle-fill me-1"></i> Escaneable
                </span>
              </div>

              {/* Contenedor del Canvas con pozo neumórfico adaptativo */}
              <div className="d-flex justify-content-center align-items-center p-3 rounded-4 mb-3 qr-well-surface">
                <canvas
                  ref={qrCanvasRef}
                  className="img-fluid rounded-3 shadow"
                  style={{
                    maxHeight: '340px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                ></canvas>
              </div>

              {/* Botones de Acción Estilizados */}
              <div className="d-grid gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-primary rounded-pill fw-bold shadow-sm py-2"
                  onClick={handleDownloadPNG}
                >
                  <i className="bi bi-download me-2"></i> Descargar PNG
                </button>

                <div className="row g-2">
                  <div className="col-4">
                    <button
                      type="button"
                      className="btn btn-outline-primary rounded-pill w-100 btn-sm py-1"
                      onClick={handleDownloadSVG}
                      title="Descargar vectorial SVG"
                    >
                      <i className="bi bi-filetype-svg me-1"></i> SVG
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill w-100 btn-sm py-1"
                      onClick={handleCopyClipboard}
                      title="Copiar al portapapeles"
                    >
                      <i className={`bi ${copied ? 'bi-check-all text-success' : 'bi-clipboard'} me-1`}></i>
                      {copied ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      className="btn btn-outline-info rounded-pill w-100 btn-sm py-1"
                      onClick={handlePrint}
                      title="Imprimir código o placa"
                    >
                      <i className="bi bi-printer me-1"></i> Imprimir
                    </button>
                  </div>
                </div>

                {initialData.petId && (
                  <button
                    type="button"
                    className="btn btn-outline-danger rounded-pill w-100 btn-sm py-1 mt-1"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? (
                      <span><span className="spinner-border spinner-border-sm me-1"></span>Generando PDF...</span>
                    ) : (
                      <span><i className="bi bi-file-earmark-pdf me-1"></i> Plantilla PDF</span>
                    )}
                  </button>
                )}
              </div>

              {/* Chip informativo sutil y estilizado */}
              <div className="text-center mt-2">
                <span className="badge bg-body-secondary text-body-secondary border rounded-pill px-3 py-1 small fw-normal" style={{ fontSize: '11px' }}>
                  <i className="bi bi-shield-check text-success me-1"></i>
                  Garantía de Escaneo • Corrección {eccLevel} • {qrSize}x{qrSize}px
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
