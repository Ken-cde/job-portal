import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/jobs': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/applications': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
})
