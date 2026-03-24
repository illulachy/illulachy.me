/**
 * Physics type definitions for game mode spaceship navigation
 * Phase 6: Game Mode (GAME-03)
 */

/**
 * Physics state for momentum-based movement
 */
export interface PhysicsState {
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  acceleration: { x: number; y: number }
  rotation: number // radians
}

/**
 * Keyboard input state (arrow keys)
 */
export interface KeyboardInput {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

/**
 * Physics configuration constants
 */
export interface PhysicsConfig {
  readonly ACCELERATION: number      // pixels/second²
  readonly MAX_VELOCITY: number      // pixels/second
  readonly FRICTION: number          // per second decay (0-1)
  readonly ROTATION_SPEED: number    // radians/second
}
