import type { ContentNode } from '../types/content'

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
 * The hub at x=0 represents the "present". All timeline nodes extend
 * left (negative X), with newest nodes closest to hub but still negative.
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
