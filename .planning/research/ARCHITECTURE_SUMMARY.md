# Architecture Research Summary

**Project:** illulachy.me — Infinite canvas portfolio with React + tldraw
**Research Focus:** Architecture patterns, component structure, data flow
**Researched:** 2024-03-22
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

React + tldraw applications follow a clear architectural pattern with three main layers: **presentation (React components)**, **canvas (tldraw engine)**, and **data (content management)**. The tldraw SDK provides a mature infinite canvas engine with built-in pan/zoom that handles most low-level concerns, allowing developers to focus on custom shapes and content.

The recommended architecture uses **custom shape types per content category** (blog posts, projects, YouTube videos, etc.), **build-time content loading** from markdown files, and **programmatic canvas initialization** via tldraw's Editor API. State is split between tldraw's internal store (shapes, camera) and app-level state (game mode, UI preferences).

The build order should start with foundations (setup, basic shapes, content loading), progress through the shape system and layout, then add interactions and advanced features like game mode. For a portfolio with 50-200 timeline nodes, no special performance optimizations are needed — tldraw's defaults handle this scale excellently.

## Key Findings

**Canvas Integration:** tldraw provides a single `<Tldraw />` component that must be dynamically imported (no SSR). Custom shapes extend `BaseBoxShapeUtil`, and the Editor API provides programmatic control over shapes and camera.

**Content Architecture:** Markdown files as source of truth → build-time parsing → shape data → runtime shape creation via Editor API. Content stays separate from canvas state.

**Component Structure:** Custom shape per content type (type-safe, independently customizable), registered via `shapeUtils` prop. Shapes render HTML using `HTMLContainer` for flexibility.

**State Management:** tldraw manages canvas state (shapes, camera, selection) internally. App state (game mode, preferences) lives in separate store (Zustand recommended). Editor API bridges the two.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Week 1)
**Focus:** Project setup, tldraw integration, content types
- Next.js setup with TypeScript
- Basic tldraw wrapper (dynamic import, no SSR)
- Content type definitions
- Markdown loader (simple file reading)

**Rationale:** Everything depends on this foundation. Prove tldraw works before building on it.

### Phase 2: First Shape (Week 1-2)
**Focus:** Prove shape system works end-to-end
- Create one custom shape (blog post recommended — simplest)
- Register shape with tldraw
- Test rendering and interaction
- Parse one markdown file → create shape

**Rationale:** Validates entire pattern before building more shapes. Tests: content loading → parsing → shape creation → rendering.

### Phase 3: Layout System (Week 2)
**Focus:** Timeline positioning and camera control
- Position calculator (chronological layout)
- Editor API integration (programmatic shape creation)
- Camera positioning (initial view on portfolio node)
- Basic pan/zoom testing

**Rationale:** Once shapes exist, need to position them properly. Establishes timeline structure.

### Phase 4: Complete Shape System (Week 2-3)
**Focus:** Add remaining content types
- YouTube shape (thumbnail + link)
- Project shape (card + external link)
- Portfolio central node (16:9 about me card)
- Milestone shape (if needed)

**Rationale:** Now that pattern is proven, adding shapes is incremental. Each independent.

### Phase 5: Interaction Layer (Week 3)
**Focus:** Make canvas interactive
- Click handlers (external links)
- Touch gesture testing (mobile)
- Keyboard navigation basics
- Responsive behavior

**Rationale:** Shapes render correctly, now make them functional.

### Phase 6: Game Mode (Week 4)
**Focus:** Advanced navigation feature
- Game mode state management
- Spaceship cursor overlay
- Arrow key navigation (node-to-node)
- Camera animation (smooth transitions)

**Rationale:** Complex feature requiring everything else to work. Nice-to-have, can be deferred.

### Phase 7: Polish (Week 4-5)
**Focus:** Production readiness
- Loading states
- Error boundaries
- Performance profiling
- Mobile testing/tweaks
- Content population

**Rationale:** Refinement of completed features.

## Phase Ordering Rationale

**Sequential dependencies:**
- Foundation → Shapes (can't create shapes without setup)
- Shapes → Layout (need shapes to position)
- Layout → Complete system (need positioning before adding all shapes)
- Complete system → Interactions (need all shapes before interactions make sense)
- Interactions → Game mode (advanced navigation needs basic navigation)
- Game mode → Polish (refinement comes last)

**Validation points:**
- After Phase 2: Single shape renders correctly (validates pattern)
- After Phase 3: Timeline layout works (validates positioning)
- After Phase 4: All content types render (validates completeness)
- After Phase 5: Links work, mobile works (validates core UX)
- After Phase 6: Game mode works (validates stretch goal)

**Risk mitigation:**
- Start with simplest shape (blog post) to validate pattern early
- Test layout logic with one shape type before adding all types
- Build game mode last (nice-to-have, can be cut if needed)

## Research Flags for Phases

**Phase 1-2: Low research needs** — Standard Next.js + tldraw setup, well-documented patterns

**Phase 3: Moderate research needs** — Timeline layout algorithm may need experimentation for visual appeal. Position calculator logic is custom.

**Phase 4: Low research needs** — Repeating proven shape pattern, just different rendering

**Phase 5: Low research needs** — Standard React event handlers, tldraw provides examples

**Phase 6: Higher research needs** — Camera animation API, keyboard event handling with tldraw, smooth node-to-node navigation requires experimentation

**Phase 7: Low research needs** — Standard React patterns for loading/errors

## Critical Architectural Decisions

### Decision 1: Custom Shape per Content Type (vs. Generic Shape)
**Rationale:** Type safety, independent customization, cleaner code
**Trade-off:** More boilerplate, but worth it for maintainability
**Impact:** Easier to extend, modify individual content types

### Decision 2: Build-Time Content Loading (vs. Runtime API)
**Rationale:** Simpler, faster, version-controlled content
**Trade-off:** Requires rebuild for content changes
**Impact:** No database needed, content lives with code

### Decision 3: Editor API for Initialization (vs. Declarative)
**Rationale:** tldraw's pattern, allows calculated positioning
**Trade-off:** Imperative code, shapes created after mount
**Impact:** Full control over layout, easy to adjust

### Decision 4: Separate Canvas and App State
**Rationale:** Clean separation, tldraw handles canvas optimally
**Trade-off:** Synchronization needed for some features
**Impact:** Game mode state separate from canvas state

## Potential Challenges

### Challenge 1: Initial Shape Creation Flash
**Issue:** Shapes created after mount via Editor API — brief empty canvas flash
**Mitigation:** Loading state overlay, or fast enough on modern devices to not matter
**Phase affected:** Phase 3 (Layout)

### Challenge 2: Timeline Layout Algorithm
**Issue:** Calculating visually appealing chronological positions
**Mitigation:** Start with simple staggered grid, iterate based on visual testing
**Phase affected:** Phase 3 (Layout)

### Challenge 3: Mobile Touch Gestures
**Issue:** Touch interactions different from mouse — need testing
**Mitigation:** tldraw handles most touch events, but test thoroughly on devices
**Phase affected:** Phase 5 (Interactions)

### Challenge 4: Game Mode Camera Animation
**Issue:** Smooth node-to-node navigation requires understanding Editor animation API
**Mitigation:** Use tldraw's built-in `animateCamera()`, may need tweaking for feel
**Phase affected:** Phase 6 (Game Mode)

### Challenge 5: Content Scale
**Issue:** Unclear how many timeline nodes will exist (50? 200?)
**Mitigation:** tldraw handles 200 nodes easily, no optimization needed unless >500
**Phase affected:** All phases (but low risk)

## Dependencies Between Components

```
Project Setup (Phase 1)
    ↓
Content Loader (Phase 1)
    ↓
First Shape (Phase 2) ← Content Types (Phase 1)
    ↓
Layout Calculator (Phase 3)
    ↓
All Shapes (Phase 4) ← Shape Pattern (Phase 2)
    ↓
Interactions (Phase 5)
    ↓
Game Mode (Phase 6) ← Camera Control (Phase 3)
    ↓
Polish (Phase 7)
```

**Critical path:** Setup → First Shape → Layout → All Shapes → Interactions

**Parallel opportunities:**
- Content Loader can be finalized while building shapes (Phase 1-4)
- UI components can be built alongside shape system (Phase 2-4)
- Game mode planning can happen during interaction phase (Phase 5)

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| tldraw Integration | **HIGH** | Official examples, starter kits, clear patterns |
| Custom Shapes | **HIGH** | Documented API, multiple working examples |
| Content Loading | **HIGH** | Standard Node.js file operations, well-understood |
| Layout Algorithm | **MEDIUM** | Custom logic, needs visual testing |
| Editor API Usage | **MEDIUM-HIGH** | Documented but less example coverage |
| Game Mode Implementation | **MEDIUM** | More complex, camera animation API less documented |
| Overall Architecture | **HIGH** | Proven patterns, well-suited to use case |

## Validation Strategy

**Phase 2 Validation:** Create single blog post shape, verify:
- ✅ Markdown loads correctly
- ✅ Shape renders with correct data
- ✅ Styling works in canvas
- ✅ Click handler opens external link

**Phase 3 Validation:** Create 3-5 shapes, verify:
- ✅ Shapes positioned chronologically
- ✅ Camera centers on portfolio node
- ✅ Pan/zoom works smoothly
- ✅ Mobile viewport correct

**Phase 5 Validation:** Test all interactions, verify:
- ✅ All external links work
- ✅ Touch gestures work on tablet
- ✅ Keyboard shortcuts work
- ✅ Responsive on mobile

**Phase 6 Validation:** Test game mode, verify:
- ✅ Hotkey toggles game mode
- ✅ Arrow keys navigate nodes
- ✅ Camera animates smoothly
- ✅ Spaceship cursor displays

## Gaps to Address

### Research Gaps
- **Camera animation API details:** Need to experiment with animation options for game mode
- **Timeline layout aesthetics:** May need multiple iterations to find visually appealing positioning
- **Mobile performance:** Unknown how tldraw performs on older mobile devices (test in Phase 5)

### Implementation Gaps
- **Content schema:** Need to finalize exact markdown frontmatter format for all content types
- **Timeline metadata:** Need to decide on date format, sorting logic for entries
- **Game mode UX:** Need to design exact navigation behavior (skip nodes? wrap around?)

### Testing Gaps
- **Browser compatibility:** Need to test on Safari, Firefox, mobile browsers
- **Touch device testing:** Need physical devices or cloud testing (BrowserStack)
- **Content volume testing:** Need to populate ~50-100 nodes to test realistic scale

## Recommended Next Steps

1. **For Roadmap Creation:**
   - Use 7-phase structure outlined above
   - Allocate 1-2 weeks per major phase
   - Plan validation checkpoints at end of Phases 2, 3, 5, 6
   - Mark Phase 6 (Game Mode) as optional stretch goal

2. **For Implementation:**
   - Start with Phase 1 foundation immediately
   - Keep shape components simple (HTML + CSS, no fancy animations initially)
   - Use placeholder content for early phases
   - Don't optimize prematurely — tldraw handles scale well

3. **For Risk Management:**
   - Build proof-of-concept shape (Phase 2) before committing to architecture
   - Test on mobile device early (after Phase 3)
   - Keep game mode (Phase 6) as optional — defer if time-constrained
   - Profile performance after Phase 4 to confirm no scaling issues

---
*Research completed: 2024-03-22*
*Source quality: HIGH (official docs, starter kits, working examples)*
*Recommendation confidence: HIGH for core features, MEDIUM for game mode*
