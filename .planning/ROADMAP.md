# Roadmap: illulachy.me

**Project:** Infinite Canvas Portfolio Timeline
**Created:** 2025-01-19
**Granularity:** Standard

## Milestones

- ✅ **v1.0 Canvas Portfolio** - Phases 1-6 (shipped 2026-03-28)
- 🚧 **v1.1 Turborepo + Blog Site** - Phases 7-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Canvas Portfolio (Phases 1-6) - SHIPPED 2026-03-28</summary>

- [x] **Phase 1: Canvas Foundation** - Infinite canvas with pan/zoom navigation working smoothly (completed 2026-03-22)
- [x] **Phase 2: Content Pipeline** - Markdown authoring workflow processing to bundled JSON (completed 2026-03-23)
- [x] **Phase 3: Custom Shapes & Hub** - Portfolio hub and clickable timeline nodes rendering on canvas (completed 2026-03-23)
- [x] **Phase 4: Timeline Layout** - Chronological positioning with collision detection (completed 2026-03-23)
- [x] **Phase 5: UI Chrome** - Loading states, responsive layout, and visual polish (completed 2026-03-23)
- [x] **Phase 6: Game Mode** - Spaceship navigation with arrow key controls (completed 2026-03-28)

</details>

### 🚧 v1.1 Turborepo + Blog Site (In Progress)

- [x] **Phase 7: Monorepo Scaffold** - Turborepo + pnpm monorepo with portfolio migrated and shared content package wired (completed 2026-03-29)
- [ ] **Phase 8: Blog Foundation** - Readable Astro blog with post list, individual posts, syntax highlighting, and dark mode
- [ ] **Phase 9: Discovery and SEO** - Categories, tags, RSS, sitemap, OG meta tags, and navigation
- [ ] **Phase 10: Search and Extras** - Pagefind search, copy-code button, table of contents, and canvas backlink

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
**Plans:** 1/1 complete

Plans:
- [x] 01-PLAN.md — Wave 0: Setup & Validation → Wave 1: Core Canvas → Wave 2: Controls & Polish → Wave 3: Integration & Verification

### Phase 2: Content Pipeline
**Goal:** Content is authored in markdown and bundled as JSON at build time
**Depends on:** Phase 1 (needs TypeScript types from foundation)
**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, TECH-03
**Success Criteria** (what must be TRUE):
  1. Developer can create markdown file with YAML frontmatter (date, title, URL, type) and it validates at build time
  2. Build process parses markdown files and outputs timeline.json with all entries
  3. At least 10-20 sample entries exist spanning multiple content types (YouTube, blog, project, milestone)
  4. Timeline JSON loads at runtime without parsing markdown
**Plans:** 2/2 complete

Plans:
- [x] 02-01-PLAN.md — Core pipeline: TypeScript types, generator script with gray-matter/zod/fast-glob, unit tests
- [x] 02-02-PLAN.md — Integration: Vite plugin with chokidar watch mode, 12 sample content entries, timeline.json generation

### Phase 3: Custom Shapes & Hub
**Goal:** Portfolio hub and timeline nodes render as custom shapes with click handlers
**Depends on:** Phase 2 (needs content data to render)
**Requirements:** HUB-01, HUB-02, HUB-03, INT-01, INT-02, INT-03, INT-04, INT-05
**Success Criteria** (what must be TRUE):
  1. Central portfolio node (16:9) displays in center of canvas on load showing "about me" content
  2. Portfolio hub is visually distinct from timeline nodes (different styling/size)
  3. User can click YouTube node and it opens video in YouTube (new tab)
  4. User can click blog/note node and it opens writing.illulachy.me (new tab)
  5. User can click project node and it opens external project URL (new tab)
  6. User can click milestone node and details display (inline or modal)
  7. All nodes show hover states (cursor pointer, visual feedback) indicating they're clickable
**Plans:** 2/2 complete

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
**Plans:** 2/2 complete

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
**Plans:** 2/2 complete

Plans:
- [x] 05-01-PLAN.md — Foundation: Install Tailwind v4, Motion.dev, shadcn/ui; Create @theme config with design tokens; Create cn() utility and Dialog component (UI-01, UI-02, UI-03)
- [x] 05-02-PLAN.md — Component Migration: Migrate CanvasControls/CanvasLoader/MilestoneModal to Tailwind; Add Motion.dev exit animations; Make modal responsive (UI-04, UI-05)

### Phase 6: Game Mode
**Goal:** User can toggle spaceship navigation mode with momentum-based physics and arrow key controls
**Depends on:** Phase 4 (needs node positions for spatial navigation context)
**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. User can press hotkey (G key) to toggle game mode on/off
  2. Game mode displays spaceship cursor (custom CSS cursor)
  3. User can navigate between timeline nodes using arrow keys in game mode
  4. Visual indicator shows when game mode is active (toggle state visible)
**Plans:** 1/1 complete

Plans:
- [x] 06-01-PLAN.md — Complete game mode: Physics core (TDD), hooks (useGameMode, useKeyboardInput, useSpaceshipPhysics), SpaceshipCursor component, Canvas integration, human verification

### Phase 7: Monorepo Scaffold
**Goal:** Existing portfolio continues to work inside a Turborepo pnpm monorepo with shared content extracted to a workspace package
**Depends on:** Phase 6 (existing portfolio complete)
**Requirements:** MONO-01, MONO-02, MONO-03, MONO-04, MONO-05
**Success Criteria** (what must be TRUE):
  1. `pnpm build` from repo root builds the portfolio app via Turborepo task graph with output caching
  2. Portfolio app at apps/portfolio/ behaves identically to pre-migration (canvas, timeline, game mode all work)
  3. `@illu/content` package exists at packages/content/ and the portfolio declares it as a `workspace:*` dependency
  4. All letters.illulachy.me references in source code, content files, and portfolio node links are updated to writing.illulachy.me
  5. pnpm-lock.yaml replaces any previous lockfile; no phantom dependency errors from pnpm strict mode
**Plans:** 2/2 plans complete

Plans:
- [x] 07-01-PLAN.md — Monorepo root scaffold (turbo.json, pnpm-workspace.yaml, .npmrc) + git mv portfolio to apps/portfolio/ + fix path references (MONO-01, MONO-02)
- [x] 07-02-PLAN.md — Extract @illu/content shared package + scaffold Astro blog placeholder at apps/blog/ + update letters.illulachy.me to writing.illulachy.me (MONO-03, MONO-04, MONO-05)

### Phase 8: Blog Foundation
**Goal:** A readable blog at writing.illulachy.me where users can browse posts and read full articles with syntax highlighting
**Depends on:** Phase 7
**Requirements:** BLOG-01, BLOG-02, BLOG-03, BLOG-04, VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. User can view a post list page showing titles, dates, and excerpts in reverse-chronological order
  2. User can read a full blog post with rendered markdown including headings, code blocks, lists, links, and images
  3. Code blocks display syntax highlighting with Shiki (no runtime JavaScript required for highlighting)
  4. Each post shows an estimated reading time
  5. Blog uses dark mode matching Catppuccin Mocha color palette with responsive prose layout (max ~65ch width, mobile-first)
**Plans:** 2/3 plans executed

Plans:
- [x] 08-01-PLAN.md — @illu/tokens package + Tailwind v4 + Shiki themes + BaseLayout + blog post content files (VIS-01, BLOG-03)
- [ ] 08-02-PLAN.md — Post list page with PostCard component + reading time utility + unit tests (BLOG-01, BLOG-04, VIS-02)
- [x] 08-03-PLAN.md — Post detail page with remark+rehype+Shiki pipeline + PostLayout (BLOG-02, BLOG-03, VIS-02)

**UI hint**: yes

### Phase 9: Discovery and SEO
**Goal:** Blog is fully discoverable via categories, tags, RSS, sitemap, and per-post social sharing metadata
**Depends on:** Phase 8
**Requirements:** TAX-01, TAX-02, TAX-03, TAX-04, SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. User can click a category link to see all posts in that category on a dedicated listing page
  2. User can click a tag link to see all posts with that tag on a dedicated listing page
  3. Navigation header is present on every blog page, linking to illulachy.me (portfolio) and the blog index
  4. Visiting an invalid blog URL shows a styled 404 page (not a browser default error)
  5. RSS feed at /rss.xml contains post titles, dates, excerpts, and canonical URLs and validates in feed readers
  6. Sitemap at /sitemap.xml lists all post URLs
  7. Sharing a blog post URL on social media displays the correct OG title, description, and image preview
**Plans:** 1/2 plans executed

Plans:
- [x] 09-01-PLAN.md — Nav component, BaseLayout OG/meta extension, PostCard category links, slugify utility with tests, 404 page, OG image asset (TAX-03, TAX-04, SEO-03, SEO-04)
- [x] 09-02-PLAN.md — Category listing pages, tag listing pages, RSS feed endpoint with tests, sitemap integration (TAX-01, TAX-02, SEO-01, SEO-02)

**UI hint**: yes

### Phase 10: Search and Extras
**Goal:** Blog has full-text search and quality-of-life features that make reading and referencing content effortless
**Depends on:** Phase 9
**Requirements:** SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. User can type a query in the search box and see matching posts without a server (Pagefind static index)
  2. User can click the copy button on any code block to copy its contents to clipboard
  3. Long posts display a table of contents generated from headings, each entry jumping to the correct section
  4. Each blog post shows a "See on timeline" link that navigates to that post's position on the canvas portfolio
**Plans:** 1/3 plans executed

Plans:
- [x] 10-01-PLAN.md — Pagefind search: install pagefind, postbuild script, custom SearchBar component on blog index (SRCH-01)
- [ ] 10-02-PLAN.md — Post enhancements: rehype-slug, copy-to-clipboard button, sticky ToC sidebar, canvas backlink with timeline matching (SRCH-02, SRCH-03, SRCH-04)
- [ ] 10-03-PLAN.md — Build verification + human checkpoint for all Phase 10 features (SRCH-01, SRCH-02, SRCH-03, SRCH-04)

**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Canvas Foundation | v1.0 | 1/1 | Complete | 2026-03-22 |
| 2. Content Pipeline | v1.0 | 2/2 | Complete | 2026-03-23 |
| 3. Custom Shapes & Hub | v1.0 | 2/2 | Complete | 2026-03-23 |
| 4. Timeline Layout | v1.0 | 2/2 | Complete | 2026-03-23 |
| 5. UI Chrome | v1.0 | 2/2 | Complete | 2026-03-23 |
| 6. Game Mode | v1.0 | 1/1 | Complete | 2026-03-28 |
| 7. Monorepo Scaffold | v1.1 | 2/2 | Complete   | 2026-03-29 |
| 8. Blog Foundation | v1.1 | 2/3 | In Progress|  |
| 9. Discovery and SEO | v1.1 | 1/2 | In Progress|  |
| 10. Search and Extras | v1.1 | 1/3 | In Progress|  |

## Coverage

**v1.0 Requirements:** 34 total — all mapped across Phases 1-6 ✓
**v1.1 Requirements:** 23 total — all mapped across Phases 7-10 ✓
**Unmapped:** 0 ✓

---
*Roadmap created: 2025-01-19*
*Last updated: 2026-04-01 after Phase 10 planning (3 plans created)*
