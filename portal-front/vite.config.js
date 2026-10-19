import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuração do Servidor Vite (Frontend)
 *
 * Papel Didático:
 * 1. `port: 5173` e `strictPort: true`: Garante que a origem seja sempre `http://localhost:5173`,
 *    coincidindo com as origens autorizadas no Google Cloud Console e no `config/cors.php` do Laravel.
 * 2. `Cross-Origin-Opener-Policy: same-origin-allow-popups`: Permite que a janela popup de login
 *    do Google Identity Services envie a credencial JWT de volta para a aplicação via `postMessage`.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  // Configuração de produção/preview (Railway): aceita domínios *.up.railway.app e mantém o header COOP do Google OAuth
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})

