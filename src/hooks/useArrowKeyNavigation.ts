import { useEffect, useCallback } from 'react'
import type Konva from 'konva'

/**
 * Hook to handle arrow key navigation (pan camera)
 * @param editor - tldraw Editor instance
 * @param enabled - Whether arrow key navigation is enabled (default: true)
 */
export function useArrowKeyNavigation(stage: Konva.Stage | null, enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!stage || !enabled) return
    
    const PAN_AMOUNT = 100
    const scale = stage.scaleX()
    const pos = stage.position()
    let newX = pos.x
    let newY = pos.y
    
    switch (e.key) {
      case 'ArrowUp':
        newY = pos.y + PAN_AMOUNT * scale
        break
      case 'ArrowDown':
        newY = pos.y - PAN_AMOUNT * scale
        break
      case 'ArrowLeft':
        newX = pos.x + PAN_AMOUNT * scale
        break
      case 'ArrowRight':
        newX = pos.x - PAN_AMOUNT * scale
        break
      default:
        return
    }
    
    e.preventDefault()

    stage.to({
      x: newX,
      y: newY,
      duration: 0.15,
    })
  }, [stage, enabled])
  
  useEffect(() => {
    if (!enabled) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}
