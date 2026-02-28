import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    name: '@streem/streams',
    setupFiles: ['./tests/setup.ts'],
  },
})
