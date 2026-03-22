# Technology Stack

**Project:** illulachy.me (Infinite Canvas Portfolio)
**Researched:** 2025-01-19
**Confidence:** HIGH

## Executive Summary

Build with **Vite + React 19 + TypeScript + tldraw 4.5** for the infinite canvas experience. Use Vite (not Next.js) because tldraw is a client-side canvas library requiring browser APIs and SSR adds unnecessary complexity. Manage content as markdown files processed at build time with gray-matter + remark, styled with Tailwind CSS for UI chrome around the canvas, and deploy as static sites to Vercel with Turborepo for monorepo orchestration.

**Why this stack:** tldraw is a production-ready infinite canvas SDK (45K+ GitHub stars) designed specifically for React, providing custom shape APIs, pan/zoom, and performance optimizations out of the box. Vite offers the fastest development experience with React Fast Refresh and optimized production builds. The markdown-to-canvas pipeline at build time keeps the runtime lightweight.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React** | 19.2.x | UI framework | Required by tldraw (peer dependency), latest stable with concurrent features |
| **TypeScript** | 5.9.x | Type safety | Essential for tldraw's strongly-typed Editor API and custom shapes |
| **Vite** | 8.0.x | Build tool | Fast HMR, optimized for client-side SPA (canvas apps don't benefit from SSR) |
| **@vitejs/plugin-react** | 6.0.x | React integration | React Fast Refresh, JSX transformation |

**Rationale:** tldraw requires React 18.2+ (works with 19.x) and is a client-only library. Vite's dev server is 10-20x faster than Webpack for React projects and produces optimized static builds. TypeScript is critical for type-safe custom shape definitions and Editor API interactions.

**Source:** npm registry, tldraw package.json peer dependencies (HIGH confidence)

---

### Canvas Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **tldraw** | 4.5.x | Infinite canvas SDK | Production-ready with pan/zoom, custom shapes, performance optimizations |
| **@tldraw/editor** | 4.5.x | Editor API | Runtime control of canvas (zoom, pan, shape manipulation) |
| **@tldraw/store** | 4.5.x | State management | Canvas state persistence (included as tldraw dependency) |

**Why tldraw over alternatives:**
- **vs. Fabric.js:** tldraw is React-first with hooks-based API; Fabric.js is imperative and not React-native
- **vs. Konva.js/react-konva:** tldraw includes whiteboard primitives (pan/zoom, bindings) out of the box
- **vs. custom Canvas API:** tldraw handles touch gestures, keyboard navigation, undo/redo, and performance (LOD rendering) automatically
- **vs. Excalidraw:** tldraw is an SDK for building custom canvas apps; Excalidraw is a full whiteboard app

**Custom shapes workflow:** Define shape types as TypeScript classes extending `BaseBoxShapeUtil`, register with `TLUiOverrides` to inject into canvas. tldraw handles rendering, selection, transforms, and hit testing.

**Source:** tldraw GitHub (45K+ stars), npm downloads (200K+ weekly), official docs at tldraw.dev (HIGH confidence)

---

### Content Pipeline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **gray-matter** | 4.0.x | Frontmatter parsing | Parse YAML frontmatter from markdown files (dates, URLs, metadata) |
| **remark** | 15.0.x | Markdown processing | Unified ecosystem for markdown AST transformation |
| **remark-parse** | 11.x | Markdown parsing | Convert markdown to MDAST (Abstract Syntax Tree) |
| **remark-rehype** | 11.x | Markdown to HTML | Transform MDAST to HAST for rendering |
| **rehype-raw** | 7.0.x | HTML parsing | Support raw HTML in markdown (for YouTube embeds, etc.) |
| **react-markdown** | 10.1.x | Markdown rendering | Render markdown content in React components (for blog site) |

**Content processing flow:**
1. Build time: Read `.md` files → gray-matter extracts frontmatter + content
2. Frontmatter → timeline node positions, metadata (date, type, URL)
3. Content → stored as string or pre-processed HTML for "preview" on canvas nodes
4. Canvas nodes link to external URLs (YouTube, blog) rather than inline rendering

**Alternative considered:** MDX (Markdown + JSX) — rejected because content is metadata-driven (dates, URLs) not interactive components. gray-matter + remark is simpler for this use case.

**Source:** npm registry, steipete.me inspiration reference (uses gray-matter), remark docs (HIGH confidence)

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | 4.2.x | UI utility classes | Fast styling for UI chrome (header, nav, modals) around canvas |
| **tldraw/tldraw.css** | 4.5.x (bundled) | Canvas styles | Required tldraw stylesheet for canvas UI and controls |
| **clsx** | 2.1.x | Conditional classes | Combine Tailwind classes conditionally (smaller than classnames) |

**Styling approach:**
- **Canvas area:** tldraw handles all canvas rendering and controls via its CSS
- **UI chrome:** Tailwind for header, overlays, "game mode" indicators, loading states
- **Custom shapes on canvas:** Inline styles or CSS modules (tldraw shapes render to HTML/SVG, support standard CSS)

**Why Tailwind over CSS-in-JS:**
- tldraw already includes its own styling system; Tailwind keeps the rest lightweight
- No runtime CSS-in-JS overhead (Emotion/styled-components add bundle size)
- Tailwind 4.x has zero-config Vite integration via `@tailwindcss/vite`

**Alternative considered:** Vanilla Extract (zero-runtime CSS-in-TS) — overkill for this project, Tailwind is more conventional for UI chrome.

**Source:** tldraw installation docs (require CSS import), Tailwind docs, npm registry (HIGH confidence)

---

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **tldraw store** | 4.5.x (bundled) | Canvas state | Built-in to tldraw, handles shape data, undo/redo, history |
| **React Context** | (built-in) | App state | Timeline data, content metadata, UI state (game mode toggle) |
| **localStorage** | (native) | Persistence | Save canvas viewport position (optional) |

**Why NOT Zustand/Redux:**
- Canvas state is managed entirely by tldraw's store (reactive, observable)
- App state is simple: timeline node data (loaded once at mount) + UI toggles
- React Context is sufficient; no complex async state or global mutations

**When to add external state management:**
- If adding real-time collaboration (tldraw offers `@tldraw/sync` for this)
- If adding user preferences, analytics, or complex filtering (defer to v2)

**Source:** tldraw architecture docs, best practices for client-side React apps (MEDIUM confidence)

---

### Utilities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **date-fns** | 4.1.x | Date formatting | Timeline positioning by date, lightweight (vs. moment.js) |
| **uuid** | 13.0.x | Unique IDs | Generate IDs for timeline nodes (if not using markdown filenames) |
| **lodash-es** | 4.17.x | Utilities | Array/object manipulation for timeline sorting, grouping |

**Why date-fns:** Modular (tree-shakeable), modern API, 10x smaller than moment.js. Use for calculating timeline positions (e.g., months from earliest date).

**Source:** npm registry, bundle size comparison (HIGH confidence)

---

### Monorepo

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Turborepo** | 2.8.x | Build orchestration | Caching, parallel builds for portfolio + blog sites |
| **pnpm** | 10.32.x | Package manager | Faster than npm/yarn, efficient for monorepos with workspace: protocol |

**Monorepo structure:**
```
/
├── apps/
│   ├── portfolio/     (illulachy.me - Vite + React + tldraw)
│   └── blog/          (letters.illulachy.me - Vite + React or Astro)
├── packages/
│   └── content/       (shared markdown files, types, utilities)
├── turbo.json         (build pipeline config)
└── package.json       (root workspace config)
```

**Why Turborepo over Nx:** Simpler, zero-config for basic monorepos. Nx adds complexity (generators, affected commands) not needed for 2-app setup.

**Why pnpm over npm/yarn:** 30-50% faster installs, strict dependency resolution (prevents phantom dependencies), native workspace support.

**Source:** Turborepo docs, steipete.me reference (uses monorepo), pnpm benchmarks (HIGH confidence)

---

### Testing & Quality

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Vitest** | 4.1.x | Unit tests | Test timeline positioning logic, markdown parsing |
| **@testing-library/react** | 16.x | Component tests | Test custom shapes, canvas interactions (defer to Phase 2) |
| **Playwright** | 1.50.x | E2E tests | Test pan/zoom, game mode navigation (defer to Phase 2) |
| **ESLint** | 10.1.x | Linting | Code quality, catch bugs |
| **Prettier** | 3.8.x | Formatting | Consistent style |

**Testing strategy:**
- **Phase 1 (MVP):** Focus on markdown parsing and timeline positioning logic (Vitest unit tests)
- **Phase 2:** Add interaction tests for canvas (e.g., click node → opens URL) with Testing Library
- **Phase 3:** E2E tests for game mode, touch gestures with Playwright

**Why Vitest:** Native Vite integration, fast, Jest-compatible API.

**Source:** Vitest docs, React Testing Library docs, common Vite + React testing patterns (HIGH confidence)

---

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | CLI 50.x | Hosting | Zero-config for Vite, automatic monorepo detection, edge network |
| **Vercel Analytics** | 1.6.x | Performance tracking | Web Vitals monitoring, optional |
| **Vercel Speed Insights** | 1.3.x | Performance metrics | CLS, LCP, FID tracking for canvas performance |

**Deployment targets:**
- `illulachy.me` → `apps/portfolio` (Vite SPA)
- `letters.illulachy.me` → `apps/blog` (Vite SPA or static site)

**Why Vercel over Netlify/Cloudflare Pages:**
- Best Vite + React DX (official integration)
- Automatic monorepo support (detects Turborepo)
- Edge network with fast cold starts
- Analytics for canvas performance (track FPS, paint times)

**Alternative:** Netlify (similar features, slightly slower edge network). Cloudflare Pages (best for static sites, less optimized for SPAs).

**Source:** Vercel docs, Vite deployment guide (HIGH confidence)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite | Next.js | tldraw is client-only, SSR adds complexity with no benefit |
| Build tool | Vite | Create React App | Deprecated (no longer maintained), slow builds |
| Canvas | tldraw | Fabric.js | Not React-native, imperative API, no built-in pan/zoom |
| Canvas | tldraw | Konva + react-konva | No whiteboard primitives, must build pan/zoom from scratch |
| Canvas | tldraw | Excalidraw | Full whiteboard app, not an SDK for custom experiences |
| Markdown | remark + gray-matter | MDX | Overkill for metadata-driven content, not using interactive components |
| Styling | Tailwind | Emotion/styled-components | Runtime overhead, tldraw already includes CSS system |
| Styling | Tailwind | Vanilla Extract | Zero-runtime but overkill for UI chrome around canvas |
| State | React Context | Zustand | Simple state (timeline data + UI toggles), Context sufficient |
| State | React Context | Redux | Overkill, no complex async state or time-travel debugging needed |
| Monorepo | Turborepo | Nx | Simpler, zero-config; Nx adds complexity not needed here |
| Monorepo | Turborepo | Lerna | Deprecated, Turborepo is faster with better caching |
| Package manager | pnpm | npm | pnpm is 30-50% faster, strict resolution prevents bugs |
| Hosting | Vercel | Netlify | Vercel has better Vite integration and edge performance |
| Hosting | Vercel | Cloudflare Pages | Better for static sites; Vercel optimized for React SPAs |

---

## Installation

### Core Stack

```bash
# Initialize with Vite
npm create vite@latest apps/portfolio -- --template react-ts

# Add tldraw
cd apps/portfolio
npm install tldraw

# Add Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite
npx tailwindcss init

# Add content pipeline
npm install gray-matter remark remark-parse remark-rehype rehype-raw

# Add utilities
npm install date-fns uuid lodash-es clsx

# Add TypeScript types
npm install -D @types/lodash-es
```

### Monorepo Setup

```bash
# Root package manager
npm install -g pnpm

# Initialize monorepo
pnpm init

# Add Turborepo
pnpm add -Dw turbo

# Create workspace
# (Edit package.json to add "workspaces": ["apps/*", "packages/*"])
```

### Dev Dependencies

```bash
# Testing
pnpm add -Dw vitest @testing-library/react playwright

# Linting & Formatting
pnpm add -Dw eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Performance Considerations

### Canvas Rendering

**tldraw optimizations (built-in):**
- **Level of Detail (LOD):** Shapes render at lower fidelity when zoomed out
- **Culling:** Off-screen shapes are not rendered (viewport-aware)
- **Debounced updates:** Pan/zoom events are batched to avoid jank
- **Hardware acceleration:** Canvas uses GPU-accelerated transforms

**Project-specific optimizations:**
- **Limit initial nodes:** Start with ~50-100 timeline nodes, lazy-load older entries on demand
- **Optimize images:** Compress thumbnails (WebP), use loading="lazy" for off-canvas nodes
- **Virtualization:** tldraw handles this internally; no need for react-window/react-virtuoso

**Performance budget:**
- Target: 60 FPS during pan/zoom
- Canvas nodes: 100-200 max (start with 50-100 for MVP)
- Bundle size: <500KB JS (gzip), tldraw is ~200KB alone

**Source:** tldraw performance issue tracker, tldraw docs on LOD (MEDIUM confidence)

---

### Build Optimization

**Vite production build:**
- Code splitting: Lazy-load blog components, timeline data
- Tree shaking: lodash-es, date-fns (import individual functions)
- CSS purging: Tailwind purges unused styles automatically in production
- Asset optimization: Vite compresses images, inlines small assets

**Monorepo caching:**
- Turborepo caches builds across apps (reuses unchanged packages)
- pnpm stores single copy of dependencies (saves disk space, faster installs)

---

### Runtime Performance

**Web Vitals targets:**
- **LCP (Largest Contentful Paint):** <2.5s (canvas loads fast, but images may delay)
- **FID (First Input Delay):** <100ms (tldraw is event-driven, should be responsive)
- **CLS (Cumulative Layout Shift):** <0.1 (canvas is fixed layout, minimal shift)

**Monitoring:**
- Use `@vercel/speed-insights` to track Web Vitals
- Use `web-vitals` package for local dev monitoring
- Track canvas FPS with tldraw's debug mode (via Editor API)

**Source:** Vite performance guide, Web Vitals docs, Vercel Analytics docs (HIGH confidence)

---

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev servers (runs both portfolio + blog)
pnpm dev

# Run specific app
pnpm --filter portfolio dev
pnpm --filter blog dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format
pnpm format
```

### Build & Deploy

```bash
# Build all apps (with Turborepo caching)
pnpm build

# Deploy to Vercel (auto-detected monorepo)
vercel --prod

# Or deploy individual apps
vercel --prod apps/portfolio
vercel --prod apps/blog
```

---

## Configuration Examples

### Vite Config (apps/portfolio/vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tldraw': ['tldraw', '@tldraw/editor', '@tldraw/store'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
```

### Tailwind Config (apps/portfolio/tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

### Turborepo Config (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

---

## Migration Path

If requirements change:

| Scenario | Migration |
|----------|-----------|
| Need SSR/SEO | Switch to Next.js App Router, keep tldraw client-side with dynamic import |
| Need collaboration | Add `@tldraw/sync` + Cloudflare Durable Objects (tldraw's official multiplayer) |
| Scale to 1000+ nodes | Add pagination, lazy-load timeline segments, consider WebGL rendering |
| Add CMS | Integrate headless CMS (Contentful, Sanity) for markdown, keep build-time processing |
| Mobile app | tldraw works on mobile web; for native, consider React Native (no tldraw support yet) |

---

## Sources

### High Confidence
- tldraw npm package and GitHub (45K+ stars, 200K+ weekly downloads): https://github.com/tldraw/tldraw
- tldraw documentation: https://tldraw.dev
- Vite documentation: https://vite.dev
- React 19 documentation: https://react.dev
- npm registry (package versions and descriptions)
- Tailwind CSS documentation: https://tailwindcss.com
- Turborepo documentation: https://turbo.build

### Medium Confidence
- tldraw performance issue tracker (GitHub): https://github.com/tldraw/tldraw/issues?q=label%3Aperformance
- steipete.me inspiration (Astro-based, but validates markdown + monorepo pattern): https://github.com/steipete/steipete.me
- Vercel + Vite integration patterns (official guides)

### Low Confidence (Deferred to Phase-Specific Research)
- Canvas FPS targets for 200+ nodes (needs performance testing)
- Optimal timeline node layout algorithms (needs experimentation)
- Touch gesture performance on mobile canvas (needs device testing)

---

## Next Steps for Roadmap

1. **Phase 1 (Foundation):** Set up Vite + React + TypeScript + tldraw, basic canvas with pan/zoom
2. **Phase 2 (Content):** Markdown pipeline (gray-matter → timeline nodes), basic custom shapes
3. **Phase 3 (Styling):** Tailwind UI chrome, custom shape styling, responsive layout
4. **Phase 4 (Features):** Timeline positioning logic (date-based), external links, game mode
5. **Phase 5 (Monorepo):** Blog site integration, Turborepo build pipeline
6. **Phase 6 (Deploy):** Vercel deployment, performance monitoring

**Research flags:**
- Phase 4 will need timeline layout algorithm research (chronological positioning)
- Phase 6 will need canvas performance profiling (FPS monitoring, bundle size analysis)
