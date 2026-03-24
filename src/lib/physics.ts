/**
 * Physics utilities for game mode spaceship navigation
 * Frame-rate independent momentum-based physics
 * Phase 6: Game Mode (GAME-03)
 */

import type { PhysicsState, KeyboardInput, PhysicsConfig } from '@/types/physics'

// Re-export types for convenience
export type { PhysicsState, KeyboardInput, PhysicsConfig }

/**
 * Physics configuration constants
 */
export const PHYSICS_CONSTANTS: PhysicsConfig = {
  ACCELERATION: 800,      // pixels/second²
  MAX_VELOCITY: 600,      // pixels/second
  FRICTION: 0.92,         // per second decay (0-1)
  ROTATION_SPEED: 8,      // radians/second
}

/**
 * Update physics state based on input and delta time
 * Frame-rate independent using delta time scaling
 */
export function updatePhysics(
  state: PhysicsState,
  input: KeyboardInput,
  deltaTime: number // seconds
): PhysicsState {
  const dt = deltaTime
  const { ACCELERATION, MAX_VELOCITY, FRICTION, ROTATION_SPEED } = PHYSICS_CONSTANTS
  
  // Apply input acceleration
  let ax = 0
  let ay = 0
  if (input.up) ay -= ACCELERATION
  if (input.down) ay += ACCELERATION
  if (input.left) ax -= ACCELERATION
  if (input.right) ax += ACCELERATION
  
  // Update velocity with acceleration
  let vx = state.velocity.x + ax * dt
  let vy = state.velocity.y + ay * dt
  
  // Apply friction (exponential decay, frame-rate independent)
  vx *= Math.pow(FRICTION, dt * 60)
  vy *= Math.pow(FRICTION, dt * 60)
  
  // Calculate speed
  const speed = Math.sqrt(vx * vx + vy * vy)
  
  // Clamp to max velocity
  if (speed > MAX_VELOCITY) {
    vx = (vx / speed) * MAX_VELOCITY
    vy = (vy / speed) * MAX_VELOCITY
  }
  
  // Update position
  const x = state.position.x + vx * dt
  const y = state.position.y + vy * dt
  
  // Calculate rotation to face velocity direction
  let rotation = state.rotation
  if (speed > 10) { // Only rotate when moving
    const targetRotation = Math.atan2(vy, vx)
    // Smooth rotation interpolation
    rotation = lerpAngle(state.rotation, targetRotation, ROTATION_SPEED * dt)
  }
  
  return {
    position: { x, y },
    velocity: { x: vx, y: vy },
    acceleration: { x: ax, y: ay },
    rotation,
  }
}

/**
 * Interpolate between two angles via shortest path
 * Handles wrap-around at ±PI boundary
 */
export function lerpAngle(from: number, to: number, t: number): number {
  // Normalize angles to [-PI, PI]
  const normalizeAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
  from = normalizeAngle(from)
  to = normalizeAngle(to)
  
  // Find shortest rotation direction
  let delta = to - from
  if (delta > Math.PI) delta -= 2 * Math.PI
  if (delta < -Math.PI) delta += 2 * Math.PI
  
  return from + delta * Math.min(t, 1)
}
