import { DocSection, Code } from './DocSection'

export function LitInteropSection(): Node {
  return (
    <DocSection id="lit-interop" title="Lit interop">
      <p class="text-muted mb-3 text-[0.95rem]">Use any Lit or Web Component in TSX with typed props. Install <code>@streem/lit</code> separately (it is not included in the main <code>streem</code> package).</p>
      <Code>{`npm install @streem/lit\n\n# Generate JSX types from a component library's Custom Elements Manifest\npnpm --filter @streem/lit tsx scripts/gen-lit-types.ts --pkg @shoelace-style/shoelace\n\n# In your TSX\nimport { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'\nsetBasePath('./shoelace_assets')  // must be first — before any component import\n\nimport '@shoelace-style/shoelace/dist/components/button/button.js'\nimport '@shoelace-style/shoelace/dist/components/badge/badge.js'\n\n// prop: routes to JS property (not HTML attribute) — typed by generated IntrinsicElements\n// on: uses direct addEventListener — bypasses Shadow DOM event retargeting\nexport function InstallButton() {\n  return (\n    <sl-button\n      prop:variant="primary"\n      prop:size="large"\n      on:click={() => navigator.clipboard.writeText('npm create streem@latest')}\n    >\n      Copy install command\n    </sl-button>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">A complete styled button using prop: and on: together:</p>
      <Code>{`import { signal } from 'streem'\nimport '@shoelace-style/shoelace/dist/components/button/button.js'\nimport '@shoelace-style/shoelace/dist/components/badge/badge.js'\n\nfunction NotifyButton() {\n  const count = signal(0)\n\n  return (\n    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>\n      <sl-button\n        prop:variant="primary"\n        on:click={() => count.set(count() + 1)}\n      >\n        Notify\n      </sl-button>\n      <sl-badge prop:variant="danger" prop:pill={true}>\n        {count}\n      </sl-badge>\n    </div>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">TypeScript tip: <code>prop:</code> routes to a JS property; <code>on:</code> attaches an event listener. Both are typed by the generated IntrinsicElements from the Custom Elements Manifest.</p>
    </DocSection>
  ) as unknown as Node
}
