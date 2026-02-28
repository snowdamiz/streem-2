/**
 * gen-lit-types.ts — CEM → JSX types pipeline
 *
 * Run after `cem analyze --litelement` has generated custom-elements.json.
 * Writes src/lit-types/lit-elements.d.ts augmenting @streem/dom/jsx-runtime.
 *
 * Usage: tsx scripts/gen-lit-types.ts [--pkg <package-name>]
 *   (no flags): reads ./custom-elements.json from `cem analyze` output
 *   --pkg <name>: reads CEM from node_modules/<name>/custom-elements.json
 *                 (for generating types from a third-party Lit component library)
 *
 * Full workflow:
 *   pnpm gen:lit-types
 *   (which runs: cem analyze --litelement && tsx scripts/gen-lit-types.ts)
 *
 * The generated file augments @streem/dom/jsx-runtime with:
 *   declare module '@streem/dom/jsx-runtime' {
 *     namespace JSX {
 *       interface IntrinsicElements { <element-types> }
 *     }
 *   }
 *
 * @see https://github.com/wc-toolkit/jsx-types
 * @see https://custom-elements-manifest.open-wc.org/analyzer/getting-started/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { generateJsxTypes } from '@wc-toolkit/jsx-types'

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const pkgFlag = args.indexOf('--pkg')
let manifestPath = './custom-elements.json'

if (pkgFlag !== -1 && args[pkgFlag + 1]) {
  const pkgName = args[pkgFlag + 1]
  manifestPath = join('./node_modules', pkgName, 'custom-elements.json')
}

// ---------------------------------------------------------------------------
// Validate manifest exists
// ---------------------------------------------------------------------------

if (!existsSync(manifestPath)) {
  console.error(`[gen-lit-types] CEM manifest not found at: ${manifestPath}`)
  if (pkgFlag === -1) {
    console.error('[gen-lit-types] Run: pnpm cem analyze --litelement  (or: pnpm gen:lit-types)')
  } else {
    console.error('[gen-lit-types] Ensure the package ships a custom-elements.json in its root.')
  }
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Load manifest
// ---------------------------------------------------------------------------

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

// ---------------------------------------------------------------------------
// Output paths
// ---------------------------------------------------------------------------

const outDir = './src/lit-types'
const fileName = 'lit-elements.d.ts'
const generatedPath = join(outDir, fileName)

// Ensure output directory exists
mkdirSync(outDir, { recursive: true })

// ---------------------------------------------------------------------------
// Generate JSX types via @wc-toolkit/jsx-types
//
// generateJsxTypes writes a raw TypeScript interface body to outDir/fileName.
// We then post-process that output to wrap it in the correct
// `declare module '@streem/dom/jsx-runtime'` block, matching the path that
// TypeScript resolves when jsxImportSource is set to "@streem/dom".
// ---------------------------------------------------------------------------

const rawContent = generateJsxTypes(manifest, {
  fileName,
  outdir: outDir,
  stronglyTypedEvents: true,
})

if (!rawContent) {
  console.error('[gen-lit-types] generateJsxTypes returned no content. Check your manifest.')
  process.exit(1)
}

// Post-process: if the generated file doesn't start with declare module already,
// wrap it in the module augmentation block.
const existing = existsSync(generatedPath) ? readFileSync(generatedPath, 'utf8') : ''

if (!existing.trimStart().startsWith("declare module '@streem/dom/jsx-runtime'")) {
  // Wrap the generated interface body inside the correct module declaration
  const wrapped =
    `// GENERATED — DO NOT EDIT. Run: pnpm gen:lit-types\n` +
    `// Source: ${manifestPath}\n` +
    `// @see https://github.com/wc-toolkit/jsx-types\n\n` +
    `declare module '@streem/dom/jsx-runtime' {\n` +
    `  namespace JSX {\n` +
    `${rawContent
      .split('\n')
      .map((line) => (line.length > 0 ? `    ${line}` : line))
      .join('\n')}\n` +
    `  }\n` +
    `}\n`

  writeFileSync(generatedPath, wrapped, 'utf8')
  console.log(`[gen-lit-types] Written (wrapped): ${generatedPath}`)
} else {
  console.log(`[gen-lit-types] Written: ${generatedPath}`)
}
