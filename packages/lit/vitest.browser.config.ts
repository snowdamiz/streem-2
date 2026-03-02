import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    name: '@streeem/lit:browser',
    include: ['tests/browser/**/*.browser.test.{ts,tsx}'],
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
