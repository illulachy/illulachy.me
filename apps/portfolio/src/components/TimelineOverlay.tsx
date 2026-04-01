import type { PositionedNode } from '@/lib/positionNodes'
import type { ViewportTransform } from '@/hooks/useViewportTransform'

interface TimelineOverlayProps {
  nodes: PositionedNode[]
  hubX: number
  viewportTransform: ViewportTransform
}

// Half the hub width — axis ends at hub's left edge
const HUB_HALF_WIDTH = 440

/**
 * SVG overlay for timeline axis and node connectors
 *
 * Renders:
 * - Horizontal timeline axis at y=0 with gradient fade near hub
 * - Vertical connector lines from each node's nearest edge to axis
 *
 * Synchronized with Konva camera via viewBox transform.
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

  // Axis extends far left and ends at hub's left edge
  const axisX1 = -10000
  const axisX2 = hubX - HUB_HALF_WIDTH

  // Gradient fade zone: last 600px before hub
  const gradientFadeStart = axisX2 - 600

  // Half-height of timeline nodes (200px / 2)
  const NODE_HALF_HEIGHT = 100

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'visible',
      }}
      viewBox={viewBox}
    >
      <defs>
        {/* Gradient fades axis line to transparent near hub */}
        <linearGradient
          id="axisGradient"
          gradientUnits="userSpaceOnUse"
          x1={gradientFadeStart}
          y1={0}
          x2={axisX2}
          y2={0}
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Timeline axis — solid section */}
      <line
        x1={axisX1}
        y1={0}
        x2={gradientFadeStart}
        y2={0}
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth={strokeWidth}
      />

      {/* Timeline axis — gradient fade section near hub */}
      <line
        x1={gradientFadeStart}
        y1={0}
        x2={axisX2}
        y2={0}
        stroke="url(#axisGradient)"
        strokeWidth={strokeWidth}
      />

      {/* Node connectors — from node's nearest edge to axis */}
      {nodes.map(({ node, x: nodeX, y: nodeY }) => {
        const opacity = calculateOpacity(nodeX)
        // Connect from the edge of the node facing y=0, not the center
        const edgeY = nodeY > 0 ? nodeY - NODE_HALF_HEIGHT : nodeY + NODE_HALF_HEIGHT

        return (
          <line
            key={node.id}
            x1={nodeX}
            y1={edgeY}
            x2={nodeX}
            y2={0}
            stroke={`rgba(255, 255, 255, ${opacity * 0.12})`}
            strokeWidth={strokeWidth}
          />
        )
      })}
    </svg>
  )
}
