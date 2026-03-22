import { useState, useRef } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CanvasLoader } from './CanvasLoader'
import { CanvasControls } from './CanvasControls'
import { useCameraState } from '@/hooks/useCameraState'
import { useArrowKeyNavigation } from '@/hooks/useArrowKeyNavigation'
import { useControlsVisibility } from '@/hooks/useControlsVisibility'

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  
  // Wire up camera persistence
  useCameraState(editorRef.current)
  
  // Wire up arrow key navigation
  useArrowKeyNavigation(editorRef.current)
  
  // Wire up contextual visibility for controls
  const { visible } = useControlsVisibility()
  
  const handleMount = (editor: Editor) => {
    editorRef.current = editor
    // Small delay ensures first paint complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsReady(true)
      })
    })
  }
  
  return (
    <>
      {!isReady && <CanvasLoader />}
      <div 
        className="fixed inset-0"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 250ms var(--ease-out)',
        }}
      >
        <Tldraw hideUi onMount={handleMount} />
      </div>
      {/* Controls with contextual visibility */}
      <CanvasControls editor={editorRef.current} visible={isReady && visible} />
    </>
  )
}
