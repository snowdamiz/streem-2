import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'
import { streemHMR } from 'streeem'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

// Change to '/' if a custom domain is configured for this GitHub Pages site
const BASE_URL = process.env.VITE_BASE_URL ?? '/streem-2/'

export default defineConfig({
  base: BASE_URL,
  plugins: [
    tailwind(),
    streemHMR(),
    viteStaticCopy({
      targets: [{
        src: 'node_modules/@shoelace-style/shoelace/dist/assets/**/*',
        dest: 'shoelace_assets'
      }]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs/index.html'),
      }
    }
  }
})
