import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MONOREPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../..')
const APP_TSX_PATH = join(MONOREPO_ROOT, 'apps/demo/src/App.tsx')

test.describe('TEST-02: HMR signal state preservation', () => {
  test('signal count is preserved after Vite HMR reload', async ({ page }) => {
    // Navigate to demo app (webServer config ensures Vite is running on :5173)
    await page.goto('/')

    // Wait for the app to render — "Streem Demo" heading should be visible
    await page.waitForSelector('h1', { timeout: 10_000 })
    const heading = await page.locator('h1').textContent()
    expect(heading).toContain('Streem')

    // Verify initial count is 0
    const countParagraph = page.locator('p', { hasText: 'Count:' })
    await expect(countParagraph).toContainText('Count: 0')

    // Increment count 3 times via button click
    const incrementBtn = page.locator('button', { hasText: 'Increment' })
    await incrementBtn.click()
    await incrementBtn.click()
    await incrementBtn.click()

    // Verify count is now 3
    await expect(countParagraph).toContainText('Count: 3')

    // Save original App.tsx content before triggering HMR
    const originalContent = readFileSync(APP_TSX_PATH, 'utf-8')

    try {
      // Trigger HMR: add a harmless comment to App.tsx — streemHMR plugin handles .tsx files
      const hmrContent = originalContent + '\n// hmr-e2e-trigger\n'
      writeFileSync(APP_TSX_PATH, hmrContent, 'utf-8')

      // Wait for HMR to propagate: Vite detects the file change, reloads the module,
      // main.tsx disposes the old tree and re-renders. The count signal's dispose handler
      // saved data.count = 3 before replacement; App.tsx restores it via getRestoredValue.
      // Poll for the paragraph to still show Count: 3 (not reset to 0).
      // Use waitForFunction to check DOM text — more reliable than waitForTimeout.
      await page.waitForFunction(
        () => {
          const paras = document.querySelectorAll('p')
          for (const p of paras) {
            if (p.textContent?.includes('Count: 3')) return true
          }
          return false
        },
        { timeout: 10_000, polling: 200 }
      )

      // Confirm count is 3 after HMR (not reset to initial 0)
      await expect(countParagraph).toContainText('Count: 3')

      // Also confirm page did NOT do a full reload (URL same, no navigation)
      expect(page.url()).toContain('localhost:5174')
    } finally {
      // Always restore original App.tsx content after test
      writeFileSync(APP_TSX_PATH, originalContent, 'utf-8')

      // Wait briefly for Vite to process the restore (prevents test pollution)
      await page.waitForTimeout(500)
    }
  })

  test('HMR reload does not fully reload the page (signal preserved, no navigation)', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Set count to 5
    const incrementBtn = page.locator('button', { hasText: 'Increment' })
    for (let i = 0; i < 5; i++) {
      await incrementBtn.click()
    }
    await expect(page.locator('p', { hasText: 'Count:' })).toContainText('Count: 5')

    // Track navigation events — a full page reload would fire
    let fullReloadOccurred = false
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) fullReloadOccurred = true
    })

    // Trigger HMR
    const originalContent = readFileSync(APP_TSX_PATH, 'utf-8')
    try {
      writeFileSync(APP_TSX_PATH, originalContent + '\n// test-hmr-no-reload\n', 'utf-8')

      // Wait for HMR
      await page.waitForFunction(
        () => {
          const paras = document.querySelectorAll('p')
          for (const p of paras) {
            if (p.textContent?.includes('Count: 5')) return true
          }
          return false
        },
        { timeout: 10_000, polling: 200 }
      )

      // Assert: no full page reload, count preserved
      expect(fullReloadOccurred).toBe(false)
      await expect(page.locator('p', { hasText: 'Count:' })).toContainText('Count: 5')
    } finally {
      writeFileSync(APP_TSX_PATH, originalContent, 'utf-8')
      await page.waitForTimeout(500)
    }
  })
})
