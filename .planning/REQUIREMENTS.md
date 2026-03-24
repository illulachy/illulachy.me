# Requirements: illulachy.me

**Defined:** 2026-03-22
**Core Value:** The canvas must feel smooth and intuitive to explore — pan/zoom navigation works flawlessly, and the timeline layout clearly communicates my journey over time.

## v1 Requirements

### Canvas Foundation

- [x] **CANVAS-01**: User can pan the canvas by dragging with mouse
- [x] **CANVAS-02**: User can zoom the canvas using scroll wheel
- [x] **CANVAS-03**: User can pan and zoom using touch gestures on mobile (drag, pinch-to-zoom)
- [x] **CANVAS-04**: User can navigate using arrow keys
- [x] **CANVAS-05**: Canvas maintains 60 FPS performance during pan/zoom
- [x] **CANVAS-06**: Canvas displays loading state while initializing

### Portfolio Hub

- [x] **HUB-01**: Central portfolio node (16:9 aspect ratio) displays in center of canvas on load
- [x] **HUB-02**: Portfolio node shows "about me" content
- [x] **HUB-03**: Portfolio node is visually distinct from timeline nodes

### Timeline Content

- [x] **TIME-01**: Timeline extends left from portfolio node
- [x] **TIME-02**: Timeline nodes are positioned chronologically (oldest = farthest left)
- [x] **TIME-03**: Most recent entries appear closest to portfolio hub
- [ ] **TIME-04**: YouTube content displays as thumbnail node
- [ ] **TIME-05**: Blog/note content displays as card node
- [ ] **TIME-06**: Project content displays as card node
- [ ] **TIME-07**: Milestone/education content displays as card node

### Interactivity

- [x] **INT-01**: User can click YouTube node to open video in YouTube
- [x] **INT-02**: User can click blog/note node to open letters.illulachy.me
- [x] **INT-03**: User can click project node to open external project URL
- [x] **INT-04**: User can click milestone node to view details
- [x] **INT-05**: Nodes have hover states showing they're clickable

### Game Mode

- [x] **GAME-01**: User can toggle game mode with hotkey (e.g., 'G' key)
- [x] **GAME-02**: Game mode displays spaceship cursor
- [x] **GAME-03**: User can navigate between nodes using arrow keys in game mode
- [x] **GAME-04**: Game mode toggle is visually indicated

### Content Pipeline

- [x] **CONTENT-01**: Content is authored in markdown files with YAML frontmatter
- [x] **CONTENT-02**: Markdown files include date, title, URL, and content type in frontmatter
- [x] **CONTENT-03**: Content is processed at build time (not runtime)
- [x] **CONTENT-04**: Timeline data is bundled as JSON
- [x] **CONTENT-05**: At least 10-20 sample entries exist for testing

### UI & Polish

- [x] **UI-01**: Site uses Tailwind CSS v4 for styling
- [x] **UI-02**: UI components built with shadcn/ui
- [x] **UI-03**: Animations powered by Motion.dev
- [x] **UI-04**: Site is responsive on mobile and desktop
- [x] **UI-05**: Loading spinner displays during initial canvas load

### Technical Foundation

- [x] **TECH-01**: Built with Vite + React 19 + TypeScript
- [x] **TECH-02**: Infinite canvas powered by tldraw 4.5
- [x] **TECH-03**: Content parsing uses gray-matter + remark
- [x] **TECH-04**: Site deploys as static SPA
- [x] **TECH-05**: TypeScript types defined for all content structures

## v2 Requirements

### Monorepo & Blog

- **MONO-01**: Turborepo + pnpm monorepo structure
- **MONO-02**: Blog site at letters.illulachy.me integrated in monorepo
- **MONO-03**: Shared content package between portfolio and blog

### Search & Discovery

- **SEARCH-01**: User can search timeline entries by keyword
- **SEARCH-02**: User can filter timeline by content type
- **SEARCH-03**: User can filter timeline by date range

### Performance Optimization

- **PERF-01**: Lazy-loading for timeline segments (if needed beyond 200 nodes)
- **PERF-02**: Image optimization (WebP thumbnails)
- **PERF-03**: Bundle size under 500KB (gzipped)

### Enhanced Interactions

- **ENH-01**: Timeline nodes show preview on hover
- **ENH-02**: Smooth transitions between timeline sections
- **ENH-03**: Dark mode support
- **ENH-04**: Timeline mini-map for navigation

## Out of Scope

| Feature | Reason |
|---------|--------|
| CMS or admin panel | Content managed via markdown in Git — simpler for single author |
| Embedded video playback | Increases bundle size, slower on mobile — link to YouTube instead |
| Real-time collaboration | No use case — single-author portfolio |
| Server-side rendering | Canvas is client-only, SSR adds complexity with no SEO benefit |
| Authentication | Public portfolio site, no login needed |
| Advanced analytics | Web Vitals sufficient for v1, defer heatmaps/session replay |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANVAS-01 | Phase 1 | Complete ✓ |
| CANVAS-02 | Phase 1 | Complete ✓ |
| CANVAS-03 | Phase 1 | Complete ✓ |
| CANVAS-04 | Phase 1 | Complete ✓ |
| CANVAS-05 | Phase 1 | Complete ✓ |
| CANVAS-06 | Phase 1 | Complete ✓ |
| HUB-01 | Phase 3 | Complete |
| HUB-02 | Phase 3 | Complete |
| HUB-03 | Phase 3 | Complete |
| TIME-01 | Phase 4 | Complete |
| TIME-02 | Phase 4 | Complete |
| TIME-03 | Phase 4 | Complete |
| TIME-04 | Phase 4 | Pending |
| TIME-05 | Phase 4 | Pending |
| TIME-06 | Phase 4 | Pending |
| TIME-07 | Phase 4 | Pending |
| INT-01 | Phase 3 | Complete |
| INT-02 | Phase 3 | Complete |
| INT-03 | Phase 3 | Complete |
| INT-04 | Phase 3 | Complete |
| INT-05 | Phase 3 | Complete |
| GAME-01 | Phase 6 | Complete |
| GAME-02 | Phase 6 | Complete |
| GAME-03 | Phase 6 | Complete |
| GAME-04 | Phase 6 | Complete |
| CONTENT-01 | Phase 2 | Complete |
| CONTENT-02 | Phase 2 | Complete |
| CONTENT-03 | Phase 2 | Complete |
| CONTENT-04 | Phase 2 | Complete |
| CONTENT-05 | Phase 2 | Complete |
| UI-01 | Phase 5 | Complete |
| UI-02 | Phase 5 | Complete |
| UI-03 | Phase 5 | Complete |
| UI-04 | Phase 5 | Complete |
| UI-05 | Phase 5 | Complete |
| TECH-01 | Phase 1 | Complete ✓ |
| TECH-02 | Phase 1 | Complete ✓ |
| TECH-03 | Phase 2 | Complete |
| TECH-04 | Phase 1 | Complete ✓ |
| TECH-05 | Phase 1 | Complete ✓ |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
