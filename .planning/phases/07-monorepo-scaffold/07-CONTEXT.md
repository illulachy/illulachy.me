# Phase 7: Monorepo Scaffold - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert the existing flat repo into a Turborepo + pnpm monorepo. Portfolio migrates to `apps/portfolio/` and continues to work identically. Shared content is extracted to `packages/content/` as `@illu/content`. A minimal Astro blog placeholder is created at `apps/blog/` so the full monorepo pipeline (both apps building from root) is verified end-to-end. All `letters.illulachy.me` references are updated to `writing.illulachy.me`.

Blog features (post list, rendering, styling) are Phase 8 — this phase only scaffolds the structure.

</domain>

<decisions>
## Implementation Decisions

### Monorepo tooling
- **D-01:** Turborepo 2.8.x + pnpm 9.x for monorepo orchestration
- **D-02:** `apps/` directory for deployable apps, `packages/` for shared packages
- **D-03:** `pnpm-lock.yaml` replaces existing `package-lock.json` — switch from npm to pnpm

### Portfolio migration
- **D-04:** Portfolio moves from repo root to `apps/portfolio/` via `git mv` to preserve history
- **D-05:** Portfolio package renamed from `vite-project-temp` to something meaningful (Claude's discretion — e.g., `@illu/portfolio` or `portfolio`)
- **D-06:** Build and behavior must be identical after migration (canvas, timeline, game mode all work)

### @illu/content shared package
- **D-07:** JIT pattern — no build step; portfolio and blog import directly from package source
- **D-08:** Package scope: TypeScript types + markdown content files + `generate-timeline` script
- **D-09:** Both apps declare `@illu/content` as `workspace:*` dependency in their package.json

### Blog app placeholder
- **D-10:** Phase 7 creates `apps/blog/` with a minimal Astro app — `package.json` + `astro.config.ts` + one placeholder page (e.g., `src/pages/index.astro` with "Coming soon")
- **D-11:** Blog placeholder must successfully build via `pnpm build` from repo root through Turborepo pipeline — end-to-end pipeline verified in Phase 7
- **D-12:** Blog declares `@illu/content` as `workspace:*` dependency

### Turborepo pipeline
- **D-13:** `turbo.json` orchestrates at minimum: `build`, `dev`, `lint`, `test` tasks
- **D-14:** `build` task is cached (outputs: `dist/**`, `.next/**`, etc. depending on app)
- **D-15:** `dev` task has no caching (persistent/watch mode)

### Reference updates
- **D-16:** All `letters.illulachy.me` references in source code, content markdown files, and portfolio node link data are updated to `writing.illulachy.me`

### pnpm strict mode
- **D-17:** Attempt to fix phantom dependency issues properly (run `pnpm why` on tldraw deps, add explicit deps as needed) — use `public-hoist-pattern` or `shamefully-hoist` only as a last resort if tldraw cannot be fixed
- **D-18:** No phantom dependency errors in final state

### Claude's Discretion
- Portfolio package name (e.g., `@illu/portfolio` vs `portfolio`)
- Exact `turbo.json` cache output paths per app
- Whether to keep `scripts/` at root or move into `@illu/content`
- Specific `.npmrc` settings for pnpm

</decisions>

<specifics>
## Specific Ideas

- Risk noted: moving portfolio to `apps/portfolio/` breaks relative paths — use `git mv`, verify build immediately after move
- Risk noted: pnpm strict mode may surface tldraw phantom dep issues — run `pnpm why` on all tldraw deps before switching
- Inspiration for monorepo structure: https://github.com/steipete/steipete.me

</specifics>

<canonical_refs>
## Canonical References

No external specs or ADRs exist for this phase — requirements are fully captured in decisions above and in:

### Project requirements
- `.planning/REQUIREMENTS.md` §"Monorepo Infrastructure" — MONO-01 through MONO-05 success criteria
- `.planning/ROADMAP.md` §"Phase 7: Monorepo Scaffold" — goal, success criteria, phase dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Current repo structure (to be migrated)
- `src/` — React portfolio app source (moves to `apps/portfolio/src/`)
- `content/` — Markdown content by year + `about.md` (moves to `packages/content/`)
- `scripts/generate-timeline.ts` — Content generation script (moves to `packages/content/`)
- `package.json` — name: `vite-project-temp`, uses npm (needs pnpm + rename)
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` — build config (moves with portfolio)
- `package-lock.json` — to be replaced by `pnpm-lock.yaml`

### Integration points
- `vite-plugin-timeline.ts` at root — moves to `apps/portfolio/` with the app
- Content path references in Vite plugin and generate script will need updating after move
- Any hardcoded `letters.illulachy.me` links in `content/**/*.md` files and `src/` source

</code_context>

<deferred>
## Deferred Ideas

- Blog features (post list, rendering, dark mode, typography) — Phase 8
- Vercel project configuration for separate blog deployment — Phase 8 or deployment setup
- CI/CD pipeline updates for monorepo — not in scope for v1.1

</deferred>

---

*Phase: 07-monorepo-scaffold*
*Context gathered: 2026-03-28*
