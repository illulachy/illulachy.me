---
phase: 08-blog-foundation
plan: 03
subsystem: ui
tags: [astro, shiki, unified, remark, rehype, blog, prose, typography]

# Dependency graph
requires:
  - phase: 08-blog-foundation
    plan: 08-01
    provides: BaseLayout.astro, global.css, Shiki themes, @illu/tokens, blog post markdown files

provides:
  - "PostLayout.astro with 65ch prose container, Noto Serif h1, reading time metadata"
  - "Dynamic [slug].astro route generating static pages for all 4 blog posts"
  - "remark+rehype+Shiki unified pipeline for zero-JS markdown rendering"
  - "Custom illu-dark/illu-light Shiki themes applied per D-17"
  - "reading-time.ts utility (200 wpm, min 1 min)"
  - "global.css updated to support .shiki class from @shikijs/rehype plugin"

affects: [08-02, blog-routing, blog-post-pages]

# Tech tracking
tech-stack:
  added:
    - "unified ^11.0.5 (markdown/HTML AST pipeline orchestrator)"
    - "remark-parse ^11.0.0 (markdown string to mdast)"
    - "remark-gfm ^4.0.1 (GitHub Flavored Markdown: tables, task lists, strikethrough)"
    - "remark-rehype ^11.1.2 (mdast to hast)"
    - "rehype-stringify ^10.0.1 (hast to HTML string)"
    - "@shikijs/rehype (rehype plugin for Shiki syntax highlighting)"
  patterns:
    - "getStaticPaths + import.meta.glob for Astro SSG with out-of-tree content"
    - "gray-matter for frontmatter parsing from raw markdown strings"
    - "Fragment set:html for injecting pre-rendered HTML without extra wrappers"
    - "Tailwind Typography prose class with Stitch token CSS variable overrides"

# Key files
key-files:
  created:
    - apps/blog/src/layouts/PostLayout.astro
    - apps/blog/src/pages/[slug].astro
    - apps/blog/src/lib/reading-time.ts
  modified:
    - apps/blog/package.json
    - apps/blog/src/styles/global.css

# Decisions
decisions:
  - "Use @shikijs/rehype in unified pipeline (not Astro markdown pipeline) for manual markdown rendering — Astro's built-in pipeline only handles .md/.mdx files, not raw strings from import.meta.glob"
  - "Custom Shiki themes passed as JSON objects directly to rehypeShiki themes config (D-17 satisfied)"
  - ".shiki class (from @shikijs/rehype) added to global.css CSS selectors alongside .astro-code"
  - "reading-time.ts created in plan 03 worktree (parallel execution — plan 02 creates same file independently)"
  - "prose class without prose-invert — rely on Stitch token CSS variables in global.css that switch via @media (prefers-color-scheme)"

# Metrics
metrics:
  duration: "8m"
  completed: "2026-03-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 8 Plan 03: Post Detail Page Summary

**One-liner:** Dynamic `[slug].astro` route with remark+rehype+Shiki pipeline wrapped in a 65ch PostLayout — full markdown rendering with zero-JS custom syntax highlighting.

## What Was Built

Two Astro components delivering full blog post rendering:

**PostLayout.astro** — Prose wrapper component:
- 65ch max-width centered layout (`max-w-[65ch] mx-auto`) with responsive padding
- Noto Serif h1 (`font-heading text-4xl font-semibold leading-tight tracking-tight`) per UI-SPEC D-10
- Reading time + formatted date metadata row (`text-sm text-text-tertiary`) below h1
- Tailwind Typography `prose` class with Stitch design token overrides from global.css
- Semantic HTML: `<article>`, `<header>`, `<footer>`, `<time datetime>`
- "Browse all posts" back-navigation link, no border lines (D-09)

**[slug].astro** — Dynamic post route:
- `getStaticPaths` with `import.meta.glob` loading raw markdown from `packages/content/content/posts/**/*.md`
- `gray-matter` for frontmatter extraction
- Unified pipeline: `remarkParse` → `remarkGfm` → `remarkRehype` → `rehypeShiki` → `rehypeStringify`
- Custom Shiki themes `illu-dark`/`illu-light` passed as JSON objects (D-17)
- Zero runtime JavaScript for syntax highlighting
- `<Fragment set:html={html} />` for clean HTML injection

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: PostLayout + reading-time | fdc968f | PostLayout component with 65ch prose and Stitch typography |
| Task 2: [slug].astro + pipeline | 3f7ecff | Dynamic post route with remark+rehype+Shiki pipeline |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CSS selector mismatch for Shiki code blocks**
- **Found during:** Task 2 build verification
- **Issue:** `global.css` only targeted `.astro-code` (Astro built-in markdown pipeline class). The `@shikijs/rehype` unified pipeline outputs `class="shiki shiki-themes illu-light illu-dark"` not `astro-code`.
- **Fix:** Added `.shiki` and `.shiki span` alongside `.astro-code` selectors in all three Shiki CSS rule sets in `global.css` (dark default, light override, code block styling).
- **Files modified:** `apps/blog/src/styles/global.css`
- **Commit:** 3f7ecff

**2. [Rule 2 - Missing functionality] reading-time.ts created in Plan 03 worktree**
- **Found during:** Task 2 implementation
- **Issue:** `reading-time.ts` is specified as a Plan 02 output but Plans 02 and 03 run in parallel (wave 2). The file was not present in the worktree.
- **Fix:** Created `apps/blog/src/lib/reading-time.ts` with `calcReadingTime(text: string): string` (200 wpm, min 1) per the interface spec in the plan context.
- **Files created:** `apps/blog/src/lib/reading-time.ts`
- **Commit:** fdc968f

**3. [Rule 3 - Blocking issue] Missing unified pipeline dependencies**
- **Found during:** Task 2 setup
- **Issue:** `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify` were not in `apps/blog/package.json`. Plan assumed they'd be present from Plan 01 but they weren't.
- **Fix:** Added all 5 packages to `apps/blog/package.json` dependencies. Ran `pnpm --filter @illu/blog add` to install.
- **Files modified:** `apps/blog/package.json`, `pnpm-lock.yaml`
- **Commit:** 3f7ecff

**4. [Rule 3 - Blocking issue] Node 22 required for Astro build**
- **Found during:** Task 2 build
- **Issue:** Build failed with "Node.js v20.12.2 is not supported by Astro! Please upgrade to >=22.12.0". `.nvmrc` already specified node 22 but shell was using v20.
- **Fix:** Used Node 22 PATH explicitly for build commands.
- **Impact:** Build infrastructure concern — `.nvmrc` is correct, CI should auto-select Node 22.

## Known Stubs

None — all 4 blog posts render fully with actual content.

## Verification Results

- `pnpm --filter @illu/blog build` exits 0
- 5 pages generated: index + 4 post pages
- `deep-dive-typescript/index.html` contains `class="shiki` (Shiki highlighting applied)
- `deep-dive-typescript/index.html` contains `min read` (reading time displayed)
- No `<script` tags in post HTML (zero runtime JS for highlighting)
- Custom illu-dark/illu-light theme classes present in generated HTML

## Self-Check: PASSED

- PostLayout.astro: FOUND
- [slug].astro: FOUND
- reading-time.ts: FOUND
- Commit fdc968f: FOUND
- Commit 3f7ecff: FOUND
- Build output: deep-dive-typescript/index.html FOUND
- Build output: year-in-review/index.html FOUND
- Build output: tldraw-discovery/index.html FOUND
- Build output: exploring-webgpu/index.html FOUND
