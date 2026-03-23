import { describe, it, expect } from 'vitest'
import { createDateToXMapper, getDateRange } from '../src/lib/dateUtils'
import type { ContentNode } from '../src/types/content'

describe('createDateToXMapper', () => {
  const mockNodes: ContentNode[] = [
    { id: '1', type: 'blog', title: 'Old', date: '2020-01-01T00:00:00.000Z' },
    { id: '2', type: 'blog', title: 'Mid', date: '2022-06-15T00:00:00.000Z' },
    { id: '3', type: 'blog', title: 'New', date: '2024-12-31T00:00:00.000Z' }
  ]

  it('returns mapper function that converts dates to negative X', () => {
    const dateToX = createDateToXMapper(mockNodes)
    expect(typeof dateToX).toBe('function')
    expect(dateToX('2022-06-15T00:00:00.000Z')).toBeLessThan(0)
  })

  it('oldest node maps to most negative X', () => {
    const dateToX = createDateToXMapper(mockNodes)
    const x1 = dateToX('2020-01-01T00:00:00.000Z')
    const x2 = dateToX('2024-12-31T00:00:00.000Z')
    expect(x1).toBeLessThan(x2) // More negative = older
  })

  it('newest node maps to X closest to 0', () => {
    const dateToX = createDateToXMapper(mockNodes)
    const xOld = dateToX('2020-01-01T00:00:00.000Z')
    const xNew = dateToX('2024-12-31T00:00:00.000Z')
    expect(Math.abs(xNew)).toBeLessThan(Math.abs(xOld))
  })

  it('nodes with same date get same X coordinate', () => {
    const dateToX = createDateToXMapper(mockNodes)
    const x1 = dateToX('2022-06-15T00:00:00.000Z')
    const x2 = dateToX('2022-06-15T00:00:00.000Z')
    expect(x1).toBe(x2)
  })

  it('chronological ordering maintained', () => {
    const dateToX = createDateToXMapper(mockNodes)
    const dates = [
      '2020-01-01T00:00:00.000Z',
      '2022-06-15T00:00:00.000Z',
      '2024-12-31T00:00:00.000Z'
    ]
    const xs = dates.map(dateToX)
    
    // Should be sorted ascending (oldest most negative)
    for (let i = 0; i < xs.length - 1; i++) {
      expect(xs[i]).toBeLessThan(xs[i + 1])
    }
  })
})

describe('getDateRange', () => {
  const mockNodes: ContentNode[] = [
    { id: '1', type: 'blog', title: 'Old', date: '2020-01-01T00:00:00.000Z' },
    { id: '2', type: 'blog', title: 'Mid', date: '2022-06-15T00:00:00.000Z' },
    { id: '3', type: 'blog', title: 'New', date: '2024-12-31T00:00:00.000Z' }
  ]

  it('calculates date span in days', () => {
    const range = getDateRange(mockNodes)
    expect(range.spanDays).toBeGreaterThan(1700) // 2020 to 2024 is ~1826 days
    expect(range.spanDays).toBeLessThan(2000)
  })

  it('identifies oldest and newest dates', () => {
    const range = getDateRange(mockNodes)
    expect(range.oldest.toISOString()).toBe('2020-01-01T00:00:00.000Z')
    expect(range.newest.toISOString()).toBe('2024-12-31T00:00:00.000Z')
  })

  it('handles single node', () => {
    const singleNode: ContentNode[] = [
      { id: '1', type: 'blog', title: 'Only', date: '2023-01-01T00:00:00.000Z' }
    ]
    const range = getDateRange(singleNode)
    expect(range.spanDays).toBe(0)
    expect(range.oldest.toISOString()).toBe('2023-01-01T00:00:00.000Z')
    expect(range.newest.toISOString()).toBe('2023-01-01T00:00:00.000Z')
  })
})
