import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:3002'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: ['all'],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      }
    }
  }
})
