import type { ContentNode } from '../types/content'
import { getSessionSeed } from './sessionSeed'
import { simulateLayout } from './forceSimulation'

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
 * Position timeline nodes chronologically with collision detection
 * 
 * Algorithm (Phase 4):
 * 1. Map dates to negative X coordinates (older = further left)
 * 2. Get session-based random seed (24-hour persistence)
 * 3. Run D3-force simulation to convergence
 *    - Temporal gravity: nodes cluster by date
 *    - Collision detection: 150px+ minimum gaps
 *    - Vertical scatter: organic constellation aesthetic
 * 
 * Replaces Phase 3 temporary type-based positioning.
 * 
 * @param nodes - Timeline content nodes
 * @returns Positioned nodes with collision-free x, y coordinates
 */
export function positionTimelineNodes(nodes: ContentNode[]): PositionedNode[] {
  if (nodes.length === 0) return []

  // Session seed gives deterministic-yet-varied jitter (24-hour persistence).
  const seed = getSessionSeed()

  // X/row come from the rank-based axis layout; seed only adds organic jitter.
  return simulateLayout(nodes, () => 0, seed)
}
