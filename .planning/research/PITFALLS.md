# Domain Pitfalls

**Domain:** Infinite Canvas Portfolio/Timeline Sites with React + tldraw
**Researched:** 2025-01-19
**Confidence:** HIGH (tldraw known issues), MEDIUM (timeline-specific challenges)

## Overview

Infinite canvas applications have unique failure modes not present in traditional web apps. Most issues stem from **performance assumptions** (canvas can handle unlimited content), **layout complexity** (spatial positioning is harder than linear), and **interaction conflicts** (canvas gestures vs. browser defaults).

---

## Critical Pitfalls

These mistakes cause rewrites, major performance issues, or complete feature failures.

---

### Pitfall 1: Canvas Performance Degradation with 200+ Nodes

**What goes wrong:** App becomes unusable (FPS drops below 30, pan/zoom is janky) as timeline grows beyond 200 nodes.

**Why it happens:**
- Developer assumes canvas can handle "infinite" content (it can't)
- tldraw's LOD (level of detail) rendering helps but doesn't eliminate limits
- Custom shapes may be expensive to render (complex DOM, images, calculations)
- Testing with 10-20 nodes doesn't reveal performance cliffs

**Consequences:**
- Poor user experience (exploration feels sluggish)
- Mobile becomes unusable (less GPU power)
- Bounce rate increases (users leave before exploring)
- Requires major refactor (lazy-loading, pagination, virtualization)

**Prevention:**
1. **Test with realistic node counts:** Build timeline with 100+ nodes from day one
2. **Profile early:** Use Chrome DevTools Performance tab to measure FPS during interactions
3. **Set performance budget:** Target 60 FPS on pan/zoom, alert if drops below 50 FPS
4. **Optimize custom shapes:** 
   - Minimize DOM nodes per shape (use CSS for styling, not nested divs)
   - Lazy-load images (only load thumbnails when visible in viewport)
   - Use `React.memo()` to prevent unnecessary re-renders
5. **Plan for lazy-loading:** Design timeline to load segments on demand (Phase 8)

**Detection (warning signs):**
- FPS counter shows <50 FPS during pan/zoom (enable in Chrome DevTools)
- Initial load takes >5 seconds on desktop
- Mobile devices (iPhone, Android) freeze or crash
- Chrome DevTools Performance timeline shows "long tasks" (>50ms)

**Sources:** tldraw performance issues (GitHub), canvas app best practices, Web Vitals FID targets (HIGH confidence)

---

### Pitfall 2: SSR Complexity with tldraw (Next.js)

**What goes wrong:** Attempting to use Next.js App Router or server-side rendering with tldraw causes errors, requires complex workarounds, and provides no actual benefit.

**Why it happens:**
- Developer assumes SSR is always better (for SEO, performance)
- tldraw requires browser APIs (Canvas, WebGL, DOM) not available on server
- Canvas content is not indexable by search engines (no SEO benefit)

**Consequences:**
- "window is not defined" errors on server
- Forces dynamic imports with `{ ssr: false }` (defeats purpose of SSR)
- Hydration mismatches between server and client
- Increased bundle size (Next.js overhead)
- Complex workaround code for no gain

**Prevention:**
1. **Use Vite (client-side SPA):** tldraw is designed for client-only apps
2. **Skip SSR entirely:** Canvas apps don't benefit from server rendering
3. **Deploy static HTML:** Single index.html with bundled JS
4. **Accept SEO limitation:** Canvas content is visual, not textual (not indexable)

**Detection (warning signs):**
- "window is not defined" or "document is not defined" errors
- Need to use `dynamic(() => import(), { ssr: false })` in Next.js
- Hydration warnings in browser console
- Complex client-side detection (`typeof window !== 'undefined'`)

**Sources:** tldraw documentation (client-only), Next.js dynamic imports, Vite SPA guide (HIGH confidence)

---

### Pitfall 3: Timeline Node Overlap (Date Clustering)

**What goes wrong:** Multiple timeline entries with the same date (or close dates) render on top of each other, making content unreadable and unclickable.

**Why it happens:**
- Naive positioning algorithm (X = date, Y = 0) doesn't account for overlaps
- Timeline has multiple events per day/week/month (college classes, work projects)
- Testing with sparse dates (one entry per month) doesn't reveal issue

**Consequences:**
- Nodes are hidden behind other nodes (can't click them)
- Visual clutter (overlapping thumbnails are confusing)
- Poor narrative (can't follow timeline clearly)
- Requires major layout refactor (collision detection, vertical stacking)

**Prevention:**
1. **Collision detection:** Check if nodes overlap, adjust Y position if so
2. **Vertical stacking:** Multiple entries on same date stack vertically
3. **Minimum spacing:** Enforce minimum distance between nodes (e.g., 50px)
4. **Visual grouping:** Cluster close dates with connecting lines or backgrounds

**Detection (warning signs):**
- Nodes appear to "disappear" (actually hidden behind others)
- Click events hit wrong node (z-index issue)
- Timeline looks sparse even with many entries (all overlapping in one spot)

**Research needed (Phase 4):** Optimal layout algorithm for timeline with date clusters.

**Sources:** Timeline visualization patterns, D3.js time scales, collision detection algorithms (MEDIUM confidence)

---

## Moderate Pitfalls

These cause frustration, bugs, or technical debt but are recoverable without full rewrites.

---

### Pitfall 4: Runtime Markdown Parsing (Slow Initial Load)

**What goes wrong:** Loading markdown files at runtime (fetching + parsing with gray-matter/remark) causes slow initial load (3-5+ seconds), large bundle size, and wasted CPU.

**Prevention:**
- **Parse markdown at build time:** Vite plugin or build script
- **Bundle pre-processed JSON:** Include timeline.json in app bundle
- **Keep markdown for authoring only:** Users never see markdown, only processed output

---

### Pitfall 5: Touch Gesture Conflicts (Mobile Canvas)

**What goes wrong:** Canvas pan conflicts with browser scroll, pinch-to-zoom conflicts with browser zoom, causing confusing UX on mobile.

**Prevention:**
1. **Disable browser zoom:** `<meta name="viewport" content="user-scalable=no">`
2. **Prevent default on canvas:** tldraw handles this, but verify with touch events
3. **Test on real devices:** iPhone, Android, iPad (simulator isn't sufficient)
4. **Provide non-touch navigation:** Keyboard shortcuts, buttons for zooming

---

### Pitfall 6: Hardcoded Canvas Positions (Unmaintainable)

**What goes wrong:** Manually setting X/Y coordinates for each timeline node becomes unmaintainable as content grows.

**Prevention:**
- **Calculate positions algorithmically:** Derive X/Y from dates
- **Test with real content scale:** 50-100 nodes from day one
- **Design for change:** Adding new entry should not require recalculating all positions

---

### Pitfall 7: Missing Loading States (Canvas Initialization)

**What goes wrong:** User sees blank screen or partially rendered canvas while tldraw initializes.

**Prevention:**
1. **Show loading spinner:** While canvas initializes
2. **Progressive loading:** Show portfolio hub first, then timeline nodes
3. **Skeleton UI:** Placeholder shapes while loading
4. **Timeout fallback:** If load takes >10s, show error message

---

## Minor Pitfalls

Small issues that are easy to fix but commonly overlooked.

---

### Pitfall 8: Invalid Markdown Frontmatter

**What goes wrong:** Markdown file has invalid YAML frontmatter (wrong date format, missing field), causing build errors.

**Prevention:**
1. **Validate frontmatter at build time:** Zod schema, fail fast on invalid data
2. **Provide clear error messages:** "Invalid date in 2021-06-project-x.md"
3. **Document schema:** README with frontmatter examples

---

### Pitfall 9: No Dark Mode for Canvas

**What goes wrong:** tldraw supports dark mode themes, but custom shapes don't adapt (hard-coded colors).

**Prevention:**
- Use CSS variables for colors (inherit from tldraw theme)
- Test custom shapes in both light and dark modes

---

### Pitfall 10: External Link Security (XSS)

**What goes wrong:** User-controlled URLs in markdown could execute JavaScript if not sanitized.

**Prevention:**
- Validate URLs at build time (must start with `http://` or `https://`)
- Use `window.open(url, '_blank', 'noopener,noreferrer')` for security
- Don't render user-provided HTML without sanitization

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Phase 1: Foundation** | Assuming tldraw setup "just works" | Read docs carefully, understand custom shape lifecycle |
| **Phase 2: Content** | Runtime markdown parsing (slow) | Parse at build time, bundle JSON |
| **Phase 3: Custom Shapes** | Expensive rendering (many DOM nodes) | Simplify markup, use CSS for styling |
| **Phase 4: Timeline Layout** | Node overlap from date clustering | Implement collision detection, vertical stacking |
| **Phase 5: UI Chrome** | Canvas gestures conflict with header/nav | Position UI outside canvas bounds |
| **Phase 6: Game Mode** | Arrow key navigation order unclear | Define "next" node logic (chronological or spatial) |
| **Phase 7: Monorepo** | Circular dependencies between apps | Use shared package for common code |
| **Phase 8: Performance** | Premature optimization without profiling | Profile first, optimize bottlenecks |

---

## Sources

### Primary (High Confidence)
- tldraw GitHub issues: https://github.com/tldraw/tldraw/issues?q=label%3Aperformance
- tldraw documentation: https://tldraw.dev/docs
- Web Vitals standards: https://web.dev/vitals
- React best practices: https://react.dev

### Secondary (Medium Confidence)
- Canvas performance patterns (LOD, culling, virtualization)
- Timeline layout algorithms (collision detection, spatial positioning)
- Touch gesture conflicts (mobile web, viewport settings)
