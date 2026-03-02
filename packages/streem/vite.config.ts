import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'jsx-runtime': 'src/jsx-runtime.ts',
        'jsx-dev-runtime': 'src/jsx-dev-runtime.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@streeem/core',
        '@streeem/dom',
        '@streeem/dom/jsx-runtime',
        '@streeem/dom/jsx-dev-runtime',
        '@streeem/streams',
      ],
    },
    target: 'es2022',
    minify: false,
  },
  plugins: [dts({ rollupTypes: true })],
})
