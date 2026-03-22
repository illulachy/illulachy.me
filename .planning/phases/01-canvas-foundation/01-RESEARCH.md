# Phase 1: Canvas Foundation - Research

**Researched:** 2026-03-22
**Domain:** Infinite canvas implementation with tldraw 4.5 + React 19 + Vite 8
**Confidence:** MEDIUM-HIGH (verified package versions, architecture patterns from training data, some gaps in tldraw 4.5 specifics)

## Summary

Phase 1 establishes a production-ready infinite canvas using **tldraw 4.5**, the industry-standard infinite canvas SDK for React. The canvas must support smooth pan/zoom at 60 FPS, persist camera position via localStorage, and display glassmorphism controls with contextual visibility.

**Primary recommendation:** Use tldraw's `<Tldraw />` component with custom configuration to disable shape tools (read-only canvas), implement camera control via the Editor API, and leverage React 19's concurrent features for skeleton loading. Build setup uses Vite 8 with TypeScript 5.9 for optimal dev experience and fast HMR.

**Key Insight:** tldraw 4.5 provides battle-tested pan/zoom/touch support out-of-the-box. Don't hand-roll camera math, gesture detection, or performance optimization — the SDK handles these. Focus implementation on configuration (disable default UI/tools), camera state persistence, and custom loading/control UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Initial View & Orientation:**
- Desktop: Canvas centered on portfolio hub (16:9 node fills ~40% of viewport)
- Mobile/Portrait: Zoom out slightly compared to desktop
- Initial Zoom: Auto-calculate zoom to make hub fill 40% of viewport
- Entrance animation: Gentle fade-in (200-300ms) after loading
- Position memory: YES — persist via localStorage (zoom + pan position)
- First-time visitors: Start at hub; returning visitors: resume where they left off
- Zoom limits: 10% min (bird's eye) to 400% max (extreme close-up)
- URL parameters: NO support in Phase 1 (defer to Phase 3+)

**Canvas Control Visibility:**
- Contextual visibility: Fade in on hover/interaction, fade out after 3s inactivity
- Mobile: Controls remain visible longer (touch interactions less predictable)
- Placement: Bottom-right corner
- Actions: Zoom in, Zoom out, Reset to hub, Fit to screen
- Visual style: Glassmorphism (--glass-bg, --glass-blur, --glass-border, --glass-shadow)
- Button icons: Mauve accent on hover (--interactive-hover: #EAC7FF)

**Navigation Boundaries:**
- Dynamic boundaries: Expand as timeline content grows
- Phase 1: Set generous default boundaries (adjust in Phase 4 when timeline exists)
- Not truly infinite: Prevents getting lost in empty space
- Overpan behavior: Defer to Phase 4 (no content to overpan beyond yet)
- Beyond-content visuals: Fog overlay at edges (--canvas-fog: rgba(19, 19, 19, 0.6))
- Gradient vignette darkens toward canvas boundaries
- Reset shortcuts: Double-click background OR toolbar "Reset" button → returns to hub

**Loading & Performance Feedback:**
- Skeleton canvas: Progressive reveal with ghost shapes (blurred/dim hub placeholder)
- Display until tldraw is fully initialized and interactive
- Interactions during load: DISABLED — dim overlay prevents pan/zoom until ready
- No FPS indicator: Performance monitoring is developer concern, not user-facing
- Ready state: Silent activation (no toast/tooltip/tutorial)
- Fade transition: Skeleton fades out, canvas fades in (200-300ms)
- First-time guidance: NO onboarding or tutorials in Phase 1 (defer to Phase 5)

### Claude's Discretion

**Test infrastructure:**
- Choose test framework appropriate for React + Vite (Vitest recommended)
- Define automated commands for per-commit and per-wave validation
- Structure tests to validate 60 FPS performance (Chrome DevTools protocol)

**Camera math algorithm:**
- Implement formula to calculate zoom where hub (640x360px) fills 40% viewport
- Account for extreme aspect ratios (ultra-wide, portrait mobile)
- Handle toolbar height in calculations if needed

**Skeleton loading implementation:**
- Choose between React component or pure CSS approach
- Detect when tldraw is "ready" (event, promise, or RAF check)
- Skeleton complexity: simple hub outline or more elaborate (recommend simple)

**LocalStorage schema:**
- Define camera state structure (x, y, zoom — any other tldraw state needed?)
- Implement cache invalidation strategy (version key for schema changes)

### Deferred Ideas (OUT OF SCOPE)

- URL parameter support (needs content nodes — Phase 3+)
- Overpan behavior (needs timeline layout — Phase 4)
- First-time user guidance (UI polish — Phase 5)
- Keyboard shortcuts beyond arrow keys (Game Mode — Phase 6)
- Minimap or overview widget (potential v2 feature, not in roadmap)
- Accessibility focus states and ARIA labels (Phase 5 UI Chrome)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANVAS-01 | User can pan canvas by dragging with mouse | tldraw built-in pan via mouse drag (no custom implementation needed) |
| CANVAS-02 | User can zoom canvas using scroll wheel | tldraw built-in scroll-to-zoom (no custom implementation needed) |
| CANVAS-03 | User can pan/zoom using touch gestures on mobile | tldraw built-in touch support (pinch-to-zoom, drag-to-pan) |
| CANVAS-04 | User can navigate using arrow keys | tldraw Editor API: camera.setCamera with delta movement |
| CANVAS-05 | Canvas maintains 60 FPS during pan/zoom | tldraw optimized for 60 FPS; validate via Chrome DevTools Performance panel |
| CANVAS-06 | Canvas displays loading state while initializing | React Suspense + custom skeleton component until tldraw mounts |
| TECH-01 | Built with Vite + React 19 + TypeScript | Vite 8.0.1 + React 19.2.4 + TypeScript 5.9.3 (verified latest stable) |
| TECH-02 | Infinite canvas powered by tldraw 4.5 | tldraw 4.5.3 (verified latest, published 2026-03-18, React 19 compatible) |
| TECH-04 | Site deploys as static SPA | Vite build output generates static assets (index.html + JS/CSS bundles) |
| TECH-05 | TypeScript types defined for all content structures | Define CameraState, ContentNode, TimelineData interfaces |
</phase_requirements>

---

## Standard Stack

### Core Dependencies

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | 4.5.3 | Infinite canvas SDK | Industry-standard React canvas library, battle-tested pan/zoom/touch, extensible architecture |
| react | 19.2.4 | UI framework | Latest stable, concurrent features for loading states, tldraw peer dependency |
| react-dom | 19.2.4 | React DOM renderer | Required peer dependency for React 19 |
| vite | 8.0.1 | Build tool & dev server | Fast HMR, optimized production builds, first-class TypeScript support |
| @vitejs/plugin-react | 6.0.1 | Vite React integration | Enables React Fast Refresh, JSX transform |
| typescript | 5.9.3 | Type system | Type safety, autocomplete, refactoring support |

### Supporting Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.4 | React type definitions | TypeScript projects using React |
| @types/react-dom | 19.2.4 | React DOM type definitions | TypeScript projects using ReactDOM |
| tailwindcss | 4.2.2 | CSS utility framework | Design system implementation (per TECH-01 requirement) |
| @tldraw/editor | 4.5.3 | tldraw Editor API types | Direct access to Editor API for camera control |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tldraw | Fabric.js + Hammer.js | More boilerplate, need to implement pan/zoom/bounds/persistence manually |
| tldraw | Konva + react-konva | Lower-level (more control), but missing infinite canvas UX patterns |
| tldraw | Custom canvas implementation | Full control, but 2-3 weeks additional dev time for camera math, gesture detection, performance optimization |
| Vite | Next.js | SSR adds complexity with no benefit (canvas is client-only, no SEO value) |
| Vite | Create React App | Deprecated, slower dev experience |

**Installation:**

```bash
# Initialize Vite project with React + TypeScript
npm create vite@latest . -- --template react-ts

# Install tldraw
npm install tldraw@4.5.3

# Install Tailwind CSS v4
npm install -D tailwindcss@4.2.2

# Development is ready
npm run dev
```

**Version verification:** All versions verified against npm registry on 2026-03-22:
- tldraw 4.5.3 (published 2026-03-18) ✓
- React 19.2.4 (published 2026-03-20) ✓
- Vite 8.0.1 (published 2026-03-19) ✓
- TypeScript 5.9.3 (published 2026-03-22) ✓
- Tailwind 4.2.2 (published 2026-03-20) ✓

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── Canvas.tsx              # Main tldraw wrapper component
│   ├── CanvasControls.tsx      # Glassmorphism toolbar (zoom, reset)
│   ├── CanvasLoader.tsx        # Skeleton loading state
│   └── CanvasFogOverlay.tsx    # Boundary fog gradient
├── hooks/
│   ├── useCameraState.ts       # LocalStorage persistence for camera position
│   ├── useControlsVisibility.ts # Fade-in/fade-out logic (3s timeout)
│   └── useInitialZoom.ts       # Calculate zoom for 40% viewport hub
├── lib/
│   ├── cameraUtils.ts          # Camera math (zoom calculation, bounds)
│   ├── editorConfig.ts         # tldraw configuration (disable tools, custom options)
│   └── localStorageUtils.ts    # Camera state serialization/deserialization
├── types/
│   ├── camera.ts               # CameraState interface
│   └── content.ts              # ContentNode, TimelineData (Phase 2+)
├── App.tsx                     # Root component
├── main.tsx                    # Vite entry point
└── index.css                   # Global styles, design tokens
```

**File Responsibilities:**

- **Canvas.tsx**: Renders `<Tldraw />` with custom config, handles camera state persistence, manages loading state
- **CanvasControls.tsx**: Zoom in/out, reset to hub, fit-to-screen buttons with glassmorphism styling
- **CanvasLoader.tsx**: Skeleton component displayed until tldraw is interactive
- **CanvasFogOverlay.tsx**: CSS gradient vignette positioned at canvas boundaries
- **useCameraState.ts**: Read/write camera position + zoom to localStorage, handle version migration
- **useControlsVisibility.ts**: Show controls on hover/interaction, hide after 3s inactivity
- **useInitialZoom.ts**: Calculate zoom level to make 640x360px hub fill 40% of viewport

### Pattern 1: tldraw Initialization (Read-Only Canvas)

**What:** Configure tldraw with shape tools disabled, custom camera bounds, and Editor API access

**When to use:** Canvas should support pan/zoom but NOT shape creation/editing

**Example:**

```typescript
// src/lib/editorConfig.ts
import { TldrawOptions } from 'tldraw'

export const canvasConfig: Partial<TldrawOptions> = {
  // Disable shape creation tools (read-only canvas)
  hideUi: true, // Hides default UI (we'll build custom controls)
  
  // Disable selection of shapes (Phase 3+ will enable for timeline nodes)
  selectOnCreate: false,
  
  // Configure camera bounds (dynamic, will expand in Phase 4)
  cameraBounds: {
    x: -10000,
    y: -5000,
    w: 20000,
    h: 10000,
  },
  
  // Disable keyboard shortcuts that conflict with our navigation
  // (arrow keys will be used for camera movement, not shape movement)
  isShortcutsDisabled: false, // Keep enabled, we'll intercept specific keys
}

// Usage in Canvas component
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export function Canvas() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        options={canvasConfig}
        onMount={(editor) => {
          // Access Editor API for camera control
          // Store editor instance in ref for camera manipulation
        }}
      />
    </div>
  )
}
```

**Source:** tldraw documentation pattern (https://tldraw.dev/quick-start), configuration options inferred from tldraw v4 API surface (MEDIUM confidence — needs verification with official docs or source code inspection)

### Pattern 2: Camera Control via Editor API

**What:** Programmatic camera movement, zoom, and positioning using tldraw's Editor instance

**When to use:** Arrow key navigation, zoom in/out buttons, reset to hub functionality

**Example:**

```typescript
// src/hooks/useCameraControl.ts
import { useEditor } from 'tldraw'
import { useCallback } from 'react'

export function useCameraControl() {
  const editor = useEditor()
  
  const zoomIn = useCallback(() => {
    const currentZoom = editor.getCamera().z
    editor.setCamera({ z: Math.min(currentZoom * 1.2, 4.0) }) // Max 400%
  }, [editor])
  
  const zoomOut = useCallback(() => {
    const currentZoom = editor.getCamera().z
    editor.setCamera({ z: Math.max(currentZoom / 1.2, 0.1) }) // Min 10%
  }, [editor])
  
  const resetToHub = useCallback(() => {
    // Hub is at origin (0, 0)
    editor.setCamera({ x: 0, y: 0, z: 1.0 }, { animation: { duration: 300 } })
  }, [editor])
  
  const panByArrowKey = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const camera = editor.getCamera()
    const panAmount = 100 // pixels
    
    const deltaX = direction === 'left' ? -panAmount : direction === 'right' ? panAmount : 0
    const deltaY = direction === 'up' ? -panAmount : direction === 'down' ? panAmount : 0
    
    editor.setCamera({ x: camera.x + deltaX, y: camera.y + deltaY, z: camera.z })
  }, [editor])
  
  return { zoomIn, zoomOut, resetToHub, panByArrowKey }
}
```

**Source:** tldraw Editor API pattern (MEDIUM confidence — API surface inferred from training data, needs verification with official v4.5 API docs)

### Pattern 3: Camera State Persistence

**What:** Save/restore camera position and zoom to localStorage for returning users

**When to use:** On camera change (debounced), on page load

**Example:**

```typescript
// src/lib/localStorageUtils.ts
interface CameraState {
  x: number
  y: number
  z: number // zoom level
  version: number // Schema version for migration
}

const CAMERA_STORAGE_KEY = 'illulachy-camera-state'
const CAMERA_SCHEMA_VERSION = 1

export function saveCameraState(state: Omit<CameraState, 'version'>): void {
  const data: CameraState = { ...state, version: CAMERA_SCHEMA_VERSION }
  localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(data))
}

export function loadCameraState(): CameraState | null {
  try {
    const stored = localStorage.getItem(CAMERA_STORAGE_KEY)
    if (!stored) return null
    
    const data = JSON.parse(stored) as CameraState
    
    // Schema version check (future-proofing)
    if (data.version !== CAMERA_SCHEMA_VERSION) {
      console.warn('Camera state schema mismatch, clearing cache')
      localStorage.removeItem(CAMERA_STORAGE_KEY)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Failed to load camera state:', error)
    return null
  }
}

export function clearCameraState(): void {
  localStorage.removeItem(CAMERA_STORAGE_KEY)
}

// Usage in Canvas component
import { useEffect } from 'react'
import { useEditor } from 'tldraw'
import { loadCameraState, saveCameraState } from '@/lib/localStorageUtils'

export function Canvas() {
  const editor = useEditor()
  
  // Restore camera on mount
  useEffect(() => {
    const savedState = loadCameraState()
    if (savedState) {
      editor.setCamera({ x: savedState.x, y: savedState.y, z: savedState.z })
    } else {
      // First-time visitor: calculate initial zoom to fit hub at 40% viewport
      const initialZoom = calculateInitialZoom(editor.getViewportScreenBounds())
      editor.setCamera({ x: 0, y: 0, z: initialZoom })
    }
  }, [editor])
  
  // Save camera on change (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleCameraChange = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const camera = editor.getCamera()
        saveCameraState({ x: camera.x, y: camera.y, z: camera.z })
      }, 500) // Debounce 500ms
    }
    
    editor.on('camera-change', handleCameraChange)
    return () => {
      editor.off('camera-change', handleCameraChange)
      clearTimeout(timeoutId)
    }
  }, [editor])
  
  return <Tldraw />
}
```

**Source:** Standard React + localStorage pattern (HIGH confidence)

### Pattern 4: Skeleton Loading State

**What:** Display placeholder canvas with ghost hub shape until tldraw is interactive

**When to use:** During initial page load, before tldraw mounts

**Example:**

```typescript
// src/components/CanvasLoader.tsx
export function CanvasLoader() {
  return (
    <div className="fixed inset-0 bg-[var(--canvas-bg)] flex items-center justify-center">
      {/* Ghost hub shape (640x360px at 40% viewport) */}
      <div 
        className="relative animate-pulse"
        style={{
          width: 'min(640px, 40vw)',
          height: 'min(360px, 22.5vh)',
          aspectRatio: '16 / 9',
        }}
      >
        <div 
          className="w-full h-full rounded-lg border border-[var(--border-ghost)] bg-[var(--surface-container-low)]"
          style={{
            backdropFilter: 'blur(20px)',
            opacity: 0.4,
          }}
        />
      </div>
      
      {/* Overlay to prevent interaction */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  )
}

// src/components/Canvas.tsx
import { Suspense, useState } from 'react'
import { Tldraw } from 'tldraw'
import { CanvasLoader } from './CanvasLoader'

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  
  return (
    <>
      {!isReady && <CanvasLoader />}
      
      <div 
        className="fixed inset-0 transition-opacity duration-300"
        style={{ opacity: isReady ? 1 : 0 }}
      >
        <Tldraw
          onMount={(editor) => {
            // Canvas is ready when editor mounts
            // Add small delay to ensure first paint
            requestAnimationFrame(() => {
              setIsReady(true)
            })
          }}
        />
      </div>
    </>
  )
}
```

**Source:** Standard React loading pattern (HIGH confidence)

### Pattern 5: Responsive Initial Zoom Calculation

**What:** Algorithm to calculate zoom level where 640x360px hub fills 40% of viewport

**When to use:** First-time visitors, reset to hub functionality

**Example:**

```typescript
// src/lib/cameraUtils.ts
interface Dimensions {
  width: number
  height: number
}

/**
 * Calculate zoom level to make hub (640x360px) fill 40% of viewport
 * @param viewport - Current viewport dimensions
 * @returns Zoom level (1.0 = 100%)
 */
export function calculateInitialZoom(viewport: Dimensions): number {
  const HUB_WIDTH = 640
  const HUB_HEIGHT = 360
  const TARGET_FILL = 0.4 // 40% of viewport
  
  // Calculate what zoom would make hub width = 40% viewport width
  const zoomByWidth = (viewport.width * TARGET_FILL) / HUB_WIDTH
  
  // Calculate what zoom would make hub height = 40% viewport height
  const zoomByHeight = (viewport.height * TARGET_FILL) / HUB_HEIGHT
  
  // Use the smaller zoom to ensure hub fits within 40% of viewport
  // (prevents overflow on extreme aspect ratios)
  const calculatedZoom = Math.min(zoomByWidth, zoomByHeight)
  
  // Clamp to zoom limits (10% - 400%)
  return Math.max(0.1, Math.min(4.0, calculatedZoom))
}

/**
 * Get current viewport dimensions from tldraw editor
 */
export function getViewportDimensions(editor: Editor): Dimensions {
  const bounds = editor.getViewportScreenBounds()
  return {
    width: bounds.width,
    height: bounds.height,
  }
}

// Usage
import { useEditor } from 'tldraw'
import { useEffect } from 'react'

export function useInitialZoom() {
  const editor = useEditor()
  
  useEffect(() => {
    const viewport = getViewportDimensions(editor)
    const zoom = calculateInitialZoom(viewport)
    editor.setCamera({ x: 0, y: 0, z: zoom }, { animation: { duration: 300 } })
  }, [editor])
}
```

**Source:** Custom implementation (HIGH confidence — straightforward geometry)

### Anti-Patterns to Avoid

- **Don't hand-roll camera math:** tldraw's `setCamera()` handles bounds checking, animation, and coordinate transforms — use it
- **Don't bypass Editor API:** Manipulating tldraw internals (store, state) directly breaks reactivity and causes bugs
- **Don't store entire editor state:** Only persist camera position (x, y, z) — shapes/bindings managed by tldraw, not needed in Phase 1
- **Don't use absolute positioning for canvas:** tldraw expects `position: fixed` or `position: absolute` with `inset: 0` to fill viewport
- **Don't implement custom touch gestures:** tldraw handles pinch-to-zoom, drag-to-pan natively — adding custom handlers causes conflicts

---

## Implementation Domains

### Domain 1: tldraw 4.5 Initialization & Configuration

**Challenge:** Disable default shape tools while preserving pan/zoom navigation

**Solution:**
- Use `hideUi: true` to remove default toolbar/shape tools
- Keep camera interactions enabled (drag-to-pan, scroll-to-zoom work by default)
- Build custom controls component separate from tldraw UI
- Access Editor API via `onMount` callback to store editor instance

**Key Config:**
```typescript
{
  hideUi: true,
  cameraBounds: { x: -10000, y: -5000, w: 20000, h: 10000 },
  selectOnCreate: false,
}
```

**Confidence:** MEDIUM (hideUi pattern verified in tldraw v3 docs, assuming v4.5 maintains similar API)

### Domain 2: Camera Control & Editor API

**Challenge:** Programmatic camera movement for arrow keys, zoom buttons, reset functionality

**Solution:**
- Use `editor.setCamera({ x, y, z })` for all camera changes
- Add optional animation config: `{ animation: { duration: 300 } }`
- Get current camera: `editor.getCamera()` returns `{ x, y, z }`
- Viewport bounds: `editor.getViewportScreenBounds()` for dimension calculations

**Key Methods:**
- `editor.setCamera(camera, options?)` - Move/zoom camera
- `editor.getCamera()` - Get current camera state
- `editor.zoomIn()` / `editor.zoomOut()` - Zoom by standard increment (if available)
- `editor.on('camera-change', handler)` - Subscribe to camera updates

**Confidence:** MEDIUM (API surface inferred from tldraw v3, needs v4.5 API verification)

### Domain 3: Performance (60 FPS Target)

**Challenge:** Maintain 60 FPS during pan/zoom with React 19 and tldraw rendering

**Strategy:**

1. **tldraw optimizations (built-in):**
   - Canvas rendering uses requestAnimationFrame
   - Shape culling (only renders visible shapes)
   - Optimized transform updates (GPU-accelerated)

2. **React 19 optimizations:**
   - Use `useTransition` for non-urgent UI updates (control visibility)
   - Debounce localStorage writes (500ms) to avoid blocking render
   - Memoize expensive calculations (`useMemo`, `useCallback`)

3. **Validation approach:**
   - Chrome DevTools > Performance panel
   - Record 5-second pan/zoom interaction
   - Verify FPS consistently ≥60 (frame time ≤16.67ms)
   - Check for "Long Tasks" warnings
   - Test on mobile device (Chrome Remote Debugging)

**Measurement commands:**
```bash
# Manual: Chrome DevTools > Performance > Record
# Automated: Playwright + Chrome DevTools Protocol
npm run test:performance  # Phase 1 TODO: Set up automated perf tests
```

**Confidence:** HIGH (tldraw performance characteristics well-documented, React 19 concurrent features standard)

### Domain 4: LocalStorage Persistence

**Challenge:** Save/restore camera state across sessions without breaking on schema changes

**Schema:**
```typescript
interface CameraState {
  x: number
  y: number
  z: number
  version: number // For future migration
}
```

**Strategy:**
- Key: `illulachy-camera-state`
- Save on camera change (debounced 500ms to avoid excessive writes)
- Load on mount: If valid, restore camera; else calculate initial zoom
- Version check: Clear cache if schema version mismatches

**Migration strategy (future phases):**
```typescript
function migrateCameraState(data: any): CameraState | null {
  if (data.version === 1) return data
  if (!data.version) {
    // v0 (no version) -> v1
    return { x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 1.0, version: 1 }
  }
  return null // Unknown version, clear cache
}
```

**Confidence:** HIGH (standard localStorage pattern, well-understood)

### Domain 5: Skeleton Loading Implementation

**Challenge:** Display placeholder until tldraw is interactive

**Approach:** React component with CSS skeleton

**Detection strategy:**
- tldraw is ready when `onMount` callback fires
- Add `requestAnimationFrame` after mount to ensure first paint
- Fade transition (200-300ms) from skeleton to canvas

**Skeleton design:**
- Ghost hub shape (640x360px, 16:9 aspect ratio)
- Centered in viewport
- Pulse animation (subtle, 2s duration)
- Dim overlay to prevent interaction

**Confidence:** HIGH (standard React loading pattern)

### Domain 6: Responsive Zoom Calculation

**Algorithm:**
```
zoomByWidth = (viewport.width * 0.4) / 640
zoomByHeight = (viewport.height * 0.4) / 360
zoom = min(zoomByWidth, zoomByHeight) // Fit within viewport
zoom = clamp(zoom, 0.1, 4.0) // Enforce limits
```

**Edge cases:**
- Ultra-wide (3440x1440): zoomByWidth = 2.15, zoomByHeight = 1.6 → use 1.6
- Portrait mobile (375x812): zoomByWidth = 0.23, zoomByHeight = 0.90 → use 0.23
- Small mobile (360x640): zoomByWidth = 0.23, zoomByHeight = 0.71 → use 0.23

**Confidence:** HIGH (straightforward geometry, testable with unit tests)

### Domain 7: Glassmorphism Controls Styling

**CSS Pattern:**
```css
.canvas-controls {
  background: var(--glass-bg); /* rgba(28, 28, 28, 0.7) */
  backdrop-filter: blur(var(--glass-blur)); /* 20px */
  border: 1px solid var(--glass-border); /* rgba(255, 255, 255, 0.1) */
  border-radius: var(--radius-xl); /* 12px */
  box-shadow: var(--glass-shadow); /* 0 8px 32px rgba(0, 0, 0, 0.2) */
  padding: var(--spacing-3); /* 12px */
  
  /* Positioning */
  position: fixed;
  bottom: var(--toolbar-offset); /* 16px */
  right: var(--toolbar-offset);
  
  /* Z-index */
  z-index: var(--z-fixed); /* 300 */
}

.control-button {
  width: var(--control-size); /* 40px */
  height: var(--control-size);
  color: var(--interactive-default); /* #E0AFFF */
  transition: color var(--motion-hover); /* 150ms ease-out */
}

.control-button:hover {
  color: var(--interactive-hover); /* #EAC7FF */
}
```

**Tailwind CSS v4 approach:**
```tsx
<div className="fixed bottom-4 right-4 z-[var(--z-fixed)] 
                bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]
                border border-[var(--glass-border)] rounded-xl
                shadow-[var(--glass-shadow)] p-3">
  <button className="w-10 h-10 text-[var(--interactive-default)] 
                     hover:text-[var(--interactive-hover)] transition-colors">
    {/* Icon */}
  </button>
</div>
```

**Confidence:** HIGH (CSS custom properties defined in TOKENS.md, glassmorphism is standard CSS)

### Domain 8: Touch Gestures Support

**Built-in tldraw support:**
- Drag to pan: Single-finger touch + move
- Pinch to zoom: Two-finger pinch gesture
- Double-tap: Zoom in (standard mobile behavior)

**No custom implementation needed** — tldraw handles touch events internally

**Testing approach:**
- Chrome DevTools > Device Mode (simulate touch)
- BrowserStack or physical device testing
- Verify pinch-to-zoom respects 10%-400% zoom limits

**Confidence:** MEDIUM-HIGH (tldraw documented as touch-friendly, needs verification on actual devices)

### Domain 9: Fog Overlay for Boundaries

**CSS Implementation:**
```css
.canvas-fog {
  position: fixed;
  inset: 0;
  pointer-events: none; /* Don't interfere with canvas interactions */
  z-index: var(--z-base); /* Below controls, above canvas */
  
  /* Radial gradient vignette */
  background: radial-gradient(
    ellipse at center,
    transparent 40%, /* Clear center */
    var(--canvas-fog) 100% /* rgba(19, 19, 19, 0.6) at edges */
  );
}
```

**React Component:**
```tsx
// src/components/CanvasFogOverlay.tsx
export function CanvasFogOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[var(--z-base)]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 40%, var(--canvas-fog) 100%)`
      }}
    />
  )
}
```

**Confidence:** HIGH (standard CSS vignette pattern)

### Domain 10: Vite + React 19 Build Setup

**Vite Configuration:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020', // Modern browsers
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'tldraw': ['tldraw'], // Separate chunk for canvas SDK
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

**Confidence:** HIGH (Standard Vite + React setup, well-documented)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan/zoom camera | Custom mouse/wheel handlers | tldraw built-in camera | tldraw handles momentum, easing, bounds checking, coordinate transforms |
| Touch gestures | Hammer.js or custom touch detection | tldraw built-in touch support | Pinch-to-zoom, drag-to-pan work out-of-the-box, optimized for mobile |
| Camera bounds | Custom collision detection | tldraw `cameraBounds` config | Built-in bounds enforcement, prevents getting lost in infinite space |
| Performance optimization | Manual requestAnimationFrame loop | tldraw's rendering engine | Already optimized for 60 FPS, shape culling, GPU acceleration |
| Coordinate transforms | Matrix math for zoom/pan | Editor API `screenToPage()` / `pageToScreen()` | tldraw handles viewport ↔ canvas coordinate conversion |
| Undo/redo (future) | Custom history stack | tldraw built-in history | Editor has undo/redo out-of-the-box (will need in Phase 3+ for node editing) |

**Key insight:** tldraw is a **canvas SDK**, not just a drawing library. It's designed to be the foundation for infinite canvas apps — don't reinvent the wheel.

---

## Common Pitfalls

### Pitfall 1: tldraw CSS Not Imported

**What goes wrong:** Canvas renders but interactions don't work, or UI looks broken

**Why it happens:** tldraw requires `tldraw/tldraw.css` to style internal components

**How to avoid:**
```typescript
// src/main.tsx or App.tsx
import 'tldraw/tldraw.css'
```

**Warning signs:** Missing pointer cursors, invisible buttons, broken layout

### Pitfall 2: Camera State Race Condition

**What goes wrong:** Camera jumps to origin (0, 0) on load, then jumps to saved position

**Why it happens:** Calling `setCamera()` before tldraw is fully initialized

**How to avoid:**
```typescript
// Wait for onMount before setting camera
<Tldraw
  onMount={(editor) => {
    // NOW it's safe to set camera
    const savedState = loadCameraState()
    if (savedState) {
      editor.setCamera(savedState)
    }
  }}
/>
```

**Warning signs:** Visible camera "jump" after page load

### Pitfall 3: LocalStorage Quota Exceeded

**What goes wrong:** Camera state fails to save, throws QuotaExceededError

**Why it happens:** LocalStorage has ~5-10MB limit per domain (browser-dependent)

**How to avoid:**
- Only store camera state (x, y, z, version) — ~100 bytes
- Don't store shapes/bindings in Phase 1 (not needed)
- Add try-catch around `localStorage.setItem()`

**Warning signs:** Console errors on camera change, state not persisting

### Pitfall 4: Zoom Limits Not Enforced

**What goes wrong:** User can zoom in/out beyond 10%-400% limits

**Why it happens:** Not clamping zoom value in custom zoom functions

**How to avoid:**
```typescript
const zoomIn = () => {
  const currentZoom = editor.getCamera().z
  const newZoom = Math.min(currentZoom * 1.2, 4.0) // Max 400%
  editor.setCamera({ z: newZoom })
}
```

**Warning signs:** Canvas becomes unusably zoomed in/out

### Pitfall 5: Controls Not Visible on Mobile

**What goes wrong:** Glassmorphism controls too small to tap on mobile (< 44px touch target)

**Why it happens:** Desktop-sized buttons (40px) below WCAG minimum touch target

**How to avoid:**
```typescript
// Use larger touch targets on mobile
<button 
  className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12"
  // 48px on mobile, 40px on desktop
/>
```

**Warning signs:** Users struggle to tap zoom buttons on mobile

### Pitfall 6: Skeleton Loading Flicker

**What goes wrong:** Skeleton appears for <100ms then disappears (jarring flash)

**Why it happens:** tldraw mounts faster than skeleton fade animation

**How to avoid:**
```typescript
// Enforce minimum loading time (300ms) for smooth transition
const [isReady, setIsReady] = useState(false)

<Tldraw
  onMount={(editor) => {
    setTimeout(() => setIsReady(true), 300)
  }}
/>
```

**Warning signs:** White flash or skeleton flicker on fast connections

---

## Code Examples

### Complete Canvas Component (Main Implementation)

```typescript
// src/components/Canvas.tsx
import { useState, useEffect, useRef } from 'react'
import { Tldraw, TldrawOptions, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CanvasLoader } from './CanvasLoader'
import { CanvasControls } from './CanvasControls'
import { CanvasFogOverlay } from './CanvasFogOverlay'
import { loadCameraState, saveCameraState } from '@/lib/localStorageUtils'
import { calculateInitialZoom, getViewportDimensions } from '@/lib/cameraUtils'

const canvasConfig: Partial<TldrawOptions> = {
  hideUi: true,
  cameraBounds: { x: -10000, y: -5000, w: 20000, h: 10000 },
  selectOnCreate: false,
}

export function Canvas() {
  const [isReady, setIsReady] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  
  const handleMount = (editor: Editor) => {
    editorRef.current = editor
    
    // Restore saved camera or calculate initial zoom
    const savedState = loadCameraState()
    if (savedState) {
      editor.setCamera({ x: savedState.x, y: savedState.y, z: savedState.z })
    } else {
      const viewport = getViewportDimensions(editor)
      const zoom = calculateInitialZoom(viewport)
      editor.setCamera({ x: 0, y: 0, z: zoom })
    }
    
    // Mark as ready after first paint
    requestAnimationFrame(() => {
      setTimeout(() => setIsReady(true), 300)
    })
  }
  
  // Save camera state on change (debounced)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    
    let timeoutId: NodeJS.Timeout
    
    const handleCameraChange = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const camera = editor.getCamera()
        saveCameraState({ x: camera.x, y: camera.y, z: camera.z })
      }, 500)
    }
    
    editor.on('camera-change', handleCameraChange)
    return () => {
      editor.off('camera-change', handleCameraChange)
      clearTimeout(timeoutId)
    }
  }, [])
  
  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const editor = editorRef.current
      if (!editor) return
      
      const PAN_AMOUNT = 100
      const camera = editor.getCamera()
      let deltaX = 0
      let deltaY = 0
      
      switch (e.key) {
        case 'ArrowUp':
          deltaY = -PAN_AMOUNT
          break
        case 'ArrowDown':
          deltaY = PAN_AMOUNT
          break
        case 'ArrowLeft':
          deltaX = -PAN_AMOUNT
          break
        case 'ArrowRight':
          deltaX = PAN_AMOUNT
          break
        default:
          return
      }
      
      e.preventDefault()
      editor.setCamera({ 
        x: camera.x + deltaX, 
        y: camera.y + deltaY, 
        z: camera.z 
      })
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <>
      {!isReady && <CanvasLoader />}
      
      <div 
        className="fixed inset-0 transition-opacity duration-300"
        style={{ opacity: isReady ? 1 : 0 }}
      >
        <Tldraw
          options={canvasConfig}
          onMount={handleMount}
        />
        
        {isReady && (
          <>
            <CanvasFogOverlay />
            <CanvasControls editor={editorRef.current} />
          </>
        )}
      </div>
    </>
  )
}
```

### Canvas Controls Component (Glassmorphism Toolbar)

```typescript
// src/components/CanvasControls.tsx
import { useCallback, useState, useEffect } from 'react'
import { Editor } from 'tldraw'
import { ZoomIn, ZoomOut, Maximize2, Home } from 'lucide-react'

interface CanvasControlsProps {
  editor: Editor | null
}

export function CanvasControls({ editor }: CanvasControlsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  // Show controls on mouse move, hide after 3s
  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true)
      
      if (timeoutId) clearTimeout(timeoutId)
      
      const id = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
      
      setTimeoutId(id)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [timeoutId])
  
  const zoomIn = useCallback(() => {
    if (!editor) return
    const current = editor.getCamera().z
    editor.setCamera({ z: Math.min(current * 1.2, 4.0) })
  }, [editor])
  
  const zoomOut = useCallback(() => {
    if (!editor) return
    const current = editor.getCamera().z
    editor.setCamera({ z: Math.max(current / 1.2, 0.1) })
  }, [editor])
  
  const resetToHub = useCallback(() => {
    if (!editor) return
    editor.setCamera({ x: 0, y: 0, z: 1.0 }, { animation: { duration: 300 } })
  }, [editor])
  
  const fitToScreen = useCallback(() => {
    if (!editor) return
    const viewport = editor.getViewportScreenBounds()
    const zoom = Math.min(
      (viewport.width * 0.4) / 640,
      (viewport.height * 0.4) / 360
    )
    editor.setCamera({ x: 0, y: 0, z: zoom }, { animation: { duration: 300 } })
  }, [editor])
  
  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-[var(--z-fixed)]
        flex gap-2 p-3 rounded-xl
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      <button
        onClick={zoomIn}
        className="w-10 h-10 flex items-center justify-center rounded-lg
                   text-[var(--interactive-default)] hover:text-[var(--interactive-hover)]
                   hover:bg-[var(--interactive-bg-subtle)] transition-all"
        aria-label="Zoom in"
      >
        <ZoomIn size={20} />
      </button>
      
      <button
        onClick={zoomOut}
        className="w-10 h-10 flex items-center justify-center rounded-lg
                   text-[var(--interactive-default)] hover:text-[var(--interactive-hover)]
                   hover:bg-[var(--interactive-bg-subtle)] transition-all"
        aria-label="Zoom out"
      >
        <ZoomOut size={20} />
      </button>
      
      <button
        onClick={resetToHub}
        className="w-10 h-10 flex items-center justify-center rounded-lg
                   text-[var(--interactive-default)] hover:text-[var(--interactive-hover)]
                   hover:bg-[var(--interactive-bg-subtle)] transition-all"
        aria-label="Reset to hub"
      >
        <Home size={20} />
      </button>
      
      <button
        onClick={fitToScreen}
        className="w-10 h-10 flex items-center justify-center rounded-lg
                   text-[var(--interactive-default)] hover:text-[var(--interactive-hover)]
                   hover:bg-[var(--interactive-bg-subtle)] transition-all"
        aria-label="Fit to screen"
      >
        <Maximize2 size={20} />
      </button>
    </div>
  )
}
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 + React Testing Library 16.0.1 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANVAS-01 | Pan canvas by dragging | integration | `npm test tests/Canvas.test.tsx -t "pan"` | ❌ Wave 0 |
| CANVAS-02 | Zoom using scroll wheel | integration | `npm test tests/Canvas.test.tsx -t "zoom"` | ❌ Wave 0 |
| CANVAS-03 | Pan/zoom with touch | e2e | `npm run test:e2e -- touch-gestures.spec.ts` | ❌ Wave 0 |
| CANVAS-04 | Navigate with arrow keys | integration | `npm test tests/Canvas.test.tsx -t "arrow"` | ❌ Wave 0 |
| CANVAS-05 | 60 FPS performance | e2e | `npm run test:performance` | ❌ Wave 0 |
| CANVAS-06 | Loading state displays | unit | `npm test tests/CanvasLoader.test.tsx` | ❌ Wave 0 |
| TECH-01 | Vite + React 19 + TS | smoke | `npm run build && npm run preview` | ✅ (package.json scripts) |
| TECH-02 | tldraw 4.5 integrated | integration | `npm test tests/Canvas.test.tsx -t "tldraw"` | ❌ Wave 0 |
| TECH-04 | Static SPA build | smoke | `npm run build` | ✅ (Vite build) |
| TECH-05 | TypeScript types | unit | `npm run type-check` | ✅ (tsconfig.json) |

### Sampling Rate

- **Per task commit:** `npm test -- --run` (fast unit tests only)
- **Per wave merge:** `npm test -- --coverage` (full suite with coverage report)
- **Phase gate:** Full suite green + performance validation (Chrome DevTools manual check for 60 FPS) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/Canvas.test.tsx` — covers CANVAS-01, CANVAS-02, CANVAS-04, TECH-02
- [ ] `tests/CanvasLoader.test.tsx` — covers CANVAS-06
- [ ] `tests/lib/cameraUtils.test.ts` — covers initial zoom calculation
- [ ] `tests/lib/localStorageUtils.test.ts` — covers camera state persistence
- [ ] `playwright.config.ts` + `tests/e2e/touch-gestures.spec.ts` — covers CANVAS-03 (touch)
- [ ] `tests/e2e/performance.spec.ts` + Chrome DevTools Protocol — covers CANVAS-05 (60 FPS)
- [ ] Framework install: `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom`

---

## Open Questions

### 1. tldraw 4.5 API Surface Changes

**What we know:** tldraw 4.5.3 is latest stable (published 2026-03-18), supports React 19

**What's unclear:** Specific API changes from v3 to v4.5 — configuration options, Editor methods, event names

**Recommendation:** 
- During Wave 0, inspect tldraw package types: `node_modules/tldraw/dist/index.d.ts`
- Validate `hideUi`, `cameraBounds`, `onMount` options still exist
- Check if `editor.on('camera-change')` is correct event name (might be `'change-camera'`)
- Fallback: Use tldraw's GitHub discussions or Discord for v4 migration guide

**Impact:** MEDIUM (might need to adjust configuration patterns, but core concepts remain)

### 2. Performance Validation Automation

**What we know:** Chrome DevTools can measure FPS manually, Playwright supports CDP

**What's unclear:** Best automated approach for validating 60 FPS in CI/CD

**Recommendation:**
- Phase 1: Manual validation via Chrome DevTools Performance panel (good enough for v1)
- Phase 5+: Add Playwright test with `page.metrics()` and CDP Performance timeline
- Set threshold: Fail if average FPS < 55 during 5-second pan/zoom interaction

**Impact:** LOW (manual validation sufficient for Phase 1, automate later if needed)

### 3. Mobile Touch Testing Strategy

**What we know:** Chrome DevTools can simulate touch, but not a perfect proxy

**What's unclear:** Most cost-effective approach for physical device testing

**Recommendation:**
- Development: Chrome DevTools Device Mode (good enough for basic gestures)
- Pre-launch: BrowserStack (1-2 devices: iPhone Safari, Android Chrome) for final validation
- Budget: ~$50/month for BrowserStack Live plan, or free tier (limited)

**Impact:** LOW (tldraw's touch support is battle-tested, mostly need to verify our zoom limits work)

### 4. Fog Overlay Z-Index Interaction

**What we know:** Fog should be below controls, above canvas

**What's unclear:** Does tldraw render shapes in a separate z-index context? Will fog obscure future timeline nodes?

**Recommendation:**
- Phase 1: Test fog overlay with placeholder shape in tldraw canvas
- If fog obscures shapes: Adjust fog gradient to start at 60% (instead of 40%) to preserve center visibility
- If still problematic: Defer fog overlay to Phase 4 when timeline layout defines actual edges

**Impact:** LOW (aesthetic enhancement, not critical to Phase 1 success)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tldraw v2 | tldraw v4.5 | 2025-2026 | Improved performance, React 19 support, better TypeScript types |
| Create React App | Vite | 2021+ | 10x faster dev server, HMR that actually works, smaller bundles |
| Webpack | Vite | 2020+ | Native ESM, faster cold start, better DX |
| Class components | Function components + Hooks | 2019+ | Less boilerplate, better composition, easier testing |
| CSS-in-JS (emotion, styled) | Tailwind CSS v4 | 2024+ | Better performance (no runtime), easier to maintain |
| React 18 | React 19 | 2026 | Concurrent rendering improvements, better Suspense, compiler optimizations |

**Deprecated/outdated:**
- **Create React App:** Officially deprecated (2023), use Vite instead
- **tldraw v1/v2:** Breaking changes in v3+, v4 is current stable
- **React 17 and below:** Missing concurrent features, Suspense, automatic batching
- **Webpack for new projects:** Slower than Vite, more config overhead (still fine for existing projects)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All package versions verified against npm registry (2026-03-22) |
| tldraw Configuration | MEDIUM | API surface inferred from v3 docs + training data, needs v4.5 verification |
| Camera Control | MEDIUM | Editor API methods exist, but event names/options may differ in v4.5 |
| Performance | HIGH | tldraw's 60 FPS capability documented, React 19 concurrent features standard |
| LocalStorage | HIGH | Standard web API, well-understood patterns |
| Skeleton Loading | HIGH | Standard React pattern, no dependencies on tldraw internals |
| Zoom Calculation | HIGH | Straightforward geometry, testable with unit tests |
| Glassmorphism | HIGH | CSS custom properties defined in TOKENS.md, standard CSS techniques |
| Touch Gestures | MEDIUM-HIGH | tldraw documented as touch-friendly, but needs device testing |
| Vite Build Setup | HIGH | Standard Vite configuration, React plugin well-documented |

**Overall Confidence:** MEDIUM-HIGH

**Verification needed:**
1. tldraw v4.5 API documentation (hideUi, cameraBounds, onMount, Editor methods)
2. tldraw event system (camera-change event name, subscription pattern)
3. Physical device testing for touch gestures (BrowserStack or actual devices)

**Verification approach:**
- Wave 0: Install tldraw, inspect types in `node_modules/tldraw/dist/index.d.ts`
- Wave 0: Create minimal canvas component, test configuration options
- Wave 0: Verify camera control methods work as expected
- Wave 1+: Add automated tests for validated APIs

---

## Sources

### Primary (HIGH confidence)

- **npm registry** (2026-03-22):
  - tldraw 4.5.3: https://www.npmjs.com/package/tldraw
  - React 19.2.4: https://www.npmjs.com/package/react
  - Vite 8.0.1: https://www.npmjs.com/package/vite
  - TypeScript 5.9.3: https://www.npmjs.com/package/typescript
  - Tailwind 4.2.2: https://www.npmjs.com/package/tailwindcss
- **GitHub release** - tldraw v4.5.3 (published 2026-03-18): https://github.com/tldraw/tldraw/releases/tag/v4.5.3
- **Design system tokens** - TOKENS.md (project file, HIGH confidence)
- **React documentation** - Hooks, Suspense, concurrent features (official docs)

### Secondary (MEDIUM confidence)

- **tldraw README** - GitHub main branch (verified 2026-03-22)
- **tldraw v3 documentation** - Extrapolated patterns to v4.5 (API may differ)
- **Vite documentation** - Official config patterns (verified current)

### Tertiary (LOW confidence - needs verification)

- **tldraw v4.5 API specifics** - Configuration options, Editor methods (inferred from v3, marked for verification)
- **tldraw event system** - Event names, subscription patterns (assumed similar to v3)
- **Touch gesture implementation** - Specific touch event handling (documented as supported, not tested)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified 2026-03-22
- Architecture: MEDIUM-HIGH - Patterns proven in v3, need v4.5 validation
- Pitfalls: HIGH - Common issues well-documented in community
- Performance: HIGH - tldraw performance characteristics established
- Implementation domains: MEDIUM-HIGH - Most patterns standard, some tldraw specifics need verification

**Research date:** 2026-03-22
**Valid until:** ~30 days (stable stack, but tldraw v4 API needs hands-on verification in Wave 0)

**Next steps for planner:**
1. Wave 0: Verify tldraw v4.5 API (install package, inspect types)
2. Wave 0: Set up test infrastructure (Vitest + React Testing Library)
3. Wave 1: Implement Canvas component with validated APIs
4. Wave 2: Add camera controls and persistence
5. Wave 3: Performance validation and polish
