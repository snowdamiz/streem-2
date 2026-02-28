import type { Plugin } from 'vite'

/**
 * streemHMR() — Vite plugin for @streem/dom HMR integration.
 *
 * This plugin makes component .tsx/.jsx files self-accepting HMR boundaries.
 * The actual state save/restore is handled in component files using
 * import.meta.hot.data — this plugin ensures the HMR graph is correct.
 *
 * The hotUpdate hook (Vite 6+/7) is used instead of deprecated handleHotUpdate.
 */
export function streemHMR(): Plugin {
  return {
    name: 'streem-hmr',
    hotUpdate({ file, modules }) {
      // Only handle .tsx and .jsx component files
      if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return

      // Return modules to trigger default HMR propagation.
      // Component files are self-accepting via import.meta.hot.accept()
      // (set up by the developer in each component file).
      return modules
    },
  }
}
