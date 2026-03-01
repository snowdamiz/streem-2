import { defineConfig } from '@playwright/test'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MONOREPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..')
const DEMO_APP_DIR = join(MONOREPO_ROOT, 'apps/demo')

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 2,
  use: {
    headless: true,
  },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    cwd: DEMO_APP_DIR,
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
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
      use: {
        browserName: 'chromium',
        baseURL: 'http://localhost:5174',
      },
    },
  ],
})
