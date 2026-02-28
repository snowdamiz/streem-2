import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const srcDir = resolve(import.meta.dirname, 'src')

// Ambient .d.ts files that contain JSX module augmentations.
// These are not part of the module graph, so they must be appended manually
// after vite-plugin-dts rolls up the TypeScript source declarations.
const ambientDeclarations = [
  readFileSync(resolve(srcDir, 'base-custom-element-types.d.ts'), 'utf-8'),
  readFileSync(resolve(srcDir, 'lit-types/lit-elements.d.ts'), 'utf-8'),
]

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
  plugins: [
    dts({
      rollupTypes: true,
      include: ['src'],
      beforeWriteFile(filePath, content) {
        // Append ambient module augmentations to the rolled-up index.d.ts
        if (filePath.endsWith('index.d.ts')) {
          return { filePath, content: content + '\n' + ambientDeclarations.join('\n') }
        }
      },
    }),
  ],
})
