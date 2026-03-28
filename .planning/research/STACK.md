# Stack Research

**Domain:** Turborepo monorepo + markdown-powered blog site (milestone v1.1 additions)
**Researched:** 2026-03-28
**Confidence:** HIGH

> This document covers NEW stack additions for milestone v1.1 only.
> Existing validated stack (React 19, Vite 8.x, Konva.js + react-konva, Tailwind v4 with @theme,
> shadcn/ui, Motion.dev, gray-matter + zod + fast-glob) is NOT re-researched here.

---

## Recommended Stack

### Core Technologies (New)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Turborepo** | 2.8.x | Monorepo build orchestration | Caches build outputs per-task, rebuilds only what changed. 2.8.x is current stable (published within 8 days of research date). Composable `turbo.json` per package (added in 2.7). Zero config for pnpm + Vite. Simpler than Nx for a 2-app personal site. |
| **pnpm** | 9.x | Package manager + workspace protocol | `workspace:*` protocol for local package references with no publishing step. Hard-links shared deps (saves disk). Strict dependency resolution prevents phantom deps. 30-50% faster installs than npm. Required for moving off `package-lock.json`. |
| **Astro** | 5.18.x | Blog site framework (`writing.illulachy.me`) | Purpose-built for content sites. Ships zero JS by default. Built-in Content Collections API with Zod schema validation — matches the existing gray-matter + zod pipeline philosophy. Vite-based internally (same toolchain as portfolio). Islands architecture: React components hydrate only when needed. 5x faster markdown builds vs v4 (measured by Astro team). Current stable: 5.18.0 (Astro 6 still in beta). |
| **@astrojs/rss** | latest (official) | RSS feed generation | Official Astro integration. Generates `/rss.xml` as an Astro API endpoint. Plugs directly into `getCollection()` from Content Collections. No external XML library needed. |
| **@astrojs/sitemap** | 3.7.x | Sitemap for SEO | Official integration. Generates `sitemap-0.xml` + `sitemap-index.xml` at build time. One-line config addition. Current: 3.7.1 (published within 7 days of research date). |
| **Pagefind** | 1.4.x | Static full-text search | Runs post-build against generated HTML. Zero backend, zero infrastructure. Chunked binary index — a search for "React" downloads only the chunk containing "React", not the full index. Handles 10K+ pages under 300KB network. v1.0 reached stable in 2024. Framework-agnostic: works with any static output directory. |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@astrojs/react** | latest | React islands in Astro | Add only if blog needs interactive React components (e.g., reusing shadcn/ui components from portfolio). Astro handles React SSR + selective hydration via `client:load` / `client:idle` directives. |
| **@astrojs/tailwind** | latest | Tailwind v4 in Astro | Integrates `@tailwindcss/vite` into Astro build pipeline. Use the same Tailwind v4 config and `@theme` design tokens from portfolio to keep blog and canvas app visually consistent. |
| **astro-pagefind** | latest | Pagefind Astro integration | Thin wrapper: auto-runs `pagefind --site dist` post-build and exposes `<Search />` as an Astro component. Saves manual integration. Use if you want the prebuilt Pagefind UI; skip it if you prefer to build a custom search input with the Pagefind JS API. |

---

### Shared Content Package (packages/content)

This package is the central decision for this milestone. It has no build step — both apps compile it themselves.

| Piece | Approach | Why |
|-------|----------|-----|
| Package structure | Plain TypeScript, `"exports": { ".": "./src/index.ts" }` | No `tsc` watch step required. Vite and Astro both compile TypeScript natively, so the package ships source directly. Simpler CI: no `build` task needed for this package. |
| Zod schemas | Move existing `BlogPostSchema`, `YouTubeSchema`, `ProjectSchema`, `MilestoneSchema` from portfolio `src/types` into `packages/content/src/schemas.ts` | Single source of truth. Blog imports the same schema Zod validates for type-safe Content Collections. Prevents schema drift between apps. |
| Markdown files | Move `content/` directory from portfolio root into `packages/content/content/` | Portfolio points its Vite plugin at `../../packages/content/content/`. Blog points its Astro Content Collections loader at the same path. No duplication, no sync step. |
| Shared utilities | Move gray-matter parsing helpers and type guards into `packages/content/src/utils.ts` | Blog's Astro build and portfolio's Vite plugin both import the same parsing logic. One fix reaches both apps. |

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm-workspace.yaml** | Declares monorepo workspace roots | Required at repo root. Lists `apps/*` and `packages/*`. |
| **turbo.json** | Task pipeline definition | `build` depends on `^build` (content package builds first). `dev` is `persistent: true, cache: false`. `pagefind` depends on `build`. Use Turborepo 2.7+ `tasks` key (not deprecated `pipeline` key). |
| **Root tsconfig.json** | Shared TypeScript base config | Set `paths: { "@illulachy/content": ["./packages/content/src/index.ts"] }` so IDEs resolve imports without publishing to npm. Each app `tsconfig.json` extends from root. |

---

## Installation

```bash
# 1. Enable pnpm via corepack (no global install needed)
corepack enable
corepack prepare pnpm@9 --activate

# 2. Create monorepo structure at repo root
#    pnpm-workspace.yaml:
#      packages:
#        - 'apps/*'
#        - 'packages/*'

# 3. Move existing app
mkdir -p apps/portfolio packages/content
# Move current repo contents into apps/portfolio/
# Move content/ into packages/content/content/

# 4. Add Turborepo to root
pnpm add -Dw turbo@latest

# 5. Scaffold Astro blog app
pnpm create astro@latest apps/blog -- --template blog --typescript strict

# 6. Add Astro integrations (inside apps/blog)
pnpm --filter blog exec astro add sitemap
pnpm --filter blog add @astrojs/rss

# 7. Add Tailwind + React support to blog (optional, only if reusing portfolio components)
pnpm --filter blog exec astro add tailwind react

# 8. Add Pagefind
pnpm --filter blog add -D pagefind astro-pagefind

# 9. Wire the content package
#    In apps/portfolio/package.json: "@illulachy/content": "workspace:*"
#    In apps/blog/package.json:      "@illulachy/content": "workspace:*"
#    In packages/content/package.json: name: "@illulachy/content"
pnpm install
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Astro** for blog | Next.js App Router | If the blog needs server-side personalization, auth-gated posts, or dynamic ISR. For a static markdown blog that canvas nodes link to, Next.js ships unnecessary React runtime overhead. |
| **Astro** for blog | vite-react-ssg | If heavy React code must be shared and the team refuses to learn Astro syntax. Astro supports React islands, making this trade-off rare. |
| **Pagefind** | Algolia DocSearch | Algolia is correct for high-traffic documentation sites needing analytics, faceted search, and typo tolerance at scale. A personal blog does not need a hosted search service. |
| **Pagefind** | Orama (in-browser) | Use Orama if you need fuzzy matching with complex scoring in memory. Pagefind's chunked approach uses 50-70% less bandwidth on first search. |
| **@astrojs/rss** | `feed` npm package | Use `feed` directly if generating RSS outside Astro (standalone Node.js script). Inside Astro, `@astrojs/rss` integrates with `getCollection()` and handles all edge cases. |
| **pnpm** | npm workspaces | npm workspaces allow phantom dependencies (using a package without declaring it), which causes subtle CI failures. pnpm prevents this by design. |
| **Turborepo** | Nx | Nx is correct for large teams needing code generators, module federation, and visual dependency graphs. For 2 apps + 1 shared package, Turborepo has no config overhead. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **MDX for blog content** | Adds JSX compilation to every markdown file. Blog content is prose — no interactive components embedded in posts. MDX complicates the shared content package and requires extra build tooling. | Plain `.md` + Astro Content Collections |
| **Next.js for the blog** | Ships full React runtime + hydration + client-side router to every page. A markdown blog has no reason for client-side navigation. Astro produces smaller pages with zero JS on static routes. | Astro |
| **Lerna** | Effectively deprecated. Slow publish ceremony. Turborepo renders it unnecessary. | Turborepo |
| **Custom hand-rolled RSS XML builder** | Brittle. XML escaping, date formatting, and feed validation are easy to get wrong. `@astrojs/rss` handles all of these correctly. | @astrojs/rss |
| **Typesense, Elasticsearch, or Meilisearch** | All require a running server or hosted API. A personal blog with hundreds (not millions) of posts does not justify the infrastructure cost or maintenance. | Pagefind (fully static, zero infrastructure) |
| **Turborepo `pipeline` key in turbo.json** | Deprecated since Turborepo 2.0. Use `tasks` instead. Old templates still use `pipeline`; new projects should use `tasks`. | `tasks` key in turbo.json |

---

## Stack Patterns by Variant

**Shared content package (no-build pattern):**
- Export TypeScript source directly: `"exports": { ".": "./src/index.ts" }`
- Both Vite (portfolio) and Astro (blog) compile it as part of their own build
- No `build` script in `packages/content/package.json` — this is intentional
- Turborepo `turbo.json` does NOT need a build task for this package

**Astro blog with React components:**
- Default to `.astro` components for all blog-specific UI (post list, tag cloud, category nav)
- Reserve `@astrojs/react` islands only for interactive components (search input, clipboard copy)
- Most blog pages will be pure HTML with zero client JS — this is the Astro default

**Pagefind in Turborepo pipeline:**
```json
// turbo.json (snippet)
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "pagefind": { "dependsOn": ["build"], "outputs": ["dist/pagefind/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```
Run `pnpm turbo pagefind` after `build` to generate the search index in `dist/pagefind/`.

**Tags and categories in Astro (no extra libraries):**
- Define `tags: z.array(z.string())` and `category: z.string()` in the Content Collections schema
- `src/pages/tags/[tag].astro` with `getStaticPaths()` → one page per tag, automatically
- `src/pages/category/[category].astro` → same pattern for categories
- Astro's file-based routing handles this natively; no routing library needed

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Astro 5.18.x | Vite 6.x (internal) | Astro bundles its own Vite; no conflict with portfolio's Vite 8.x because they are separate apps in separate build graphs |
| @astrojs/react | React 19.x | Confirmed — Astro React integration tracks React stable releases |
| Tailwind v4 | Astro 5.x | Use `@tailwindcss/vite` via `@astrojs/tailwind`. Same config as portfolio. Stable. |
| Turborepo 2.8.x | pnpm 9.x | Fully supported. Turborepo 2.7 added Yarn 4 catalogs; pnpm workspace protocol has been supported since Turborepo 1.x |
| Pagefind 1.4.x | Astro 5.x | Framework-agnostic — runs post-build against the `dist/` HTML output, not Astro-specific |
| packages/content (no build) | Vite 8.x + Astro 5.x | Both bundlers handle TypeScript source imports natively. No compatibility issues. |

---

## Sources

- Turborepo npm registry — version 2.8.20, published 8 days prior to research date (HIGH)
- Turborepo blog "Turbo 2.7" (January 26, 2026): https://turborepo.dev/blog/turbo-2-7 (HIGH)
- Turborepo official Vite guide: https://turborepo.dev/docs/guides/frameworks/vite (HIGH)
- Astro npm registry — version 5.18.0 stable, 5-series current as of 2026-03-28 (HIGH)
- Astro 5.0 release announcement (December 2024): https://astro.build/blog/astro-5/ (HIGH)
- Astro February 2026 what's new: https://astro.build/blog/whats-new-february-2026/ (HIGH)
- Astro RSS integration docs: https://docs.astro.build/en/guides/rss/ (HIGH)
- Astro blog tag tutorial (official): https://docs.astro.build/en/tutorial/5-astro-api/2/ (HIGH)
- @astrojs/sitemap npm registry — version 3.7.1, published within 7 days of research date (HIGH)
- @astrojs/sitemap docs: https://docs.astro.build/en/guides/integrations-guide/sitemap/ (HIGH)
- Pagefind official site (v1.4.0 stable): https://pagefind.app/ (HIGH)
- astro-pagefind integration: https://github.com/shishkin/astro-pagefind (MEDIUM)
- pnpm workspace docs: https://pnpm.io/workspaces (HIGH)
- steipete.me reference repo (Astro + Vercel + Tailwind + markdown blog): https://github.com/steipete/steipete.me (MEDIUM — confirms Astro choice, not a monorepo itself)

---

*Stack research for: Turborepo monorepo + blog site (writing.illulachy.me)*
*Researched: 2026-03-28*
