---
phase: 08-blog-foundation
plan: 01
subsystem: ui
tags: [astro, tailwindcss, shiki, tokens, blog, vitest]

# Dependency graph
requires:
  - phase: 07-monorepo-scaffold
    provides: Turborepo monorepo with apps/blog placeholder and packages/content

provides:
  - "@illu/tokens workspace package with Tailwind v4 @theme block (dark default + light override)"
  - "Blog app configured with @tailwindcss/vite, @tailwindcss/typography, vitest"
  - "Custom Shiki themes illu-dark and illu-light (Stitch palette)"
  - "BaseLayout.astro with Google Fonts (Noto Serif, Space Grotesk, JetBrains Mono)"
  - "global.css with Tailwind + @illu/tokens import, prose overrides, Shiki CSS variable switching"
  - "4 blog post markdown files in packages/content/content/posts/ with D-02 frontmatter"
  - "Glob resolution test validating cross-workspace path arithmetic"
  - ".nvmrc specifying Node 22 requirement"

affects: [08-02, 08-03, blog-pages, blog-routing, blog-content-collections]

# Tech tracking
tech-stack:
  added:
    - "@illu/tokens (new workspace package)"
    - "@tailwindcss/vite ^4.2.2"
    - "@tailwindcss/typography ^0.5.19"
    - "gray-matter ^4.0.3"
    - "@shikijs/rehype latest"
    - "vitest ^3.1.0"
    - "tailwindcss ^4.0.0"
  patterns:
    - "Tailwind v4 @theme block in tokens.css for design token sharing across apps"
    - "Light mode via :root overrides in @media (prefers-color-scheme: light) — NOT @theme inside @media"
    - "Shiki dual-theme switching via --shiki-dark / --shiki-light CSS variables on .astro-code"
    - "BaseLayout as single entry point importing global.css"
    - "Vitest with globals:true for Node.js filesystem-based glob validation tests"

key-files:
  created:
    - packages/tokens/package.json
    - packages/tokens/src/tokens.css
    - apps/blog/src/styles/global.css
    - apps/blog/src/shiki/illu-dark.json
    - apps/blog/src/shiki/illu-light.json
    - apps/blog/src/layouts/BaseLayout.astro
    - apps/blog/vitest.config.ts
    - apps/blog/src/test/glob-resolution.test.ts
    - packages/content/content/posts/deep-dive-typescript.md
    - packages/content/content/posts/year-in-review.md
    - packages/content/content/posts/tldraw-discovery.md
    - packages/content/content/posts/exploring-webgpu.md
    - .nvmrc
  modified:
    - apps/blog/package.json
    - apps/blog/astro.config.ts
    - apps/blog/tsconfig.json
    - pnpm-lock.yaml

key-decisions:
  - "Tailwind v4 @theme inside @media (prefers-color-scheme) is unsupported — use :root overrides in the media query instead"
  - "Shiki JSON themes imported directly in astro.config.ts with @ts-ignore (JSON shape compatible with Shiki API)"
  - ".nvmrc added with Node 22 requirement (Vite 8 / rolldown requires Node >=22.12.0)"
  - "Post files created in posts/ during Task 1 (needed for glob test to pass) — Task 2 upgraded with full prose"

patterns-established:
  - "Pattern: @illu/tokens is a CSS-only package with no TypeScript — imported via @import in CSS files"
  - "Pattern: Tailwind v4 token naming uses --color-* prefix for colors, --font-* for fonts"
  - "Pattern: Shiki dual themes configured in astro.config.ts, CSS switching in global.css"
  - "Pattern: Blog content lives in packages/content/content/posts/ — apps import via 4-level relative path"

requirements-completed: [VIS-01, BLOG-03]

# Metrics
duration: 7min
completed: 2026-03-29
---

# Phase 08 Plan 01: Blog Infrastructure Summary

**@illu/tokens Tailwind v4 design token package, Astro blog with custom Shiki themes, BaseLayout with Google Fonts, and 4 substantive blog post markdown files**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-29T16:03:23Z
- **Completed:** 2026-03-29T16:10:00Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Created `@illu/tokens` workspace package with Tailwind v4 `@theme` block — dark (#131313) default, light (#FAFAFA) override
- Configured blog app with Tailwind v4, custom Shiki dual-themes (illu-dark/illu-light), and BaseLayout with Google Fonts
- Created vitest + glob-resolution test validating cross-workspace content path (addresses STATE.md risk item)
- Created 4 blog post files with D-02 frontmatter and 600-850 words each, including Shiki-exercising code blocks

## Task Commits

1. **Task 1: Create @illu/tokens package and configure blog infrastructure** - `58cff22` (feat)
2. **Task 2: Create blog post content files** - `f8865cc` (feat)

## Files Created/Modified

- `packages/tokens/package.json` - @illu/tokens workspace package manifest
- `packages/tokens/src/tokens.css` - Tailwind v4 @theme block with dark default and light :root overrides
- `apps/blog/package.json` - Added @illu/tokens, @tailwindcss/vite, @tailwindcss/typography, gray-matter, vitest deps
- `apps/blog/astro.config.ts` - Added Tailwind vite plugin, custom Shiki themes (illu-dark/illu-light)
- `apps/blog/tsconfig.json` - Added resolveJsonModule:true for Shiki JSON imports
- `apps/blog/src/styles/global.css` - Tailwind + @illu/tokens imports, prose overrides, Shiki CSS switching
- `apps/blog/src/shiki/illu-dark.json` - Custom dark theme (Stitch palette: mauve strings, purple keywords)
- `apps/blog/src/shiki/illu-light.json` - Custom light theme (purple accent on white)
- `apps/blog/src/layouts/BaseLayout.astro` - Base HTML with Google Fonts, global.css, page title prop
- `apps/blog/vitest.config.ts` - Vitest config with globals:true
- `apps/blog/src/test/glob-resolution.test.ts` - Cross-workspace path validation test
- `packages/content/content/posts/deep-dive-typescript.md` - TypeScript generics deep dive (600w, 4 code blocks)
- `packages/content/content/posts/year-in-review.md` - 2023 year review (743w)
- `packages/content/content/posts/tldraw-discovery.md` - tldraw library exploration (754w, code blocks)
- `packages/content/content/posts/exploring-webgpu.md` - WebGPU exploration (854w, WGSL shaders)
- `.nvmrc` - Node 22 version requirement

## Decisions Made

- Tailwind v4 `@theme` inside `@media (prefers-color-scheme)` is not supported — light mode overrides use `:root {}` inside the media query instead
- Shiki JSON themes are imported directly in `astro.config.ts` with `@ts-ignore` since the JSON objects are structurally compatible with the Shiki theme API
- `.nvmrc` added proactively (Node 22 required for Vite 8 / rolldown — was a known risk in STATE.md)
- Posts created in `packages/content/content/posts/` during Task 1 (glob test requires them to pass) then committed separately in Task 2 with full prose

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .nvmrc with Node 22 requirement**
- **Found during:** Task 1 (blog build)
- **Issue:** Build failed with Node 20 — Astro 6 requires Node >=22.12.0. STATE.md identified this as a known concern but no file was created
- **Fix:** Created `.nvmrc` with `22` to document and enforce the Node version requirement
- **Files modified:** `.nvmrc`
- **Verification:** Build succeeds with Node 22
- **Committed in:** `58cff22` (Task 1 commit)

**2. [Rule 1 - Bug] Tailwind v4 @theme inside @media is unsupported**
- **Found during:** Task 1 implementation (plan showed `@theme` nested in `@media`)
- **Issue:** Tailwind v4 does not support `@theme` inside media queries — this would cause build errors
- **Fix:** Light mode overrides use `:root {}` inside `@media (prefers-color-scheme: light)` instead of nested `@theme`
- **Files modified:** `packages/tokens/src/tokens.css`
- **Verification:** Blog builds successfully
- **Committed in:** `58cff22` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug fix)
**Impact on plan:** Both fixes necessary for correctness and build success. No scope creep.

## Issues Encountered

- Node 20/22 mismatch: packages installed with Node 20 need reinstall under Node 22 to get correct rolldown native bindings. Resolved by running `pnpm install` again after switching Node version.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- @illu/tokens and blog infrastructure ready for Plan 02 (page components)
- Vitest configured and ready for Plan 02 component tests
- 4 blog posts available for list/detail page development
- Known: blog still uses placeholder index.astro from Phase 7 — Plan 02 will replace it

## Self-Check: PASSED

- `packages/tokens/src/tokens.css` — exists
- `packages/tokens/package.json` — exists
- `apps/blog/src/layouts/BaseLayout.astro` — exists
- `apps/blog/src/test/glob-resolution.test.ts` — exists
- `apps/blog/src/shiki/illu-dark.json` — exists
- `apps/blog/src/shiki/illu-light.json` — exists
- `packages/content/content/posts/deep-dive-typescript.md` — exists
- `packages/content/content/posts/year-in-review.md` — exists
- `packages/content/content/posts/tldraw-discovery.md` — exists
- `packages/content/content/posts/exploring-webgpu.md` — exists
- Commits `58cff22` and `f8865cc` — verified in git log
- `pnpm --filter @illu/blog test` — 2/2 tests pass
- `pnpm --filter @illu/blog build` — build complete

---
*Phase: 08-blog-foundation*
*Completed: 2026-03-29*
