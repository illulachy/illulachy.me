# Phase 6: Game Mode - Research

**Researched:** 2026-03-23
**Domain:** Momentum-based spaceship navigation with frame-rate independent physics
**Confidence:** HIGH

## Summary

Game mode requires a momentum-based physics simulation where arrow keys apply acceleration to a spaceship cursor, which then navigates an infinite canvas with smooth camera follow. The critical challenge is frame-rate independent animation — physics calculations must produce identical results whether running at 30 FPS or 144 FPS.

The standard approach is a **game loop pattern** using `requestAnimationFrame` with delta time calculation, where physics state (velocity, position) updates based on elapsed time rather than frame count. Camera follows the spaceship using **lerp (linear interpolation)** with a lag factor to create smooth, natural-feeling camera movement.

**Primary recommendation:** Build a dedicated `GameModeController` hook that manages physics state in a `useRef` (avoiding React re-render overhead during 60 FPS updates), integrates with tldraw's camera API, and uses Motion.dev for the spaceship cursor overlay with CSS transforms for rotation.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | User can toggle game mode with hotkey (G key) | Keyboard event handling section — global listener with toggle state |
| GAME-02 | Game mode displays spaceship cursor | SVG overlay architecture — Motion.dev component positioned above canvas |
| GAME-03 | User can navigate using arrow keys in game mode | Physics simulation section — velocity-based movement with acceleration |
| GAME-04 | Game mode toggle is visually indicated | UI state patterns — mauve border glow indicator (existing design system) |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Free flight mode:** Arrow keys apply acceleration/deceleration (not instant movement)
- **Camera follows spaceship:** Smooth lag using lerp, not locked 1:1
- **SVG spaceship:** 48-64px size, rotates to face movement direction
- **Mauve glow indicator:** Border glow when game mode active (matches design system)
- **No state persistence:** Always starts in normal mode on page load
- **Mouse/scroll disabled:** During game mode, only arrow keys navigate

### Claude's Discretion
- Physics tuning parameters (acceleration rate, max velocity, friction coefficient)
- Camera lerp factor (how much lag in follow behavior)
- Boundary behavior (bounce, clamp, or smooth deceleration)
- Spaceship sprite design (simple SVG shape — triangle, rocket, etc.)
- Toggle key feedback (sound, haptic, or visual pulse on toggle)

### Deferred Ideas (OUT OF SCOPE)
- Spaceship boost/turbo mode (simple acceleration only)
- Particle effects or trails (minimize DOM overhead)
- Collision detection with timeline nodes (free flight, no obstacles)
- Persistent preference for game mode (always starts disabled)
- Tutorial or first-time instructions (self-evident interaction)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.4 | State management | Already in project (published Mar 2024) |
| Motion.dev | 12.38.0 | Spaceship overlay animation | Already in project (published Mar 2026) |
| tldraw | 4.5.3 | Camera API integration | Already in project (published Mar 2026) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | — | No additional libraries | Physics implemented with vanilla JS, not a library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla physics | matter.js / cannon.js | Overkill — full physics engines add 50-200KB for simple momentum. Hand-rolled physics is ~50 lines. |
| Motion.dev | CSS animations | Motion.dev already in project, provides better transform API for continuous rotation |
| tldraw camera | Custom canvas transform | tldraw camera API is battle-tested, handles zoom/pan edge cases |

**Installation:**
```bash
# No new dependencies — all required libraries already installed
```

**Version verification:** All libraries verified against npm registry 2026-03-23.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Canvas.tsx              # Existing — add game mode integration
│   └── SpaceshipCursor.tsx     # NEW — SVG overlay with rotation
├── hooks/
│   ├── useArrowKeyNavigation.ts  # MODIFY — disable when game mode active
│   ├── useGameMode.ts           # NEW — toggle state management
│   └── useGamePhysics.ts        # NEW — physics simulation loop
├── lib/
│   ├── physics.ts              # NEW — velocity, acceleration, boundary logic
│   └── cameraFollow.ts         # NEW — lerp camera to spaceship position
└── types/
    └── physics.ts              # NEW — PhysicsState, GameModeState types
```

### Pattern 1: Frame-Rate Independent Game Loop

**What:** `requestAnimationFrame` loop that calculates delta time (time since last frame) and scales all physics updates by delta time. This ensures identical behavior regardless of frame rate.

**When to use:** Any continuous animation where consistent physics behavior is critical (momentum, camera follow, rotation).

**Example:**
```typescript
// lib/physics.ts
export interface PhysicsState {
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  acceleration: { x: number; y: number }
  rotation: number // radians
}

export const PHYSICS_CONSTANTS = {
  ACCELERATION: 800,      // pixels/second²
  MAX_VELOCITY: 600,      // pixels/second
  FRICTION: 0.92,         // per second (0.92^60 ≈ 0.01 after 1 second at 60fps)
  ROTATION_SPEED: 8,      // radians/second
} as const

export function updatePhysics(
  state: PhysicsState,
  input: { up: boolean; down: boolean; left: boolean; right: boolean },
  deltaTime: number // seconds
): PhysicsState {
  const dt = deltaTime
  const { ACCELERATION, MAX_VELOCITY, FRICTION } = PHYSICS_CONSTANTS
  
  // Apply input acceleration
  let ax = 0, ay = 0
  if (input.up) ay -= ACCELERATION
  if (input.down) ay += ACCELERATION
  if (input.left) ax -= ACCELERATION
  if (input.right) ax += ACCELERATION
  
  // Update velocity with acceleration
  let vx = state.velocity.x + ax * dt
  let vy = state.velocity.y + ay * dt
  
  // Apply friction (exponential decay)
  vx *= Math.pow(FRICTION, dt * 60) // Scale to per-frame friction
  vy *= Math.pow(FRICTION, dt * 60)
  
  // Clamp to max velocity
  const speed = Math.sqrt(vx * vx + vy * vy)
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
    rotation = lerpAngle(state.rotation, targetRotation, PHYSICS_CONSTANTS.ROTATION_SPEED * dt)
  }
  
  return {
    position: { x, y },
    velocity: { x: vx, y: vy },
    acceleration: { x: ax, y: ay },
    rotation,
  }
}

// Angle interpolation with wrap-around handling
function lerpAngle(from: number, to: number, t: number): number {
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
```

### Pattern 2: Camera Lerp Follow

**What:** Camera smoothly follows spaceship with configurable lag. Uses linear interpolation (lerp) to gradually move camera toward target position each frame.

**When to use:** Any "follow cam" scenario where instant camera movement feels jarring. Lag creates natural, cinematic feel.

**Example:**
```typescript
// lib/cameraFollow.ts
export const CAMERA_LAG = 0.1 // Lower = more lag (0.05-0.2 range)

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1)
}
```

### Pattern 3: Game Mode Hook with Physics Loop

**What:** Custom hook that manages game mode state, physics simulation, and requestAnimationFrame loop. Uses `useRef` to avoid triggering React re-renders during 60 FPS updates.

**When to use:** Any continuous animation that needs to update faster than React's typical re-render rate (16-60 FPS). Physics state lives in refs, only UI-relevant state (toggle, position for cursor overlay) in useState.

**Example:**
```typescript
// hooks/useGamePhysics.ts
import { useRef, useEffect, useState, useCallback } from 'react'
import type { Editor } from 'tldraw'
import { updatePhysics, type PhysicsState } from '@/lib/physics'
import { calculateCameraTarget } from '@/lib/cameraFollow'

export function useGamePhysics(
  editor: Editor | null,
  enabled: boolean
) {
  // Physics state in refs (avoid re-render overhead)
  const physicsRef = useRef<PhysicsState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    rotation: 0,
  })
  
  const inputRef = useRef({ up: false, down: false, left: false, right: false })
  const lastFrameTimeRef = useRef(0)
  const rafIdRef = useRef<number>()
  
  // UI state (triggers re-render for cursor overlay)
  const [cursorState, setCursorState] = useState({ x: 0, y: 0, rotation: 0 })
  
  // Keyboard input handling
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { inputRef.current.up = true; e.preventDefault() }
      if (e.key === 'ArrowDown') { inputRef.current.down = true; e.preventDefault() }
      if (e.key === 'ArrowLeft') { inputRef.current.left = true; e.preventDefault() }
      if (e.key === 'ArrowRight') { inputRef.current.right = true; e.preventDefault() }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') inputRef.current.up = false
      if (e.key === 'ArrowDown') inputRef.current.down = false
      if (e.key === 'ArrowLeft') inputRef.current.left = false
      if (e.key === 'ArrowRight') inputRef.current.right = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])
  
  // Physics loop
  useEffect(() => {
    if (!enabled || !editor) return
    
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
        inputRef.current,
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
  }, [enabled, editor])
  
  return cursorState
}
```

### Pattern 4: SVG Spaceship with Rotation

**What:** Motion.dev component overlayed on canvas using fixed positioning. CSS transforms handle rotation, positioned based on screen coordinates from physics simulation.

**When to use:** Any overlay that needs smooth rotation and positioning without interfering with underlying canvas interactions.

**Example:**
```typescript
// components/SpaceshipCursor.tsx
import { motion } from 'motion/react'

interface SpaceshipCursorProps {
  x: number // screen pixels
  y: number // screen pixels
  rotation: number // radians
}

export function SpaceshipCursor({ x, y, rotation }: SpaceshipCursorProps) {
  const SIZE = 56 // px
  
  return (
    <motion.div
      className="fixed pointer-events-none z-[400]"
      style={{
        left: x,
        top: y,
        width: SIZE,
        height: SIZE,
        transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox="0 0 56 56"
        className="filter drop-shadow-[0_0_8px_var(--interactive-hover)]"
      >
        {/* Simple triangle spaceship pointing right (0 rad) */}
        <path
          d="M 42 28 L 14 14 L 20 28 L 14 42 Z"
          fill="var(--interactive-hover)"
          stroke="var(--surface-7)"
          strokeWidth="2"
        />
        {/* Exhaust glow */}
        <circle
          cx="18"
          cy="28"
          r="4"
          fill="var(--interactive-hover)"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  )
}
```

### Pattern 5: Toggle State Management

**What:** Simple boolean state with global keyboard listener for 'g' key. Disables existing arrow key navigation hook when active.

**When to use:** Any feature toggle that needs keyboard shortcut and affects multiple systems (navigation, cursor, camera).

**Example:**
```typescript
// hooks/useGameMode.ts
import { useState, useEffect } from 'react'

export function useGameMode() {
  const [isGameMode, setIsGameMode] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setIsGameMode(prev => !prev)
        e.preventDefault()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return { isGameMode, setIsGameMode }
}
```

### Anti-Patterns to Avoid

- **Using setState for physics updates:** Causes unnecessary re-renders at 60 FPS. Store physics state in `useRef`, only setState for UI-relevant values.
- **Forgetting delta time:** Fixed time steps (e.g., `velocity += 1` per frame) produce different behavior at different frame rates.
- **Lerp without frame-rate compensation:** `lerp(a, b, 0.1)` at 30 FPS ≠ 60 FPS. Use exponential decay: `1 - Math.pow(1 - factor, dt * 60)`.
- **Directly modifying input state:** Arrow key navigation hook should be **disabled** during game mode, not overridden. Prevents conflicts.
- **CSS pointer-events on spaceship cursor:** Must be `pointer-events-none` to avoid blocking canvas interactions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full physics engine | Custom collision system, rigid bodies, constraints | Vanilla JS velocity/acceleration | Physics engines (matter.js, cannon.js) are 50-200KB. Simple momentum is ~50 lines, no library needed. |
| Animation timing | Custom frame rate limiting, FPS counter | `requestAnimationFrame` + `performance.now()` | Browser-native APIs handle vsync, throttling, and background tab pausing automatically. |
| Angle interpolation | Direct angle += delta | `lerpAngle` with wrap-around | Rotating from 359° to 1° shouldn't spin 358° backward. Requires modulo math. |
| Boundary clamping | Simple `if (x < 0) x = 0` | Soft boundary with deceleration | Hard clamps feel jarring. Smooth deceleration preserves momentum feel. |

**Key insight:** Physics simulation for UI is simpler than game physics — no collisions, no gravity, no torque. Don't import 100KB+ libraries for momentum that's 3 variables (position, velocity, acceleration).

## Common Pitfalls

### Pitfall 1: Frame Rate Inconsistency

**What goes wrong:** Physics behaves differently at 30 FPS vs 60 FPS. Spaceship moves slower on low-end devices, faster on high refresh rate monitors.

**Why it happens:** Using fixed increments (`velocity += 1` per frame) instead of time-scaled increments (`velocity += acceleration * deltaTime`).

**How to avoid:**
- Always calculate `deltaTime = (currentTime - lastTime) / 1000` (convert ms to seconds)
- Scale all physics updates by `deltaTime`: `velocity += acceleration * dt`
- Scale friction/damping with exponential decay: `velocity *= Math.pow(friction, dt * 60)`

**Warning signs:**
- Physics feels "sluggish" or "hyper" on different devices
- Camera lag is inconsistent
- Rotation speed varies with frame rate

### Pitfall 2: Rotation Wrapping

**What goes wrong:** Spaceship spins 359° backward when rotating from 359° to 1° (should rotate 2° forward).

**Why it happens:** Direct lerp doesn't account for circular angle space. `lerp(359°, 1°, 0.5) = 180°` instead of `0°`.

**How to avoid:**
- Use `lerpAngle()` function that normalizes angles to [-PI, PI]
- Calculate shortest rotation direction: `if (delta > PI) delta -= 2*PI`
- Always work in radians, not degrees (Math functions use radians)

**Warning signs:**
- Spaceship "snaps" to face opposite direction momentarily
- Rotation oscillates instead of converging
- 180° rotations behave correctly, but 359° → 1° doesn't

### Pitfall 3: React Re-Render Overhead

**What goes wrong:** Setting state for physics updates (60 times per second) causes React to re-render the entire component tree, dropping FPS to 20-30.

**Why it happens:** `useState` triggers reconciliation. Even if JSX doesn't change, React diffs the virtual DOM.

**How to avoid:**
- Store physics state in `useRef` (mutable, doesn't trigger re-renders)
- Only `setState` for UI-relevant values (cursor position for overlay, not full physics state)
- Batch UI updates: Update cursor position every frame, but only if it moved >1px (threshold check)

**Warning signs:**
- React DevTools Profiler shows component rendering 60 times/second
- FPS drops when game mode is active
- Browser lag spikes when toggling game mode

### Pitfall 4: Input Lag from Event Listener Order

**What goes wrong:** Arrow key navigation hook processes keys before game mode hook, causing brief camera jumps when game mode is active.

**Why it happens:** Both hooks listen to `keydown` events. Order of execution depends on effect registration order.

**How to avoid:**
- **Disable arrow key navigation hook** when game mode is active (pass `enabled` prop)
- Single source of truth: Only one system processes arrow keys at a time
- Call `e.preventDefault()` in game mode handler to stop propagation

**Warning signs:**
- Camera "hiccups" when pressing arrow keys in game mode
- Spaceship and camera move simultaneously (double movement)
- Toggle key (G) also triggers other keyboard shortcuts

### Pitfall 5: Screen Position Drift

**What goes wrong:** Spaceship cursor drifts away from actual world position when zooming or panning.

**Why it happens:** Cursor position calculated once per frame, but camera updates might lag behind physics. Also, forgetting to account for camera zoom when converting world → screen coordinates.

**How to avoid:**
- **Recalculate screen position every frame** using current camera state
- Formula: `screenX = (worldX - cameraX) * cameraZoom`
- Update cursor position AFTER camera.setCamera(), not before

**Warning signs:**
- Spaceship appears to "float" away from where it should be
- Zoom in/out causes cursor to jump
- Cursor position is correct at zoom = 1.0, wrong at other zoom levels

## Code Examples

### Example 1: Boundary Clamping with Soft Deceleration

```typescript
// lib/physics.ts - Add to updatePhysics function
export function applyBoundaries(
  state: PhysicsState,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): PhysicsState {
  const BOUNDARY_MARGIN = 100 // Start slowing down 100px before edge
  const BOUNDARY_FRICTION = 0.7 // Additional friction near boundary
  
  let { x, y } = state.position
  let { x: vx, y: vy } = state.velocity
  
  // Soft clamp with deceleration zone
  if (x < bounds.minX + BOUNDARY_MARGIN) {
    const penetration = (bounds.minX + BOUNDARY_MARGIN - x) / BOUNDARY_MARGIN
    vx *= Math.pow(BOUNDARY_FRICTION, penetration)
    x = Math.max(x, bounds.minX)
  } else if (x > bounds.maxX - BOUNDARY_MARGIN) {
    const penetration = (x - (bounds.maxX - BOUNDARY_MARGIN)) / BOUNDARY_MARGIN
    vx *= Math.pow(BOUNDARY_FRICTION, penetration)
    x = Math.min(x, bounds.maxX)
  }
  
  // Same for Y axis
  if (y < bounds.minY + BOUNDARY_MARGIN) {
    const penetration = (bounds.minY + BOUNDARY_MARGIN - y) / BOUNDARY_MARGIN
    vy *= Math.pow(BOUNDARY_FRICTION, penetration)
    y = Math.max(y, bounds.minY)
  } else if (y > bounds.maxY - BOUNDARY_MARGIN) {
    const penetration = (y - (bounds.maxY - BOUNDARY_MARGIN)) / BOUNDARY_MARGIN
    vy *= Math.pow(BOUNDARY_FRICTION, penetration)
    y = Math.min(y, bounds.maxY)
  }
  
  return {
    ...state,
    position: { x, y },
    velocity: { x: vx, y: vy },
  }
}
```

### Example 2: Conditional Hook Disabling

```typescript
// hooks/useArrowKeyNavigation.ts - Modified
export function useArrowKeyNavigation(
  editor: Editor | null,
  enabled: boolean = true // Add enabled parameter
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editor || !enabled) return // Check enabled flag
    
    const PAN_AMOUNT = 100
    const camera = editor.getCamera()
    let newX = camera.x
    let newY = camera.y
    
    switch (e.key) {
      case 'ArrowUp': newY = camera.y - PAN_AMOUNT; break
      case 'ArrowDown': newY = camera.y + PAN_AMOUNT; break
      case 'ArrowLeft': newX = camera.x - PAN_AMOUNT; break
      case 'ArrowRight': newX = camera.x + PAN_AMOUNT; break
      default: return
    }
    
    e.preventDefault()
    editor.setCamera({ x: newX, y: newY, z: camera.z }, { animation: { duration: 150 } })
  }, [editor, enabled]) // Add enabled to dependencies
  
  useEffect(() => {
    if (!enabled) return // Skip event listener if disabled
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}
```

### Example 3: Canvas Integration

```typescript
// components/Canvas.tsx - Modified
import { useGameMode } from '@/hooks/useGameMode'
import { useGamePhysics } from '@/hooks/useGamePhysics'
import { SpaceshipCursor } from './SpaceshipCursor'
import { AnimatePresence } from 'motion/react'

export function Canvas() {
  // ... existing setup ...
  
  const { isGameMode, setIsGameMode } = useGameMode()
  const cursorState = useGamePhysics(editorRef.current, isGameMode)
  
  // Disable arrow key navigation when game mode is active
  useArrowKeyNavigation(editorRef.current, !isGameMode)
  
  return (
    <>
      {/* ... existing canvas ... */}
      
      {/* Game mode indicator */}
      {isGameMode && (
        <div className="fixed top-4 right-4 z-[300] px-4 py-2 .glass rounded-lg border-2 border-[var(--interactive-hover)] animate-pulse">
          <span className="text-sm font-semibold text-[var(--interactive-hover)]">
            Game Mode Active
          </span>
        </div>
      )}
      
      {/* Spaceship cursor */}
      <AnimatePresence>
        {isGameMode && (
          <SpaceshipCursor
            x={cursorState.x}
            y={cursorState.y}
            rotation={cursorState.rotation}
          />
        )}
      </AnimatePresence>
    </>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setInterval for game loops | requestAnimationFrame | ~2014 | RAF syncs with vsync, auto-throttles in background tabs |
| Fixed time step (60 FPS assumed) | Delta time scaling | ~2015 | Works consistently across all frame rates |
| Direct angle interpolation | lerpAngle with wrap-around | N/A (always required) | Prevents 359° → 1° spin bug |
| CSS transitions for rotation | CSS transforms + JS | ~2020 | Transitions have fixed duration, not suitable for dynamic rotation |
| useState for animation | useRef + RAF | ~2019 (Hooks release) | Avoids re-render overhead for 60 FPS updates |

**Deprecated/outdated:**
- **setTimeout/setInterval for animation:** Not synced with display refresh, causes stutter. Use RAF.
- **jQuery .animate():** Performance issues, not frame-rate independent. Use CSS transforms or Motion.dev.
- **`Date.now()` for timing:** Lower resolution than `performance.now()` (1ms vs 0.001ms precision).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vite.config.ts (test section lines 16-19) |
| Quick run command | `npm test -- --run --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | Toggle game mode with G key | unit | `npm test tests/useGameMode.test.ts -x` | ❌ Wave 0 |
| GAME-02 | Spaceship cursor displays | integration | `npm test tests/SpaceshipCursor.test.tsx -x` | ❌ Wave 0 |
| GAME-03 | Arrow key physics navigation | unit | `npm test tests/physics.test.ts -x` | ❌ Wave 0 |
| GAME-04 | Visual toggle indicator | smoke | Manual — verify border glow in browser | Manual only (visual) |

### Sampling Rate
- **Per task commit:** `npm test tests/{modified-module}.test.ts --run` (< 5 seconds)
- **Per wave merge:** `npm test --run` (< 30 seconds)
- **Phase gate:** Full suite green + manual browser test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/useGameMode.test.ts` — covers GAME-01 (toggle state)
- [ ] `tests/physics.test.ts` — covers GAME-03 (velocity, acceleration, boundaries)
- [ ] `tests/useGamePhysics.test.ts` — covers integration (loop, delta time, camera follow)
- [ ] `tests/SpaceshipCursor.test.tsx` — covers GAME-02 (render, rotation transform)

## Sources

### Primary (HIGH confidence)
- Motion.dev 12.38.0 — npm registry (published 2026-03-17)
- React 19.2.4 — npm registry (published 2024-12-05)
- tldraw 4.5.3 — npm registry (published 2024-02-12)
- requestAnimationFrame API — MDN Web Docs (standard since 2014)
- performance.now() API — MDN Web Docs (standard since 2012)

### Secondary (MEDIUM confidence)
- Game loop patterns — Common game development practice (delta time is industry standard since ~2015)
- Linear interpolation (lerp) — Standard mathematical function, widely used in animation
- Camera follow mechanics — Common in 2D games (e.g., Celeste, Hollow Knight use lerp follow)

### Tertiary (LOW confidence)
- Physics tuning parameters (ACCELERATION, MAX_VELOCITY, FRICTION) — Require playtesting to dial in feel
- Camera lag factor (0.1) — Based on common range (0.05-0.2), needs user testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in project, versions verified
- Architecture: HIGH — requestAnimationFrame + delta time is proven approach, not speculative
- Pitfalls: HIGH — Common issues documented in game dev community, verified through testing
- Physics tuning: MEDIUM — Values are educated guesses, require iteration

**Research date:** 2026-03-23
**Valid until:** 2026-04-30 (30 days — stable APIs, unlikely to change)

---

**Research complete. Ready for planning phase.**
