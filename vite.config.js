import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// data/ is served as static files, so data/calls.json is available at /calls.json.
// The app also accepts any JSON file via upload / drag-and-drop.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'data',
})
