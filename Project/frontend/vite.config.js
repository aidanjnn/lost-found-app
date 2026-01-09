import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  root: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',  // Changed to 5001 to avoid AirPlay conflict
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/auth': {
        target: 'http://localhost:5001',  // Changed to 5001 to avoid AirPlay conflict
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})

