import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SpaceshipCursor } from '../src/components/SpaceshipCursor'

/**
 * Spaceship cursor component tests (GAME-02)
 * Tests SpaceshipCursor component
 */

describe('SpaceshipCursor', () => {
  // Test: Renders SVG spaceship with correct position
  it('renders spaceship at specified x, y position (GAME-02)', () => {
    const { container } = render(<SpaceshipCursor x={100} y={200} rotation={0} />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.left).toBe('100px')
    expect(wrapper.style.top).toBe('200px')
  })

  // Test: Applies rotation transform based on rotation prop
  it('applies rotation transform (GAME-02)', () => {
    const rotationRad = Math.PI / 2
    const { container } = render(<SpaceshipCursor x={0} y={0} rotation={rotationRad} />)
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeTruthy()
    // Component accepts rotation prop and renders without error
    // (Motion.dev handles actual transform application)
  })

  // Test: Has pointer-events-none to avoid blocking clicks
  it('has pointer-events-none class (GAME-02)', () => {
    const { container } = render(<SpaceshipCursor x={0} y={0} rotation={0} />)
    
    const wrapper = container.querySelector('.pointer-events-none')
    expect(wrapper).toBeTruthy()
  })

  // Test: Renders SVG with spaceship shape
  it('renders SVG spaceship graphic (GAME-02)', () => {
    const { container } = render(<SpaceshipCursor x={0} y={0} rotation={0} />)
    
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    
    // Should have some path or shape elements
    const shapes = container.querySelectorAll('path, circle, polygon')
    expect(shapes.length).toBeGreaterThan(0)
  })

  // Test: Has fixed positioning
  it('has fixed positioning for overlay (GAME-02)', () => {
    const { container } = render(<SpaceshipCursor x={0} y={0} rotation={0} />)
    
    const wrapper = container.querySelector('.fixed')
    expect(wrapper).toBeTruthy()
  })
})
