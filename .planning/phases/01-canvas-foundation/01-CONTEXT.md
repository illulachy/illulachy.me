# Phase 1 Context: Canvas Foundation

**Phase Goal:** User can pan and zoom an infinite canvas smoothly at 60 FPS  
**Depends on:** Nothing (first phase)  
**Context Gathered:** 2026-03-22

---

## Implementation Decisions

### 1. Initial View & Orientation

**Initial Viewport Position:**
- **Desktop:** Canvas centered on portfolio hub (16:9 node fills ~40% of viewport)
- **Mobile/Portrait:** Zoom out slightly compared to desktop (more timeline visible)
- **Initial Zoom Level:** Auto-calculate zoom to make hub fill 40% of viewport (responsive)

**Entrance Animation:**
- Gentle fade-in after loading completes (200-300ms)
- Editorial entrance style (matches design system premium feel)

**Position Memory:**
- **Remember last position:** YES, persist via localStorage
- **Applies to:** Both zoom level AND pan position
- **First-time visitors:** Start at hub (no localStorage yet)
- **Returning visitors:** Resume where they left off

**Zoom Limits:**
- **Minimum zoom:** 10% (bird's eye view, entire timeline visible)
- **Maximum zoom:** 400% (4x extreme close-up for detail inspection)
- **Default zoom:** Auto-calculated to fit hub at 40% viewport

**URL Parameters:**
- **Phase 1:** NO support for URL params (defer to Phase 3+)
- **Rationale:** Timeline nodes don't exist yet; deep-linking requires content to link to

---

### 2. Canvas Control Visibility

**Visibility Behavior:**
- **Contextual visibility:** Fade in on hover/interaction, fade out after 3 seconds of inactivity
- **Not always visible:** Respects minimalist design philosophy
- **Mobile:** Controls should remain visible longer (touch interactions less predictable)

**Control Placement:**
- **Location:** Bottom-right corner
- **Rationale:** Conventional, unobtrusive, doesn't interfere with timeline flow (which extends left)

**Control Actions:**
- **Standard set:** Zoom in, Zoom out, Reset to hub, Fit to screen
- **Rationale:** Users can drag to pan (intuitive), scroll to zoom; controls complement native interactions

**Visual Style:**
- **Glassmorphism:** Matches design system tokens
  - Background: `--glass-bg` (rgba(28, 28, 28, 0.7) — 70% opacity)
  - Backdrop blur: `--glass-blur` (20px)
  - Border: `--glass-border` (rgba(255, 255, 255, 0.1))
  - Shadow: `--glass-shadow` (0 8px 32px rgba(0, 0, 0, 0.2))
- **Button icons:** Mauve accent on hover (`--interactive-hover: #EAC7FF`)

---

### 3. Navigation Boundaries

**Boundary Strategy:**
- **Dynamic boundaries:** Canvas boundaries expand as timeline content grows
- **Phase 1 implementation:** Set generous default boundaries (will adjust in Phase 4 when timeline layout is implemented)
- **Not truly infinite:** Prevents users from getting lost in empty space

**Overpan Behavior:**
- **Deferred to Phase 4:** When timeline layout defines actual content edges
- **Phase 1:** Don't implement overpan yet (no content to overpan beyond)

**Beyond-Content Visuals:**
- **Fog overlay at edges:** Use `--canvas-fog: rgba(19, 19, 19, 0.6)`
- **Implementation:** Gradient vignette that darkens toward canvas boundaries
- **Rationale:** Subtly indicates "edge of content" without hard visual stop

**Reset Shortcuts:**
- **Double-click background:** Returns camera to portfolio hub
- **Toolbar "Reset" button:** Also available for explicit reset action
- **Rationale:** Double-click is intuitive for map-style interfaces

---

### 4. Loading & Performance Feedback

**Loading State:**
- **Skeleton canvas:** Progressive reveal with ghost shapes
- **Implementation:** Show blurred/dim placeholder shapes at hub position
- **Duration:** Display until tldraw canvas is fully initialized and interactive
- **Interactions during load:** DISABLED — dim overlay prevents pan/zoom until ready

**Performance Feedback:**
- **No FPS indicator:** Loading should be fast enough that users don't need real-time feedback
- **Success criteria verification:** 60 FPS measured via Chrome DevTools during testing, not shown to users
- **Rationale:** Minimalist design; performance monitoring is developer concern, not user-facing

**Ready State:**
- **Silent activation:** No toast, tooltip, or tutorial when canvas becomes interactive
- **Fade transition:** Skeleton fades out, canvas fades in (200-300ms, matches entrance animation)
- **Rationale:** Interface should be self-evident; controls appear on hover if users need them

**First-Time User Guidance:**
- **Phase 1:** No onboarding or tutorials
- **Defer to Phase 5:** UI polish phase can add optional first-visit guidance if testing reveals confusion
- **Philosophy:** Canvas navigation is intuitive (drag to pan, scroll to zoom)

---

## Code Context

### Existing Assets

**Design System (Ready to Use):**
- **Location:** `.stich/` directory
- **Tokens:** `.stich/TOKENS.md` — Complete CSS custom properties
  - Canvas colors: `--canvas-bg`, `--canvas-grid`, `--canvas-fog`
  - Surface hierarchy: `--surface-*` (7 tonal levels for depth)
  - Interactive colors: `--interactive-default` (#E0AFFF mauve)
  - Glassmorphism: `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`
  - Motion: `--ease-out`, `--duration-moderate`, `--motion-canvas-pan`, `--motion-canvas-zoom`
  - Spacing: 8px grid system (`--spacing-*`)
  - Typography: Noto Serif (display), Space Grotesk (body)
  - Zoom-specific tokens: `--node-width-default` (280px), `--hub-width` (640px), `--hub-height` (360px)
- **Design Strategy:** `.stich/DESIGN.md` — High-end editorial, no-line rule, tonal layering
- **Motion Guidelines:** `.stich/MOTION.md` (if exists)

**Codebase State:**
- **Greenfield project:** No existing code (Phase 1 creates foundation)
- **No build setup:** Need to initialize Vite + React 19 + TypeScript
- **No dependencies:** tldraw 4.5 needs to be installed

### Integration Points

**Phase 1 Scope Boundaries:**
- ✅ Canvas initialization (Vite + React + tldraw setup)
- ✅ Pan/zoom navigation (mouse, touch, keyboard)
- ✅ Control toolbar (glassmorphism, contextual visibility)
- ✅ Loading state (skeleton canvas)
- ✅ Initial view logic (auto-zoom to hub, localStorage persistence)
- ✅ Boundary fog overlay
- ❌ Timeline content (Phase 2: Content Pipeline)
- ❌ Custom shapes (Phase 3: Custom Shapes & Hub)
- ❌ Layout algorithm (Phase 4: Timeline Layout)
- ❌ UI polish (Phase 5: UI Chrome)

**Downstream Phase Dependencies:**
- **Phase 2** will need TypeScript types for content nodes (define in Phase 1)
- **Phase 3** will extend tldraw with custom shape components
- **Phase 4** will calculate node positions and update boundary logic
- **Phase 5** will add responsive layout and polish

---

## Requirements Coverage

Phase 1 delivers these requirements from REQUIREMENTS.md:

- **CANVAS-01**: User can pan canvas by dragging with mouse ✓
- **CANVAS-02**: User can zoom canvas using scroll wheel ✓
- **CANVAS-03**: User can pan/zoom using touch gestures on mobile ✓
- **CANVAS-04**: User can navigate using arrow keys ✓
- **CANVAS-05**: Canvas maintains 60 FPS during pan/zoom ✓
- **CANVAS-06**: Canvas displays loading state while initializing ✓
- **TECH-01**: Built with Vite + React 19 + TypeScript ✓
- **TECH-02**: Infinite canvas powered by tldraw 4.5 ✓
- **TECH-04**: Site deploys as static SPA ✓ (Vite build output)
- **TECH-05**: TypeScript types defined for all content structures ✓

**Success Criteria (from ROADMAP.md):**
1. ✓ User can drag canvas with mouse → pans smoothly
2. ✓ User can zoom using scroll wheel → no frame drops
3. ✓ User can pan/zoom using touch gestures on mobile
4. ✓ User can navigate using arrow keys
5. ✓ Canvas maintains 60 FPS (measured via Chrome DevTools)
6. ✓ Canvas displays loading spinner (skeleton) before first paint

---

## Open Questions for Research Phase

**Technical Investigations Needed:**

1. **tldraw 4.5 API:**
   - How to disable default shape creation tools? (We only need canvas navigation, no drawing)
   - How to customize camera bounds programmatically? (Dynamic boundaries)
   - How to implement fog overlay? (CSS layer over canvas or tldraw API?)
   - How to measure/enforce 60 FPS? (Built-in performance monitoring?)

2. **LocalStorage Strategy:**
   - What camera state to persist? (x, y, zoom — any other tldraw state?)
   - How to serialize/deserialize camera position?
   - Cache invalidation strategy? (Version key in case structure changes?)

3. **Skeleton Loading:**
   - Should skeleton be React component or pure CSS?
   - How to detect when tldraw is "ready"? (Event, promise, or RAF check?)
   - Skeleton shape: Simple hub outline or more elaborate?

4. **Responsive Zoom Calculation:**
   - Algorithm to calculate zoom where hub (640x360px) fills 40% of viewport?
   - Should calculation account for toolbar height? (Controls in bottom-right)
   - How to handle extreme aspect ratios? (Ultra-wide, portrait mobile)

5. **Performance Validation:**
   - Which Chrome DevTools metrics to track? (FPS, frame time, paint events?)
   - Automated performance testing setup? (Playwright + performance API?)
   - Mobile performance testing approach? (Remote debugging, Lighthouse?)

**Research Should Produce:**
- Code examples: tldraw initialization, camera control, boundary implementation
- Performance testing strategy: Automated + manual validation
- LocalStorage schema: Camera state structure
- Skeleton loading pattern: React component implementation

---

## Deferred Decisions (Out of Scope for Phase 1)

- **URL parameter support:** Defer to Phase 3+ (needs content nodes to link to)
- **Overpan behavior:** Defer to Phase 4 (needs timeline layout to define edges)
- **First-time user guidance:** Defer to Phase 5 (UI polish phase)
- **Keyboard shortcuts beyond arrow keys:** Defer to Phase 6 (Game Mode adds spaceship navigation)
- **Minimap or overview widget:** Not in v1 roadmap (potential v2 feature)
- **Accessibility:** Focus states and ARIA labels — Phase 5 (UI Chrome) will address

---

## Success Indicators

**User can:**
- ✅ Drag canvas smoothly at 60 FPS
- ✅ Zoom using scroll wheel without lag
- ✅ Pan and zoom on touch devices
- ✅ Use arrow keys to move viewport
- ✅ See loading skeleton before canvas appears
- ✅ Return to last viewed position on revisit
- ✅ Reset to hub with double-click or toolbar button
- ✅ Access zoom controls when needed (contextual visibility)

**Developer can:**
- ✅ Run `npm run dev` and see working canvas
- ✅ Build static site with `npm run build`
- ✅ Measure 60 FPS in Chrome DevTools during interaction
- ✅ Extend canvas with custom shapes in Phase 3 (clean architecture)
- ✅ Deploy to Vercel/Netlify as static SPA

---

**Context complete. Ready for research and planning phases.**
