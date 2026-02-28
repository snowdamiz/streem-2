// Generates an SVG polyline path string for a sparkline.
// ~15 lines of math; no library dependency needed for this.
export function buildSparklinePath(
  data: number[],
  width = 80,
  height = 24
): string {
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${points.join(' L ')}`
}
