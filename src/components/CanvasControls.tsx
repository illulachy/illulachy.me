import { useCallback } from 'react'
import type { Editor } from 'tldraw'
import { ZOOM_MIN, ZOOM_MAX } from '@/types'
import { calculateInitialZoom, getViewportDimensions } from '@/lib/cameraUtils'
import { cn } from '@/lib/utils'

interface CanvasControlsProps {
  editor: Editor | null
  visible: boolean
}

export function CanvasControls({ editor, visible }: CanvasControlsProps) {
  const zoomIn = useCallback(() => {
    if (!editor) return
    const camera = editor.getCamera()
    const newZoom = Math.min(camera.z * 1.25, ZOOM_MAX)
    editor.setCamera({ x: camera.x, y: camera.y, z: newZoom }, { animation: { duration: 150 } })
  }, [editor])
  
  const zoomOut = useCallback(() => {
    if (!editor) return
    const camera = editor.getCamera()
    const newZoom = Math.max(camera.z / 1.25, ZOOM_MIN)
    editor.setCamera({ x: camera.x, y: camera.y, z: newZoom }, { animation: { duration: 150 } })
  }, [editor])
  
  const resetToHub = useCallback(() => {
    if (!editor) return
    const viewport = getViewportDimensions(editor)
    const zoom = calculateInitialZoom(viewport)
    editor.setCamera({ x: 0, y: 0, z: zoom }, { animation: { duration: 300 } })
  }, [editor])
  
  const fitToScreen = useCallback(() => {
    if (!editor) return
    // Fit entire bounds in view
    editor.zoomToFit({ animation: { duration: 300 } })
  }, [editor])
  
  return (
    <div 
      className={cn(
        'fixed bottom-4 right-4 flex gap-2 p-3 rounded-xl glass',
        'transition-opacity duration-200',
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <ControlButton onClick={zoomOut} title="Zoom out">−</ControlButton>
      <ControlButton onClick={zoomIn} title="Zoom in">+</ControlButton>
      <ControlButton onClick={resetToHub} title="Reset to hub">⌂</ControlButton>
      <ControlButton onClick={fitToScreen} title="Fit to screen">◻</ControlButton>
    </div>
  )
}

function ControlButton({ 
  onClick, 
  title, 
  children 
}: { 
  onClick: () => void
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-lg',
        'text-lg font-medium text-secondary',
        'hover:text-interactive-hover hover:bg-interactive-subtle',
        'transition-all duration-150',
        'border-none cursor-pointer bg-transparent'
      )}
    >
      {children}
    </button>
  )
}
