// CEM analyzer config for @streem/lit
// Run via: pnpm gen:lit-types (which calls: cem analyze --litelement && tsx scripts/gen-lit-types.ts)
export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.browser.test.ts',
    'src/**/*.d.ts',
  ],
  outdir: './',
  litelement: true,
}
