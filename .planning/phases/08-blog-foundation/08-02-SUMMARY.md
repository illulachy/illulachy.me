---
phase: 08-blog-foundation
plan: 02
subsystem: ui
tags: [astro, tailwindcss, blog, vitest, tdd, reading-time, post-list]

# Dependency graph
requires:
  - phase: 08-blog-foundation
    plan: 01
    provides: "@illu/tokens, BaseLayout, vitest config, 4 blog post markdown files"

provides:
  - "calcReadingTime utility (200 wpm, Math.round, Math.max(1, ...) floor)"
  - "PostCard.astro component: Medium-style post row with title, excerpt, metadata, hover state"
  - "index.astro post list page: import.meta.glob loading, reverse-chronological sort, 680px layout"
  - "6 reading time unit tests + 3 sort unit tests passing via vitest"

affects: [08-03, blog-post-detail, blog-routing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD: tests written before implementation — RED (import fail) confirmed, then GREEN"
    - "import.meta.glob with { eager: true } for Astro static markdown loading"
    - "mod.rawContent?.() for reading time body extraction from Astro markdown modules"
    - "4-level relative path from src/pages/ to repo root for cross-workspace glob"

key-files:
  created:
    - apps/blog/src/lib/reading-time.ts
    - apps/blog/src/test/reading-time.test.ts
    - apps/blog/src/test/sort.test.ts
    - apps/blog/src/components/PostCard.astro
  modified:
    - apps/blog/src/pages/index.astro

key-decisions:
  - "mod.rawContent?.() used for markdown body text extraction (Astro v5+ eager glob returns rawContent function)"
  - "TDD flow confirmed: reading-time.test.ts failed with module-not-found before lib was created"
  - "Glob path ../../../../packages/content/content/posts/**/*.md validated — 4 levels from src/pages/"

requirements-completed: [BLOG-01, BLOG-04, VIS-02]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 08 Plan 02: Post List Page Summary

**Post list page with import.meta.glob loading, reverse-chronological sort, PostCard component, reading time utility at 200 wpm, and 11 vitest unit tests (TDD)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T16:13:51Z
- **Completed:** 2026-03-29T16:18:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `calcReadingTime` utility (200 wpm, round, minimum 1 min read) with TDD: RED confirmed → GREEN passing
- Created 6 reading-time tests and 3 sort tests — all 11 tests pass (including 2 existing glob-resolution tests = 11 total)
- Created `PostCard.astro` with Noto Serif 36px titles, Space Grotesk excerpts, metadata row (date · reading time · category tag pill), hover state `surface-container-low`, semantic `<article>` + `<time datetime>`
- Replaced Phase 7 placeholder `index.astro` with working post list using `import.meta.glob`, reverse-chronological sort, 680px centered layout, empty state per Copywriting Contract
- Build verified: 4 posts render in correct order (April 2024 → Jan 2024 → Jan 2024 → Nov 2023) with correct reading times

## Task Commits

1. **Task 1: Reading time utility + sort logic + unit tests (TDD)** - `3f7fc2f` (feat)
2. **Task 2: Post list page (index.astro) and PostCard component** - `f21541f` (feat)

## Files Created/Modified

- `apps/blog/src/lib/reading-time.ts` - calcReadingTime function: 200 wpm, Math.round, Math.max(1, ...) floor
- `apps/blog/src/test/reading-time.test.ts` - 6 unit tests: 200/400/600 words, short text, empty string, rounding
- `apps/blog/src/test/sort.test.ts` - 3 unit tests: multi-post sort, single post, empty array
- `apps/blog/src/components/PostCard.astro` - Medium-style post row with all UI-SPEC compliance
- `apps/blog/src/pages/index.astro` - Post list page replacing Phase 7 placeholder

## Decisions Made

- `mod.rawContent?.()` is the correct API for extracting raw markdown body text from Astro eager glob modules — optional chaining `?.()` handles edge cases where the function might be absent
- TDD RED phase confirmed: vitest correctly fails with "Cannot find module" before the implementation file exists
- Glob path `../../../../packages/content/content/posts/**/*.md` validated — goes 4 levels up from `src/pages/` (src/ → apps/blog/ → apps/ → repo root) then into packages/

## Deviations from Plan

None — plan executed exactly as written. The Node 22 requirement (pnpm install under Node 22) was a known issue from Plan 01 and handled correctly by reinstalling before build.

## Known Stubs

None — all 4 post cards render with live data from markdown files. Reading times calculated from actual markdown body content. No placeholder data.

## Self-Check: PASSED

- `apps/blog/src/lib/reading-time.ts` — exists
- `apps/blog/src/test/reading-time.test.ts` — exists
- `apps/blog/src/test/sort.test.ts` — exists
- `apps/blog/src/components/PostCard.astro` — exists
- `apps/blog/src/pages/index.astro` — exists (replaced placeholder)
- Commit `3f7fc2f` — feat(08-02): reading time utility + sort logic + unit tests (TDD)
- Commit `f21541f` — feat(08-02): post list page and PostCard component
- `pnpm --filter @illu/blog test` — 11/11 tests pass
- `apps/blog/dist/index.html` contains "Deep Dive" — VERIFIED
- `apps/blog/dist/index.html` contains "min read" — VERIFIED

---
*Phase: 08-blog-foundation*
*Completed: 2026-03-29*
