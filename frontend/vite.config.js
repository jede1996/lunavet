import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@fullcalendar')) {
            return 'vendor-calendar';
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'vendor-charts';
          }
          if (id.includes('qrcode')) {
            return 'vendor-qr';
          }
          if (id.includes('bootstrap') || id.includes('@popperjs')) {
            return 'vendor-bootstrap';
          }
          if (id.includes('react-router-dom')) {
            return 'vendor-router';
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js'
  }
});
