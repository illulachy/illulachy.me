/**
 * Game mode toggle state management
 * Phase 6: Game Mode (GAME-01)
 */

import { useState, useEffect } from 'react'

/**
 * Hook to manage game mode toggle state with G key
 * @returns isGameMode state and setter
 */
export function useGameMode() {
  const [isGameMode, setIsGameMode] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setIsGameMode(prev => !prev)
        e.preventDefault()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return { isGameMode, setIsGameMode }
}
