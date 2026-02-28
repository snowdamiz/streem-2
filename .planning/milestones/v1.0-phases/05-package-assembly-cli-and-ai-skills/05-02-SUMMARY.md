---
phase: 05-package-assembly-cli-and-ai-skills
plan: "02"
subsystem: create-streem
tags: [cli, scaffolder, create, template, dx]
dependency_graph:
  requires: []
  provides: [create-streem-cli, project-template]
  affects: [end-user-dx]
tech_stack:
  added:
    - "@clack/prompts ^1.0.1 — interactive terminal prompts"
    - "picocolors ^1.1.1 — terminal color output"
    - "tsup ^8.4.0 — CLI build bundler"
  patterns:
    - "ESM CLI with #!/usr/bin/env node shebang detected by tsup"
    - "cp(templateDir, targetDir, { recursive: true }) for template copying"
    - "JSON parse/patch/write for package.json customization"
    - "spawnSync for cross-platform dependency installation"
key_files:
  created:
    - packages/create-streem/package.json
    - packages/create-streem/tsup.config.ts
    - packages/create-streem/tsconfig.json
    - packages/create-streem/src/index.ts
    - packages/create-streem/templates/default/index.html
    - packages/create-streem/templates/default/package.json
    - packages/create-streem/templates/default/tsconfig.json
    - packages/create-streem/templates/default/vite.config.ts
    - packages/create-streem/templates/default/src/main.tsx
    - packages/create-streem/templates/default/src/App.tsx
  modified: []
decisions:
  - "Template package.json uses \"streem\": \"latest\" (not workspace:*) — prevents install failures outside monorepo"
  - "Template tsconfig.json is standalone (no extends) — user projects won't have tsconfig.base.json"
  - "Template jsxImportSource is \"streem\" (not \"@streem/dom\") — uses the published meta-package"
  - "Template vite.config.ts imports streemHMR from \"streem\" — consistent with meta-package API"
metrics:
  duration: "102s"
  completed_date: "2026-02-28"
  tasks_completed: 2
  files_created: 10
---

# Phase 5 Plan 02: create-streem CLI Scaffolder Summary

**One-liner:** Interactive `npm create streem@latest` CLI that prompts for project name and package manager, copies a 6-file Vite+Streem template, patches package.json, and installs dependencies.

## What Was Built

The `create-streem` package at `packages/create-streem/` provides a developer-facing scaffold experience matching the `npm create vite@latest` pattern:

1. **CLI entry** (`src/index.ts`) — uses `@clack/prompts` for an interactive terminal flow: project name, package manager selection (npm/pnpm/yarn), then copies template + patches package.json + runs install.

2. **6-file template** at `templates/default/`:
   - `index.html` — standard HTML entry with `#app` div
   - `package.json` — uses `"streem": "latest"` (published semver, never `workspace:*`)
   - `tsconfig.json` — standalone config with `jsxImportSource: "streem"` and `jsx: "react-jsx"`
   - `vite.config.ts` — imports `streemHMR` from `"streem"` (the meta-package)
   - `src/main.tsx` — `render(App, ...)` entry point
   - `src/App.tsx` — counter component with `signal` from `"streem"`, ~20 lines

3. **Build** — tsup compiles to `dist/index.js` with `#!/usr/bin/env node` shebang (ESM, node20 target).

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Scaffold create-streem package (package.json, tsup, tsconfig, CLI entry) | 7f8f4f9 |
| 2 | Create 6 template files for scaffolded project | cc66972 |

## Verification Results

- `pnpm --filter create-streem build` exits 0 — build clean
- `dist/index.js` line 1: `#!/usr/bin/env node` — shebang present
- Template `package.json`: `"streem": "latest"` confirmed
- Template `tsconfig.json`: `"jsxImportSource": "streem"` confirmed
- Template `vite.config.ts`: imports `streemHMR` from `'streem'` confirmed
- Template `src/App.tsx`: counter component using `signal` from `'streem'`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
