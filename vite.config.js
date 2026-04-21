import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://cloud1-3glovk2z550b79f4.service.tcloudbase.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})