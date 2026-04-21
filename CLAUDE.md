# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Turborepo monorepo** for illulachy.me, containing:
- `apps/blog` — Astro-based static blog with Markdown content, Pagefind search, and custom Shiki themes
- `apps/portfolio` — React + Vite interactive portfolio with Three.js 3D graphics and GSAP animations
- `packages/content` — Shared content utilities (Markdown parsing, timeline generation)
- `packages/tokens` — Shared design tokens as CSS custom properties

## Commands

All tasks run from the repo root via Turbo:

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm test         # Run all tests
pnpm generate-timeline  # Regenerate timeline data from content package
```

Per-app commands (use `--filter`):

```bash
pnpm --filter @illu/blog dev
pnpm --filter @illu/portfolio dev
pnpm --filter @illu/blog build    # Runs astro build + pagefind --site dist
pnpm --filter @illu/portfolio build  # Runs tsc -b && vite build
```

Running a single test file:

```bash
# Blog (Vitest)
pnpm --filter @illu/blog exec vitest run src/test/<file>.test.ts

# Portfolio (Vitest)
pnpm --filter @illu/portfolio exec vitest run src/__tests__/<file>.test.ts

# Portfolio E2E (Playwright)
pnpm --filter @illu/portfolio exec playwright test
```

## Architecture

### Monorepo structure

Turbo orchestrates tasks with declared dependencies. Task pipeline is defined in `turbo.json`; build outputs are `dist/**` and `.astro/**`.

### Blog (`apps/blog`)

- **Astro** with `base: '/blog'` — all routes and assets are prefixed with `/blog`
- Content lives in `packages/content/content/` and is referenced via the `@illu/content` workspace package
- Custom Shiki themes at `src/shiki/` (illu-dark, illu-light)
- Pagefind is invoked as a `postbuild` script to index the built site for client-side search

### Portfolio (`apps/portfolio`)

- **React 19 + Vite** with `@` aliased to `./src`
- Two custom Vite plugins in `src/lib/`:
  - **Timeline plugin** — generates timeline JSON from content package at build time
  - **Static subapps middleware** — serves standalone HTML subapps (ambientspace, tltr, dotword) from `public/` during dev
- Heavy use of Three.js / `@react-three/fiber`, GSAP, Konva, and D3-force for interactive visuals

### Shared packages

- `@illu/content` — exposes parsed Markdown/frontmatter utilities and a `generate-timeline` script (`tsx scripts/generate-timeline.ts`)
- `@illu/tokens` — pure CSS file (`src/tokens.css`) imported by both apps for design token consistency

### Deployment

Deployed on Vercel. The blog uses `base: '/blog'` in `astro.config.ts`, which must remain consistent with Vercel routing config.
