import { forceSimulation, forceX, forceY, forceCollide, type SimulationNodeDatum } from 'd3-force'
import { randomLcg } from 'd3-random'
import type { ContentNode } from '../types/content'
import type { PositionedNode } from './positionNodes'

interface SimNode extends SimulationNodeDatum {
  id: string
  date: string
  // D3 adds x, y, vx, vy during simulation
}

// Shape dimensions from Phase 3
const SHAPE_WIDTH = 280
const SHAPE_HEIGHT = 200
const PADDING = 150 // Minimum gap between nodes (per CONTEXT.md)

// Collision radius: diagonal of rectangle + padding
// Ensures 150px+ gap even at corners
const COLLISION_RADIUS = Math.sqrt(SHAPE_WIDTH ** 2 + SHAPE_HEIGHT ** 2) / 2 + PADDING / 2

/**
 * Run D3-force simulation to convergence (synchronously)
 * 
 * Forces applied:
 * - forceX: Temporal gravity (pulls nodes to date-based X coordinates)
 * - forceY: Weak axis centering (allows vertical scatter around y=0)
 * - forceCollide: Generous spacing (150px+ minimum gaps)
 * 
 * The simulation runs synchronously (no animation) until convergence,
 * producing a stable constellation layout with no overlaps.
 * 
 * @param nodes - Timeline content nodes
 * @param dateToX - Mapper function from date string to X coordinate
 * @param seed - Random seed for deterministic layout
 * @returns Positioned nodes with final x, y coordinates
 */
export function simulateLayout(
  nodes: ContentNode[],
  dateToX: (date: string) => number,
  seed: number
): PositionedNode[] {
  // 1. Initialize with seeded random Y positions
  const random = randomLcg(seed)
  const simNodes: SimNode[] = nodes.map(node => ({
    id: node.id,
    date: node.date,
    x: dateToX(node.date), // Initial X from date mapping
    y: (random() - 0.5) * 1000 // Random scatter ±500px vertically
  }))
  
  // 2. Create force simulation with hub exclusion
  const HUB_WIDTH = 640 // Hub shape width from Phase 3
  const HUB_BUFFER = 300 // Additional spacing beyond hub edge
  const HUB_EXCLUSION = -(HUB_WIDTH / 2 + HUB_BUFFER) // -620px from center
  
  const simulation = forceSimulation(simNodes)
    .force('collide', forceCollide<SimNode>().radius(COLLISION_RADIUS))
    .force('x', forceX<SimNode>(d => {
      const targetX = dateToX(d.date)
      // Ensure nodes stay left of hub exclusion zone
      return Math.min(targetX, HUB_EXCLUSION)
    }).strength(0.5)) // Temporal gravity
    .force('y', forceY<SimNode>(0).strength(0.1)) // Weak axis pull (allows scatter)
    .stop() // Don't auto-tick (run synchronously)
  
  // 3. Tick to convergence
  // 300 iterations is standard for D3-force convergence
  // alpha() > 0.001 threshold ensures simulation has stabilized
  for (let i = 0; i < 300 && simulation.alpha() > 0.001; i++) {
    simulation.tick()
  }
  
  // 4. Extract final positions and map back to original nodes
  return simNodes.map(simNode => {
    const originalNode = nodes.find(n => n.id === simNode.id)!
    return {
      node: originalNode,
      x: simNode.x!,
      y: simNode.y!
    }
  })
}
