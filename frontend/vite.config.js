import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Fail if port is busy, don't jump to 5176
    host: true
  },
  preview: {
    port: 5174
  }
})

