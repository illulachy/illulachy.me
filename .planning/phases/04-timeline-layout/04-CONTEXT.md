# Phase 4: Timeline Layout - Context

**Gathered:** 2026-03-23  
**Status:** Ready for research and planning

<domain>
## Phase Boundary

Timeline nodes are positioned chronologically with no overlaps. The algorithm replaces Phase 3's temporary type-based positioning with date-driven layout that respects time, prevents collisions, and creates visual breathing room.

**What this phase delivers:** Chronological horizontal axis with intelligent vertical distribution, collision detection that maintains generous padding, and an organic constellation aesthetic that scales gracefully as entries grow.

**What this phase does NOT include:**
- Timeline axis styling (within scope if minimal)
- Animation/transitions between positions (Phase 5 polish)
- Performance optimization for 200+ nodes (Phase 5 if needed)

</domain>

<decisions>
## Implementation Decisions

### Vertical Distribution Strategy

**Organic constellation scatter** with temporal gravity:
- Nodes scatter above/below the timeline axis with a "scattered like stars/constellation" aesthetic
- **No rigid patterns** - no zigzag, no type-based zones, no fill-above-then-below
- **Completely random vertical placement** regardless of content type (YouTube, blog, project, milestone all treated equally)
- **Natural flow** - no requirement for balanced distribution above/below axis

**Temporal gravity clustering:**
- Nodes with close dates form **tight clusters** spatially (temporal gravity)
- Activity-dense periods naturally group together visually
- Sparse periods spread out more loosely
- Creates visual narrative: "busy months" vs "quiet periods" visible at a glance

**Vertical range:**
- **Adaptive** - expands based on node count
- With 11 nodes, keep relatively compact
- As collection grows to 50+, allow wider vertical spread
- No fixed upper limit - let physics determine natural spacing

**Consistency with variation:**
- **Session-based seeding** - same pattern within a single visit
- **Slight variation between visits** - creates freshness without chaos
- Deterministic enough to feel stable, organic enough to feel alive

### Collision Resolution

**Force-directed physics simulation:**
- Primary approach: Use physics engine (D3-force or similar) to handle all collision resolution
- Nodes push each other apart using simulated repulsion forces
- Temporal gravity acts as attractive force for close dates
- System stabilizes naturally without cascading push logic

**Generous padding:**
- **150px+ minimum gap** between any two nodes
- Nodes should feel spacious, not cramped
- Constellation metaphor requires breathing room

**Horizontal flexibility:**
- **Allow significant horizontal shift** if needed for collision resolution (chronology approximate, not pixel-precise)
- Visual clarity and constellation aesthetic take priority over exact chronological positioning
- Dates still flow left-to-right generally, but not rigidly

**Pushing behavior:**
- When nodes overlap, **push significantly away** to create clear space (not minimal nudges)
- Let physics simulation determine exact push distances
- Multiple iterations until system stabilizes with no overlaps

### Spacing & Density

**Horizontal timeline scale:**
- **Variable density** - dense activity periods compressed, sparse periods stretched
- Do NOT use fixed pixels-per-year - let node density determine spacing
- Algorithm should detect clusters (many nodes in short time span) and spread them appropriately

**Growth strategy:**
- **Scale up** as timeline grows - timeline extends further left as entries accumulate
- Never compress nodes to fit in fixed space
- Maintain constellation spaciousness even with 100+ nodes

**Natural physics-driven scale:**
- No predefined "oldest node should be at -X px" target
- Let force simulation, temporal gravity, and repulsion forces determine final positions
- Current 11 nodes (2020-2024) will naturally find their spacing

**No segmentation:**
- **Continuous flow** - no breaks, chapters, or gaps
- No year markers or milestone-based sections
- Timeline is one unbroken stream from oldest to newest

### Visual Timeline Axis

**Subtle horizontal line:**
- **Faint guide line** runs horizontally through y=0
- Purpose: Provide subtle visual anchor, not dominate the view
- **Minimal style** - thin solid line (not dashed, not gradient)
- Color: Low-contrast with background (perhaps semi-transparent white/gray)

**Hub interaction:**
- Line **fades out near hub** (disappears in hub zone)
- Hub sits in the "present" but doesn't break the timeline visually
- Fade starts ~500px before hub, fully transparent at hub zone

**Node connectors:**
- **Subtle lines** from each node to timeline axis (y=0)
- Shows chronological anchoring even when nodes scatter vertically
- Same minimal style as axis line - thin, low-contrast
- Lines connect from node center/bottom to axis at node's chronological X position

### Claude's Discretion

The following areas are open to technical decisions during research and planning:

- **Physics engine choice** - D3-force vs custom simulation vs other library
- **Simulation parameters** - exact force strengths, iteration counts, damping
- **Adaptive vertical range formula** - how aggressively to expand based on node count
- **Session seed mechanism** - localStorage key structure, hash approach
- **Line rendering approach** - SVG layer vs Canvas API vs CSS
- **Fade transition curves** - easing functions for hub zone fade
- **Performance optimizations** - spatial indexing, viewport culling if needed
- **Edge case handling** - nodes with identical timestamps, missing dates

</decisions>

<specifics>
## Specific Ideas

**Visual metaphor:** "Scattered like stars/constellation"
- Organic, natural positioning
- Visually interesting to explore (not rigid grid/list)
- Each node feels like a point of light in the timeline journey

**User experience goals:**
- Pan left to explore older history (oldest entries farthest left)
- Visual clustering should make activity periods obvious (2023 was busy, 2021 was quiet)
- Generous spacing makes each node feel important, not crowded
- Timeline axis grounds the view without dominating it

**From prior phases:**
- Phase 1 established smooth 60 FPS pan/zoom (don't break this)
- Phase 3 established 280x200px uniform node size and hub at x=0, y=0
- Timeline currently has 11 entries (2020-2024) but will grow over time

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 4 — Success criteria (TIME-01 through TIME-07)
- `.planning/REQUIREMENTS.md` §Timeline Content — Detailed requirement definitions

### Existing Code
- `src/lib/positionNodes.ts` — Current temporary algorithm (to be replaced)
- `src/types/content.ts` — ContentNode interface with date field
- `src/types/shapes.ts` — SHAPE_TYPES constants, shape dimensions
- `src/components/Canvas.tsx` lines 80-120 — How positioned nodes are consumed
- `public/timeline.json` — Current data structure (11 nodes with dates)

### Prior Phase Context
- `.planning/phases/01-canvas-foundation/01-CONTEXT.md` — Canvas performance requirements
- `.planning/phases/03-custom-shapes-hub/03-CONTEXT.md` — Node sizing decisions (280x200px uniform)
- `.planning/STATE.md` §Accumulated Context — Prior implementation decisions

### Design System
- `.stitch/TOKENS.md` — Color tokens (if exists - check during research)
- `.stitch/MOTION.md` — Animation timing (if exists)
- Note: Phase 1 established mauve accent (#E0AFFF) and glassmorphism aesthetic

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Implementation
- **positionNodes.ts**: Temporary algorithm places nodes at `-400 * (index + 1)` horizontally, type-based vertical (+100 per node above, -100 below)
- **ContentNode interface**: Has `date: string` (ISO 8601 format), `type`, `id`, plus metadata
- **Timeline data**: 11 nodes ranging 2020-05-01 to 2024-12-31
- **Shape dimensions**: All timeline nodes are 280x200px (width x height) - consistent for collision math
- **Hub position**: Hardcoded at `{ x: 0, y: 0 }` - this is the "present" anchor point

### Reusable Assets
- **getViewportDimensions()**: From cameraUtils.ts - could inform adaptive vertical range
- **Canvas.tsx useEffect**: Creates shapes from positioned nodes - new algorithm must output same `PositionedNode[]` interface
- **HUB_POSITION constant**: Export from positionNodes.ts that Canvas.tsx uses

### Integration Points
- **Canvas.tsx line 81**: Calls `positionTimelineNodes(timelineData.nodes)` → returns `PositionedNode[]`
- **Canvas.tsx line 83**: Iterates positioned nodes and calls `editor.createShape()` at calculated x,y
- **Must maintain**: `PositionedNode` interface signature (node, x, y)
- **Must maintain**: `HUB_POSITION` constant export

### Established Patterns
- **Date handling**: Phase 2 normalizes partial dates (2024-03 → 2024-03-01T00:00:00.000Z)
- **Performance target**: 60 FPS from Phase 1 - new algorithm must not degrade
- **Data flow**: timeline.json → useTimelineData hook → Canvas → positionNodes → shapes

### Constraints
- **X-axis direction**: Must be negative (left from hub) - established in Phase 3
- **Node sizes are locked**: 280x200px cannot change (would break shapes)
- **Hub cannot move**: x=0, y=0 is canonical "present" position
- **No mutation**: positionNodes must be pure function (no side effects)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

User focused on layout algorithm specifics without suggesting new capabilities or features for future phases.

</deferred>

---

*Phase: 04-timeline-layout*  
*Context gathered: 2026-03-23*
