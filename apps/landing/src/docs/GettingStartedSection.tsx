import { DocSection, Code } from './DocSection'

export function GettingStartedSection(): Node {
  return (
    <DocSection id="getting-started" title="Getting started">
      <p class="text-muted mb-3 text-[0.95rem]">Bootstrap a new project in one command:</p>
      <Code>{`npm create @streeem@latest`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">Or install manually in an existing Vite project:</p>
      <Code>{`npm install streeem\n\n# tsconfig.json\n{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "streeem"\n  }\n}\n\n# vite.config.ts\nimport { defineConfig } from 'vite'\nimport { streemHMR } from 'streeem'\n\nexport default defineConfig({\n  plugins: [streemHMR()]\n})`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">For styling setup (CSS Modules or Tailwind v4), see the <a href="#styling" class="text-blue-400 no-underline hover:underline">Styling guide</a>.</p>
      <p class="text-muted mb-3 text-[0.95rem]">Here is a minimal counter app to verify everything works:</p>
      <Code>{`import { signal } from 'streeem'\n\nexport function Counter() {\n  const count = signal(0)\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button on:click={() => count.set(count() + 1)}>+1</button>\n    </div>\n  )\n}`}</Code>
      <p class="text-muted mb-3 text-[0.95rem]">TypeScript tip: streem infers the type from the initial value. For explicit typing use <code>signal&lt;number&gt;(0)</code>.</p>
    </DocSection>
  ) as unknown as Node
}
