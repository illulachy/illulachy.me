# Architecture Patterns

**Domain:** Infinite Canvas Portfolio/Timeline Sites with React + tldraw
**Researched:** 2025-01-19
**Confidence:** HIGH (stack patterns), MEDIUM (timeline layout)

## Overview

Architecture for infinite canvas portfolio sites follows a **client-side SPA pattern** with build-time content processing. Key characteristics:

1. **Canvas-first:** tldraw Editor manages canvas state (shapes, viewport, interactions)
2. **Static generation:** Markdown → JSON at build time (no runtime parsing)
3. **Custom shapes:** Timeline nodes as tldraw shape utilities (React components rendered on canvas)
4. **Separation of concerns:** Canvas (tldraw) vs. UI chrome (React DOM)

**Why this architecture:** Canvas applications are fundamentally client-side (require browser APIs, GPU acceleration). SSR adds complexity with no benefit. Build-time content processing keeps runtime lightweight.

---

## Recommended Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Application                      │  │
│  │                                                           │  │
│  │  ┌─────────────┐              ┌──────────────────────┐   │  │
│  │  │  UI Chrome  │              │   tldraw Canvas      │   │  │
│  │  │  (Tailwind) │              │                      │   │  │
│  │  │             │              │  ┌────────────────┐  │   │  │
│  │  │ • Header    │              │  │ Portfolio Hub  │  │   │  │
│  │  │ • Nav       │              │  │   (16:9 node)  │  │   │  │
│  │  │ • Loading   │              │  └────────────────┘  │   │  │
│  │  │ • Game Mode │              │                      │   │  │
│  │  │   Toggle    │              │  ┌─────┐ ┌─────┐    │   │  │
│  │  │             │              │  │Node │ │Node │... │   │  │
│  │  └─────────────┘              │  └─────┘ └─────┘    │   │  │
│  │                               │                      │   │  │
│  │                               │  Timeline Shapes →   │   │  │
│  │                               │  (custom shape utils)│   │  │
│  │                               └──────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │              Application State                    │   │  │
│  │  │  • Timeline data (loaded from JSON)              │   │  │
│  │  │  • Game mode toggle (React Context)              │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │              tldraw Store                         │   │  │
│  │  │  • Canvas state (shapes, viewport)                │   │  │
│  │  │  • Undo/redo history                              │   │  │
│  │  │  • Selection state                                │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Build Time (Vite)                            │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Markdown   │  →   │ gray-matter  │  →   │     JSON     │  │
│  │    Files     │      │   + remark   │      │  (bundled)   │  │
│  │              │      │              │      │              │  │
│  │ • date       │      │ Parse        │      │ • Timeline   │  │
│  │ • type       │      │ • frontmatter│      │   data       │  │
│  │ • url        │      │ • content    │      │ • Positions  │  │
│  │ • content    │      │              │      │ • Metadata   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **tldraw Canvas** | Infinite canvas engine, pan/zoom, shape rendering | Custom shapes, Editor API |
| **Custom Shapes** | Timeline node rendering (YouTube, blog, project) | tldraw Editor, external URLs |
| **Content Pipeline** | Build-time markdown → JSON transformation | Markdown files, Vite build |
| **App State (Context)** | Timeline data, game mode toggle, loading state | UI components, hooks |
| **UI Chrome** | Header, nav, loading screen (outside canvas) | App Context |

---

## Data Flow

### Timeline Content Lifecycle

```
1. Author writes markdown file
   ↓
2. Commit to Git (triggers deploy)
   ↓
3. Build time: Vite runs content pipeline
   - gray-matter parses frontmatter
   - Calculate canvas positions
   - Generate timeline.json
   ↓
4. Bundle timeline.json with app
   ↓
5. Runtime: App loads timeline.json
   ↓
6. Create tldraw shapes from timeline data
   ↓
7. User interacts with canvas
   - Pan/zoom (tldraw handles)
   - Click node → open external URL
   ↓
8. Game mode toggle (optional)
   - Arrow keys navigate between nodes
   - Spaceship cursor (CSS)
```

---

## Patterns to Follow

### Pattern 1: Custom Shape Registration

**What:** Register custom shape utilities with tldraw  
**When:** App initialization, before canvas mounts

**Example:**
```typescript
import { Tldraw } from 'tldraw'
import { YouTubeShapeUtil, BlogShapeUtil, ProjectShapeUtil, PortfolioHubShapeUtil } from './shapes'

const customShapeUtils = [
  YouTubeShapeUtil,
  BlogShapeUtil,
  ProjectShapeUtil,
  PortfolioHubShapeUtil
]

function App() {
  return <Tldraw shapeUtils={customShapeUtils} />
}
```

---

### Pattern 2: Build-Time Content Generation

**What:** Generate timeline JSON at build time, not runtime  
**When:** Vite build process (before deployment)

**Example:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { buildTimelineData } from './scripts/build-timeline'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'timeline-data',
      buildStart() {
        buildTimelineData()  // Parse markdown → JSON
      }
    }
  ]
})
```

---

### Pattern 3: Event-Driven Click Handlers

**What:** Handle node clicks to open external URLs  
**When:** User clicks timeline node on canvas

**Example:**
```typescript
import { useEditor } from 'tldraw'

export function Canvas() {
  const editor = useEditor()
  
  useEffect(() => {
    if (!editor) return
    
    const handleShapeClick = (info: { shape: TLShape }) => {
      if ('url' in shape.props && shape.props.url) {
        window.open(shape.props.url, '_blank')
      }
    }
    
    editor.on('click-shape', handleShapeClick)
    return () => editor.off('click-shape', handleShapeClick)
  }, [editor])
  
  return null
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime Markdown Parsing

**What goes wrong:** Parsing markdown in the browser on every load  
**Why it happens:** Convenience of fetching markdown files directly  
**Consequences:** Large bundle size, slow initial load, wasted CPU  
**Prevention:** Parse markdown at build time, bundle pre-processed JSON

---

### Anti-Pattern 2: SSR with tldraw

**What goes wrong:** Using Next.js or SSR with tldraw  
**Why it happens:** Assumption that SSR improves performance/SEO  
**Consequences:** Complex dynamic imports, hydration issues, no actual benefit  
**Prevention:** Use Vite (client-side SPA), canvas apps don't need SSR

---

### Anti-Pattern 3: Hardcoded Timeline Positions

**What goes wrong:** Manually setting X/Y coordinates for each node  
**Why it happens:** Quick initial setup without thinking about scale  
**Consequences:** Unmaintainable, doesn't scale to 100+ nodes  
**Prevention:** Calculate positions algorithmically based on dates

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Performance** | tldraw handles 100 nodes | Monitor FPS, optimize if <60 | Lazy-load timeline segments |
| **Hosting** | Vercel free tier | Vercel Pro tier | Vercel Enterprise or Cloudflare |
| **Analytics** | Vercel Analytics (Web Vitals) | Add custom events (node clicks) | Segment or Amplitude |
| **Caching** | Browser cache (static assets) | CDN for images (thumbnails) | Image CDN (Cloudinary, Imgix) |

---

## Monorepo Structure

```
illulachy.me/
├── apps/
│   ├── portfolio/            (illulachy.me - infinite canvas)
│   │   ├── src/
│   │   │   ├── components/   (Canvas, Header, LoadingScreen)
│   │   │   ├── shapes/       (Custom shape utilities)
│   │   │   ├── contexts/     (AppContext)
│   │   │   ├── hooks/        (useInitializeTimeline)
│   │   │   ├── data/         (timeline.json - generated)
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   │
│   └── blog/                 (letters.illulachy.me - blog site)
│       └── vite.config.ts
│
├── packages/
│   └── content/              (shared markdown and types)
│       ├── timeline/         (markdown files)
│       ├── scripts/          (build-timeline.ts)
│       └── types/            (TypeScript types)
│
├── turbo.json                (Turborepo config)
├── package.json              (root workspace)
└── pnpm-workspace.yaml
```

---

## Sources

### Primary (High Confidence)
- tldraw documentation: https://tldraw.dev/docs
- tldraw examples: https://tldraw.dev/examples
- Vite documentation: https://vite.dev
- Turborepo documentation: https://turbo.build

### Secondary (Medium Confidence)
- Timeline layout algorithms (need Phase 4 research)
- Canvas performance limits (node counts, FPS)
- Game mode navigation patterns (spatial vs. chronological)
