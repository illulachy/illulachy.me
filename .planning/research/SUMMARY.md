# Project Research Summary

**Project:** osaka (illulachy.me) — milestone v1.1
**Domain:** Turborepo monorepo conversion + blog site (writing.illulachy.me)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

This milestone converts the existing single-app Vite+React portfolio (Phases 1-6, complete) into a Turborepo pnpm monorepo, then adds a second app — a full markdown blog at writing.illulachy.me built with Astro. The core architectural insight is that a `packages/content` workspace package (with no build step) becomes the single source of truth for all markdown files, TypeScript types, and generation scripts. Both apps consume it: the portfolio via its existing Vite plugin generating timeline JSON, and the blog via Astro Content Collections reading markdown directly. This avoids duplication and lets a single markdown edit propagate to both apps automatically.

The recommended approach is Astro 5.18.x for the blog (zero-JS by default, built-in content collections with Zod validation, native markdown processing, 5x faster builds vs v4), Turborepo 2.8.x for build orchestration, and pnpm 9.x for workspace management. The shared content package uses the Just-in-Time pattern — TypeScript source exported directly with no compile step, since both Vite and Astro are bundlers that handle TypeScript natively. Pagefind provides fully static client-side search with no infrastructure cost, deferred until post count makes browsing impractical.

The key risk is the monorepo migration itself: moving the existing portfolio app to `apps/portfolio/` will break relative paths, Vite config assumptions, and TypeScript paths unless handled deliberately with `git mv` and immediate build verification at each step. A secondary risk is Tailwind v4's auto-detection not scanning shared packages — requires explicit `@source` directives, a known upstream issue (tailwindlabs/tailwindcss#13136) with a clear fix. Both risks are well-understood with documented solutions. The migration must be sequenced in discrete verifiable steps before any new blog features are built.

---

## Key Findings

### Recommended Stack

The new stack additions are all additive — the existing React 19, Vite 8.x, Konva.js, Tailwind v4, shadcn/ui, Motion.dev, and gray-matter+zod+fast-glob pipeline are not re-evaluated. Turborepo 2.8.x orchestrates the task graph with caching. pnpm 9.x provides the workspace protocol and strict dependency resolution that prevents phantom dependency issues. Astro 5.18.x is the correct blog framework for this use case: content-first, zero JS by default, Vite-based internally, with built-in Zod-validated Content Collections.

**Core technologies (new in v1.1):**
- **Turborepo 2.8.x**: build orchestration and caching — simpler than Nx for a 2-app monorepo; uses `tasks` key (not deprecated `pipeline`)
- **pnpm 9.x**: workspace management — `workspace:*` protocol for local packages; strict deps that eliminate phantom dependency reliance
- **Astro 5.18.x**: blog site framework — zero-JS SSG by default; built-in Content Collections with Zod; 5x faster markdown builds than v4; Vite-based internally
- **@astrojs/rss**: RSS feed generation — integrates directly with `getCollection()`, no external XML library needed
- **@astrojs/sitemap 3.7.x**: sitemap at build time — one-line config addition; version 3.7.1 confirmed current
- **Pagefind 1.4.x**: static full-text search — post-build binary index; chunked WASM download; zero infrastructure; framework-agnostic
- **packages/content (JIT, no-build)**: shared workspace package — exports TypeScript source directly; consumed by both Vite and Astro without a compile step

### Expected Features

All feature decisions are scoped to v1.1. The canvas portfolio (Phases 1-6) is complete and must remain functional throughout this milestone.

**Must have — table stakes for launch:**
- Turborepo + pnpm monorepo scaffold — prerequisite for everything; must come first
- `@illulachy/content` shared package — single source of truth for markdown, TypeScript types, and generation scripts
- Post list page (reverse-chronological) and individual post pages (full markdown rendering + reading time)
- Markdown rendering with Shiki syntax highlighting — build-time, zero runtime JS
- Category and tag listing pages — static pages generated via `getStaticPaths()`
- RSS feed at `/rss.xml` — subscribe use case without infrastructure
- Sitemap at `/sitemap.xml` — SEO baseline
- Per-post Open Graph and canonical meta tags — social sharing previews
- Responsive prose layout and dark mode (Catppuccin Mocha tokens already exist in portfolio — reuse)
- Blog deployed to writing.illulachy.me on Vercel (separate project from portfolio)

**Should have — add in v1.x after core is live:**
- Full-text search with Pagefind — add when post count exceeds ~20, making browsing impractical
- Copy-code button for code blocks — small DX win for developer content
- Table of contents for long posts — add for posts over 2000 words
- Canvas portfolio backlink ("See on timeline") — add when deep-link parameter is implemented in portfolio

**Defer to v2+:**
- Email newsletter — only if RSS subscriber count signals demand
- Comments — only if consistent readership wants discussion
- Automatic OG image generation — significant build complexity for v1

### Architecture Approach

The migration follows a strict 6-step sequence to avoid breaking the existing portfolio at any point. The monorepo structure places the existing app at `apps/portfolio/`, creates `apps/blog/` as a new Astro app, and extracts shared content to `packages/content/`. The defining pattern is the Just-in-Time internal package: `packages/content` has no build step, pointing `exports` directly at TypeScript source files. Both consuming bundlers (Vite, Astro) compile TypeScript natively, so no compile step is needed. Turborepo enforces build order — `generate-content` (portfolio only) must run before portfolio build, and both app builds run in parallel after that. Astro reads markdown natively via a `glob()` loader pointed at `packages/content/content/` using an absolute path constructed with `fileURLToPath`.

**Major components:**
1. **packages/content** — markdown files, TypeScript types (`ContentNode`, `TimelineData`, `AboutData`), generation scripts; no build step; consumed by both apps via `workspace:*`
2. **apps/portfolio** — existing Vite+React canvas app moved wholesale to `apps/portfolio/`; runs `generate-content` before build to produce `timeline.json` and `about.json`
3. **apps/blog** — new Astro 5.18.x app; reads same markdown via Content Collections glob loader; generates RSS, sitemap, category/tag pages; builds Pagefind index post-build
4. **turbo.json** — defines `generate-content → portfolio build` dependency; parallel builds for both apps; `pagefind` task depends on blog `build`
5. **pnpm-workspace.yaml** — declares `apps/*` and `packages/*`; must be created before any turbo commands run

### Critical Pitfalls

1. **Flat node_modules phantom deps break after npm-to-pnpm switch** — audit all imports vs declared deps with `pnpm why` before switching; fix every "Cannot find module" error; never install app packages at workspace root as a shortcut
2. **Moving existing app to apps/portfolio/ breaks relative paths and git history** — use `git mv` (not file copy) to preserve history; update `vite.config.ts` root and resolve aliases; run `tsc --noEmit && vite build` immediately after the move before any other work
3. **Tailwind v4 does not auto-scan sibling packages** — add `@source` directives in each app's CSS entry pointing to all packages containing Tailwind classes; this is the officially documented fix for tailwindlabs/tailwindcss#13136
4. **Undeclared env variables cause wrong cached build artifacts in CI/CD** — declare all env vars read during build in `turbo.json` `env` field; use `VITE_*` glob to catch all Vite-prefixed vars
5. **pnpm-workspace.yaml must exist before any turbo command** — create it first, then `pnpm install`, then install Turborepo; missing this produces a misleading error about `--workspace-root`

---

## Implications for Roadmap

The architecture research provides a precise migration sequence that directly maps to roadmap phases. The dependency constraint is hard: the monorepo scaffold and portfolio migration must be complete and verified before any blog work begins. Features are then layered from foundational (readable posts) to complete (discoverable) to deployed (live with search).

### Phase 1: Monorepo Scaffold and Portfolio Migration

**Rationale:** This is the hard prerequisite for everything. No blog features can be built until the monorepo is in place and the existing portfolio builds correctly inside it. The migration is mechanical but failure-prone — it must be its own phase with discrete verification gates.
**Delivers:** Turborepo + pnpm monorepo at repo root; existing portfolio running at `apps/portfolio/` with identical behavior to pre-migration; `pnpm-workspace.yaml`, root `turbo.json`, and root `package.json` as workspace root; `package-lock.json` replaced with `pnpm-lock.yaml`
**Addresses:** FEATURES.md monorepo structure prerequisite
**Avoids:** Pitfalls 1 (phantom deps), 2 (missing workspace yaml), 3 (broken paths after app move), 5 (turbo env vars), 9 (root package pollution), 10 (missing turbo outputs), 11 (combined scripts not cacheable)

### Phase 2: Shared Content Package

**Rationale:** The `packages/content` package must exist and be wired to the portfolio before the blog app is created. Validating it against the portfolio first (which already works) gives confidence before adding a second consumer. This is also the phase where circular dependency risk is highest — enforcing one-directional dependency now prevents problems later.
**Delivers:** `@illulachy/content` workspace package with markdown files, TypeScript types, and generation scripts moved from portfolio root; portfolio building correctly using the package via `workspace:*`; `generate-content` Turborepo task with correct input/output caching
**Uses:** JIT internal package pattern (exports pointing at `.ts` source); Turborepo `dependsOn` for task pipeline
**Implements:** `packages/content` architecture component; content lifecycle data flow
**Avoids:** Pitfalls 4 (Tailwind cross-package scanning), 6 (circular task dependencies), 8 (shared package build ordering)

### Phase 3: Blog App Foundation

**Rationale:** With the monorepo stable and content package wired, the blog app can be scaffolded. This phase establishes the Astro app, connects it to the shared content, and delivers the minimum viable readable blog — post list, individual posts, responsive layout, dark mode. No blog is usable without these.
**Delivers:** `apps/blog/` Astro 5.18.x app; Content Collections pointed at `packages/content/content/` via absolute `fileURLToPath` path; post list page (reverse-chronological); individual post pages with full markdown rendering, Shiki syntax highlighting, and reading time; responsive prose layout; dark mode using existing Catppuccin Mocha tokens
**Uses:** Astro 5.18.x, @astrojs/tailwind (same Tailwind v4 config as portfolio), Shiki (build-time, zero runtime cost)
**Avoids:** Pitfall 4 (Tailwind v4 `@source` directive needed for blog app), Pitfall 7 (workspace:* must resolve from root in CI)

### Phase 4: Blog Discovery and SEO

**Rationale:** A blog without RSS, sitemap, meta tags, and category/tag pages is incomplete for real readership. These are low-complexity additions that complete the "table stakes" feature set. They share a common dependency on post metadata and can be built as a unit. No new infrastructure is required.
**Delivers:** Category listing pages and filtered views; tag listing pages and filtered views; RSS feed at `/rss.xml`; sitemap at `/sitemap.xml`; per-post Open Graph and canonical meta tags; 404 page; navigation header linking portfolio and blog
**Uses:** @astrojs/rss (integrates with `getCollection()`), @astrojs/sitemap 3.7.x, Astro `getStaticPaths()` for tag/category routes
**Implements:** Complete table stakes feature set from FEATURES.md

### Phase 5: Blog Deployment and Pagefind Search

**Rationale:** Deploy to writing.illulachy.me as a separate Vercel project, configure CI/CD, then add Pagefind search as the first differentiating feature. Search is placed after deployment because it requires static HTML output and post-build pipeline wiring — easier to validate once the deployment pipeline is stable.
**Delivers:** Blog deployed to writing.illulachy.me; Vercel monorepo configuration (`pnpm install` from workspace root, build filter `--filter=apps/blog`); Pagefind static search index wired as `pagefind` Turborepo task; copy-code button for code blocks
**Uses:** Pagefind 1.4.x (runs post-build against `dist/`), `astro-pagefind` integration or custom Pagefind JS API
**Avoids:** Pitfall 7 (workspace:* resolution in CI — always `pnpm install --frozen-lockfile` from workspace root)

### Phase Ordering Rationale

- Phases 1 and 2 are strictly ordered by hard dependency: the turbo workspace must exist before `packages/content` can be wired, and the content package must be wired before the blog can consume it
- The portfolio must remain functionally identical at the end of every phase — this is a non-negotiable verification gate throughout the migration
- Phases 3, 4, and 5 layer blog functionality from foundational to complete to deployed, matching the feature dependency chain in FEATURES.md (post metadata → RSS/sitemap/tags → search/deployment)
- Pitfall-to-phase mapping from PITFALLS.md was used directly to assign prevention responsibilities to the correct phase, ensuring each critical pitfall is addressed before the work that triggers it begins

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Monorepo Migration):** pnpm phantom dep audit for an existing app with 6 completed phases of features may surface non-obvious transitive dependencies; tldraw in particular is flagged for pnpm strict mode peer dep issues
- **Phase 5 (Deployment):** Vercel monorepo configuration for two separate apps (`apps/portfolio` and `apps/blog`) deploying from a single repo root — specifically whether automatic Turborepo detection handles both as distinct projects with separate domains

Phases with standard patterns (skip research-phase):
- **Phase 2 (Content Package):** JIT internal package pattern is documented in Turborepo official docs with exact `package.json` and `exports` examples
- **Phase 3 (Blog Foundation):** Astro 5.x Content Collections, Shiki integration, and Tailwind v4 in Astro are all officially documented; the `glob()` loader path pattern is specified in ARCHITECTURE.md
- **Phase 4 (Discovery/SEO):** `@astrojs/rss` + `@astrojs/sitemap` + `getStaticPaths()` are textbook Astro patterns with official tutorials and examples

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology versions verified against npm registry within 8 days of research date; official docs consulted for all major choices; alternatives explicitly evaluated and rejected with rationale |
| Features | HIGH | Feature set is well-established for markdown developer blogs; table stakes/differentiators/anti-features are clearly reasoned; prioritization matrix is concrete with explicit P1/P2/P3 designations |
| Architecture | HIGH (structure), MEDIUM (Astro out-of-tree paths) | Turborepo structure and pnpm workspace patterns sourced from official docs; Astro glob loader absolute path pattern is confirmed but relies on a single implementation approach that should be validated early in Phase 3 |
| Pitfalls | HIGH | Critical pitfalls sourced from official docs, known upstream issues (tailwindlabs/tailwindcss#13136), and multiple community references; recovery strategies documented for each pitfall |

**Overall confidence:** HIGH

### Gaps to Address

- **Astro Content Collections with out-of-tree base path:** The `fileURLToPath` pattern for pointing the glob loader outside `apps/blog/` (to `packages/content/content/`) is the documented approach but should be validated early in Phase 3 before building blog features on top of it. If Astro's HMR or dev server has issues with out-of-tree content paths, the fallback is symlinking `packages/content/content/` into `apps/blog/src/content/`.
- **tldraw peer deps under pnpm strict mode:** PITFALLS.md explicitly flags this — tldraw may access peer deps not directly declared. Run `pnpm why` for all tldraw dependencies during Phase 1 before the phantom dep window closes. Peer deps must be listed explicitly in `apps/portfolio/package.json`.
- **Pagefind + Turborepo remote cache output coverage:** Pagefind generates a binary WASM index in `dist/pagefind/`. Confirm the `outputs` field in `turbo.json` includes `dist/pagefind/**` so remote cache restores the search index correctly without re-running Pagefind on every build.

---

## Sources

### Primary (HIGH confidence)
- Turborepo npm registry (v2.8.20, published 8 days before research) and official docs — workspace structure, task pipeline, caching, Vite guide: https://turborepo.dev/docs
- Turborepo blog "Turbo 2.7" (January 26, 2026): https://turborepo.dev/blog/turbo-2-7 — `tasks` key, composable configs
- Astro npm registry (v5.18.0 stable) and official docs — Content Collections, RSS, sitemap, blog tag tutorial: https://docs.astro.build
- Astro 5.0 release announcement (December 2024): https://astro.build/blog/astro-5/
- Astro February 2026 what's new: https://astro.build/blog/whats-new-february-2026/
- @astrojs/sitemap npm registry (v3.7.1, published within 7 days of research)
- Pagefind official site (v1.4.0 stable): https://pagefind.app/
- pnpm workspace docs: https://pnpm.io/workspaces
- Tailwind CSS v4 upstream issue tailwindlabs/tailwindcss#13136 — monorepo content auto-scanning

### Secondary (MEDIUM confidence)
- Tailwind v4 in Turborepo fix: https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039
- astro-pagefind integration: https://github.com/shishkin/astro-pagefind
- steipete.me GitHub — reference Astro markdown blog: https://github.com/steipete/steipete.me
- Pagefind replacing Lunr for static sites (2026): https://www.allaboutken.com/posts/20260228-replacing-lunr-with-pagefind/
- Astro vs Next.js for blogs (2026): https://sourabhyadav.com/blog/astro-vs-nextjs-for-blogs-2026/
- Turborepo pitfalls (DEV Community): https://dev.to/_gdelgado/pitfalls-when-adding-turborepo-to-your-project-4cel
- Turborepo migration (Dub): https://dub.co/blog/turborepo-migration
- Turborepo + shared packages tutorial 2026: https://noqta.tn/en/tutorials/turborepo-nextjs-monorepo-shared-packages-2026

---

*Research completed: 2026-03-28*
*Ready for roadmap: yes*
