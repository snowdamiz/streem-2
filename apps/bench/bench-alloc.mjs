import { signal } from '@streeem/core'
import { signal as ps } from '@preact/signals-core'

const N = 100000

gc()
let before = process.memoryUsage().heapUsed
for (let i = 0; i < N; i++) { const s = signal(0); s.set(1); s.value }
gc()
let after = process.memoryUsage().heapUsed
console.log('/core signal bytes/iter:', Math.round((after - before) / N))

gc()
before = process.memoryUsage().heapUsed
for (let i = 0; i < N; i++) { const s = ps(0); s.value = 1; s.value }
gc()
after = process.memoryUsage().heapUsed
console.log('@preact/signals-core signal bytes/iter:', Math.round((after - before) / N))
