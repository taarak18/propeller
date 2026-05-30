import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev-server proxy is the POC stand-in for the API gateway:
// each path prefix is routed to the owning service's port.
const svc = (port) => ({ target: `http://localhost:${port}`, changeOrigin: true })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': svc(8082),
      '/api/v1/ingest': svc(8081),
      '/api/v1/employees': svc(8082),
      '/api/v1/risk': svc(8083),
      '/api/v1/rules': svc(8083),
      '/api/v1/interventions': svc(8084),
      '/api/v1/consents': svc(8085),
      '/api/v1/dashboard': svc(8086),
      '/api/v1/reports': svc(8086),
    },
  },
})
