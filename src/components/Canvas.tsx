import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { AnimatePresence, motion } from 'motion/react'
import { CanvasLoader } from './CanvasLoader'
// import { CanvasControls } from './CanvasControls'
// import { CanvasFogOverlay } from './CanvasFogOverlay'
import { MilestoneModal } from './MilestoneModal'
import { TimelineOverlay } from './TimelineOverlay'
import { HubNode, YouTubeNode, BlogNode, ProjectNode, MilestoneNode } from './shapes'
import { SpaceshipCursor } from './SpaceshipCursor'
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
import { ZOOM_MIN, ZOOM_MAX } from '@/types/camera'
import type { ContentNode } from '@/types/content'

// Node component mapping
const nodeComponents: Record<string, React.ComponentType<any>> = {
  youtube: YouTubeNode,
  blog: BlogNode,
  project: ProjectNode,
  milestone: MilestoneNode,
}

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  const stageRef = useRef<Konva.Stage | null>(null)
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
  const viewportTransform = useViewportTransform(stageRef.current)
  
  // Game mode state and physics
  const { isGameMode } = useGameMode()
  const cursorState = useSpaceshipPhysics(stageRef.current, isGameMode)
  
  // Wire up hooks
  // const { visible } = useControlsVisibility()
  useCameraState(stageRef.current)
  useArrowKeyNavigation(stageRef.current, !isGameMode) // Disable when game mode active
  
  // Handle zoom with wheel
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    
    const scaleBy = 1.01
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale))
    
    stage.scale({ x: clampedScale, y: clampedScale })
    stage.position({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
    
    // Trigger custom zoom event for viewport transform hook
    stage.fire('zoom')
  }, [])
  
  // Handle drag end for camera state persistence
  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    
    // Trigger custom dragend event for camera state hook
    stage.fire('dragmove')
  }, [])
  
  const handleMount = useCallback(() => {
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
  
  // Initialize stage on mount
  useEffect(() => {
    if (stageRef.current) {
      handleMount()
    }
  }, [handleMount])
  
  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const viewport = getViewportDimensions()
    const zoom = calculateInitialZoom(viewport)

    // Center camera on hub (which is at world position 0, 0)
    // Konva position is the offset, so to center:
    stage.position({
      x: viewport.width / 2,
      y: viewport.height / 2,
    })
    stage.scale({ x: zoom, y: zoom })
    stage.batchDraw()
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
        className="fixed inset-0 canvas-grid-light"
        style={{
          opacity: isFullyLoaded ? 1 : 0,
          transition: 'opacity 250ms var(--ease-out)',
          boxShadow: isGameMode ? '0 0 0 3px var(--interactive-hover)' : 'none',
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          draggable
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
        >
          <Layer>
            {/* Hub node */}
            {aboutData && (
              <HubNode
                x={HUB_POSITION.x - 320}
                y={HUB_POSITION.y - 180}
                name={aboutData.name}
                title={aboutData.title}
                bio={aboutData.bio}
                avatar={aboutData.avatar}
                social={aboutData.social}
              />
            )}
            
            {/* Timeline nodes */}
            {positionedNodes.map(({ node, x, y }) => {
              const NodeComponent = nodeComponents[node.type]
              return (
                <NodeComponent
                  key={node.id}
                  x={x - 140}
                  y={y - 100}
                  {...node}
                />
              )
            })}
          </Layer>
        </Stage>
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
      {/* Timeline overlay */}
      {isFullyLoaded && positionedNodes.length > 0 && (
        <TimelineOverlay 
          nodes={positionedNodes}
          hubX={HUB_POSITION.x}
          viewportTransform={viewportTransform}
        />
      )}
      {/* Controls with contextual visibility - TEMPORARILY DISABLED */}
      {/* {isFullyLoaded && <CanvasControls editor={stageRef.current} visible={visible} />} */}
      {/* Milestone modal */}
      <MilestoneModal 
        node={modalNode}
        open={modalNode !== null}
        onOpenChange={(open) => { if (!open) setModalNode(null) }}
      />
    </>
  )
}
