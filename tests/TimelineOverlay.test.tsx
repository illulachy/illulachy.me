import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TimelineOverlay } from '../src/components/TimelineOverlay'
import type { PositionedNode } from '../src/lib/positionNodes'

describe('TimelineOverlay', () => {
  const mockNodes: PositionedNode[] = [
    { 
      node: { 
        id: '1', 
        type: 'blog', 
        title: 'Test Blog', 
        date: '2020-01-01T00:00:00.000Z', 
        url: 'https://example.com'
      }, 
      x: -1000, 
      y: 100 
    },
    { 
      node: { 
        id: '2', 
        type: 'youtube', 
        title: 'Test Video', 
        date: '2024-01-01T00:00:00.000Z', 
        url: 'https://youtube.com'
      }, 
      x: -200, 
      y: -150 
    }
  ]
  const hubX = 0
  const viewportTransform = { x: -500, y: -300, zoom: 1.5 }
  
  it('renders SVG with pointer-events none', () => {
    const { container } = render(
      <TimelineOverlay 
        nodes={mockNodes} 
        hubX={hubX} 
        viewportTransform={viewportTransform} 
      />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.style.pointerEvents).toBe('none')
  })
  
  it('renders SVG with correct viewBox based on viewport transform', () => {
    const { container } = render(
      <TimelineOverlay 
        nodes={mockNodes} 
        hubX={hubX} 
        viewportTransform={viewportTransform} 
      />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    
    // ViewBox should be calculated from viewport transform
    // Format: "x y width height"
    const viewBox = svg?.getAttribute('viewBox')
    expect(viewBox).toBeTruthy()
    expect(viewBox).toContain('-500') // x position
    expect(viewBox).toContain('-300') // y position
  })
  
  it('renders timeline axis line at y=0', () => {
    const { container } = render(
      <TimelineOverlay 
        nodes={mockNodes} 
        hubX={hubX} 
        viewportTransform={viewportTransform} 
      />
    )
    
    // Check for horizontal line at y=0
    const lines = container.querySelectorAll('line')
    const axisLine = Array.from(lines).find(line => 
      line.getAttribute('y1') === '0' && line.getAttribute('y2') === '0'
    )
    expect(axisLine).toBeTruthy()
    
    // Axis should extend from far left to hub fade zone
    expect(axisLine?.getAttribute('x1')).toBe('-10000')
    expect(axisLine?.getAttribute('x2')).toBe('-500') // hubX - 500
  })
  
  it('renders connector line for each node', () => {
    const { container } = render(
      <TimelineOverlay 
        nodes={mockNodes} 
        hubX={hubX} 
        viewportTransform={viewportTransform} 
      />
    )
    const lines = container.querySelectorAll('line')
    
    // Should have 1 axis line + 2 connector lines = 3 total
    expect(lines.length).toBe(3)
    
    // Check first connector (node at x=-1000, y=100)
    const connector1 = Array.from(lines).find(line => 
      line.getAttribute('x1') === '-1000' && 
      line.getAttribute('y1') === '100'
    )
    expect(connector1).toBeTruthy()
    expect(connector1?.getAttribute('x2')).toBe('-1000')
    expect(connector1?.getAttribute('y2')).toBe('0')
    
    // Check second connector (node at x=-200, y=-150)
    const connector2 = Array.from(lines).find(line => 
      line.getAttribute('x1') === '-200' && 
      line.getAttribute('y1') === '-150'
    )
    expect(connector2).toBeTruthy()
    expect(connector2?.getAttribute('x2')).toBe('-200')
    expect(connector2?.getAttribute('y2')).toBe('0')
  })
  
  it('scales stroke width inversely with zoom', () => {
    const { container } = render(
      <TimelineOverlay 
        nodes={mockNodes} 
        hubX={hubX} 
        viewportTransform={{ x: 0, y: 0, zoom: 2.0 }} 
      />
    )
    
    const lines = container.querySelectorAll('line')
    const axisLine = lines[0]
    
    // Stroke width should be 1 / zoom = 1 / 2.0 = 0.5
    expect(axisLine.getAttribute('stroke-width')).toBe('0.5')
  })
  
  it('calculates fade opacity correctly for nodes near hub', () => {
    const nodesNearHub: PositionedNode[] = [
      { 
        node: { 
          id: '3', 
          type: 'milestone', 
          title: 'Near Hub', 
          date: '2024-12-01T00:00:00.000Z' 
        }, 
        x: -200, // Within fade zone (500px from hub)
        y: 50 
      },
      { 
        node: { 
          id: '4', 
          type: 'project', 
          title: 'Far From Hub', 
          date: '2020-01-01T00:00:00.000Z' 
        }, 
        x: -1000, // Outside fade zone
        y: -50 
      }
    ]
    
    const { container } = render(
      <TimelineOverlay 
        nodes={nodesNearHub} 
        hubX={0} 
        viewportTransform={{ x: 0, y: 0, zoom: 1.0 }} 
      />
    )
    
    const lines = container.querySelectorAll('line')
    
    // Find connectors (skip axis line)
    const connectors = Array.from(lines).filter(line => 
      line.getAttribute('y1') !== '0' || line.getAttribute('y2') !== '0'
    )
    
    // Connector for node at x=-200 should have reduced opacity
    const nearConnector = connectors.find(line => line.getAttribute('x1') === '-200')
    const nearStroke = nearConnector?.getAttribute('stroke')
    expect(nearStroke).toContain('rgba')
    // Opacity should be distance / 500 = 200 / 500 = 0.4 * 0.1 = 0.04
    expect(nearStroke).toContain('0.04')
    
    // Connector for node at x=-1000 should have full opacity (distance > 500)
    const farConnector = connectors.find(line => line.getAttribute('x1') === '-1000')
    const farStroke = farConnector?.getAttribute('stroke')
    expect(farStroke).toContain('rgba')
    // Opacity should be 1.0 * 0.1 = 0.1
    expect(farStroke).toContain('0.1')
  })
})
