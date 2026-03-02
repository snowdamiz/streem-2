---
status: awaiting_human_verify
trigger: "landing-page-hero-demo-broken"
created: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:02:00Z
---

## Current Focus

hypothesis: FIXED - propagateDirty now uses notifyVersion guard on ComputedNode to prevent re-marking computeds Pending within a single propagation wave
test: All tests pass (40 core + 108 DOM + 45 streams)
expecting: Human verification that the landing page hero demo now works
next_action: Human verifies the fix in the browser

## Symptoms

expected: The hero interactive demo should continuously update reactively — the "doubled" value should always be 2x the counter, the "even" value should toggle correctly every tick
actual: Both "doubled" and "even" values update exactly once and then freeze — they never change again
errors: No reported console errors
reproduction: Open the landing page and observe the hero demo counter/reactive values
started: Unknown — may never have worked after recent changes

## Eliminated

- hypothesis: DOM binding issue (isSignal vs function path)
  evidence: Pure core effect test (no DOM) reproduces the same freeze behavior
  timestamp: 2026-03-01

- hypothesis: Memory leak / scope disposal
  evidence: Effects are observed running correctly on tick 1; no disposal
  timestamp: 2026-03-01

- hypothesis: Single computed binding
  evidence: Single computed + bindTextNode works fine for many ticks
  timestamp: 2026-03-01

## Evidence

- timestamp: 2026-03-01
  checked: Two computed bindings from same signal
  found: First tick updates both; all subsequent ticks update neither
  implication: The bug requires multiple computeds sharing the same source signal

- timestamp: 2026-03-01
  checked: Pure reactive effects (no DOM): two effects each observing a computed derived from same signal
  found: tick 1 runs both effects; tick 2 and beyond run neither
  implication: The bug is in the reactive core (reactive.ts propagateDirty), not the DOM layer

- timestamp: 2026-03-01
  checked: propagateDirty trace through tick 1
  found: When doubled's effect runs during propagation, clearDeps(doubled) removes doubled from count's sub list. doubled.fn() re-subscribes, creating a NEW link appended at count's sub tail. The outer propagateDirty walk continues and reaches this new link. It finds doubled.state=Clean (just re-evaluated) and marks it Pending AGAIN. But the notifyVersion guard prevents the effect from re-running. doubled is now permanently Pending. On tick 2, propagateDirty finds doubled already Pending and skips it.
  implication: ROOT CAUSE — spurious re-marking of computed as Pending without re-running subscriber effects

## Resolution

root_cause: In reactive.ts propagateDirty(), when an effect runs synchronously during propagation and the computed re-subscribes to its source (via clearDeps then re-reading in the computed's fn), the new subscriber link is appended to the source's subscriber list tail. The outer propagateDirty walk subsequently processes this new link, finds the computed is Clean (just re-evaluated), and marks it Pending a second time. But the notifyVersion guard on EffectNode prevents the subscriber effect from running again. The computed is left permanently in Pending state. On all subsequent signal changes, propagateDirty finds the computed already Pending and skips it, so no effects ever run again.

fix: Added notifyVersion field to ComputedNode. In propagateDirty, replaced the `computed.state === ComputedState.Clean` guard with `computed.notifyVersion !== notifyVersion`. When a computed is processed, its notifyVersion is set to the current notifyVersion. If propagateDirty encounters the same computed again in the same propagation wave (via a newly-created re-subscription link), it skips it rather than marking it Pending again.

verification: All 193 tests pass (40 core + 108 DOM including 3 new regression tests + 45 streams). The specific bug scenario — two computed bindings from the same signal — is now tested and verified.

files_changed:
  - packages/core/src/reactive.ts (ComputedNode.notifyVersion field added, propagateDirty guard updated)
  - packages/core/dist/index.js (rebuilt)
  - packages/dom/tests/hero-repro.test.ts (new regression tests added)
