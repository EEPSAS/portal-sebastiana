import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite lendo a variável PORT definida no .env (padrão 5173)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT) || 5173,
    },
  }
})
