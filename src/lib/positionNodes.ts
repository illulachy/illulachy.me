import type { ContentNode } from '../types/content'

/**
 * Positioned node with x,y coordinates
 */
export interface PositionedNode {
  node: ContentNode
  x: number
  y: number
}

/**
 * Hub position (canvas center)
 */
export const HUB_POSITION = { x: 0, y: 0 } as const

/**
 * Position timeline nodes using Phase 3 temporary algorithm
 * 
 * Algorithm:
 * - Horizontal: All nodes go left from hub, -400px increments
 * - Vertical: Type-based separation
 *   - youtube/blog: above timeline (y = +100, +200, +300...)
 *   - milestone/project: below timeline (y = -100, -200, -300...)
 * - Hub: x=0, y=0 (center)
 * 
 * Phase 4 will replace this with chronological layout + collision detection
 */
export function positionTimelineNodes(nodes: ContentNode[]): PositionedNode[] {
  let aboveCounter = 0
  let belowCounter = 0
  
  return nodes.map((node, index) => {
    // All nodes go left from hub
    const x = -400 * (index + 1)
    
    // Type-based vertical positioning
    let y: number
    if (node.type === 'youtube' || node.type === 'blog') {
      aboveCounter++
      y = 100 * aboveCounter  // Positive Y (above timeline)
    } else if (node.type === 'milestone' || node.type === 'project') {
      belowCounter++
      y = -100 * belowCounter  // Negative Y (below timeline)
    } else {
      // Unknown type, place above by default
      aboveCounter++
      y = 100 * aboveCounter
    }
    
    return { node, x, y }
  })
}
