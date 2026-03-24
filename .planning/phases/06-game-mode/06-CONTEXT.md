# Phase 6 Context: Game Mode

**Phase Goal:** User can toggle spaceship navigation mode with arrow keys  
**Depends on:** Phase 4 (needs node positions for spatial navigation context)  
**Context Gathered:** 2026-03-23

---

## Implementation Decisions

### 1. Navigation Mechanics

**Core Behavior:**
- **Free flight mode:** Arrow keys move spaceship cursor around canvas freely
- **Camera follows cursor:** Camera tracks spaceship with smooth lag (cursor can move within viewport, camera catches up)
- **Momentum-based movement:** Spaceship accelerates/decelerates for a flying feel (not instant snapping)
- **No node interaction in game mode:** Spaceship is purely for navigation/exploration
  - Must exit game mode to click nodes (keeps modes cleanly separated)
  - Mouse clicks while in game mode do nothing

**Arrow Key Behavior:**
- **Up arrow:** Accelerate spaceship upward
- **Down arrow:** Accelerate spaceship downward  
- **Left arrow:** Accelerate spaceship left
- **Right arrow:** Accelerate spaceship right
- **Momentum physics:** Velocity builds up with held keys, decays when released
- **Multi-directional:** Diagonal movement when multiple keys pressed (e.g., up + right)

**Camera Following Logic:**
- **Smooth lag tracking:** Camera lerps toward spaceship position (not instant centering)
- **Viewport cushion:** Spaceship can move ~20-30% from center before camera starts catching up
- **Smooth camera motion:** Camera movement should feel natural, not jarring

**Boundary Behavior:**
- **Spaceship respects canvas boundaries:** Cannot fly into fog/void areas
- **Hard stops at edges:** Velocity zeroes out when hitting boundary
- **Rationale:** Keeps spaceship within explorable timeline area, prevents getting lost

**Mouse Interaction During Game Mode:**
- **Mouse/scroll disabled:** Drag-to-pan and scroll-to-zoom are disabled when game mode active
- **Game mode takes precedence:** Only arrow keys control navigation
- **Exit game mode to use mouse:** User must press G to toggle off before mouse works again
- **Rationale:** Clear mode separation, prevents confusing hybrid interactions

---

### 2. Spaceship Visual Design

**Style:**
- **SVG illustration:** Clean vector spaceship with modern styling (matches design system aesthetic)
- **Size:** 48-64px (medium size — clearly visible without dominating view)
- **Color scheme:** Mauve accent (#E0AFFF) to match design system
- **Minimal design:** Clean spaceship shape, no embellishments (no thrusters, trails, glows, or particles)

**Rotation Behavior:**
- **Rotates to face direction of movement:** Spaceship points where it's flying
- **Smooth rotation transition:** Rotation interpolates smoothly (not instant snapping)
- **Rationale:** Provides spatial feedback, makes movement feel intentional and directional

**Visual Simplicity:**
- No exhaust trails or particle effects
- No idle animations (bobbing, glowing, etc.)
- No aura or glow effects
- Pure geometric spaceship form (triangle/arrow-like shape)
- Matches high-end editorial aesthetic (not toy-like or game-y)

**Rendering:**
- **SVG element positioned absolutely:** Renders above canvas but below UI chrome
- **CSS transforms for rotation:** `transform: rotate(${angle}deg)` based on velocity direction
- **Smooth transitions:** Use requestAnimationFrame for position/rotation updates

---

### 3. Mode Toggle & State

**Hotkey:**
- **G key only:** Single dedicated hotkey to toggle game mode on/off
- **No modifier keys:** Plain G press (not Shift+G, Ctrl+G, etc.)
- **Rationale:** Simple, memorable, specified in requirements (GAME-01)

**Visual Indicator:**
- **Border/frame glow:** Canvas edge glows mauve (#E0AFFF) when game mode active
- **Glow implementation:** Subtle box-shadow or border on canvas container
- **Intensity:** Low-opacity glow (10-15% opacity), not distracting
- **No text labels:** Spaceship presence + border glow is sufficient indicator

**Transition Effects:**
- **Quick fade transition:** Spaceship fades in/out over 200-300ms when toggling
- **Border glow fades:** Canvas glow fades in/out with same timing
- **Smooth animation:** Use CSS transitions or Motion.dev (if already integrated in Phase 5)
- **Rationale:** Polished feel without being overly playful or distracting

**State Persistence:**
- **NO persistence:** Game mode always starts OFF when page loads
- **Session-only state:** Game mode is a temporary exploration tool
- **Rationale:** Normal mode is default experience; game mode is a playful extra

**Initial Spaceship Position:**
- **Center of viewport:** Spaceship spawns at screen center when game mode activates
- **World coordinates:** Calculate center based on current camera position
- **Rationale:** Predictable spawn location, immediately visible to user

---

### 4. Interaction with Existing Systems

**Arrow Key Navigation (Phase 1):**
- **Disable existing arrow key panning:** When game mode active, `useArrowKeyNavigation` hook should be bypassed
- **Re-enable on exit:** Arrow keys return to normal 100px pan behavior when game mode off
- **Implementation:** Conditional hook execution or early return based on game mode state

**Camera State Persistence (Phase 1):**
- **Camera position still persists:** localStorage camera state continues to save
- **Game mode doesn't interfere:** Spaceship flight updates camera, which gets persisted normally
- **Rationale:** User can explore via spaceship and return to that position later

**Canvas Controls (Phase 5):**
- **Controls remain visible:** Zoom/reset buttons still available (user can still use them)
- **OR disable controls in game mode:** If UI becomes confusing, hide controls when game mode active
- **Defer to planning:** Research phase will determine cleanest approach

**Timeline Nodes:**
- **Nodes remain clickable when game mode OFF:** Normal click behavior unaffected
- **Nodes NOT clickable when game mode ON:** Spaceship is decoration, no interaction
- **Visual feedback:** Nodes may visually indicate they're non-interactive in game mode (optional polish)

---

### 5. Implementation Approach

**State Management:**
- **React state:** Simple `const [isGameMode, setIsGameMode] = useState(false)` in Canvas.tsx
- **No global state needed:** Game mode is canvas-only concern
- **Keyboard handler:** Window-level keydown listener for G key toggle

**Spaceship Component:**
- **Separate component:** `<Spaceship />` component renders when game mode active
- **Physics hook:** `useSpaceshipPhysics(isGameMode)` handles velocity, position, boundaries
- **Camera integration:** Updates tldraw camera via editor.setCamera() with smooth lerp

**Code Organization:**
- **New files:**
  - `src/components/Spaceship.tsx` — SVG spaceship with rotation
  - `src/hooks/useGameMode.ts` — Toggle state + G key listener
  - `src/hooks/useSpaceshipPhysics.ts` — Momentum-based movement logic
  - `src/lib/spaceshipUtils.ts` — Boundary checks, lerp functions
- **Modified files:**
  - `src/components/Canvas.tsx` — Integrate game mode state, render spaceship conditionally
  - `src/hooks/useArrowKeyNavigation.ts` — Add game mode check to disable normal panning

---

## Code Context

### Existing Assets

**Arrow Key Navigation (Phase 1):**
- **Location:** `src/hooks/useArrowKeyNavigation.ts`
- **Current behavior:** Arrow keys pan camera by 100px with 150ms animation
- **Integration point:** Add conditional to check game mode state before panning

**Camera System:**
- **Hook:** `useCameraState` (persists camera to localStorage)
- **Utilities:** `src/lib/cameraUtils.ts` — `getViewportDimensions()`, `calculateInitialZoom()`
- **tldraw API:** `editor.getCamera()`, `editor.setCamera({ x, y, z }, { animation })`

**Timeline Nodes:**
- **Positioned nodes:** `positionTimelineNodes()` returns `PositionedNode[]` with x, y coordinates
- **11 nodes total:** Chronologically positioned from 2020-2024
- **Node dimensions:** All nodes are 280x200px (from Phase 3)

**Design System:**
- **Mauve accent:** `#E0AFFF` (--interactive-default)
- **Motion tokens:** `--duration-moderate` (200-300ms), `--ease-out`
- **Glassmorphism:** `--glass-bg`, `--glass-border`, `--glass-shadow`

### Integration Points

**Phase 1 Dependencies:**
- Arrow key navigation must be disabled when game mode active
- Camera system continues to work (spaceship updates camera position)
- Canvas boundaries already defined (fog overlay at edges)

**Phase 4 Dependencies:**
- Timeline node positions provide spatial context for exploration
- Constellation layout makes spaceship navigation more interesting (weaving between nodes)

**Phase 5 Dependencies (if complete):**
- Motion.dev animations for spaceship fade in/out
- Tailwind CSS for border glow styling
- Responsive layout ensures spaceship works on mobile (if applicable)

**Canvas Boundaries:**
- **Phase 1 established:** Fog overlay at canvas edges (`CanvasFogOverlay.tsx`)
- **Need boundary values:** Extract min/max X and Y from timeline layout or set generous defaults
- **Implementation:** Check spaceship position against boundaries, clamp velocity to zero at edges

---

## Requirements Coverage

Phase 6 delivers these requirements from REQUIREMENTS.md:

- **GAME-01:** User can toggle game mode with hotkey (G key) ✓
- **GAME-02:** Game mode displays spaceship cursor ✓
- **GAME-03:** User can navigate between nodes using arrow keys ✓
  - Clarified: Free flight navigation (not discrete jumps), momentum-based
- **GAME-04:** Game mode toggle is visually indicated ✓
  - Canvas border glows mauve when active

**Success Criteria (from ROADMAP.md):**
1. ✓ User can press G key to toggle game mode on/off
2. ✓ Game mode displays spaceship cursor (SVG, 48-64px, rotates to face movement)
3. ✓ User can navigate using arrow keys (free flight with momentum, camera follows)
4. ✓ Visual indicator shows game mode active (mauve border glow)

---

## Open Questions for Research Phase

**Technical Investigations Needed:**

1. **Physics Simulation:**
   - How to implement smooth acceleration/deceleration? (Velocity vector, friction coefficient)
   - Optimal acceleration rate? (px/s², tuned for responsive but not twitchy)
   - Decay rate when no keys pressed? (Exponential decay vs linear?)
   - Multi-key handling? (Combine velocities for diagonal movement)

2. **Camera Following:**
   - Lerp formula for smooth camera lag? (lerp factor, frame-rate independent)
   - Viewport cushion calculation? (When does camera start moving?)
   - Camera easing function? (Linear lerp vs ease-out for natural feel)

3. **Boundary Detection:**
   - How to determine canvas boundaries? (Extract from timeline layout or hardcode?)
   - Boundary margin? (Stop exactly at edge or leave small buffer?)
   - Bounce-back effect needed? (Spaceship rebounds slightly when hitting wall?)

4. **SVG Spaceship:**
   - Spaceship shape design? (Triangle, rocket, abstract?)
   - Rotation calculation? (`Math.atan2(vy, vx)` for angle from velocity vector)
   - SVG viewBox and dimensions? (48x48 or 64x64 canvas)

5. **Performance:**
   - RequestAnimationFrame loop for physics updates? (60fps target)
   - Throttle camera updates? (Update every frame or every N frames?)
   - Mobile performance considerations? (Is game mode supported on touch devices?)

6. **Keyboard Conflicts:**
   - Does tldraw intercept G key? (Need to prevent default or stop propagation?)
   - Arrow key conflicts with tldraw? (Already handled in useArrowKeyNavigation)

**Research Should Produce:**
- Physics implementation pattern (code example or library recommendation)
- Camera lerp formula with frame-rate independence
- SVG spaceship design mockup or code snippet
- Boundary detection logic (reusable utility function)
- Performance testing approach (ensure 60 FPS maintained)

---

## Deferred Decisions (Out of Scope for Phase 6)

- **Mobile/touch game mode:** Deferred to v2 (how would arrow keys work on touch devices? Virtual D-pad?)
- **Spaceship trails/effects:** Decided against for v1 (minimal design)
- **Node proximity indicators:** Not discussed (spaceship could highlight nearby nodes — defer to Phase 6 planning)
- **Advanced physics:** Inertia dampening, acceleration curves — defer to implementation tuning
- **Accessibility:** Keyboard-only navigation mode already covered by existing arrow keys (game mode is optional enhancement)
- **Spaceship customization:** Different ship styles, colors — potential v2 feature
- **Sound effects:** Spaceship sounds not discussed (likely out of scope for portfolio site)

---

## Success Indicators

**User can:**
- ✅ Press G key and see spaceship appear with mauve border glow
- ✅ Use arrow keys to fly spaceship smoothly around canvas
- ✅ Watch camera follow spaceship with natural lag
- ✅ Explore timeline nodes spatially (weave between constellation)
- ✅ Press G again to exit game mode and return to normal navigation
- ✅ Mouse/scroll work normally when game mode is off

**Developer can:**
- ✅ Tune physics parameters (acceleration, decay, lerp factor) easily
- ✅ Test game mode in isolation (toggle on/off via G key)
- ✅ Verify boundary detection (spaceship stops at edges)
- ✅ Measure 60 FPS during game mode navigation
- ✅ Extend spaceship with effects later if desired (clean architecture)

---

**Context complete. Ready for research and planning phases.**
