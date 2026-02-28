import { defineConfig } from 'vite'
import { streemHMR } from '@streem/dom'

export default defineConfig({
  plugins: [streemHMR()],
})
