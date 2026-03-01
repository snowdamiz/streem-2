// Cherry-pick only — never import from '@shoelace-style/shoelace' main entry
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/badge/badge.js'
// This import makes TypeScript pick up the augmented JSX.IntrinsicElements
import '@streem/lit'
import styles from './InstallCta.module.css'

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
    <section class={styles.ctaSection}>
      <div class="container">
        {/* sl-badge: version tag with typed prop:variant */}
        <div class={styles.ctaBadge}>
          <sl-badge prop:variant="neutral" prop:pill={true}>{VERSION}</sl-badge>
        </div>

        <h2 class={styles.ctaTitle}>Ready to build?</h2>
        <p class={styles.ctaSub}>
          Bootstrap a new project or drop Streem into an existing Vite app.
          No build plugin required.
        </p>

        <div class={styles.ctaActions}>
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

        <p class={styles.ctaFootnote}>
          Open source · TypeScript · Zero runtime dependencies beyond <code>alien-signals</code>
        </p>
      </div>
    </section>
  )
}
