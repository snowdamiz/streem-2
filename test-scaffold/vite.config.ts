import { defineConfig } from 'vite'
import { streemHMR } from 'streeem'

export default defineConfig({
  plugins: [streemHMR()],
})
