import type { PositionedNode } from '@/lib/positionNodes'
import type { ViewportTransform } from '@/hooks/useViewportTransform'

interface TimelineOverlayProps {
  nodes: PositionedNode[]
  hubX: number
  viewportTransform: ViewportTransform
}

/**
 * SVG overlay for timeline axis and node connectors
 * 
 * Renders:
 * - Horizontal timeline axis at y=0 (fades out near hub)
 * - Vertical connector lines from each node to axis
 * 
 * Synchronized with tldraw camera via viewBox transform.
 */
export function TimelineOverlay({ nodes, hubX, viewportTransform }: TimelineOverlayProps) {
  const { x, y, zoom } = viewportTransform
  
  // Calculate SVG viewBox dimensions (world coordinates visible on screen)
  const viewportWidth = window.innerWidth / zoom
  const viewportHeight = window.innerHeight / zoom
  const viewBox = `${x} ${y} ${viewportWidth} ${viewportHeight}`
  
  // Calculate fade opacity based on distance from hub
  const calculateOpacity = (nodeX: number): number => {
    const FADE_DISTANCE = 500 // Start fading 500px before hub
    const distance = hubX - nodeX
    
    if (distance < FADE_DISTANCE) {
      return Math.max(0, distance / FADE_DISTANCE)
    }
    return 1
  }
  
  // Stroke width scales inversely with zoom (constant screen pixels)
  const strokeWidth = 1 / zoom
  
  // Timeline axis endpoints (far left to hub fade zone)
  const axisX1 = -10000 // Extend far left
  const axisX2 = hubX - 500 // End before hub fade zone
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks through to canvas
        overflow: 'visible'
      }}
      viewBox={viewBox}
    >
      {/* Timeline axis (horizontal line at y=0) */}
      <line
        x1={axisX1}
        y1={0}
        x2={axisX2}
        y2={0}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      
      {/* Node connectors (vertical lines from node to axis) */}
      {nodes.map(({ node, x, y: nodeY }) => {
        const opacity = calculateOpacity(x)
        
        return (
          <line
            key={node.id}
            x1={x}
            y1={nodeY}
            x2={x}
            y2={0}
            stroke={`rgba(255, 255, 255, ${opacity * 0.1})`}
            strokeWidth={strokeWidth}
          />
        )
      })}
    </svg>
  )
}
