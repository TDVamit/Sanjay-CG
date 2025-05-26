import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['@react-pdf-viewer/core', '@react-pdf-viewer/default-layout', 'pdfjs-dist']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['@react-pdf-viewer/core', '@react-pdf-viewer/default-layout', 'pdfjs-dist']
  }
})
