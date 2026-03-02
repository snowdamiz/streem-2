const STATS = [
  { value: '46.8M', unit: 'signal ops/sec', note: 'matches Preact signals' },
  { value: '18M', unit: 'computed ops/sec', note: 'exceeds Preact' },
  { value: '0', unit: 'virtual DOM layers', note: 'direct DOM writes' },
  { value: '4', unit: 'packages', note: 'core · dom · streams · lit' },
] as const

function StatCell({ s, idx }: { s: typeof STATS[number]; idx: number }): Node {
  // On mobile (2-col grid): add right border to odd-index cells (0, 2 → left column)
  // and bottom border to the first row of cells (idx 0, 1)
  const mobileRightBorder = idx % 2 === 0 ? 'max-sm:border-r max-sm:border-border' : ''
  const mobileBottomBorder = idx < 2 ? 'max-sm:border-b max-sm:border-border' : ''
  return (
    <div class={`px-8 py-6 text-center ${mobileRightBorder} ${mobileBottomBorder}`.trim()}>
      <div class="text-[2rem] font-extrabold tracking-[-0.04em] text-text leading-none mb-1">{s.value}</div>
      <div class="text-[13px] font-semibold text-text mb-0.5">{s.unit}</div>
      <div class="text-[11px] font-mono text-muted-2">{s.note}</div>
    </div>
  ) as unknown as Node
}

function Divider(): Node {
  return (
    <div class="hidden sm:block w-px h-12 bg-border" aria-hidden="true" />
  ) as unknown as Node
}

export function StatsBar(): Node {
  return (
    <div class="bg-surface border-t border-border border-b">
      <div class="container grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center">
        <StatCell s={STATS[0]} idx={0} />
        <Divider />
        <StatCell s={STATS[1]} idx={1} />
        <Divider />
        <StatCell s={STATS[2]} idx={2} />
        <Divider />
        <StatCell s={STATS[3]} idx={3} />
      </div>
    </div>
  ) as unknown as Node
}
