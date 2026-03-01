import { run as runSignal } from './suites/signal.mjs'
import { run as runComputed } from './suites/computed.mjs'
import { run as runEffect } from './suites/effect.mjs'

function printResults(name, bench) {
  console.log(`\n## ${name}`)
  console.log('')
  const rows = bench.tasks.map(t => ({
    name: t.name,
    'ops/sec': Math.round(t.result.hz).toLocaleString(),
    'avg (ns)': (t.result.mean * 1e6).toFixed(2),
    samples: t.result.samples.length,
  }))
  // Print table
  const headers = Object.keys(rows[0])
  const widths = headers.map(h => Math.max(h.length, ...rows.map(r => String(r[h]).length)))
  const hr = widths.map(w => '-'.repeat(w + 2)).join('|')
  const fmt = row => headers.map((h, i) => (' ' + String(row[h])).padEnd(widths[i] + 2)).join('|')
  console.log('|' + headers.map((h, i) => (' ' + h).padEnd(widths[i] + 2)).join('|') + '|')
  console.log('|' + hr + '|')
  rows.forEach(r => console.log('|' + fmt(r) + '|'))
}

const node = process.version
console.log(`# @streem/core Signal Benchmarks`)
console.log(`Node: ${node} | Date: ${new Date().toISOString().slice(0, 10)}`)

const { bench: signalBench, name: signalName } = await runSignal()
printResults(signalName, signalBench)

const { bench: computedBench, name: computedName } = await runComputed()
printResults(computedName, computedBench)

const { bench: effectBench, name: effectName } = await runEffect()
printResults(effectName, effectBench)

console.log('\nDone.')
