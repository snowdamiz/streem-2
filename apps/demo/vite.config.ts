import { defineConfig } from 'vite'
import { streemHMR } from '@streeem/dom'

export default defineConfig({
  plugins: [streemHMR()],
})
