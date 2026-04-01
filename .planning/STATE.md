---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Turborepo + Blog Site
status: verifying
last_updated: "2026-04-01T03:58:57.131Z"
last_activity: 2026-04-01
progress:
  total_phases: 10
  completed_phases: 9
  total_plans: 20
  completed_plans: 18
  percent: 90
---

# Project State: illulachy.me

**Last updated:** 2026-03-30
**Status:** Phase complete — ready for verification

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** The canvas must feel smooth and intuitive to explore — pan/zoom navigation works flawlessly, and the timeline layout clearly communicates my journey over time.
**Current focus:** Phase 09 — discovery-and-seo (COMPLETE)

## Current Position

Phase: 09 (discovery-and-seo) — COMPLETE
Plan: 2 of 2
Status: Phase complete — ready for verification
Last activity: 2026-04-01

Progress: [█████████░] 90% (v1.1 milestone — phases 07-09 complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v1.1)
- Average duration: — (no data yet)
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 07-monorepo-scaffold P01 | 3m | 2 tasks | 8 files |
| Phase 07-monorepo-scaffold P02 | 12m | 2 tasks | 22 files |
| Phase 08-blog-foundation P01 | 7m | 2 tasks | 16 files |
| Phase 08-blog-foundation P02 | 4m | 2 tasks | 5 files |
| Phase 08-blog-foundation P03 | 8m | 2 tasks | 5 files |
| Phase 09-discovery-and-seo P01 | 3min | 3 tasks | 10 files |
| Phase 09-discovery-and-seo P02 | 2min | 2 tasks | 5 files |
| Phase 10-search-and-extras P01 | 5min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- Astro 5.18.x for blog (zero-JS SSG, Content Collections, Vite-based)
- @illu/content as shared package scope (JIT pattern, no build step)
- Pagefind 1.4.x for static search (post-build binary index)
- Turborepo 2.8.x + pnpm 9.x for monorepo orchestration
- writing.illulachy.me replaces letters.illulachy.me everywhere
- Blog deploys as separate Vercel project from same repo root
- [Phase 07-monorepo-scaffold]: Turborepo v2 tasks key (not pipeline) for build/dev/lint/test task graph
- [Phase 07-monorepo-scaffold]: REPO_ROOT computed 3 levels up from apps/portfolio/src/ for content path resolution
- [Phase 07-monorepo-scaffold]: pnpm strict mode with onlyBuiltDependencies for fsevents and esbuild
- [Phase 07-monorepo-scaffold]: Proxy re-export files in portfolio/src/types/ preserve backward compat for 8+ importing components
- [Phase 07-monorepo-scaffold]: tsconfig path alias for @illu/content required for JIT TypeScript resolution
- [Phase 08-blog-foundation]: Tailwind v4 @theme inside @media unsupported — use :root overrides in prefers-color-scheme media query for light mode
- [Phase 08-blog-foundation]: Shiki JSON themes imported directly in astro.config.ts with @ts-ignore (structurally compatible)
- [Phase 08-blog-foundation]: .nvmrc added with Node 22 — Astro 6 + Vite 8 / rolldown requires Node >=22.12.0
- [Phase 08-blog-foundation]: mod.rawContent?.() used for markdown body text extraction from Astro eager glob modules
- [Phase 08-blog-foundation]: Glob path 4 levels deep from src/pages/ validated for cross-workspace content loading
- [Phase 08-blog-foundation]: Use @shikijs/rehype in unified pipeline for manual markdown rendering from raw strings — Astro built-in only handles .md/.mdx files
- [Phase 08-blog-foundation]: .shiki CSS class added to global.css alongside .astro-code — @shikijs/rehype outputs shiki class not astro-code
- [Phase 08-blog-foundation]: prose without prose-invert on post pages — Stitch token CSS vars in global.css handle dark/light switching automatically
- [Phase 09-discovery-and-seo]: SVG used instead of PNG for og-default — developer can convert if Twitter/X requires PNG — SVG works for most social crawlers; static PNG conversion can be done at deploy time
- [Phase 09-discovery-and-seo]: PostCard outer anchor removed — only title+excerpt is the post link to avoid nested anchors — Nested <a> tags are invalid HTML and break category pill click behavior
- [Phase 09-discovery-and-seo]: 404.astro is a standalone HTML shell with no BaseLayout — ensures nav never appears on 404 — Per D-21: 404 must not show nav; standalone page is safer than hideNav prop risk
- [Phase 09-discovery-and-seo]: 5-level glob path for taxonomy pages nested in subdirs — category/tag pages at src/pages/category/ and src/pages/tag/ require one extra ../ to reach packages/content vs index.astro
- [Phase 10-search-and-extras]: postbuild script in package.json (not Vite plugin) — simplest pagefind binary integration via npm lifecycle
- [Phase 10-search-and-extras]: debouncedSearch() over raw search() — Pagefind built-in debounce prevents excessive WASM queries
- [Phase 10-search-and-extras]: Custom SearchBar UI with Stitch tokens only — no pagefind-ui.css or pagefind-ui.js (D-02 compliance)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 8 risk: Astro out-of-tree content paths (fileURLToPath pattern) — validate early before building blog features on top
- Node 22.19.0 required (Vite 8 / rolldown) — add `.nvmrc` with `22` as follow-up

## Session Continuity

**Last session:** 2026-04-01T03:58:57.127Z
**Completed:** Phase 7 (Monorepo Scaffold) — planned, executed, and verified
**Next:** Phase 8 — Blog Features (discuss → plan → execute)
**Resume file:** None

---
*State updated: 2026-03-29 after Phase 7 completion*
