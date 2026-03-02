import { signal } from 'streeem'

export function InstallCta(): Node {
  const installCopied = signal(false)
  const skillCopied = signal(false)

  const copyInstall = async () => {
    await navigator.clipboard.writeText('npm create @streeem@latest').catch(() => {})
    installCopied.set(true)
    setTimeout(() => installCopied.set(false), 2000)
  }

  const copySkill = async () => {
    await navigator.clipboard.writeText('npx streem install-skill').catch(() => {})
    skillCopied.set(true)
    setTimeout(() => skillCopied.set(false), 2000)
  }

  return (
    <section class="py-[120px] bg-surface text-center relative overflow-hidden">
      {/* Glow */}
      <div class="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.03)_0%,transparent_65%)] pointer-events-none" aria-hidden="true" />

      <div class="container">
        <div class="relative z-[1] max-w-[680px] mx-auto">
          <div class="text-[11px] uppercase tracking-[0.12em] text-accent font-mono mb-5">Get started</div>
          <h2 class="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.1] mb-5 text-text">
            Start building in seconds.
          </h2>
          <p class="text-muted text-base leading-[1.75] mb-12 max-w-[520px] mx-auto">
            Bootstrap a full Streem project with Tailwind CSS v4 pre-configured,
            or drop it into any existing Vite app. No build plugin required.
          </p>

          <div class="flex flex-col items-center gap-4 mb-9">
            <div class="w-full max-w-[480px]">
              <div class="text-[11px] font-mono text-muted-2 uppercase tracking-[0.08em] mb-2 text-left">Bootstrap new project</div>
              <div class="flex items-center border border-border-2 rounded-lg overflow-hidden bg-bg">
                <code class="flex-1 px-[18px] py-[13px] text-sm font-mono text-text bg-transparent border-none select-all">npm create @streeem@latest</code>
                <button class="min-w-[56px] px-4 py-[13px] bg-surface-2 border-l border-border-2 text-muted text-[12px] font-mono cursor-pointer transition-colors hover:text-text hover:bg-surface-3" onclick={copyInstall}>
                  {() => installCopied.value ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
            <div class="text-[12px] text-muted-2 font-mono">or</div>
            <div class="w-full max-w-[480px]">
              <div class="text-[11px] font-mono text-muted-2 uppercase tracking-[0.08em] mb-2 text-left">Install AI skill for your editor</div>
              <div class="flex items-center border border-border-2 rounded-lg overflow-hidden bg-bg">
                <code class="flex-1 px-[18px] py-[13px] text-sm font-mono text-text bg-transparent border-none select-all">npx streem install-skill</code>
                <button class="min-w-[56px] px-4 py-[13px] bg-surface-2 border-l border-border-2 text-muted text-[12px] font-mono cursor-pointer transition-colors hover:text-text hover:bg-surface-3" onclick={copySkill}>
                  {() => skillCopied.value ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-4 flex-wrap mb-9">
            <a
              class="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg text-sm font-semibold text-black transition-[opacity,transform] hover:opacity-90 hover:-translate-y-px"
              href="https://github.com/nicholasgasior/streem"
              target="_blank"
              rel="noopener"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </a>
            <a class="inline-flex items-center px-6 py-3 border border-border-2 rounded-lg text-sm text-muted transition-colors hover:text-text hover:border-text" href="/docs">
              Read the docs →
            </a>
          </div>

          <p class="text-[13px] text-muted-2">
            Open source · MIT · TypeScript-first · Zero runtime dependencies beyond{' '}
            <code>alien-signals</code>
          </p>
        </div>
      </div>
    </section>
  ) as unknown as Node
}
