---
phase: quick-4
plan: 4
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/landing/src/DocsApp.tsx
  - apps/landing/src/styles/global.css
  - apps/landing/src/docs/DocSection.tsx
  - apps/landing/src/docs/GettingStartedSection.tsx
  - apps/landing/src/docs/SignalsSection.tsx
  - apps/landing/src/docs/ComponentsSection.tsx
  - apps/landing/src/docs/StreamsSection.tsx
  - apps/landing/src/docs/LitInteropSection.tsx
  - apps/landing/src/docs/PatternsSection.tsx
  - apps/landing/src/docs/StylingSection.tsx
  - apps/landing/src/docs/TypeScriptSection.tsx
  - apps/landing/src/docs/PerformanceSection.tsx
autonomous: false
requirements: []

must_haves:
  truths:
    - "DocsApp.tsx contains no inline <style> block"
    - "DocsApp.tsx contains no section component function bodies — only the shell and Show wiring"
    - "Each doc section lives in its own file under apps/landing/src/docs/"
    - "Docs UI renders identically: nav, layout, content all display correctly"
    - "All nav links still switch sections correctly"
  artifacts:
    - path: "apps/landing/src/docs/DocSection.tsx"
      provides: "Shared DocSection and Code base components"
    - path: "apps/landing/src/docs/GettingStartedSection.tsx"
      provides: "Getting started section content"
    - path: "apps/landing/src/docs/PerformanceSection.tsx"
      provides: "Performance section content"
    - path: "apps/landing/src/DocsApp.tsx"
      provides: "Slim orchestrator — shell, nav, Show wiring, no style block"
  key_links:
    - from: "apps/landing/src/DocsApp.tsx"
      to: "apps/landing/src/docs/*.tsx"
      via: "named imports"
      pattern: "import.*from.*./docs/"
---

<objective>
Refactor DocsApp.tsx by splitting the 9 section components into individual files under a new `apps/landing/src/docs/` directory, and replace the inline `<style>` block with Tailwind CSS utility classes throughout.

Purpose: The file has grown to 442 lines with all content, styling, and shell logic co-located. Splitting into focused component files makes each section independently editable, and Tailwind utilities eliminate the runtime style injection.

Output: 12 new/modified files — 10 component files in `apps/landing/src/docs/`, a slimmed `DocsApp.tsx` with no inline styles, and `global.css` with a safelist entry for dynamically composed nav classes.
</objective>

<execution_context>
@/Users/sn0w/.claude/get-shit-done/workflows/execute-plan.md
@/Users/sn0w/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/sn0w/Documents/dev/streem-2/.planning/STATE.md

Key facts from project context:
- Tailwind v4 is ALREADY configured: `@tailwindcss/vite` plugin in vite.config.ts, `@import "tailwindcss"` in global.css
- Design tokens in global.css `@theme` block register as both CSS custom properties AND Tailwind utilities:
  - `--color-surface` → `bg-surface`, `--color-border` → `border-border`, `--color-text` → `text-text`, `--color-muted` → `text-muted`
- Docs are dark-only (no light/dark toggle per STATE.md decisions)
- Streem JSX uses `class` (not `className`) and `on:event` handlers
- Component functions return `Node`, cast via `as unknown as Node`
- `docs.tsx` is the entry point — imports and renders `DocsApp`

Icons fact (from icons.tsx inspection):
- All nav icons are SVGs using `class="nav-icon"` on the `<svg>` element
- `.nav-icon` CSS (width:14px, height:14px, flex-shrink:0, stroke props) is currently ONLY in DocsApp.tsx's inline `<style>` block
- When that block is removed, `.nav-icon` must be moved to `global.css` — otherwise icons lose sizing

Current inline styles to migrate (DocsApp.tsx `<style>` block, lines 304–439):
  - `.docs-layout`: grid 220px + 1fr, min-h-screen
  - `.docs-nav`: sticky, h-screen, overflow-y-auto, bg-surface, border-r, px-5/py-6, flex col
  - `.docs-nav-version`: mt-auto, pt-4, text-xs, text-muted, opacity-50
  - `.docs-nav-brand`: flex, items-center, gap-1.5, mb-7, no-underline
  - `.docs-nav-logo-img`: h-7 (28px), w-auto, block
  - `.docs-nav-logo-sep` / `.docs-nav-logo-docs`: text-[15px], text-muted
  - `.docs-nav-list`: list-none, flex col, gap-1
  - `.docs-nav-link`: flex, items-center, gap-2, px-2.5/py-1.5, text-muted, rounded, text-sm, transition-all
  - `.docs-nav-link:hover`: text-text, bg white/5
  - `.docs-nav-link.active`: text-text, bg white/8
  - `.docs-main`: overflow-y-auto, p-12, min-w-0
  - `.docs-content`: max-w-[760px], mx-auto
  - `.doc-section`: mb-15, pt-4
  - `.doc-section-title`: text-2xl, font-semibold, mb-4, text-text
  - `.doc-section-subtitle`: text-[1.1rem], font-semibold, text-text, mt-8, mb-2
  - `.doc-section p`: text-muted, mb-3, text-[0.95rem]
  - `.doc-pre`: my-4/mb-6, text-[13px]  (note: `pre` base styles already in global.css @layer base)
  - Mobile 700px: nav becomes row, main gets min-w-0
  - `.nav-icon`: w-3.5, h-3.5, flex-shrink-0, stroke-width 1.5, stroke-linecap round, stroke-linejoin round
  - `.docs-link`: text-blue-400, no-underline
  - `.docs-link:hover`: underline

Tailwind class mapping strategy for DocsApp shell:
  - `docs-layout` div → `grid grid-cols-[220px_1fr] min-h-screen max-[700px]:grid-cols-1`
  - `docs-nav` nav → `sticky top-0 h-screen overflow-y-auto bg-surface border-r border-border px-5 py-6 flex flex-col max-[700px]:static max-[700px]:h-auto max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:items-center max-[700px]:gap-2 max-[700px]:overflow-x-auto max-[700px]:px-4 max-[700px]:py-3 max-[700px]:border-r-0 max-[700px]:border-b border-border`
  - `docs-nav-logo` div → `mb-2 max-[700px]:mb-0`
  - `docs-nav-brand` anchor → `flex items-center gap-1.5 mb-7 no-underline max-[700px]:flex-shrink-0 max-[700px]:mb-0`
  - logo img → `h-7 w-auto block`
  - logo sep span → `text-[15px] text-muted mx-0.5`
  - logo docs span → `text-[15px] text-muted`
  - `docs-nav-list` ul → `list-none flex flex-col gap-1 max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:gap-x-2 max-[700px]:gap-y-1`
  - `docs-nav-version` div → `mt-auto pt-4 text-xs text-muted opacity-50`
  - `docs-main` main → `overflow-y-auto p-12 max-[700px]:p-4 min-w-0`
  - `docs-content` div → `max-w-[760px] mx-auto`

Nav link class (dynamic accessor — active state toggle):
```tsx
class={() => [
  'flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-all no-underline',
  currentPage.value === item.id
    ? 'text-text bg-white/8'
    : 'text-muted hover:text-text hover:bg-white/5',
].join(' ')}
```

IMPORTANT: Tailwind v4 scans source files at build time. Classes composed in dynamic string templates are NOT automatically detected. Add a safelist in global.css so these classes are always emitted:
```css
@source inline("hover:text-text hover:bg-white/5 text-text bg-white/8");
```
Add after the existing `@source inline("border-b-2")` on line 56.

Responsive note: Tailwind v4 default breakpoints: sm=640, md=768. The 700px mobile breakpoint from the original CSS sits between sm and md. Use `max-[700px]:` arbitrary breakpoint — Tailwind v4 supports arbitrary values.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create apps/landing/src/docs/ with shared primitives and all 9 section files</name>
  <files>
    apps/landing/src/docs/DocSection.tsx
    apps/landing/src/docs/GettingStartedSection.tsx
    apps/landing/src/docs/SignalsSection.tsx
    apps/landing/src/docs/ComponentsSection.tsx
    apps/landing/src/docs/StreamsSection.tsx
    apps/landing/src/docs/LitInteropSection.tsx
    apps/landing/src/docs/PatternsSection.tsx
    apps/landing/src/docs/StylingSection.tsx
    apps/landing/src/docs/TypeScriptSection.tsx
    apps/landing/src/docs/PerformanceSection.tsx
    apps/landing/src/styles/global.css
  </files>
  <action>
**Step A — global.css:** Add safelist entry after the existing `@source inline("border-b-2")` line:
```css
@source inline("hover:text-text hover:bg-white/5 text-text bg-white/8");
```
Also add the `.nav-icon` rule to global.css (currently only in DocsApp's inline `<style>`, must survive its removal):
```css
/* Nav icon sizing — used by icons.tsx SVGs */
.nav-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

**Step B — apps/landing/src/docs/DocSection.tsx:**
```tsx
import { highlight } from '../lib/highlight'

export function DocSection({ id, title, children }: { id: string; title: string; children: unknown }) {
  return (
    <section id={id} class="mb-15 pt-4">
      <h2 class="text-2xl font-semibold mb-4 text-text">{title}</h2>
      {children}
    </section>
  ) as unknown as Node
}

export function Code({ children }: { children: string }) {
  const pre = document.createElement('pre')
  // 'pre' is already styled via @layer base in global.css — no extra class needed
  const code = document.createElement('code')
  code.innerHTML = highlight(children)
  pre.appendChild(code)
  return pre
}
```

**Step C — Each of the 9 section files:**

Move the corresponding function from DocsApp.tsx verbatim, then apply Tailwind classes:

For each section file:
1. Import `{ DocSection, Code }` from `'./DocSection'`
2. Import only the streem primitives the section actually uses (check the original function body)
3. Apply these class replacements throughout the JSX:
   - Every bare `<p>` → `<p class="text-muted mb-3 text-[0.95rem]">`
   - Every `<h3 class="doc-section-subtitle">` → `<h3 class="text-[1.1rem] font-semibold text-text mt-8 mb-2">`
   - Every `class="docs-link"` anchor → `class="text-blue-400 no-underline hover:underline"`
   - The `<DocSection>` and `<Code>` components stay as-is
4. Export as named export (e.g., `export function GettingStartedSection(): Node`)
5. Keep `as unknown as Node` on the return

Section-specific import requirements (from original DocsApp.tsx):
- `GettingStartedSection` — no streem imports needed (static JSX only)
- `SignalsSection` — no streem imports needed (static JSX only)
- `ComponentsSection` — no streem imports needed (static JSX only)
- `StreamsSection` — no streem imports needed (static JSX only)
- `LitInteropSection` — no streem imports needed (static JSX only)
- `PatternsSection` — no streem imports needed (static JSX only)
- `StylingSection` — no streem imports needed (static JSX only)
- `TypeScriptSection` — no streem imports needed (static JSX only)
- `PerformanceSection` — no streem imports needed (static JSX only)

None of the section components use reactive primitives — they are all pure render-once functions. Only DocsApp itself uses signal/effect/onCleanup/Show.

Do NOT alter any code example strings, prose text, or `<Code>` content. Only change JSX element class attributes and imports.
  </action>
  <verify>
    <automated>cd /Users/sn0w/Documents/dev/streem-2 && ls apps/landing/src/docs/ && npx tsc --noEmit -p apps/landing/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>10 files exist in apps/landing/src/docs/, global.css has the nav-icon rule and safelist entry, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite DocsApp.tsx — thin shell with Tailwind classes, no inline style block</name>
  <files>apps/landing/src/DocsApp.tsx</files>
  <action>
Replace DocsApp.tsx entirely with the slim orchestrator. The file should be ~80 lines.

```tsx
import './styles/global.css'
import { signal, effect, onCleanup, Show } from 'streem'
import {
  GettingStartedIcon, SignalsIcon, ComponentsIcon, StreamsIcon,
  LitInteropIcon, PatternsIcon, StylingIcon, TypeScriptIcon, PerformanceIcon,
} from './icons'
import { GettingStartedSection } from './docs/GettingStartedSection'
import { SignalsSection } from './docs/SignalsSection'
import { ComponentsSection } from './docs/ComponentsSection'
import { StreamsSection } from './docs/StreamsSection'
import { LitInteropSection } from './docs/LitInteropSection'
import { PatternsSection } from './docs/PatternsSection'
import { StylingSection } from './docs/StylingSection'
import { TypeScriptSection } from './docs/TypeScriptSection'
import { PerformanceSection } from './docs/PerformanceSection'

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting started', Icon: GettingStartedIcon },
  { id: 'signals',         label: 'Signals',         Icon: SignalsIcon },
  { id: 'components',      label: 'Components',      Icon: ComponentsIcon },
  { id: 'streams',         label: 'Streams',         Icon: StreamsIcon },
  { id: 'lit-interop',     label: 'Lit interop',     Icon: LitInteropIcon },
  { id: 'patterns',        label: 'Patterns',        Icon: PatternsIcon },
  { id: 'styling',         label: 'Styling',         Icon: StylingIcon },
  { id: 'typescript',      label: 'TypeScript',      Icon: TypeScriptIcon },
  { id: 'performance',     label: 'Performance',     Icon: PerformanceIcon },
]

function getPage(): string {
  const hash = location.hash.slice(1)
  return NAV_ITEMS.some(i => i.id === hash) ? hash : NAV_ITEMS[0].id
}

const currentPage = signal(getPage())

export function DocsApp(): Node {
  const handleHashChange = () => {
    currentPage.set(getPage())
    window.scrollTo(0, 0)
  }
  window.addEventListener('hashchange', handleHashChange)
  onCleanup(() => window.removeEventListener('hashchange', handleHashChange))

  effect(() => {
    const item = NAV_ITEMS.find(i => i.id === currentPage.value)
    document.title = item ? `${item.label} — Streem Docs` : 'Streem Docs'
  })

  return (
    <div class="grid grid-cols-[220px_1fr] min-h-screen max-[700px]:grid-cols-1">
      <nav class="sticky top-0 h-screen overflow-y-auto bg-surface border-r border-border px-5 py-6 flex flex-col max-[700px]:static max-[700px]:h-auto max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:items-center max-[700px]:gap-2 max-[700px]:overflow-x-auto max-[700px]:px-4 max-[700px]:py-3 max-[700px]:border-r-0 max-[700px]:border-b max-[700px]:border-border">
        <div class="mb-2 max-[700px]:mb-0">
          <a href="../" class="flex items-center gap-1.5 mb-7 no-underline max-[700px]:flex-shrink-0 max-[700px]:mb-0">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Streem" class="h-7 w-auto block" />
            <span class="text-[15px] text-muted mx-0.5">/</span>
            <span class="text-[15px] text-muted">Docs</span>
          </a>
        </div>
        <ul class="list-none flex flex-col gap-1 max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:gap-x-2 max-[700px]:gap-y-1">
          {NAV_ITEMS.map(item => (
            <li>
              <a
                href={`#${item.id}`}
                class={() => [
                  'flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-all no-underline',
                  currentPage.value === item.id
                    ? 'text-text bg-white/8'
                    : 'text-muted hover:text-text hover:bg-white/5',
                ].join(' ')}
              >
                <item.Icon />{item.label}
              </a>
            </li>
          ))}
        </ul>
        <div class="mt-auto pt-4 text-xs text-muted opacity-50">v0.1.0</div>
      </nav>

      <main class="overflow-y-auto p-12 max-[700px]:p-4 min-w-0">
        <div class="max-w-[760px] mx-auto">
          <Show when={() => currentPage.value === 'getting-started'}>{() => GettingStartedSection()}</Show>
          <Show when={() => currentPage.value === 'signals'}>{() => SignalsSection()}</Show>
          <Show when={() => currentPage.value === 'components'}>{() => ComponentsSection()}</Show>
          <Show when={() => currentPage.value === 'streams'}>{() => StreamsSection()}</Show>
          <Show when={() => currentPage.value === 'lit-interop'}>{() => LitInteropSection()}</Show>
          <Show when={() => currentPage.value === 'patterns'}>{() => PatternsSection()}</Show>
          <Show when={() => currentPage.value === 'styling'}>{() => StylingSection()}</Show>
          <Show when={() => currentPage.value === 'typescript'}>{() => TypeScriptSection()}</Show>
          <Show when={() => currentPage.value === 'performance'}>{() => PerformanceSection()}</Show>
        </div>
      </main>
    </div>
  ) as unknown as Node
}
```

There must be NO `<style>` block in this file. All styling is handled by Tailwind utility classes and the two global.css rules added in Task 1 (.nav-icon and safelist).
  </action>
  <verify>
    <automated>cd /Users/sn0w/Documents/dev/streem-2 && npx tsc --noEmit -p apps/landing/tsconfig.json 2>&1 | head -30 && pnpm --filter @streem/landing build 2>&1 | tail -10</automated>
  </verify>
  <done>DocsApp.tsx has no `&lt;style&gt;` tag, is under 100 lines, TypeScript and Vite build both exit 0</done>
</task>

<task type="checkpoint:human-verify">
  <what-built>
    DocsApp split into 10 component files under apps/landing/src/docs/ and DocsApp.tsx rewritten with Tailwind utility classes. Inline style block removed. .nav-icon and safelist moved to global.css.
  </what-built>
  <how-to-verify>
    1. Run: `pnpm --filter @streem/landing dev` and open the docs page (http://localhost:5173/streem-2/docs/ or the docs/index.html route)
    2. Verify: Sidebar nav is visible on the left (220px), content area on the right
    3. Verify: Nav icons (small SVGs) appear next to each label and are sized correctly (14px)
    4. Click each of the 9 nav items — verify section content switches correctly and active item has a visible highlight
    5. Resize viewport below 700px — nav should collapse to a horizontal scrollable row
    6. Open DevTools Elements panel — confirm NO `<style>` tag is present in the DocsApp output
    7. Run: `pnpm --filter @streem/landing build` — must exit 0 with no errors
  </how-to-verify>
  <resume-signal>Type "approved" when layout and nav work correctly, or describe any visual regressions</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit -p apps/landing/tsconfig.json` exits 0
- `pnpm --filter @streem/landing build` exits 0
- DocsApp.tsx contains no `<style>` tag
- All 10 files exist under `apps/landing/src/docs/`
- DocsApp.tsx is under 100 lines (was 442)
- global.css contains `.nav-icon` rule and updated `@source inline(...)` safelist
</verification>

<success_criteria>
- DocsApp.tsx: shell only, ~80 lines, Tailwind classes, no inline style block, imports 9 sections
- apps/landing/src/docs/: 10 files — DocSection.tsx + 9 section components
- global.css: has .nav-icon rule + safelist for nav link dynamic classes
- Visual parity: layout, nav, icons, content rendering, mobile breakpoints all work as before
- Build passes: TypeScript and Vite both succeed
</success_criteria>

<output>
After completion, create `.planning/quick/4-refactor-docsapp-to-use-tailwind-css-and/4-SUMMARY.md` with what was done, files changed, and any decisions made during implementation.

Also update `.planning/STATE.md`:
- Add entry to Quick Tasks Completed table: `| 4 | Refactor DocsApp to use Tailwind CSS and split into multiple component files | {date} | {commit} | [4-refactor-docsapp-to-use-tailwind-css-and](./quick/4-refactor-docsapp-to-use-tailwind-css-and/) |`
</output>
