import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This ./ base path allows the app to run in the github subdirectory
  base: './', 
})
