---
phase: 03-custom-shapes-hub
plan: 01
subsystem: shapes
tags:
  - tldraw
  - custom-shapes
  - glassmorphism
  - hover-states
  - content-pipeline
dependency_graph:
  requires:
    - phase-02-content-pipeline
  provides:
    - custom-shape-utils
    - about-data-pipeline
    - temporary-positioning
  affects:
    - canvas-rendering
tech_stack:
  added:
    - tldraw-custom-shapes
  patterns:
    - BaseBoxShapeUtil-extension
    - module-augmentation
    - react-hooks-in-shapes
key_files:
  created:
    - src/types/about.ts
    - src/types/shapes.ts
    - content/about.md
    - public/about.json
    - src/components/shapes/HubShape.tsx
    - src/components/shapes/YouTubeNodeShape.tsx
    - src/components/shapes/BlogNodeShape.tsx
    - src/components/shapes/ProjectNodeShape.tsx
    - src/components/shapes/MilestoneNodeShape.tsx
    - src/components/shapes/index.ts
    - src/lib/positionNodes.ts
    - tests/about.test.ts
  modified:
    - src/types/index.ts
    - scripts/generate-timeline.ts
decisions:
  - decision: Used TLShape (not TLBaseShape) for shape type definitions
    rationale: TLShape is the correct type from tldraw v4.5 - requires only type parameter
    alternatives_considered:
      - TLBaseShape (requires 2 type parameters, incorrect API)
    impact: All shape utils compile correctly with proper type safety
  - decision: Separate shape util files with module augmentation in each
    rationale: Keeps type declarations close to implementation, clearer separation of concerns
    alternatives_considered:
      - Single shapes.ts with all augmentations (would be complex and hard to maintain)
    impact: More files but better organization and maintainability
  - decision: Used T.jsonValue with type assertion for social object in HubShape
    rationale: tldraw validators don't support nested object schemas, jsonValue accepts any JSON
    alternatives_considered:
      - Custom validator (too complex for optional field)
      - Flatten social fields (breaks about.md schema consistency)
    impact: Social field validates as JSON but not type-checked at shape level
  - decision: Phase 3 temporary positioning (type-based vertical separation)
    rationale: Simple algorithm allows testing interactions, Phase 4 will replace with chronological layout
    alternatives_considered:
      - Implement full layout algorithm now (would delay Phase 3 completion)
    impact: Nodes visible and interactive for testing, will be replaced in Phase 4
metrics:
  duration_minutes: 8
  tasks_completed: 3
  commits: 3
  tests_added: 5
  files_created: 12
  lines_added: 1347
  completed: 2026-03-23T05:05:42Z
---

# Phase 03 Plan 01: Shape Utils Foundation Summary

**Built the foundation for Phase 3:** AboutData types, content pipeline extension, and all 5 custom tldraw shape utilities with glassmorphism styling and hover states.

## What Was Built

### Task 1: AboutData Types and Generator Extension (TDD)
**Completed:** 34ad13d

Created AboutData type system and extended the generator to process about.md:
- **AboutData schema:** Zod validation for name, title, bio (required), avatar, email, social (optional)
- **Generator extension:** `processAboutFile()` function reads content/about.md, validates, outputs public/about.json
- **Content file:** Created about.md with sample data (Thuy Hoang profile)
- **Testing:** 5 unit tests covering schema validation, required fields, optional fields
- **Build integration:** Excluded about.md from timeline processing (ignore pattern in fast-glob)

**TDD flow:** Tests written first (RED), implementation followed (GREEN), verified with `npm run generate` producing about.json

### Task 2: Shape Type Declarations
**Completed:** 1928882

Created tldraw shape type constants in src/types/shapes.ts:
- **SHAPE_TYPES:** Constants for 5 shape types (hub-shape, youtube-node, blog-node, project-node, milestone-node)
- **ShapeType:** Union type for type safety
- **Module augmentation:** Deferred to individual shape util files for better organization

### Task 3: Five Custom Shape Utils with Hover States
**Completed:** eea3234

Implemented all 5 shape utilities with complete tldraw integration:

**1. HubShape (640x360px):**
- Portfolio hub with about me content (name, title, bio, avatar, social icons)
- Noto Serif for name (display font), Space Grotesk for title
- Avatar circular with fallback on error
- Social icons display-only (not interactive per CONTEXT.md)
- Hover state with mauve glow (even though not clickable, for visual consistency)

**2. YouTubeNodeShape (280x200px):**
- Video thumbnail with play button overlay
- 70% image area, 30% title bar with video icon
- Simulated video scrubber bar at bottom
- Gradient placeholder fallback when no thumbnail
- onClick: `window.open(url, '_blank', 'noopener,noreferrer')`
- Skeleton loading state with fade-in transition

**3. BlogNodeShape (280x200px):**
- Document card with document icon (📝)
- Title (2-line clamp), date with calendar icon, description (2-line clamp)
- Page corner fold effect (CSS border trick)
- onClick: Opens blog URL in new tab

**4. ProjectNodeShape (280x200px):**
- Code/terminal window aesthetic with window chrome (colored dots)
- Thumbnail or gradient placeholder with code brackets `{ }`
- Title bar with code icon `</>`
- Tech badge positioned top-right if tech field present
- onClick: Opens project URL in new tab

**5. MilestoneNodeShape (280x200px):**
- Achievement badge aesthetic with trophy icon (🏆)
- Title (center-aligned), institution, date with calendar icon
- Star decorations in corners, ribbon effect at bottom
- onClick: Dispatches `openMilestoneModal` custom event (Phase 3 Plan 2 will handle modal)

**Shared features (all shapes):**
- Glassmorphism styling: `var(--glass-bg)`, `backdropFilter: blur(var(--glass-blur))`
- Hover states: Border changes to `var(--interactive-hover)`, `scale(1.02)`, increased shadow
- Pointer cursor on all nodes (even hub for consistency)
- `pointerEvents: 'all'` enables interaction
- Transition: `all var(--motion-hover)` for smooth animations
- `canEdit: false`, `canResize: false` (shapes are static)

**6. Positioning Utility (src/lib/positionNodes.ts):**
- `positionTimelineNodes()`: Type-based vertical separation algorithm
  - Horizontal: All nodes left from hub (-400px increments)
  - Vertical: youtube/blog above (y=+100, +200...), milestone/project below (y=-100, -200...)
- `HUB_POSITION`: {x: 0, y: 0} constant
- `PositionedNode` interface for return type
- **Note:** Temporary algorithm, Phase 4 will replace with chronological layout

**7. Shape Utils Export (src/components/shapes/index.ts):**
- `customShapeUtils` array exports all 5 utils for tldraw registration
- Individual exports for direct access

## Deviations from Plan

### Auto-fixed Issues (Deviation Rule 1 & 2)

**1. [Rule 2 - Missing Critical Functionality] Generator excluded about.md from timeline processing**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Generator was processing about.md as a timeline entry, causing validation failure
- **Fix:** Added `ignore: ['content/about.md']` to fast-glob options in generate-timeline.ts
- **Files modified:** scripts/generate-timeline.ts
- **Rationale:** about.md has different schema (no type/date fields), must be processed separately
- **Commit:** Included in 34ad13d

**2. [Rule 1 - Bug] Fixed TLBaseShape → TLShape type usage**
- **Found during:** Task 3 compilation
- **Issue:** Used TLBaseShape (wrong type, requires 2 parameters) instead of TLShape (correct, 1 parameter)
- **Fix:** Changed all shape type definitions to use TLShape from tldraw v4.5 API
- **Files modified:** All 5 shape util files
- **Rationale:** TLShape is the correct type per tldraw v4.5 documentation and RESEARCH.md examples
- **Commit:** Included in eea3234

**3. [Rule 2 - Missing Critical Functionality] Type-only imports for TypeScript verbatimModuleSyntax**
- **Found during:** Task 3 compilation
- **Issue:** TypeScript errors due to `verbatimModuleSyntax` requiring type-only imports
- **Fix:** Changed imports to `import type { RecordProps, TLShape }` in all shape files
- **Files modified:** All 5 shape util files
- **Rationale:** Project uses strict TypeScript config, type imports required for proper compilation
- **Commit:** Included in eea3234

**4. [Rule 2 - Missing Critical Functionality] Social field validator using T.jsonValue**
- **Found during:** Task 3 compilation
- **Issue:** T.object.optional() not compatible with nested social object schema
- **Fix:** Used `T.jsonValue.optional() as any` for social field in HubShape
- **Files modified:** src/components/shapes/HubShape.tsx
- **Rationale:** tldraw validators don't support nested object schemas, jsonValue accepts any JSON structure
- **Impact:** Social field validates but not strictly type-checked (acceptable for optional display-only field)
- **Commit:** Included in eea3234

## Requirements Fulfilled

From ROADMAP.md Phase 3 requirements:

✅ **HUB-01:** Central portfolio node (16:9) displays in center of canvas
- HubShape created with 640x360px size (16:9 aspect ratio)
- HUB_POSITION constant defines center position (x=0, y=0)

✅ **HUB-02:** Portfolio node shows "about me" content
- AboutData type and schema created
- about.md → about.json pipeline implemented
- HubShape renders name, title, bio, avatar, social icons

✅ **HUB-03:** Portfolio node visually distinct from timeline nodes
- Size: 640x360 vs 280x200 (more than 2x larger)
- Content: About me vs timeline entry data
- Layout: Vertical content flow vs compact node layouts

✅ **INT-05:** Nodes have hover states (glow, cursor pointer)
- All 5 shapes implement hover state with useState
- Border changes to mauve (`var(--interactive-hover)`)
- Scale transform (1.02x), increased shadow
- Cursor: pointer on all shapes

**Partial (Phase 3 Plan 2 will complete):**
- INT-01, INT-02, INT-03: Click handlers implemented (onClick methods in shape utils)
- INT-04: Milestone click dispatches custom event (modal component in Plan 2)

## Testing

**Unit tests (Task 1 TDD):**
- ✅ aboutSchema accepts valid frontmatter with required fields
- ✅ aboutSchema rejects missing required field (name)
- ✅ aboutSchema rejects missing required field (title)
- ✅ aboutSchema rejects missing required field (bio)
- ✅ aboutSchema accepts optional fields (avatar, email, social)

**Build verification:**
- ✅ `npm run generate-timeline` produces both timeline.json and about.json
- ✅ `npm run build` compiles without errors
- ✅ All shape utils TypeScript compilation successful
- ✅ customShapeUtils array exports correctly

**Manual verification needed (Phase 3 Plan 2):**
- Shape rendering on canvas (requires integration with Canvas component)
- Hover states functional (requires tldraw editor instance)
- Click handlers trigger URL opens / modal event

## Files Created

**Types & Schemas (3):**
- src/types/about.ts (AboutData interface, aboutSchema zod validation)
- src/types/shapes.ts (SHAPE_TYPES constants, ShapeType union)
- tests/about.test.ts (5 unit tests for aboutSchema)

**Content & Generated (2):**
- content/about.md (about me frontmatter content)
- public/about.json (generated from about.md)

**Shape Utilities (6):**
- src/components/shapes/HubShape.tsx (portfolio hub, 640x360)
- src/components/shapes/YouTubeNodeShape.tsx (video thumbnail node)
- src/components/shapes/BlogNodeShape.tsx (document card node)
- src/components/shapes/ProjectNodeShape.tsx (code window node)
- src/components/shapes/MilestoneNodeShape.tsx (achievement badge node)
- src/components/shapes/index.ts (customShapeUtils export)

**Utilities (1):**
- src/lib/positionNodes.ts (temporary positioning algorithm)

## Files Modified

- src/types/index.ts (added about and shapes exports)
- scripts/generate-timeline.ts (added processAboutFile, about.json generation, about.md ignore)

## Next Steps (Phase 3 Plan 2)

**Immediate dependencies:**
1. Create data fetching hooks (useTimelineData, useAboutData)
2. Implement MilestoneModal component (React portal for modal overlay)
3. Integrate shape utils with Canvas component (pass to Tldraw shapeUtils prop)
4. Create shapes from timeline + about data using positionNodes utility
5. Add modal state management and event listener for milestone clicks
6. Verify all click handlers and hover states work in browser

**Verification:**
- Visual test: See 12 shapes on canvas (11 timeline + 1 hub)
- Interaction test: Click YouTube/blog/project → new tab opens
- Interaction test: Click milestone → modal appears
- Interaction test: Hover any shape → mauve glow appears

## Self-Check: PASSED

**Verified created files exist:**
```bash
✓ src/types/about.ts
✓ src/types/shapes.ts
✓ content/about.md
✓ public/about.json
✓ src/components/shapes/HubShape.tsx
✓ src/components/shapes/YouTubeNodeShape.tsx
✓ src/components/shapes/BlogNodeShape.tsx
✓ src/components/shapes/ProjectNodeShape.tsx
✓ src/components/shapes/MilestoneNodeShape.tsx
✓ src/components/shapes/index.ts
✓ src/lib/positionNodes.ts
✓ tests/about.test.ts
```

**Verified commits exist:**
```bash
✓ 34ad13d: test(03-01): add failing tests for AboutData schema
✓ 1928882: feat(03-01): add tldraw shape type constants
✓ eea3234: feat(03-01): create 5 custom shape utils with hover states
```

**Build verification:**
```bash
✓ npm run generate-timeline → about.json created with "name" field
✓ npm test -- about.test.ts → 5/5 tests passed
✓ npm run build → dist/ directory created, no compilation errors
```

All artifacts accounted for. Plan 03-01 successfully completed.
