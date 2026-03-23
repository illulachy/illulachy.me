import { describe, it, expect } from 'vitest'
import { positionTimelineNodes, HUB_POSITION } from '../src/lib/positionNodes'
import { simulateLayout } from '../src/lib/forceSimulation'
import { createDateToXMapper } from '../src/lib/dateUtils'
import type { ContentNode } from '../src/types/content'

describe('simulateLayout', () => {
  const mockNodes: ContentNode[] = [
    { id: '1', type: 'blog', title: 'Old', date: '2020-01-01T00:00:00.000Z' },
    { id: '2', type: 'blog', title: 'Mid', date: '2022-06-15T00:00:00.000Z' },
    { id: '3', type: 'blog', title: 'New', date: '2024-12-31T00:00:00.000Z' }
  ]
  const dateToX = createDateToXMapper(mockNodes)
  const seed = 12345

  it('returns PositionedNode array with x, y coordinates', () => {
    const result = simulateLayout(mockNodes, dateToX, seed)
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('node')
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('y')
    expect(typeof result[0].x).toBe('number')
    expect(typeof result[0].y).toBe('number')
  })

  it('all X coordinates are negative (TIME-01)', () => {
    const result = simulateLayout(mockNodes, dateToX, seed)
    result.forEach(({ x }) => {
      expect(x).toBeLessThan(0)
    })
  })

  it('chronological order: older nodes have more negative X (TIME-02)', () => {
    const result = simulateLayout(mockNodes, dateToX, seed)
    const sortedByDate = [...result].sort((a, b) => 
      new Date(a.node.date).getTime() - new Date(b.node.date).getTime()
    )
    const sortedByX = [...sortedByDate].sort((a, b) => a.x - b.x)
    
    // Same order = chronological by X
    expect(sortedByDate.map(n => n.node.id)).toEqual(sortedByX.map(n => n.node.id))
  })

  it('newest node has X closest to 0 (TIME-03)', () => {
    const result = simulateLayout(mockNodes, dateToX, seed)
    const newest = result.find(n => n.node.date === '2024-12-31T00:00:00.000Z')
    const others = result.filter(n => n.node.date !== '2024-12-31T00:00:00.000Z')
    
    others.forEach(other => {
      expect(Math.abs(newest!.x)).toBeLessThan(Math.abs(other.x))
    })
  })

  it('no overlaps: minimum distance between nodes', () => {
    const result = simulateLayout(mockNodes, dateToX, seed)
    const COLLISION_RADIUS = 245 // From RESEARCH.md (diagonal/2 + padding/2)
    
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i], b = result[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = COLLISION_RADIUS * 2
        
        expect(distance).toBeGreaterThanOrEqual(minDistance)
      }
    }
  })

  it('deterministic: same seed produces identical positions', () => {
    const result1 = simulateLayout(mockNodes, dateToX, seed)
    const result2 = simulateLayout(mockNodes, dateToX, seed)
    
    expect(result1).toEqual(result2)
  })
})

describe('positionTimelineNodes', () => {
  const mockNodes: ContentNode[] = [
    { id: '1', type: 'blog', title: 'Old', date: '2020-01-01T00:00:00.000Z' },
    { id: '2', type: 'blog', title: 'Mid', date: '2022-06-15T00:00:00.000Z' },
    { id: '3', type: 'blog', title: 'New', date: '2024-12-31T00:00:00.000Z' }
  ]

  it('returns PositionedNode array with x, y coordinates', () => {
    const result = positionTimelineNodes(mockNodes)
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('node')
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('y')
  })

  it('all X coordinates are negative (TIME-01)', () => {
    const result = positionTimelineNodes(mockNodes)
    result.forEach(({ x }) => {
      expect(x).toBeLessThan(0)
    })
  })

  it('chronological order: older nodes have more negative X (TIME-02)', () => {
    const result = positionTimelineNodes(mockNodes)
    const sortedByDate = [...result].sort((a, b) => 
      new Date(a.node.date).getTime() - new Date(b.node.date).getTime()
    )
    const sortedByX = [...sortedByDate].sort((a, b) => a.x - b.x)
    
    expect(sortedByDate.map(n => n.node.id)).toEqual(sortedByX.map(n => n.node.id))
  })

  it('newest node has X closest to 0 (TIME-03)', () => {
    const result = positionTimelineNodes(mockNodes)
    const newest = result.find(n => n.node.date === '2024-12-31T00:00:00.000Z')
    const others = result.filter(n => n.node.date !== '2024-12-31T00:00:00.000Z')
    
    others.forEach(other => {
      expect(Math.abs(newest!.x)).toBeLessThan(Math.abs(other.x))
    })
  })

  it('no overlaps: minimum 150px gaps between nodes', () => {
    const result = positionTimelineNodes(mockNodes)
    const COLLISION_RADIUS = 245
    
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i], b = result[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = COLLISION_RADIUS * 2
        
        expect(distance).toBeGreaterThanOrEqual(minDistance)
      }
    }
  })

  it('handles empty array', () => {
    const result = positionTimelineNodes([])
    expect(result).toEqual([])
  })
})

describe('positionTimelineNodes (integration)', () => {
  const mockNodes: ContentNode[] = [
    { id: '1', type: 'blog', title: 'Old', date: '2020-01-01T00:00:00.000Z' },
    { id: '2', type: 'blog', title: 'Mid', date: '2022-06-15T00:00:00.000Z' },
    { id: '3', type: 'blog', title: 'New', date: '2024-12-31T00:00:00.000Z' }
  ]

  it('orchestrates all modules to produce valid positions', () => {
    const result = positionTimelineNodes(mockNodes)
    
    expect(result).toHaveLength(mockNodes.length)
    expect(result.every(n => n.x < 0)).toBe(true) // TIME-01
    
    // Check chronological order
    const sortedByDate = [...result].sort((a, b) => 
      new Date(a.node.date).getTime() - new Date(b.node.date).getTime()
    )
    const sortedByX = [...sortedByDate].sort((a, b) => a.x - b.x)
    expect(sortedByDate.map(n => n.node.id)).toEqual(sortedByX.map(n => n.node.id))
  })

  it('exports HUB_POSITION unchanged', () => {
    expect(HUB_POSITION).toEqual({ x: 0, y: 0 })
  })
})
