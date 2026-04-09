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
    spanDays: (newestMs - oldestMs) / (1000 * 60 * 60 * 24)
  }
}

/**
 * Create mapper function: ISO date string → negative X coordinate
 * 
 * Older dates map to more negative X values (further left from hub at x=0).
 * Uses variable density: 2px per day (can be adjusted based on testing).
 * 
 * The timeline starts from TIMELINE_START (Jan 2017). The hub at x=0
 * represents the "present". All timeline nodes extend left (negative X).
 * 
 * @param nodes - Timeline content nodes
 * @returns Function that maps date string to X coordinate
 */
export function createDateToXMapper(nodes: ContentNode[]): (date: string) => number {
  const range = getDateRange(nodes)
  const newestTimestamp = range.newest.getTime()
  const PX_PER_DAY = 2 // Variable density (adjustable)
  const MIN_OFFSET = 800 // Minimum distance from hub (ensures all nodes are negative X)
  
  return (dateStr: string) => {
    const timestamp = new Date(dateStr).getTime()
    const daysBeforeNewest = (newestTimestamp - timestamp) / (1000 * 60 * 60 * 24)
    return -(daysBeforeNewest * PX_PER_DAY + MIN_OFFSET)
  }
}

/**
 * Get X positions for each year marker on the timeline
 * 
 * @param nodes - Timeline content nodes
 * @returns Array of { year, x } for rendering year labels
 */
export function getYearPositions(nodes: ContentNode[]): { year: number; x: number }[] {
  const range = getDateRange(nodes)
  const startYear = TIMELINE_START.getUTCFullYear()
  const endYear = range.newest.getUTCFullYear()
  const dateToX = createDateToXMapper(nodes)
  
  const positions: { year: number; x: number }[] = []
  for (let year = startYear; year <= endYear; year++) {
    const jan1 = new Date(Date.UTC(year, 0, 1))
    positions.push({ year, x: dateToX(jan1.toISOString()) })
  }
  return positions
}
