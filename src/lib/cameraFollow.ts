/**
 * Camera follow utilities for smooth spaceship tracking
 * Phase 6: Game Mode (GAME-03)
 */

/**
 * Camera lag factor (lower = more lag, 0.05-0.2 range)
 */
export const CAMERA_LAG = 0.1

/**
 * Calculate camera target position to follow spaceship
 * Frame-rate independent using delta time scaling
 */
export function calculateCameraTarget(
  currentCamera: { x: number; y: number; z: number },
  spaceshipWorldPos: { x: number; y: number },
  viewportSize: { width: number; height: number },
  deltaTime: number
): { x: number; y: number; z: number } {
  // Calculate where camera should be to center spaceship on screen
  // Camera position is top-left of viewport in world coordinates
  const targetX = spaceshipWorldPos.x - (viewportSize.width / 2) / currentCamera.z
  const targetY = spaceshipWorldPos.y - (viewportSize.height / 2) / currentCamera.z
  
  // Lerp camera position toward target (frame-rate independent)
  const lerpFactor = 1 - Math.pow(1 - CAMERA_LAG, deltaTime * 60)
  const newX = lerp(currentCamera.x, targetX, lerpFactor)
  const newY = lerp(currentCamera.y, targetY, lerpFactor)
  
  return { x: newX, y: newY, z: currentCamera.z }
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1)
}
