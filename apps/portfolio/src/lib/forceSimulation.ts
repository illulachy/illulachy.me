import { randomLcg } from 'd3-random'
import type { ContentNode } from '../types/content'
import type { PositionedNode } from './positionNodes'
import { buildAxisLayout, type NodeLayout } from './dateUtils'

// Shape dimensions
const SHAPE_HEIGHT = 200

// Half node height + buffer: nearest a node center sits to the axis.
const MIN_AXIS_CLEARANCE = SHAPE_HEIGHT / 2 + 60 // 160px
// Vertical distance between stacked rows on the same side of the axis.
const ROW_PITCH = SHAPE_HEIGHT + 60 // 260px

// The four vertical bands a node can occupy, by (side, depth).
const BAND = {
  upInner: MIN_AXIS_CLEARANCE,
  downInner: -MIN_AXIS_CLEARANCE,
  upOuter: MIN_AXIS_CLEARANCE + ROW_PITCH,
  downOuter: -(MIN_AXIS_CLEARANCE + ROW_PITCH),
}

/**
 * Deterministic 0..1 hash from a seed and a string key. Used so each node's
 * up/down coin depends only on (seed, node.id) — stable across renders and
 * independent of map/iteration order.
 */
function hash01(seed: number, key: string): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 0x01000193) >>> 0
  }
  // randomLcg gives a well-distributed float from the integer state.
  return randomLcg(h)()
}

/**
 * Assign each node in a single column to one of the four bands.
 *
 * Side (up/down) is a session-seeded coin per node, so the layout looks
 * organic but stays stable for the session. To keep columns balanced and
 * overlap-free, each side holds at most two nodes (inner then outer); a side's
 * overflow spills to the other side. Returns nodeId → Y band.
 */
function assignBands(columnNodes: { id: string }[], seed: number): Map<string, number> {
  // Sort by coin so assignment is order-independent; ties broken by id.
  const ranked = columnNodes
    .map(n => ({ id: n.id, coin: hash01(seed, n.id) }))
    .sort((a, b) => a.coin - b.coin || (a.id < b.id ? -1 : 1))

  const out = new Map<string, number>()
  let up = 0
  let down = 0
  for (const { id, coin } of ranked) {
    // Prefer the coin's side, but fall back if that side is full (2 slots).
    let goUp = coin < 0.5
    if (goUp && up >= 2) goUp = false
    if (!goUp && down >= 2) goUp = true

    if (goUp) {
      out.set(id, up === 0 ? BAND.upInner : BAND.upOuter)
      up++
    } else {
      out.set(id, down === 0 ? BAND.downInner : BAND.downOuter)
      down++
    }
  }
  return out
}

/**
 * Resolve final node positions from the cluster-based axis layout.
 *
 * X comes from the node's cluster/column. The up/down side within a column is
 * chosen by a session-seeded coin (balanced, max two per side), giving an
 * organic placement that stays stable for the session. A small seeded jitter
 * keeps it from looking gridlike. Overlaps are impossible: columns are wider
 * than a node and the four bands are pitch-separated.
 *
 * @param nodes - Timeline content nodes
 * @param _dateToX - Unused; retained for call-site stability
 * @param seed - Session random seed
 * @returns Positioned nodes with final x, y coordinates
 */
export function simulateLayout(
  nodes: ContentNode[],
  _dateToX: (date: string) => number,
  seed: number
): PositionedNode[] {
  const { byId } = buildAxisLayout(nodes)

  // Group nodes by their column so sides can be balanced within each column.
  const columns = new Map<string, { id: string }[]>()
  for (const node of nodes) {
    const layout = byId.get(node.id) as NodeLayout
    const list = columns.get(layout.columnId) ?? []
    list.push({ id: node.id })
    columns.set(layout.columnId, list)
  }

  // Resolve each column's band assignment once.
  const bandById = new Map<string, number>()
  for (const [, colNodes] of columns) {
    for (const [id, band] of assignBands(colNodes, seed)) bandById.set(id, band)
  }

  const random = randomLcg(seed)
  return nodes.map(node => {
    const layout = byId.get(node.id) as NodeLayout
    const band = bandById.get(node.id) ?? BAND.upInner
    const jitterX = (random() - 0.5) * 30
    const jitterY = (random() - 0.5) * 40
    return {
      node,
      x: layout.x + jitterX,
      y: band + jitterY,
    }
  })
}
