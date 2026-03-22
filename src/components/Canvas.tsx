import { useState, useRef, useCallback } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CanvasLoader } from './CanvasLoader'
import { CanvasControls } from './CanvasControls'
import { CanvasFogOverlay } from './CanvasFogOverlay'
import { useCameraState } from '@/hooks/useCameraState'
import { useArrowKeyNavigation } from '@/hooks/useArrowKeyNavigation'
import { useControlsVisibility } from '@/hooks/useControlsVisibility'
import { calculateInitialZoom, getViewportDimensions } from '@/lib/cameraUtils'

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  
  // Wire up hooks
  const { visible } = useControlsVisibility()
  useCameraState(editorRef.current)
  useArrowKeyNavigation(editorRef.current)
  
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsReady(true))
    })
  }, [])
  
  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const viewport = getViewportDimensions(editor)
    const zoom = calculateInitialZoom(viewport)
    editor.setCamera({ x: 0, y: 0, z: zoom }, { animation: { duration: 300 } })
  }, [])
  
  return (
    <>
      {!isReady && <CanvasLoader />}
      <div 
        className="fixed inset-0"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 250ms var(--ease-out)',
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Tldraw hideUi onMount={handleMount} />
      </div>
      {/* Fog overlay (above canvas, below controls) */}
      <CanvasFogOverlay />
      {/* Controls with contextual visibility */}
      {isReady && <CanvasControls editor={editorRef.current} visible={visible} />}
    </>
  )
}
