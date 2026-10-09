const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const mdPath = path.join(rootDir, 'MANUAL_USUARIO.md');
const htmlPath = path.join(__dirname, 'manual_usuario.html');
const pdfPath = path.join(rootDir, 'MANUAL_USUARIO.pdf');

console.log('Leyendo MANUAL_USUARIO.md...');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Función para convertir imágenes a base64
function resolveImageBase64(imgPath) {
  try {
    const fullPath = path.isAbsolute(imgPath) ? imgPath : path.join(rootDir, imgPath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      return `data:image/png;base64,${data.toString('base64')}`;
    }
  } catch (e) {
    console.warn(`No se pudo cargar la imagen: ${imgPath}`, e.message);
  }
  return imgPath;
}

// Convertidor Markdown a HTML enriquecido
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = [];
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;
  let listType = null;
  let inBlockquote = false;
  let blockquoteLines = [];

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return;
    const text = blockquoteLines.join('\n');
    let calloutType = 'note';
    let title = 'Nota';
    let icon = 'ℹ️';

    if (text.includes('[!NOTE]')) {
      calloutType = 'note';
      title = 'Nota de Contexto';
      icon = '💡';
    } else if (text.includes('[!TIP]')) {
      calloutType = 'tip';
      title = 'Consejo Práctico';
      icon = '✨';
    } else if (text.includes('[!IMPORTANT]')) {
      calloutType = 'important';
      title = 'Paso Indispensable';
      icon = '📌';
    } else if (text.includes('[!WARNING]')) {
      calloutType = 'warning';
      title = 'Punto de Precaución';
      icon = '⚠️';
    } else if (text.includes('[!CAUTION]')) {
      calloutType = 'caution';
      title = 'Acción Delicada';
      icon = '🛑';
    }

    const cleanText = text
      .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(inlineFormatting)
      .join('<br>');

    html.push(`
      <div class="callout callout-${calloutType}">
        <div class="callout-header"><span class="callout-icon">${icon}</span> <strong>${title}</strong></div>
        <div class="callout-body">${cleanText}</div>
      </div>
    `);
    blockquoteLines = [];
    inBlockquote = false;
  }

  function flushList() {
    if (inList) {
      html.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
      listType = null;
    }
  }

  function flushTable() {
    if (inTable) {
      html.push('</tbody></table></div>');
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Blockquote
    if (line.startsWith('>')) {
      flushList();
      flushTable();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Tablas Markdown
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      // Separador (| :--- | :--- |)
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = true;
        html.push('<div class="table-container"><table><thead><tr>');
        cells.forEach(c => html.push(`<th>${inlineFormatting(c)}</th>`));
        html.push('</tr></thead><tbody>');
      } else {
        html.push('<tr>');
        cells.forEach(c => html.push(`<td>${inlineFormatting(c)}</td>`));
        html.push('</tr>');
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Regla horizontal
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList();
      html.push('<hr class="divider">');
      continue;
    }

    // Encabezados
    if (line.startsWith('# ')) {
      flushList();
      html.push(`<h1 class="doc-title">${inlineFormatting(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      html.push(`<h2 class="section-title">${inlineFormatting(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      html.push(`<h3 class="subsection-title">${inlineFormatting(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      html.push(`<h4 class="sub-subsection-title">${inlineFormatting(line.slice(5))}</h4>`);
      continue;
    }

    // Imágenes: ![caption](path)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      flushList();
      const caption = imgMatch[1];
      const src = resolveImageBase64(imgMatch[2]);
      html.push(`
        <figure class="screenshot-figure">
          <div class="img-wrapper">
            <img src="${src}" alt="${caption}" class="screenshot-img" />
          </div>
          <figcaption>${caption}</figcaption>
        </figure>
      `);
      continue;
    }

    // Pie de foto en cursiva (*texto*)
    if (line.trim().startsWith('*') && line.trim().endsWith('*') && !line.trim().startsWith('**')) {
      flushList();
      html.push(`<p class="figure-note">${inlineFormatting(line.trim())}</p>`);
      continue;
    }

    // Listas ordenadas
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${inlineFormatting(olMatch[2])}</li>`);
      continue;
    }

    // Listas desordenadas
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${inlineFormatting(ulMatch[1])}</li>`);
      continue;
    }

    // Párrafos vacíos
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Bloque ASCII preformateado
    if (line.startsWith('```')) {
      flushList();
      let codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      html.push(`<pre class="ascii-diagram"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Párrafo estándar
    flushList();
    html.push(`<p>${inlineFormatting(line)}</p>`);
  }

  flushList();
  flushTable();
  flushBlockquote();

  return html.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormatting(text) {
  return text
    // Enlaces
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Negrita
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Cursiva
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Código inline
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

const bodyHtml = markdownToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual del Usuario — Luna-Vet Acapulco</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: "Página " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #86868b;
      }
      @bottom-left {
        content: "Luna-Vet Acapulco — Manual del Usuario v4.5";
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #86868b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1d1d1f;
      background-color: #ffffff;
      line-height: 1.55;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }

    /* Portada Editorial Apple */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 85vh;
      padding: 40px 20px;
      text-align: left;
    }

    .cover-badge {
      display: inline-block;
      align-self: flex-start;
      background: #0071e3;
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      line-height: 1.15;
      color: #1d1d1f;
      letter-spacing: -0.02em;
      margin: 0 0 12px 0;
    }

    .cover-subtitle {
      font-size: 14pt;
      color: #6e6e73;
      font-weight: 400;
      line-height: 1.4;
      margin: 0 0 32px 0;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f5f5f7;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-top: 20px;
    }

    .cover-meta-item strong {
      display: block;
      color: #86868b;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }

    .cover-meta-item span {
      font-size: 10.5pt;
      font-weight: 500;
      color: #1d1d1f;
    }

    /* Tipografía y Secciones */
    h1.doc-title {
      display: none; /* Se muestra en la portada */
    }

    h2.section-title {
      font-size: 16pt;
      font-weight: 700;
      color: #0071e3;
      border-bottom: 1.5px solid #0071e3;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
      letter-spacing: -0.015em;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 12.5pt;
      font-weight: 600;
      color: #1d1d1f;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h4.sub-subsection-title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #424245;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 10px 0;
      color: #333336;
    }

    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
      color: #333336;
    }

    a {
      color: #0071e3;
      text-decoration: none;
    }

    code {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      background: #f5f5f7;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      color: #0071e3;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    pre.ascii-diagram {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 8.5pt;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    /* Tablas Apple Design */
    .table-container {
      margin: 16px 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d2d2d7;
      border-radius: 10px;
      overflow: hidden;
      font-size: 9pt;
    }

    th {
      background: #f5f5f7;
      color: #1d1d1f;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1.5px solid #d2d2d7;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e5ea;
      color: #333336;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background-color: #fafafc;
    }

    /* Callouts Apple HIG */
    .callout {
      border-radius: 12px;
      padding: 12px 16px;
      margin: 14px 0;
      page-break-inside: avoid;
      border-left: 4px solid;
    }

    .callout-header {
      font-size: 9.5pt;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-body {
      font-size: 9pt;
      color: #1d1d1f;
      line-height: 1.45;
    }

    .callout-note {
      background: #f0f7ff;
      border-color: #0071e3;
    }
    .callout-note .callout-header {
      color: #0071e3;
    }

    .callout-tip {
      background: #f2fbf4;
      border-color: #34c759;
    }
    .callout-tip .callout-header {
      color: #248a3d;
    }

    .callout-important {
      background: #fff8eb;
      border-color: #ff9500;
    }
    .callout-important .callout-header {
      color: #c97500;
    }

    .callout-warning {
      background: #fff3f2;
      border-color: #ff3b30;
    }
    .callout-warning .callout-header {
      color: #d70015;
    }

    .callout-caution {
      background: #fbf0f0;
      border-color: #af52de;
    }
    .callout-caution .callout-header {
      color: #8944ab;
    }

    /* Figuras y Capturas */
    .screenshot-figure {
      margin: 16px 0 10px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .img-wrapper {
      display: inline-block;
      max-width: 100%;
      background: #ffffff;
      border: 1px solid #d2d2d7;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .screenshot-img {
      max-width: 100%;
      height: auto;
      max-height: 380px;
      border-radius: 8px;
      display: block;
    }

    figcaption {
      font-size: 8.5pt;
      color: #6e6e73;
      margin-top: 6px;
      font-style: italic;
    }

    p.figure-note {
      font-size: 8.5pt;
      color: #6e6e73;
      font-style: italic;
      text-align: center;
      margin-top: -6px;
      margin-bottom: 14px;
    }

    .divider {
      border: 0;
      height: 1px;
      background: #e5e5ea;
      margin: 24px 0;
    }

    /* Encabezados con salto de página controlado */
    h2.section-title:not(:first-of-type) {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- PORTADA EDITORIAL -->
  <div class="cover-page">
    <div class="cover-badge">Luna-Vet Acapulco — Guía Oficial v4.5</div>
    <h1 class="cover-title">Manual Integral del Usuario</h1>
    <div class="cover-subtitle">
      Plataforma Médica Digital de Salud Animal, Farmacia & Estética Canina.<br>
      Diseño Oficial Apple Segmented Glassmorphic (HIG).
    </div>

    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <strong>Clínica Veterinaria</strong>
        <span>Luna-Vet Acapulco de Juárez</span>
      </div>
      <div class="cover-meta-item">
        <strong>Ubicación Oficial</strong>
        <span>El Coloso, Etapa 38, C.P. 39810</span>
      </div>
      <div class="cover-meta-item">
        <strong>Fecha de Edición</strong>
        <span>Octubre 2026 (Versión 4.5)</span>
      </div>
      <div class="cover-meta-item">
        <strong>Urgencias Médicas 24/7</strong>
        <span>WhatsApp: 744 213 0868</span>
      </div>
      <div class="cover-meta-item">
        <strong>Audiencia</strong>
        <span>Tutores, Recepción, Médicos y Dirección</span>
      </div>
      <div class="cover-meta-item">
        <strong>Cumplimiento</strong>
        <span>SENASICA / NOM Sanitaria / WCAG AA</span>
      </div>
    </div>
  </div>

  <!-- CUERPO PRINCIPAL DEL MANUAL -->
  <div class="manual-content">
    ${bodyHtml}
  </div>

</body>
</html>
`;

console.log('Escribiendo manual_usuario.html...');
fs.writeFileSync(htmlPath, fullHtml, 'utf8');

console.log('Generando PDF mediante Microsoft Edge Headless...');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targetUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

try {
  const edgeCmd = `"${edgePath}" --headless=new --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${targetUrl}"`;
  execSync(edgeCmd, { stdio: 'inherit' });
  
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`¡PDF generado exitosamente en: ${pdfPath}! (Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.error('El archivo PDF no fue generado.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error al ejecutar Edge para generar PDF:', err.message);
  process.exit(1);
}
