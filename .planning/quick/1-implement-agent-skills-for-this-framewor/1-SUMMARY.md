---
phase: quick-1
plan: 1
subsystem: agent-skills
tags: [skills, documentation, developer-experience, progressive-disclosure]
dependency_graph:
  requires: []
  provides: [streem-agent-skills]
  affects: [agent-coding-sessions]
tech_stack:
  added: []
  patterns: [progressive-disclosure, skill-routing, sub-skill-on-demand]
key_files:
  created:
    - .agents/skills/streem/SKILL.md
    - .agents/skills/streem/skills/signals/SKILL.md
    - .agents/skills/streem/skills/lifecycle/SKILL.md
    - .agents/skills/streem/skills/components/SKILL.md
    - .agents/skills/streem/skills/streams/SKILL.md
    - .agents/skills/streem/skills/stream-combinators/SKILL.md
    - .agents/skills/streem/skills/lit/SKILL.md
  modified: []
decisions:
  - "Progressive disclosure: top-level SKILL.md auto-loads, 6 sub-skills load on demand by topic"
  - "Sub-skills organized by API domain not by package (signals/lifecycle split from /core)"
  - "Documented computed() returns () => T not Signal<T> — critical non-obvious behavior"
  - "Documented StreamTuple shape shared by all 4 stream adapters — avoids repeated lookup"
metrics:
  duration: "2m 29s"
  completed_date: "2026-03-01"
  tasks_completed: 3
  files_changed: 7
---

# Quick Task 1: Implement Agent Skills for streem Framework — Summary

**One-liner:** Progressive-disclosure skill tree (7 SKILL.md files) covering all streem APIs — signals, lifecycle, JSX/components, stream adapters, combinators, and Lit interop.

## What Was Built

A complete agent skill tree for the streem reactive UI framework under `.agents/skills/streem/`:

- **Top-level entry point** (`SKILL.md`) with `auto_load: true`, package reference table, and routing rules directing agents to the right sub-skill by topic
- **6 focused sub-skills** covering each API domain with accurate TypeScript signatures, working examples, and gotcha callouts

## Task Breakdown

### Task 1: Top-level SKILL.md (commit b44bbdf)

Created `.agents/skills/streem/SKILL.md` — the auto-loaded entry point.

Contains:
- Package table (streem, /core, /dom, /streams, /lit)
- Sub-skill routing table mapping topic keywords to sub-skill files
- Routing rules (6 rules, one per domain)

### Task 2: signals, lifecycle, components sub-skills (commit 0656991)

Created three sub-skill files documenting /core and /dom APIs:

- **signals/SKILL.md**: Signal interface, `signal()`, `computed()` (returns getter not Signal), `effect()` (returns dispose), `isSignal()`, rules for scope requirements
- **lifecycle/SKILL.md**: `createRoot()`, `onCleanup()` (effect vs root context behavior), `onMount()` (snapshot caveat), `getOwner()`/`runWithOwner()` (async boundary pattern), Owner interface
- **components/SKILL.md**: TSConfig/Vite setup, component-runs-once model, full JSX prop binding table (prop:, attr:, on: prefixes), `render()`, Show, For (index-is-getter caveat), ErrorBoundary, Suspense (Comment anchor note)

### Task 3: streams, stream-combinators, lit sub-skills (commit a439cdc)

Created three more sub-skill files documenting /streams and /lit APIs:

- **streams/SKILL.md**: StreamTuple type definition, all four adapters (fromWebSocket with reconnect options, fromSSE with named events, fromReadable, fromObservable), cleanup-is-automatic rule
- **stream-combinators/SKILL.md**: `batch()` (no scope needed), `throttle()` (leading-edge), `debounce()` (trailing-edge), summary table with scope requirements
- **lit/SKILL.md**: Why the package exists (JS properties vs attributes), `bindLitProp()`, `observeLitProp()` (camelCase→kebab-case event naming), full interface signatures

## Key Callouts Documented

Critical non-obvious behaviors captured for agents:

1. `computed()` returns `() => T` not `Signal<T>` — call it as `doubled()` not `doubled.value`
2. Component functions run exactly once — reactivity requires accessor functions `() => sig.value` in JSX children
3. `For` index prop is `() => number` getter, not `number` — must call `index()`
4. `onMount()` reads are snapshots — use `effect()` for reactive subscriptions
5. Stream `data.value` is `T | undefined` until first message — check `status.value === 'connected'`
6. `batch()` does not need a reactive scope; `throttle()`/`debounce()` do

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 7 files verified present:
- `.agents/skills/streem/SKILL.md` — FOUND
- `.agents/skills/streem/skills/signals/SKILL.md` — FOUND
- `.agents/skills/streem/skills/lifecycle/SKILL.md` — FOUND
- `.agents/skills/streem/skills/components/SKILL.md` — FOUND
- `.agents/skills/streem/skills/streams/SKILL.md` — FOUND
- `.agents/skills/streem/skills/stream-combinators/SKILL.md` — FOUND
- `.agents/skills/streem/skills/lit/SKILL.md` — FOUND

All commits verified:
- b44bbdf — FOUND
- 0656991 — FOUND
- a439cdc — FOUND
