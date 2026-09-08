/**
 * Vista HTML Premium para Páginas de Error y Rutas No Encontradas (404, 500)
 * Diseñada para LunaVet Web Platform v4.0 con estética dark mode, glassmorphism y micro-interacciones.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderErrorHtml({
  statusCode = 404,
  code = 'ROUTE_NOT_FOUND',
  message = 'La ruta solicitada no existe en el servidor.',
  details = null,
  method = 'GET',
  url = '/',
  stack = null
} = {}) {
  const is404 = statusCode === 404;
  const statusTitle = is404 ? 'Ruta No Encontrada' : 'Error del Servidor';
  const badgeColor = is404 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const badgeBorder = is404 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
  const badgeTextColor = is404 ? '#f87171' : '#fbbf24';

  const rawJson = JSON.stringify(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    },
    null,
    2
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusCode} - ${escapeHtml(statusTitle)} | LunaVet</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #080c14;
      --bg-surface: rgba(17, 24, 39, 0.85);
      --bg-surface-elevated: rgba(30, 41, 59, 0.7);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(99, 102, 241, 0.25);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #6366f1;
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
      --accent-cyan: #06b6d4;
      --accent-red: #ef4444;
      --radius-lg: 20px;
      --radius-md: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow-x: hidden;
    }

    /* Fondo ambiental con orbes luminosos */
    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
      opacity: 0.45;
      animation: floatOrb 12s ease-in-out infinite alternate;
    }

    .glow-orb-1 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #4f46e5 0%, rgba(79, 70, 229, 0) 70%);
      top: -100px;
      left: 10%;
    }

    .glow-orb-2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #06b6d4 0%, rgba(6, 182, 212, 0) 70%);
      bottom: -80px;
      right: 15%;
      animation-duration: 16s;
    }

    @keyframes floatOrb {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(40px) scale(1.08); }
    }

    /* Contenedor Principal Glassmorphism */
    .card-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 680px;
      background: var(--bg-surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px var(--border-glow);
      padding: 44px 40px;
      text-align: center;
      transition: border-color 0.3s ease;
    }

    .card-container:hover {
      border-color: rgba(99, 102, 241, 0.4);
    }

    /* Logotipo LunaVet */
    .brand-header {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.35);
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Badge de Código HTTP */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${badgeColor};
      border: 1px solid ${badgeBorder};
      color: ${badgeTextColor};
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: currentColor;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* Número 404 Estilizado */
    .hero-number {
      font-family: 'Outfit', sans-serif;
      font-size: 84px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 12px;
      letter-spacing: -2px;
      background: linear-gradient(180deg, #ffffff 30%, #64748b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--text-primary);
    }

    /* Mensaje del Error */
    .error-message-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin: 20px 0 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }

    .route-display {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
    }

    .method-pill {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.4);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }

    .url-text {
      color: #e2e8f0;
      word-break: break-all;
    }

    .message-text {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.5;
    }

    /* Botones de Acción */
    .actions-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-bottom: 28px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--primary-gradient);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    .btn-secondary {
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
    }

    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    /* Acordeón de Detalles Técnicos (JSON) */
    .tech-details {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: rgba(15, 23, 42, 0.5);
      text-align: left;
    }

    .tech-header {
      padding: 12px 18px;
      background: rgba(30, 41, 59, 0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }

    .tech-header span {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .copy-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      color: var(--text-primary);
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    .json-code {
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #38bdf8;
      background: #090d16;
      overflow-x: auto;
      max-height: 240px;
      line-height: 1.5;
    }

    /* Pie de página */
    .footer-note {
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer-note a {
      color: var(--accent-cyan);
      text-decoration: none;
    }

    .footer-note a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <!-- Orbes de luz de fondo -->
  <div class="glow-orb glow-orb-1"></div>
  <div class="glow-orb glow-orb-2"></div>

  <!-- Tarjeta de Error -->
  <div class="card-container">
    <!-- Logotipo LunaVet -->
    <div class="brand-header">
      <div class="brand-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C13.535 22 14.985 21.654 16.287 21.036C12.593 19.866 9.89 16.425 9.89 12.333C9.89 8.241 12.593 4.8 16.287 3.63C14.985 3.012 13.535 2 12 2Z" fill="#ffffff"/>
          <circle cx="17.5" cy="11.5" r="2.5" fill="#38bdf8"/>
          <circle cx="15.5" cy="7.5" r="1.5" fill="#a78bfa"/>
          <circle cx="19.5" cy="7.5" r="1.5" fill="#a78bfa"/>
        </svg>
      </div>
      <div class="brand-title">LunaVet v4.0</div>
    </div>

    <!-- Badge de Estado -->
    <div>
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>${statusCode} • ${escapeHtml(code)}</span>
      </div>
    </div>

    <!-- Hero 404 -->
    <div class="hero-number">${statusCode}</div>
    <h1 class="hero-title">${escapeHtml(statusTitle)}</h1>

    <!-- Desglose de la Ruta Solicitada -->
    <div class="error-message-box">
      <div class="route-display">
        <span class="method-pill">${escapeHtml(method)}</span>
        <span class="url-text">${escapeHtml(url)}</span>
      </div>
      <p class="message-text">${escapeHtml(message)}</p>
    </div>

    <!-- Accesos Directos a la API -->
    <div class="actions-group">
      <a href="/api/health" class="btn btn-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <span>Verificar Salud API</span>
      </a>
      <a href="/api/cms/landing" class="btn btn-secondary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Landing Consolidada</span>
      </a>
      <button onclick="window.history.back()" class="btn btn-secondary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Regresar</span>
      </button>
    </div>

    <!-- Inspector Técnico JSON -->
    <div class="tech-details">
      <div class="tech-header">
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          Payload Técnico JSON
        </span>
        <button id="copyJsonBtn" class="copy-btn" onclick="copyTechnicalJson()">Copiar JSON</button>
      </div>
      <pre class="json-code" id="jsonPayload"><code>${escapeHtml(rawJson)}</code></pre>
      ${stack ? `
      <div style="border-top: 1px solid var(--border-subtle); padding: 12px 16px; background: rgba(239, 68, 68, 0.05);">
        <div style="font-size: 11px; font-weight: 700; color: #f87171; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Stack Trace (Modo Desarrollo):</div>
        <pre class="json-code" style="color: #fca5a5; font-size: 11px; max-height: 180px;"><code>${escapeHtml(stack)}</code></pre>
      </div>` : ''}
    </div>

    <div class="footer-note">
      LunaVet Web Platform Core • Single-Tenant para cPanel & Passenger • Documentación en <a href="/README.md" target="_blank">README.md</a>
    </div>
  </div>

  <script>
    function copyTechnicalJson() {
      const code = document.getElementById('jsonPayload').innerText;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyJsonBtn');
        btn.innerText = '¡Copiado!';
        btn.style.color = '#38bdf8';
        btn.style.borderColor = '#38bdf8';
        setTimeout(() => {
          btn.innerText = 'Copiar JSON';
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

module.exports = {
  renderErrorHtml
};
