/**
 * Spaceship physics simulation hook
 * Phase 6: Game Mode (GAME-03)
 * Migrated from tldraw → Konva
 */

import { useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { updatePhysics, type PhysicsState } from '@/lib/physics'
import { calculateCameraTarget } from '@/lib/cameraFollow'
import { useKeyboardInput } from './useKeyboardInput'

export interface CursorState {
  x: number // screen coordinates
  y: number // screen coordinates
  rotation: number // radians
}

/**
 * Read the Konva stage camera as a tldraw-compatible { x, y, z } object.
 *
 * Konva stores the stage offset as screen pixels from the top-left of the
 * canvas element.  To convert to the "world top-left" convention used by
 * calculateCameraTarget we reverse the sign and divide by the zoom level:
 *
 *   worldX = -stageX / scale
 *   worldY = -stageY / scale
 *
 * (A positive stageX means the world has been panned right, so the world
 *  origin is to the LEFT of the viewport, i.e. worldX is negative.)
 */
function readKonvaCamera(stage: Konva.Stage): { x: number; y: number; z: number } {
  const z = stage.scaleX()
  return {
    x: -stage.x() / z,
    y: -stage.y() / z,
    z,
  }
}

/**
 * Apply a tldraw-compatible camera { x, y, z } back to a Konva stage.
 *
 *   stageX = -worldX * scale
 *   stageY = -worldY * scale
 */
function applyKonvaCamera(
  stage: Konva.Stage,
  camera: { x: number; y: number; z: number }
): void {
  stage.position({ x: -camera.x * camera.z, y: -camera.y * camera.z })
  stage.scale({ x: camera.z, y: camera.z })
}

/**
 * Hook to manage spaceship physics simulation with requestAnimationFrame.
 * @param stage - Konva Stage instance (replaces tldraw Editor)
 * @param enabled - Whether game mode is active
 * @returns Current cursor state (screen position + rotation)
 */
export function useSpaceshipPhysics(
  stage: Konva.Stage | null,
  enabled: boolean
): CursorState {
  // Physics state in refs (avoid re-render overhead)
  const physicsRef = useRef<PhysicsState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    rotation: 0,
  })

  const lastFrameTimeRef = useRef(0)
  const rafIdRef = useRef<number | undefined>(undefined)

  // UI state (triggers re-render for cursor overlay)
  const [cursorState, setCursorState] = useState<CursorState>({ x: 0, y: 0, rotation: 0 })

  // Keyboard input tracking
  const keyboardInput = useKeyboardInput(enabled)

  // Physics loop
  useEffect(() => {
    if (!enabled || !stage) {
      // Reset cursor state when disabled
      setCursorState({ x: 0, y: 0, rotation: 0 })
      return
    }

    // Initialize spaceship at current camera center (world coords)
    const camera = readKonvaCamera(stage)
    const width = stage.width()
    const height = stage.height()

    physicsRef.current.position = {
      x: camera.x + width / 2 / camera.z,
      y: camera.y + height / 2 / camera.z,
    }

    lastFrameTimeRef.current = performance.now()

    const animate = (time: number) => {
      const deltaTime = (time - lastFrameTimeRef.current) / 1000 // → seconds
      lastFrameTimeRef.current = time

      // Update physics
      physicsRef.current = updatePhysics(physicsRef.current, keyboardInput, deltaTime)

      // Smoothly follow spaceship with camera
      const currentCamera = readKonvaCamera(stage)
      const newCamera = calculateCameraTarget(
        currentCamera,
        physicsRef.current.position,
        { width: stage.width(), height: stage.height() },
        deltaTime
      )

      applyKonvaCamera(stage, newCamera)

      // Convert world position → screen position for the cursor overlay
      // screenX = (worldX - cameraX) * zoom
      const screenX = (physicsRef.current.position.x - newCamera.x) * newCamera.z
      const screenY = (physicsRef.current.position.y - newCamera.y) * newCamera.z

      setCursorState({
        x: screenX,
        y: screenY,
        rotation: physicsRef.current.rotation,
      })

      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [enabled, stage]) // keyboardInput removed from deps - it's a mutable ref

  return cursorState
}
