import { describe, it, expect } from 'vitest'

/**
 * Physics core utilities tests (GAME-03)
 * Tests updatePhysics, lerpAngle functions
 */

describe('updatePhysics', () => {
  // Test: No input + deltaTime=0.016 (60fps) → velocity decays by friction
  it.todo('applies friction decay when no input (GAME-03)')

  // Test: Arrow up pressed → negative Y acceleration applied
  it.todo('applies negative Y acceleration when up key pressed (GAME-03)')

  // Test: Velocity exceeds MAX_VELOCITY → clamped to max
  it.todo('clamps velocity to MAX_VELOCITY (GAME-03)')

  // Test: Speed > 10px/s → rotation lerps toward velocity direction
  it.todo('updates rotation to face velocity direction when moving (GAME-03)')

  // Test: deltaTime=0.016 vs 0.033 → same total displacement after 2 vs 1 frame
  it.todo('produces frame-rate independent physics (GAME-03)')
})

describe('lerpAngle', () => {
  // Test: lerpAngle(359°, 1°, 0.5) → ~0° (not 180°, shortest path)
  it.todo('interpolates angles via shortest path (GAME-03)')

  // Test: lerpAngle(PI, -PI, 0.5) → ~0 (wrap-around handling)
  it.todo('handles wrap-around at ±PI boundary (GAME-03)')
})
