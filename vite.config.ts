import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // jsQR is loaded only when the camera scanner opens; pre-bundle it so the
  // first scan does not trigger a dev-server dependency reload.
  optimizeDeps: { include: ['jsqr'] },
})
