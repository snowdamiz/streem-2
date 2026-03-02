const SUITES = [
  {
    label: 'signal',
    bars: [
      { lib: 'Streem', ops: 46_847_878 },
      { lib: 'Preact', ops: 45_002_751 },
      { lib: 'SolidJS', ops: 20_595_387 },
    ],
  },
  {
    label: 'computed',
    bars: [
      { lib: 'Streem', ops: 18_024_607 },
      { lib: 'Preact', ops: 16_715_577 },
      { lib: 'SolidJS', ops: 13_837_716 },
    ],
  },
  {
    label: 'effect',
    bars: [
      { lib: 'Streem', ops: 10_377_412 },
      { lib: 'Preact', ops: 11_514_030 },
      { lib: 'SolidJS', ops: 19_640_039 },
    ],
  },
] as const

const BAR_COLORS: Record<string, string> = {
  Streem: '#ffffff',
  Preact: '#6366f1',
  SolidJS: '#3b82f6',
}

const SHORT_LABELS: Record<string, string> = {
  Streem: 'Streem',
  Preact: 'Preact',
  SolidJS: 'Solid',
}

function formatOps(ops: number): string {
  return (ops / 1_000_000).toFixed(1) + 'M'
}

interface BarGroupProps {
  x: number
  y: number
  barW: number
  barHeight: number
  labelX: number
  labelY: number
  color: string
  shortLabel: string
  opsLabel: string
  libLabelY: number
}

function BarGroup(p: BarGroupProps): Node {
  return (
    <g>
      <text
        x={p.labelX}
        y={p.labelY}
        text-anchor="middle"
        font-size="9"
        font-family="var(--font-mono, monospace)"
        fill={p.color}
      >
        {p.opsLabel}
      </text>
      <rect
        x={p.x}
        y={p.y}
        width={p.barW}
        height={p.barHeight}
        fill={p.color}
        rx="2"
      />
      <text
        x={p.labelX}
        y={p.libLabelY}
        text-anchor="middle"
        font-size="8"
        font-family="var(--font-mono, monospace)"
        fill="var(--color-muted)"
      >
        {p.shortLabel}
      </text>
    </g>
  ) as unknown as Node
}

export function BenchmarkChart(): Node {
  // SVG dimensions
  const W = 600
  const H = 300
  const marginLeft = 40
  const marginTop = 36
  const marginBottom = 52
  const marginRight = 16
  const chartW = W - marginLeft - marginRight
  const chartH = H - marginTop - marginBottom
  const maxOps = 46_847_878

  const numClusters = SUITES.length
  const clusterW = chartW / numClusters
  const barsPerCluster = 3
  const barW = clusterW / (barsPerCluster + barsPerCluster * 0.5)
  const barGap = barW * 0.35
  const clusterBarsW = barsPerCluster * barW + (barsPerCluster - 1) * barGap

  const libLabelY = marginTop + chartH + 14
  const groupLabelY = marginTop + chartH + 30

  const yTickValues = [0, 10, 20, 30, 40]

  return (
    <section class="py-[100px] bg-surface relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]">
      <div class="container">
        <div class="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted font-mono mb-3">
          Performance
        </div>
        <h2 class="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold tracking-[-0.03em] mb-3 leading-tight">
          Benchmark comparison
        </h2>
        <p class="text-muted text-base mb-9 max-w-[560px]">
          Primitive ops/sec — signal, computed, and effect — compared against{' '}
          <code>@preact/signals-core</code> and <code>solid-js</code>.
          Node.js · Apple M4 · no DOM overhead.
        </p>

        <div class="border border-border-2 rounded-xl overflow-hidden shadow-[0_0_0_1px_var(--color-border),_0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)] bg-surface-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style="display:block"
          >
            {/* Y-axis grid lines */}
            {yTickValues.map(mops => {
              const tickY = marginTop + chartH - (mops * 1_000_000 / maxOps) * chartH
              return (
                <g>
                  <line
                    x1={marginLeft - 4}
                    y1={tickY}
                    x2={W - marginRight}
                    y2={tickY}
                    stroke="var(--color-border)"
                    stroke-width="0.5"
                  />
                  <text
                    x={marginLeft - 7}
                    y={tickY + 3}
                    text-anchor="end"
                    font-size="8.5"
                    font-family="var(--font-mono, monospace)"
                    fill="var(--color-muted-2)"
                  >
                    {mops > 0 ? `${mops}M` : '0'}
                  </text>
                </g>
              ) as unknown as Node
            })}

            {/* Bar clusters */}
            {SUITES.map((suite, si) => {
              const clusterCenterX = marginLeft + si * clusterW + clusterW / 2
              const clusterStartX = clusterCenterX - clusterBarsW / 2

              return (
                <g>
                  {suite.bars.map((bar, bi) => {
                    const barHeight = (bar.ops / maxOps) * chartH
                    const x = clusterStartX + bi * (barW + barGap)
                    const y = marginTop + chartH - barHeight
                    const color = BAR_COLORS[bar.lib] ?? '#ffffff'
                    const labelX = x + barW / 2

                    return (
                      <BarGroup
                        x={x}
                        y={y}
                        barW={barW}
                        barHeight={barHeight}
                        labelX={labelX}
                        labelY={y - 5}
                        color={color}
                        shortLabel={SHORT_LABELS[bar.lib] ?? bar.lib}
                        opsLabel={formatOps(bar.ops)}
                        libLabelY={libLabelY}
                      />
                    ) as unknown as Node
                  })}
                  {/* Suite (group) label centered below cluster */}
                  <text
                    x={clusterCenterX}
                    y={groupLabelY}
                    text-anchor="middle"
                    font-size="10"
                    font-family="var(--font-mono, monospace)"
                    font-weight="600"
                    fill="var(--color-text)"
                  >
                    {suite.label}
                  </text>
                </g>
              ) as unknown as Node
            })}
          </svg>

          {/* Legend row below SVG */}
          <div class="flex items-center justify-center gap-6 px-6 py-3 border-t border-border">
            {Object.entries(BAR_COLORS).map(([lib, color]) => (
              <div class="flex items-center gap-1.5">
                <span
                  style={`display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};${lib === 'Streem' ? 'border:1px solid rgba(255,255,255,0.3)' : ''}`}
                />
                <span class="font-mono text-[12px] text-muted-2">{lib}</span>
              </div>
            ) as unknown as Node)}
          </div>
        </div>

        <p class="text-[11px] text-muted-2 font-mono mt-4">
          Primitive only (no createRoot overhead) · tinybench 5,000 iterations · Apple M4 · 2026-03-01
        </p>
      </div>
    </section>
  ) as unknown as Node
}
