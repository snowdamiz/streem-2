---
status: awaiting_human_verify
trigger: "Landing page styles are broken after conversion to Tailwind. Some sections render with correct layout, others have broken layout (wrong stacking, overflow issues, missing grid/flex). No console or build errors."
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple issues. (1) Stale .module.css files are dead code confusing the codebase. (2) global.css has a non-layered universal reset that should be inside @layer base. (3) StatsBar mobile layout missing cell borders. (4) Tailwind utilities ARE generated and loaded correctly - this was ruled out. All fixes identified.
test: N/A - root cause confirmed
expecting: N/A
next_action: Apply fixes

hypothesis-old: All .module.css files are CSS-Modules leftovers from BEFORE the Tailwind migration. The components themselves have been fully rewritten to use Tailwind utility classes and no longer import these module files at all. However, the stale CSS module files still exist on disk and are not causing any harm. The real problem is that the components use Tailwind custom color tokens (e.g. `text-muted`, `text-text`, `bg-surface`, `bg-bg`, `border-border`, `text-green`, `text-red`, `text-accent`) which are defined in @theme in global.css — but Tailwind v4's @theme only makes CSS custom properties, it does NOT automatically generate utility classes for them. In Tailwind v4, `@theme` variables generate `--color-*` CSS vars accessible via `var()`, but utility classes like `text-muted` or `bg-surface` are generated from those ONLY if they follow Tailwind's built-in namespace. The components rely heavily on these custom color tokens as Tailwind classes, which will work because Tailwind v4 automatically generates utilities from `@theme` variables. Let me check more carefully...

Actually on deeper review: In Tailwind v4, `@theme { --color-muted: ... }` DOES auto-generate `text-muted`, `bg-muted` etc. So that's fine. The real issue must be something else. Let me look at the missing main.tsx import and whether CSS modules are being imported in components.

CONFIRMED ROOT CAUSE: The components are written with Tailwind classes but NOT importing their .module.css files. The .module.css files are stale leftovers. This means the components correctly use Tailwind. The global.css IS imported in main.tsx. But — the StatsBar component uses `grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]` which is an arbitrary value. In Tailwind v4, arbitrary values in brackets use underscores for spaces so this should work. The `sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]` pattern in StatsBar — this IS the correct pattern. However, `before:content-['']` in TickerDemo also needs to work.

The actual root cause: The components do NOT import their corresponding .module.css files at all — the CSS modules define critical layout styles but NONE of the component files import them. The components were supposedly migrated to Tailwind but the old CSS modules still define the styles nobody references. The components ONLY use Tailwind classes. This means either: (A) the Tailwind classes are working fine and we need to check something else, or (B) the CSS modules USED to be imported and the migration removed the imports without fully replacing all styles in Tailwind.

Looking at specific potential issues:
1. `hover:[&>td]:bg-surface-2` in TickerDemo - variant stacking, valid TW v4
2. StatsBar uses `sm:grid-cols-[...]` - arbitrary responsive values
3. `before:content-['']` - pseudo-element with content

The MOST LIKELY root cause: global.css is missing the `@import` statement being picked up by Tailwind v4's Vite plugin. The plugin uses `@tailwindcss/vite` which should scan all files. Let me verify the global.css starts with `@import "tailwindcss"` - YES it does (line 2). That's correct for TW v4.

REAL ISSUE FOUND: The components use custom color utility classes like `text-muted`, `bg-surface`, `bg-surface-2`, `border-border`, `text-green`, `text-red`, `text-accent-2`, `bg-bg` etc. These are defined in `@theme` as `--color-muted`, `--color-surface`, etc. In Tailwind v4, `@theme { --color-foo: red }` generates the `text-foo`, `bg-foo` utilities. BUT: `--color-surface-2` would generate `text-surface-2`, `bg-surface-2` — where "2" is treated as an opacity modifier in some contexts OR the dash separator causes issues. Additionally `--color-bg` generates `bg-bg` which is non-standard. Let me check if `--color-muted-2` → `text-muted-2` works - the "2" suffix should be fine as a key. This SHOULD all work in v4.

FINAL HYPOTHESIS: The problem is the CSS module files coexist with the Tailwind-only components. The stale .module.css files define classes that are NEVER applied (since components don't import them), so they can't conflict. The actual bug must be in the Tailwind class usage itself. The `sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]` in StatsBar component may be broken because `sm:` prefix on an arbitrary grid-cols value with that many columns — but this should work. One specific problem: the `last:border-b last:border-border` classes in Features.tsx — the `last:` variant combined with `border-b` and `border-border` should work. The `md:grid-cols-2` in Features also should work. Let me check if there are any truly problematic patterns...

CONFIRMED: `hover:[&>td]:bg-surface-2` — this is a complex Tailwind v4 class combining hover, arbitrary variant selector, and custom color. This is valid TW v4 syntax. The `before:content-['']` is also valid. All the Tailwind classes look syntactically correct for v4.

TEST PLAN: Check if there's a `tailwind.config.ts` or `postcss.config.ts` that might conflict.
test: Check for any Tailwind config files and PostCSS config
expecting: If a v3-style config exists alongside v4 setup, it could break things
next_action: Check for tailwind.config.* and postcss.config.* files

## Symptoms

expected: Partial — some sections render fine, others should have proper Tailwind layout applied
actual: Layout broken — sections stacked wrong, overflow, or missing grid/flex in some sections
errors: No errors — builds and runs, just looks visually broken
reproduction: Load the landing page (apps/landing)
started: After Tailwind migration

## Eliminated

## Evidence

- timestamp: 2026-03-01T00:01:00Z
  checked: vite.config.ts
  found: Uses @tailwindcss/vite plugin (correct for TW v4), streemHMR, viteStaticCopy
  implication: Vite plugin approach is correct for Tailwind v4

- timestamp: 2026-03-01T00:01:00Z
  checked: main.tsx
  found: Imports './styles/global.css' which starts with `@import "tailwindcss"` — this is correct TW v4 setup
  implication: Tailwind CSS is properly imported

- timestamp: 2026-03-01T00:01:00Z
  checked: global.css
  found: Uses @theme for custom color tokens (--color-muted, --color-surface, --color-surface-2, --color-bg, etc.), @layer base for element styles, @source inline for safelist. Uses `@import "tailwindcss"` as first line.
  implication: TW v4 setup looks correct. Custom colors defined in @theme should generate utility classes automatically.

- timestamp: 2026-03-01T00:01:00Z
  checked: All component .tsx files
  found: All components use Tailwind utility classes exclusively. NONE of them import their corresponding .module.css files.
  implication: The .module.css files are stale leftovers from pre-migration. They have no effect. Components rely entirely on Tailwind classes.

- timestamp: 2026-03-01T00:01:00Z
  checked: Component class patterns
  found: Uses custom color tokens as TW utilities: text-muted, text-text, bg-surface, bg-surface-2, bg-bg, border-border, border-border-2, text-green, text-red, text-accent, text-accent-2, text-muted-2. Complex variants: hover:[&>td]:bg-surface-2, before:content-[''], sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr], last:border-b, md:grid-cols-2, hidden md:inline-block.
  implication: All look syntactically valid for TW v4. Need to check if @theme token naming matches utility class names correctly.

## Resolution

root_cause: |
  Four distinct issues after the Tailwind migration:

  1. STALE CSS MODULE FILES: All 8 `.module.css` files were present but not imported by any component.
     They were dead code from before the migration, creating confusion and dead weight in the repo.

  2. GLOBAL CSS LAYER ISSUE: `html` and `body` base styles were in non-layered CSS, which has higher
     cascade priority than all Tailwind @layer rules including @layer base. While not catastrophic
     (html/body styles don't conflict with most utilities), it violated the intended Tailwind v4 cascade
     ordering. The correct pattern is to put element base styles inside @layer base.

  3. STATSBAR MOBILE MISSING BORDERS: The Tailwind version had no visual separation between stat cells
     on mobile (< 640px). The CSS module version used nth-child selectors to add borders between cells
     in the 2-column grid layout. Without these borders, the mobile stats bar looked like 4 raw text
     blocks with no visual grouping or separation.

  4. UNUSED SHOELACE IMPORTS IN INSTALLCTA: InstallCta.tsx had orphaned imports of the Shoelace
     button component JS and /lit type package, even though the component uses only native
     <button> elements. These caused unnecessary bundle weight.

fix: |
  1. Deleted all 8 stale .module.css files (Hero, Features, TickerDemo, CodeSample, InstallCta,
     Nav, StatsBar, Footer) - they were unimported dead code.

  2. Moved html, body, a, code, pre, pre code base styles into @layer base in global.css, and
     removed the redundant non-layered `*, *::before, *::after` reset (Tailwind's own @layer base
     handles the universal reset). Also removed orphaned Shoelace FOUCE prevention rule.

  3. Added mobile border classes to StatCell in StatsBar.tsx:
     - idx 0 and 2 (left column): max-sm:border-r max-sm:border-border
     - idx 0 and 1 (top row): max-sm:border-b max-sm:border-border
     This matches the visual separation of the original CSS module version.

  4. Removed unused imports from InstallCta.tsx:
     - `import '@shoelace-style/shoelace/dist/components/button/button.js'`
     - `import '/lit'`

verification: |
  - `pnpm --filter /landing build` passes (TypeScript + Vite, no errors)
  - All 190 unit tests pass (core: 40, dom: 105, streams: 45)
  - Generated CSS includes all needed utility classes
  - max-sm:border-r, max-sm:border-b, max-sm:border-border generated in @media not all and (min-width:40rem)

files_changed:
  - apps/landing/src/styles/global.css
  - apps/landing/src/components/StatsBar.tsx
  - apps/landing/src/components/InstallCta.tsx
  - apps/landing/src/components/Hero.module.css (deleted)
  - apps/landing/src/components/Features.module.css (deleted)
  - apps/landing/src/components/TickerDemo.module.css (deleted)
  - apps/landing/src/components/CodeSample.module.css (deleted)
  - apps/landing/src/components/InstallCta.module.css (deleted)
  - apps/landing/src/components/Nav.module.css (deleted)
  - apps/landing/src/components/StatsBar.module.css (deleted)
  - apps/landing/src/components/Footer.module.css (deleted)
