import { useEffect, useRef } from 'react'
import type { Editor } from 'tldraw'
import { saveCameraState, loadCameraState } from '@/lib/localStorageUtils'
import { calculateInitialZoom } from '@/lib/cameraUtils'

export function useCameraState(editor: Editor | null) {
  const saveTimeoutRef = useRef<number | undefined>(undefined)
  
  // Restore camera on mount
  useEffect(() => {
    if (!editor) return
    
    // TEMPORARILY: Always center on hub (disable persistence for debugging)
    // TODO: Re-enable after Phase 4 verification
    const bounds = editor.getViewportScreenBounds()
    const zoom = calculateInitialZoom({ 
      width: bounds.width, 
      height: bounds.height 
    })
    editor.setCamera({ x: 0, y: 0, z: zoom })
    
    // const saved = loadCameraState()
    // if (saved) {
    //   editor.setCamera({ x: saved.x, y: saved.y, z: saved.z })
    // } else {
    //   // First-time: calculate initial zoom
    //   const bounds = editor.getViewportScreenBounds()
    //   const zoom = calculateInitialZoom({ 
    //     width: bounds.width, 
    //     height: bounds.height 
    //   })
    //   editor.setCamera({ x: 0, y: 0, z: zoom })
    // }
  }, [editor])
  
  // Save camera on change (debounced)
  useEffect(() => {
    if (!editor) return
    
    const handleChange = () => {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = window.setTimeout(() => {
        const camera = editor.getCamera()
        saveCameraState({ x: camera.x, y: camera.y, z: camera.z })
      }, 500)
    }
    
    editor.on('change', handleChange)
    return () => {
      editor.off('change', handleChange)
      window.clearTimeout(saveTimeoutRef.current)
    }
  }, [editor])
}
