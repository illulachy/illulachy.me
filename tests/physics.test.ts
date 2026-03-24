import { describe, it, expect } from 'vitest'
import { updatePhysics, lerpAngle, PHYSICS_CONSTANTS } from '../src/lib/physics'
import type { PhysicsState, KeyboardInput } from '../src/types/physics'

/**
 * Physics core utilities tests (GAME-03)
 * Tests updatePhysics, lerpAngle functions
 */

describe('updatePhysics', () => {
  // Test: No input + deltaTime=0.016 (60fps) → velocity decays by friction
  it('applies friction decay when no input (GAME-03)', () => {
    const initialState: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 100, y: 100 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
    }
    const noInput: KeyboardInput = { up: false, down: false, left: false, right: false }
    const deltaTime = 0.016 // 60fps

    const result = updatePhysics(initialState, noInput, deltaTime)

    // Velocity should decay toward zero
    expect(result.velocity.x).toBeLessThan(initialState.velocity.x)
    expect(result.velocity.y).toBeLessThan(initialState.velocity.y)
    expect(result.velocity.x).toBeGreaterThan(0) // Not instant stop
  })

  // Test: Arrow up pressed → negative Y acceleration applied
  it('applies negative Y acceleration when up key pressed (GAME-03)', () => {
    const initialState: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
    }
    const upInput: KeyboardInput = { up: true, down: false, left: false, right: false }
    const deltaTime = 0.016

    const result = updatePhysics(initialState, upInput, deltaTime)

    // Should have negative Y velocity (up in screen coordinates)
    expect(result.velocity.y).toBeLessThan(0)
    expect(result.acceleration.y).toBe(-PHYSICS_CONSTANTS.ACCELERATION)
  })

  // Test: Velocity exceeds MAX_VELOCITY → clamped to max
  it('clamps velocity to MAX_VELOCITY (GAME-03)', () => {
    const initialState: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 1000, y: 1000 }, // Way over max
      acceleration: { x: 0, y: 0 },
      rotation: 0,
    }
    const noInput: KeyboardInput = { up: false, down: false, left: false, right: false }
    const deltaTime = 0.016

    const result = updatePhysics(initialState, noInput, deltaTime)

    const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2)
    expect(speed).toBeLessThanOrEqual(PHYSICS_CONSTANTS.MAX_VELOCITY * 1.01) // 1% tolerance
  })

  // Test: Speed > 10px/s → rotation lerps toward velocity direction
  it('updates rotation to face velocity direction when moving (GAME-03)', () => {
    const initialState: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 100, y: 0 }, // Moving right
      acceleration: { x: 0, y: 0 },
      rotation: Math.PI / 2, // Currently facing down
    }
    const noInput: KeyboardInput = { up: false, down: false, left: false, right: false }
    const deltaTime = 0.016

    const result = updatePhysics(initialState, noInput, deltaTime)

    // Rotation should lerp toward 0 (facing right)
    expect(result.rotation).toBeLessThan(initialState.rotation)
    expect(result.rotation).toBeGreaterThan(0)
  })

  // Test: deltaTime=0.016 vs 0.033 → physics behavior is consistent
  it('produces frame-rate independent physics (GAME-03)', () => {
    const initialState: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
    }
    const rightInput: KeyboardInput = { up: false, down: false, left: false, right: true }

    // Run at 60fps for 2 frames
    let state60fps = updatePhysics(initialState, rightInput, 0.016)
    state60fps = updatePhysics(state60fps, rightInput, 0.016)

    // Run at 30fps for 1 frame (same total time)
    const state30fps = updatePhysics(initialState, rightInput, 0.033)

    // Both should have positive velocity (acceleration was applied)
    expect(state60fps.velocity.x).toBeGreaterThan(0)
    expect(state30fps.velocity.x).toBeGreaterThan(0)
    
    // Both should have moved forward
    expect(state60fps.position.x).toBeGreaterThan(0)
    expect(state30fps.position.x).toBeGreaterThan(0)
    
    // Velocities should be in the same ballpark (within 30% is good enough for feel)
    const velocityRatio = state60fps.velocity.x / state30fps.velocity.x
    expect(velocityRatio).toBeGreaterThan(0.7)
    expect(velocityRatio).toBeLessThan(1.3)
  })
})

describe('lerpAngle', () => {
  // Test: lerpAngle(359°, 1°, 0.5) → ~0° (not 180°, shortest path)
  it('interpolates angles via shortest path (GAME-03)', () => {
    const from = (359 * Math.PI) / 180 // 359 degrees in radians
    const to = (1 * Math.PI) / 180 // 1 degree in radians
    const t = 0.5

    const result = lerpAngle(from, to, t)

    // Should be close to 0 (not 180)
    expect(Math.abs(result)).toBeLessThan(0.1)
  })

  // Test: lerpAngle(PI, -PI, 0.5) → ~0 (wrap-around handling)
  it('handles wrap-around at ±PI boundary (GAME-03)', () => {
    const from = Math.PI
    const to = -Math.PI
    const t = 0.5

    const result = lerpAngle(from, to, t)

    // PI and -PI are the same angle, so lerp should stay at ±PI
    expect(Math.abs(result)).toBeGreaterThan(Math.PI * 0.99)
  })
})
