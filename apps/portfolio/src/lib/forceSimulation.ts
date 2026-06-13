import { randomLcg } from 'd3-random'
import type { ContentNode } from '../types/content'
import type { PositionedNode } from './positionNodes'
import { buildAxisLayout } from './dateUtils'

// Shape dimensions
const SHAPE_HEIGHT = 200

// Half node height + buffer: nearest a node center sits to the axis.
const MIN_AXIS_CLEARANCE = SHAPE_HEIGHT / 2 + 60 // 160px
// Vertical distance between stacked rows on the same side of the axis.
const ROW_PITCH = SHAPE_HEIGHT + 60 // 260px

// Row index → vertical band. Rows interleave across the axis so the two
// innermost rows sit closest (±160) and the outer two step out (±420),
// keeping density balanced above and below.
const ROW_BANDS = [
  MIN_AXIS_CLEARANCE, // row 0 → above, inner
  -MIN_AXIS_CLEARANCE, // row 1 → below, inner
  MIN_AXIS_CLEARANCE + ROW_PITCH, // row 2 → above, outer
  -(MIN_AXIS_CLEARANCE + ROW_PITCH), // row 3 → below, outer
]

/**
 * Resolve final node positions from the cluster-based axis layout.
 *
 * X comes from the node's cluster/column; Y is its row band with a small
 * seeded jitter for an organic, non-gridlike feel. Nodes within a cluster sit
 * close together (a 2x2 block); clusters are gapped apart. No force simulation
 * is needed — columns are wider than a node and rows are pitch-separated, so
 * overlaps are impossible by construction.
 *
 * @param nodes - Timeline content nodes
 * @param _dateToX - Unused; retained for call-site stability
 * @param seed - Random seed for deterministic jitter
 * @returns Positioned nodes with final x, y coordinates
 */
export function simulateLayout(
  nodes: ContentNode[],
  _dateToX: (date: string) => number,
  seed: number
): PositionedNode[] {
  const { byId } = buildAxisLayout(nodes)
  const random = randomLcg(seed)

  return nodes.map(node => {
    const layout = byId.get(node.id)!
    const jitterX = (random() - 0.5) * 30
    const jitterY = (random() - 0.5) * 40
    return {
      node,
      x: layout.x + jitterX,
      y: ROW_BANDS[layout.row] + jitterY,
    }
  })
}
