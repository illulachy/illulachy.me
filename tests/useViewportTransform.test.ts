import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewportTransform } from '../src/hooks/useViewportTransform'

describe('useViewportTransform', () => {
  it('returns initial camera transform', () => {
    const mockEditor = {
      getCamera: vi.fn(() => ({ x: 100, y: 200, z: 1.5 })),
      sideEffects: {
        registerAfterChangeHandler: vi.fn(() => vi.fn())
      }
    }
    
    const { result } = renderHook(() => useViewportTransform(mockEditor as any))
    
    expect(result.current).toEqual({ x: 100, y: 200, zoom: 1.5 })
    expect(mockEditor.getCamera).toHaveBeenCalled()
  })
  
  it('returns default transform when editor is null', () => {
    const { result } = renderHook(() => useViewportTransform(null))
    
    expect(result.current).toEqual({ x: 0, y: 0, zoom: 1 })
  })
  
  it('updates transform when camera changes', () => {
    let cameraChangeHandler: (() => void) | null = null
    let callCount = 0
    
    const mockEditor = {
      getCamera: vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return { x: 100, y: 200, z: 1.5 } // Initial state
        } else {
          return { x: 300, y: 400, z: 2.0 } // After camera change
        }
      }),
      sideEffects: {
        registerAfterChangeHandler: vi.fn((event: string, handler: () => void) => {
          cameraChangeHandler = handler
          return vi.fn() // Return cleanup function
        })
      }
    }
    
    const { result } = renderHook(() => useViewportTransform(mockEditor as any))
    
    // Initial state
    expect(result.current).toEqual({ x: 100, y: 200, zoom: 1.5 })
    
    // Simulate camera change
    act(() => {
      if (cameraChangeHandler) {
        cameraChangeHandler()
      }
    })
    
    // State should update
    expect(result.current).toEqual({ x: 300, y: 400, zoom: 2.0 })
  })
  
  it('cleans up listener on unmount', () => {
    const removeListener = vi.fn()
    
    const mockEditor = {
      getCamera: vi.fn(() => ({ x: 100, y: 200, z: 1.5 })),
      sideEffects: {
        registerAfterChangeHandler: vi.fn(() => removeListener)
      }
    }
    
    const { unmount } = renderHook(() => useViewportTransform(mockEditor as any))
    
    expect(mockEditor.sideEffects.registerAfterChangeHandler).toHaveBeenCalledWith(
      'camera',
      expect.any(Function)
    )
    
    // Unmount should call cleanup
    unmount()
    
    expect(removeListener).toHaveBeenCalled()
  })
})
