---
phase: 10-search-and-extras
plan: "02"
subsystem: blog
tags: [toc, copy-button, backlink, rehype-slug, timeline-match, ux]
dependency_graph:
  requires: [10-01]
  provides: [copy-button, table-of-contents, canvas-backlink, heading-ids]
  affects: [apps/blog/src/pages/[slug].astro, apps/blog/src/layouts/PostLayout.astro, apps/blog/src/components/TableOfContents.astro]
tech_stack:
  added: [rehype-slug]
  patterns: [IntersectionObserver active-highlight, clipboard API, TDD utility]
key_files:
  created:
    - apps/blog/src/lib/timeline-match.ts
    - apps/blog/src/test/timeline-match.test.ts
    - apps/blog/src/components/TableOfContents.astro
  modified:
    - apps/blog/src/pages/[slug].astro
    - apps/blog/src/layouts/PostLayout.astro
    - apps/blog/src/styles/global.css
    - apps/blog/package.json
    - pnpm-lock.yaml
decisions:
  - rehype-slug inserted between remarkRehype and rehypeShiki — must run on hast tree before stringify
  - hasTimelineEntry uses url.split('/').pop() === slug (exact last segment, not endsWith) to prevent false positives
  - pre.style.position set inline at runtime not in CSS — avoids Shiki pre conflicts per research anti-pattern
  - ToC auto-removed when fewer than 2 headings — prevents sidebar for short posts
  - Canvas backlink links to plain https://illulachy.me (no query params, per D-11)
metrics:
  duration: 8m
  completed: "2026-04-01"
  tasks: 2
  files: 9
---

# Phase 10 Plan 02: Reading Features — ToC, Copy Button, Canvas Backlink Summary

**One-liner:** Sticky ToC sidebar with IntersectionObserver active-highlight, hover-reveal copy button with icon swap, and conditional canvas backlink for matched timeline posts using rehype-slug + hasTimelineEntry utility.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | timeline-match utility + tests + rehype-slug + copy-btn CSS | f02aa82 | timeline-match.ts, timeline-match.test.ts, global.css, package.json, pnpm-lock.yaml |
| 2 | TableOfContents, rehype-slug pipeline, PostLayout restructure | 10696b0 | [slug].astro, PostLayout.astro, TableOfContents.astro |

## What Was Built

**timeline-match.ts** — Pure utility `hasTimelineEntry(slug, modules)` that checks if a blog post slug matches any timeline entry's URL last segment. Uses `url.split('/').pop() === slug` for exact matching to prevent false positives (e.g., "typescript" won't match "typescript-generics").

**timeline-match.test.ts** — 5 unit tests covering: exact match, no match, partial match prevention, empty modules, missing frontmatter. All pass with vitest.

**rehype-slug in pipeline** — Inserted `.use(rehypeSlug)` between `.use(remarkRehype)` and `.use(rehypeShiki)` in [slug].astro so all h2/h3 headings receive ID attributes at build time for ToC anchor targets.

**TableOfContents.astro** — Sticky xl-only sidebar (`hidden xl:block sticky top-24 w-56 shrink-0 self-start`). Client script: queries article headings, builds anchor list with h3 indentation, observes with IntersectionObserver (rootMargin `-10% 0% -80% 0%`) to highlight active heading. Auto-removes when fewer than 2 headings.

**Copy button** — Injected via `initCopyButtons()` in PostLayout script tag. Appends button to each `pre` element with SVG copy icon. On click: copies `code.innerText` to clipboard, swaps to checkmark SVG for 2s feedback. `pre.style.position = 'relative'` set inline (not CSS) to avoid Shiki conflicts.

**Canvas backlink** — Conditional "See on timeline &#x2197;" anchor shown in both post header (after reading time) and footer (right-aligned). Links to `https://illulachy.me`. Only rendered when `showTimelineLink === true`.

**PostLayout restructure** — Added `xl:max-w-5xl` to main, wrapped article + TableOfContents in `xl:flex xl:gap-12`, added `min-w-0 flex-1 max-w-[65ch]` to article to prevent flex overflow. Footer now flex with space-between for browse link + optional backlink.

## Verification

All checks pass:

- `pnpm --filter @illu/blog test --run` — 26 tests passing (6 test files)
- rehypeSlug in pipeline: PASS
- showTimelineLink wired: PASS
- TableOfContents rendered: PASS
- copy-btn script: PASS
- toc-sidebar hidden xl:block: PASS
- IntersectionObserver: PASS
- canvas backlink in header and footer: PASS
- navigator.clipboard.writeText: PASS
- xl:flex two-column layout: PASS
- article min-w-0 flex-1: PASS

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is wired end-to-end. Timeline matching runs at build time from actual content glob. Copy button and ToC are fully functional client-side scripts.

## Self-Check: PASSED

- apps/blog/src/lib/timeline-match.ts: exists
- apps/blog/src/test/timeline-match.test.ts: exists
- apps/blog/src/components/TableOfContents.astro: exists
- Task 1 commit f02aa82: verified in git log
- Task 2 commit 10696b0: verified in git log
