#!/usr/bin/env node
import * as p from '@clack/prompts'
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const templateDir = resolve(fileURLToPath(import.meta.url), '../../templates/default')
const skillsDir = resolve(fileURLToPath(import.meta.url), '../../skills')

const TOOL_TARGETS = [
  { key: 'agents',         label: 'Agents',         relPath: ['.agents', 'skills'] },
  { key: 'claude',         label: 'Claude Code',     relPath: ['.claude', 'skills'] },
  { key: 'codex',          label: 'Codex',           relPath: ['.codex', 'skills'] },
  { key: 'gemini',         label: 'Gemini',          relPath: ['.gemini', 'skills'] },
  { key: 'copilot',        label: 'Copilot',         relPath: ['.copilot', 'skills'] },
  { key: 'github-copilot', label: 'GitHub Copilot',  relPath: ['.config', 'github-copilot', 'skills'] },
  { key: 'windsurf',       label: 'Windsurf',        relPath: ['.codeium', 'windsurf', 'skills'] },
  { key: 'opencode',       label: 'OpenCode',        relPath: ['.config', 'opencode', 'skills'] },
]

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

  // Skill injection
  let skillNames: string[] = []
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true })
    skillNames = entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch {
    // no skills bundled
  }

  if (skillNames.length > 0) {
    const selectedTools = await p.multiselect({
      message: 'Inject streem agent skills into AI tool directories? (space to select, enter to confirm)',
      options: TOOL_TARGETS.map(t => ({
        value: t.key,
        label: t.label,
        hint: `~/${t.relPath.join('/')}`,
      })),
      required: false,
    })

    if (!p.isCancel(selectedTools) && (selectedTools as string[]).length > 0) {
      const injectSpinner = p.spinner()
      injectSpinner.start('Injecting skills...')

      const homeDir = os.homedir()
      for (const toolKey of selectedTools as string[]) {
        const tool = TOOL_TARGETS.find(t => t.key === toolKey)!
        for (const skillName of skillNames) {
          const dest = join(homeDir, ...tool.relPath, skillName)
          await mkdir(dest, { recursive: true })
          await cp(join(skillsDir, skillName), dest, { recursive: true, force: true })
        }
      }

      const toolLabels = (selectedTools as string[])
        .map(k => TOOL_TARGETS.find(t => t.key === k)!.label)
        .join(', ')
      injectSpinner.stop(`Skills injected into: ${toolLabels}`)
    }
  }

  p.outro(`Done! cd ${projectName} && ${pkgManager} run dev`)
}

main().catch(console.error)
