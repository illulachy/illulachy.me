# Project Research Summary

**Project:** illulachy.me (Infinite Canvas Portfolio)
**Domain:** Interactive Portfolio/Timeline Sites
**Researched:** 2025-01-19
**Confidence:** HIGH

## Executive Summary

This project is an infinite canvas portfolio site built with **Vite + React 19 + TypeScript + tldraw 4.5**. The core experience is spatial exploration: users pan and zoom through a 2D timeline of personal content (YouTube videos, blog posts, projects, milestones) positioned chronologically from left (oldest) to right (newest). A central 16:9 "portfolio hub" node serves as the visual anchor. Optional "game mode" adds playful spaceship navigation with arrow keys.

The recommended approach is a **client-side SPA with build-time content processing**: markdown files (with YAML frontmatter for dates/URLs) are parsed at build time by gray-matter + remark into bundled JSON. tldraw provides the infinite canvas engine with custom shape utilities for timeline nodes. The architecture separates canvas rendering (tldraw) from UI chrome (Tailwind CSS). Deploy as a static site to Vercel with Turborepo orchestrating a monorepo (portfolio + blog subdomain).

**Key risks:** (1) Canvas performance degradation beyond 200 nodes—mitigate with FPS profiling from day one and lazy-loading architecture; (2) Timeline node overlap from date clustering—requires collision detection algorithm in Phase 4; (3) Touch gesture conflicts on mobile—test on real devices early. The stack is production-ready (tldraw has 45K+ GitHub stars), but timeline layout algorithms need experimentation.

## Key Findings

### Recommended Stack

Build with **Vite** (not Next.js) because tldraw is client-only and SSR adds complexity with no benefit. **React 19** is required by tldraw with **TypeScript 5.9** for type-safe custom shapes. The infinite canvas is powered by **tldraw 4.5**, a production-ready SDK with 200K+ weekly npm downloads that handles pan/zoom, touch gestures, keyboard navigation, and performance optimizations (LOD rendering, culling) automatically.

**Core technologies:**
- **tldraw 4.5** — Infinite canvas SDK with custom shape APIs, provides pan/zoom/touch/keyboard out of the box
- **Vite 8.0** — Fast HMR optimized for client-side SPAs, 10-20x faster than Webpack
- **React 19 + TypeScript** — Required by tldraw (peer dependency), essential for strongly-typed Editor API
- **gray-matter + remark** — Markdown pipeline at build time (parse frontmatter → JSON), no runtime parsing
- **Tailwind CSS 4.2** — UI chrome (header, loading, overlays) around canvas; tldraw.css handles canvas styling
- **Turborepo + pnpm** — Monorepo orchestration for portfolio + blog sites with caching and fast installs
- **Vercel** — Zero-config deployment for Vite SPAs, automatic monorepo detection, edge network

**Why this stack:** tldraw is React-first with hooks-based APIs, unlike imperative libraries (Fabric.js, Konva). Vite's dev server is optimized for React Fast Refresh. Markdown + Git workflow is simpler than CMS (Contentful, Sanity) for single-author content. Static SPA deployment is faster and cheaper than server-side rendering (canvas apps don't benefit from SSR).

### Expected Features

**Must have (table stakes):**
- **Pan/zoom navigation** — core interaction model (mouse drag, scroll wheel, touch gestures, arrow keys)
- **60 FPS performance** — canvas apps feel janky if frame rate drops; requires optimization from day one
- **Touch support** — ~50% of traffic is mobile; pinch-to-zoom is standard gesture
- **Chronological ordering** — timeline must show time progression clearly (left = oldest, right = newest)
- **Clickable nodes** — timeline nodes link to external content (YouTube, blog, projects); no inline embedding
- **Visual hierarchy** — central portfolio hub (16:9 about me) as entry point and visual anchor
- **Loading states** — spinner while canvas initializes (tldraw + content loading takes 1-2 seconds)

**Should have (competitive differentiators):**
- **Game mode (spaceship navigation)** — hotkey toggle, spaceship cursor CSS, arrow key traversal between nodes; playful and memorable
- **Markdown-driven content** — developer-friendly Git workflow (no CMS); version controlled
- **Multiple content types** — 4 custom shape types (YouTube, blog, project, milestone) for rich storytelling
- **Monorepo blog integration** — unified codebase for portfolio + blog (letters.illulachy.me)
- **Static SPA (fast loading)** — no SSR complexity, edge-deployed, instant loads

**Defer (v2+):**
- **Search/filter** — premature for explore-first UX; contradicts discovery model (add if users report confusion)
- **CMS/admin panel** — overkill for single-author site; markdown + Git is simpler
- **Embedded video playback** — increases bundle size, slow on mobile; link to YouTube instead
- **Real-time collaboration** — no use case (single author, read-only portfolio)
- **Advanced analytics** — Web Vitals (Vercel Analytics) sufficient for v1; defer heatmaps/session replay

### Architecture Approach

The architecture follows a **client-side SPA pattern with build-time content processing**. tldraw Editor manages canvas state (shapes, viewport, interactions) while React Context handles app state (timeline data, game mode toggle). Markdown files are parsed at build time (gray-matter → JSON) and bundled with the app—no runtime parsing. Custom shapes are registered as tldraw shape utilities (React components rendered on canvas). UI chrome (header, nav, loading) lives outside the canvas (Tailwind CSS) while canvas area uses tldraw's built-in styling.

**Major components:**
1. **tldraw Canvas** — infinite canvas engine with pan/zoom, shape rendering, Editor API for runtime control
2. **Custom Shapes** — 4 timeline node types (YouTube, blog, project, portfolio hub) as tldraw shape utilities
3. **Content Pipeline** — build-time markdown → JSON transformation (gray-matter + remark + Vite plugin)
4. **App State (Context)** — timeline data loaded at mount, game mode toggle, loading state
5. **UI Chrome** — Tailwind-styled header/nav/loading screen positioned outside canvas bounds

**Data flow:** Author commits markdown → Build time: Vite runs content pipeline (parse frontmatter, calculate positions, generate timeline.json) → Runtime: App loads timeline.json, creates tldraw shapes → User pans/zooms (tldraw handles), clicks node (opens external URL).

**Key patterns:** (1) Register custom shapes at app initialization; (2) Parse markdown at build time (not runtime); (3) Handle node clicks via Editor API event listeners; (4) Calculate timeline positions algorithmically from dates (not hardcoded).

### Critical Pitfalls

1. **Canvas performance degradation beyond 200 nodes** — FPS drops below 30 as timeline grows, making pan/zoom janky. **Prevention:** Test with 100+ nodes from day one, profile with Chrome DevTools (target 60 FPS), optimize custom shapes (minimize DOM nodes, lazy-load images, React.memo), plan for lazy-loading architecture (Phase 8).

2. **SSR complexity with tldraw (Next.js)** — Attempting server-side rendering causes "window is not defined" errors, requires complex dynamic imports, provides no benefit (canvas isn't indexable by search engines). **Prevention:** Use Vite (client-side SPA), skip SSR entirely, deploy static HTML.

3. **Timeline node overlap from date clustering** — Multiple entries with same/close dates render on top of each other, making content unreadable/unclickable. **Prevention:** Implement collision detection algorithm (check overlaps, adjust Y position), vertical stacking for same-day entries, enforce minimum spacing (50px), visual grouping for clusters.

4. **Runtime markdown parsing (slow initial load)** — Fetching/parsing markdown at runtime causes 3-5+ second loads and large bundle size. **Prevention:** Parse markdown at build time (Vite plugin), bundle pre-processed JSON, keep markdown for authoring only.

5. **Touch gesture conflicts on mobile** — Canvas pan conflicts with browser scroll, pinch-to-zoom conflicts with browser zoom, causing confusing UX. **Prevention:** Disable browser zoom (`user-scalable=no`), verify tldraw handles touch events correctly, test on real devices (iPhone, Android, iPad—simulator insufficient).

## Implications for Roadmap

Based on research, suggested phase structure follows **dependency order** (foundation → content → layout → features) with **performance validation** at each step:

### Phase 1: Foundation
**Rationale:** tldraw + Vite + React setup must come first—all other features depend on canvas infrastructure. This phase validates that the core stack works before building custom features.
**Delivers:** Working infinite canvas with pan/zoom, basic tldraw integration, TypeScript types
**Addresses:** Table stakes pan/zoom navigation, touch support (built-in to tldraw)
**Avoids:** Pitfall #2 (SSR complexity)—use Vite, not Next.js from day one
**Research flag:** Standard patterns (tldraw docs, Vite docs)—skip `/gsd-research-phase`

### Phase 2: Content Pipeline
**Rationale:** Timeline needs data before we can render nodes. Build-time markdown processing establishes content workflow and prevents Pitfall #4 (runtime parsing).
**Delivers:** Markdown → JSON transformation at build time (gray-matter + remark), TypeScript content types, sample timeline data (10-20 entries)
**Uses:** gray-matter, remark, Vite plugin for build-time processing
**Avoids:** Pitfall #4 (runtime markdown parsing)—parse at build time, bundle JSON
**Research flag:** Standard patterns (gray-matter docs)—skip `/gsd-research-phase`

### Phase 3: Custom Shapes
**Rationale:** Cannot render timeline without custom shape utilities. This phase implements tldraw's shape API with 4 content types before tackling complex layout logic.
**Delivers:** 4 custom shape types (YouTube, blog, project, portfolio hub) registered with tldraw, basic click handlers (open external URLs)
**Implements:** Custom shape utilities (tldraw architecture pattern)
**Addresses:** Clickable nodes, visual hierarchy (portfolio hub), multiple content types
**Avoids:** Pitfall #1 (performance)—optimize shapes early (minimize DOM nodes, React.memo)
**Research flag:** Standard patterns (tldraw custom shapes docs)—skip `/gsd-research-phase`

### Phase 4: Timeline Layout
**Rationale:** Most complex feature—chronological positioning with collision detection. Requires experimentation and algorithm research. Depends on Phase 3 (need shape dimensions for collision detection).
**Delivers:** Chronological positioning algorithm (X = date, Y = vertical offset), collision detection (prevent overlaps), visual grouping for date clusters
**Addresses:** Table stakes chronological ordering
**Avoids:** Pitfall #3 (node overlap)—collision detection from start, vertical stacking
**Research flag:** **NEEDS `/gsd-research-phase`**—timeline layout algorithms sparse in docs, requires testing with realistic data

### Phase 5: UI Chrome
**Rationale:** Canvas core is functional by Phase 4; now add polish with header/nav/loading. Can be built in parallel with Phase 4 (independent systems).
**Delivers:** Tailwind CSS setup, header/nav outside canvas, loading spinner, responsive layout (mobile/desktop)
**Uses:** Tailwind CSS 4.2, clsx for conditional classes
**Addresses:** Loading states, responsive layout
**Research flag:** Standard patterns (Tailwind docs)—skip `/gsd-research-phase`

### Phase 6: Game Mode
**Rationale:** Playful differentiator but not blocking for core timeline exploration. Depends on Phase 4 (needs node positions for arrow key traversal).
**Delivers:** Hotkey toggle (G key), spaceship cursor CSS, arrow key navigation between nodes (chronological or spatial order)
**Addresses:** Should-have game mode navigation
**Research flag:** Minor research—define "next" node logic (chronological vs. spatial proximity)

### Phase 7: Monorepo Blog
**Rationale:** Blog site (letters.illulachy.me) can be developed independently. Turborepo integration unifies deployment but doesn't block portfolio MVP.
**Delivers:** Blog site scaffolding (Vite + React or Astro), Turborepo + pnpm workspace setup, shared content package (types, markdown files)
**Uses:** Turborepo 2.8, pnpm 10.32, shared packages pattern
**Research flag:** Standard patterns (Turborepo docs)—skip `/gsd-research-phase`

### Phase 8: Performance Optimization
**Rationale:** Optimize based on real profiling data (not assumptions). By Phase 8, have realistic content (50-100+ nodes) to test performance limits.
**Delivers:** FPS profiling, bundle size analysis, lazy-loading for timeline segments (if needed), image optimization (WebP thumbnails)
**Addresses:** Table stakes 60 FPS performance at scale
**Avoids:** Pitfall #1 (performance degradation)—profile early, optimize bottlenecks
**Research flag:** **NEEDS `/gsd-research-phase`**—canvas performance at 100+ nodes requires testing, may need lazy-loading architecture

### Phase Ordering Rationale

- **Phases 1-3 are sequential dependencies:** Cannot build custom shapes without canvas foundation, cannot render timeline without content pipeline, cannot implement layout without shape definitions.
- **Phase 4 (layout) is the highest-risk phase:** Timeline positioning algorithm is most complex, requires collision detection research, has no off-the-shelf solution.
- **Phase 5 (UI chrome) can be parallel with Phase 4:** Independent systems (canvas vs. DOM outside canvas).
- **Phases 6-7 are additive enhancements:** Game mode and blog are "nice-to-have" features that don't block core timeline MVP.
- **Phase 8 must come last:** Requires realistic content scale (50-100+ nodes) to identify bottlenecks; premature optimization without profiling wastes time.

### Research Flags

**Phases needing `/gsd-research-phase` during planning:**
- **Phase 4 (Timeline Layout):** Complex—timeline positioning algorithms with collision detection are sparse in docs, requires experimentation with date clustering strategies (vertical stacking, minimum spacing, visual grouping). No off-the-shelf solution.
- **Phase 8 (Performance):** Moderate—canvas performance at 100+ nodes requires testing, may need lazy-loading or pagination if FPS drops below 60. tldraw has built-in optimizations (LOD, culling) but limits unclear until profiling.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Well-documented (tldraw.dev, Vite docs)—setup patterns are standard
- **Phase 2 (Content):** Well-documented (gray-matter, remark docs)—build-time markdown processing is common pattern
- **Phase 3 (Custom Shapes):** Well-documented (tldraw custom shapes API)—examples available
- **Phase 5 (UI Chrome):** Standard React + Tailwind patterns
- **Phase 6 (Game Mode):** Minor—arrow key navigation logic is straightforward (chronological order or spatial proximity)
- **Phase 7 (Monorepo):** Well-documented (Turborepo docs)—standard Turborepo + pnpm workspace setup

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | tldraw is production-ready (45K+ GitHub stars, 200K+ weekly downloads), Vite + React + TypeScript are industry standard, official docs are comprehensive |
| **Features** | **HIGH** | Table stakes features well-defined (pan/zoom, touch, chronological order), differentiators validated by portfolio design trends (game mode, markdown-driven) |
| **Architecture** | **HIGH** | Client-side SPA + build-time content processing is standard pattern for canvas apps, tldraw architecture docs are detailed, monorepo patterns well-documented |
| **Pitfalls** | **MEDIUM** | Critical pitfalls validated by tldraw GitHub issues (performance, SSR), but timeline-specific challenges (node overlap, layout algorithms) need Phase 4 experimentation |

**Overall confidence:** **HIGH**

Stack and architecture are production-ready with extensive documentation. Feature scope is well-defined. Main uncertainty is **timeline layout algorithm** (Phase 4)—collision detection and date clustering strategies need experimentation during that phase. Performance limits (Phase 8) also require profiling with realistic content scale.

### Gaps to Address

**During Phase 4 planning (Timeline Layout):**
- **Layout algorithm selection:** Test multiple strategies for chronological positioning:
  - Simple linear (X = date, no Y offset)—will have overlaps
  - Collision detection with vertical stacking (check overlaps, adjust Y)
  - Force-directed graph layout (D3.js patterns)—may be overkill
  - **Recommendation:** Start with linear + collision detection, iterate based on visual results
- **Date clustering strategy:** How to handle multiple entries per day/week? Vertical stacking? Visual grouping with connecting lines?
- **Minimum spacing:** What's the right minimum distance between nodes? 50px? 100px? Test with realistic content.

**During Phase 8 planning (Performance):**
- **Node count limits:** At what point does FPS drop below 60? 100 nodes? 200 nodes? 500 nodes?
- **Lazy-loading architecture:** If limits hit early, design pagination (load timeline segments on demand, e.g., by year or decade)
- **Mobile performance:** Test on real devices (iPhone, Android)—mobile GPUs are weaker than desktop
- **Bundle size:** tldraw is ~200KB alone; total target is <500KB JS (gzip). Monitor with Vite bundle analysis.

**During implementation (all phases):**
- **Touch gesture testing:** Cannot rely on desktop simulator—test on real iPhone/Android/iPad for pinch-to-zoom, pan, tap
- **Markdown schema validation:** Implement Zod schema for frontmatter at build time (fail fast on invalid dates, URLs)
- **Dark mode:** tldraw supports themes, but custom shapes need CSS variables to adapt (test both light/dark)

## Sources

### Primary (HIGH confidence)
- **tldraw npm package & GitHub:** 45K+ stars, 200K+ weekly downloads — https://github.com/tldraw/tldraw, https://www.npmjs.com/package/tldraw
- **tldraw documentation:** https://tldraw.dev/docs (architecture, custom shapes API, performance guide)
- **Vite documentation:** https://vite.dev (SPA setup, build optimization)
- **React 19 documentation:** https://react.dev (hooks, concurrent features)
- **Tailwind CSS documentation:** https://tailwindcss.com (v4 Vite integration)
- **Turborepo documentation:** https://turbo.build (monorepo patterns, build pipeline)
- **Web Vitals standards:** https://web.dev/vitals (LCP, FID, CLS targets)
- **npm registry:** Package versions and peer dependencies

### Secondary (MEDIUM confidence)
- **tldraw GitHub issues:** Performance label — https://github.com/tldraw/tldraw/issues?q=label%3Aperformance
- **steipete.me inspiration:** Markdown-driven monorepo pattern (Astro-based, not canvas) — https://github.com/steipete/steipete.me
- **gray-matter documentation:** https://github.com/jonschlinkert/gray-matter
- **remark documentation:** https://github.com/remarkjs/remark
- **Vercel + Vite integration:** Official deployment guides
- **Canvas performance patterns:** LOD rendering, culling, virtualization (from tldraw issue tracker and canvas app best practices)

### Tertiary (LOW confidence, needs validation during implementation)
- **Timeline layout algorithms:** D3.js time scales, force-directed graphs, collision detection patterns (need Phase 4 experimentation)
- **Canvas FPS targets for 200+ nodes:** Requires performance testing with realistic content
- **Touch gesture best practices on mobile canvas:** Needs device testing (viewport settings, gesture conflicts)
- **Optimal node positioning logic:** Chronological vs. spatial, minimum spacing, visual grouping (needs design iteration)

---

**Research completed:** 2025-01-19  
**Ready for roadmap:** Yes  
**Next step:** Requirements definition → Roadmap creation with phase structure above
