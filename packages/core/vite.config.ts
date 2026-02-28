import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    target: 'es2022',
    minify: false,
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  test: {
    environment: 'node',
  },
})
