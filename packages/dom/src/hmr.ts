/**
 * @streeem/dom HMR — Signal state preservation across Vite hot module reloads.
 *
 * Usage pattern in a component file:
 *
 *   import { hmrSignal } from '@streeem/dom/hmr'
 *   // Or use the pattern directly:
 *
 *   const count = signal(import.meta.hot?.data?.count ?? 0)
 *
 *   if (import.meta.hot) {
 *     import.meta.hot.dispose((data) => {
 *       data.count = count()
 *     })
 *     import.meta.hot.accept()
 *   }
 */

/**
 * HMR signal registry entry.
 * Maps signal key → { read: () => T } — the read accessor for saving state.
 */
interface HMREntry {
  read: () => unknown
}

/** Module-level registry of signals registered for HMR state preservation. */
const registry = new Map<string, HMREntry>()

/**
 * Clear the HMR registry. Call this in beforeEach in tests to prevent
 * cross-test pollution from the module-level registry Map.
 *
 * NOT for use in production code — only test utilities and HMR dispose handlers.
 */
export function clearHMRRegistry(): void {
  registry.clear()
}

/**
 * Register a signal for HMR state preservation.
 * Returns the signal's initial value, restored from previous HMR data if available.
 *
 * Usage:
 *   const count = signal(getRestoredValue('count', 0))
 *   // Register for save:
 *   registerForHMR('count', count)
 *   // In dispose:
 *   import.meta.hot.dispose((data) => { saveToHotData(data) })
 *
 * @param key - Unique key for this signal within the module
 * @param read - Function that reads the signal's current value
 */
export function registerForHMR(key: string, read: () => unknown): void {
  registry.set(key, { read })
}

/**
 * Get a signal's restored value from HMR data, falling back to initialValue.
 * Called when creating a signal to restore its previous value after a hot reload.
 *
 * @param hotData - import.meta.hot.data from the current module
 * @param key - The signal's HMR key
 * @param initialValue - Default value if no HMR data exists
 */
export function getRestoredValue<T>(
  hotData: Record<string, unknown> | undefined,
  key: string,
  initialValue: T
): T {
  if (hotData && key in hotData) {
    return hotData[key] as T
  }
  return initialValue
}

/**
 * Save all registered signal values into hot.data before module replacement.
 * Call this inside import.meta.hot.dispose().
 *
 * @param hotData - The data object from hot.dispose(data => ...) callback
 */
export function saveToHotData(hotData: Record<string, unknown>): void {
  for (const [key, entry] of registry) {
    hotData[key] = entry.read()  // MUST mutate properties, never re-assign data object
  }
}

/**
 * Structural integrity check: verify signal count matches saved count.
 * If mismatch detected, signals a full reset is required.
 *
 * @param hotData - import.meta.hot.data
 * @param currentSignalKeys - Array of signal keys in the current module
 * @returns true if state can be safely restored, false if full reset needed
 */
export function canRestoreState(
  hotData: Record<string, unknown> | undefined,
  currentSignalKeys: string[]
): boolean {
  if (!hotData) return false
  if (!hotData.__streemSignalCount) return false
  return hotData.__streemSignalCount === currentSignalKeys.length
}

/**
 * Save the signal count for structural integrity check on next reload.
 */
export function saveSignalCount(hotData: Record<string, unknown>, count: number): void {
  hotData.__streemSignalCount = count
}
