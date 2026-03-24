import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { AnimatePresence, motion } from 'motion/react'
import { CanvasLoader } from './CanvasLoader'
// import { CanvasControls } from './CanvasControls'
// import { CanvasFogOverlay } from './CanvasFogOverlay'
import { MilestoneModal } from './MilestoneModal'
import { TimelineOverlay } from './TimelineOverlay'
import { SpaceshipCursor } from './SpaceshipCursor'
import { customShapeUtils } from './shapes'
import { useCameraState } from '@/hooks/useCameraState'
import { useArrowKeyNavigation } from '@/hooks/useArrowKeyNavigation'
import { useGameMode } from '@/hooks/useGameMode'
import { useSpaceshipPhysics } from '@/hooks/useSpaceshipPhysics'
// import { useControlsVisibility } from '@/hooks/useControlsVisibility'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useAboutData } from '@/hooks/useAboutData'
import { useViewportTransform } from '@/hooks/useViewportTransform'
import { calculateInitialZoom, getViewportDimensions } from '@/lib/cameraUtils'
import { positionTimelineNodes, HUB_POSITION } from '@/lib/positionNodes'
import { SHAPE_TYPES } from '@/types/shapes'
import type { ContentNode } from '@/types/content'

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const [modalNode, setModalNode] = useState<ContentNode | null>(null)
  
  // Data fetching hooks
  const { data: timelineData, isLoading: timelineLoading } = useTimelineData()
  const { data: aboutData, isLoading: aboutLoading } = useAboutData()
  
  // Memoize positioned nodes (expensive simulation)
  const positionedNodes = useMemo(() => {
    if (!timelineData) return []
    return positionTimelineNodes(timelineData.nodes)
  }, [timelineData])
  
  // Get viewport transform for SVG overlay
  const viewportTransform = useViewportTransform(editorRef.current)
  
  // Game mode state and physics
  const { isGameMode } = useGameMode()
  const cursorState = useSpaceshipPhysics(editorRef.current, isGameMode)
  
  // Wire up hooks
  // const { visible } = useControlsVisibility()
  useCameraState(editorRef.current)
  useArrowKeyNavigation(editorRef.current, !isGameMode) // Disable when game mode active
  
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
    
    // Configure navigation
    editor.updateInstanceState({ 
      isGridMode: true // Enable logical grid
    })
    
    // Set hand tool as default (drag to pan without Space key)
    editor.setCurrentTool('hand')
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsReady(true))
    })
  }, [])
  
  // Listen for milestone modal events
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>
      if (!timelineData) return
      const node = timelineData.nodes.find((n) => n.id === customEvent.detail.nodeId)
      if (node) setModalNode(node)
    }
    window.addEventListener('openMilestoneModal', handleOpenModal)
    return () => window.removeEventListener('openMilestoneModal', handleOpenModal)
  }, [timelineData])
  
  // Create shapes when data is ready
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || positionedNodes.length === 0 || !aboutData) return

    // Clear existing shapes first (for dev hot reload)
    const existingShapes = editor.getCurrentPageShapes()
    if (existingShapes.length > 0) {
      editor.deleteShapes(existingShapes.map(s => s.id))
    }

    // Create hub shape at center
    editor.createShape({
      type: SHAPE_TYPES.HUB as any,
      x: HUB_POSITION.x - 320, // Center the 640px wide shape
      y: HUB_POSITION.y - 180, // Center the 360px tall shape
      isLocked: true,
      props: {
        w: 640,
        h: 360,
        name: aboutData.name,
        title: aboutData.title,
        bio: aboutData.bio,
        avatar: aboutData.avatar,
        social: aboutData.social,
      },
    })

    // Create timeline node shapes
    positionedNodes.forEach(({ node, x, y }) => {
      // Determine shape type based on content type
      let shapeType: string
      switch (node.type) {
        case 'youtube': shapeType = SHAPE_TYPES.YOUTUBE; break
        case 'blog': shapeType = SHAPE_TYPES.BLOG; break
        case 'project': shapeType = SHAPE_TYPES.PROJECT; break
        case 'milestone': shapeType = SHAPE_TYPES.MILESTONE; break
        default: shapeType = SHAPE_TYPES.BLOG // Fallback
      }

      // Center the 280x200 shape on calculated position
      // Build props based on shape type (milestone nodes don't have url)
      const shapeProps: any = {
        w: 280,
        h: 200,
        nodeId: node.id,
        title: node.title,
        date: node.date,
        thumbnail: node.thumbnail,
        description: node.description,
        institution: node.institution,
        tech: node.tech,
      }
      
      // Only add url for non-milestone nodes
      if (node.type !== 'milestone' && node.url) {
        shapeProps.url = node.url
      }
      
      editor.createShape({
        type: shapeType as any,
        x: x - 140, // Center 280px wide shape
        y: y - 100, // Center 200px tall shape
        isLocked: true,
        props: shapeProps,
      })
    })

    console.log(`[Canvas] Created ${positionedNodes.length + 1} shapes (${positionedNodes.length} timeline + 1 hub)`)
  }, [positionedNodes, aboutData])
  
  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const viewport = getViewportDimensions(editor)
    const zoom = calculateInitialZoom(viewport)

    // Center camera on hub (which is at world position 0, 0)
    const centerX = 0 + (viewport.width / 2) / zoom
    const centerY = 0 + (viewport.height / 2) / zoom

    editor.setCamera({ x: centerX, y: centerY, z: zoom }, { animation: { duration: 300 } })
  }, [])
  
  // Update loading condition to include data loading
  const isFullyLoaded = isReady && !timelineLoading && !aboutLoading
  
  return (
    <>
      <AnimatePresence>
        {!isFullyLoaded && (
          <motion.div
            key="loader"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              transition: { 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1] 
              } 
            }}
            className="fixed inset-0 z-[100]"
          >
            <CanvasLoader />
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        className="fixed inset-0"
        style={{
          opacity: isFullyLoaded ? 1 : 0,
          transition: 'opacity 250ms var(--ease-out)',
          boxShadow: isGameMode ? '0 0 0 3px var(--interactive-hover)' : 'none',
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Tldraw 
          hideUi 
          onMount={handleMount}
          shapeUtils={customShapeUtils}
        />
      </div>
      
      {/* Spaceship cursor overlay */}
      <AnimatePresence>
        {isGameMode && (
          <SpaceshipCursor
            x={cursorState.x}
            y={cursorState.y}
            rotation={cursorState.rotation}
          />
        )}
      </AnimatePresence>
      
      {/* Fog overlay (above canvas, below controls) */}
      {/* <CanvasFogOverlay /> */}
      {/* Timeline overlay - TEMPORARILY DISABLED for debugging */}
      {isFullyLoaded && positionedNodes.length > 0 && (
        <TimelineOverlay 
          nodes={positionedNodes}
          hubX={HUB_POSITION.x}
          viewportTransform={viewportTransform}
        />
      )}
      {/* Controls with contextual visibility - TEMPORARILY DISABLED */}
      {/* {isFullyLoaded && <CanvasControls editor={editorRef.current} visible={visible} />} */}
      {/* Milestone modal */}
      <MilestoneModal 
        node={modalNode}
        open={modalNode !== null}
        onOpenChange={(open) => { if (!open) setModalNode(null) }}
      />
    </>
  )
}
