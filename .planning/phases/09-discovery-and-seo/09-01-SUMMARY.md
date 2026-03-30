---
phase: 09-discovery-and-seo
plan: 01
subsystem: ui
tags: [astro, seo, navigation, tailwind, og-meta, rss, sitemap]

# Dependency graph
requires:
  - phase: 08-blog-foundation
    provides: BaseLayout, PostLayout, PostCard, Astro blog scaffold
provides:
  - Nav.astro sticky glassmorphism navigation header with Writing wordmark
  - BaseLayout.astro extended with OG/meta head block (og:title, og:description, og:image, canonical, RSS autodiscovery)
  - PostLayout.astro passing post-specific description, canonicalUrl, ogType="article" to BaseLayout
  - PostCard.astro with category pill as clickable /category/{slug} link, no nested anchors
  - slugify.ts utility for URL-safe slug normalization
  - og-default.svg static OG fallback image (1200x630)
  - 404.astro standalone styled 404 page
  - @astrojs/rss and @astrojs/sitemap installed, ready for Plan 02
affects:
  - 09-02-PLAN (category/tag listing pages, RSS endpoint, sitemap — all build on this foundation)

# Tech tracking
tech-stack:
  added: ['@astrojs/rss ^4.0.18', '@astrojs/sitemap ^3.7.2']
  patterns:
    - slugify utility for consistent URL normalization across PostCard, category pages, tag pages
    - BaseLayout prop-driven OG head block with absolute URL construction via Astro.site
    - Standalone 404 page (no BaseLayout) for pages that must not show nav
    - PostLayout passes ogType="article" and canonicalUrl using new URL(Astro.url.pathname, Astro.site).href

key-files:
  created:
    - apps/blog/src/components/Nav.astro
    - apps/blog/src/lib/slugify.ts
    - apps/blog/src/test/taxonomy.test.ts
    - apps/blog/src/pages/404.astro
    - apps/blog/public/og-default.svg
  modified:
    - apps/blog/src/layouts/BaseLayout.astro
    - apps/blog/src/layouts/PostLayout.astro
    - apps/blog/src/components/PostCard.astro
    - apps/blog/package.json
    - pnpm-lock.yaml

key-decisions:
  - "SVG used instead of PNG for og-default (developer can convert if Twitter/X requires PNG)"
  - "PostCard outer anchor removed — only title+excerpt are the link to avoid nested <a> tags"
  - "404 page is a standalone HTML shell (no BaseLayout) so it never shows nav"
  - "canonicalUrl constructed via new URL(Astro.url.pathname, Astro.site).href for correct production URL in dev mode"

patterns-established:
  - "slugify: trim().toLowerCase().replace(/\\s+/g, '-') — use this consistently in category/tag pages"
  - "BaseLayout ogImageAbsolute: check startsWith('http') then new URL(ogImage, Astro.site).href"
  - "Standalone pages (404) import global.css directly without BaseLayout"

requirements-completed:
  - TAX-03
  - TAX-04
  - SEO-03
  - SEO-04

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 9 Plan 01: Discovery and SEO — Foundation Summary

**Sticky glassmorphism Nav, BaseLayout OG meta extension, PostCard category links, slugify utility with tests, standalone 404 page, and OG fallback SVG — foundation for Plan 02 taxonomy and RSS work**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-30T16:11:37Z
- **Completed:** 2026-03-30T16:14:41Z
- **Tasks:** 3 completed
- **Files modified:** 10

## Accomplishments

- Nav.astro renders sticky glassmorphism header ("Writing" wordmark + illulachy.me link) on all blog pages via BaseLayout
- BaseLayout extended with full OG/meta head block: og:title, og:description, og:image (absolute URL), og:type, canonical, RSS autodiscovery link
- PostCard category pill converted from `<span>` to `<a href="/category/{slug}">` with slugify — fixes nested anchor invalid HTML issue
- 404.astro standalone page — no nav, centered witty message, on-brand dark background
- slugify.ts utility with 5 passing unit tests — consistent URL normalization for taxonomy work in Plan 02
- @astrojs/rss and @astrojs/sitemap installed (needed for Plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps + slugify utility with tests + OG image asset** - `d3082da` (feat)
2. **Task 2: Nav + BaseLayout OG extension + PostCard category link + PostLayout canonical** - `6d618dd` (feat)
3. **Task 3: Styled 404 page** - `2bb026e` (feat)

## Files Created/Modified

- `apps/blog/src/components/Nav.astro` — Sticky glassmorphism nav (Writing wordmark + portfolio link)
- `apps/blog/src/layouts/BaseLayout.astro` — Extended with OG/meta props, Nav rendering, hideNav prop
- `apps/blog/src/layouts/PostLayout.astro` — Now passes description, canonicalUrl, ogType="article" to BaseLayout
- `apps/blog/src/components/PostCard.astro` — Category pill is now /category/{slug} link, no nested anchors
- `apps/blog/src/lib/slugify.ts` — URL-safe slug normalization utility
- `apps/blog/src/test/taxonomy.test.ts` — 5 unit tests for slugify
- `apps/blog/src/pages/404.astro` — Standalone styled 404 page
- `apps/blog/public/og-default.svg` — 1200x630 OG fallback image (dark bg, Writing wordmark, mauve URL)
- `apps/blog/package.json` — Added @astrojs/rss and @astrojs/sitemap
- `pnpm-lock.yaml` — Updated lockfile

## Decisions Made

- **SVG for OG image**: Created as SVG rather than PNG. SVG works for most social crawlers; Twitter/X may require PNG — developer can convert with any image tool when deploying. The og:image tag references `/og-default.svg`.
- **PostCard nested anchor fix**: Removed the outer `<a>` wrapping the entire article card. Now only the title+excerpt is the post link. This eliminates the invalid HTML nested anchor pattern that would have broken category pill clicks.
- **404 standalone shell**: 404 page does not use BaseLayout at all — standalone HTML shell with direct `global.css` import. This ensures nav never appears on 404 regardless of BaseLayout changes.
- **canonicalUrl pattern**: `new URL(Astro.url.pathname, Astro.site).href` — always uses the production `site` config value, giving correct canonical URL even during local dev.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can now build on this foundation:
- Category listing pages (`/category/[name]`) — PostCard links are wired, slugify is ready
- Tag listing pages (`/tag/[name]`) — same slugify pattern
- RSS endpoint (`/rss.xml`) — @astrojs/rss installed, glob pattern established
- Sitemap integration — @astrojs/sitemap installed, astro.config.ts needs integration added

All 16 unit tests pass (4 test files). Build verification (nav visible, OG tags in HTML, 404 on invalid URL) is deferred to Plan 02 end-to-end or `/gsd:verify-work`.

## Self-Check: PASSED

All key files exist on disk and all task commits verified in git history.

---
*Phase: 09-discovery-and-seo*
*Completed: 2026-03-30*
