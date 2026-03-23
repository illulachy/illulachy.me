# Motion Design: illulachy.me

**Last Updated:** 2026-03-22  
**Design System:** High-End Editorial + Exaggerated Minimalism  
**Animation Library:** Motion.dev (Framer Motion successor)

---

## Motion Philosophy

> **"Motion should feel like gravity, not machinery."**

### Core Principles

1. **Physics-Based** - Use spring physics over linear timing for natural feel
2. **Purposeful** - Every animation must serve a functional purpose (feedback, hierarchy, continuity)
3. **Subtle** - Good motion is felt, not seen (unless it's a signature moment)
4. **Respectful** - Honor `prefers-reduced-motion` for accessibility
5. **Performant** - GPU-accelerated transforms only (translate, scale, rotate, opacity)

### Motion Hierarchy

```
Micro-interactions (100-150ms)
  ↓ Hover states, button presses, focus rings
  
Standard transitions (200-300ms)
  ↓ Card animations, dropdowns, tooltips
  
Canvas movements (300-500ms)
  ↓ Pan, zoom, reset view
  
Signature moments (500-1000ms)
  ↓ Page loads, hero animations, game mode toggle
```

---

## Timing Scale

### Duration Tokens (from TOKENS.md)

```css
:root {
  --duration-instant: 0ms;        /* Immediate (no animation) */
  --duration-fast: 100ms;         /* Micro-interactions */
  --duration-normal: 150ms;       /* Hover states */
  --duration-moderate: 200ms;     /* Button clicks, focus */
  --duration-slow: 300ms;         /* Canvas pan/zoom */
  --duration-slower: 500ms;       /* Page transitions */
  --duration-slowest: 1000ms;     /* Hero animations */
}
```

### Usage Guidelines

| Duration | Use Cases | Examples |
|----------|-----------|----------|
| **0ms** | Reduced motion mode, instant state changes | Skip animations, immediate feedback |
| **100ms** | Micro-interactions, rapid feedback | Cursor change, tooltip show |
| **150ms** | Hover states, subtle transitions | Card hover, link underline |
| **200ms** | Click feedback, focus rings | Button press, input focus |
| **300ms** | Canvas navigation, moderate transitions | Pan viewport, zoom level |
| **500ms** | Page transitions, modal animations | Route change, overlay entry |
| **1000ms** | Hero moments, signature animations | Landing animation, game mode reveal |

**Golden Rule:** If animation feels sluggish, it's too long. Most UI animations should be 150-300ms.

---

## Easing Functions

### Standard Easing (CSS Bezier Curves)

```css
:root {
  /* Basic Easing */
  --ease-linear: linear;                              /* Constant speed (avoid for UI) */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);             /* Slow start, fast end */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);            /* Fast start, slow end (DEFAULT) */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);       /* Smooth both ends */
  
  /* Expressive Easing */
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bouncy feel */
  --ease-expo: cubic-bezier(0.87, 0, 0.13, 1);       /* Dramatic acceleration */
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);    /* Slight overshoot */
}
```

### Motion.dev Spring Physics

```typescript
// Recommended spring configurations
const springConfigs = {
  // Gentle - Subtle hover states, focus rings
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.5
  },
  
  // Default - Standard UI transitions
  default: {
    type: "spring",
    stiffness: 260,
    damping: 26,
    mass: 1
  },
  
  // Snappy - Button clicks, quick feedback
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.8
  },
  
  // Wobbly - Playful moments, game mode
  wobbly: {
    type: "spring",
    stiffness: 180,
    damping: 12,
    mass: 1
  },
  
  // Slow - Canvas navigation, large movements
  slow: {
    type: "spring",
    stiffness: 100,
    damping: 20,
    mass: 1.2
  }
};
```

### Easing Selection Guide

```
Use Case → Easing Function

Entering elements → ease-out (fast start, slow landing)
Exiting elements → ease-in (slow start, fast exit)
Bidirectional → ease-in-out (smooth both ways)
Natural feel → spring physics (default config)
Playful moment → wobbly spring (game mode)
Canvas navigation → slow spring + ease-out
Micro-interactions → gentle spring or ease-out
```

---

## Component Motion Specifications

### 1. Timeline Node Animations

#### Hover State
```typescript
// Motion.dev implementation
<motion.div
  whileHover={{
    y: -2,
    boxShadow: "var(--shadow-lg)"
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.5
  }}
>
```

**Behavior:**
- **Transform:** Translate up 2px (subtle lift)
- **Shadow:** Increase from `--shadow-md` to `--shadow-lg`
- **Duration:** ~150ms (spring physics)
- **Easing:** Gentle spring (stiffness: 300)

#### Click/Tap State
```typescript
<motion.div
  whileTap={{
    y: 0,
    scale: 0.98
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 30
  }}
>
```

**Behavior:**
- **Transform:** Return to y: 0, slight scale down
- **Duration:** ~100ms (snappy spring)
- **Purpose:** Tactile feedback

#### Entry Animation (Initial Load)
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 26,
    delay: index * 0.05 // Stagger by 50ms per node
  }}
>
```

**Behavior:**
- **Fade in** from opacity 0 → 1
- **Slide up** from y: 20px → 0
- **Stagger:** 50ms delay per node (max 10 nodes = 500ms total)
- **Duration:** ~400ms per node

---

### 2. Canvas Pan & Zoom

#### Pan (Drag Movement)
```typescript
// While dragging
{
  duration: 0, // Immediate tracking (no delay)
  type: "tween",
  ease: "linear"
}

// On release (momentum/inertia)
{
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1.2,
  restDelta: 0.5
}
```

**Behavior:**
- **During drag:** Immediate 1:1 tracking (no animation)
- **After release:** Spring physics with inertia
- **Friction:** Damping 20 (moderate slowdown)
- **Duration:** ~300-500ms coast

#### Zoom (Scroll Wheel / Pinch)
```typescript
{
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 1,
  duration: 300
}
```

**Behavior:**
- **Transform:** Scale from current → target zoom level
- **Origin:** Mouse position (zoom toward cursor)
- **Duration:** 300ms
- **Easing:** Default spring (smooth deceleration)

#### Reset View (Home Button)
```typescript
{
  type: "spring",
  stiffness: 150,
  damping: 24,
  mass: 1.5,
  duration: 500
}
```

**Behavior:**
- **Transform:** Return to center (portfolio hub)
- **Zoom:** Reset to default zoom level (1.0)
- **Duration:** 500ms (slower for dramatic return)
- **Easing:** Slow spring (heavy mass = deliberate)

---

### 3. Canvas Controls (Toolbar)

#### Entry Animation
```typescript
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 30,
    delay: 0.3 // Enter after canvas loads
  }}
>
```

**Behavior:**
- **Fade in** from right side (x: 20px → 0)
- **Delay:** 300ms (let canvas settle first)
- **Duration:** ~200ms

#### Button Hover
```typescript
<motion.button
  whileHover={{
    backgroundColor: "var(--surface-container-high)",
    borderColor: "var(--border-subtle)"
  }}
  transition={{
    duration: 0.15,
    ease: "easeOut"
  }}
>
```

**Behavior:**
- **Background:** Subtle tonal shift
- **Border:** Increase opacity
- **Duration:** 150ms (quick feedback)
- **Easing:** ease-out (CSS bezier)

#### Button Active State (Game Mode Toggle)
```typescript
<motion.button
  animate={{
    backgroundColor: isActive ? "var(--interactive-default)" : "transparent",
    scale: isActive ? 1.05 : 1
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 30
  }}
>
```

**Behavior:**
- **Background:** Instant color change
- **Scale:** Slight grow (1.05x) when active
- **Duration:** ~150ms (snappy spring)

---

### 4. Portfolio Hub (Central Node)

#### Initial Entry (Hero Animation)
```typescript
<motion.div
  initial={{ 
    opacity: 0, 
    scale: 0.9,
    y: 30
  }}
  animate={{ 
    opacity: 1, 
    scale: 1,
    y: 0
  }}
  transition={{
    type: "spring",
    stiffness: 200,
    damping: 28,
    mass: 1.2,
    delay: 0.2
  }}
>
```

**Behavior:**
- **Fade in** + **scale up** + **slide up**
- **Delay:** 200ms (after canvas initializes)
- **Duration:** ~600ms (deliberate entrance)
- **Easing:** Default spring (authoritative)

#### Pulse Effect (Optional - Draw Attention)
```typescript
<motion.div
  animate={{
    scale: [1, 1.02, 1],
    boxShadow: [
      "var(--shadow-xl)",
      "var(--shadow-2xl)",
      "var(--shadow-xl)"
    ]
  }}
  transition={{
    duration: 2,
    ease: "easeInOut",
    repeat: 3, // Pulse 3 times
    repeatDelay: 1
  }}
>
```

**Behavior:**
- **Subtle pulse** to guide user attention
- **Duration:** 2s per cycle
- **Repeat:** 3 times, then stop
- **Use case:** First-time visitors

---

### 5. Game Mode Transitions

#### Game Mode Toggle ON
```typescript
// 1. Cursor change (instant)
document.body.style.cursor = "url('/cursors/spaceship.svg') 16 16, auto";

// 2. Screen flash effect
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: [0, 0.3, 0] }}
  transition={{
    duration: 0.5,
    ease: "easeOut"
  }}
>
  {/* Blue overlay flash */}
</motion.div>

// 3. Controls highlight
<motion.button
  animate={{
    backgroundColor: "var(--interactive-default)",
    scale: [1, 1.1, 1.05]
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.8
  }}
>
```

**Behavior:**
- **Cursor:** Instant change to spaceship
- **Screen flash:** Blue overlay (300ms fade in/out)
- **Button:** Pop animation + color change
- **Duration:** ~500ms total sequence

#### Arrow Key Navigation (Game Mode)
```typescript
// Snap to next node
<motion.div
  animate={{
    x: targetX,
    y: targetY,
    scale: [1, 0.95, 1]
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 28,
    mass: 0.9
  }}
>
```

**Behavior:**
- **Transform:** Move canvas to center next node
- **Scale:** Slight "warp" effect (0.95x → 1x)
- **Duration:** ~300ms per navigation
- **Easing:** Snappy spring (responsive to input)

#### Game Mode Toggle OFF
```typescript
<motion.div
  animate={{
    opacity: [1, 0]
  }}
  transition={{
    duration: 0.2,
    ease: "easeIn"
  }}
  onAnimationComplete={() => {
    document.body.style.cursor = "auto";
  }}
>
```

**Behavior:**
- **Cursor:** Fade overlay, then reset cursor
- **Duration:** 200ms (faster exit than entrance)
- **Easing:** ease-in (quick fade)

---

### 6. Button Interactions

#### Primary Button
```typescript
<motion.button
  whileHover={{ 
    y: -1,
    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.3)"
  }}
  whileTap={{ 
    y: 0,
    scale: 0.98
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 30
  }}
>
```

**Hover:** Lift 1px + glow shadow (150ms)  
**Click:** Return to baseline + slight scale (100ms)

#### Secondary Button (Outlined)
```typescript
<motion.button
  whileHover={{
    borderColor: "var(--border-strong)",
    backgroundColor: "var(--interactive-bg-subtle)"
  }}
  transition={{
    duration: 0.15,
    ease: "easeOut"
  }}
>
```

**Hover:** Increase border opacity + subtle background (150ms)

#### Tertiary Button (Text)
```typescript
<motion.button
  whileHover={{
    x: 2
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 30
  }}
>
  <motion.span
    whileHover={{
      textDecoration: "underline"
    }}
  >
    Learn More
  </motion.span>
</motion.button>
```

**Hover:** Slide right 2px + underline (150ms)

---

### 7. Loading States

#### Skeleton Shimmer
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
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Reduced motion: Static */
@media (prefers-reduced-motion: reduce) {
  .skeleton-node {
    animation: none;
  }
}
```

**Duration:** 1.5s per cycle (infinite)  
**Easing:** ease-in-out (smooth flow)

#### Spinner (Alternative)
```typescript
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    duration: 1,
    ease: "linear",
    repeat: Infinity
  }}
>
  <SpinnerIcon />
</motion.div>
```

**Duration:** 1s per rotation (infinite)  
**Easing:** linear (constant speed)

---

### 8. Modal / Overlay Animations

#### Entry (Fade + Scale)
```typescript
// Backdrop
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>

// Modal Content
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 30
  }}
>
```

**Entry:**
- Backdrop: Fade in (200ms)
- Content: Fade + scale + slide up (300ms)

**Exit:**
- Reverse animations (faster: 200ms)

---

## Accessibility: Reduced Motion

### Detection
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

### Implementation Strategy

#### CSS Approach
```css
/* Default: Full animations */
.timeline-node {
  transition: transform 200ms ease-out;
}

/* Reduced motion: Instant or simplified */
@media (prefers-reduced-motion: reduce) {
  .timeline-node {
    transition: none; /* No animation */
  }
  
  /* OR keep essential animations but simplify */
  .timeline-node {
    transition: opacity 100ms linear; /* Keep fade, remove transform */
  }
}
```

#### Motion.dev Approach
```typescript
import { useReducedMotion } from 'motion/react';

const TimelineNode = () => {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion 
          ? { duration: 0.01 } // Effectively instant
          : { type: "spring", stiffness: 260, damping: 26 }
      }
    >
  );
};
```

### What to Preserve vs Remove

**Preserve (Essential Feedback):**
- ✅ Focus ring appearance (instant, no animation)
- ✅ Button state changes (instant color/background)
- ✅ Loading indicators (static or simple fade)
- ✅ Position changes for canvas navigation (instant snap)

**Remove (Decorative Motion):**
- ❌ Hover lifts and transforms
- ❌ Entry/exit animations
- ❌ Parallax effects
- ❌ Spring physics (replace with instant or linear)
- ❌ Scale/rotate transformations

**Golden Rule:** In reduced motion mode, respect the user's preference completely. If unsure, make it instant.

---

## Performance Best Practices

### 1. GPU-Accelerated Properties
```typescript
// ✅ DO: Use transform properties (GPU-accelerated)
transform: translateX(100px);
transform: translateY(-2px);
transform: scale(1.05);
transform: rotate(45deg);
opacity: 0.5;

// ❌ DON'T: Animate layout properties (CPU-bound, causes reflow)
width: 300px;
height: 200px;
top: 100px;
left: 50px;
margin: 20px;
padding: 10px;
```

### 2. Will-Change Optimization
```css
/* Use sparingly - only for frequently animated elements */
.timeline-node {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.timeline-node.loaded {
  will-change: auto;
}
```

**When to use:**
- Canvas viewport (constantly panning/zooming)
- Game mode cursor overlay
- Scrolling containers

**When NOT to use:**
- Static content
- One-time entry animations
- Hover states (too many elements)

### 3. Layer Promotion
```css
/* Force GPU layer (use cautiously) */
.timeline-node {
  transform: translateZ(0); /* Or translate3d(0,0,0) */
  backface-visibility: hidden;
}
```

**Purpose:** Promotes element to its own compositor layer  
**Cost:** Increased memory usage  
**Use for:** Large animated areas (canvas viewport)

### 4. Debouncing & Throttling
```typescript
// Debounce zoom events
const handleZoom = debounce((delta: number) => {
  setZoomLevel(prev => clamp(prev + delta, 0.5, 3));
}, 16); // ~60fps

// Throttle pan events
const handlePan = throttle((x: number, y: number) => {
  setViewport({ x, y });
}, 16);
```

**Purpose:** Limit animation frame updates  
**Target:** 60fps (16.67ms per frame)

### 5. Animation Lifecycle
```typescript
<motion.div
  onAnimationStart={() => {
    // Disable interactions during animation
    setIsAnimating(true);
  }}
  onAnimationComplete={() => {
    // Re-enable interactions
    setIsAnimating(false);
    // Clean up will-change
    element.style.willChange = 'auto';
  }}
>
```

---

## Motion Patterns Library

### Pattern 1: Staggered List Entry
```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05 // 50ms delay between items
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Pattern 2: Magnetic Button
```typescript
const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

<motion.button
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left - rect.width / 2) * 0.2,
      y: (e.clientY - rect.top - rect.height / 2) * 0.2
    });
  }}
  onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
  animate={{ x: mousePosition.x, y: mousePosition.y }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
```

### Pattern 3: Page Transition
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Pattern 4: Parallax Scroll
```typescript
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 1000], [0, -200]);

<motion.div style={{ y }}>
  {/* Content moves at 0.2x scroll speed */}
</motion.div>
```

### Pattern 5: Elastic Scale
```typescript
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 10 // Lower damping = more bounce
  }}
>
```

---

## Testing Animations

### Visual Testing Checklist
- [ ] Test at 60fps (Chrome DevTools > Performance)
- [ ] Verify no layout thrashing (Rendering > Paint flashing)
- [ ] Check on low-end devices (throttle CPU in DevTools)
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Verify touch gestures on mobile (pan, pinch-zoom)
- [ ] Check animation smoothness during canvas pan

### Performance Metrics
```typescript
// Monitor frame rate
const fps = useRef(0);
const lastTime = useRef(performance.now());

useAnimationFrame(() => {
  const now = performance.now();
  fps.current = 1000 / (now - lastTime.current);
  lastTime.current = now;
  
  if (fps.current < 50) {
    console.warn('Low FPS detected:', fps.current);
  }
});
```

### Browser DevTools Checklist
1. **Performance tab** → Record animation → Check for dropped frames
2. **Rendering tab** → Enable "Paint flashing" (should be minimal)
3. **Layers tab** → Verify GPU layers (timeline nodes should NOT each be layers)
4. **Network tab** → Throttle to "Slow 3G" and test

---

## Motion Design Status

| Component | Specification | Implementation | Testing |
|-----------|--------------|----------------|---------|
| Timeline Node | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Canvas Pan/Zoom | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Canvas Controls | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Portfolio Hub | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Game Mode | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Buttons | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Loading States | ✅ Complete | ⏳ Pending | ⏳ Pending |
| Modal/Overlay | ✅ Complete | ⏳ Pending | ⏳ Pending |

---

## Quick Reference

### Common Spring Configs
```typescript
gentle:  { stiffness: 300, damping: 30, mass: 0.5 }  // Hover
default: { stiffness: 260, damping: 26, mass: 1 }    // Standard
snappy:  { stiffness: 400, damping: 30, mass: 0.8 }  // Click
wobbly:  { stiffness: 180, damping: 12, mass: 1 }    // Playful
slow:    { stiffness: 100, damping: 20, mass: 1.2 }  // Canvas
```

### Common Durations
```typescript
100ms → Micro-interactions
150ms → Hover states
200ms → Button clicks
300ms → Canvas navigation
500ms → Page transitions
```

### Common Easing
```typescript
ease-out → Entering elements (default)
ease-in  → Exiting elements
spring   → Natural, organic feel
```

---

## Resources

- **Motion.dev Docs:** https://motion.dev/docs
- **Easing Functions:** https://easings.net/
- **Spring Physics Calculator:** https://www.react-spring.dev/docs/utilities/interpolate
- **Material Motion:** https://material.io/design/motion/

---

**Motion Specifications:** 8 components defined  
**Last Updated:** 2026-03-22  
**Next Review:** After Phase 1 canvas implementation
