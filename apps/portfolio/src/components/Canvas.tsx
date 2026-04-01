import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Line, Circle, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { AnimatePresence, motion } from 'motion/react'
import { CanvasLoader } from './CanvasLoader'
// import { CanvasControls } from './CanvasControls'
// import { CanvasFogOverlay } from './CanvasFogOverlay'
import { MilestoneModal } from './MilestoneModal'
import { HubNode, YouTubeNode, BlogNode, ProjectNode, MilestoneNode } from './shapes'
import { SpaceshipCursor } from './SpaceshipCursor'
import { useCameraState } from '@/hooks/useCameraState'
import { useArrowKeyNavigation } from '@/hooks/useArrowKeyNavigation'
import { useGameMode } from '@/hooks/useGameMode'
import { useSpaceshipPhysics } from '@/hooks/useSpaceshipPhysics'
// import { useControlsVisibility } from '@/hooks/useControlsVisibility'
import { useTimelineData } from '@/hooks/useTimelineData'
import { useAboutData } from '@/hooks/useAboutData'
import { calculateInitialZoom, getViewportDimensions } from '@/lib/cameraUtils'
import { positionTimelineNodes, HUB_POSITION } from '@/lib/positionNodes'
import { ZOOM_MIN, ZOOM_MAX } from '@/types/camera'
import type { ContentNode } from '@/types/content'

// Timeline visual constants
const AXIS_COLOR = '#E0AFFFFF'
const CONNECTOR_COLOR = '#12121212'
const HUB_HALF_WIDTH = 440  // Half of 880px hub width
const NODE_HALF_HEIGHT = 100 // Half of 200px node height
const AXIS_LEFT_EXTENT = -10000
// Zoom threshold at which date labels fade in (0 = hidden, 1 = fully visible)
const DATE_LABEL_ZOOM_START = 0.5
const DATE_LABEL_ZOOM_END = 0.9

function formatNodeDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

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
  const [zoom, setZoom] = useState(1)
  
  // Data fetching hooks
  const { data: timelineData, isLoading: timelineLoading } = useTimelineData()
  const { data: aboutData, isLoading: aboutLoading } = useAboutData()
  
  // Memoize positioned nodes (expensive simulation)
  const positionedNodes = useMemo(() => {
    if (!timelineData) return []
    return positionTimelineNodes(timelineData.nodes)
  }, [timelineData])
  
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
    setZoom(clampedScale)

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
    const initialZoom = calculateInitialZoom(viewport)

    // Center camera on hub (which is at world position 0, 0)
    // Konva position is the offset, so to center:
    stage.position({
      x: viewport.width / 2,
      y: viewport.height / 2,
    })
    stage.scale({ x: initialZoom, y: initialZoom })
    setZoom(initialZoom)
    stage.batchDraw()
  }, [setZoom])
  
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
            {/* Timeline axis — horizontal line at y=0, extends left from hub */}
            <Line
              points={[AXIS_LEFT_EXTENT, 0, HUB_POSITION.x - HUB_HALF_WIDTH, 0]}
              stroke={AXIS_COLOR}
              strokeWidth={1}
              strokeScaleEnabled={false}
              shadowBlur={12}
              shadowColor={AXIS_COLOR}
            />

            {/* Connector lines + axis dots + date labels */}
            {positionedNodes.map(({ node, x, y }) => {
              const edgeY = y > 0 ? y - NODE_HALF_HEIGHT : y + NODE_HALF_HEIGHT
              const labelOpacity = Math.max(0, Math.min(1,
                (zoom - DATE_LABEL_ZOOM_START) / (DATE_LABEL_ZOOM_END - DATE_LABEL_ZOOM_START)
              ))
              const fontSize = 11 / zoom
              // Place label below axis for nodes above, above axis for nodes below
              const labelY = y >= 0 ? 6 / zoom : -(6 / zoom) - fontSize
              return (
                <>
                  <Line
                    key={`connector-${node.id}`}
                    points={[x, edgeY, x, 0]}
                    stroke={CONNECTOR_COLOR}
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                  />
                  <Circle
                    key={`dot-${node.id}`}
                    x={x}
                    y={0}
                    radius={3}
                    fill={AXIS_COLOR}
                    strokeScaleEnabled={false}
                  />
                  <Text
                    key={`label-${node.id}`}
                    x={x}
                    y={labelY}
                    text={formatNodeDate(node.date)}
                    fontSize={fontSize}
                    fontFamily="'Inter', sans-serif"
                    fill={AXIS_COLOR}
                    opacity={labelOpacity}
                    offsetX={fontSize * 1.8} // approximate half-width centering
                    listening={false}
                  />
                </>
              )
            })}

            {/* Hub node */}
            {aboutData && (
              <HubNode
                x={HUB_POSITION.x - 440}
                y={HUB_POSITION.y - 240}
                name={aboutData.name}
                title={aboutData.title}
                bio={aboutData.bio}
                avatar={aboutData.avatar}
                email={aboutData.email}
                lastUpdated={timelineData?.lastUpdated}
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
