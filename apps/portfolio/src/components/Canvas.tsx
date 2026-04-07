import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Line, Circle, Text } from 'react-konva'
import type Konva from 'konva'

import { AnimatePresence, motion } from 'motion/react'
import { CanvasLoader } from './CanvasLoader'
import Antigravity from './Antigravity'
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
import { getYearPositions } from '@/lib/dateUtils'
import { ZOOM_MIN, ZOOM_MAX } from '@/types/camera'
import type { ContentNode } from '@/types/content'

// Timeline visual constants
const AXIS_COLOR = '#E0AFFFFF'
const CONNECTOR_COLOR = '#12121212'
const HUB_HALF_WIDTH = 440  // Half of 880px hub width
const NODE_HALF_HEIGHT = 100 // Half of 200px node height
const TIMELINE_START_DATE = new Date('2017-01-01T00:00:00Z')
const PX_PER_DAY = 2
const MIN_OFFSET = 800
// Zoom threshold at which date labels fade in (0 = hidden, 1 = fully visible)
const DATE_LABEL_ZOOM_START = 2
const DATE_LABEL_ZOOM_END = 3
// Year label visibility - fades out as you zoom in (opposite of date labels)
const YEAR_LABEL_ZOOM_START = 1.0
const YEAR_LABEL_ZOOM_END = 2.0
const TICK_HEIGHT = 8

function formatNodeDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
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
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  
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

  // Hide system cursor in game mode — class uses !important to beat inline cursor:pointer on nodes
  useEffect(() => {
    document.body.classList.toggle('game-mode', isGameMode)
    return () => { document.body.classList.remove('game-mode') }
  }, [isGameMode])

  // Detect nearest node within hit radius when spaceship moves
  const HIT_RADIUS = 160
  useEffect(() => {
    if (!isGameMode || !stageRef.current) { setActiveNodeId(null); return }
    const stage = stageRef.current
    const scale = stage.scaleX()
    const worldX = (cursorState.x - stage.x()) / scale
    const worldY = (cursorState.y - stage.y()) / scale

    let nearest: string | null = null
    let minDist = HIT_RADIUS
    for (const { node, x, y } of positionedNodes) {
      const dist = Math.hypot(x - worldX, y - worldY)
      if (dist < minDist) { minDist = dist; nearest = node.id }
    }
    setActiveNodeId(nearest)
  }, [cursorState, isGameMode, positionedNodes])

  // Enter key triggers the active node's action
  useEffect(() => {
    const onEnter = (e: KeyboardEvent) => {
      if (!isGameMode || e.key !== 'Enter' || !activeNodeId) return
      const hit = positionedNodes.find(({ node }) => node.id === activeNodeId)
      if (!hit) return
      if (hit.node.type === 'milestone') {
        window.dispatchEvent(new CustomEvent('openMilestoneModal', { detail: { nodeId: hit.node.id } }))
      } else if (hit.node.url) {
        window.open(hit.node.url, '_blank', 'noopener,noreferrer')
      }
    }
    window.addEventListener('keydown', onEnter)
    return () => window.removeEventListener('keydown', onEnter)
  }, [isGameMode, activeNodeId, positionedNodes])
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Native wheel handler — attached to the container div so it fires
  // regardless of which Konva shape is under the cursor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      if (e.metaKey) {
        // Cmd + scroll → zoom toward pointer
        const scaleBy = 1.01
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        }

        const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        const clampedScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale))

        stage.scale({ x: clampedScale, y: clampedScale })
        stage.position({
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        })
        setZoom(clampedScale)
        stage.fire('zoom')
      } else {
        // Trackpad two-finger scroll → pan
        stage.position({
          x: stage.x() - e.deltaX,
          y: stage.y() - e.deltaY,
        })
        stage.fire('dragmove')
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
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
      {/* Antigravity background — purely decorative */}
      <div className="fixed inset-0">
        <Antigravity
          count={400}
          color="#E0AFFF"
          particleSize={0.6}
          magnetRadius={8}
          ringRadius={12}
          waveSpeed={1}
          waveAmplitude={0.8}
          fieldStrength={24}
          autoAnimate
        />
      </div>

      <div
        ref={containerRef}
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
          onDragEnd={handleDragEnd}
        >
          <Layer>
            {/* Timeline axis — horizontal line at y=0, extends left from hub to Jan 2017 */}
            {timelineData && timelineData.nodes.length > 0 && (() => {
              const timestamps = timelineData.nodes.map(n => new Date(n.date).getTime())
              const newestDate = new Date(Math.max(...timestamps))
              const startDate = TIMELINE_START_DATE
              const daysBeforeNewest = (newestDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              const axisLeft = -(daysBeforeNewest * PX_PER_DAY + MIN_OFFSET)
              return (
                <Line
                  points={[axisLeft, 0, HUB_POSITION.x - HUB_HALF_WIDTH, 0]}
                  stroke={AXIS_COLOR}
                  strokeWidth={1}
                  strokeScaleEnabled={false}
                  shadowBlur={12}
                  shadowColor={AXIS_COLOR}
                />
              )
            })()}

            {/* Year labels with tick marks above axis */}
            {timelineData && positionedNodes.length > 0 && (() => {
              const yearPositions = getYearPositions(positionedNodes.map(p => p.node))
              return yearPositions.map(({ year, x }) => {
                const opacity = Math.max(0, Math.min(1,
                  1 - (zoom - YEAR_LABEL_ZOOM_START) / (YEAR_LABEL_ZOOM_END - YEAR_LABEL_ZOOM_START)
                ))
                const fontSize = 11 / zoom
                return (
                  <group key={`year-${year}`}>
                    <Line
                      points={[x, 0, x, -TICK_HEIGHT / zoom]}
                      stroke={AXIS_COLOR}
                      strokeWidth={1}
                      strokeScaleEnabled={false}
                    />
                    <Text
                      x={x}
                      y={-(TICK_HEIGHT / zoom) - (fontSize * 1.2)}
                      text={String(year)}
                      fontSize={fontSize}
                      fontFamily="'Inter', sans-serif"
                      fill={AXIS_COLOR}
                      opacity={opacity}
                      offsetX={fontSize}
                      listening={false}
                    />
                  </group>
                )
              })
            })()}

            {/* Connector lines + axis dots + date labels */}
            {positionedNodes.map(({ node, x, y }) => {
              const edgeY = y > 0 ? y - NODE_HALF_HEIGHT : y + NODE_HALF_HEIGHT
              const labelOpacity = Math.max(0, Math.min(1,
                (zoom - DATE_LABEL_ZOOM_START) / (DATE_LABEL_ZOOM_END - DATE_LABEL_ZOOM_START)
              ))
              const fontSize = 10 / zoom
              // Place label below axis for nodes above, above axis for nodes below
              const labelX = x + 24 / zoom;
              const labelY = y >= 0 ? 12 / zoom : -(12 / zoom) - fontSize
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
                    radius={2}
                    fill={AXIS_COLOR}
                    strokeScaleEnabled={false}
                  />
                  <Text
                    key={`label-${node.id}`}
                    x={labelX}
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
                  isActive={isGameMode && node.id === activeNodeId}
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
      {/* <MilestoneModal 
        node={modalNode}
        open={modalNode !== null}
        onOpenChange={(open) => { if (!open) setModalNode(null) }}
      /> */}
    </>
  )
}
