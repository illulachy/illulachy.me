import { useEffect, useCallback } from 'react'
import type { Editor } from 'tldraw'

/**
 * Hook to handle arrow key navigation (pan camera)
 * @param editor - tldraw Editor instance
 * @param enabled - Whether arrow key navigation is enabled (default: true)
 */
export function useArrowKeyNavigation(editor: Editor | null, enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editor || !enabled) return
    
    const PAN_AMOUNT = 100
    const camera = editor.getCamera()
    let newX = camera.x
    let newY = camera.y
    
    switch (e.key) {
      case 'ArrowUp':
        newY = camera.y - PAN_AMOUNT
        break
      case 'ArrowDown':
        newY = camera.y + PAN_AMOUNT
        break
      case 'ArrowLeft':
        newX = camera.x - PAN_AMOUNT
        break
      case 'ArrowRight':
        newX = camera.x + PAN_AMOUNT
        break
      default:
        return
    }
    
    e.preventDefault()
    editor.setCamera(
      { x: newX, y: newY, z: camera.z },
      { animation: { duration: 150 } }
    )
  }, [editor, enabled])
  
  useEffect(() => {
    if (!enabled) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}
