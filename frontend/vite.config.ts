import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'ojaruta-production-8e90.up.railway.app',
      'ojaruta-production.up.railway.app',
      '.railway.app'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'ojaruta-production-8e90.up.railway.app',
      'ojaruta-production.up.railway.app',
      '.railway.app'
    ]
  }
})
