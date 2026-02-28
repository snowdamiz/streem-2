import { defineConfig } from 'vite'
import { streemHMR } from 'streem'

export default defineConfig({
  plugins: [streemHMR()],
})
