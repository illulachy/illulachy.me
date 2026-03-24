import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameMode } from '../src/hooks/useGameMode'

/**
 * Game mode toggle state tests (GAME-01)
 * Tests useGameMode hook
 */

describe('useGameMode', () => {
  beforeEach(() => {
    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Test: Initial state is false (game mode disabled on mount)
  it('initializes with game mode disabled (GAME-01)', () => {
    const { result } = renderHook(() => useGameMode())
    
    expect(result.current.isGameMode).toBe(false)
  })

  // Test: Press G key → state toggles to true
  it('toggles game mode on when G key pressed (GAME-01)', () => {
    const { result } = renderHook(() => useGameMode())
    
    expect(result.current.isGameMode).toBe(false)
    
    // Simulate G key press
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'g' })
      window.dispatchEvent(event)
    })
    
    expect(result.current.isGameMode).toBe(true)
  })

  // Test: Press G again → state toggles back to false
  it('toggles game mode off when G key pressed again (GAME-01)', () => {
    const { result } = renderHook(() => useGameMode())
    
    // Toggle on
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    })
    expect(result.current.isGameMode).toBe(true)
    
    // Toggle off
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    })
    expect(result.current.isGameMode).toBe(false)
  })

  // Test: Keyboard event listener cleaned up on unmount
  it('cleans up event listener on unmount (GAME-01)', () => {
    const { unmount } = renderHook(() => useGameMode())
    
    // Verify listener was added
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    // Unmount and verify cleanup
    unmount()
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  // Test: Both lowercase and uppercase G work
  it('toggles with both lowercase and uppercase G (GAME-01)', () => {
    const { result } = renderHook(() => useGameMode())
    
    // Test lowercase 'g'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
    })
    expect(result.current.isGameMode).toBe(true)
    
    // Test uppercase 'G'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'G' }))
    })
    expect(result.current.isGameMode).toBe(false)
  })
})
