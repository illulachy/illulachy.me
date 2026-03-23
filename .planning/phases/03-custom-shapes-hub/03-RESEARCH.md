# Phase 3: Custom Shapes & Hub - Research

**Researched:** 2026-03-23  
**Domain:** tldraw custom shapes, React component rendering, click handling  
**Confidence:** HIGH

## Summary

Phase 3 implements custom tldraw shapes to render portfolio content nodes and a central hub. The research confirms tldraw 4.5.3 provides robust APIs for custom shape creation through `BaseBoxShapeUtil`, shape-level click handling via `onClick()`, and React component rendering within shapes using `HTMLContainer`.

Key findings: (1) tldraw's shape system cleanly separates geometry, interaction, and rendering concerns, (2) `pointerEvents: 'all'` + `stopPropagation()` enables interactive elements within shapes without interfering with canvas panning, (3) shapes can be locked to prevent dragging via the `isLocked` property, (4) React portals render modals above the canvas z-index, and (5) existing glassmorphism design tokens in `.stich/` provide consistent styling.

**Primary recommendation:** Extend `BaseBoxShapeUtil` for each content type (YouTube, Blog, Project, Milestone, Hub), use `ShapeUtil.onClick()` for navigation, render using `HTMLContainer` with design system tokens, and manage milestone modal state at Canvas component level with React portal.

## User Constraints

<user_constraints>
### Locked Decisions (from CONTEXT.md)

**Visual Representation:**
- YouTube & Project nodes: Thumbnail-based (image fills node with title overlay)
- Blog & Milestone nodes: Card-based (styled card with title, metadata, iconography)
- Node sizes: Timeline nodes **280x200px uniform**, Hub **640x360px**
- Type differentiation: Visual metaphors (video player, document, code window, badge) not color coding
- Design system: Glassmorphism with mauve accent (#E0AFFF) matching Phase 1 controls

**Interaction Patterns:**
- Click behavior: Single click opens URL in new tab (`window.open(url, '_blank')`) for YouTube/Blog/Project
- Milestone display: Modal overlay (centered on screen, glassmorphism, backdrop dismiss, ESC key)
- Hover states: Glassmorphism glow with mauve accent, scale 1.02x, pointer cursor
- Shape dragging: Prevented (shapes are static, `isLocked: true`)
- Click handlers: Prevent canvas pan event bubbling

**About Me Content:**
- Source: `content/about.md` (YAML-only frontmatter, no body)
- Required fields: `name`, `title`, `bio`
- Optional fields: `avatar`, `email`, `social` (object)
- Processing: Build-time via extended Phase 2 generator → `public/about.json`
- Hub display: Avatar, name (Noto Serif), title (Space Grotesk), bio (2-3 lines), social icons (not clickable)

**Node Positioning (Phase 3 Temporary):**
- Horizontal: Left from hub, -400px increments (x = -400, -800, -1200...)
- Vertical: Type-based separation
  - YouTube & Blog: Above timeline (y = +100, +200, +300... per node)
  - Milestone & Project: Below timeline (y = -100, -200, -300... per node)
- Hub: x=0, y=0 (canvas center)
- Phase 4 will replace with chronological layout + collision detection

**Code Integration:**
- Extend Phase 2 generator (`scripts/generate-timeline.ts`) to process `about.md` → `about.json`
- Fetch both `/timeline.json` and `/about.json` on Canvas mount
- Pass data to tldraw shape rendering logic
- Apply temporary positioning algorithm (type-based vertical offsets)
- Modal component as React portal outside canvas DOM

### Claude's Discretion

**Shape Architecture:**
- Decision on separate ShapeUtil per type vs single TimelineNodeShape with type prop (Recommendation: Separate utils for cleaner code and easier maintenance)
- Modal implementation details (recommended: React portal with shared `<Modal>` component)
- Thumbnail loading strategy (recommended: lazy loading with skeleton placeholders, `onLoad` fade-in)
- Image error fallback approach (recommended: gradient background + type icon SVG)

**Design System Formalization:**
- Extract glassmorphism tokens from Phase 1 into reusable shape style utilities
- Create shared shape component base with common styling
- Thumbnail loading skeleton animation timing

**Testing Strategy:**
- Unit tests for positioning algorithm (type-based vertical offsets)
- Integration tests for shape click handlers
- Visual regression tests for shape rendering (optional, defer to Phase 5)

### Deferred Ideas (OUT OF SCOPE)

- Chronological layout algorithm → Phase 4
- Collision detection → Phase 4
- Node animations (entrance, hover transitions) → Phase 5
- Responsive node sizing → Phase 5
- Social link interactivity on hub → Phase 5
- Keyboard focus states → Phase 5
- Arrow key navigation → Phase 6 (Game Mode)
- Custom thumbnails for blogs/milestones → v2
- Node search/filter → v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HUB-01 | Central portfolio node (16:9) displays in center of canvas | BaseBoxShapeUtil provides geometry/resize, positioning at x=0,y=0, 640x360px size |
| HUB-02 | Portfolio node shows "about me" content | about.json processing pipeline, HTMLContainer renders React component with content |
| HUB-03 | Portfolio node visually distinct from timeline nodes | Different size (640x360 vs 280x200), different content layout, unique styling |
| INT-01 | Click YouTube node → opens video in YouTube | ShapeUtil.onClick() returns partial or calls window.open(), url from timeline.json |
| INT-02 | Click blog node → opens letters.illulachy.me | Same onClick pattern, url field in ContentNode |
| INT-03 | Click project node → opens external project URL | Same onClick pattern, url field in ContentNode |
| INT-04 | Click milestone node → details display (modal) | onClick sets modal state in Canvas component, React portal renders modal |
| INT-05 | Nodes have hover states (glow, cursor pointer) | CSS hover styles on HTMLContainer, pointerEvents: 'all', mauve border + scale |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | 4.5.3 | Custom shape system, infinite canvas | Project's Phase 1 foundation, proven stable, 60 FPS performance |
| @tldraw/editor | (bundled) | BaseBoxShapeUtil, Editor API, types | Core shape utilities and editor control |
| react | 19.2.4 | Component rendering, hooks for state | Project's existing framework, latest stable |
| react-dom | 19.2.4 | React portals for modals | Standard DOM integration, portal API for overlays |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | 4.0.3 | Parse about.md frontmatter | Already used in Phase 2 for content parsing |
| zod | 4.3.6 | Validate about.md schema | Already used in Phase 2 for validation |
| TypeScript | 5.9.3 | Shape type definitions, type safety | Project standard for all code |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BaseBoxShapeUtil | ShapeUtil (base class) | Would require manual getGeometry + onResize implementation (not needed) |
| React portals | Absolute positioned div | Portal ensures modal renders above tldraw's z-index layers |
| ShapeUtil.onClick() | DOM onClick + stopPropagation | Shape-level onClick integrates with editor's event system correctly |
| HTMLContainer | Raw SVG rendering | HTMLContainer handles coordinate transforms and React lifecycle |

**Installation:**
```bash
# All dependencies already installed in Phase 1-2
# No new packages required
```

**Version verification:**
```bash
npm list tldraw react react-dom gray-matter zod
# tldraw@4.5.3 (verified 2026-03-23, latest stable)
# react@19.2.4
# gray-matter@4.0.3
# zod@4.3.6
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Canvas.tsx                  # Main canvas (fetch data, create shapes, modal state)
│   ├── shapes/
│   │   ├── HubShape.tsx           # Portfolio hub shape util + component
│   │   ├── YouTubeNodeShape.tsx   # YouTube content node
│   │   ├── BlogNodeShape.tsx      # Blog/note content node
│   │   ├── ProjectNodeShape.tsx   # Project content node
│   │   ├── MilestoneNodeShape.tsx # Milestone/education node
│   │   └── index.ts               # Export shapeUtils array
│   ├── MilestoneModal.tsx         # Modal component (via portal)
│   └── ...existing components
├── lib/
│   ├── positionNodes.ts           # Temporary positioning algorithm
│   └── ...existing utilities
├── types/
│   ├── content.ts                 # ContentNode, TimelineData (existing)
│   ├── about.ts                   # AboutData interface (new)
│   └── shapes.ts                  # tldraw shape type declarations (new)
scripts/
├── generate-timeline.ts           # Extend to process about.md
public/
├── timeline.json                  # Existing
└── about.json                     # Generated (new)
```

### Pattern 1: Custom Shape Definition (BaseBoxShapeUtil)
**What:** Create custom tldraw shape by extending `BaseBoxShapeUtil` and declaring shape props.  
**When to use:** For all timeline nodes and hub (rectangular shapes with w/h props).  
**Example:**
```typescript
// Source: tldraw official examples + @tldraw/editor types
// src/components/shapes/YouTubeNodeShape.tsx

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLShape,
} from 'tldraw'

// [1] Declare module augmentation for type system
const YOUTUBE_NODE_TYPE = 'youtube-node'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [YOUTUBE_NODE_TYPE]: {
      w: number
      h: number
      nodeId: string
      title: string
      url: string
      thumbnail?: string
      date: string
    }
  }
}

// [2] Define shape type
type YouTubeNodeShape = TLShape<typeof YOUTUBE_NODE_TYPE>

// [3] Create shape util class
export class YouTubeNodeUtil extends BaseBoxShapeUtil<YouTubeNodeShape> {
  static override type = YOUTUBE_NODE_TYPE
  
  // [4] Define props with validators
  static override props: RecordProps<YouTubeNodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    title: T.string,
    url: T.string,
    thumbnail: T.string.optional(),
    date: T.string,
  }
  
  // [5] Default props
  getDefaultProps(): YouTubeNodeShape['props'] {
    return {
      w: 280,
      h: 200,
      nodeId: '',
      title: '',
      url: '',
      thumbnail: undefined,
      date: '',
    }
  }
  
  // [6] Disable editing and resizing
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  // [7] Click handler for navigation
  override onClick(shape: YouTubeNodeShape) {
    window.open(shape.props.url, '_blank', 'noopener,noreferrer')
    // Return void to prevent shape update
  }
  
  // [8] Render component
  component(shape: YouTubeNodeShape) {
    const { title, thumbnail } = shape.props
    
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all', // Enable hover/click
          background: 'var(--surface-container-low)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          backdropFilter: 'blur(var(--glass-blur))',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all var(--motion-hover)',
        }}
      >
        {/* Thumbnail or placeholder */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            style={{
              width: '100%',
              height: '70%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '70%',
            background: 'var(--surface-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '48px' }}>▶</span>
          </div>
        )}
        
        {/* Title overlay */}
        <div style={{
          padding: 'var(--spacing-3)',
          background: 'var(--glass-bg)',
        }}>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            fontWeight: 'var(--font-weight-medium)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </p>
        </div>
      </HTMLContainer>
    )
  }
  
  // [9] Selection indicator
  indicator(shape: YouTubeNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
```

**Key points:**
- `BaseBoxShapeUtil` provides `getGeometry()`, `onResize()`, and snap geometry automatically
- `HTMLContainer` handles coordinate transforms and z-index for React rendering
- `pointerEvents: 'all'` enables shape interaction (hover, click)
- `onClick()` at ShapeUtil level integrates with editor's event system
- `canEdit: false` and `canResize: false` prevent unwanted interactions

### Pattern 2: Interactive Elements Within Shapes
**What:** Add clickable elements inside shapes without triggering canvas pan.  
**When to use:** For milestone modal trigger, future social links on hub.  
**Example:**
```typescript
// Source: tldraw interactive-shape example
// For milestone modal trigger (alternative to onClick)

component(shape: MilestoneNodeShape) {
  return (
    <HTMLContainer
      style={{ pointerEvents: 'all' }}
      onPointerDown={(e) => {
        e.stopPropagation() // Prevent canvas pan
        this.editor.markEventAsHandled(e)
      }}
      onClick={() => {
        // Open modal (will be handled by parent Canvas component)
        window.dispatchEvent(
          new CustomEvent('openMilestoneModal', {
            detail: { nodeId: shape.props.nodeId }
          })
        )
      }}
    >
      {/* Shape content */}
    </HTMLContainer>
  )
}
```

**Note:** Prefer `ShapeUtil.onClick()` for simple navigation. Use `stopPropagation()` pattern only if you need fine-grained control over nested interactive elements.

### Pattern 3: Modal with React Portal
**What:** Render modal above tldraw canvas using React portal.  
**When to use:** For milestone details modal (Phase 3), potentially other overlays.  
**Example:**
```typescript
// Source: React official docs + tldraw z-index patterns
// src/components/MilestoneModal.tsx

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ContentNode } from '@/types/content'

interface MilestoneModalProps {
  node: ContentNode
  onClose: () => void
}

export function MilestoneModal({ node, onClose }: MilestoneModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)', // 500, above canvas
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn var(--motion-modal-enter)',
      }}
      onClick={onClose} // Backdrop dismiss
    >
      <div
        style={{
          width: '90%',
          maxWidth: '600px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-2xl)',
          padding: 'var(--spacing-8)',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--spacing-4)',
            right: 'var(--spacing-4)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-2xl)',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        
        {/* Content */}
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-4)',
        }}>
          {node.title}
        </h2>
        
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          marginBottom: 'var(--spacing-2)',
        }}>
          {new Date(node.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        
        {node.institution && (
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-4)',
          }}>
            {node.institution}
          </p>
        )}
        
        {node.description && (
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            {node.description}
          </p>
        )}
      </div>
    </div>,
    document.body // Render to body, outside canvas
  )
}
```

**Canvas integration:**
```typescript
// In Canvas.tsx
import { useState } from 'react'
import { MilestoneModal } from './MilestoneModal'

export function Canvas() {
  const [modalNode, setModalNode] = useState<ContentNode | null>(null)
  
  // Listen for milestone modal events
  useEffect(() => {
    const handleOpenModal = (e: CustomEvent) => {
      const node = timelineData.nodes.find(n => n.id === e.detail.nodeId)
      if (node) setModalNode(node)
    }
    window.addEventListener('openMilestoneModal', handleOpenModal)
    return () => window.removeEventListener('openMilestoneModal', handleOpenModal)
  }, [timelineData])
  
  return (
    <>
      <Tldraw shapeUtils={customShapeUtils} onMount={handleMount} />
      {modalNode && (
        <MilestoneModal 
          node={modalNode} 
          onClose={() => setModalNode(null)} 
        />
      )}
    </>
  )
}
```

### Pattern 4: Temporary Positioning Algorithm
**What:** Type-based vertical positioning for Phase 3 testing (replaced in Phase 4).  
**When to use:** Only in Phase 3, to place shapes visibly for interaction testing.  
**Example:**
```typescript
// Source: CONTEXT.md positioning algorithm
// src/lib/positionNodes.ts

import type { ContentNode } from '@/types/content'

export interface PositionedNode {
  node: ContentNode
  x: number
  y: number
}

export function positionTimelineNodes(nodes: ContentNode[]): PositionedNode[] {
  let aboveCounter = 0
  let belowCounter = 0
  
  return nodes.map((node, index) => {
    // Horizontal: Fixed spacing left from hub
    const x = -400 * (index + 1)
    
    // Vertical: Type-based separation
    let y: number
    if (node.type === 'youtube' || node.type === 'blog') {
      aboveCounter++
      y = 100 * aboveCounter // Positive Y (above timeline)
    } else if (node.type === 'milestone' || node.type === 'project') {
      belowCounter++
      y = -100 * belowCounter // Negative Y (below timeline)
    } else {
      // Unknown type defaults to below
      belowCounter++
      y = -100 * belowCounter
    }
    
    return { node, x, y }
  })
}

// Hub position is always x=0, y=0
export const HUB_POSITION = { x: 0, y: 0 }
```

**Usage in Canvas:**
```typescript
// Create shapes after data is loaded
const positionedNodes = positionTimelineNodes(timelineData.nodes)

positionedNodes.forEach(({ node, x, y }) => {
  editor.createShape({
    type: `${node.type}-node`, // 'youtube-node', 'blog-node', etc.
    x,
    y,
    isLocked: true, // Prevent dragging
    props: {
      w: 280,
      h: 200,
      nodeId: node.id,
      title: node.title,
      url: node.url,
      thumbnail: node.thumbnail,
      date: node.date,
      // Type-specific fields
      ...(node.institution && { institution: node.institution }),
      ...(node.tech && { tech: node.tech }),
      ...(node.description && { description: node.description }),
    },
  })
})

// Create hub
editor.createShape({
  type: 'hub',
  x: HUB_POSITION.x,
  y: HUB_POSITION.y,
  isLocked: true,
  props: {
    w: 640,
    h: 360,
    // aboutData fields
    name: aboutData.name,
    title: aboutData.title,
    bio: aboutData.bio,
    avatar: aboutData.avatar,
    social: aboutData.social,
  },
})
```

### Pattern 5: Hover States with Glassmorphism
**What:** Apply mauve glow and scale transform on hover.  
**When to use:** All interactive shapes (timeline nodes, hub).  
**Example:**
```typescript
// CSS-in-JS hover implementation
component(shape: NodeShape) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <HTMLContainer
      style={{
        pointerEvents: 'all',
        cursor: 'pointer',
        background: 'var(--surface-container-low)',
        border: `1px solid ${isHovered ? 'var(--interactive-hover)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(var(--glass-blur))',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all var(--motion-hover)',
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Shape content */}
    </HTMLContainer>
  )
}
```

**Alternative (CSS classes):**
```css
/* Add to index.css */
.timeline-node {
  pointer-events: all;
  cursor: pointer;
  background: var(--surface-container-low);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-md);
  transition: all var(--motion-hover);
}

.timeline-node:hover {
  border-color: var(--interactive-hover);
  box-shadow: var(--shadow-lg);
  transform: scale(1.02);
}
```

### Anti-Patterns to Avoid
- **Don't use DOM event handlers for navigation:** Use `ShapeUtil.onClick()` instead to integrate with editor's event system correctly.
- **Don't forget `pointerEvents: 'all'`:** Without it, shapes won't receive hover/click events (default is `none` in tldraw).
- **Don't create shapes in render:** Create shapes in `onMount` callback or `useEffect` to avoid infinite loops.
- **Don't use inline styles for all shapes:** Extract common styles to CSS variables or shared utility functions for maintainability.
- **Don't modify shape props directly:** Use `editor.updateShape()` with partial updates to trigger proper reactivity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shape geometry calculations | Manual bounding box math | `BaseBoxShapeUtil` | Provides `getGeometry()`, hit-testing, snap points automatically |
| Coordinate transforms | Manual canvas-to-screen transforms | `HTMLContainer` | Handles tldraw's coordinate system, z-index, and React lifecycle |
| Click event routing | Custom event delegation system | `ShapeUtil.onClick()` | Integrates with editor's pointer system, handles selection correctly |
| Modal overlay z-index | Absolute positioning with high z-index | React portal + CSS variables | Guarantees rendering above canvas, maintains z-index scale |
| Shape locking mechanism | Custom drag prevention logic | `isLocked: true` shape prop | Built-in tldraw feature, prevents all transforms (move, resize, rotate) |
| Thumbnail lazy loading | Manual intersection observer | Native `<img>` with `loading="lazy"` + `onLoad` | Browser-optimized, handles viewport visibility automatically |
| About data validation | Manual field checking | Zod schema (existing pattern) | Already used in Phase 2, type-safe, composable validators |

**Key insight:** tldraw's shape system is battle-tested for custom rendering and interactions. Leveraging `BaseBoxShapeUtil`, `HTMLContainer`, and built-in shape properties avoids reimplementing complex canvas coordination, event handling, and transform math.

## Common Pitfalls

### Pitfall 1: Shapes Don't Respond to Clicks
**What goes wrong:** Shape doesn't receive click events despite having `onClick()` handler.  
**Why it happens:** Default `pointerEvents: 'none'` on HTMLContainer prevents events from reaching the shape.  
**How to avoid:** Always set `pointerEvents: 'all'` on HTMLContainer in component() method.  
**Warning signs:** Cursor doesn't change to pointer on hover, no click feedback, console shows no event logs.

**Fix:**
```typescript
component(shape: NodeShape) {
  return (
    <HTMLContainer
      style={{ pointerEvents: 'all' }} // ← REQUIRED
    >
      {/* content */}
    </HTMLContainer>
  )
}
```

### Pitfall 2: Canvas Pans When Clicking Interactive Elements
**What goes wrong:** Clicking a button or link inside a shape triggers canvas pan/drag instead of the intended action.  
**Why it happens:** Events bubble up to canvas container which handles all pointer events for panning.  
**How to avoid:** Use `ShapeUtil.onClick()` for shape-level actions OR `stopPropagation()` + `markEventAsHandled()` for nested interactivity.  
**Warning signs:** Click triggers both shape action AND canvas starts dragging, selection changes unexpectedly.

**Solution 1 (Preferred):**
```typescript
// Shape-level click
override onClick(shape: NodeShape) {
  window.open(shape.props.url, '_blank')
}
```

**Solution 2 (Nested interactivity):**
```typescript
<HTMLContainer
  onPointerDown={(e) => {
    e.stopPropagation()
    this.editor.markEventAsHandled(e)
  }}
  onClick={handleAction}
>
  {/* interactive content */}
</HTMLContainer>
```

### Pitfall 3: Shapes Are Draggable When They Shouldn't Be
**What goes wrong:** Users can drag timeline nodes and hub around the canvas, breaking the layout.  
**Why it happens:** tldraw shapes are movable by default. Forgot to set `isLocked: true` when creating shapes.  
**How to avoid:** Always set `isLocked: true` in `editor.createShape()` call for static shapes.  
**Warning signs:** Shapes move when clicked and dragged, positions don't match positioning algorithm, nodes overlap.

**Fix:**
```typescript
editor.createShape({
  type: 'youtube-node',
  x: -400,
  y: 100,
  isLocked: true, // ← Prevents all transforms
  props: { /* ... */ },
})
```

### Pitfall 4: Modal Doesn't Appear Above Canvas
**What goes wrong:** Modal renders but is hidden behind tldraw canvas or controls.  
**Why it happens:** tldraw canvas has high z-index. Modal needs to render to document.body with higher z-index.  
**How to avoid:** Use React portal (`createPortal(element, document.body)`) and set `zIndex: 'var(--z-modal)'` (500).  
**Warning signs:** Modal HTML exists in DOM inspector but isn't visible, appears briefly then disappears, click events don't reach modal.

**Fix:**
```typescript
return createPortal(
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    zIndex: 'var(--z-modal)' // ← Must be > canvas z-index
  }}>
    {/* modal content */}
  </div>,
  document.body // ← Render outside React root
)
```

### Pitfall 5: Infinite Re-renders When Creating Shapes
**What goes wrong:** Browser freezes, React dev tools show thousands of renders, shapes created repeatedly.  
**Why it happens:** Called `editor.createShape()` in render function or in `useEffect` without proper dependencies.  
**How to avoid:** Create shapes only in `onMount` callback (runs once) OR in `useEffect` with stable dependencies.  
**Warning signs:** CPU spikes to 100%, console floods with warnings, page becomes unresponsive.

**Wrong:**
```typescript
function Canvas() {
  const [editor, setEditor] = useState<Editor>()
  
  // ❌ Runs every render!
  if (editor) {
    editor.createShape({ type: 'my-shape', x: 0, y: 0 })
  }
}
```

**Correct:**
```typescript
function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null)
  
  // ✅ Runs once when editor + data available
  useEffect(() => {
    if (!editor || !timelineData) return
    
    // Create shapes once
    createAllShapes(editor, timelineData)
  }, [editor, timelineData]) // Stable dependencies
}
```

**Or use onMount:**
```typescript
<Tldraw
  onMount={(editor) => {
    setEditor(editor)
    // ✅ Runs once on mount
    createAllShapes(editor, timelineData)
  }}
/>
```

### Pitfall 6: Thumbnail Images Flash or Don't Load
**What goes wrong:** Images show broken icon, or flash placeholder → image → placeholder rapidly.  
**Why it happens:** No loading state management, or image URLs are invalid/CORS-blocked.  
**How to avoid:** Add `onLoad` and `onError` handlers, show skeleton during load, validate URLs in content.  
**Warning signs:** Console shows 404 errors, images appear then disappear, layout shifts on image load.

**Fix:**
```typescript
const [imageLoaded, setImageLoaded] = useState(false)
const [imageError, setImageError] = useState(false)

return (
  <>
    {!imageLoaded && !imageError && <SkeletonPlaceholder />}
    {imageError && <FallbackIcon />}
    <img
      src={thumbnail}
      alt={title}
      style={{ display: imageLoaded ? 'block' : 'none' }}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
    />
  </>
)
```

## Code Examples

Verified patterns from official tldraw examples and type definitions:

### Creating and Registering Custom Shapes
```typescript
// Source: tldraw custom-shape example + BaseBoxShapeUtil types
// src/components/shapes/index.ts

import { YouTubeNodeUtil } from './YouTubeNodeShape'
import { BlogNodeUtil } from './BlogNodeShape'
import { ProjectNodeUtil } from './ProjectNodeShape'
import { MilestoneNodeUtil } from './MilestoneNodeShape'
import { HubUtil } from './HubShape'

// Export shape utils array (stable reference)
export const customShapeUtils = [
  YouTubeNodeUtil,
  BlogNodeUtil,
  ProjectNodeUtil,
  MilestoneNodeUtil,
  HubUtil,
] as const

// Usage in Canvas.tsx:
// <Tldraw shapeUtils={customShapeUtils} onMount={handleMount} />
```

### Processing About.md → about.json
```typescript
// Source: Phase 2 generator pattern extended for about.md
// scripts/generate-timeline.ts (extend existing)

import { z } from 'zod'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'

// About data schema
const AboutSchema = z.object({
  name: z.string(),
  title: z.string(),
  bio: z.string(),
  avatar: z.string().optional(),
  email: z.string().email().optional(),
  social: z.object({
    github: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
})

export type AboutData = z.infer<typeof AboutSchema>

export async function processAboutFile(): Promise<AboutData> {
  const aboutPath = path.join(process.cwd(), 'content/about.md')
  
  try {
    const fileContent = await fs.readFile(aboutPath, 'utf-8')
    const { data } = matter(fileContent)
    
    // Validate with Zod
    const aboutData = AboutSchema.parse(data)
    return aboutData
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('About.md validation failed:', error.errors)
      throw new Error(`Invalid about.md: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// In main generator function:
async function generateData() {
  const timelineData = await processContentFiles() // existing
  const aboutData = await processAboutFile() // new
  
  // Write both files
  await fs.writeFile(
    'public/timeline.json',
    JSON.stringify(timelineData, null, 2)
  )
  await fs.writeFile(
    'public/about.json',
    JSON.stringify(aboutData, null, 2)
  )
}
```

### Loading Data and Creating Shapes
```typescript
// Source: tldraw Editor API + React patterns
// src/components/Canvas.tsx

import { useState, useEffect, useCallback } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { customShapeUtils } from './shapes'
import { positionTimelineNodes, HUB_POSITION } from '@/lib/positionNodes'
import type { TimelineData, AboutData } from '@/types'

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [aboutData, setAboutData] = useState<AboutData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch data on mount
  useEffect(() => {
    Promise.all([
      fetch('/timeline.json').then(r => r.json()),
      fetch('/about.json').then(r => r.json()),
    ])
      .then(([timeline, about]) => {
        setTimelineData(timeline)
        setAboutData(about)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setIsLoading(false)
      })
  }, [])
  
  // Create shapes when editor + data ready
  useEffect(() => {
    if (!editor || !timelineData || !aboutData) return
    
    // Position timeline nodes
    const positioned = positionTimelineNodes(timelineData.nodes)
    
    // Create timeline node shapes
    positioned.forEach(({ node, x, y }) => {
      editor.createShape({
        type: `${node.type}-node`,
        x,
        y,
        isLocked: true, // Prevent dragging
        props: {
          w: 280,
          h: 200,
          nodeId: node.id,
          title: node.title,
          url: node.url || '',
          thumbnail: node.thumbnail,
          date: node.date,
          description: node.description,
          institution: node.institution,
          tech: node.tech,
        },
      })
    })
    
    // Create hub shape
    editor.createShape({
      type: 'hub',
      x: HUB_POSITION.x,
      y: HUB_POSITION.y,
      isLocked: true,
      props: {
        w: 640,
        h: 360,
        name: aboutData.name,
        title: aboutData.title,
        bio: aboutData.bio,
        avatar: aboutData.avatar,
        email: aboutData.email,
        social: aboutData.social,
      },
    })
    
    // Optional: Zoom to fit all shapes
    // editor.zoomToFit({ animation: { duration: 0 } })
  }, [editor, timelineData, aboutData])
  
  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)
  }, [])
  
  if (isLoading) {
    return <CanvasLoader />
  }
  
  return (
    <div className="fixed inset-0">
      <Tldraw
        hideUi
        shapeUtils={customShapeUtils}
        onMount={handleMount}
      />
    </div>
  )
}
```

### Hub Shape Implementation
```typescript
// Source: BaseBoxShapeUtil + design tokens
// src/components/shapes/HubShape.tsx

import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLShape } from 'tldraw'
import type { AboutData } from '@/types/about'

const HUB_TYPE = 'hub'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [HUB_TYPE]: {
      w: number
      h: number
      name: string
      title: string
      bio: string
      avatar?: string
      email?: string
      social?: AboutData['social']
    }
  }
}

type HubShape = TLShape<typeof HUB_TYPE>

export class HubUtil extends BaseBoxShapeUtil<HubShape> {
  static override type = HUB_TYPE
  
  static override props: RecordProps<HubShape> = {
    w: T.number,
    h: T.number,
    name: T.string,
    title: T.string,
    bio: T.string,
    avatar: T.string.optional(),
    email: T.string.optional(),
    social: T.object.optional(),
  }
  
  getDefaultProps(): HubShape['props'] {
    return {
      w: 640,
      h: 360,
      name: '',
      title: '',
      bio: '',
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return false
  }
  
  component(shape: HubShape) {
    const { name, title, bio, avatar, social } = shape.props
    
    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: '2px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--spacing-8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-4)',
        }}
      >
        {avatar && (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px solid var(--border-subtle)',
              objectFit: 'cover',
            }}
          />
        )}
        
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-4xl)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          margin: 0,
          textAlign: 'center',
        }}>
          {name}
        </h1>
        
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xl)',
          color: 'var(--interactive-default)',
          margin: 0,
          textAlign: 'center',
        }}>
          {title}
        </p>
        
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
          textAlign: 'center',
          maxWidth: '500px',
          margin: 0,
        }}>
          {bio}
        </p>
        
        {social && (
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-3)',
            marginTop: 'var(--spacing-2)',
          }}>
            {Object.entries(social).map(([platform, handle]) => (
              handle && (
                <span
                  key={platform}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {platform}: {handle}
                </span>
              )
            ))}
          </div>
        )}
      </HTMLContainer>
    )
  }
  
  indicator(shape: HubShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG-only shape rendering | HTMLContainer with React components | tldraw 2.0+ (2023) | Enables rich interactive shapes with full React ecosystem |
| Global event handlers for clicks | ShapeUtil.onClick() method | tldraw 2.0+ | Better integration with editor's event system, fewer bugs |
| Separate modal libraries (react-modal) | React portals (built-in) | React 16+ (2017) | Zero dependencies, native React API, better z-index control |
| Manual z-index management | CSS custom properties (variables) | CSS3 standard | Centralized z-index scale, easier to maintain |
| BaseShapeUtil (generic) | BaseBoxShapeUtil (specialized) | tldraw 2.0+ | Automatic geometry calculations for rectangular shapes |

**Deprecated/outdated:**
- **tldraw v1 shape API:** Used decorators and class-based approach. v2+ uses functional validators (T.number, T.string) and cleaner inheritance.
- **Direct DOM manipulation in shapes:** tldraw v2+ encourages React components via HTMLContainer instead of manually creating DOM elements.
- **Legacy `readOnly` prop:** Replaced by `canEdit()`, `canResize()`, `isLocked` for finer-grained control.

## Open Questions

1. **Thumbnail CDN/Optimization**
   - What we know: YouTube thumbnails available via URL pattern, project thumbnails user-provided
   - What's unclear: Should we add image optimization (WebP conversion, responsive sizes) in Phase 3 or defer to Phase 5?
   - Recommendation: Use original images in Phase 3 (YAGNI), add optimization in Phase 5 if performance testing shows need

2. **Shape Component Testing Strategy**
   - What we know: Vitest configured in Phase 1, standard React component testing with @testing-library/react
   - What's unclear: Should we test shape rendering in isolation or only integration tests with full Canvas?
   - Recommendation: Start with integration tests (Canvas + shapes + data), add unit tests for positioning algorithm

3. **Error Handling for Failed Data Fetch**
   - What we know: Canvas shows loading state while fetching timeline.json and about.json
   - What's unclear: Should errors show error screen, fallback content, or retry mechanism?
   - Recommendation: Phase 3 shows error message + retry button. Phase 5 adds better error UI if needed.

## Validation Architecture

> Nyquist validation is enabled per `.planning/config.json`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.0.0 |
| Config file | `vite.config.ts` (configured in Phase 1) |
| Quick run command | `npm test -- --run src/lib/positionNodes.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUB-01 | Hub renders at x=0,y=0 with 640x360 size | integration | `npm test -- --run src/components/Canvas.test.tsx` | ❌ Wave 0 |
| HUB-02 | Hub displays about.json content (name, title, bio) | integration | `npm test -- --run src/components/shapes/HubShape.test.tsx` | ❌ Wave 0 |
| HUB-03 | Hub size != timeline node size (640x360 vs 280x200) | unit | `npm test -- --run src/lib/constants.test.ts` | ❌ Wave 0 |
| INT-01 | YouTube shape onClick opens URL in new tab | integration | `npm test -- --run src/components/shapes/YouTubeNodeShape.test.tsx` | ❌ Wave 0 |
| INT-02 | Blog shape onClick opens URL in new tab | integration | `npm test -- --run src/components/shapes/BlogNodeShape.test.tsx` | ❌ Wave 0 |
| INT-03 | Project shape onClick opens URL in new tab | integration | `npm test -- --run src/components/shapes/ProjectNodeShape.test.tsx` | ❌ Wave 0 |
| INT-04 | Milestone shape triggers modal with node details | integration | `npm test -- --run src/components/MilestoneModal.test.tsx` | ❌ Wave 0 |
| INT-05 | Hover changes border to mauve + scale 1.02x | unit | `npm test -- --run src/components/shapes/hover.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run {file}.test.ts -x` (fail fast for relevant tests)
- **Per wave merge:** `npm test -- --run src/components/shapes/` (all shape tests)
- **Phase gate:** `npm test` (full suite green before `/gsd-verify-work`)

### Wave 0 Gaps
- [ ] `src/lib/positionNodes.test.ts` — covers temporary positioning algorithm (type-based vertical, -400px horizontal)
- [ ] `src/components/shapes/*.test.tsx` — covers each shape util's component rendering + onClick
- [ ] `src/components/MilestoneModal.test.tsx` — covers modal open/close, ESC key, backdrop click
- [ ] `src/components/Canvas.test.tsx` — covers data fetch, shape creation, integration
- [ ] Mock utilities in `tests/mocks/tldraw.ts` — stub Editor.createShape, Editor.updateShape for testing

## Sources

### Primary (HIGH confidence)
- tldraw@4.5.3 type definitions (`node_modules/tldraw/dist-esm/index.d.mts`, `node_modules/@tldraw/editor/dist-esm/index.d.mts`)
  - BaseBoxShapeUtil API, ShapeUtil methods, HTMLContainer, onClick handler pattern
  - Verified: 2026-03-23 from installed package
- tldraw official examples (GitHub: tldraw/tldraw/apps/examples)
  - `custom-shape/CustomShapeExample.tsx` — shape creation pattern
  - `shape-with-onClick/ClickableShapeUtil.tsx` — onClick implementation
  - `interactive-shape/my-interactive-shape-util.tsx` — pointerEvents + stopPropagation
  - `popup-shape/PopupShapeUtil.tsx` — 3D transforms, viewport calculations
  - Fetched: 2026-03-23 from main branch
- React official docs (react.dev) — createPortal API
  - Portal rendering outside parent component
  - Modal implementation patterns
- Project files (verified in repository)
  - `.stich/TOKENS.md` — glassmorphism variables, design tokens
  - `src/index.css` — CSS custom properties, z-index scale
  - `src/types/content.ts` — ContentNode, TimelineData interfaces
  - `package.json` — tldraw 4.5.3, react 19.2.4, gray-matter 4.0.3

### Secondary (MEDIUM confidence)
- Phase 1 & 2 implementation patterns
  - Canvas component structure from Canvas.tsx
  - Content processing from scripts/generate-timeline.ts
  - Design system usage from CanvasControls.tsx
- CONTEXT.md user decisions
  - Node sizes (280x200, 640x360)
  - Type-based positioning algorithm
  - Visual metaphors for content types

### Tertiary (LOW confidence)
- None — all findings verified against source code or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed, versions verified via `npm list`
- Architecture: HIGH - tldraw examples provide complete patterns, BaseBoxShapeUtil API fully documented
- Pitfalls: HIGH - Derived from tldraw examples, type definitions, and common React patterns
- Code examples: HIGH - All examples adapted from official tldraw GitHub examples + project context
- Positioning algorithm: HIGH - Exact specification from CONTEXT.md with clear test cases
- Modal implementation: HIGH - React portals well-documented, z-index variables defined in index.css

**Research date:** 2026-03-23  
**Valid until:** 2026-04-23 (30 days - tldraw API stable, React patterns evergreen)

**tldraw version stability:** 4.5.3 is latest stable as of 2026-03-23. Next major version (5.x) not announced. Current API patterns safe for Phase 3-6 implementation.
