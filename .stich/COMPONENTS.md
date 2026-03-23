# Component Specifications: illulachy.me

**Last Updated:** 2026-03-22  
**Design System:** High-End Editorial + Exaggerated Minimalism  
**Stack:** React 19 + TypeScript + tldraw 4.5 + shadcn/ui + Motion.dev

---

## Design Principles

1. **Tonal Layering over Borders** - Use background shifts instead of 1px lines
2. **Generous Whitespace** - Let content breathe (8.5rem between sections)
3. **Typography-First** - Text hierarchy defines visual hierarchy
4. **Ambient Shadows** - Invisible but felt (4-8% opacity, 40-60px blur)
5. **Transform-Based Motion** - GPU-accelerated animations only

---

## Component Catalog

### 1. Timeline Node Card

**Purpose:** Primary content container for timeline entries (blog posts, projects, videos)

#### Variants
- `default` - Standard blog/project card (280×200px)
- `youtube` - Video thumbnail card (320×180px, 16:9)
- `milestone` - Education/work card (280×200px)

#### Visual Specifications

```typescript
// Default State
{
  width: '280px',
  height: '200px',
  background: 'var(--surface-container-low)', // #1C1C1C
  border: '1px solid transparent',
  borderRadius: 'var(--radius-lg)', // 8px
  padding: 'var(--space-card-padding)', // 24px
  boxShadow: 'var(--shadow-md)', // 0 4px 16px rgba(0,0,0,0.08)
  transition: 'background 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out'
}

// Hover State
{
  background: 'var(--surface-container-high)', // #272727 (lighten 5%)
  borderColor: 'var(--border-strong)', // rgba(255,255,255,0.2)
  transform: 'translateY(-2px)', // Subtle lift
  boxShadow: 'var(--shadow-lg)', // 0 8px 24px rgba(0,0,0,0.12)
  cursor: 'pointer'
}

// Focus State (Keyboard Navigation)
{
  outline: '2px solid var(--interactive-default)', // #2563EB
  outlineOffset: '4px'
}

// Active State (Clicking)
{
  transform: 'translateY(0px)', // Return to baseline
  boxShadow: 'var(--shadow-sm)' // Reduce shadow
}
```

#### Typography Hierarchy
```typescript
// Card Title
{
  fontFamily: 'var(--font-heading)', // Noto Serif
  fontSize: 'var(--text-lg)', // 18px
  fontWeight: 'var(--font-weight-semibold)', // 600
  lineHeight: 'var(--leading-snug)', // 1.375
  letterSpacing: 'var(--tracking-tight)', // -0.025em
  color: 'var(--text-primary)', // #FFFFFF
  marginBottom: 'var(--spacing-2)' // 8px
}

// Card Metadata (Date, Type)
{
  fontFamily: 'var(--font-body)', // Space Grotesk
  fontSize: 'var(--text-sm)', // 14px
  fontWeight: 'var(--font-weight-regular)', // 400
  color: 'var(--text-tertiary)', // #71717A
  marginBottom: 'var(--spacing-3)' // 12px
}

// Card Description (Optional)
{
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)', // 16px
  lineHeight: 'var(--leading-normal)', // 1.5
  color: 'var(--text-secondary)', // #A1A1AA
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}
```

#### Accessibility Requirements
```typescript
<div
  role="button"
  tabIndex={0}
  aria-label="Blog post: Building with tldraw - Published January 2026"
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

#### React Component Structure
```tsx
interface TimelineNodeProps {
  id: string;
  type: 'blog' | 'youtube' | 'project' | 'milestone';
  title: string;
  date: string;
  description?: string;
  thumbnail?: string;
  url: string;
  onClick: (id: string) => void;
}

const TimelineNode = memo<TimelineNodeProps>(({ 
  id, type, title, date, description, thumbnail, url, onClick 
}) => {
  return (
    <motion.div
      className="timeline-node"
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      role="button"
      tabIndex={0}
      aria-label={`${type}: ${title} - Published ${date}`}
      onClick={() => onClick(id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(id)}
    >
      {thumbnail && (
        <div className="node-thumbnail">
          <img src={thumbnail} alt={title} loading="lazy" />
        </div>
      )}
      <div className="node-content">
        <span className="node-meta">{date}</span>
        <h3 className="node-title">{title}</h3>
        {description && <p className="node-description">{description}</p>}
      </div>
    </motion.div>
  );
}, (prev, next) => prev.id === next.id && prev.title === next.title);
```

#### CSS Implementation
```css
.timeline-node {
  width: 280px;
  height: 200px;
  background: var(--surface-container-low);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: var(--space-card-padding);
  box-shadow: var(--shadow-md);
  transition: background var(--motion-hover),
              border-color var(--motion-hover),
              transform var(--motion-hover);
  cursor: pointer;
  overflow: hidden;
}

.timeline-node:hover {
  background: var(--surface-container-high);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-lg);
}

.timeline-node:focus {
  outline: 2px solid var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}

.timeline-node.youtube {
  width: 320px;
  height: 180px;
}

.node-thumbnail {
  width: 100%;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-3);
}

.node-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.node-meta {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.node-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin: var(--spacing-2) 0;
}

.node-description {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

### 2. Portfolio Hub (Central Node)

**Purpose:** Central "about me" node that serves as the timeline origin point

#### Visual Specifications
```typescript
{
  width: '640px', // 2x scale of default node
  height: '360px', // 16:9 aspect ratio
  background: 'var(--surface-container)', // Elevated
  border: '2px solid var(--border-default)',
  borderRadius: 'var(--radius-2xl)', // 16px (larger radius)
  padding: 'var(--spacing-12)', // 48px (generous padding)
  boxShadow: 'var(--shadow-xl)', // Dramatic depth
  position: 'relative',
  zIndex: 'var(--z-timeline)'
}
```

#### Content Layout
```tsx
<div className="portfolio-hub">
  <div className="hub-header">
    <h1 className="hub-title">Thuy Hoang</h1>
    <p className="hub-subtitle">Designer & Developer</p>
  </div>
  
  <div className="hub-body">
    <p className="hub-bio">
      Building interactive experiences at the intersection of design and code.
    </p>
  </div>
  
  <div className="hub-actions">
    <a href="/contact" className="hub-cta">Get in Touch</a>
  </div>
</div>
```

#### Typography
```css
.hub-title {
  font-family: var(--font-display);
  font-size: var(--display-sm); /* clamp(2rem, 5vw, 3rem) */
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  color: var(--text-primary);
}

.hub-subtitle {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-top: var(--spacing-2);
}

.hub-bio {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  margin-top: var(--spacing-8);
}
```

---

### 3. Canvas Controls Toolbar

**Purpose:** Floating controls for pan/zoom/reset/game mode

#### Visual Specifications (Glassmorphism)
```typescript
{
  position: 'fixed',
  top: 'var(--toolbar-offset)', // 16px
  right: 'var(--toolbar-offset)',
  background: 'var(--glass-bg)', // rgba(28, 28, 28, 0.7)
  backdropFilter: 'blur(var(--glass-blur))', // 20px
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-xl)', // 12px
  padding: 'var(--spacing-3)', // 12px
  boxShadow: 'var(--glass-shadow)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--control-gap)', // 8px
  zIndex: 'var(--z-fixed)'
}
```

#### Button Specifications
```typescript
// Control Button
{
  width: 'var(--control-size-lg)', // 48px (touch-friendly)
  height: 'var(--control-size-lg)',
  background: 'transparent',
  border: '1px solid var(--border-ghost)',
  borderRadius: 'var(--radius-default)', // 4px
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'background var(--motion-hover), color var(--motion-hover)'
}

// Hover State
{
  background: 'var(--surface-container-high)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-subtle)'
}

// Active State (Game Mode On)
{
  background: 'var(--interactive-default)',
  color: '#FFFFFF',
  borderColor: 'var(--interactive-default)'
}
```

#### React Component
```tsx
const CanvasControls: React.FC = () => {
  const [isGameMode, setIsGameMode] = useState(false);
  
  return (
    <div className="canvas-controls">
      <button
        className="control-btn"
        aria-label="Zoom in"
        onClick={handleZoomIn}
      >
        <PlusIcon />
      </button>
      
      <button
        className="control-btn"
        aria-label="Zoom out"
        onClick={handleZoomOut}
      >
        <MinusIcon />
      </button>
      
      <div className="control-divider" />
      
      <button
        className="control-btn"
        aria-label="Reset view to center"
        onClick={handleResetView}
      >
        <HomeIcon />
      </button>
      
      <button
        className={`control-btn ${isGameMode ? 'active' : ''}`}
        aria-label="Toggle game mode"
        onClick={() => setIsGameMode(!isGameMode)}
      >
        <RocketIcon />
      </button>
    </div>
  );
};
```

#### CSS Implementation
```css
.canvas-controls {
  position: fixed;
  top: var(--toolbar-offset);
  right: var(--toolbar-offset);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur)); /* Safari */
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3);
  box-shadow: var(--glass-shadow);
  display: flex;
  flex-direction: column;
  gap: var(--control-gap);
  z-index: var(--z-fixed);
}

.control-btn {
  width: var(--control-size-lg);
  height: var(--control-size-lg);
  background: transparent;
  border: 1px solid var(--border-ghost);
  border-radius: var(--radius-default);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--motion-hover), 
              color var(--motion-hover),
              border-color var(--motion-hover);
}

.control-btn:hover {
  background: var(--surface-container-high);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.control-btn:focus {
  outline: 2px solid var(--outline-focus);
  outline-offset: 2px;
}

.control-btn.active {
  background: var(--interactive-default);
  color: #FFFFFF;
  border-color: var(--interactive-default);
}

.control-divider {
  height: 1px;
  background: var(--border-ghost);
  margin: var(--spacing-1) 0;
}
```

---

### 4. Button Components

**Purpose:** Primary, secondary, and tertiary action buttons

#### Primary Button (CTA)
```typescript
{
  background: 'var(--interactive-default)', // #2563EB
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-default)', // 4px
  padding: 'var(--spacing-3) var(--spacing-6)', // 12px 24px
  fontFamily: 'var(--font-label)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-medium)',
  cursor: 'pointer',
  transition: 'background var(--motion-hover), transform var(--motion-hover)'
}

// Hover
{
  background: 'var(--interactive-hover)', // #3B82F6
  transform: 'translateY(-1px)'
}

// Active
{
  background: 'var(--interactive-active)', // #1D4ED8
  transform: 'translateY(0px)'
}
```

#### Secondary Button (Outlined)
```typescript
{
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)', // Ghost border @ 15% opacity
  borderRadius: 'var(--radius-default)',
  padding: 'var(--spacing-3) var(--spacing-6)',
  fontFamily: 'var(--font-label)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-medium)',
  cursor: 'pointer',
  transition: 'border-color var(--motion-hover), background var(--motion-hover)'
}

// Hover
{
  borderColor: 'var(--border-strong)',
  background: 'var(--interactive-bg-subtle)' // 10% opacity
}
```

#### Tertiary Button (Text Only)
```typescript
{
  background: 'transparent',
  color: 'var(--text-primary)',
  border: 'none',
  padding: 'var(--spacing-2) var(--spacing-4)',
  fontFamily: 'var(--font-label)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-medium)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color var(--motion-hover), text-decoration var(--motion-hover)'
}

// Hover
{
  color: 'var(--interactive-hover)',
  textDecoration: 'underline',
  textUnderlineOffset: '4px'
}
```

#### React Component
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <motion.button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: variant === 'primary' ? -1 : 0 }}
      whileTap={{ y: 0 }}
    >
      {children}
    </motion.button>
  );
};
```

---

### 5. Input Field

**Purpose:** Text input for search (v2) or other forms

#### Visual Specifications
```typescript
{
  background: 'var(--surface-container-lowest)', // #1A1A1A
  color: 'var(--text-primary)',
  border: 'none',
  borderBottom: '1px solid var(--border-ghost)', // Bottom-only ghost border
  borderRadius: '0',
  padding: 'var(--spacing-3) var(--spacing-4)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  transition: 'border-color var(--motion-focus)'
}

// Focus State
{
  borderBottomColor: 'var(--interactive-default)', // #2563EB (100% opacity)
  outline: 'none'
}

// Placeholder
{
  color: 'var(--text-tertiary)',
  opacity: 0.6
}
```

#### CSS Implementation
```css
.input-field {
  width: 100%;
  background: var(--surface-container-lowest);
  color: var(--text-primary);
  border: none;
  border-bottom: 1px solid var(--border-ghost);
  border-radius: 0;
  padding: var(--spacing-3) var(--spacing-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  transition: border-color var(--motion-focus);
}

.input-field:focus {
  border-bottom-color: var(--interactive-default);
  outline: none;
}

.input-field::placeholder {
  color: var(--text-tertiary);
  opacity: 0.6;
}
```

---

### 6. Loading State (Skeleton)

**Purpose:** Show feedback while timeline content loads

#### Visual Specifications
```typescript
{
  width: '280px',
  height: '200px',
  background: 'linear-gradient(90deg, var(--surface-container-low) 0%, var(--surface-container) 50%, var(--surface-container-low) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: 'var(--radius-lg)'
}
```

#### CSS Animation
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-node {
  width: 280px;
  height: 200px;
  background: linear-gradient(
    90deg,
    var(--surface-container-low) 0%,
    var(--surface-container) 50%,
    var(--surface-container-low) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-lg);
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-node {
    animation: none;
    background: var(--surface-container-low);
  }
}
```

#### React Component
```tsx
const SkeletonNode: React.FC = () => {
  return (
    <div className="skeleton-node" aria-label="Loading timeline content">
      {/* Empty - pure visual */}
    </div>
  );
};
```

---

### 7. Game Mode Cursor

**Purpose:** Spaceship cursor for game mode navigation

#### SVG Icon
```svg
<!-- spaceship.svg -->
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L20 12H24L16 28L8 12H12L16 4Z" 
        fill="#FFFFFF" 
        stroke="#2563EB" 
        stroke-width="2" 
        stroke-linejoin="round"/>
  <circle cx="16" cy="14" r="2" fill="#2563EB"/>
</svg>
```

#### CSS Cursor Implementation
```css
.game-mode-active {
  cursor: url('/cursors/spaceship.svg') 16 16, auto;
}

/* Fallback for browsers without SVG cursor support */
.game-mode-active.fallback {
  cursor: crosshair;
}
```

#### React Implementation
```tsx
const GameMode: React.FC<{ active: boolean }> = ({ active }) => {
  useEffect(() => {
    if (active) {
      document.body.classList.add('game-mode-active');
    } else {
      document.body.classList.remove('game-mode-active');
    }
    
    return () => {
      document.body.classList.remove('game-mode-active');
    };
  }, [active]);
  
  return null; // Pure side effect component
};
```

---

### 8. Focus Quote (Signature Component)

**Purpose:** Large, centered editorial quote for emphasis

#### Visual Specifications
```typescript
{
  fontFamily: 'var(--font-display)', // Noto Serif
  fontSize: 'var(--display-md)', // clamp(3rem, 7vw, 5rem)
  fontWeight: 'var(--font-weight-semibold)',
  lineHeight: 'var(--leading-tight)',
  letterSpacing: 'var(--tracking-tighter)',
  color: 'var(--text-primary)',
  textAlign: 'center',
  maxWidth: '800px',
  margin: '0 auto',
  padding: 'var(--spacing-24) var(--spacing-8)' // 96px top/bottom, 32px sides
}
```

#### Usage
```tsx
<blockquote className="focus-quote">
  "The canvas must feel smooth and intuitive to explore."
</blockquote>
```

#### CSS Implementation
```css
.focus-quote {
  font-family: var(--font-display);
  font-size: var(--display-md);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  color: var(--text-primary);
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-24) var(--spacing-8);
  position: relative;
}

.focus-quote::before {
  content: '"';
  position: absolute;
  top: var(--spacing-16);
  left: var(--spacing-4);
  font-size: var(--display-lg);
  color: var(--accent-mauve);
  opacity: 0.3;
}
```

---

## Responsive Behavior

### Mobile (< 768px)
- Timeline nodes: 240px width
- Portfolio hub: 100% width with max-width 500px
- Canvas controls: Position at bottom center
- Touch targets: Minimum 44px (48px preferred)
- Font sizes: Reduce display scale by 20%

### Tablet (768px - 1024px)
- Timeline nodes: 280px width (default)
- Portfolio hub: 560px width
- Canvas controls: Top right position

### Desktop (> 1024px)
- Timeline nodes: 280-320px width
- Portfolio hub: 640px width (full scale)
- Canvas controls: Top right with hover tooltips

---

## Accessibility Checklist

- [ ] All interactive elements have `cursor: pointer`
- [ ] Minimum 44px touch targets on mobile
- [ ] Focus states visible (2px outline + 4px offset)
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] ARIA labels on all timeline nodes
- [ ] Keyboard navigation (Tab, Enter, Arrow keys)
- [ ] `prefers-reduced-motion` respected
- [ ] Skip to content link for screen readers
- [ ] Alt text on all images
- [ ] Semantic HTML (button, nav, main, article)

---

## Performance Checklist

- [ ] Timeline nodes memoized (React.memo)
- [ ] Images lazy loaded (`loading="lazy"`)
- [ ] Transform-based animations (not layout properties)
- [ ] Virtualized rendering (only visible nodes)
- [ ] Debounced pan/zoom handlers
- [ ] CSS containment (`contain: layout style paint`)
- [ ] will-change on animated elements (sparingly)
- [ ] WebP images with PNG fallback

---

## Component Status

| Component | Specification | Implementation | Testing |
|-----------|--------------|----------------|---------|
| Timeline Node | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Portfolio Hub | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Canvas Controls | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Buttons | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Input Field | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Loading State | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Game Mode Cursor | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Focus Quote | ✅ Complete | ⏳ Pending | ⏳ Pending |

---

## Next Steps

1. **Implement in React** - Build components using shadcn/ui as base
2. **Add Motion.dev animations** - Enhance with spring physics
3. **Test with real content** - 20+ timeline nodes
4. **Accessibility audit** - Test with keyboard + screen reader
5. **Performance profiling** - React DevTools + Lighthouse

---

**Component Count:** 8 core components defined  
**Last Updated:** 2026-03-22  
**Next Review:** After Phase 3 implementation (Timeline Nodes)
