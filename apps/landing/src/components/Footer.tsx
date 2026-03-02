export function Footer(): Node {
  return (
    <footer class="bg-bg border-t border-border py-8">
      <div class="container flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-2">
          <svg class="text-text shrink-0" width="20" height="20" viewBox="95 78 163 260" fill="none" aria-hidden="true">
            <path d="M235.335 80.9964C245.558 78.4613 255.4 86.3255 255.182 96.8564L252.704 216.868C252.431 230.124 237.078 237.314 226.72 229.037L112.689 137.916C102.331 129.639 105.957 113.078 118.826 109.887L235.335 80.9964Z" fill="currentColor"/>
            <path d="M117.352 335.059C107.222 337.72 97.3087 330.091 97.2872 319.617L97.0397 198.977C97.0125 185.685 112.265 178.158 122.798 186.265L239.727 276.255C250.261 284.361 246.89 301.032 234.034 304.409L117.352 335.059Z" fill="currentColor"/>
          </svg>
          <span class="text-[15px] font-extrabold tracking-[-0.03em] text-text">streem</span>
        </div>

        <div class="flex items-center gap-5">
          <a class="text-[13px] text-muted-2 transition-colors hover:text-text" href="/docs">Docs</a>
          <a class="text-[13px] text-muted-2 transition-colors hover:text-text" href="https://github.com/nicholasgasior/streem" target="_blank" rel="noopener">GitHub</a>
          <a class="text-[13px] text-muted-2 transition-colors hover:text-text" href="https://www.npmjs.com/package/streem" target="_blank" rel="noopener">npm</a>
        </div>

        <div class="text-[13px] text-muted-2">
          Built with{' '}
          <a class="text-accent hover:underline" href="/" title="This page is built with Streem">Streem</a>
          {' '}· MIT License
        </div>
      </div>
    </footer>
  ) as unknown as Node
}
