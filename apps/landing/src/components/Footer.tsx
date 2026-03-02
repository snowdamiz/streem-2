export function Footer(): Node {
  return (
    <footer class="bg-bg border-t border-border py-8">
      <div class="container flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-[7px]">
          <svg class="text-text" width="20" height="15" viewBox="0 0 24 18" fill="none" aria-hidden="true">
            <path
              d="M1 13 C4 5, 7 2, 9.5 5 S14.5 13, 17 10 S21 2, 23 5"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
          <span class="text-[15px] font-bold tracking-[-0.02em] text-muted">streem</span>
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
