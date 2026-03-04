import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_URL env var lets Vercel override to '/' at deploy time.
// GitHub Pages falls back to '/NOTARYFIX/' (the repo subdirectory).
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || (process.env.VERCEL ? '/' : '/NOTARYFIX/'),
})
