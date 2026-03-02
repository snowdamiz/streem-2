# Phase 11: Improve Styles DX with React-like Classes and Styles API - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve the developer experience for styling in Streem's JSX/DOM layer. This covers:
1. Making the `class`/`className` prop accept clsx-like values (arrays, objects, mixed)
2. Adding `className` as an alias for `class`
3. Removing `classList` (replaced by the new class API)
4. Fixing `bindStyle` to diff and clear removed properties on updates
5. Adding CSS Modules TypeScript support and migrating the landing app away from inline `<style>` string blocks

Does NOT include: Shadow DOM scoping, auto-scoped style tags, CSS-in-JS tagged templates, utility CSS libraries.

</domain>

<decisions>
## Implementation Decisions

### class prop — value types
- `class` (and `className`) must accept: strings, arrays, objects, and mixed array+objects
- Array values: falsy items (`false`, `null`, `undefined`, `''`) are silently skipped
- Object values: keys are class names, truthy values activate them
- Mixed: `['btn', { 'btn-primary': isPrimary }]` — clsx-compatible behavior
- All of the above work reactively (as signal accessors) too

### className alias
- Both `class` and `className` work identically on DOM elements
- No preference — both are valid; framework treats them the same

### classList removal
- `classList` prop is REMOVED entirely — breaking change, intentional
- Replacement: use the new `class` object syntax (`class={{ active: isActive }}`)
- No deprecation warning period — clean break

### Style cleanup (bindStyle)
- When a reactive style object updates, previously-set keys that are absent in the new value must be explicitly cleared (`el.style.removeProperty(key)` or set to `''`)
- Implementation must track the previous style object and diff against it on each update
- `Object.assign` approach is replaced with a proper diff

### Numeric px auto-conversion
- NOT implemented — users must write explicit units (`'100px'`, not `100`)
- Avoids surprises for unitless properties like `opacity`, `zIndex`, `lineHeight`

### CSS Modules
- Add a global TypeScript declaration for `*.module.css` imports so `import styles from './Hero.module.css'` compiles without error
- Update the `create-streem` project template to use CSS Modules by default
- Migrate `apps/landing` components from inline `<style>{\`...\`}</style>` blocks to `.module.css` files — this is the dogfood demonstration

### Claude's Discretion
- The exact TypeScript type for the new `class` prop value (union of string | string[] | Record<string, boolean> | Array<string | Record<string, boolean> | false | null | undefined>)
- Whether to export a `cx()` / `cn()` helper from `/dom` for constructing class strings programmatically
- How to handle `className` and `class` both present simultaneously (last wins, or merge)
- CSS module type declaration location (env.d.ts, vite-env.d.ts, or a dedicated types/ file)

</decisions>

<specifics>
## Specific Ideas

- Pain point explicitly from `apps/landing/src/components/Hero.tsx` — the `<style>{` ... `}</style>` pattern with raw CSS strings is the DX problem being solved
- Want "React-like" — meaning: `class={{ active: isActive }}` should feel as natural as React's `className`

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-improve-styles-dx-with-react-like-classes-and-styles-api*
*Context gathered: 2026-03-01*
