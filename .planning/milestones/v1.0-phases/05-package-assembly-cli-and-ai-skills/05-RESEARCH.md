# Phase 5: Package Assembly, CLI, and AI Skills - Research

**Researched:** 2026-02-28
**Domain:** npm create CLI scaffolding, monorepo meta-packages, AI skill file installation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Starter template scope:**
- Minimal boilerplate — not a feature showcase
- Demo app is a counter with a signal: one button, one reactive display, ~20 lines
- Scaffolded files: `index.html`, `src/main.tsx`, `src/App.tsx`, `tsconfig.json`, `vite.config.ts`, `package.json` — nothing else
- CLI prompts for: (1) project name, (2) package manager choice (npm / pnpm / yarn) — then auto-installs deps before handing off

**Meta-package API surface:**
- Flat re-exports from `/core`, `/dom`, `/streams` — everything at the top level: `import { signal, fromWebSocket, render } from 'streem'`
- Lit interop is NOT included in the `streem` meta-package — stays in `/lit` only (avoids Lit peer dep for users who don't need it)
- JSX runtime is configured via `jsxImportSource: "streem"` in tsconfig — not re-exported from the package
- Strict public API boundary: only developer-facing primitives are re-exported; internal helpers from sub-packages are not surfaced

**Skill file content and structure:**
- Each sub-skill (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) contains: function signatures, usage examples, common patterns, and a "Common mistakes" section
- Root `SKILL.md` uses a topic keyword routing table: "If working with signals → read signals.md", "If working with streams → read streaming.md", etc.
- Skill files are hand-written (curated, not generated from JSDoc) — prioritizes guidance quality over automation

**Install script behavior:**
- `install-streem-skill.mjs` prompts the user to select which AI tools to install into (checklist of supported tools: Claude, Codex, Copilot, Gemini, Windsurf, OpenCode)
- When a skill file already exists at the target location: ask "Streem skill already installed at X. Overwrite?" before proceeding
- Installs to each tool's conventional config location (not a flat single-file install)
- Supports `--dry-run` flag: preview what would be installed/overwritten without writing anything

### Claude's Discretion
- Exact visual styling of the counter demo (colors, layout)
- Internal folder structure within `.claude/skills/streem/` and equivalent tool directories
- Specific tool detection logic details (path resolution per OS)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DX-01 | Developer can bootstrap a new Streem project using `create-streem` (or `npm create streem@latest`) with a Vite template that has correct `jsxImportSource` config and TypeScript setup out of the box | `npm create` name convention, `@clack/prompts` for interactive CLI, template copy pattern from `create-vite`, existing `apps/demo` tsconfig/vite.config as reference template |
| SKILL-01 | Developer can run `install-streem-skill.mjs` to copy Streem's `SKILL.md` and sub-skill files into their AI tool directories (Claude, Codex, Copilot, Gemini, Windsurf, OpenCode) | Confirmed install paths per tool, `@clack/prompts` multiselect pattern, `--dry-run` flag pattern |
| SKILL-02 | Streem skill files use progressive disclosure — a root `SKILL.md` routes to topic sub-skills (`signals.md`, `streaming.md`, `components.md`, `lit-interop.md`) | SKILL.md YAML frontmatter format, routing table pattern documented |
</phase_requirements>

## Summary

Phase 5 assembles three previously isolated deliverables: (1) the `streem` meta-package that re-exports all three sub-packages as one import, (2) the `create-streem` CLI that scaffolds new projects following the `npm create vite@latest` pattern, and (3) the `install-streem-skill.mjs` script that installs skill files into AI tool directories across six supported tools.

All three deliverables have well-established patterns to follow. The meta-package is a simple barrel index that re-exports from `/core`, `/dom`, and `/streams` — the only non-trivial aspect is correctly threading the JSX runtime subpath exports so `jsxImportSource: "streem"` resolves to the right files. The `create-streem` CLI follows the exact structure of `create-vite` (itself now at v8.3.0), using `@clack/prompts` for interactive input and file-copy for templates. The install script is a standalone `.mjs` script with zero-dependency interactive prompts — using `@clack/prompts` for the tool selection checklist.

The primary complexity is the AI skill install paths, which differ per tool and must be confirmed. Research has confirmed six tool locations (Claude, Codex, Copilot, Gemini, Windsurf, OpenCode), each with project-scoped and user-scoped variants. The install script should default to project-scoped (`.claude/skills/` etc.) which is cross-tool compatible.

**Primary recommendation:** Follow the `create-vite` pattern verbatim for CLI structure — name `create-streem`, use `@clack/prompts`, copy files from `templates/default/`. Build the meta-package as `packages/streem` in the existing monorepo. Write the install script as a standalone `.mjs` file in `packages/streem/` that ships as part of the meta-package.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clack/prompts` | `^1.0.1` | Interactive CLI prompts (text, select, multiselect, confirm, spinner) | Used by `create-vite` since Feb 2025; 2.5M weekly downloads; replaces older `prompts` library |
| Node.js built-ins | ESM | File system operations (`fs/promises`, `path`, `url`) | Zero dependencies for file copy; `fileURLToPath` for `__dirname` equivalent in ESM |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `picocolors` | `^1.x` | Terminal colors (no deps, tiny) | Styling output messages in CLI |
| `tsup` | `^8.x` | Building the CLI entry to a single `dist/index.js` with hashbang support | Only if TypeScript is used for CLI source; preferred over Vite for CLI executables |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@clack/prompts` | `inquirer` | inquirer is heavier (12KB+ vs 3KB); @clack/prompts has cleaner visual output |
| `@clack/prompts` | `prompts` | `prompts` is older; create-vite migrated away from it to @clack/prompts in Feb 2025 |
| `tsup` for CLI build | Vite library mode | Vite library mode cannot preserve `#!/usr/bin/env node` hashbangs — confirmed Vite GitHub issue #18871 |
| Direct `.mjs` script | Compiled TypeScript | The install script (`install-streem-skill.mjs`) can be pure JavaScript `.mjs` — no build step needed |

**Installation:**
```bash
# For create-streem package
pnpm add -D @clack/prompts picocolors tsup --filter create-streem

# For streem meta-package (no runtime deps — just re-exports)
# No additional dependencies needed
```

## Architecture Patterns

### Recommended Project Structure

```
packages/
├── streem/                    # Meta-package: the "streem" npm package
│   ├── src/
│   │   └── index.ts           # Flat re-exports from /core, /dom, /streams
│   ├── skills/
│   │   ├── SKILL.md           # Root skill with topic routing table
│   │   ├── signals.md         # Signal sub-skill
│   │   ├── streaming.md       # Streaming sub-skill
│   │   ├── components.md      # Component model sub-skill
│   │   └── lit-interop.md     # Lit interop sub-skill
│   ├── install-streem-skill.mjs   # Standalone install script
│   ├── package.json
│   └── vite.config.ts         # Build config for meta-package
│
├── create-streem/             # CLI scaffolder: the "create-streem" npm package
│   ├── src/
│   │   └── index.ts           # CLI entry (compiled to dist/index.js)
│   ├── templates/
│   │   └── default/           # Template files (copied verbatim)
│   │       ├── index.html
│   │       ├── package.json   # Template package.json (uses TOKEN replacement for name)
│   │       ├── tsconfig.json
│   │       ├── vite.config.ts
│   │       └── src/
│   │           ├── main.tsx
│   │           └── App.tsx
│   ├── package.json
│   └── tsup.config.ts
```

### Pattern 1: npm create Convention

**What:** `npm create streem@latest` automatically downloads and runs the package named `create-streem`. The `bin` field points to the CLI entry.

**When to use:** This is the only correct pattern for `npm create` compatibility.

**Example:**
```json
// create-streem/package.json
{
  "name": "create-streem",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "create-streem": "dist/index.js"
  },
  "files": ["dist", "templates"],
  "engines": { "node": ">=20.19.0" }
}
```

```typescript
// create-streem/src/index.ts — top of file
#!/usr/bin/env node
// Note: tsup preserves this shebang when building

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

  // Copy template
  await mkdir(targetDir, { recursive: true })
  await cp(templateDir, targetDir, { recursive: true })

  // Patch package.json with project name
  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = projectName
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  // Install deps
  const spinner = p.spinner()
  spinner.start('Installing dependencies...')
  spawnSync(pkgManager as string, ['install'], { cwd: targetDir, stdio: 'inherit' })
  spinner.stop('Dependencies installed')

  p.outro(`Done! cd ${projectName} && ${pkgManager} run dev`)
}

main().catch(console.error)
```

### Pattern 2: Meta-Package Barrel with JSX Subpath Exports

**What:** The `streem` package re-exports everything from sub-packages AND exposes `jsx-runtime`/`jsx-dev-runtime` subpath exports so `jsxImportSource: "streem"` works.

**When to use:** Required for `import { signal, render } from 'streem'` and `jsxImportSource: "streem"` to both work.

**Example:**
```typescript
// packages/streem/src/index.ts
// Core signals
export { signal, computed, effect, createRoot, onCleanup, getOwner, runWithOwner, batch } from '/core'
export type { Signal, Owner } from '/core'

// DOM / JSX runtime
export { h, Fragment, render, onMount, Show, For, ErrorBoundary, Suspense } from '/dom'

// Streaming primitives
export { fromWebSocket, fromSSE, fromReadable, fromObservable, throttle, debounce } from '/streams'
export type { StreamStatus, StreamTuple, WebSocketOptions, SSEOptions } from '/streams'

// NOTE: Do NOT export: startBatch, endBatch, HMR utilities, streemHMR plugin, internal helpers
// NOTE: Do NOT re-export from /lit (Lit peer dep must remain opt-in)
```

```json
// packages/streem/package.json — exports field
{
  "name": "streem",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./jsx-runtime": {
      "import": "./dist/jsx-runtime.js",
      "types": "./dist/jsx-runtime.d.ts"
    },
    "./jsx-dev-runtime": {
      "import": "./dist/jsx-dev-runtime.js",
      "types": "./dist/jsx-dev-runtime.d.ts"
    }
  }
}
```

```typescript
// packages/streem/src/jsx-runtime.ts — re-export from /dom
export * from '/dom/jsx-runtime'
```

### Pattern 3: AI Skill Install Script

**What:** A standalone ESM script (`.mjs`) that presents a checklist of AI tools, confirms overwrites, and copies skill files to correct per-tool directories.

**When to use:** SKILL-01 requirement. Ships as `install-streem-skill.mjs` in the `streem` package.

**Example:**
```javascript
// packages/streem/install-streem-skill.mjs
#!/usr/bin/env node
import * as p from '@clack/prompts'
import { cp, access, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import process from 'node:process'

const skillsSourceDir = resolve(fileURLToPath(import.meta.url), '../skills')
const isDryRun = process.argv.includes('--dry-run')

const TOOLS = [
  { id: 'claude',   label: 'Claude Code',     projectPath: '.claude/skills/streem',        globalPath: `${homedir()}/.claude/skills/streem` },
  { id: 'codex',    label: 'Codex',           projectPath: '.codex/skills/streem',         globalPath: `${homedir()}/.codex/skills/streem` },
  { id: 'copilot',  label: 'GitHub Copilot',  projectPath: '.github/skills/streem',        globalPath: `${homedir()}/.copilot/skills/streem` },
  { id: 'gemini',   label: 'Gemini CLI',      projectPath: '.gemini/skills/streem',        globalPath: `${homedir()}/.gemini/skills/streem` },
  { id: 'windsurf', label: 'Windsurf',        projectPath: '.windsurf/skills/streem',      globalPath: `${homedir()}/.windsurf/skills/streem` },
  { id: 'opencode', label: 'OpenCode',        projectPath: '.opencode/skills/streem',      globalPath: `${homedir()}/.config/opencode/skills/streem` },
]

async function pathExists(p) {
  try { await access(p); return true } catch { return false }
}

async function main() {
  p.intro(isDryRun ? 'install-streem-skill [dry run]' : 'install-streem-skill')

  const scope = await p.select({
    message: 'Install scope:',
    options: [
      { value: 'project', label: 'Project (current directory)' },
      { value: 'global',  label: 'Global (home directory)' },
    ],
  })
  if (p.isCancel(scope)) { p.cancel('Cancelled'); process.exit(0) }

  const selectedTools = await p.multiselect({
    message: 'Install into:',
    options: TOOLS.map(t => ({ value: t.id, label: t.label })),
    required: true,
  })
  if (p.isCancel(selectedTools)) { p.cancel('Cancelled'); process.exit(0) }

  for (const toolId of selectedTools) {
    const tool = TOOLS.find(t => t.id === toolId)
    const targetPath = scope === 'project'
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
```

### Pattern 4: SKILL.md Root Routing Table

**What:** Root `SKILL.md` contains YAML frontmatter and a topic routing table as the first content — directing the AI to the correct sub-skill file.

**When to use:** SKILL-02 requirement. All skill files must follow the SKILL.md frontmatter format.

**Example:**
```markdown
---
name: streem
description: Streem reactive framework — signals, streaming, and JSX-based DOM rendering
---
# Streem Framework

Use this skill when working with the Streem framework.

## Topic Routing

| If you are working with... | Read this file |
|---------------------------|----------------|
| Signals, computed, effect | `signals.md` |
| Streams, WebSocket, SSE   | `streaming.md` |
| Components, JSX, render   | `components.md` |
| Lit web components        | `lit-interop.md` |

For general framework questions, the sections below provide an overview.
```

### Anti-Patterns to Avoid

- **Vite library mode for the CLI entry:** Vite cannot preserve `#!/usr/bin/env node` hashbangs. Use tsup for `create-streem`, which handles hashbangs automatically.
- **Re-exporting HMR utilities from `streem`:** `registerForHMR`, `getRestoredValue`, `saveToHotData`, `streemHMR` are Vite dev internals — do not surface in the public API.
- **Re-exporting `startBatch`/`endBatch` from `streem`:** These are low-level internal batch primitives; only `batch()` from `/streams` combinators is developer-facing.
- **Including `/lit` in the meta-package:** Would force Lit as a peer dep for all users. Lit stays in `/lit` only.
- **Flat skill file install (single SKILL.md):** Each tool expects a `streem/` folder with `SKILL.md` inside, not a single file. Use `cp -r skills/ targetPath`.
- **Missing `jsx-runtime` subpath export from `streem`:** Without it, `jsxImportSource: "streem"` fails to resolve — TypeScript cannot find `streem/jsx-runtime`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive CLI prompts | Custom readline/stdin handler | `@clack/prompts` | Handles TTY detection, SIGINT gracefully, Windows compatibility, cancel signals |
| Hashbang preservation in build | Chmod scripts or postbuild hooks | `tsup` (handles automatically) | tsup detects `#!/usr/bin/env node` and marks output executable |
| Package manager detection | `process.env.npm_config_user_agent` parsing | Prompt user explicitly (per CONTEXT.md decision) | `npm_config_user_agent` is unreliable when binary is invoked globally |
| Template variable replacement | Custom templating engine | Simple `JSON.parse` + field mutation for `package.json`; verbatim copy for everything else | create-vite uses this pattern — only `package.json` needs patching |

**Key insight:** The create-vite source is the definitive reference for `create-streem`. Its Feb 2025 migration to `@clack/prompts` (PR #19445) made it the best-practice template for this exact problem.

## Common Pitfalls

### Pitfall 1: Missing `jsx-runtime` Subpath Export

**What goes wrong:** Developer sets `jsxImportSource: "streem"` in tsconfig but TypeScript reports "Cannot find module 'streem/jsx-runtime'".

**Why it happens:** TypeScript resolves `jsxImportSource: "streem"` by looking for `streem/jsx-runtime` in the package's `exports` map. If there is no `"./jsx-runtime"` entry, the import fails.

**How to avoid:** The `streem` meta-package MUST include three entries in `exports`: `.` (main), `./jsx-runtime`, and `./jsx-dev-runtime`. The `jsx-runtime.ts` source simply re-exports from `/dom/jsx-runtime`.

**Warning signs:** TypeScript error `Module 'streem/jsx-runtime' has no exported member 'jsx'` or similar.

### Pitfall 2: Exporting Internal Helpers in the Meta-Package

**What goes wrong:** Internal helpers like `startBatch`, `endBatch`, `getOwner`, HMR utilities are re-exported from `streem`, polluting the public API surface and creating misleading TypeScript autocomplete.

**Why it happens:** A naive `export * from '/core'` catches everything including internals.

**How to avoid:** Use named exports only — explicitly list each exported symbol in `packages/streem/src/index.ts`. Never use `export *` for sub-packages.

**Warning signs:** The `streem` package's TypeScript autocomplete shows symbols like `setCurrentEffectCleanupTarget`, `disposeEffect`, `registerForHMR`.

### Pitfall 3: Template `package.json` Using `workspace:*` Dependencies

**What goes wrong:** The scaffolded project's `package.json` references `/dom: "workspace:*"` — which only resolves inside the monorepo. A user outside the monorepo gets an install error.

**Why it happens:** Copying the `apps/demo` package.json verbatim without substituting workspace links with semver versions.

**How to avoid:** The template `package.json` must use published semver versions (e.g., `"/core": "^0.1.0"`) or `"latest"` — never `workspace:*`.

**Warning signs:** `pnpm install` in the scaffolded project fails with "No matching version found for /core@workspace:*".

### Pitfall 4: `@clack/prompts` `isCancel` Not Checked

**What goes wrong:** User presses Ctrl+C during a prompt and the script continues with `undefined` as the value, causing crashes or nonsensical output.

**Why it happens:** `@clack/prompts` returns a special cancel symbol when the user aborts — not an exception. Callers must check `p.isCancel(value)` after every prompt.

**How to avoid:** After every `await p.text()`, `await p.select()`, `await p.multiselect()`, or `await p.confirm()` call, check `if (p.isCancel(result)) { p.cancel('Cancelled'); process.exit(0) }`.

**Warning signs:** Script produces `TypeError: Cannot read properties of Symbol` after Ctrl+C.

### Pitfall 5: Skill File Copy Loses Nested Structure

**What goes wrong:** Only `SKILL.md` is copied to the target directory — sub-skill files (`signals.md`, etc.) are missing.

**Why it happens:** Using `fs.copyFile` for a single file instead of `fs.cp(src, dest, { recursive: true })` for the directory.

**How to avoid:** The install script must copy the entire `skills/` directory recursively. The source is a folder named `streem/` containing `SKILL.md` + sub-skills. Use `cp(skillsSourceDir, targetPath, { recursive: true, force: true })`.

**Warning signs:** AI tools report skill loaded but cannot read `signals.md` because it does not exist.

### Pitfall 6: `/dom` Dependencies Not Externalized in Meta-Package Build

**What goes wrong:** The `streem` meta-package bundles the source of `/core`, `/dom`, `/streams` into a single file. Users get duplicate code if they also import sub-packages directly.

**Why it happens:** Vite `lib` mode bundles all imports unless explicitly externalized.

**How to avoid:** The meta-package's `vite.config.ts` must list all three sub-packages in `rollupOptions.external`. They become peer/runtime dependencies, not bundled code.

**Warning signs:** `dist/index.js` is 50KB+ instead of ~200 bytes.

## Code Examples

### Correct Template tsconfig.json (for create-streem template)

```json
// templates/default/tsconfig.json
// Source: apps/demo/tsconfig.json (confirmed working pattern from Phase 2)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "jsxImportSource": "streem",
    "noEmit": true
  },
  "include": ["src"]
}
```

### Correct Template vite.config.ts

```typescript
// templates/default/vite.config.ts
// Source: apps/demo/vite.config.ts pattern
import { defineConfig } from 'vite'
import { streemHMR } from 'streem'

export default defineConfig({
  plugins: [streemHMR()],
})
```

### Correct Counter App (template App.tsx)

```tsx
// templates/default/src/App.tsx
// Source: CONTEXT.md locked decision — ~20 lines, counter with signal
import { signal } from 'streem'

const count = signal(0)

export function App() {
  return (
    <div>
      <h1>Streem Counter</h1>
      <p>Count: {() => count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
    </div>
  )
}
```

### Correct Meta-Package Vite Config

```typescript
// packages/streem/vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'jsx-runtime': 'src/jsx-runtime.ts',
        'jsx-dev-runtime': 'src/jsx-dev-runtime.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['/core', '/dom', '/streams'],
    },
    target: 'es2022',
    minify: false,
  },
  plugins: [dts({ rollupTypes: true })],
})
```

### AI Tool Install Paths — Complete Reference

```
Claude Code:
  Project:  .claude/skills/streem/
  Global:   ~/.claude/skills/streem/

Codex:
  Project:  .codex/skills/streem/   OR   .agents/skills/streem/
  Global:   ~/.codex/skills/streem/

GitHub Copilot (VS Code):
  Project:  .github/skills/streem/  OR   .claude/skills/streem/
  Global:   ~/.copilot/skills/streem/

Gemini CLI:
  Project:  .gemini/skills/streem/  OR   .agents/skills/streem/
  Global:   ~/.gemini/skills/streem/

Windsurf:
  Project:  .windsurf/skills/streem/
  Global:   ~/.windsurf/skills/streem/

OpenCode:
  Project:  .opencode/skills/streem/  OR   .claude/skills/streem/
  Global:   ~/.config/opencode/skills/streem/
```

Note: `.claude/skills/streem/` is recognized by Claude Code, GitHub Copilot, AND OpenCode — making it the de facto universal project path. The install script should offer it as the default.

### SKILL.md Frontmatter Format (Universal)

```markdown
---
name: streem
description: Streem reactive framework — use when working with signals, streams, or JSX components
---
```

- `name`: required, lowercase, hyphens only, 1-64 chars (matches the skill's folder name)
- `description`: required, 1-1024 chars — used by AI tools for skill discovery

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prompts` library for CLI input | `@clack/prompts` | Feb 2025 (create-vite PR #19445) | Smaller bundle, better visual output |
| `.claude/commands/*.md` for skills | `.claude/skills/<name>/SKILL.md` | Late 2025 | Directory-based skills support sub-files; commands are legacy |
| Separate skill installs per tool | Universal `.claude/skills/` path accepted by 3+ tools | 2025-2026 | One path serves Claude, Copilot, OpenCode simultaneously |
| `chmod +x` post-build scripts | tsup auto-detects hashbang and marks output executable | Current | No post-build step needed for CLI packages |

**Deprecated/outdated:**
- `.claude/commands/` directory: still works but `skills/` is the modern standard; planner should use `skills/`
- `prompts` npm package: replaced by `@clack/prompts` in the create-vite ecosystem
- `inquirer` for new CLIs: high overhead; `@clack/prompts` is the 2025 standard

## Open Questions

1. **`streemHMR` export from `streem` meta-package**
   - What we know: `streemHMR` is a Vite plugin exported from `/dom`. The demo's `vite.config.ts` uses it. The template's `vite.config.ts` needs it.
   - What's unclear: Should `streemHMR` be re-exported from `streem` (making the template use `import { streemHMR } from 'streem'`) or should it come from `/dom`?
   - Recommendation: Re-export `streemHMR` from `streem` to keep the template's imports minimal — the template should only depend on `streem`, not `/dom`. This is a developer-facing primitive.

2. **`create-streem` package location in monorepo**
   - What we know: The monorepo has `packages/` and `apps/`. `pnpm-workspace.yaml` includes `packages/*`.
   - What's unclear: Should `create-streem` live in `packages/create-streem/` (auto-discovered by workspace) or somewhere else?
   - Recommendation: `packages/create-streem/` — consistent with existing pattern, auto-included in workspace.

3. **Template `package.json` version pinning**
   - What we know: Templates must use semver, not `workspace:*`.
   - What's unclear: Should template use `"^0.1.0"` (current version) or `"latest"`?
   - Recommendation: Use `"latest"` in the template to always get the current release. Version pinning during scaffold is unnecessary — user will lock versions at install time.

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — section skipped.

## Sources

### Primary (HIGH confidence)
- `apps/demo/tsconfig.json`, `vite.config.ts` — confirmed working `jsxImportSource: "/dom"` pattern (direct file inspection)
- `packages/*/package.json` — confirmed sub-package names, versions, exports fields (direct file inspection)
- `packages/*/src/index.ts` — confirmed public API symbols for each sub-package (direct file inspection)
- https://opencode.ai/docs/skills/ — OpenCode skills directory paths (official docs, WebFetch confirmed)
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills — Copilot skill paths (official docs, WebFetch confirmed)

### Secondary (MEDIUM confidence)
- https://github.com/vitejs/vite/tree/main/packages/create-vite — create-vite structure and `@clack/prompts` usage (verified via WebSearch PR #19445 + WebFetch)
- https://www.npmjs.com/package/@clack/prompts — @clack/prompts v1.0.1 API, 2.5M weekly downloads (verified via WebSearch)
- WebSearch "Codex skill files install location" — confirmed `~/.codex/skills/` and `.codex/skills/` paths (multiple sources agree)
- WebSearch "Gemini CLI skill files install location" — confirmed `.gemini/skills/` and `~/.gemini/skills/` (multiple sources agree)
- WebSearch "Windsurf AI skills config location" — confirmed `.windsurf/skills/` (official docs + multiple sources)

### Tertiary (LOW confidence)
- tsup `bin` hashbang auto-detection — mentioned in multiple sources but not tested against this specific use case; validate during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@clack/prompts` confirmed in create-vite source; Node.js built-ins are stable
- Architecture: HIGH — meta-package pattern is straightforward re-export; create-vite pattern is well-documented; skill paths verified from official docs
- Pitfalls: HIGH — most pitfalls derived from direct inspection of existing codebase (confirmed sub-package API boundaries, confirmed workspace:* problem)

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (skill install paths are stable; @clack/prompts API is stable at v1.x)
