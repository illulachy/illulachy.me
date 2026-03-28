# Requirements: illulachy.me

**Defined:** 2026-03-28
**Core Value:** The canvas must feel smooth and intuitive to explore — pan/zoom navigation works flawlessly, and the timeline layout clearly communicates my journey over time.

## v1.1 Requirements

Requirements for milestone v1.1: Turborepo + Blog Site. Each maps to roadmap phases.

### Monorepo Infrastructure

- [ ] **MONO-01**: Repository uses Turborepo + pnpm workspace structure with apps/ and packages/ directories
- [ ] **MONO-02**: Portfolio app lives at apps/portfolio/ and builds/deploys as before
- [ ] **MONO-03**: Shared content package (@illu/content) extracts markdown files, types, and generation scripts
- [ ] **MONO-04**: Both portfolio and blog apps consume @illu/content via workspace:* dependency
- [ ] **MONO-05**: All letters.illulachy.me references updated to writing.illulachy.me

### Blog Content

- [ ] **BLOG-01**: User can view a post list page with titles, dates, and excerpts in reverse-chronological order
- [ ] **BLOG-02**: User can read a full blog post with rendered markdown (headings, code blocks, lists, links, images)
- [ ] **BLOG-03**: Code blocks display syntax highlighting via Shiki (build-time, zero runtime JS)
- [ ] **BLOG-04**: Each post displays estimated reading time

### Taxonomy & Navigation

- [ ] **TAX-01**: User can browse posts by category via category listing pages
- [ ] **TAX-02**: User can browse posts by tag via tag listing pages
- [ ] **TAX-03**: Blog has a navigation header linking to portfolio (illulachy.me) and blog index
- [ ] **TAX-04**: Blog displays a styled 404 page for invalid URLs

### SEO & Discovery

- [ ] **SEO-01**: Blog generates an RSS feed at /rss.xml with post titles, dates, excerpts, and canonical URLs
- [ ] **SEO-02**: Blog generates a sitemap at /sitemap.xml listing all post URLs
- [ ] **SEO-03**: Each post page includes OG/meta tags (og:title, og:description, og:image) for social sharing
- [ ] **SEO-04**: Each post page includes a canonical URL link tag

### Visual Identity

- [ ] **VIS-01**: Blog uses dark mode matching Catppuccin Mocha theme via Tailwind v4 @theme tokens
- [ ] **VIS-02**: Blog has responsive prose layout (max-width ~65ch, fluid typography, mobile-first)

### Search & Extras

- [ ] **SRCH-01**: User can search blog posts via Pagefind (static build-time index, WASM query)
- [ ] **SRCH-02**: Code blocks have a copy-to-clipboard button
- [ ] **SRCH-03**: Long posts display a table of contents generated from headings
- [ ] **SRCH-04**: Each blog post links back to its position on the canvas timeline ("See on timeline")

## v1 Requirements (Previous Milestone — Complete)

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
- [x] **TIME-04**: YouTube content displays as thumbnail node
- [x] **TIME-05**: Blog/note content displays as card node
- [x] **TIME-06**: Project content displays as card node
- [x] **TIME-07**: Milestone/education content displays as card node

### Interactivity

- [x] **INT-01**: User can click YouTube node to open video in YouTube
- [x] **INT-02**: User can click blog/note node to open writing.illulachy.me
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
- [x] **TECH-02**: Infinite canvas powered by Konva.js
- [x] **TECH-03**: Content parsing uses gray-matter + remark
- [x] **TECH-04**: Site deploys as static SPA
- [x] **TECH-05**: TypeScript types defined for all content structures

## Future Requirements

### Performance Optimization

- **PERF-01**: Lazy-loading for timeline segments (if needed beyond 200 nodes)
- **PERF-02**: Image optimization (WebP thumbnails)
- **PERF-03**: Bundle size under 500KB (gzipped)

### Enhanced Interactions

- **ENH-01**: Timeline nodes show preview on hover
- **ENH-02**: Smooth transitions between timeline sections
- **ENH-03**: Timeline mini-map for navigation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Comments section | Requires backend/moderation; single-author blog doesn't need it — link to Twitter/X instead |
| CMS or admin panel | Git + markdown workflow works for developer author |
| Email newsletter | Requires email service + GDPR compliance; RSS covers subscribe use case |
| Server-side rendering | Static generation gives same SEO benefits with simpler hosting |
| Infinite scroll | Breaks browser history/back button; simple pagination or show all |
| Social sharing buttons | Large JS payload; OG tags make native sharing look great |
| View counters | Adds JS payload + external calls; use Vercel analytics if needed |
| Real-time collaboration | No use case — single-author portfolio |
| Embedded video playback | Link to YouTube instead — simpler |
| Authentication | Public site, no login needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MONO-01 | Phase 7 | Pending |
| MONO-02 | Phase 7 | Pending |
| MONO-03 | Phase 7 | Pending |
| MONO-04 | Phase 7 | Pending |
| MONO-05 | Phase 7 | Pending |
| BLOG-01 | Phase 8 | Pending |
| BLOG-02 | Phase 8 | Pending |
| BLOG-03 | Phase 8 | Pending |
| BLOG-04 | Phase 8 | Pending |
| VIS-01 | Phase 8 | Pending |
| VIS-02 | Phase 8 | Pending |
| TAX-01 | Phase 9 | Pending |
| TAX-02 | Phase 9 | Pending |
| TAX-03 | Phase 9 | Pending |
| TAX-04 | Phase 9 | Pending |
| SEO-01 | Phase 9 | Pending |
| SEO-02 | Phase 9 | Pending |
| SEO-03 | Phase 9 | Pending |
| SEO-04 | Phase 9 | Pending |
| SRCH-01 | Phase 10 | Pending |
| SRCH-02 | Phase 10 | Pending |
| SRCH-03 | Phase 10 | Pending |
| SRCH-04 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 23 total
- Mapped to phases: 23 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation — all 23 requirements mapped*
