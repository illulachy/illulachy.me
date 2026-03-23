# Roadmap: illulachy.me

**Project:** Infinite Canvas Portfolio Timeline  
**Created:** 2025-01-19  
**Granularity:** Standard  
**Total Phases:** 6  

## Phases

- [x] **Phase 1: Canvas Foundation** - Infinite canvas with pan/zoom navigation working smoothly (completed 2026-03-22)
- [x] **Phase 2: Content Pipeline** - Markdown authoring workflow processing to bundled JSON (completed 2026-03-23)
- [x] **Phase 3: Custom Shapes & Hub** - Portfolio hub and clickable timeline nodes rendering on canvas (completed 2026-03-23)
- [x] **Phase 4: Timeline Layout** - Chronological positioning with collision detection (completed 2026-03-23)
- [x] **Phase 5: UI Chrome** - Loading states, responsive layout, and visual polish (completed 2026-03-23)
- [ ] **Phase 6: Game Mode** - Spaceship navigation with arrow key controls

## Phase Details

### Phase 1: Canvas Foundation
**Goal:** User can pan and zoom an infinite canvas smoothly at 60 FPS  
**Depends on:** Nothing (first phase)  
**Requirements:** TECH-01, TECH-02, TECH-04, TECH-05, CANVAS-01, CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05, CANVAS-06  
**Success Criteria** (what must be TRUE):
  1. User can drag the canvas with mouse and it pans smoothly
  2. User can zoom the canvas using scroll wheel without frame drops
  3. User can pan and zoom using touch gestures on mobile (drag, pinch-to-zoom)
  4. User can navigate using arrow keys to move viewport
  5. Canvas maintains 60 FPS during all interactions (measured with Chrome DevTools)
  6. Canvas displays loading spinner while initializing before first paint
**Plans:** 1 plan (01-PLAN.md) — 4 waves, 14 tasks

Plans:
- [ ] 01-PLAN.md — Wave 0: Setup & Validation (3 tasks) → Wave 1: Core Canvas (4 tasks) → Wave 2: Controls & Polish (3 tasks) → Wave 3: Integration & Verification (4 tasks)

### Phase 2: Content Pipeline
**Goal:** Content is authored in markdown and bundled as JSON at build time  
**Depends on:** Phase 1 (needs TypeScript types from foundation)  
**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, TECH-03  
**Success Criteria** (what must be TRUE):
  1. Developer can create markdown file with YAML frontmatter (date, title, URL, type) and it validates at build time
  2. Build process parses markdown files and outputs timeline.json with all entries
  3. At least 10-20 sample entries exist spanning multiple content types (YouTube, blog, project, milestone)
  4. Timeline JSON loads at runtime without parsing markdown
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Core pipeline: TypeScript types, generator script with gray-matter/zod/fast-glob, unit tests
- [ ] 02-02-PLAN.md — Integration: Vite plugin with chokidar watch mode, 12 sample content entries, timeline.json generation

### Phase 3: Custom Shapes & Hub
**Goal:** Portfolio hub and timeline nodes render as custom tldraw shapes with click handlers  
**Depends on:** Phase 2 (needs content data to render)  
**Requirements:** HUB-01, HUB-02, HUB-03, INT-01, INT-02, INT-03, INT-04, INT-05  
**Success Criteria** (what must be TRUE):
  1. Central portfolio node (16:9) displays in center of canvas on load showing "about me" content
  2. Portfolio hub is visually distinct from timeline nodes (different styling/size)
  3. User can click YouTube node and it opens video in YouTube (new tab)
  4. User can click blog/note node and it opens letters.illulachy.me (new tab)
  5. User can click project node and it opens external project URL (new tab)
  6. User can click milestone node and details display (inline or modal)
  7. All nodes show hover states (cursor pointer, visual feedback) indicating they're clickable
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Types, about.md pipeline, 5 custom shape utils (Hub, YouTube, Blog, Project, Milestone), positioning utility
- [x] 03-02-PLAN.md — Data fetching hooks, MilestoneModal, Canvas integration with shapes and click handlers

### Phase 4: Timeline Layout
**Goal:** Timeline nodes are positioned chronologically with no overlaps using D3-force physics simulation  
**Depends on:** Phase 3 (needs shape dimensions for collision detection)  
**Requirements:** TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, TIME-06, TIME-07  
**Success Criteria** (what must be TRUE):
  1. Timeline extends left from portfolio node (horizontal axis represents time)
  2. Nodes are positioned chronologically with oldest entries farthest left
  3. Most recent entries appear closest to portfolio hub
  4. Nodes with same/close dates don't overlap (collision detection working)
  5. All 4 content types (YouTube, blog, project, milestone) render correctly with appropriate visual styling
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Core algorithm: D3-force simulation, date-to-X mapping, session seeding, collision detection (TIME-01, TIME-02, TIME-03)
- [x] 04-02-PLAN.md — Visual axis: SVG overlay with timeline axis and node connectors synchronized to camera (TIME-04, TIME-05, TIME-06, TIME-07)

### Phase 5: UI Chrome
**Goal:** Site is visually polished with loading states and responsive layout  
**Depends on:** Phase 1 (needs canvas to wrap UI around)  
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05  
**Success Criteria** (what must be TRUE):
  1. Site uses Tailwind CSS v4 for all styling outside canvas
  2. UI components (header, nav if any) built with shadcn/ui components
  3. Animations (loading spinner, transitions) powered by Motion.dev
  4. Site is fully responsive on mobile (touch works) and desktop (mouse works)
  5. Loading spinner displays during initial canvas load and hides when ready
**Plans:** 2/2 plans complete

Plans:
- [x] 05-01-PLAN.md — Foundation: Install Tailwind v4, Motion.dev, shadcn/ui; Create @theme config with design tokens; Create cn() utility and Dialog component (UI-01, UI-02, UI-03)
- [x] 05-02-PLAN.md — Component Migration: Migrate CanvasControls/CanvasLoader/MilestoneModal to Tailwind; Add Motion.dev exit animations; Make modal responsive (UI-04, UI-05)

### Phase 6: Game Mode
**Goal:** User can toggle spaceship navigation mode with arrow keys  
**Depends on:** Phase 4 (needs node positions for arrow key traversal)  
**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04  
**Success Criteria** (what must be TRUE):
  1. User can press hotkey (G key) to toggle game mode on/off
  2. Game mode displays spaceship cursor (custom CSS cursor)
  3. User can navigate between timeline nodes using arrow keys in game mode
  4. Visual indicator shows when game mode is active (toggle state visible)
**Plans:** TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Canvas Foundation | 1/1 | Complete ✓ | 2026-03-22 |
| 2. Content Pipeline | 2/2 | Complete ✓  | 2026-03-23 |
| 3. Custom Shapes & Hub | 2/2 | Complete ✓ | 2026-03-23 |
| 4. Timeline Layout | 2/2 | Complete ✓ | 2026-03-23 |
| 5. UI Chrome | 2/2 | Complete    | 2026-03-23 |
| 6. Game Mode | 0/0 | Not started | - |

## Coverage

**v1 Requirements:** 34 total  
**Mapped to phases:** 34 ✓  
**Unmapped:** 0 ✓  

All v1 requirements covered across 6 phases.

---
*Roadmap created: 2025-01-19*  
*Last updated: 2025-01-19*
