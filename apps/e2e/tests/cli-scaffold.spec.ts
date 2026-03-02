import { test, expect } from '@playwright/test'
import { spawnSync, spawn } from 'node:child_process'
import {
  mkdtempSync,
  existsSync,
  rmSync,
  writeFileSync,
  readFileSync,
  renameSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const MONOREPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../..')
const CREATE_STREEM_DIR = join(MONOREPO_ROOT, 'packages/create-streem')
const STREEM_PKG_DIR = join(MONOREPO_ROOT, 'packages/streem')
const PROJECT_NAME = 'e2e-scaffold-test'

/**
 * Wait for a directory to appear on disk, polling every 500ms.
 * Returns true if found within maxWaitMs, false if timed out.
 */
function waitForDirectory(dirPath: string, maxWaitMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + maxWaitMs
    const check = () => {
      if (existsSync(dirPath) && existsSync(join(dirPath, 'package.json'))) {
        resolve(true)
        return
      }
      if (Date.now() >= deadline) {
        resolve(false)
        return
      }
      setTimeout(check, 500)
    }
    check()
  })
}

test.describe('TEST-01: create-streem CLI scaffold', () => {
  let tmpDir: string

  test.beforeAll(async () => {
    // Build the CLI first — ensures dist/index.js is fresh
    const buildResult = spawnSync('pnpm', ['build'], {
      cwd: CREATE_STREEM_DIR,
      encoding: 'utf-8',
      shell: process.platform === 'win32',
    })
    if (buildResult.status !== 0) {
      throw new Error(`create-streem build failed:\n${buildResult.stderr}`)
    }

    // Also ensure the local streem package is built (needed for dependency override)
    const streemBuildResult = spawnSync('pnpm', ['build'], {
      cwd: STREEM_PKG_DIR,
      encoding: 'utf-8',
      shell: process.platform === 'win32',
    })
    if (streemBuildResult.status !== 0) {
      throw new Error(`streem build failed:\n${streemBuildResult.stderr}`)
    }

    // Create isolated temp directory for scaffold output
    tmpDir = mkdtempSync(join(tmpdir(), 'streem-e2e-'))
  })

  test.afterAll(() => {
    // Clean up temp directory after tests
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
    // Also clean up any scaffold dir left in create-streem cwd (in case of test failure)
    const cliCwdScaffold = join(CREATE_STREEM_DIR, PROJECT_NAME)
    if (existsSync(cliCwdScaffold)) {
      rmSync(cliCwdScaffold, { recursive: true, force: true })
    }
  })

  test('scaffolds a project that builds successfully', async () => {
    test.setTimeout(300_000) // 5 minutes: CLI + npm install + build

    // The CLI uses @clack/prompts which requires a real TTY for interactive input.
    // We use `expect` (TCL automation tool, available on macOS and Linux) to
    // drive the CLI interactively via a pseudo-terminal.
    //
    // Key: spawn expect as a background process (don't wait for it to exit),
    // then poll for the scaffold directory to appear. The clack/prompts `block()`
    // function keeps the node process alive for ~60s after completion in PTY mode,
    // so we never wait for expect to exit — we kill it after the files appear.
    const expectScript = [
      'set timeout 30',
      `cd ${CREATE_STREEM_DIR}`,
      'spawn node dist/index.js',
      'expect "Project name:"',
      `send "${PROJECT_NAME}\\r"`,
      'expect "Package manager:"',
      'send "\\r"',
      // Wait for either success or install outcome (don't wait for eof — see block() note above)
      'expect {',
      '    "Done!" { }',
      '    "Install failed" { }',
      '    "Dependencies installed" { }',
      '    timeout { exit 1 }',
      '}',
      // The directory IS created before this point; clack keeps process alive ~60s
      // so we exit expect here (process gets SIGHUP and eventually dies)
      'exit 0',
    ].join('\n')

    const expectScriptPath = join(tmpDir, 'scaffold.exp')
    writeFileSync(expectScriptPath, expectScript)

    const scaffoldedDir = join(CREATE_STREEM_DIR, PROJECT_NAME)

    // Spawn expect in background — don't block on it
    const expectProc = spawn('expect', [expectScriptPath], {
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: 'ignore',
      detached: false,
    })

    // Poll until scaffold directory appears (files are created before npm install)
    // The CLI copies template files then runs npm install; directory appears within ~5s
    const appeared = await waitForDirectory(scaffoldedDir, 60_000)

    // Kill the expect process (it may be waiting for the internal npm install)
    expectProc.kill('SIGKILL')

    expect(appeared, `Scaffold directory not created within 60s at ${scaffoldedDir}`).toBe(true)
    expect(existsSync(join(scaffoldedDir, 'src/main.tsx'))).toBe(true)
    expect(existsSync(join(scaffoldedDir, 'src/App.tsx'))).toBe(true)
    expect(existsSync(join(scaffoldedDir, 'vite.config.ts'))).toBe(true)

    // Patch package.json: replace "streeem": "latest" with local workspace package.
    // The template uses "streeem": "latest" which is not available in local dev.
    // We override with file: path to the local built streeem package.
    const pkgJsonPath = join(scaffoldedDir, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    pkg.dependencies = pkg.dependencies ?? {}
    pkg.dependencies['streeem'] = `file:${STREEM_PKG_DIR}`
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n')

    // Install dependencies using npm (CLI selected npm as package manager)
    const installResult = spawnSync('npm', ['install'], {
      cwd: scaffoldedDir,
      encoding: 'utf-8',
      timeout: 90_000,
      shell: process.platform === 'win32',
    })
    expect(
      installResult.status,
      `npm install failed:\n${installResult.stderr}`
    ).toBe(0)

    // Run npm run build — core assertion: scaffold builds without errors
    const buildResult = spawnSync('npm', ['run', 'build'], {
      cwd: scaffoldedDir,
      encoding: 'utf-8',
      timeout: 60_000,
      shell: process.platform === 'win32',
    })
    expect(
      buildResult.status,
      `npm run build failed:\n${buildResult.stderr}\n${buildResult.stdout}`
    ).toBe(0)

    // Move to tmpDir for cleanup
    renameSync(scaffoldedDir, join(tmpDir, PROJECT_NAME))
  })
})
