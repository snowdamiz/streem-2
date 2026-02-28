import { describe, it, expect, beforeEach } from 'vitest'
import { getRestoredValue, saveToHotData, canRestoreState, saveSignalCount, registerForHMR, clearHMRRegistry } from '../src/hmr.js'

describe('HMR registry', () => {
  beforeEach(() => {
    clearHMRRegistry()
  })

  it('getRestoredValue returns initial value when no hot data', () => {
    expect(getRestoredValue(undefined, 'count', 0)).toBe(0)
  })

  it('getRestoredValue returns restored value from hot data', () => {
    expect(getRestoredValue({ count: 42 }, 'count', 0)).toBe(42)
  })

  it('getRestoredValue returns initial value when key not in hot data', () => {
    expect(getRestoredValue({ other: 99 }, 'count', 0)).toBe(0)
  })

  it('saveToHotData mutates data object (not re-assigns)', () => {
    const data: Record<string, unknown> = {}
    registerForHMR('mySignal', () => 'hello')
    saveToHotData(data)
    expect(data.mySignal).toBe('hello')
  })

  it('saveToHotData only saves signals registered in current test (no cross-test leakage)', () => {
    // beforeEach cleared registry — only register 'isolated'
    registerForHMR('isolated', () => 'value')
    const data: Record<string, unknown> = {}
    saveToHotData(data)
    expect(Object.keys(data)).toEqual(['isolated'])
  })

  it('canRestoreState returns false when no hot data', () => {
    expect(canRestoreState(undefined, ['count'])).toBe(false)
  })

  it('canRestoreState returns true when signal count matches', () => {
    const data: Record<string, unknown> = { __streemSignalCount: 2 }
    expect(canRestoreState(data, ['count', 'name'])).toBe(true)
  })

  it('canRestoreState returns false on structural mismatch (different signal count)', () => {
    const data: Record<string, unknown> = { __streemSignalCount: 3 }
    expect(canRestoreState(data, ['count'])).toBe(false)
  })

  it('saveSignalCount writes count to hot data', () => {
    const data: Record<string, unknown> = {}
    saveSignalCount(data, 5)
    expect(data.__streemSignalCount).toBe(5)
  })
})
