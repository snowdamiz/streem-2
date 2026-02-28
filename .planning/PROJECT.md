# Streem

## What This Is

Streem is a TypeScript-first, JSX/TSX front-end framework built around reactive signals and real-time data streams. It targets developers who want fine-grained reactivity (signals, no VDOM diffing) with first-class support for WebSockets, SSE, fetch streams, and observable-style sources — without the complexity of a custom compiler. It is published open source and its landing page is built with the framework itself.

## Core Value

Signals and streams are first-class primitives — not adapters or plugins — so real-time UIs feel as natural to write as static ones.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] JSX/TSX authoring with no custom compiler (Vite-powered)
- [ ] Fine-grained reactive signals for local and shared state
- [ ] First-class streaming primitives: WebSocket, SSE, fetch streams, Observable/RxJS-compatible sources
- [ ] Native Lit component interop: import and use Lit web components in TSX with typed props
- [ ] AI agent skills installer: script copies SKILL.md + sub-skills into developer AI tools (Claude, Codex, Copilot, etc.) during project init
- [ ] Framework skills written with progressive disclosure (SKILL.md → sub-skill files)
- [ ] Landing page built with Streem (dogfood proof + official public site)
- [ ] CSR-only (browser rendering, no SSR)

### Out of Scope

- Custom compiler / rune syntax — v1 lesson: not worth the DX cost
- Server-side rendering — CSR-only for now; SSR may come in a future milestone
- Generating or wrapping Lit components — interop is consume-only (use Lit in TSX, not compile to Lit)

## Context

- **v1 lesson:** Streem v1 used a Svelte-like rune syntax with a custom compiler. The DX overhead wasn't justified by the gains. v2 drops the compiler entirely and adopts standard TSX via Vite.
- **Streaming model:** All four stream types (WebSocket, SSE, ReadableStream, Observable) should bind directly to signals or template expressions — no manual subscription management in userland.
- **Agent skills pattern:** Modeled on the Cadence installer (`install-cadence-skill.mjs`) — a script copies skill files into `~/.claude/skills/`, `~/.codex/skills/`, etc. The skill itself uses progressive disclosure: a root `SKILL.md` routes to topic sub-skills (components, signals, streaming, Lit interop, etc.).
- **Dogfood constraint:** The landing page is not a demo afterthought. It must be built with Streem and shipped as the official site. If something is painful to build on the landing page, that's a framework bug.
- **Audience:** Open source public release — API ergonomics, documentation quality, and first-run DX matter.

## Constraints

- **Tech Stack:** TypeScript, JSX/TSX, Vite — no custom compiler or transform step beyond standard JSX
- **Rendering:** CSR only — no Node.js server runtime requirement for the framework itself
- **Interop direction:** Lit interop is consume-only (Lit → Streem, not Streem → Lit)
- **Signals:** Must not require a build plugin to work — signals should be plain TS imports

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Drop rune/compiler approach | v1 proved the complexity/reward ratio is unfavorable | — Pending |
| Vite as build foundation | Ecosystem, HMR, plugin support — no bespoke toolchain | — Pending |
| CSR-only for v1 | Keeps scope tight; SSR adds significant complexity | — Pending |
| Progressive disclosure for AI skills | Root SKILL.md routes to sub-skills rather than one monolithic doc | — Pending |

---
*Last updated: 2026-02-27 after initialization*
