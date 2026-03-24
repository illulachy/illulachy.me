/**
 * Spaceship physics simulation hook
 * Phase 6: Game Mode (GAME-03)
 */

import { useEffect, useRef, useState } from 'react'
import type { Editor } from 'tldraw'
import { updatePhysics, type PhysicsState } from '@/lib/physics'
import { calculateCameraTarget } from '@/lib/cameraFollow'
import { useKeyboardInput } from './useKeyboardInput'

export interface CursorState {
  x: number // screen coordinates
  y: number // screen coordinates
  rotation: number // radians
}

/**
 * Hook to manage spaceship physics simulation with requestAnimationFrame
 * @param editor - tldraw Editor instance
 * @param enabled - Whether game mode is active
 * @returns Current cursor state (screen position + rotation)
 */
export function useSpaceshipPhysics(
  editor: Editor | null,
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
    if (!enabled || !editor) {
      // Reset cursor state when disabled
      setCursorState({ x: 0, y: 0, rotation: 0 })
      return
    }
    
    // Initialize spaceship at current camera center
    const camera = editor.getCamera()
    const bounds = editor.getViewportScreenBounds()
    physicsRef.current.position = {
      x: camera.x + (bounds.width / 2) / camera.z,
      y: camera.y + (bounds.height / 2) / camera.z,
    }
    
    lastFrameTimeRef.current = performance.now()
    
    const animate = (time: number) => {
      const deltaTime = (time - lastFrameTimeRef.current) / 1000 // Convert to seconds
      lastFrameTimeRef.current = time
      
      // Update physics
      physicsRef.current = updatePhysics(
        physicsRef.current,
        keyboardInput,
        deltaTime
      )
      
      // Update camera to follow spaceship
      const camera = editor.getCamera()
      const bounds = editor.getViewportScreenBounds()
      const newCamera = calculateCameraTarget(
        camera,
        physicsRef.current.position,
        { width: bounds.width, height: bounds.height },
        deltaTime
      )
      
      editor.setCamera(newCamera, { animation: { duration: 0 } })
      
      // Update cursor overlay (convert world position to screen position)
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
  }, [enabled, editor, keyboardInput])
  
  return cursorState
}
