/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port so the Tauri shell's devUrl always resolves to this server.
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    // Domain/application tests are pure; node is enough and fast.
    environment: 'node',
  },
})
