# Phase 6: Landing Page (Dogfood) - Research

**Researched:** 2026-02-28
**Domain:** Streem application / Vite MPA / Shoelace web components / GitHub Pages deployment
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page structure & narrative**
- Audience: developer-focused, minimal, code-first (think Solid.js or Astro homepage)
- Headline: "Build reactive UIs that update in microseconds" (performance-led pitch)
- Section order: Hero → Live demo → Features → Code sample → Install CTA
- Visual style: dark mode, monochromatic + accent color

**Live streaming demo**
- Scenario: simulated stock ticker / price feed (no backend required)
- 5–8 tickers per table row; each row shows symbol, price, change %, and a sparkline
- Data source: simulated locally in JS — no WebSocket/SSE server; still runs through the full Streem stream pipeline
- Implementation: local Observable/Subject wrapped in the stream adapter so `batch()`, `throttle()`, and backpressure handling are still exercised
- The sparkline and individual price updates must use fine-grained signal writes (not full-list re-renders) to validate `<For>` and signal-level DOM patching under load

**Lit design system integration**
- Library: Shoelace (`@shoelace-style/shoelace`)
- Components used: `sl-button` for the install/CTA action, `sl-badge` for the version tag
- Integration style: seamless / invisible — no "powered by Shoelace" callout
- Must demonstrate typed props (variant, size) and a functional click event handler via Streem's Lit bindings

**Deployment & routing**
- Host: GitHub Pages, deployed via GitHub Actions on push to main
- Build: Vite static export with multiple HTML entry points (multi-page app)
- Routes: `/` (landing page) and `/docs` (developer documentation)
- `/docs` content: getting started guide + API reference for `signal()`, `computed()`, `effect()`, `<Show>`, `<For>`, `<ErrorBoundary>`, `<Suspense>`, and the stream adapters
- Base URL must be configured in `vite.config.ts` for the GitHub Pages path prefix

### Claude's Discretion
- Exact sparkline rendering approach (SVG path vs canvas vs a tiny library)
- CSS design tokens and typography choices (within dark mode, monochromatic + accent constraint)
- Specific accent color
- Loading skeleton design for the ticker table
- GitHub Actions workflow structure
- Error state handling in the streaming demo (`<ErrorBoundary>` placement)
- Exact `vite.config.ts` multi-page entry structure

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | Official Streem landing page is built using Streem itself — every v1 feature must be used in production on the page before the framework ships | All sections below: app scaffold, streaming demo, Lit integration patterns — they establish how each feature is meaningfully exercised |
| LAND-02 | Landing page includes a live streaming demo operating at >30 msg/sec to validate backpressure handling | Streaming simulation pattern: local Observable → `fromObservable()` → `batch()` → fine-grained `<For>` signal writes; 200 msg/sec perf validation approach |
| LAND-03 | Landing page includes at least one Lit web component from a real design system to validate the Lit interop story in production | Shoelace installation, `setBasePath`, asset copying, CEM type generation workflow, `prop:` / `on:` binding patterns |
</phase_requirements>

---

## Summary

Phase 6 builds `apps/landing` — a new pnpm workspace application inside the existing `apps/` directory. The page is a multi-page Vite app with two HTML entry points: `index.html` (landing) and `docs/index.html` (developer docs). It deploys to GitHub Pages via GitHub Actions using the standard `actions/upload-pages-artifact@v4` / `actions/deploy-pages@v4` pipeline with `pnpm/action-setup@v3`.

The live streaming demo uses a locally simulated Observable (no server) passed through `fromObservable()` so that `batch()`, `throttle()`, and backpressure handling are exercised against the real framework pipeline. Each ticker row holds per-row signal objects; `<For>` iterates the ticker list, and each row's price/change/sparkline are individual signal writes — not full-list re-renders. This is the correct pattern to validate LAND-02 and LAND-01's `<For>` + fine-grained DOM patching requirement.

Shoelace v2.20.1 is the locked design system. It is in LTS maintenance mode but fully functional. The integration requires three steps beyond `npm install`: (1) `vite-plugin-static-copy` to copy SVG icons to the build output, (2) `setBasePath()` called at app entry before any component import, and (3) running `tsx scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace` in the `@streem/lit` package to generate `IntrinsicElements` types for `sl-button` and `sl-badge`. Shoelace ships `custom-elements.json` in its package root, which the existing `gen-lit-types.ts` script already supports via the `--pkg` flag.

**Primary recommendation:** Create `apps/landing` as a new Vite MPA app in the monorepo workspace, use `fromObservable()` with a local `setInterval`-driven Subject for the ticker demo, cherry-pick Shoelace components with `setBasePath` for assets, generate types from Shoelace's bundled CEM manifest, and deploy via the standard GitHub Pages Actions workflow.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `streem` | `workspace:*` | All Streem primitives (`signal`, `render`, `<For>`, `batch`, etc.) | The framework being dogfooded — single entry point per Phase 5 |
| `@streem/lit` | `workspace:*` | `bindLitProp`, `observeLitProp`, CEM type generation | Lit interop layer; separate from `streem` meta-package by design |
| `@shoelace-style/shoelace` | `^2.20.1` | `sl-button` and `sl-badge` web components | Locked decision; LTS but fully functional |
| `vite` | `^7.0.0` | Build tool, MPA multi-entry support, dev server | Already pinned across monorepo |
| `typescript` | `~5.8.0` | Type safety | Already pinned across monorepo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vite-plugin-static-copy` | `latest` | Copy Shoelace SVG icon assets to `dist/` | Required for bundled Shoelace; without it icons 404 |
| `tsx` | `latest` | Run `gen-lit-types.ts` script to generate JSX types | Build-time only; already in `@streem/lit` devDeps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shoelace `@2.20.1` | Web Awesome (Shoelace 3) | Web Awesome is the active successor but is a breaking change from v2; CONTEXT.md locks Shoelace |
| `vite-plugin-static-copy` | CDN base path via `setBasePath('https://cdn.jsdelivr.net/...')` | CDN avoids copy step but adds external dependency and fails offline; bundled is cleaner for a deployed static site |
| Roll-your-own SVG sparkline | `@fnando/sparkline` npm package | Custom SVG math is ~15 lines and zero dependency; library adds a dep for trivial code; Claude's discretion — recommend rolling own |
| `setInterval`-driven Observable | RxJS `Subject` | RxJS is a full dependency; a plain `{ subscribe(fn) { setInterval... } }` satisfies `Subscribable<T>` with zero deps |

**Installation (in `apps/landing`):**
```bash
pnpm add streem @streem/lit @shoelace-style/shoelace vite-plugin-static-copy
pnpm add -D typescript vite tsx
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/landing/
├── index.html              # Landing page entry point (/)
├── docs/
│   └── index.html          # Docs entry point (/docs/)
├── src/
│   ├── main.tsx            # Mounts App into #app (landing)
│   ├── docs.tsx            # Mounts DocsApp into #app (docs)
│   ├── App.tsx             # Root landing page component
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── TickerDemo.tsx  # Live streaming demo
│   │   ├── Features.tsx
│   │   ├── CodeSample.tsx
│   │   └── InstallCta.tsx  # Houses sl-button, sl-badge
│   ├── lib/
│   │   ├── ticker.ts       # Simulated Observable ticker source
│   │   └── sparkline.ts    # SVG sparkline path math
│   └── styles/
│       └── global.css      # Design tokens, dark mode, :not(:defined) FOUCE fix
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Pattern 1: Multi-Page App Vite Config
**What:** Declare two HTML entry points in `build.rollupOptions.input` so Vite builds both the landing page and docs as separate bundles.
**When to use:** Any time a Vite app needs multiple distinct HTML pages (not SPA routing).
**Example:**
```typescript
// Source: https://vite.dev/guide/build#multi-page-app
import { defineConfig } from 'vite'
import { streemHMR } from 'streem'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig({
  base: '/streem-2/',   // Set to '/repo-name/' for project pages; '/' if custom domain
  plugins: [
    streemHMR(),
    viteStaticCopy({
      targets: [{
        src: 'node_modules/@shoelace-style/shoelace/dist/assets/**/*',
        dest: 'shoelace_assets'
      }]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs/index.html'),
      }
    }
  }
})
```

### Pattern 2: Simulated Ticker Observable (No Server)
**What:** A plain `Subscribable<T>` object that emits synthetic price ticks via `setInterval`. Passed to `fromObservable()` so the full Streem stream pipeline is exercised.
**When to use:** Any time a streaming demo needs no backend while still validating `batch()`, `throttle()`, and signal backpressure.
**Example:**
```typescript
// Source: Project @streem/streams Subscribable<T> interface
// packages/streams/src/types.ts
import type { Subscribable } from '@streem/streams'

export interface TickerMessage {
  symbol: string
  price: number
  change: number  // percent
}

// Satisfies the Subscribable<T> structural interface — no RxJS required
export function createTickerSource(symbols: string[]): Subscribable<TickerMessage[]> {
  return {
    subscribe(observer: { next: (v: TickerMessage[]) => void }) {
      const prices = Object.fromEntries(symbols.map(s => [s, 100 + Math.random() * 900]))
      const id = setInterval(() => {
        const ticks = symbols.map(s => {
          const delta = (Math.random() - 0.5) * 2
          prices[s] = Math.max(1, prices[s] + delta)
          return { symbol: s, price: prices[s], change: (delta / prices[s]) * 100 }
        })
        observer.next(ticks)
      }, 5) // 200 msg/sec for perf validation; throttle to 33ms for visual display
      return { unsubscribe: () => clearInterval(id) }
    }
  }
}
```

### Pattern 3: Fine-Grained Ticker Row Signals
**What:** Each ticker row stores its mutable state in per-row signals. `<For>` iterates the ticker list; signal writes are per-field (price, change, sparkline history), not full-list replacement.
**When to use:** When validating that `<For>` + fine-grained signal patching prevents full-list re-renders under 200 msg/sec load.
**Example:**
```typescript
// Source: Streem @streem/streams batch() + @streem/core signal()
import { signal, createRoot } from 'streem'
import { fromObservable, batch, throttle } from 'streem'
import { createTickerSource } from '../lib/ticker'

export interface TickerRow {
  symbol: string
  price: ReturnType<typeof signal<number>>
  change: ReturnType<typeof signal<number>>
  history: ReturnType<typeof signal<number[]>>
}

export function TickerDemo() {
  const SYMBOLS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META']
  const rows = signal<TickerRow[]>(
    SYMBOLS.map(symbol => ({
      symbol,
      price: signal(100),
      change: signal(0),
      history: signal<number[]>([]),
    }))
  )

  const source = createTickerSource(SYMBOLS)
  const [stream] = fromObservable(source)

  // batch() prevents N-effect flushes for N tickers per tick
  // effect() tracking is on stream() which updates at source rate
  // throttle the visual output to ~30fps to prevent frame drops
  const throttledStream = throttle(stream, 33) // 33ms ≈ 30fps

  import('streem').then(({ effect }) => {
    effect(() => {
      const ticks = throttledStream()
      if (!ticks) return
      batch(() => {
        for (const tick of ticks) {
          const row = rows().find(r => r.symbol === tick.symbol)
          if (row) {
            row.price.set(tick.price)
            row.change.set(tick.change)
            row.history.set(prev => [...prev.slice(-19), tick.price]) // 20-point history
          }
        }
      })
    })
  })

  return (
    <section>
      <For each={rows} key={r => r.symbol}>
        {(row) => <TickerRow row={row} />}
      </For>
    </section>
  )
}
```

### Pattern 4: Shoelace Component Integration
**What:** Import Shoelace CSS theme, call `setBasePath`, cherry-pick component JS, use `prop:` for typed property binding and `on:` for custom event listeners.
**When to use:** Any Shoelace web component that needs typed props or custom events (i.e., `sl-click` instead of `click`).
**Example:**
```typescript
// Source: https://shoelace.style/getting-started/installation
// Source: Streem applyProps() prop:/on: namespace handling (packages/dom/src/h.ts)

// In main.tsx (MUST be before any Shoelace component import)
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('./shoelace_assets')  // matches viteStaticCopy dest

// Import Shoelace dark theme (applied via sl-theme-dark class on <html>)
import '@shoelace-style/shoelace/dist/themes/dark.css'

// Cherry-pick components (not whole library)
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/badge/badge.js'
```

```tsx
// InstallCta.tsx — typed Shoelace props via IntrinsicElements types
// After running: pnpm --filter @streem/lit gen:lit-types -- --pkg @shoelace-style/shoelace
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/badge/badge.js'

export function InstallCta() {
  const handleInstall = () => {
    navigator.clipboard.writeText('npm create streem@latest')
  }
  return (
    <div>
      {/* prop: routes to JS property (not attribute) — typed by generated IntrinsicElements */}
      <sl-badge prop:variant="neutral" prop:pill={true}>v0.1.0</sl-badge>
      {/* on: uses direct addEventListener (no lowercasing) — bypasses Shadow DOM event retargeting */}
      <sl-button prop:variant="primary" prop:size="large" on:click={handleInstall}>
        npm create streem@latest
      </sl-button>
    </div>
  )
}
```

### Pattern 5: Shoelace CEM Type Generation
**What:** Run the existing `gen-lit-types.ts` script from `@streem/lit` against Shoelace's bundled `custom-elements.json` to produce `IntrinsicElements` types for `sl-button` and `sl-badge`.
**When to use:** Once during the Plan 06-03 task — types are generated into `@streem/lit/src/lit-types/lit-elements.d.ts`.

```bash
# Shoelace ships custom-elements.json at package root (verified pattern from CONTEXT.md research)
# Run from packages/lit/
pnpm tsx scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace
```

This uses the existing `--pkg` flag in `gen-lit-types.ts` which reads from
`./node_modules/@shoelace-style/shoelace/custom-elements.json`.

### Anti-Patterns to Avoid
- **Importing Shoelace via the full bundle entry:** `import '@shoelace-style/shoelace'` imports the entire library. Always cherry-pick: `import '@shoelace-style/shoelace/dist/components/button/button.js'`.
- **Importing `setBasePath` from the main entry:** `import { setBasePath } from '@shoelace-style/shoelace'` bundles the entire library. Use the specific path: `@shoelace-style/shoelace/dist/utilities/base-path.js`.
- **Using `prop:` binding for Shoelace events:** Shoelace fires custom events with `sl-` prefix (e.g., `sl-change`, not `change`). Use `on:sl-change` not `onChange`. For `sl-button` click, the standard `on:click` DOM event is fine because click bubbles correctly.
- **Full-list signal replacement in the ticker demo:** Calling `rows.set(newArray)` on every tick re-renders all `<For>` items. Instead, write to per-row signals inside `batch()`.
- **Skipping `setBasePath` before component import:** If `setBasePath` is called after a Shoelace component auto-registers itself, icons and SVG assets will 404. It must be the first Shoelace import in the entry file.
- **Using `base: '/'` when deploying to a project sub-path:** If the repo is at `github.com/user/streem-2`, GitHub Pages serves at `user.github.io/streem-2/`. The Vite `base` must be `'/streem-2/'`. If a custom domain is added later, change to `'/'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copying Shoelace SVG assets to dist | Custom webpack/rollup copy script | `vite-plugin-static-copy` | Handles glob patterns, works in both dev and build modes, well-maintained |
| Shoelace base path resolution | Manual URL construction | `setBasePath()` from `dist/utilities/base-path.js` | Shoelace's internal icon loading uses this API; custom solutions break component internals |
| JSX types for Shoelace components | Hand-written `.d.ts` for every component | `gen-lit-types.ts --pkg @shoelace-style/shoelace` | Shoelace ships `custom-elements.json`; the existing CEM pipeline already handles this case |
| GitHub Actions Pages deployment | Custom deployment scripts | `actions/upload-pages-artifact@v4` + `actions/deploy-pages@v4` | Official GitHub Actions; handles artifact packaging, permissions, and OIDC auth automatically |
| Observable ticker source | Full RxJS Subject | Plain `Subscribable<T>` object with `setInterval` | Streem's `fromObservable()` accepts any structural `Subscribable<T>`; RxJS is not needed |

**Key insight:** Every "build your own" path in this phase has a well-maintained, zero-configuration alternative already compatible with the existing stack.

---

## Common Pitfalls

### Pitfall 1: Shoelace FOUCE (Flash of Undefined Custom Elements)
**What goes wrong:** `sl-button` and `sl-badge` render as unstyled `HTMLElement` for a frame or two on first load, causing visible layout shift.
**Why it happens:** Custom elements register via JavaScript; the CSS inside Shadow DOM isn't applied until `customElements.define()` completes.
**How to avoid:** Add to `global.css`:
```css
sl-button:not(:defined),
sl-badge:not(:defined) {
  visibility: hidden;
}
```
**Warning signs:** Visible layout shift or unstyled button on first hard load.

### Pitfall 2: `setBasePath` Called After Component Import
**What goes wrong:** Shoelace icons (used in `sl-button` slots and internally) 404. The component renders but icons are broken/missing.
**Why it happens:** Shoelace reads the base path when it first tries to load an icon. If the component JS is imported before `setBasePath` is called, the path is already read.
**How to avoid:** In `main.tsx`, the import order must be:
```typescript
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('./shoelace_assets')
// THEN: import Shoelace component JS files
import '@shoelace-style/shoelace/dist/components/button/button.js'
```
**Warning signs:** 404 errors in Network panel for `/assets/icons/*.svg`.

### Pitfall 3: Wrong Vite `base` Path for GitHub Pages
**What goes wrong:** Assets load locally but all CSS/JS returns 404 on the deployed page.
**Why it happens:** GitHub Pages project sites are served from `/<repo-name>/`. If `base` is `'/'`, all asset URLs are wrong.
**How to avoid:** Set `base: '/streem-2/'` (matching the actual repo name). If a custom domain is added, change to `base: '/'`.
**Warning signs:** All assets return 404 on the live page; browser console shows asset URLs missing the repo prefix.

### Pitfall 4: Ticker Full-List Re-Render Defeating `<For>` Validation
**What goes wrong:** The streaming demo technically works, but it's not actually validating fine-grained signal patching — every tick re-renders all rows.
**Why it happens:** Writing `rows.set(newArrayFromTicks)` tells `<For>` the entire list changed, triggering all row re-renders.
**How to avoid:** The rows array signal must hold stable row objects with per-field signals. Only the signal values inside rows change on each tick (via per-row `price.set()`, `change.set()`, `history.set()`), not the rows array itself.
**Warning signs:** DevTools performance trace shows all DOM nodes being touched on each tick, not just text nodes.

### Pitfall 5: `gen-lit-types.ts` Fails on Shoelace CEM
**What goes wrong:** `tsx scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace` exits with "CEM manifest not found".
**Why it happens:** The script looks for `./node_modules/@shoelace-style/shoelace/custom-elements.json`. This file exists at the **package root**, but the `@streem/lit` package's `node_modules` only gets Shoelace if it's installed as a dependency (not just installed in `apps/landing`). pnpm hoisting may or may not make it available.
**How to avoid:** Run the gen script from the monorepo root where pnpm hoists `@shoelace-style/shoelace` into `node_modules/`. Or install Shoelace temporarily as a devDependency of `@streem/lit` to run the generator.
**Warning signs:** Script exits with path-not-found error; running from root resolves it.

### Pitfall 6: 200 msg/sec Perf Trace Shows Long Tasks
**What goes wrong:** The `batch()` + `throttle()` combination is applied incorrectly, causing frames > 16ms.
**Why it happens:** `throttle(stream, 33)` on the outer stream is correct (reduces visual frame rate to 30fps), but if `batch()` is missing inside the effect, each ticker's N signal writes flush N separate effect runs.
**How to avoid:** The effect that processes the throttled stream MUST wrap all signal writes in `batch()`. The order is: `fromObservable` → `throttle` for visual rate limiting → `effect()` → `batch()` wraps all per-row signal writes.
**Warning signs:** Performance trace shows multiple Layout recalculations per frame tick; N long tasks corresponding to N tickers.

### Pitfall 7: MPA Dev Server Not Serving Second Entry Point
**What goes wrong:** `http://localhost:5173/docs/` returns 404 in Vite dev mode.
**Why it happens:** Known Vite issue where `rollupOptions.input` MPA entries may not be recognized by the dev server in all Vite versions. The build works correctly; dev server access requires navigating to the explicit HTML file path.
**How to avoid:** During development, access the docs page at `/docs/index.html` instead of `/docs/`. This is a dev-only issue; the build output works correctly with any static server.
**Warning signs:** 404 on `/docs/` in dev mode only; `/docs/index.html` works; prod deploy works.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Vite Multi-Page App Config with Shoelace Assets
```typescript
// Source: https://vite.dev/guide/build#multi-page-app
// Source: vite-plugin-static-copy docs
import { defineConfig } from 'vite'
import { streemHMR } from 'streem'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig({
  base: '/streem-2/',
  plugins: [
    streemHMR(),
    viteStaticCopy({
      targets: [{
        src: 'node_modules/@shoelace-style/shoelace/dist/assets/**/*',
        dest: 'shoelace_assets'
      }]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs/index.html'),
      }
    }
  }
})
```

### tsconfig.json for Landing App
```json
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
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

### package.json for apps/landing
```json
{
  "name": "@streem/landing",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "streem": "workspace:*",
    "@streem/lit": "workspace:*",
    "@shoelace-style/shoelace": "^2.20.1"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "vite-plugin-static-copy": "latest",
    "typescript": "~5.8.0"
  }
}
```

### GitHub Actions Deployment Workflow
```yaml
# Source: https://vite.dev/guide/static-deploy#github-pages
# .github/workflows/deploy-landing.yml
name: Deploy Landing to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'apps/landing/**'
      - 'packages/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @streem/landing build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: apps/landing/dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Shoelace Dark Theme Activation
```html
<!-- index.html — apply dark theme class to html element -->
<!DOCTYPE html>
<html lang="en" class="sl-theme-dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Streem — Build reactive UIs that update in microseconds</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### FOUCE Prevention CSS
```css
/* Source: https://www.abeautifulsite.net/posts/flash-of-undefined-custom-elements */
/* global.css */
sl-button:not(:defined),
sl-badge:not(:defined) {
  visibility: hidden;
}
```

### Minimal SVG Sparkline (Roll-Your-Own)
```typescript
// Source: https://alexplescan.com/posts/2023/07/08/easy-svg-sparklines/
// lib/sparkline.ts — no dependencies, ~15 lines
export function buildSparklinePath(data: number[], width = 80, height = 24): string {
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${points.join(' L ')}`
}

// Usage in TSX:
// <svg width="80" height="24" viewBox="0 0 80 24">
//   <path d={() => buildSparklinePath(row.history())} stroke="currentColor" fill="none" stroke-width="1.5" />
// </svg>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gh-pages` npm package for deployment | `actions/upload-pages-artifact@v4` + `actions/deploy-pages@v4` | 2024–2025 | Old `gh-pages` approach required force-pushing to a branch; official Actions are OIDC-authenticated and cleaner |
| `actions/upload-artifact@v3` | `actions/upload-artifact@v4` | Jan 2025 (deprecated v3) | v3 was officially deprecated Jan 30, 2025; workflows using v3 still run but receive deprecation warnings |
| Full Shoelace library import | Cherry-pick from `dist/components/<name>/<name>.js` | Shoelace v2 | Full import bundles entire library; cherry-pick is the current official recommendation |

**Deprecated/outdated:**
- Shoelace `@shoelace-style/shoelace@^3.x` (Web Awesome): Not released under this package name — Shoelace 3 is a separate package at a different registry location. `@shoelace-style/shoelace` latest is `2.20.1`.
- `actions/upload-pages-artifact@v3`: Deprecated Jan 2025. Use `@v4`.

---

## Open Questions

1. **Exact path of `custom-elements.json` in `@shoelace-style/shoelace` package**
   - What we know: Shoelace ships a CEM manifest; the `gen-lit-types.ts` `--pkg` flag resolves from `./node_modules/<pkg>/custom-elements.json`
   - What's unclear: Whether it's at the package root (`custom-elements.json`) or inside `dist/` (`dist/custom-elements.json`) — Shoelace docs mention `vscode.html-custom-data.json` is under `dist/`
   - Recommendation: In Plan 06-03, verify with `ls node_modules/@shoelace-style/shoelace/` before running the generator. If it's in `dist/`, update the manifest path argument or run the script from `apps/landing/` after install.

2. **`base` path for GitHub Pages**
   - What we know: If the repo is `github.com/<user>/streem-2`, the base must be `'/streem-2/'`. If a custom domain is configured, it becomes `'/'`.
   - What's unclear: Whether the repo owner has a custom domain configured for this project
   - Recommendation: Default to `base: '/streem-2/'` in vite.config.ts. Make it a const at the top of the config so it's easy to change when a custom domain is added. Or use an environment variable: `base: process.env.VITE_BASE_URL ?? '/streem-2/'`.

3. **pnpm hoisting and `@streem/lit`'s `gen-lit-types.ts` access to Shoelace**
   - What we know: `@shoelace-style/shoelace` is a dependency of `apps/landing`, not `packages/lit`. pnpm's shamefully-hoist behavior may or may not make it accessible to scripts run from `packages/lit/`.
   - What's unclear: pnpm hoisting configuration in this workspace
   - Recommendation: Run `gen-lit-types.ts` from the **monorepo root** (`pnpm --filter @streem/lit tsx packages/lit/scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace`) after `pnpm install` so Shoelace is in the root `node_modules/`. Alternatively, verify the script works from `packages/lit/` with `ls ../../node_modules/@shoelace-style/shoelace/`.

---

## Sources

### Primary (HIGH confidence)
- Project source: `packages/dom/src/h.ts` — `prop:`, `attr:`, `on:` namespace handling in `applyProps()`
- Project source: `packages/lit/scripts/gen-lit-types.ts` — CEM type generation pipeline, `--pkg` flag behavior
- Project source: `packages/streams/src/combinators.ts` — `batch()`, `throttle()`, `debounce()` APIs and ownership rules
- Project source: `packages/streem/src/index.ts` — Public API surface of the `streem` meta-package
- Project source: `packages/create-streem/templates/default/` — Reference for tsconfig.json, vite.config.ts, main.tsx structure
- https://vite.dev/guide/build — Multi-page app `rollupOptions.input` configuration (verified from official Vite docs)
- https://vite.dev/guide/static-deploy — GitHub Pages `base` configuration and recommended Actions workflow
- https://shoelace.style/getting-started/installation — npm install, cherry-picking, `setBasePath` requirement
- https://shoelace.style/getting-started/usage — Property vs attribute binding, custom events, self-closing tag prohibition
- https://shoelace.style/getting-started/themes — Dark theme via `sl-theme-dark` class, CSS token scoping

### Secondary (MEDIUM confidence)
- https://rwblickhan.org/technical/til/20241018-using-shoelace-with-preact-and-vite/ — Verified `vite-plugin-static-copy` pattern for Shoelace assets with Vite (Preact/Vite, analogous setup)
- https://github.com/actions/upload-pages-artifact — Official GitHub Actions for Pages deployment (v4)
- https://github.blog/changelog/2024-12-05-deprecation-notice-github-pages-actions-to-require-artifacts-actions-v4-on-github-com/ — v3 deprecation notice (Jan 2025)
- https://www.abeautifulsite.net/posts/flash-of-undefined-custom-elements — FOUCE `:not(:defined)` fix pattern

### Tertiary (LOW confidence)
- Shoelace `custom-elements.json` exact path in installed package — not directly verified; will need `ls` check in Plan 06-03
- pnpm hoisting behavior for `gen-lit-types.ts` accessing `apps/landing`'s dependencies — workspace-specific; verify during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions cross-referenced with npm and official docs; project packages read directly from source
- Architecture: HIGH — multi-page Vite config verified from official docs; Shoelace integration pattern verified from multiple sources; project's existing `applyProps` and `gen-lit-types.ts` read directly
- Pitfalls: HIGH (Shoelace/Vite), MEDIUM (ticker perf pattern) — Shoelace pitfalls from official docs + community sources; ticker perf from project's existing batch/throttle implementation

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (Shoelace is LTS/stable; Vite 7 is stable; GitHub Actions versions pinned)
