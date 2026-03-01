function LogoIcon() {
  return (
    <svg class="text-text shrink-0" width="22" height="22" viewBox="95 78 163 260" fill="none" aria-hidden="true">
      <path d="M235.335 80.9964C245.558 78.4613 255.4 86.3255 255.182 96.8564L252.704 216.868C252.431 230.124 237.078 237.314 226.72 229.037L112.689 137.916C102.331 129.639 105.957 113.078 118.826 109.887L235.335 80.9964Z" fill="currentColor"/>
      <path d="M117.352 335.059C107.222 337.72 97.3087 330.091 97.2872 319.617L97.0397 198.977C97.0125 185.685 112.265 178.158 122.798 186.265L239.727 276.255C250.261 284.361 246.89 301.032 234.034 304.409L117.352 335.059Z" fill="currentColor"/>
    </svg>
  ) as unknown as Node
}

export function Nav(): Node {
  return (
    <nav class="fixed top-0 left-0 right-0 z-[100] h-16 bg-black/85 backdrop-blur-md border-b border-border">
      <div class="container h-full flex items-center justify-between">
        <a class="flex items-center gap-2 text-[17px] font-bold text-text tracking-[-0.02em]" href="/">
          <LogoIcon />
          <span class="font-extrabold tracking-[-0.03em]">streem</span>
        </a>

        <div class="flex items-center gap-6">
          <a class="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text" href="./docs">Docs</a>
          <a class="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text" href="https://github.com/nicholasgasior/streem" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
          <code class="hidden md:inline-block px-3 py-[5px] bg-surface-2 border border-border-2 rounded-[6px] text-[12px] font-mono text-muted cursor-default select-all">npm create streem@latest</code>
        </div>
      </div>
    </nav>
  ) as unknown as Node
}
