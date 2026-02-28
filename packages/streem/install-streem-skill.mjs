#!/usr/bin/env node
import * as p from '@clack/prompts'
import { cp, access, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import process from 'node:process'

const skillsSourceDir = resolve(fileURLToPath(import.meta.url), '../skills')
const isDryRun = process.argv.includes('--dry-run')

const TOOLS = [
  {
    id: 'claude',
    label: 'Claude Code',
    projectPath: '.claude/skills/streem',
    globalPath: `${homedir()}/.claude/skills/streem`,
  },
  {
    id: 'codex',
    label: 'Codex',
    projectPath: '.codex/skills/streem',
    globalPath: `${homedir()}/.codex/skills/streem`,
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    projectPath: '.github/skills/streem',
    globalPath: `${homedir()}/.copilot/skills/streem`,
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    projectPath: '.gemini/skills/streem',
    globalPath: `${homedir()}/.gemini/skills/streem`,
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    projectPath: '.windsurf/skills/streem',
    globalPath: `${homedir()}/.windsurf/skills/streem`,
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    projectPath: '.opencode/skills/streem',
    globalPath: `${homedir()}/.config/opencode/skills/streem`,
  },
]

async function pathExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function main() {
  p.intro(isDryRun ? 'install-streem-skill [dry run]' : 'install-streem-skill')

  const scope = await p.select({
    message: 'Install scope:',
    options: [
      { value: 'project', label: 'Project (current directory)' },
      { value: 'global', label: 'Global (home directory)' },
    ],
  })
  if (p.isCancel(scope)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  const selectedTools = await p.multiselect({
    message: 'Install into:',
    options: TOOLS.map((t) => ({ value: t.id, label: t.label })),
    required: true,
  })
  if (p.isCancel(selectedTools)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  for (const toolId of selectedTools) {
    const tool = TOOLS.find((t) => t.id === toolId)
    const targetPath =
      scope === 'project'
        ? resolve(process.cwd(), tool.projectPath)
        : tool.globalPath

    const exists = await pathExists(targetPath)
    if (exists) {
      const overwrite = await p.confirm({
        message: `Streem skill already installed at ${targetPath}. Overwrite?`,
      })
      if (p.isCancel(overwrite) || !overwrite) {
        p.log.warn(`Skipped ${tool.label}`)
        continue
      }
    }

    if (!isDryRun) {
      await mkdir(targetPath, { recursive: true })
      await cp(skillsSourceDir, targetPath, { recursive: true, force: true })
      p.log.success(`Installed into ${targetPath}`)
    } else {
      p.log.info(`[dry-run] Would install to ${targetPath}`)
    }
  }

  p.outro('Done!')
}

main().catch(console.error)
