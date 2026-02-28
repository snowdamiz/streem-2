#!/usr/bin/env node
import * as p from '@clack/prompts'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const templateDir = resolve(fileURLToPath(import.meta.url), '../../templates/default')

async function main() {
  p.intro('create-streem')

  const projectName = await p.text({
    message: 'Project name:',
    defaultValue: 'my-streem-app',
    placeholder: 'my-streem-app',
  })
  if (p.isCancel(projectName)) { p.cancel('Cancelled'); process.exit(0) }

  const pkgManager = await p.select({
    message: 'Package manager:',
    options: [
      { value: 'npm', label: 'npm' },
      { value: 'pnpm', label: 'pnpm' },
      { value: 'yarn', label: 'yarn' },
    ],
  })
  if (p.isCancel(pkgManager)) { p.cancel('Cancelled'); process.exit(0) }

  const targetDir = resolve(process.cwd(), projectName as string)

  // Copy template files
  await mkdir(targetDir, { recursive: true })
  await cp(templateDir, targetDir, { recursive: true })

  // Patch package.json with user-supplied project name
  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = projectName
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  // Install dependencies
  const spinner = p.spinner()
  spinner.start('Installing dependencies...')
  const result = spawnSync(pkgManager as string, ['install'], {
    cwd: targetDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status === 0) {
    spinner.stop('Dependencies installed')
  } else {
    spinner.stop('Install failed — run manually')
  }

  p.outro(`Done! cd ${projectName} && ${pkgManager} run dev`)
}

main().catch(console.error)
