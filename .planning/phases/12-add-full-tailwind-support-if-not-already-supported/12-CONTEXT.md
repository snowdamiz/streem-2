# Phase 12: Add full tailwind support if not already supported - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Tailwind CSS v4 support to Streem: audit by migrating the landing page to use Tailwind v4 (coexisting with CSS Modules), then ship Tailwind v4 pre-configured in the `create-streem` default template. No new framework capabilities unless the audit reveals gaps.

</domain>

<decisions>
## Implementation Decisions

### Tailwind version
- Target Tailwind v4 only — uses `@tailwindcss/vite` Vite plugin, no `postcss.config.js` or `tailwind.config.js` needed
- Skip v3 support entirely

### Audit approach
- Prove Tailwind v4 works by migrating the landing page to use it
- The landing page is the dogfood integration test for the feature

### Landing page migration
- Tailwind v4 and CSS Modules coexist: Tailwind for utility classes (spacing, layout, typography), CSS Modules for scoped component-level styles
- Do NOT remove CSS Modules from the landing page — keep both working together

### Scope of "full support"
- Phase is complete when: (1) landing page uses Tailwind v4 alongside CSS Modules, and (2) `create-streem` default template ships with Tailwind v4 pre-configured
- No separate documentation needed — the template is self-documenting
- Framework-level changes (core package modifications) only if the landing page audit reveals a gap that requires them; otherwise it's purely tooling/template work

### create-streem default template
- Tailwind v4 baked into the default template — no separate template variant, no selection prompt
- `App.tsx` counter demo is styled with Tailwind classes (e.g., bg-white, p-4, text-2xl, rounded, hover:bg-blue-500) to prove Tailwind works on first boot
- `.vscode/extensions.json` included recommending `bradlc.vscode-tailwindcss` (Tailwind IntelliSense)

### Tailwind IntelliSense
- Verify that VS Code Tailwind IntelliSense picks up `class` and `className` in Streem `.tsx` files during the landing page audit
- Note in the template or commit if any additional config was required to enable autocomplete

### Claude's Discretion
- Dynamic class safety: investigate during the audit whether Streem's ClassValue (array/object patterns) causes any Tailwind class scanning gaps; handle appropriately (e.g., safelist guidance or a code comment) based on findings
- Exact Tailwind v4 setup details (CSS entry point location, `@import "tailwindcss"` placement)
- Whether `@tailwindcss/vite` v4 requires any special `tsconfig.json` changes in the template

</decisions>

<specifics>
## Specific Ideas

- The landing page migration is the real-world proof that Tailwind v4 works with Streem JSX — not just a unit test
- The default template App.tsx should look visually styled and "alive" when you first boot it, showing Tailwind actually works

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-add-full-tailwind-support-if-not-already-supported*
*Context gathered: 2026-03-01*
