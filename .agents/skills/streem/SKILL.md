---
name: streem
description: Reactive UI library — signals, JSX, streaming
auto_load: true
---

# streem

Reactive UI framework with signals and streams as first-class primitives.

## Packages

| Package | Import | Contents |
|---------|--------|----------|
| `streem` | `import { ... } from 'streem'` | Re-exports everything |
| `@streem/core` | `import { ... } from '@streem/core'` | Signals, effects, scopes |
| `@streem/dom` | configured via jsxImportSource | JSX factory, render, components |
| `@streem/streams` | `import { ... } from '@streem/streams'` | Stream adapters, combinators |
| `@streem/lit` | `import { ... } from '@streem/lit'` | Lit/custom element interop |

## Sub-skills (load on demand)

| Sub-skill | File | When to load |
|-----------|------|--------------|
| signals | `skills/signals/SKILL.md` | signal(), computed(), effect(), isSignal() |
| lifecycle | `skills/lifecycle/SKILL.md` | createRoot(), onCleanup(), onMount(), getOwner(), runWithOwner() |
| components | `skills/components/SKILL.md` | h/JSX, render(), Show, For, ErrorBoundary, Suspense |
| streams | `skills/streams/SKILL.md` | fromWebSocket(), fromSSE(), fromReadable(), fromObservable() |
| stream-combinators | `skills/stream-combinators/SKILL.md` | batch(), throttle(), debounce() |
| lit | `skills/lit/SKILL.md` | bindLitProp(), observeLitProp() |

## Routing rules

- User asks about state, reactivity, signal, computed, effect → read `skills/signals/SKILL.md`
- User asks about scope, cleanup, mount, owner, async reactive → read `skills/lifecycle/SKILL.md`
- User asks about JSX, components, render, Show, For, ErrorBoundary, Suspense → read `skills/components/SKILL.md`
- User asks about WebSocket, SSE, streams, fromWebSocket, fromSSE → read `skills/streams/SKILL.md`
- User asks about batch, throttle, debounce, high-frequency → read `skills/stream-combinators/SKILL.md`
- User asks about Lit, custom elements, web components, bindLitProp → read `skills/lit/SKILL.md`
