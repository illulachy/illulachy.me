import { useEffect, useState } from 'react'
import type { Editor } from 'tldraw'

export interface ViewportTransform {
  x: number
  y: number
  zoom: number
}

/**
 * Hook to track tldraw viewport transform for SVG overlay synchronization
 * 
 * Listens to camera changes and provides current x, y, zoom for SVG viewBox calculation.
 * 
 * @param editor - Tldraw editor instance
 * @returns Current viewport transform { x, y, zoom }
 */
export function useViewportTransform(editor: Editor | null): ViewportTransform {
  const [transform, setTransform] = useState<ViewportTransform>(() => {
    if (!editor) return { x: 0, y: 0, zoom: 1 }
    
    const camera = editor.getCamera()
    return { x: camera.x, y: camera.y, zoom: camera.z }
  })
  
  useEffect(() => {
    if (!editor) return
    
    const removeListener = editor.sideEffects.registerAfterChangeHandler(
      'camera',
      () => {
        const camera = editor.getCamera()
        setTransform({ x: camera.x, y: camera.y, zoom: camera.z })
      }
    )
    
    return removeListener
  }, [editor])
  
  return transform
}
