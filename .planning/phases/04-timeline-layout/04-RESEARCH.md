# Phase 4: Timeline Layout - Research

**Researched:** 2026-03-23  
**Domain:** Force-directed layout algorithms, temporal clustering, collision detection  
**Confidence:** HIGH

## Summary

Timeline layout requires chronological positioning with collision-free constellation scatter aesthetics. After evaluating multiple approaches, **D3-force v3.0.0** emerges as the optimal solution—a battle-tested physics engine specifically designed for node layout with built-in collision detection. The algorithm combines three forces: temporal gravity (forceX pulls nodes to date-based X coordinates), vertical scatter (weak forceY centers around axis), and generous spacing (forceCollide with 150px+ padding). Session-based seeding via localStorage ensures layouts feel stable within a visit while varying between sessions, creating the "organic yet consistent" aesthetic specified in CONTEXT.md.

**Primary recommendation:** Use D3-force with synchronous simulation (no animation), date-to-X mapping for chronology, circular collision detection (diagonal radius + padding), and SVG overlay for timeline axis/connectors. This architecture handles 11-50 nodes in <100ms with proven stability.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Vertical Distribution Strategy:**
- Organic constellation scatter with temporal gravity (nodes with close dates cluster spatially)
- **Completely random vertical placement** regardless of content type (no type-based zones)
- No rigid patterns (no zigzag, no fill-above-then-below)
- Adaptive vertical range that expands based on node count
- Session-based seeding (same pattern within visit, slight variation between visits)

**Collision Resolution:**
- Force-directed physics simulation (not manual cascading push logic)
- **150px+ minimum gap** between any two nodes
- **Allow significant horizontal shift** for collision resolution (chronology approximate, not pixel-precise)
- Push significantly away (not minimal nudges) when overlaps occur
- Multiple iterations until system stabilizes

**Spacing & Density:**
- **Variable density** (dense activity periods compressed, sparse periods stretched)
- Do NOT use fixed pixels-per-year
- **Scale up** as timeline grows (never compress to fit fixed space)
- **Natural physics-driven scale** (no predefined target positions)
- **Continuous flow** (no segmentation, breaks, or year markers)

**Visual Timeline Axis:**
- **Faint horizontal line** at y=0 (subtle anchor, not dominant)
- **Minimal style** (thin solid line, low-contrast with background)
- Line **fades out near hub** (disappears in hub zone ~500px before hub)
- **Subtle connector lines** from each node to timeline axis showing chronological anchoring

### Claude's Discretion

- **Physics engine choice:** D3-force vs custom simulation vs other library
- **Simulation parameters:** Exact force strengths, iteration counts, damping
- **Adaptive vertical range formula:** How aggressively to expand based on node count
- **Session seed mechanism:** localStorage key structure, hash approach
- **Line rendering approach:** SVG layer vs Canvas API vs CSS
- **Fade transition curves:** Easing functions for hub zone fade
- **Performance optimizations:** Spatial indexing, viewport culling if needed
- **Edge case handling:** Nodes with identical timestamps, missing dates

### Deferred Ideas (OUT OF SCOPE)

None—discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TIME-01 | Timeline extends left from portfolio node | Date-to-X mapping (negative X = older = further left) |
| TIME-02 | Nodes positioned chronologically (oldest = farthest left) | forceX() pulls nodes toward date-based X coordinates with temporal gravity |
| TIME-03 | Most recent entries closest to portfolio hub | Hub at x=0, dates map to negative X, newest = least negative |
| TIME-04 | YouTube content displays as thumbnail node | Existing shape from Phase 3 (280x200px) |
| TIME-05 | Blog/note content displays as card node | Existing shape from Phase 3 (280x200px) |
| TIME-06 | Project content displays as card node | Existing shape from Phase 3 (280x200px) |
| TIME-07 | Milestone/education content displays as card node | Existing shape from Phase 3 (280x200px) |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-force | 3.0.0 | Force-directed graph layout using velocity Verlet integration | Industry standard for node layout, ~1,951 GitHub stars, battle-tested for network/timeline visualizations with built-in collision detection |
| d3-random | 3.0.1 | Seeded pseudo-random number generator | Official D3 companion for deterministic randomness, used for session-based layout variation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rbush | 4.0.1 | High-performance 2D spatial indexing (R-tree) | Future optimization if >100 nodes (makes collision queries O(log n) instead of O(n²)) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| D3-force | Matter.js (0.20.0) | Full 2D rigid body physics—overkill for static layout (adds rotation, constraints, gravity not needed) |
| D3-force | Custom collision algorithm + RBush | More control but requires writing push/resolve logic, more complex than D3's proven approach |
| D3-force | React-spring (10.0.3) | Spring physics for animations, not layout positioning (could pair for transitions in Phase 5) |

**Installation:**
```bash
npm install d3-force d3-random
```

**Version verification:** 
- d3-force v3.0.0 published 2022-06-14 (stable, mature)
- d3-random v3.0.1 published 2023-04-26 (stable)
- rbush v4.0.1 published 2024-07-25 (current, stable)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── positionNodes.ts          # Replace Phase 3 temporary algorithm
│   ├── forceSimulation.ts        # D3-force simulation logic
│   ├── sessionSeed.ts            # LocalStorage-based seeding
│   └── dateUtils.ts              # Date-to-X coordinate mapping
├── components/
│   ├── Canvas.tsx                # Existing — consumes PositionedNode[]
│   └── TimelineOverlay.tsx       # NEW: SVG layer for axis/connectors
└── types/
    └── content.ts                # Existing — ContentNode interface
```

### Pattern 1: Date-to-X Coordinate Mapping

**What:** Convert ISO 8601 date strings to negative X coordinates (older = further left)

**When to use:** Initial node positioning before physics simulation

**Example:**
```typescript
// src/lib/dateUtils.ts
export function createDateToXMapper(nodes: ContentNode[]) {
  const dates = nodes.map(n => new Date(n.date).getTime())
  const oldestDate = Math.min(...dates)
  
  return (dateStr: string) => {
    const date = new Date(dateStr).getTime()
    const daysSinceOldest = (date - oldestDate) / (1000 * 60 * 60 * 24)
    // Variable density: 2px per day (adjust based on testing)
    return -daysSinceOldest * 2
  }
}
```

**Why this pattern:**
- Negative X = left from hub (established in Phase 3)
- Days-based scaling creates variable density (dense periods compress naturally)
- Mapper function encapsulates calculation for reuse

### Pattern 2: Synchronous Force Simulation

**What:** Run D3-force simulation to convergence without animation

**When to use:** Layout calculation at data load (not every frame)

**Example:**
```typescript
// src/lib/forceSimulation.ts
import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force'
import type { SimulationNodeDatum } from 'd3-force'

interface SimNode extends SimulationNodeDatum {
  id: string
  date: string
  // D3 adds x, y, vx, vy during simulation
}

export function simulateLayout(
  nodes: ContentNode[],
  dateToX: (date: string) => number,
  seed: number
): PositionedNode[] {
  // 1. Initialize with seeded random Y
  const random = randomLcg(seed)
  const simNodes: SimNode[] = nodes.map(node => ({
    id: node.id,
    date: node.date,
    x: dateToX(node.date),
    y: (random() - 0.5) * 1000 // Scatter ±500px initially
  }))
  
  // 2. Define collision radius (rectangle diagonal + padding)
  const SHAPE_WIDTH = 280
  const SHAPE_HEIGHT = 200
  const PADDING = 150
  const radius = Math.sqrt(SHAPE_WIDTH**2 + SHAPE_HEIGHT**2) / 2 + PADDING / 2
  
  // 3. Create simulation with forces
  const simulation = forceSimulation(simNodes)
    .force('collide', forceCollide<SimNode>().radius(radius))
    .force('x', forceX<SimNode>(d => dateToX(d.date)).strength(0.5)) // Temporal gravity
    .force('y', forceY<SimNode>(0).strength(0.1)) // Weak axis pull
    .stop() // Don't auto-tick
  
  // 4. Run to convergence (synchronously)
  for (let i = 0; i < 300 && simulation.alpha() > 0.001; i++) {
    simulation.tick()
  }
  
  // 5. Extract final positions
  return simNodes.map(simNode => {
    const originalNode = nodes.find(n => n.id === simNode.id)!
    return {
      node: originalNode,
      x: simNode.x!,
      y: simNode.y!
    }
  })
}
```

**Why this pattern:**
- Synchronous execution avoids animation overhead (positions calculated once)
- 300 iterations sufficient for convergence (D3 standard)
- Alpha threshold 0.001 = simulation stabilized
- Separation of concerns (simulation logic isolated from component)

### Pattern 3: Session-Based Seeding

**What:** Persist random seed in localStorage with 24-hour refresh

**When to use:** Before initializing node positions for deterministic yet varied layout

**Example:**
```typescript
// src/lib/sessionSeed.ts
const SEED_KEY = 'timeline-layout-seed'
const SEED_LIFETIME = 24 * 60 * 60 * 1000 // 24 hours

export function getSessionSeed(): number {
  try {
    const stored = localStorage.getItem(SEED_KEY)
    if (stored) {
      const { seed, timestamp } = JSON.parse(stored)
      const age = Date.now() - timestamp
      if (age < SEED_LIFETIME) {
        return seed
      }
    }
  } catch (e) {
    // localStorage unavailable or corrupted
  }
  
  // Generate new seed
  const newSeed = Math.floor(Math.random() * 1000000)
  try {
    localStorage.setItem(SEED_KEY, JSON.stringify({
      seed: newSeed,
      timestamp: Date.now()
    }))
  } catch (e) {
    // localStorage write failed (quota/privacy mode)
  }
  
  return newSeed
}
```

**Why this pattern:**
- 24-hour refresh balances stability (within session) and variation (between sessions)
- Graceful fallback if localStorage unavailable (generates seed, doesn't persist)
- Deterministic layouts feel intentional (not random on every load)

### Pattern 4: SVG Overlay for Timeline Axis

**What:** Separate SVG layer on top of tldraw Canvas for decorative lines

**When to use:** Timeline axis and node connectors that don't need tldraw shape interaction

**Example:**
```tsx
// src/components/TimelineOverlay.tsx
interface TimelineOverlayProps {
  nodes: PositionedNode[]
  hubX: number
  viewportTransform: { x: number; y: number; zoom: number }
}

export function TimelineOverlay({ nodes, hubX, viewportTransform }: TimelineOverlayProps) {
  const calculateOpacity = (nodeX: number) => {
    // Fade out 500px before hub
    const distance = hubX - nodeX
    if (distance < 500) {
      return Math.max(0, distance / 500)
    }
    return 1
  }
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks through to tldraw
        overflow: 'visible'
      }}
      viewBox={`${viewportTransform.x} ${viewportTransform.y} ${window.innerWidth / viewportTransform.zoom} ${window.innerHeight / viewportTransform.zoom}`}
    >
      {/* Timeline axis (horizontal line at y=0) */}
      <line
        x1={-10000}
        y1={0}
        x2={hubX - 500}
        y2={0}
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={1 / viewportTransform.zoom} // Scale with zoom
      />
      
      {/* Node connectors (vertical lines from node to axis) */}
      {nodes.map(({ node, x, y }) => {
        const opacity = calculateOpacity(x)
        return (
          <line
            key={node.id}
            x1={x}
            y1={y}
            x2={x}
            y2={0}
            stroke={`rgba(255, 255, 255, ${opacity * 0.1})`}
            strokeWidth={1 / viewportTransform.zoom}
          />
        )
      })}
    </svg>
  )
}
```

**Why this pattern:**
- SVG viewBox synchronizes with tldraw camera transforms automatically
- pointerEvents: 'none' allows canvas interaction (pan/zoom/click) to pass through
- Stroke width scales with zoom (strokeWidth / zoom = constant screen pixels)
- Declarative React (conditional rendering, no manual canvas drawing)

### Anti-Patterns to Avoid

- **Animating simulation in real-time:** Runs physics every frame (60 FPS overhead), unnecessary since positions are static after calculation
- **Manual collision resolution loops:** Cascading push logic is error-prone (nodes can push in cycles), D3-force physics handles this correctly
- **Fixed pixels-per-year scaling:** Creates rigid spacing that doesn't adapt to node density, contradicts CONTEXT.md requirement for variable density
- **Type-based vertical zones:** CONTEXT.md explicitly forbids (all types scatter randomly)
- **Mutating input nodes array:** D3-force adds x/y/vx/vy properties, always work with copies to avoid side effects

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout | Custom physics loop with acceleration/velocity/damping | D3-force forceSimulation | Velocity Verlet integration is numerically stable, D3's quadtree makes collision O(n log n) not O(n²), Barnes-Hut approximation for many-body forces |
| Collision detection | Nested loops checking every node pair | D3-force forceCollide() | Uses spatial quadtree (O(n log n)), handles circular/radius-based collisions, automatically resolves overlaps with physics |
| Seeded random numbers | Math.random() with manual seed state | d3-random randomLcg() | Linear congruential generator with proper seed handling, tested implementation |
| Spatial queries (>100 nodes) | Array.filter() to find nearby nodes | RBush R-tree | O(log n) queries vs O(n) filtering, battle-tested for GIS/mapping |

**Key insight:** Physics simulation is deceptively complex—numerical stability, convergence criteria, force composition, and spatial acceleration structures require deep domain knowledge. D3-force is the product of years of refinement by Mike Bostock and the D3 community, encoding best practices for graph/network layout that are not obvious from first principles.

## Common Pitfalls

### Pitfall 1: Circular Collision for Rectangles (Imprecise Spacing)

**What goes wrong:** forceCollide() uses radius (circular collision), but timeline nodes are rectangles (280x200px). Using rectangle width/2 as radius leaves corners overlapping.

**Why it happens:** Collision detection treats all nodes as circles centered at (x, y), which under-approximates rectangle area.

**How to avoid:** 
- Use diagonal radius: `radius = Math.sqrt(280² + 200²) / 2 = 170px`
- Add padding: `radius = diagonal / 2 + PADDING / 2 = 170 + 75 = 245px`
- This ensures 150px+ minimum gap even at corners

**Warning signs:** 
- Nodes appear too close at corners
- Visual overlap in constellation scatter
- Padding feels inconsistent (tighter at diagonals)

**Verification:**
```typescript
// After simulation, check all pairs
for (let i = 0; i < positioned.length; i++) {
  for (let j = i + 1; j < positioned.length; j++) {
    const a = positioned[i], b = positioned[j]
    const dx = a.x - b.x
    const dy = a.y - b.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = radius * 2 // Two circles touching
    if (distance < minDistance) {
      console.warn(`Overlap detected: ${a.node.id} and ${b.node.id}`)
    }
  }
}
```

### Pitfall 2: Simulation Not Converging (Jittery Positions)

**What goes wrong:** Nodes never settle, positions change slightly on recalculation, or simulation reaches 300 iterations without stabilizing.

**Why it happens:** 
- Force strengths too high (nodes oscillate past equilibrium)
- Collision radius too large (impossible to satisfy all constraints)
- Alpha decay too slow (simulation doesn't recognize convergence)

**How to avoid:**
- Start with moderate force strengths: forceX(0.5), forceY(0.1)
- Check simulation.alpha() after ticks—should drop below 0.001
- If not converging, reduce force strengths or increase collision radius tolerance
- Log alpha at intervals: `if (i % 50 === 0) console.log('Alpha:', simulation.alpha())`

**Warning signs:**
- Positions differ between page loads despite same seed
- Nodes cluster at canvas edges (forces pulling too hard)
- Console shows 300 iterations reached without alpha < 0.001

### Pitfall 3: Performance Degradation with Many Nodes

**What goes wrong:** Simulation takes seconds instead of milliseconds as node count grows, UI feels laggy on data load.

**Why it happens:** 
- O(n²) collision checks without spatial acceleration (if not using D3's built-in quadtree)
- Running simulation with animation (ticks every frame for 300 iterations)
- Recalculating layout on every component render

**How to avoid:**
- Always use synchronous tick loop (not animated simulation)
- D3-force automatically uses quadtree for forceCollide() (no extra config needed)
- Memoize positioned nodes (only recalculate when timeline data changes)
- For >100 nodes, consider viewport culling (only simulate visible nodes)

**Warning signs:**
- Browser freezes during layout calculation
- Chrome DevTools shows >500ms in positionNodes()
- FPS drops below 60 during pan/zoom after layout

**Benchmark targets:**
- 11 nodes (current): <10ms ✓
- 50 nodes: <100ms ✓
- 100 nodes: <300ms (acceptable on load)

### Pitfall 4: SVG Overlay Not Syncing with Canvas Camera

**What goes wrong:** Timeline axis and connector lines don't move/zoom with canvas, or appear at wrong positions.

**Why it happens:** 
- SVG viewBox not updated when tldraw camera changes
- Coordinate mismatch (SVG world coordinates vs screen coordinates)
- Forgetting to scale stroke width (lines appear thicker/thinner when zoomed)

**How to avoid:**
- Listen to tldraw camera changes: `editor.sideEffects.registerAfterChangeHandler('camera', updateViewBox)`
- Set SVG viewBox to match camera: `viewBox="${camera.x} ${camera.y} ${width/zoom} ${height/zoom}"`
- Scale stroke width inversely: `strokeWidth={1 / zoom}` keeps lines constant screen pixels

**Warning signs:**
- Lines visible at initial load but disappear after pan/zoom
- Lines appear in wrong position (offset from nodes)
- Lines become thick/thin during zoom (not scaling properly)

### Pitfall 5: LocalStorage Quota/Privacy Mode Crashes

**What goes wrong:** `localStorage.setItem()` throws exception, app crashes instead of degrading gracefully.

**Why it happens:**
- Safari private mode blocks localStorage
- Storage quota exceeded (other apps filled limit)
- Browser privacy settings disable storage

**How to avoid:**
- Wrap localStorage calls in try/catch
- Fallback to in-memory seed if storage unavailable
- Test in private browsing mode during development

**Warning signs:**
- App works in normal mode but crashes in private mode
- Error: "QuotaExceededError: DOM Exception 22"
- Users report "blank screen" in certain browsers

**Verification:**
```typescript
// Test in Safari private mode
// Test in Chrome incognito
// Test with localStorage.clear() then rapidly reload (quota exhaustion)
```

## Code Examples

Verified patterns from D3-force official documentation and community examples:

### Basic Force Simulation Setup

```typescript
// Source: https://d3js.org/d3-force (official docs)
import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force'
import { randomLcg } from 'd3-random'

function layoutTimeline(nodes: ContentNode[], seed: number) {
  const random = randomLcg(seed)
  
  // Initialize simulation nodes
  const simNodes = nodes.map(node => ({
    ...node,
    x: dateToX(node.date),
    y: (random() - 0.5) * 1000
  }))
  
  const simulation = forceSimulation(simNodes)
    .force('collide', forceCollide(radius))
    .force('x', forceX(d => dateToX(d.date)).strength(0.5))
    .force('y', forceY(0).strength(0.1))
    .stop()
  
  // Tick to convergence
  for (let i = 0; i < 300; ++i) simulation.tick()
  
  return simNodes
}
```

### Extracting Camera Transform from Tldraw

```typescript
// Source: tldraw v4.5 documentation (https://tldraw.dev)
import { useEditor } from 'tldraw'
import { useEffect, useState } from 'react'

function useViewportTransform() {
  const editor = useEditor()
  const [transform, setTransform] = useState(() => {
    const camera = editor.getCamera()
    return { x: camera.x, y: camera.y, zoom: camera.z }
  })
  
  useEffect(() => {
    const removeListener = editor.sideEffects.registerAfterChangeHandler(
      'camera',
      () => {
        const camera = editor.getCamera()
        setTransform({ x: camera.x, y: camera.y, zoom: camera.z })
      }
    )
    return removeListener
  }, [editor])
  
  return transform
}
```

### Date Range Calculation

```typescript
// Calculate date range for scaling
function getDateRange(nodes: ContentNode[]) {
  const timestamps = nodes.map(n => new Date(n.date).getTime())
  return {
    oldest: new Date(Math.min(...timestamps)),
    newest: new Date(Math.max(...timestamps)),
    spanDays: (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)
  }
}

// Usage: scale horizontal axis based on span
const range = getDateRange(nodes)
const pxPerDay = range.spanDays < 365 ? 5 : 2 // Dense: 5px/day, sparse: 2px/day
```

### Memoized Positioned Nodes (React)

```typescript
// Only recalculate when timeline data changes
import { useMemo } from 'react'

function Canvas() {
  const { data: timelineData } = useTimelineData()
  
  const positionedNodes = useMemo(() => {
    if (!timelineData) return []
    return positionTimelineNodes(timelineData.nodes)
  }, [timelineData])
  
  // Use positionedNodes for shape creation
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Type-based vertical zones (Phase 3 temporary) | Random scatter with physics (Phase 4) | 2026-03-23 | Creates organic constellation aesthetic, removes rigid categorization |
| Fixed horizontal spacing (-400px increments) | Variable density based on dates | 2026-03-23 | Dense activity periods visually cluster, sparse periods spread naturally |
| Manual collision loops | D3-force physics simulation | Industry standard since ~2010 | O(n log n) with quadtree vs O(n²) manual checks |
| Math.random() for layout | Seeded randomLcg() | D3 v5+ (2018) | Deterministic layouts enable testing, reproducible bugs, consistent UX |

**Deprecated/outdated:**
- **D3 v3 force layout:** Pre-2015 API used `force.start()` instead of `forceSimulation()`, different force API (don't follow old tutorials)
- **Canvas-only rendering:** Modern approach uses SVG overlays for decorative elements (easier transforms, declarative)
- **Animated physics demos:** While visually impressive, synchronous simulation is faster and simpler for static layouts

## Open Questions

1. **Exact force strengths for 11-node timeline**
   - What we know: D3 examples typically use forceX(0.5), forceY(0.1) for graph layouts
   - What's unclear: Optimal strength ratio for temporal clustering (might need 0.7 for stronger date gravity)
   - Recommendation: Start with 0.5/0.1, tune during implementation based on visual clustering

2. **Pixels-per-day scaling for 2020-2024 span**
   - What we know: Current data spans 1,705 days (2020-05-01 to 2024-12-31)
   - What's unclear: 2px/day = -3,410px leftmost node, 5px/day = -8,525px (which feels better?)
   - Recommendation: Implement both as constant, test visually, choose based on constellation spacing

3. **Adaptive vertical range formula**
   - What we know: Should expand as node count grows (50+ nodes need wider scatter)
   - What's unclear: Linear? Logarithmic? `initialY = (random() - 0.5) * (500 + nodeCount * 10)`?
   - Recommendation: Start fixed ±500px for 11 nodes, defer adaptive formula until >30 nodes tested

4. **Hub fade distance (currently 500px)**
   - What we know: CONTEXT.md specifies fade starts ~500px before hub
   - What's unclear: Should fade be linear or eased (easeOutQuad)?
   - Recommendation: Implement linear first (`opacity = distance / 500`), add easing if feels abrupt

5. **Performance threshold for viewport culling**
   - What we know: Current 11 nodes = <10ms, benchmark estimates 100 nodes = ~300ms
   - What's unclear: At what count does synchronous simulation feel laggy? (50? 100? 200?)
   - Recommendation: Defer optimization until real-world testing with 50+ nodes, implement if >100ms

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.0 |
| Config file | None — Vite built-in (vite.config.ts defines plugins) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (no watch mode) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TIME-01 | Timeline extends left from hub (negative X) | unit | `npm test tests/layout.test.ts -t "negative X"` | ❌ Wave 0 |
| TIME-02 | Chronological positioning (oldest = farthest left) | unit | `npm test tests/layout.test.ts -t "chronological"` | ❌ Wave 0 |
| TIME-03 | Most recent entries closest to hub | unit | `npm test tests/layout.test.ts -t "recent closest"` | ❌ Wave 0 |
| TIME-04 | YouTube shape renders correctly | integration | Manual visual check in browser | ✅ Phase 3 |
| TIME-05 | Blog shape renders correctly | integration | Manual visual check in browser | ✅ Phase 3 |
| TIME-06 | Project shape renders correctly | integration | Manual visual check in browser | ✅ Phase 3 |
| TIME-07 | Milestone shape renders correctly | integration | Manual visual check in browser | ✅ Phase 3 |

### Sampling Rate
- **Per task commit:** `npm test` (runs all unit tests, <5s)
- **Per wave merge:** `npm test` + manual browser check (pan left, verify chronology, check spacing)
- **Phase gate:** Full suite green + visual verification (11 nodes scatter correctly, no overlaps, axis renders) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/layout.test.ts` — covers TIME-01, TIME-02, TIME-03 (unit tests for positionTimelineNodes)
  - Verify all X coordinates are negative
  - Verify nodes sorted by date have X sorted ascending (oldest = most negative)
  - Verify newest node has X closest to 0
  - Verify no overlaps (pairwise distance checks)
  - Verify collision padding (minimum 150px gaps)
- [ ] `tests/dateUtils.test.ts` — date-to-X mapping edge cases
  - Same date handling (different Y, same X)
  - Date parsing (ISO 8601 format)
  - Oldest node maps to most negative X
- [ ] `tests/sessionSeed.test.ts` — localStorage seeding
  - Seed persists within 24 hours
  - Seed regenerates after 24 hours
  - Fallback when localStorage unavailable
- [ ] Install d3-force, d3-random: `npm install d3-force d3-random`

## Sources

### Primary (HIGH confidence)
- **npm registry d3-force v3.0.0** (2022-06-14) — Current version verified via `npm view`
- **npm registry d3-random v3.0.1** (2023-04-26) — Current version verified via `npm view`
- **GitHub d3/d3-force** (https://github.com/d3/d3-force) — Official repository, ~1,951 stars, README documentation
- **D3 official docs** (https://d3js.org/d3-force) — API reference, force types, examples
- **Observable D3-force examples** (https://observablehq.com/collection/@d3/d3-force) — Community patterns, collision detection demos
- **tldraw v4.5 docs** (https://tldraw.dev) — Camera API, useEditor hook, sideEffects.registerAfterChangeHandler
- **Vitest v4.1.0** (package.json) — Verified via `npm test -- --version`

### Secondary (MEDIUM confidence)
- **npm registry rbush v4.0.1** (2024-07-25) — Verified via `npm view`, spatial indexing for future optimization
- **Phase 1-3 execution history** (.planning/STATE.md) — Established patterns (60 FPS target, 280x200px shapes, hub at x=0/y=0)
- **CONTEXT.md decisions** — User constraints (constellation scatter, 150px padding, variable density)

### Tertiary (LOW confidence)
- **D3 community best practices** (Observable forums, Stack Overflow) — Force strength tuning (0.5/0.1 typical starting point), marked for validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — D3-force v3.0.0 verified current, npm registry confirms publish dates
- Architecture: HIGH — Patterns sourced from official D3 docs, tldraw v4.5 docs, verified code examples
- Pitfalls: MEDIUM — Based on common D3-force issues documented in community (Observable forums, GitHub issues), not project-specific testing yet
- Performance: MEDIUM — Benchmark estimates based on D3 community reports (not measured in this codebase), need validation with 50+ nodes

**Research date:** 2026-03-23  
**Valid until:** ~30 days (D3-force stable, unlikely breaking changes in v3.x maintenance cycle)
