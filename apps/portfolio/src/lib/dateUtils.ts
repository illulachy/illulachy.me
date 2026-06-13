import type { ContentNode } from '../types/content'

export const TIMELINE_START = new Date('2017-01-01T00:00:00Z')

export interface DateRange {
  oldest: Date
  newest: Date
  spanDays: number
}

/**
 * Calculate date range from content nodes
 *
 * @param nodes - Timeline content nodes
 * @returns Date range with oldest, newest, and span in days
 */
export function getDateRange(nodes: ContentNode[]): DateRange {
  const timestamps = nodes.map(n => new Date(n.date).getTime())
  const oldestMs = Math.min(...timestamps)
  const newestMs = Math.max(...timestamps)

  return {
    oldest: new Date(oldestMs),
    newest: new Date(newestMs),
    spanDays: (newestMs - oldestMs) / (1000 * 60 * 60 * 24),
  }
}

/**
 * Horizontal step between the two columns inside a single cluster's 2x2 block.
 * Tight, so nodes that share a date range read as one group.
 */
export const INTRA_CLUSTER_STEP = 340

/**
 * Horizontal gap inserted between adjacent clusters (on top of the cluster's
 * own width). Wide, so distinct date ranges read as separated groups.
 */
export const INTER_CLUSTER_GAP = 520

/**
 * Distance from the hub's left edge to the newest cluster.
 */
export const HUB_GAP = 1080

/**
 * Up to 2 nodes stacked above the axis and 2 below per column → 4 per column.
 * A cluster wider than 4 nodes overflows into additional columns.
 */
export const ROWS_PER_COLUMN = 4

/**
 * Minimum horizontal width reserved for a calendar year that contains no
 * nodes, so empty years (e.g. 2025) still occupy visible axis space and keep
 * their label.
 */
export const EMPTY_YEAR_WIDTH = 2600

interface ClusterMember {
  node: ContentNode
  /** Column offset within the cluster (0-based). */
  col: number
  /** Row within the column: 0..ROWS_PER_COLUMN-1. */
  row: number
}

export interface Cluster {
  /** ISO year-week key, e.g. "2026-W15". */
  key: string
  /** Calendar year of the cluster (from its newest node). */
  year: number
  /** Centre X of the cluster's leftmost column (most negative). */
  centerX: number
  /** Number of columns the cluster spans. */
  columns: number
  members: ClusterMember[]
}

/**
 * A node's resolved layout.
 *
 * `row` is no longer a fixed up/down assignment — the side (above/below axis)
 * is chosen with a session-seeded shuffle in the layout step. `columnId`
 * identifies the column a node shares with others so the shuffle can keep each
 * column balanced and overlap-free; `slot` is its order within that column.
 */
export interface NodeLayout {
  x: number
  /** Stable id for the column this node sits in (cluster key + column index). */
  columnId: string
  /** Order of this node within its column (0-based). */
  slot: number
}

export interface AxisLayout {
  byId: Map<string, NodeLayout>
  clusters: Cluster[]
  /** One marker per calendar year present (incl. empty years between). */
  yearMarkers: { year: number; x: number }[]
  /** Left-most X any node or marker occupies. */
  axisLeftX: number
}

function isoWeekKey(date: Date): string {
  // ISO-8601 week: Thursday determines the week-year.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Build the cluster-based axis layout.
 *
 * Nodes are grouped into clusters by ISO week (a date range), so 2-4 nodes
 * that happened around the same time form one compact 2x2 block. Clusters are
 * laid out newest → oldest from the hub, tight within a cluster and gapped
 * between clusters. Empty calendar years still reserve EMPTY_YEAR_WIDTH so they
 * keep a visible segment and label.
 */
export function buildAxisLayout(nodes: ContentNode[]): AxisLayout {
  const byId = new Map<string, NodeLayout>()

  if (nodes.length === 0) {
    return { byId, clusters: [], yearMarkers: [], axisLeftX: -HUB_GAP }
  }

  // Group by ISO week.
  const groups = new Map<string, ContentNode[]>()
  for (const node of nodes) {
    const key = isoWeekKey(new Date(node.date))
    const list = groups.get(key) ?? []
    list.push(node)
    groups.set(key, list)
  }

  // Sort clusters newest → oldest by their newest member.
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const an = Math.max(...groups.get(a)!.map(n => new Date(n.date).getTime()))
    const bn = Math.max(...groups.get(b)!.map(n => new Date(n.date).getTime()))
    return bn - an
  })

  const clusters: Cluster[] = []
  // cursorX walks left (negative) from the hub. It tracks the X of the next
  // (newest-side) column to be placed.
  let cursorX = -HUB_GAP
  let prevYear: number | null = null

  for (const key of sortedKeys) {
    const members = groups.get(key)!
    members.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // newest first
    const columns = Math.ceil(members.length / ROWS_PER_COLUMN)
    const year = new Date(members[0].date).getUTCFullYear()

    // Insert empty-year padding for each calendar year skipped between the
    // previous (newer) cluster and this one, so gaps in posting still show the
    // intervening years with width + a label anchor.
    if (prevYear !== null && prevYear - year >= 1) {
      cursorX -= (prevYear - year) * EMPTY_YEAR_WIDTH
    }

    // Right-most column of this cluster sits at cursorX; columns extend left.
    const rightColX = cursorX
    members.forEach((node, i) => {
      const col = Math.floor(i / ROWS_PER_COLUMN)
      const slot = i % ROWS_PER_COLUMN
      const x = rightColX - col * INTRA_CLUSTER_STEP
      byId.set(node.id, { x, columnId: `${key}#${col}`, slot })
    })

    const leftColX = rightColX - (columns - 1) * INTRA_CLUSTER_STEP
    clusters.push({ key, year, centerX: leftColX, columns, members: [] })

    // Advance cursor past this cluster's width + the inter-cluster gap.
    cursorX = leftColX - INTER_CLUSTER_GAP
    prevYear = year
  }

  // Year markers: place each present year's label at the left edge of its
  // oldest cluster. Also include empty years between populated ones.
  const yearMarkers = buildYearMarkers(clusters)

  const axisLeftX = clusters.length
    ? Math.min(...clusters.map(c => c.centerX)) - INTER_CLUSTER_GAP
    : -HUB_GAP

  return { byId, clusters, yearMarkers, axisLeftX }
}

function buildYearMarkers(clusters: Cluster[]): { year: number; x: number }[] {
  if (clusters.length === 0) return []

  // Left edge X of the oldest cluster in each year.
  const leftByYear = new Map<number, number>()
  for (const c of clusters) {
    const prev = leftByYear.get(c.year)
    if (prev === undefined || c.centerX < prev) leftByYear.set(c.year, c.centerX)
  }

  const years = [...leftByYear.keys()].sort((a, b) => b - a) // newest first
  const newestYear = years[0]
  const oldestYear = years[years.length - 1]

  const markers: { year: number; x: number }[] = []
  for (let year = newestYear; year >= oldestYear; year--) {
    const left = leftByYear.get(year)
    if (left !== undefined) {
      markers.push({ year, x: left })
    } else {
      // Empty year: anchor between its neighbours using reserved width.
      // Find the next populated year newer than this one and step left.
      const newerLeft = markers.length ? markers[markers.length - 1].x : -HUB_GAP
      markers.push({ year, x: newerLeft - EMPTY_YEAR_WIDTH / 2 })
    }
  }
  return markers
}

/**
 * Retained for call-site stability; the axis is no longer calendar-linear.
 */
export function getTimelineAnchor(_nodes: ContentNode[]): Date {
  return new Date()
}

/**
 * Year marker positions for rendering labels on the axis.
 */
export function getYearPositions(nodes: ContentNode[]): { year: number; x: number }[] {
  return buildAxisLayout(nodes).yearMarkers
}
