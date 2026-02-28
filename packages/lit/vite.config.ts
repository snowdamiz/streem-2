import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@streem/core', '@streem/dom'],
    },
  },
  plugins: [dts({ rollupTypes: true })],
})
