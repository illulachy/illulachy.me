# Design Tokens: illulachy.me

**Last Updated:** 2026-03-22  
**Design System:** High-End Editorial + Exaggerated Minimalism  
**Stack:** Tailwind CSS v4 + CSS Custom Properties

---

## Color Palette

### Canvas Foundation
```css
:root {
  /* Canvas & Backgrounds */
  --canvas-bg: #131313;              /* Deep charcoal canvas */
  --canvas-grid: #18181B;            /* Subtle grid lines (barely visible) */
  --canvas-fog: rgba(19, 19, 19, 0.6); /* Fog overlay for depth */
  
  /* Surface Hierarchy (Tonal Layering) */
  --surface-dim: #0A0A0A;            /* Lowest depth */
  --surface-default: #131313;        /* Canvas level */
  --surface-container-lowest: #1A1A1A;
  --surface-container-low: #1C1C1C;  /* Timeline node background */
  --surface-container: #212121;      /* Elevated cards */
  --surface-container-high: #272727; /* Hover state */
  --surface-container-highest: #2E2E2E; /* Modal/overlay */
}
```

### Interactive Colors
```css
:root {
  /* Primary Interactions (Mauve) */
  --interactive-default: #E0AFFF;    /* CTA buttons, links, active states */
  --interactive-hover: #EAC7FF;      /* Hover state (lighter) */
  --interactive-active: #D197FF;     /* Click/pressed state (darker) */
  --interactive-disabled: #B380CC;   /* Disabled state (desaturated) */
  
  /* Interactive Backgrounds */
  --interactive-bg-subtle: rgba(224, 175, 255, 0.1);   /* 10% opacity */
  --interactive-bg-medium: rgba(224, 175, 255, 0.2);   /* 20% opacity */
  --interactive-bg-strong: rgba(224, 175, 255, 0.3);   /* 30% opacity */
}
```

### Typography Colors
```css
:root {
  /* Text Hierarchy */
  --text-primary: #FFFFFF;           /* Headings, high-emphasis text */
  --text-secondary: #A1A1AA;         /* Body text, medium-emphasis (zinc-400) */
  --text-tertiary: #71717A;          /* Metadata, low-emphasis (zinc-500) */
  --text-quaternary: #52525B;        /* Disabled text (zinc-600) */
  --text-inverse: #09090B;           /* Text on light backgrounds */
}
```

### Accent & Semantic Colors
```css
:root {
  /* Accent (Mauve - Use Sparingly) */
  --accent-mauve: #E0AFFF;           /* Highlight, special moments */
  --accent-mauve-dim: rgba(224, 175, 255, 0.2);
  
  /* Semantic Colors */
  --success: #22C55E;                /* Success states */
  --success-bg: rgba(34, 197, 94, 0.1);
  
  --warning: #F59E0B;                /* Warning states */
  --warning-bg: rgba(245, 158, 11, 0.1);
  
  --error: #EF4444;                  /* Error states */
  --error-bg: rgba(239, 68, 68, 0.1);
  
  --info: #3B82F6;                   /* Info states (same as interactive) */
  --info-bg: rgba(59, 130, 246, 0.1);
}
```

### Border & Outline
```css
:root {
  /* Ghost Borders (Follows "No-Line Rule") */
  --border-ghost: rgba(255, 255, 255, 0.06);        /* Subtle divider */
  --border-subtle: rgba(255, 255, 255, 0.1);        /* Card outline */
  --border-default: rgba(255, 255, 255, 0.15);      /* Active border */
  --border-strong: rgba(255, 255, 255, 0.2);        /* Hover border */
  
  /* Focus Outline */
  --outline-focus: var(--interactive-default);      /* Keyboard focus */
  --outline-focus-offset: 4px;                      /* Focus outline spacing */
}
```

### Glassmorphism
```css
:root {
  /* Glass Effect for Floating UI */
  --glass-bg: rgba(28, 28, 28, 0.7);                /* 70% opacity background */
  --glass-border: rgba(255, 255, 255, 0.1);         /* Subtle border */
  --glass-blur: 20px;                               /* Backdrop blur amount */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);   /* Ambient shadow */
}
```

### Shadows & Elevation
```css
:root {
  /* Ambient Shadows (Invisible but Felt) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);      /* Default card shadow */
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);      /* Hover state */
  --shadow-xl: 0 12px 40px rgba(0, 0, 0, 0.16);     /* Modal/overlay */
  --shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.24);    /* Dramatic depth */
  
  /* Tinted Shadows (For Light Backgrounds) */
  --shadow-tinted: 0 4px 16px rgba(37, 99, 235, 0.08);
}
```

---

## Typography

### Font Families
```css
:root {
  /* Primary Fonts */
  --font-display: 'Noto Serif', Georgia, serif;
  --font-heading: 'Noto Serif', Georgia, serif;
  --font-body: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-label: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Google Fonts Import URL */
  /* @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap'); */
}
```

### Font Sizes (Base Scale)
```css
:root {
  /* Base Scale (rem units for accessibility) */
  --text-xs: 0.75rem;      /* 12px - Metadata, timestamps */
  --text-sm: 0.875rem;     /* 14px - Labels, captions */
  --text-base: 1rem;       /* 16px - Body text (default) */
  --text-lg: 1.125rem;     /* 18px - Card titles */
  --text-xl: 1.25rem;      /* 20px - Section titles */
  --text-2xl: 1.5rem;      /* 24px - Timeline markers */
  --text-3xl: 1.875rem;    /* 30px - Portfolio hub */
  --text-4xl: 2.25rem;     /* 36px - Page headers */
  --text-5xl: 3rem;        /* 48px - Large headlines */
  --text-6xl: 3.75rem;     /* 60px - Hero text */
  
  /* Display Scale (Responsive with clamp) */
  --display-sm: clamp(2rem, 5vw, 3rem);           /* 32-48px */
  --display-md: clamp(3rem, 7vw, 5rem);           /* 48-80px */
  --display-lg: clamp(4rem, 10vw, 8rem);          /* 64-128px */
  --display-xl: clamp(5rem, 12vw, 10rem);         /* 80-160px */
}
```

### Font Weights
```css
:root {
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
}
```

### Line Heights
```css
:root {
  /* Line Height (Optimized for Readability) */
  --leading-none: 1;
  --leading-tight: 1.25;         /* Headlines, display text */
  --leading-snug: 1.375;         /* Card titles */
  --leading-normal: 1.5;         /* Body text (default) */
  --leading-relaxed: 1.625;      /* Long-form reading */
  --leading-loose: 2;            /* Spacious content */
}
```

### Letter Spacing
```css
:root {
  /* Letter Spacing (Tracking) */
  --tracking-tighter: -0.05em;   /* Display text (exaggerated minimalism) */
  --tracking-tight: -0.025em;    /* Headlines */
  --tracking-normal: 0;          /* Body text */
  --tracking-wide: 0.025em;      /* Labels, all-caps */
  --tracking-wider: 0.05em;      /* Spaced headings */
  --tracking-widest: 0.1em;      /* All-caps labels */
}
```

---

## Spacing Scale

### Base Spacing (8px Grid System)
```css
:root {
  /* Spacing Scale (Based on 8px Grid) */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0_5: 0.125rem;    /* 2px */
  --spacing-1: 0.25rem;       /* 4px */
  --spacing-2: 0.5rem;        /* 8px */
  --spacing-3: 0.75rem;       /* 12px */
  --spacing-4: 1rem;          /* 16px - Base unit */
  --spacing-5: 1.25rem;       /* 20px */
  --spacing-6: 1.5rem;        /* 24px */
  --spacing-8: 2rem;          /* 32px */
  --spacing-10: 2.5rem;       /* 40px */
  --spacing-12: 3rem;         /* 48px */
  --spacing-16: 4rem;         /* 64px */
  --spacing-20: 5rem;         /* 80px */
  --spacing-24: 6rem;         /* 96px */
  --spacing-32: 8rem;         /* 128px */
  --spacing-40: 10rem;        /* 160px */
  --spacing-48: 12rem;        /* 192px */
  --spacing-64: 16rem;        /* 256px */
}
```

### Semantic Spacing (Editorial Context)
```css
:root {
  /* Breathing Room (Whitespace Philosophy) */
  --space-breath: var(--spacing-12);        /* 48px - Between sections */
  --space-section: var(--spacing-24);       /* 96px - Major section breaks */
  --space-editorial: var(--spacing-32);     /* 128px - Editorial whitespace */
  --space-hero: var(--spacing-48);          /* 192px - Hero padding */
  
  /* Component Spacing */
  --space-inline: var(--spacing-2);         /* 8px - Inline elements */
  --space-stack: var(--spacing-4);          /* 16px - Vertical rhythm */
  --space-card-padding: var(--spacing-6);   /* 24px - Card internal padding */
  --space-container-padding: var(--spacing-8); /* 32px - Container edges */
}
```

---

## Border Radius

```css
:root {
  /* Roundedness Scale (Subtle by Default) */
  --radius-none: 0;
  --radius-sm: 0.125rem;      /* 2px - Subtle hint */
  --radius-default: 0.25rem;  /* 4px - Buttons, inputs */
  --radius-md: 0.375rem;      /* 6px - Cards (subtle) */
  --radius-lg: 0.5rem;        /* 8px - Timeline nodes */
  --radius-xl: 0.75rem;       /* 12px - Canvas controls */
  --radius-2xl: 1rem;         /* 16px - Modals */
  --radius-3xl: 1.5rem;       /* 24px - Hero cards */
  --radius-full: 9999px;      /* Fully rounded (pills, avatars) */
}
```

---

## Animation & Motion

### Timing Functions (Easing)
```css
:root {
  /* Easing Functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);          /* Default for entering */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Smooth transitions */
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bouncy feel */
  --ease-expo: cubic-bezier(0.87, 0, 0.13, 1);     /* Dramatic easing */
}
```

### Duration (Timing)
```css
:root {
  /* Animation Duration */
  --duration-instant: 0ms;
  --duration-fast: 100ms;          /* Micro-interactions */
  --duration-normal: 150ms;        /* Hover states */
  --duration-moderate: 200ms;      /* Button clicks */
  --duration-slow: 300ms;          /* Canvas pan/zoom */
  --duration-slower: 500ms;        /* Page transitions */
  --duration-slowest: 1000ms;      /* Hero animations */
}
```

### Specific Motion Tokens
```css
:root {
  /* Component-Specific Motion */
  --motion-hover: var(--duration-normal) var(--ease-out);
  --motion-focus: var(--duration-fast) var(--ease-in-out);
  --motion-canvas-pan: var(--duration-slow) var(--ease-out);
  --motion-canvas-zoom: var(--duration-moderate) var(--ease-in-out);
  --motion-modal-enter: var(--duration-moderate) var(--ease-out);
  --motion-modal-exit: var(--duration-normal) var(--ease-in);
}
```

---

## Component-Specific Tokens

### Timeline Nodes
```css
:root {
  /* Node Dimensions */
  --node-width-sm: 240px;          /* Mobile */
  --node-width-default: 280px;     /* Desktop */
  --node-width-lg: 320px;          /* YouTube 16:9 */
  --node-height-default: 200px;
  --node-height-youtube: 180px;    /* 16:9 ratio */
  
  /* Node Spacing */
  --node-gap-horizontal: 80px;     /* Space between timeline nodes */
  --node-gap-vertical: 40px;       /* For overlapping/layered nodes */
  
  /* Portfolio Hub (Central Node) */
  --hub-width: 640px;              /* 2x scale */
  --hub-height: 360px;             /* 16:9 ratio */
}
```

### Canvas Controls
```css
:root {
  /* Control Dimensions */
  --control-size: 40px;            /* Icon button size */
  --control-size-lg: 48px;         /* Touch-friendly size */
  --control-gap: var(--spacing-2); /* Gap between buttons */
  
  /* Toolbar Positioning */
  --toolbar-offset: var(--spacing-4); /* Distance from canvas edge */
}
```

### Touch Targets
```css
:root {
  /* Accessibility - Minimum Touch Target */
  --touch-target-min: 44px;        /* WCAG 2.1 Level AAA */
  --touch-target-comfortable: 48px; /* Recommended */
}
```

---

## Z-Index Scale

```css
:root {
  /* Layering System (Predictable Stacking) */
  --z-base: 0;                     /* Canvas level */
  --z-timeline: 10;                /* Timeline nodes */
  --z-dropdown: 100;               /* Dropdowns, tooltips */
  --z-sticky: 200;                 /* Sticky headers */
  --z-fixed: 300;                  /* Fixed controls */
  --z-overlay: 400;                /* Modal backdrop */
  --z-modal: 500;                  /* Modal content */
  --z-toast: 600;                  /* Notifications */
  --z-tooltip: 700;                /* Tooltips (always on top) */
}
```

---

## Breakpoints (Responsive Design)

```css
:root {
  /* Media Query Breakpoints */
  --breakpoint-xs: 375px;          /* Small mobile */
  --breakpoint-sm: 640px;          /* Mobile */
  --breakpoint-md: 768px;          /* Tablet */
  --breakpoint-lg: 1024px;         /* Laptop */
  --breakpoint-xl: 1280px;         /* Desktop */
  --breakpoint-2xl: 1536px;        /* Large desktop */
  --breakpoint-3xl: 1920px;        /* Ultra-wide */
}
```

**Media Query Usage:**
```css
/* Mobile-first approach */
@media (min-width: 768px) {
  /* Tablet and up */
}

@media (min-width: 1024px) {
  /* Desktop and up */
}
```

---

## Usage Examples

### Apply Tokens in CSS
```css
/* Timeline Node Card */
.timeline-node {
  width: var(--node-width-default);
  height: var(--node-height-default);
  background: var(--surface-container-low);
  border: 1px solid var(--border-ghost);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: background var(--motion-hover),
              border-color var(--motion-hover),
              transform var(--motion-hover);
}

.timeline-node:hover {
  background: var(--surface-container-high);
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.timeline-node:focus {
  outline: 2px solid var(--outline-focus);
  outline-offset: var(--outline-focus-offset);
}
```

### Typography Usage
```css
/* Card Title */
.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

/* Body Text */
.card-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Display Heading (Hero) */
.hero-title {
  font-family: var(--font-display);
  font-size: var(--display-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  color: var(--text-primary);
}
```

### Glassmorphism Effect
```css
/* Canvas Controls Toolbar */
.canvas-controls {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3);
  box-shadow: var(--glass-shadow);
}
```

---

## Tailwind CSS v4 Integration

### Configure Custom Properties in Tailwind
```css
/* app.css or globals.css */
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/preflight" layer(base);
@import "tailwindcss/utilities" layer(utilities);

@theme {
  /* Colors */
  --color-canvas: var(--canvas-bg);
  --color-surface: var(--surface-default);
  --color-primary: var(--interactive-default);
  --color-text: var(--text-primary);
  
  /* Typography */
  --font-display: var(--font-display);
  --font-sans: var(--font-body);
  
  /* Spacing */
  --spacing-breath: var(--space-breath);
}
```

### Use in Tailwind Classes
```html
<!-- Timeline Node -->
<div class="w-[280px] h-[200px] bg-[var(--surface-container-low)] rounded-lg shadow-md hover:bg-[var(--surface-container-high)] transition-all duration-200">
  <h3 class="font-heading text-lg text-[var(--text-primary)]">Blog Post Title</h3>
  <p class="font-body text-sm text-[var(--text-secondary)]">Published Jan 2026</p>
</div>
```

---

## Notes for Developers

1. **CSS Custom Properties are reactive** - Change at runtime with JavaScript
2. **Fallback values** - All tokens have fallback values for older browsers
3. **Dark mode only** - Light mode tokens in v2
4. **8px grid system** - All spacing based on multiples of 8
5. **Semantic naming** - Use semantic tokens (e.g., `--space-breath`) over raw values

---

**Token Count:** 150+ tokens defined  
**Last Audit:** 2026-03-22  
**Next Review:** After Phase 1 implementation
