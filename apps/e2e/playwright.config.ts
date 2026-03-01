import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 2,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'cli-scaffold',
      testMatch: 'cli-scaffold.spec.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'hmr-signal',
      testMatch: 'hmr-signal.spec.ts',
      use: { browserName: 'chromium' },
    },
  ],
})
