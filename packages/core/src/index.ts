/// <reference types="vite/client" />

export { signal } from './signal.js'
export { computed } from './signal.js'
export { effect } from './signal.js'
export { createRoot } from './owner.js'
export { onCleanup } from './owner.js'
export { getOwner } from './owner.js'
export { runWithOwner } from './owner.js'

export type { Signal } from './signal.js'
export type { Owner } from './owner.js'
