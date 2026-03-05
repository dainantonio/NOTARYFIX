import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_URL env var lets Vercel override to '/' at deploy time.
// GitHub Pages falls back to '/NOTARYFIX/' (the repo subdirectory).
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || (process.env.VERCEL ? '/' : '/NOTARYFIX/'),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — loaded on every page
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy UI libs — split so they don't block initial paint
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    // Silence the warning now that we're properly splitting
    chunkSizeWarningLimit: 600,
  },
})
