import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    name: '@streeem/streams',
    setupFiles: ['./tests/setup.ts'],
  },
})
