/**
 * Keyboard input tracking for game mode
 * Phase 6: Game Mode (GAME-03)
 */

import { useEffect, useRef } from 'react'
import type { KeyboardInput } from '@/types/physics'

/**
 * Hook to track arrow key input state
 * Uses Set-based tracking for precise key state
 * @param enabled - Whether to track input (disabled when game mode off)
 * @returns Current keyboard input state
 */
export function useKeyboardInput(enabled: boolean): KeyboardInput {
  const inputRef = useRef<KeyboardInput>({
    up: false,
    down: false,
    left: false,
    right: false,
  })
  
  useEffect(() => {
    if (!enabled) {
      // Reset input when disabled
      inputRef.current = { up: false, down: false, left: false, right: false }
      return
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        inputRef.current.up = true
        e.preventDefault()
      }
      if (e.key === 'ArrowDown') {
        inputRef.current.down = true
        e.preventDefault()
      }
      if (e.key === 'ArrowLeft') {
        inputRef.current.left = true
        e.preventDefault()
      }
      if (e.key === 'ArrowRight') {
        inputRef.current.right = true
        e.preventDefault()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') inputRef.current.up = false
      if (e.key === 'ArrowDown') inputRef.current.down = false
      if (e.key === 'ArrowLeft') inputRef.current.left = false
      if (e.key === 'ArrowRight') inputRef.current.right = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])
  
  return inputRef.current
}
