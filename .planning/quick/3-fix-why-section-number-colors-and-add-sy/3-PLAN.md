---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/landing/src/components/Features.tsx
  - apps/landing/src/components/CodeSample.tsx
  - apps/landing/src/lib/highlight.ts
autonomous: true
requirements: [QUICK-3]

must_haves:
  truths:
    - "All four Why section number labels share the same neutral color family (no green or amber accents)"
    - "Code blocks in Features and CodeSample sections display syntax-highlighted tokens (keywords, strings, comments, numbers, function names)"
    - "Hero code block is unchanged"
  artifacts:
    - path: "apps/landing/src/lib/highlight.ts"
      provides: "Lightweight regex tokenizer returning HTML string with colored spans"
      exports: ["highlight"]
    - path: "apps/landing/src/components/Features.tsx"
      provides: "Updated accent values for items 02 and 04, dangerouslySetInnerHTML usage on code blocks"
    - path: "apps/landing/src/components/CodeSample.tsx"
      provides: "Highlighted code panels using the highlight utility"
  key_links:
    - from: "apps/landing/src/lib/highlight.ts"
      to: "apps/landing/src/components/Features.tsx"
      via: "import { highlight } from '../lib/highlight'"
    - from: "apps/landing/src/lib/highlight.ts"
      to: "apps/landing/src/components/CodeSample.tsx"
      via: "import { highlight } from '../lib/highlight'"
---

<objective>
Fix the Why section number colors so items 02 and 04 match the neutral palette of items 01 and 03, then add syntax highlighting to all code blocks on the landing page (Features and CodeSample components) using a lightweight inline tokenizer that matches the existing CSS token color variables.

Purpose: Visual consistency in the Why section and readable, professional code samples throughout the landing page.
Output: Updated Features.tsx, CodeSample.tsx, and a new highlight.ts utility.
</objective>

<execution_context>
@/Users/sn0w/.claude/get-shit-done/workflows/execute-plan.md
@/Users/sn0w/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/landing/src/styles/global.css
@apps/landing/src/components/Features.tsx
@apps/landing/src/components/CodeSample.tsx

<interfaces>
<!-- Token color CSS variables available in global.css: -->
<!-- --color-token-keyword: #ff7b72   (const, import, export, return, function, class, from, of, as, if, else, new, await, async, let, var, type, interface) -->
<!-- --color-token-string:  #a5d6ff   (string literals: 'single', "double", `template`) -->
<!-- --color-token-comment: #484848   (// line comments) -->
<!-- --color-token-number:  #79c0ff   (numeric literals: 0, 33, 2) -->
<!-- --color-token-fn:      #22d3ee   (function call names before '(') -->
<!-- --color-token-type:    #ffa657   (TypeScript type names, capitalized identifiers after ':') -->

<!-- Current Features.tsx FEATURES array accent values: -->
<!-- item 01: accent: 'var(--color-accent)'   = white     ← KEEP -->
<!-- item 02: accent: 'var(--color-green)'    = green     ← CHANGE to 'var(--color-accent)' -->
<!-- item 03: accent: 'var(--color-accent-2)' = light gray ← KEEP -->
<!-- item 04: accent: 'var(--color-amber)'    = amber     ← CHANGE to 'var(--color-accent-2)' -->
<!-- This makes 01+02 = white, 03+04 = light gray, alternating neutral pairs -->

<!-- The framework is Streem (custom TSX). "innerHTML" binding: use prop:innerHTML on the element. -->
<!-- In Streem JSX, setting innerHTML is done as: <code prop:innerHTML={highlight(code)} /> -->
<!-- pre/code base styles in global.css: pre code { background: none; border: none; padding: 0; font-size: inherit; } -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create highlight utility</name>
  <files>apps/landing/src/lib/highlight.ts</files>
  <action>
Create `apps/landing/src/lib/highlight.ts` with a single exported `highlight(code: string): string` function.

The function processes TypeScript/TSX code strings and returns an HTML string with token spans. It must handle tokens in priority order to avoid double-processing:

1. HTML-escape the raw code first (replace `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`).
2. Apply regex replacements in this order (each replacement must not re-process already-wrapped `<span>` tags):
   a. **Line comments**: `/\/\/[^\n]*/g` → `<span style="color:var(--color-token-comment)">$&</span>`
   b. **Template literals**: `/`[^`]*`/g` → `<span style="color:var(--color-token-string)">$&</span>`
   c. **Single-quoted strings**: `/'[^'\\]*(?:\\.[^'\\]*)*'/g` → string color span
   d. **Double-quoted strings**: `/"[^"\\]*(?:\\.[^"\\]*)*"/g` → string color span
   e. **Keywords**: `/\b(const|let|var|import|export|return|function|class|from|of|as|if|else|new|await|async|type|interface|default|null|undefined|true|false|void)\b/g` → `<span style="color:var(--color-token-keyword)">$1</span>`
   f. **Function calls** (word followed by `(`): `/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g` → `<span style="color:var(--color-token-fn)">$1</span>` — but SKIP if the match is already inside a span
   g. **Numbers**: `/\b(\d+)\b/g` → `<span style="color:var(--color-token-number)">$1</span>`

Since regex replacements can interfere with each other, use a simpler approach: process the code line by line and character by character using a mini state machine, OR use the following safe ordered approach with a placeholder technique:

**Recommended safe approach:**
- Collect all token matches with their ranges (line comments, strings, keywords, function calls, numbers).
- Sort by start index.
- Reconstruct the string by interleaving raw (escaped) text with colored spans, ensuring no overlap.

Alternatively, use a simple sequential regex approach with a guard: after each replacement pass, the wrapped `<span...>` content is treated as atomic. A practical way: run replacements in one pass using a combined regex that matches the highest-priority token first.

**Simplest working approach (implement this):**
```typescript
export function highlight(raw: string): string {
  // 1. Escape HTML special chars
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. Replace tokens in priority order using a single combined regex
  // Each branch returns a colored span for that token type
  s = s.replace(
    /(\/\/[^\n]*)|((?:`[^`]*`)|(?:'[^'\\]*(?:\\.[^'\\]*)*')|(?:"[^"\\]*(?:\\.[^"\\]*)*"))|(\b(?:const|let|var|import|export|return|function|class|from|of|as|if|else|new|await|async|type|interface|default|null|undefined|true|false|void)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b(?=\s*\())|(\b\d+(?:\.\d+)?\b)/g,
    (match, comment, str, kw, fn, num) => {
      if (comment !== undefined) return `<span style="color:var(--color-token-comment)">${comment}</span>`
      if (str !== undefined) return `<span style="color:var(--color-token-string)">${str}</span>`
      if (kw !== undefined) return `<span style="color:var(--color-token-keyword)">${kw}</span>`
      if (fn !== undefined) return `<span style="color:var(--color-token-fn)">${fn}</span>`
      if (num !== undefined) return `<span style="color:var(--color-token-number)">${num}</span>`
      return match
    }
  )

  return s
}
```

Note: Template literal backticks in the regex string — be careful with escaping in TypeScript. Write the backtick pattern as a character class or use a RegExp constructor if needed to avoid syntax issues.
  </action>
  <verify>Check that the file exists and exports `highlight`: `grep -n "export function highlight" apps/landing/src/lib/highlight.ts`</verify>
  <done>File exists, exports `highlight(code: string): string`, handles all token types with correct CSS variable colors.</done>
</task>

<task type="auto">
  <name>Task 2: Fix number colors and add syntax highlighting to Features and CodeSample</name>
  <files>
    apps/landing/src/components/Features.tsx
    apps/landing/src/components/CodeSample.tsx
  </files>
  <action>
**In Features.tsx:**

1. Add import at top: `import { highlight } from '../lib/highlight'`

2. Change accent values in the FEATURES array:
   - Item 02 (First-class streaming): change `accent: 'var(--color-green)'` → `accent: 'var(--color-accent)'`
   - Item 04 (Async + error boundaries): change `accent: 'var(--color-amber)'` → `accent: 'var(--color-accent-2)'`
   - Items 01 and 03 remain unchanged.

3. Replace the plain code rendering in the map (line 93) from:
   ```tsx
   <pre class="..."><code>{f.code}</code></pre>
   ```
   to:
   ```tsx
   <pre class="..."><code prop:innerHTML={highlight(f.code)} /></pre>
   ```
   Note: In Streem JSX, `prop:innerHTML` sets the DOM property directly. This renders the highlighted HTML string as actual DOM. Since `highlight()` is a pure function of `f.code` (a static string constant), this is safe — no user input is involved.

**In CodeSample.tsx:**

1. Add import at top: `import { highlight } from '../lib/highlight'`

2. Replace the three `<Show>` panels. Each currently renders:
   ```tsx
   <pre class="..."><code>{CODE.signals}</code></pre>
   ```
   Change each to:
   ```tsx
   <pre class="..."><code prop:innerHTML={highlight(CODE.signals)} /></pre>
   ```
   Apply the same change for `CODE.streams` and `CODE.jsx` panels.

   Since `CODE` values are static string constants defined in the same file, calling `highlight()` inline is fine — it runs once at render time and returns a static HTML string.
  </action>
  <verify>
Run the landing dev server and visually confirm, OR check that the changes compiled:
`cd /Users/sn0w/Documents/dev/streem-2 && pnpm --filter @streem/landing build 2>&1 | tail -20`
  </verify>
  <done>
- Items 02 and 04 number labels show white/light-gray (no green or amber).
- All code blocks in Features and CodeSample show colored syntax tokens matching the CSS token variables.
- Build completes without TypeScript errors.
  </done>
</task>

</tasks>

<verification>
After implementation:
1. Build passes: `pnpm --filter @streem/landing build` exits 0
2. Features item 02 accent is `var(--color-accent)`, item 04 is `var(--color-accent-2)`
3. `highlight.ts` handles comments, strings, keywords, function names, numbers
4. `prop:innerHTML` used on `<code>` elements in both Features and CodeSample
</verification>

<success_criteria>
- Build exits 0 with no TypeScript errors
- Four Why section number labels all use neutral colors (white or light-gray family)
- Code blocks in the Why section and API section display syntax-highlighted tokens
- Hero live code block is unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-why-section-number-colors-and-add-sy/3-SUMMARY.md` using the summary template.
</output>
