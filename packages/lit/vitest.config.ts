import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    name: '@streem/lit',
    // Exclude browser tests — those run via vitest.browser.config.ts
    exclude: ['tests/browser/**', 'node_modules/**'],
    // No non-browser unit tests in this package yet — exit cleanly
    passWithNoTests: true,
  },
})
