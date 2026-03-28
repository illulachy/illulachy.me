# Architecture Research

**Domain:** Turborepo Monorepo + Blog Site Integration with Existing Vite+React Portfolio
**Researched:** 2026-03-28
**Confidence:** HIGH (Turborepo structure, pnpm workspace), MEDIUM (Astro + shared content path), HIGH (build pipeline task ordering)

---

## The Core Question

The existing repo is a single Vite+React SPA at the repo root. The goal is to introduce a Turborepo monorepo and add a second app (blog at writing.illulachy.me) that shares content with the portfolio. This means reorganizing the repo **without rewriting the portfolio app**.

---

## Standard Architecture

### System Overview After Migration

```
Repo Root (monorepo)
├─────────────────────────────────────────────────────────┐
│                   Turborepo                              │
│  (build orchestration, caching, task pipeline)          │
├──────────────────────┬──────────────────────────────────┤
│   apps/portfolio     │   apps/blog                      │
│   (Vite + React)     │   (Astro)                        │
│                      │                                  │
│   illulachy.me       │   writing.illulachy.me           │
│                      │                                  │
│   Canvas + Konva     │   Markdown → HTML pages          │
│   timeline.json      │   categories, tags, RSS          │
│   loaded at runtime  │   search (Pagefind)              │
│                      │                                  │
│   depends on:        │   depends on:                    │
│   @illulachy/content │   @illulachy/content             │
└──────────┬───────────┴──────────────┬───────────────────┘
           │                          │
           └──────────┬───────────────┘
                      │
              packages/content
              (shared workspace package)

              content/              ← MOVED HERE from root
              ├── 2020/
              ├── 2021/
              ├── 2022/
              ├── 2023/
              ├── 2024/
              └── about.md

              src/types/            ← ContentNode, TimelineData, AboutData
              scripts/              ← generate-timeline.ts MOVED HERE
              package.json          ← @illulachy/content
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `packages/content` | Single source of truth for all markdown content, shared types, and build scripts | Workspace package, no build step (Just-in-Time), exports TypeScript types directly |
| `apps/portfolio` | Infinite canvas at illulachy.me, consumes `timeline.json` + `about.json` generated from content package | Existing Vite + React + Konva app, moved to apps/ subdirectory |
| `apps/blog` | Full blog site at writing.illulachy.me, reads same markdown files via Astro content collections | New Astro app with content collections pointing to `packages/content/content/` |
| `turbo.json` | Defines task graph and caching: `generate-content` must run before `build` in portfolio | Root-level Turborepo config |
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/*` as workspace packages | Root-level pnpm config |

---

## Recommended Project Structure

```
/ (repo root — was SPA root, becomes monorepo root)
├── apps/
│   ├── portfolio/              ← MOVED: all existing files move here
│   │   ├── src/                ← unchanged (components, hooks, lib, types)
│   │   ├── public/             ← timeline.json goes here (generated)
│   │   ├── index.html
│   │   ├── vite.config.ts      ← updated: content paths now relative to package
│   │   ├── tsconfig.json
│   │   └── package.json        ← name: "@illulachy/portfolio"
│   │
│   └── blog/                   ← NEW
│       ├── src/
│       │   ├── pages/
│       │   │   ├── index.astro
│       │   │   ├── [slug].astro
│       │   │   ├── tags/[tag].astro
│       │   │   └── rss.xml.ts
│       │   └── content.config.ts  ← glob loader pointing to packages/content/content/
│       ├── astro.config.mjs
│       └── package.json           ← name: "@illulachy/blog"
│
├── packages/
│   └── content/               ← NEW PACKAGE (content + types extracted from root)
│       ├── content/            ← MOVED: was root-level content/
│       │   ├── 2020/
│       │   ├── 2021/
│       │   ├── 2022/
│       │   ├── 2023/
│       │   ├── 2024/
│       │   └── about.md
│       ├── src/
│       │   └── types/          ← MOVED: was src/types/ at root
│       │       ├── content.ts  (ContentNode, TimelineData)
│       │       ├── about.ts    (AboutData, aboutSchema)
│       │       └── index.ts
│       ├── scripts/            ← MOVED: was scripts/ at root
│       │   ├── generate-timeline.ts
│       │   └── generate-timeline.test.ts
│       └── package.json        ← name: "@illulachy/content"
│
├── turbo.json                  ← NEW
├── pnpm-workspace.yaml         ← NEW
├── package.json                ← UPDATED: workspace root (no app deps)
└── .gitignore                  ← UPDATED: add .turbo
```

### Structure Rationale

- **apps/portfolio/**: The existing SPA moves here wholesale. Internal import paths like `'../src/types/content'` inside `generate-timeline.ts` need updating since types move to `packages/content`. No rewrite of React components.
- **apps/blog/**: New Astro app. Astro is preferred over Next.js for a markdown-only blog because it generates zero-JS HTML by default, has built-in content collections with type safety, and produces faster static builds (18s vs 52s for 1000 pages).
- **packages/content/**: Extracts the three things both apps need to share: markdown files, TypeScript types (`ContentNode`, `TimelineData`), and the generation scripts. Uses the Just-in-Time package strategy — no build step, Vite and Astro both transpile TypeScript directly. This avoids a compile step for a 2-package workspace.

---

## Architectural Patterns

### Pattern 1: Just-in-Time Internal Package (No Build Step)

**What:** The `packages/content` package exports TypeScript files directly. No `tsc` compilation needed. Consuming apps (Vite, Astro) handle transpilation.

**When to use:** When all consumers are modern bundlers (Vite, Astro, Turbopack). The package is never published to npm.

**Trade-offs:** Simpler setup, no compile step, but won't work if a consumer can't handle raw TypeScript (e.g., a pure Node script running with `node` directly — use `tsx` instead).

**Example `packages/content/package.json`:**
```json
{
  "name": "@illulachy/content",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./types": "./src/types/index.ts",
    "./scripts/*": "./scripts/*.ts"
  },
  "scripts": {
    "generate": "tsx scripts/generate-timeline.ts"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "fast-glob": "^3.3.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "tsx": "^4.21.0"
  }
}
```

**In `apps/portfolio/package.json`:**
```json
{
  "dependencies": {
    "@illulachy/content": "workspace:*"
  }
}
```

---

### Pattern 2: Turborepo Task Pipeline with Content Dependency

**What:** `generate-content` runs before `build` in the portfolio app. Turborepo caches the output (generated JSON files) and skips regeneration if markdown files haven't changed.

**When to use:** Any task that produces artifacts consumed by downstream tasks.

**Trade-offs:** Adds a pipeline step but enables caching that makes CI much faster. Content generation is idempotent and cheap to cache.

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "generate-content": {
      "inputs": ["../../packages/content/content/**/*.md"],
      "outputs": ["public/timeline.json", "public/about.json"],
      "cache": true
    },
    "build": {
      "dependsOn": ["^build", "generate-content"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

Note: `generate-content` is only needed in `apps/portfolio`. Astro reads markdown directly via content collections so no JSON intermediate is needed for the blog. The `^build` notation means "build all workspace dependencies first."

---

### Pattern 3: Astro Content Collections Pointing to Shared Package

**What:** Astro's `glob()` loader accepts an absolute `base` path, letting `apps/blog` read markdown from `packages/content/content/` without copying files.

**When to use:** When two apps need to consume the same markdown files without duplication.

**Trade-offs:** Relative paths in `content.config.ts` are fragile if directory depth changes. Use `fileURLToPath(new URL(..., import.meta.url))` for reliability.

**`apps/blog/src/content.config.ts`:**
```typescript
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const contentRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/content/content'
)

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: contentRoot
  }),
  schema: z.object({
    type: z.string(),
    title: z.string(),
    date: z.string(),
    url: z.string().url().optional(),
    thumbnail: z.string().url().optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional(),
  })
})

export const collections = { blog }
```

---

## Data Flow

### Content Lifecycle (After Migration)

```
Author writes/edits markdown in packages/content/content/
            │
            ▼
Git commit → triggers CI/CD build
            │
    ┌───────┴────────────────────────────┐
    │                                    │
    ▼                                    ▼
apps/portfolio build:              apps/blog build:
  1. run generate-content           1. Astro reads .md files
     (tsx generate-timeline.ts)        directly via glob() loader
     → public/timeline.json            (no separate generate step)
     → public/about.json            2. Build HTML pages per entry
  2. Vite bundles app                  (SSG, zero JS by default)
  3. Canvas loads JSON              3. Generate RSS feed
     at runtime                     4. Build search index (Pagefind)
            │                                    │
            ▼                                    ▼
     illulachy.me                    writing.illulachy.me
     (static SPA)                    (static HTML site)
```

### Build Order (Turborepo enforces)

```
packages/content (typecheck if needed)
         │
         ├──► apps/portfolio:generate-content
         │              │
         │              ▼
         │    apps/portfolio:build  ← produces dist/
         │
         └──► apps/blog:build       ← Astro reads .md directly, produces dist/
```

Both app builds are independent after content is ready, so Turborepo runs them in parallel.

---

## What Moves vs. What Stays

### Files/Directories That Move

| Current Location | New Location | Notes |
|-----------------|--------------|-------|
| `content/` | `packages/content/content/` | All markdown moves here |
| `scripts/generate-timeline.ts` | `packages/content/scripts/generate-timeline.ts` | Update imports |
| `scripts/generate-timeline.test.ts` | `packages/content/scripts/generate-timeline.test.ts` | |
| `src/types/content.ts` | `packages/content/src/types/content.ts` | |
| `src/types/about.ts` | `packages/content/src/types/about.ts` | |
| `src/types/index.ts` | `packages/content/src/types/index.ts` | |
| Everything else in root | `apps/portfolio/` | src/, public/, index.html, vite.config.ts, tsconfig files, eslint.config.js |

### Files That Stay at Root (Become Monorepo Root)

| File | Change |
|------|--------|
| `package.json` | Converted to workspace root — remove all app deps, add `workspaces` field, add `turbo` dev dep |
| `.gitignore` | Add `.turbo` |

### New Files Created

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Declare `apps/*` and `packages/*` as workspace packages |
| `turbo.json` | Define build pipeline tasks and caching |
| `packages/content/package.json` | `@illulachy/content` package declaration |
| `apps/portfolio/package.json` | `@illulachy/portfolio`, depends on `@illulachy/content` |
| `apps/blog/` | Entire new Astro app |

### Internal Paths That Need Updating in Portfolio App

| File | Old Import | New Import |
|------|-----------|------------|
| `scripts/generate-timeline.ts` | `'../src/types/content.js'` | `'@illulachy/content/types'` |
| `scripts/generate-timeline.ts` | `'../src/types/about.js'` | `'@illulachy/content/types'` |
| `src/vite-plugin-timeline.ts` | `'npm run generate-timeline'` | `'pnpm run generate-content'` (from portfolio package) |
| `vite.config.ts` content watcher | `'content/**/*.md'` | path relative to packages/content/content from portfolio root |

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vercel | Automatic Turborepo monorepo detection | Set Root Directory to `apps/portfolio` or `apps/blog` per project in Vercel dashboard. Vercel detects `turbo.json` automatically. |
| GitHub Actions (CI) | `pnpm install && turbo build` | Turborepo remote cache available via Vercel; local caching works without it |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `packages/content` → `apps/portfolio` | TypeScript types via `workspace:*` dep; generated JSON via script | Portfolio imports types at compile time, consumes JSON at runtime |
| `packages/content` → `apps/blog` | Markdown files read directly via Astro glob loader; TypeScript types via `workspace:*` | No generated JSON needed for blog; Astro processes markdown natively |
| `apps/portfolio` ↔ `apps/blog` | No direct dependency | Portfolio links to writing.illulachy.me URLs; blog is a separate static site |

---

## Anti-Patterns

### Anti-Pattern 1: Keeping Content at Repo Root

**What people do:** Leave `content/` at the root and reference it from both apps with `../../content/`.

**Why it's wrong:** Relative paths from inside `apps/portfolio/` span across the monorepo root, which breaks Turborepo's task input hashing (it doesn't track files outside the package boundary by default). Also harder to reason about ownership.

**Do this instead:** Move `content/` into `packages/content/content/` and declare it as a workspace package. Turborepo then tracks inputs correctly.

---

### Anti-Pattern 2: Compiled Internal Package for Types-Only

**What people do:** Add a `build` script to `packages/content` that runs `tsc`, output to `dist/`.

**Why it's wrong:** For a 2-app internal monorepo, this adds build steps and output directories with no benefit. Both Vite and Astro are bundlers that handle TypeScript natively.

**Do this instead:** Use the Just-in-Time strategy — point `exports` to `.ts` source files. The consuming app's bundler compiles them. Only add a compile step if you need to publish to npm or the consumer can't handle TypeScript.

---

### Anti-Pattern 3: Duplicating the Content Generation Script

**What people do:** Copy `generate-timeline.ts` into both apps so each app generates its own JSON.

**Why it's wrong:** Creates two sources of truth. Any change to the schema needs updating in two places. Also generates redundant work since both apps read the same source markdown.

**Do this instead:** The script lives in `packages/content/scripts/`. `apps/portfolio` runs it before build. `apps/blog` skips it entirely because Astro reads markdown natively — no JSON intermediate needed.

---

### Anti-Pattern 4: Running Both Apps Under One Vite Dev Server

**What people do:** Expose the blog's content inside the portfolio's Vite dev server to avoid running two servers during development.

**Why it's wrong:** The portfolio is Vite + React (canvas app). The blog is Astro (SSG). They need their own dev servers. Mixing them creates a mess of routing assumptions and Vite config complexity.

**Do this instead:** Run them separately with `turbo dev` (which starts both) or `pnpm --filter @illulachy/portfolio dev` for focused development. Turborepo's persistent task mode keeps both running in parallel.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (1 author, 2 apps) | Monolith-to-monorepo migration is sufficient. No remote cache needed. Local Turborepo cache speeds up rebuilds. |
| Adding a 3rd app (docs site, etc.) | Add `apps/docs/` and another `packages/ui/` if shared components emerge. Pattern stays the same. |
| Large content volume (500+ posts) | Astro handles this natively with static generation. Portfolio may need lazy-loading for timeline JSON. Both are independent problems. |

---

## Build Order Summary (for Roadmap Phase Planning)

The migration must happen in this sequence to avoid breaking the existing portfolio:

1. **Monorepo scaffolding** — Create `pnpm-workspace.yaml`, root `turbo.json`, root `package.json` as workspace root. No app code changes yet.
2. **Move portfolio** — Move all existing root files into `apps/portfolio/`. Update `package.json` name to `@illulachy/portfolio`. Verify existing build still works.
3. **Extract content package** — Move `content/`, `scripts/`, and `src/types/` to `packages/content/`. Create `packages/content/package.json`. Update import paths in `generate-timeline.ts` and `vite-plugin-timeline.ts`.
4. **Wire portfolio to content package** — Add `@illulachy/content: "workspace:*"` to portfolio. Run `pnpm install`. Verify build.
5. **Add blog app** — Create `apps/blog/` with Astro. Wire content collections to `packages/content/content/`. Add blog-specific features (RSS, tags, search).
6. **Turborepo task graph** — Define `generate-content`, `build`, `dev`, `typecheck` tasks in `turbo.json` with correct `dependsOn`. Verify caching works.

This order ensures the portfolio is never broken mid-migration and each step is independently verifiable.

---

## Sources

- Turborepo official docs — Add to existing repository: https://turborepo.dev/docs/getting-started/add-to-existing-repository
- Turborepo — Structuring a repository: https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- Turborepo — Internal Packages: https://turborepo.dev/docs/core-concepts/internal-packages
- Turborepo — Creating an Internal Package: https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package
- Turborepo — Configuring Tasks: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks
- Turborepo — Vite guide: https://turborepo.dev/docs/guides/frameworks/vite
- Astro — Content Collections: https://docs.astro.build/en/guides/content-collections/
- pnpm — Workspaces: https://pnpm.io/workspaces
- Astro vs Next.js for blogs (2026 comparison): https://pagepro.co/blog/astro-nextjs/

---

*Architecture research for: Turborepo monorepo + blog site integration*
*Researched: 2026-03-28*
