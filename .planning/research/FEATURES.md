# Feature Landscape

**Domain:** Infinite Canvas Portfolio/Timeline Sites
**Researched:** 2025-01-19
**Confidence:** HIGH

## Overview

Infinite canvas portfolio sites are a niche but growing category — visual, explorable portfolios where content is positioned on an infinite 2D plane rather than in scrollable pages. Examples include interactive resumes, visual timelines, and creative portfolios. The core value proposition is **exploration over consumption**: users discover content through spatial navigation (pan/zoom) rather than linear scrolling.

---

## Table Stakes

Features users expect in infinite canvas portfolio sites. Missing these makes the product feel incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Pan/zoom navigation** | Core interaction model — without it, it's just a static page | Low (with tldraw) | Mouse drag, scroll wheel, touch gestures, arrow keys — tldraw handles all |
| **Smooth 60 FPS performance** | Canvas apps feel janky if frame rate drops during interaction | Medium | tldraw provides LOD rendering + culling; still need to optimize node count |
| **Touch support (mobile/tablet)** | ~50% of traffic is mobile; pinch-to-zoom is standard gesture | Low (with tldraw) | tldraw supports touch gestures out of the box; test on real devices |
| **Keyboard navigation** | Accessibility + power users expect arrow keys for panning | Low (with tldraw) | tldraw provides keyboard shortcuts; custom for game mode traversal |
| **Visual hierarchy** | Central hub or entry point — users need starting context | Medium | Portfolio hub node (16:9, about me) as visual anchor |
| **Clickable content** | Nodes must link to external content (blog, projects, videos) | Low | tldraw click handlers → `window.open()` or navigate |
| **Loading states** | Canvas takes time to initialize; show progress indicator | Low | Spinner or skeleton while tldraw loads + content fetches |
| **Responsive layout** | Works on desktop (large canvas) and mobile (constrained viewport) | Medium | tldraw is responsive; custom shapes need flexible sizing |
| **Visual feedback on interaction** | Hover states, click feedback, cursor changes | Low | CSS hover on custom shapes, cursor: pointer |
| **Chronological ordering (for timelines)** | Timeline sites must show time progression clearly | High | Custom layout algorithm — most complex feature |

**Notes:**
- **Without pan/zoom:** Site fails to deliver core value (exploration)
- **Without touch:** Mobile users cannot interact (50% of traffic lost)
- **Without chronological ordering (timelines):** Content feels random, not narrative
- **Without clickable nodes:** Dead-end exploration (no payoff)

**Sources:** Common patterns in infinite canvas apps (tldraw examples, Miro, FigJam), accessibility guidelines (keyboard navigation), Web Vitals performance standards (HIGH confidence)

---

## Differentiators

Features that set this portfolio apart. Not expected, but highly valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Game mode (spaceship navigation)** | Playful, memorable — turns exploration into discovery game | Medium | Hotkey toggle, spaceship cursor CSS, arrow key node traversal |
| **Markdown-driven content** | Developer-friendly workflow (Git-based, version controlled) | Low | gray-matter + remark at build time; no CMS complexity |
| **Multiple content types** | Rich storytelling (YouTube, blog, projects, milestones) | Medium | 4 custom shape types; each needs unique rendering + click behavior |
| **Central portfolio hub** | Strong visual anchor (16:9 "about me" node) | Low | Single custom shape with fixed position |
| **Timeline narrative** | Chronological story (school → work → projects) | High | Same as table stakes chronological ordering |
| **Fast loading (static SPA)** | No server-side rendering, edge-deployed, instant loads | Low | Vite builds static assets, Vercel edge network |
| **Monorepo blog integration** | Unified codebase for portfolio + blog (letters.illulachy.me) | Medium | Turborepo + pnpm workspaces; shared content types |
| **Open-source inspirational** | Public GitHub repo inspires others to build similar sites | Low | MIT license, documented code, tutorial-quality README |

**Why these differentiate:**
1. **Game mode:** Most portfolios are passive; this adds interactivity and personality
2. **Markdown-driven:** Most portfolios use CMS (Contentful, Sanity); this is simpler and Git-native
3. **Timeline narrative:** Most portfolios are project grids; this shows journey over time
4. **Monorepo blog:** Most blogs are separate; this unifies personal brand under one repo

**Competitors/inspiration:**
- **steipete.me:** Markdown-driven blog (Astro), monorepo, but traditional scrolling (not canvas)
- **Figma/Miro:** Infinite canvas tools, but not storytelling-focused
- **Linear homepage:** Canvas-like animations, but not user-navigable

**Sources:** steipete.me GitHub (markdown pattern), tldraw examples (canvas patterns), portfolio design trends (MEDIUM confidence)

---

## Anti-Features

Features to explicitly NOT build in v1. These add complexity without sufficient value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Search/filter functionality** | Premature — explore-first UX; search suggests known-item lookup | **v2:** Add search after understanding user navigation patterns |
| **CMS or admin panel** | Overkill for single-author site; adds hosting complexity (backend) | **Use:** Markdown files in Git; commit to publish |
| **Embedded video playback** | Increases bundle size (video.js, React Player), slow on mobile | **Link to:** YouTube (click opens external link) |
| **Real-time collaboration** | Single-author portfolio; collaboration has no use case | **Defer:** If building multiplayer features, use `@tldraw/sync` |
| **Animation library (GSAP, Framer Motion)** | tldraw has built-in smooth transforms; adding library is redundant | **Use:** CSS transitions for UI chrome (header, overlays) |
| **User authentication** | Public portfolio; no private content, no personalization | **Skip:** No login, no user accounts |
| **Comments or social features** | Blog has comments, but canvas portfolio is read-only | **Defer:** Add comments to blog site (letters.illulachy.me) |
| **Custom canvas drawing tools** | Portfolio is curated content, not a whiteboard; no need for pen/shapes | **Use:** tldraw's shape tools are hidden; only show custom timeline nodes |
| **Backend API or database** | Static site is faster, simpler, cheaper to host | **Use:** Build-time markdown processing, deploy static assets |
| **Advanced analytics (heatmaps, session replay)** | Premature optimization; Web Vitals (Vercel Analytics) is sufficient | **Defer:** Add analytics in v2 if traffic justifies it |
| **Internationalization (i18n)** | Single-language site (English); i18n adds complexity | **Defer:** If audience grows, add i18n in v2 |

**Why avoid these:**
- **Search/filter:** Exploration is primary UX; search contradicts discovery model
- **CMS:** Adds backend, auth, hosting costs; markdown + Git is simpler for single author
- **Embedded video:** Slow loading, mobile-unfriendly; linking is standard UX
- **Real-time collaboration:** No use case (single author, read-only portfolio)
- **Animation libraries:** tldraw handles canvas animations; CSS is sufficient for UI

**When to reconsider:**
- Search: If user testing shows people get lost (can't find specific content)
- CMS: If content updates become too frequent (daily), Git workflow may be cumbersome
- Embedded video: If showcasing demo videos as primary content (not YouTube links)
- Collaboration: If building a team portfolio (multiple authors editing canvas)

**Sources:** Product scoping best practices (MVP focus), tldraw capabilities (built-in animations), static site benefits (MEDIUM confidence)

---

## Feature Dependencies

Visual dependency graph — some features require others to be built first.

```
Foundation
├─ Vite + React + tldraw setup
│  ├─ Pan/zoom navigation (tldraw built-in)
│  ├─ Touch support (tldraw built-in)
│  └─ Keyboard navigation (tldraw built-in)
│
├─ Markdown content pipeline
│  ├─ gray-matter (parse frontmatter: dates, URLs, types)
│  ├─ Build-time JSON generation
│  └─ Content type definitions (TypeScript)
│
├─ Custom shapes
│  ├─ YouTube node (thumbnail + link)
│  ├─ Blog post node (card + link)
│  ├─ Project node (card + link)
│  └─ Portfolio hub (16:9 about me)
│     └─ Timeline chronological layout (requires date data from markdown)
│        └─ Visual hierarchy (requires portfolio hub as anchor)
│
├─ UI chrome
│  ├─ Tailwind CSS setup
│  ├─ Header/nav (outside canvas)
│  └─ Loading states (before canvas ready)
│
└─ Advanced features
   ├─ Game mode (requires custom shapes + timeline layout)
   ├─ Monorepo blog (independent, can be parallel)
   └─ Performance optimization (requires profiling data)
```

**Critical path (must be sequential):**
1. **Vite + React + tldraw** → Foundation for all canvas features
2. **Markdown pipeline** → Provides data for custom shapes
3. **Custom shapes** → Display timeline content
4. **Timeline layout** → Position shapes chronologically
5. **Game mode** → Enhances navigation (additive)

**Parallel tracks:**
- **UI chrome** (Tailwind, header) can be built alongside custom shapes
- **Blog site** (letters.illulachy.me) can be separate workstream
- **Performance optimization** happens continuously (monitor in phases 1-7)

**Blockers:**
- Cannot build timeline layout without custom shapes (need to know node dimensions)
- Cannot build game mode without timeline layout (need to know node positions for traversal)
- Cannot optimize performance without real content (need to test with 50-100 nodes)

**Sources:** tldraw examples (shape dependencies), standard web app build order (foundation → features), project planning best practices (HIGH confidence)

---

## MVP Recommendation

**Core MVP (ship in 2-3 weeks):**

### Must-Have (Phases 1-5)
1. **Infinite canvas with pan/zoom** — tldraw setup
2. **Markdown content pipeline** — gray-matter + build-time processing
3. **Custom shapes (4 types)** — YouTube, blog, project, portfolio hub
4. **Timeline chronological layout** — date-based positioning (left = oldest, right = newest)
5. **Clickable nodes** — external links (YouTube, blog, projects)
6. **UI chrome** — Tailwind header, loading state, responsive layout
7. **Deploy to illulachy.me** — Vercel static SPA

**MVP success criteria:**
- [ ] Users can pan/zoom on desktop and mobile
- [ ] Timeline shows 50+ nodes chronologically
- [ ] Click opens external URLs (YouTube, blog)
- [ ] Loads in <3 seconds (LCP)
- [ ] Maintains 60 FPS during pan/zoom

### Should-Have (Phase 6)
- **Game mode** — spaceship cursor, arrow key traversal
  - Adds personality and memorability
  - Not blocking for core timeline exploration

### Defer to v1.1 or v2
- **Monorepo blog** (Phase 7) — letters.illulachy.me can deploy separately
- **Search/filter** — wait for user feedback (is navigation confusing?)
- **Advanced animations** — CSS is sufficient for v1
- **Performance optimization** — optimize based on real profiling data, not assumptions

**MVP rationale:**
- **Focus on exploration UX:** Core value is spatial navigation and discovery
- **Prove canvas performance:** 50+ nodes is sufficient to test performance limits
- **Defer blog integration:** Portfolio works standalone; blog is separate deployment
- **Defer game mode:** Playful but not critical; can add after core timeline validated

**Time estimate:**
- Phase 1 (Foundation): 1-2 days
- Phase 2 (Content): 2-3 days
- Phase 3 (Custom shapes): 3-5 days
- Phase 4 (Timeline layout): 2-3 days
- Phase 5 (UI chrome): 2-3 days
- **Total MVP:** 10-16 days (2-3 weeks)

**Post-MVP (v1.1):**
- Phase 6 (Game mode): +1-2 days
- Phase 7 (Monorepo blog): +2-3 days
- Phase 8 (Performance): +1-2 days

**Sources:** Agile MVP scoping, tldraw learning curve estimates, standard web app build timelines (MEDIUM confidence)

---

## Sources

### Primary (High Confidence)
- tldraw examples: https://tldraw.dev/examples
- Web Vitals standards: https://web.dev/vitals
- Accessibility guidelines (keyboard navigation): https://www.w3.org/WAI/WCAG21/Understanding/
- steipete.me inspiration: https://github.com/steipete/steipete.me

### Secondary (Medium Confidence)
- Infinite canvas design patterns (Miro, FigJam, Figma)
- Portfolio design trends (2024)
- Agile MVP scoping best practices

### Tertiary (Context from Training Data)
- User engagement metrics (session duration, click rates)
- Performance budgets (FPS, node counts)
- Timeline layout algorithms (need experimentation)
