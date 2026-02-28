import { Hero } from './components/Hero'
import { TickerDemo } from './components/TickerDemo'
import { Features } from './components/Features'
import { CodeSample } from './components/CodeSample'

// InstallCta is implemented in plan 06-03 with Shoelace components.
// Stub here so App.tsx compiles without a dependency on 06-03 files.
function InstallCtaStub() {
  return (
    <section class="cta-section">
      <div class="container">
        <h2 class="section-title">Get started in seconds</h2>
        <code class="install-big">npm create streem@latest</code>
      </div>
      <style>{`
        .cta-section { text-align: center; }
        .install-big {
          display: inline-block;
          padding: 14px 28px;
          font-size: 1.1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          margin-top: 24px;
        }
      `}</style>
    </section>
  )
}

export function App() {
  return (
    <div>
      <Hero />
      <TickerDemo />
      <Features />
      <CodeSample />
      <InstallCtaStub />
    </div>
  )
}
