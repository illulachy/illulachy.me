# Phase 10: Search and Extras - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Add full-text search and quality-of-life reading features to the blog. Delivers: Pagefind-powered search bar on the blog index, copy-to-clipboard button on code blocks, sticky sidebar table of contents on post pages, and a "See on timeline" backlink on every post.

**What this phase delivers:**
- Pagefind search bar — prominently placed on blog index page below the header, custom Stitch-styled UI
- Copy-to-clipboard button — hover-to-reveal on code blocks, icon swap feedback
- Table of contents — sticky desktop sidebar (h2 + h3), hidden on mobile
- Canvas backlink — "See on timeline" link in both post header and footer, links to illulachy.me homepage

**What this phase does NOT include:**
- Deep-link canvas navigation (query param targeting a specific node) — simple homepage link only
- Per-post dynamically generated OG images (already deferred in Phase 9)
- Manual dark/light toggle (not in v1.1 scope)
- Comments, newsletter, or other engagement features

</domain>

<decisions>
## Implementation Decisions

### Search (SRCH-01)

- **D-01:** Search entry point is a search bar prominently displayed on the blog index page, below the header — not in the Nav, not a dedicated `/search` page
- **D-02:** Custom Stitch-styled UI — dark `surface-container` background, mauve highlight/accent, matches blog aesthetic exactly. Do NOT use Pagefind's default CSS; build custom result rendering using Pagefind's JavaScript API
- **D-03:** Pagefind 1.4.x (decided in STATE.md) — WASM query, zero server required, build-time index generation via `pagefind` binary after `astro build`

### Copy Button (SRCH-02)

- **D-04:** Copy button is hover-to-reveal — appears when the user hovers the code block, hidden at rest. Cleaner, less visual noise
- **D-05:** Feedback is icon swap — copy icon briefly becomes a checkmark icon, then resets after ~2 seconds. No toast or text label change
- **D-06:** Button positioned top-right corner of the code block (floating over the pre element)

### Table of Contents (SRCH-03)

- **D-07:** Sticky sidebar — fixed to the right of the 65ch prose column on desktop, stays visible as user scrolls (classic blog ToC pattern)
- **D-08:** Includes h2 and h3 — two levels of depth. h3 entries are indented under their parent h2
- **D-09:** Hidden entirely on mobile — ToC only renders on desktop (no collapsible inline version). Simplest approach
- **D-10:** Headings are extracted from rendered post content and each gets an `id` anchor for jump links

### Canvas Backlink (SRCH-04)

- **D-11:** Simple link to `https://illulachy.me` — no query params, no deep-linking to a specific node. User lands on the canvas and explores from there
- **D-12:** Link appears in **both** the post header (near title/metadata) and the post footer (alongside "← Browse all posts")
- **D-13:** Only show the backlink on posts that have a matching timeline entry (i.e. the post's slug matches a timeline entry `url` that points to `writing.illulachy.me/[slug]`). Posts with no timeline entry omit the link
- **D-14:** Link text: "See on timeline ↗" — minimal, consistent with blog's typographic tone

### Claude's Discretion

- Pagefind build integration method (postbuild script in `package.json` vs Vite plugin vs Astro integration)
- Whether copy button uses inline SVG icons or a lightweight icon library already in the project
- How to extract headings for ToC (rehype plugin at build time vs client-side DOM query)
- Exact mechanism for matching post slug to timeline entry (filename comparison vs URL field matching)
- Whether ToC uses `IntersectionObserver` to highlight the active heading as the user scrolls

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `.stich/DESIGN.md` — Core design philosophy, color palette, typography rules, "No-Line Rule", glassmorphism rules, spacing principles
- `.stich/visual/COMPONENTS.html` — Dark mode CSS token values (source of truth for dark @theme)
- `.stich/visual/COMPONENTS_LIGHT.html` — Light mode CSS token values (source of truth for light @theme)

### Blog App
- `apps/blog/src/layouts/PostLayout.astro` — Article wrapper where ToC sidebar and copy button logic integrate
- `apps/blog/src/layouts/BaseLayout.astro` — Head/nav wrapper; search bar is on index, not here
- `apps/blog/src/pages/index.astro` — Blog index — search bar goes here
- `apps/blog/astro.config.ts` — Astro config with Shiki themes and sitemap integration; Pagefind integration may add a postbuild hook here

### Content / Data
- `packages/content/src/types/content.ts` — `ContentNode` type with `id`, `url`, `type` fields — used to match blog posts to timeline entries for the canvas backlink

### Prior Phase Context
- `.planning/phases/08-blog-foundation/08-CONTEXT.md` — Visual identity decisions (tokens, fonts, dark mode, no-line rule)
- `.planning/phases/09-discovery-and-seo/09-CONTEXT.md` — Nav structure, PostLayout OG props, BaseLayout interface

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Nav.astro` — existing sticky nav (glassmorphism); search bar is NOT in the nav per D-01
- `PostLayout.astro` — prose `<slot />` wrapper; ToC sidebar will be added as a sibling column in a layout grid change here
- `BaseLayout.astro` — accepts `hideNav`, `description`, `ogImage`, `canonicalUrl`, `ogType` props — no changes needed for Phase 10
- `apps/blog/src/styles/global.css` — Tailwind v4 @theme tokens; any Pagefind custom styles should integrate here

### Established Patterns
- Tailwind v4 `@theme` tokens for all color/spacing values — Pagefind custom UI must use these tokens (e.g. `bg-surface-container`, `text-interactive-default`) not hardcoded hex values
- `import.meta.glob()` for content loading — consistent pattern across all pages
- JetBrains Mono already loaded via Google Fonts in `BaseLayout.astro` — code blocks use it

### Integration Points
- `PostLayout.astro` — ToC sidebar requires a layout change from single-column to `prose + sidebar` grid on desktop
- `apps/blog/package.json` — Pagefind binary must run after `astro build`; add to `build` script or postbuild
- `packages/content/content/` yearly dirs + `posts/` subdir — slug matching for canvas backlink reads from compiled timeline JSON or filename comparison

</code_context>

<specifics>
## Specific Ideas

- Search bar below the blog index header — visually prominent, custom Stitch-styled, not a nav widget
- ToC reference: Dan Abramov's blog style (sticky right sidebar, active heading highlighted as you scroll)
- Copy button: icon-only, top-right corner of code block, appears on code block hover
- "See on timeline ↗" text for backlink — appears in both header metadata area and footer link row

</specifics>

<deferred>
## Deferred Ideas

- Deep-link canvas navigation (`illulachy.me?node=slug`) — user chose simple homepage link; could be a future phase if desired
- Per-post dynamic OG images — already deferred in Phase 9

</deferred>

---

*Phase: 10-search-and-extras*
*Context gathered: 2026-03-31*
