// Cherry-pick only — never import from '@shoelace-style/shoelace' main entry
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/badge/badge.js'
// This import makes TypeScript pick up the augmented JSX.IntrinsicElements
import '@streem/lit'

const VERSION = '0.1.0'

export function InstallCta() {
  const handleCopyInstall = () => {
    navigator.clipboard.writeText('npm create streem@latest').catch(() => {
      // Fallback: select the code text
    })
  }

  const handleCopySkill = () => {
    navigator.clipboard.writeText('npx streem install-skill').catch(() => {})
  }

  return (
    <section class="cta-section">
      <div class="container">
        {/* sl-badge: version tag with typed prop:variant */}
        <div class="cta-badge">
          <sl-badge prop:variant="neutral" prop:pill={true}>{VERSION}</sl-badge>
        </div>

        <h2 class="cta-title">Ready to build?</h2>
        <p class="cta-sub">
          Bootstrap a new project or drop Streem into an existing Vite app.
          No build plugin required.
        </p>

        <div class="cta-actions">
          {/* sl-button: primary CTA — on:click fires directly (Shadow DOM event retargeting safe) */}
          <sl-button
            prop:variant="primary"
            prop:size="large"
            on:click={handleCopyInstall}
          >
            npm create streem@latest
          </sl-button>

          <sl-button
            prop:variant="neutral"
            prop:size="large"
            on:click={handleCopySkill}
          >
            Install AI skill
          </sl-button>
        </div>

        <p class="cta-footnote">
          Open source · TypeScript · Zero runtime dependencies beyond <code>alien-signals</code>
        </p>
      </div>

      <style>{`
        .cta-section {
          text-align: center;
          padding: 100px 0;
          background: linear-gradient(to bottom, var(--color-bg), var(--color-surface));
        }
        .cta-badge { margin-bottom: 20px; }
        .cta-title {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 700;
          margin-bottom: 16px;
        }
        .cta-sub {
          color: var(--color-muted);
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto 40px;
        }
        .cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .cta-footnote {
          color: var(--color-muted);
          font-size: 14px;
        }
      `}</style>
    </section>
  )
}
