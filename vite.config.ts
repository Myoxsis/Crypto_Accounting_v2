import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      'pg-hstore': '/src/shims/pg-hstore.ts',
    },
  },
  optimizeDeps: {
    exclude: ['pg-hstore'],
  },
  build: {
    rollupOptions: {
      external: ['pg-hstore'],
    },
  },
})
