import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import { streemHMR } from 'streem'

export default defineConfig({
  plugins: [tailwind(), streemHMR()],
})
