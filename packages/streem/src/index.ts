// Core signals — developer-facing primitives only
// NOTE: startBatch/endBatch are internal — NOT re-exported; only batch() from @streem/streams is public
export { signal, computed, effect, createRoot, onCleanup, getOwner, runWithOwner } from '@streem/core'
export type { Signal, Owner } from '@streem/core'

// DOM / JSX runtime — developer-facing primitives only
// NOTE: HMR utilities (registerForHMR, getRestoredValue, saveToHotData, etc.) are internal — NOT re-exported
// NOTE: streemHMR IS exported — it is a developer-facing Vite plugin needed in vite.config.ts
export { h, Fragment, render, onMount, Show, For, ErrorBoundary, Suspense, streemHMR } from '@streem/dom'
export type { CSSProperties } from '@streem/dom'

// Streaming primitives
export { fromWebSocket, fromSSE, fromReadable, fromObservable, batch, throttle, debounce, MaxRetriesExceededError } from '@streem/streams'
export type { StreamStatus, StreamTuple, WebSocketOptions, SSEOptions, ReadableOptions, ObservableOptions, Subscribable } from '@streem/streams'

// NOT exported from 'streem': @streem/lit (Lit peer dep must remain opt-in)
