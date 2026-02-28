import { signal, computed, onMount } from 'streem'

export function Hero(): Node {
  // Live reactive counter demo — shows signals updating DOM in real time
  const count = signal(0)
  const doubled = computed(() => count() * 2)

  // Auto-increment to demonstrate reactivity to visitors
  onMount(() => {
    const id = setInterval(() => count.set(count() + 1), 800)
    return () => clearInterval(id)
  })

  return (
    <header class="hero">
      <div class="container">
        <div class="hero-badge">
          {/* sl-badge added in plan 06-03; placeholder for now */}
          <span class="badge">v0.1.0</span>
        </div>
        <h1 class="hero-headline">
          Build reactive UIs that update in microseconds
        </h1>
        <p class="hero-sub">
          Streem brings fine-grained signals and real-time streams to the browser —
          no virtual DOM, no dependency arrays, no magic. Just TypeScript.
        </p>
        {/* Live demo: reactive counter showing signal + computed */}
        <div class="hero-demo">
          <div class="demo-label">Live signal demo</div>
          <div class="demo-values">
            <div class="demo-cell">
              <div class="demo-value">{count}</div>
              <div class="demo-caption">count()</div>
            </div>
            <div class="demo-cell">
              <div class="demo-value accent">{doubled}</div>
              <div class="demo-caption">computed(() =&gt; count() * 2)</div>
            </div>
          </div>
        </div>
        <div class="hero-install">
          <code class="install-cmd">npm create streem@latest</code>
        </div>
      </div>

      <style>{`
        .hero {
          padding: 100px 0 80px;
          text-align: center;
        }
        .hero-badge { margin-bottom: 16px; }
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border: 1px solid var(--color-accent);
          border-radius: 20px;
          font-size: 13px;
          color: var(--color-accent);
          font-family: var(--font-mono);
        }
        .hero-headline {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          max-width: 800px;
          margin: 0 auto 20px;
        }
        .hero-sub {
          font-size: 1.2rem;
          color: var(--color-muted);
          max-width: 600px;
          margin: 0 auto 48px;
        }
        .hero-demo {
          display: inline-block;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 24px 32px;
          margin-bottom: 32px;
        }
        .demo-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-muted);
          margin-bottom: 16px;
        }
        .demo-values {
          display: flex;
          gap: 40px;
          justify-content: center;
        }
        .demo-cell { text-align: center; }
        .demo-value {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: var(--font-mono);
          line-height: 1;
          margin-bottom: 8px;
        }
        .demo-value.accent { color: var(--color-accent); }
        .demo-caption {
          font-size: 12px;
          color: var(--color-muted);
          font-family: var(--font-mono);
        }
        .hero-install { margin-top: 8px; }
        .install-cmd {
          display: inline-block;
          padding: 10px 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          font-size: 1rem;
          cursor: pointer;
        }
      `}</style>
    </header>
  ) as unknown as Node
}
