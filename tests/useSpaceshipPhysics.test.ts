import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSpaceshipPhysics } from '../src/hooks/useSpaceshipPhysics'

/**
 * Spaceship physics integration tests (GAME-03)
 * Tests useSpaceshipPhysics hook
 */

// Mock Editor for testing
const createMockEditor = () => ({
  getCamera: vi.fn(() => ({ x: 0, y: 0, z: 1 })),
  setCamera: vi.fn(),
  getViewportScreenBounds: vi.fn(() => ({ width: 800, height: 600, x: 0, y: 0 })),
})

describe('useSpaceshipPhysics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test: Hook returns cursor state
  it('returns cursor state with position and rotation (GAME-02)', () => {
    const editor = createMockEditor() as any
    const { result } = renderHook(() => useSpaceshipPhysics(editor, true))
    
    expect(result.current).toHaveProperty('x')
    expect(result.current).toHaveProperty('y')
    expect(result.current).toHaveProperty('rotation')
    expect(typeof result.current.x).toBe('number')
    expect(typeof result.current.y).toBe('number')
    expect(typeof result.current.rotation).toBe('number')
  })

  // Test: Hook doesn't run when disabled
  it('does not run physics loop when disabled (GAME-03)', () => {
    const editor = createMockEditor() as any
    const { result } = renderHook(() => useSpaceshipPhysics(editor, false))
    
    // Should return default cursor state
    expect(result.current.x).toBe(0)
    expect(result.current.y).toBe(0)
    expect(result.current.rotation).toBe(0)
  })

  // Test: Hook doesn't crash with null editor
  it('handles null editor gracefully (GAME-03)', () => {
    const { result } = renderHook(() => useSpaceshipPhysics(null, true))
    
    expect(result.current.x).toBe(0)
    expect(result.current.y).toBe(0)
    expect(result.current.rotation).toBe(0)
  })
})
