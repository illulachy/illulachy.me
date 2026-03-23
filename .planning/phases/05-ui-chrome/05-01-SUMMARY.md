---
phase: 05-ui-chrome
plan: 01
subsystem: ui-foundation
tags: [tailwind, motion, shadcn-ui, design-tokens, infrastructure]
requires: []
provides: [tailwind-v4, motion-animations, shadcn-dialog, design-system]
affects: [vite-config, styles, components]
tech_stack:
  added:
    - tailwindcss@4.2.2
    - "@tailwindcss/vite@4.2.2"
    - motion@12.38.0
    - "@radix-ui/react-dialog@1.1.15"
    - clsx@2.1.1
    - tailwind-merge@2.6.0
    - class-variance-authority@0.7.0
  patterns:
    - "Tailwind v4 CSS-first @theme configuration"
    - "shadcn/ui component system with glassmorphism"
    - "cn() utility for conditional class merging"
key_files:
  created:
    - src/styles/index.css
    - src/lib/utils.ts
    - src/components/ui/dialog.tsx
  modified:
    - vite.config.ts
    - src/main.tsx
    - package.json
    - package-lock.json
decisions:
  - summary: "Use Tailwind v4 @theme syntax instead of JavaScript config"
    rationale: "CSS-first configuration eliminates JS config files, provides better HMR, aligns with Tailwind v4 best practices"
    alternatives: ["JavaScript tailwind.config.js (v3 pattern)", "Inline CSS variables without Tailwind"]
    outcome: "Adopted @theme with semantic token naming (--color-*, --spacing-*, --font-size-*)"
  - summary: "Migrate 200+ CSS variables to Tailwind's semantic naming conventions"
    rationale: "Enables Tailwind utilities (text-primary, bg-surface, p-4) while preserving exact design system"
    alternatives: ["Keep original variable names", "Hybrid approach with both systems"]
    outcome: "Full migration: --text-primary → --color-primary, --spacing-4 → 16px"
  - summary: "Create .glass utility in @layer utilities instead of @theme"
    rationale: "Glassmorphism requires complex multi-property values (background + backdrop-filter + border + shadow)"
    alternatives: ["Inline styles", "Tailwind class composition"]
    outcome: "Single .glass class provides consistent glassmorphism across components"
  - summary: "Install shadcn/ui Dialog manually instead of via CLI"
    rationale: "Avoid overwriting project config, maintain full control over component customization"
    alternatives: ["Use shadcn CLI with --overwrite", "Build custom dialog from scratch"]
    outcome: "Manual installation with glassmorphism styling and z-[500] for modal hierarchy"
metrics:
  duration: 321s
  tasks: 3
  commits: 5
  files_created: 3
  files_modified: 6
  packages_added: 7
  completed_at: "2026-03-23T10:27:41Z"
---

# Phase 5 Plan 1: UI Foundation Summary

**One-liner:** Installed Tailwind CSS v4.2.2 with @theme design tokens, Motion.dev v12.38.0 for animations, and shadcn/ui Dialog with glassmorphism styling.

## What Was Built

Established modern UI infrastructure for Phase 5 by installing Tailwind CSS v4, Motion.dev, and shadcn/ui foundation. Created CSS-first @theme configuration migrating 200+ design tokens from CSS variables to Tailwind's semantic naming. Implemented cn() utility for conditional class merging and installed shadcn/ui Dialog component with custom glassmorphism styling.

**Key capabilities unlocked:**
- Tailwind v4 utilities available across all components (text-*, bg-*, p-*, rounded-*, etc.)
- Motion.dev ready for exit animations and transitions (Plan 02 will use AnimatePresence)
- shadcn/ui Dialog component with accessible focus management and portal rendering
- Design tokens accessible as both CSS variables and Tailwind utilities
- .glass utility provides consistent glassmorphism effect

## Tasks Completed

| # | Task | Status | Commit | Duration |
|---|------|--------|--------|----------|
| 1 | Install Tailwind CSS v4 and Motion.dev packages | ✅ Complete | `1cd2b52` | ~2 min |
| 2 | Create @theme configuration with design tokens | ✅ Complete | `6757f3d` | ~2 min |
| 3 | Create cn() utility and install shadcn/ui Dialog | ✅ Complete | `063692d` | ~1 min |

**Total:** 3/3 tasks complete in 5m 21s

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript build errors in Canvas.tsx**
- **Found during:** Task 3 verification (npm run build)
- **Issue:** Unused imports (CanvasControls, CanvasFogOverlay, useControlsVisibility) causing build failure with `noUnusedLocals: true`
- **Root cause:** Components were temporarily disabled in Phase 4 commit `fce21c4` for debugging, but imports remained
- **Fix:** Commented out unused imports to unblock build
- **Files modified:** src/components/Canvas.tsx
- **Commit:** `6cd791f`
- **Impact:** Build now succeeds, no functional changes to canvas behavior

**Rationale:** Build was failing, preventing verification of Task 3 (TypeScript compilation check). This is a blocking issue per Deviation Rule 3 - required to complete current task verification.

### Untracked Files

**2. Added generated and planning files to git**
- **Found during:** Final git status check
- **Files:** .planning/phases/05-ui-chrome/05-CONTEXT.md, public/timeline.json
- **Fix:** Committed planning context and regenerated timeline data
- **Commit:** `ee51ef5`

## Files Created

```
src/styles/index.css          # 304 lines - Tailwind v4 @theme configuration
src/lib/utils.ts               # 6 lines - cn() helper function
src/components/ui/dialog.tsx   # 118 lines - shadcn/ui Dialog with glassmorphism
```

## Files Modified

```
vite.config.ts                 # Added tailwindcss() plugin
src/main.tsx                   # Updated import to styles/index.css
package.json                   # Added 7 new packages
package-lock.json              # Dependency tree updates
src/components/Canvas.tsx      # Commented out unused imports (deviation fix)
.planning/phases/05-ui-chrome/05-CONTEXT.md  # Phase planning context
public/timeline.json           # Regenerated timeline data
```

## Technical Implementation

### @theme Token Migration

**Color tokens:**
```css
/* Before (CSS variables) */
--text-primary: #FFFFFF;
--interactive-default: #E0AFFF;
--surface-default: #131313;

/* After (Tailwind @theme) */
--color-primary: #FFFFFF;       /* text-primary, bg-primary */
--color-interactive: #E0AFFF;   /* text-interactive, bg-interactive */
--color-surface: #131313;       /* bg-surface */
```

**Spacing tokens:**
```css
/* Before */
--spacing-4: 1rem;  /* 16px */

/* After */
--spacing-4: 16px;  /* p-4, m-4, gap-4 */
```

**Typography tokens:**
```css
/* Before */
--text-base: 1rem;
--font-body: 'Space Grotesk', Inter, system-ui, sans-serif;

/* After */
--font-size-base: clamp(0.875rem, 2vw, 1rem);  /* text-base */
--font-body: "Space Grotesk", Inter, system-ui, sans-serif;  /* font-body */
```

### Glass Utility Pattern

```css
@layer utilities {
  .glass {
    background: rgba(28, 28, 28, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
}
```

**Usage in Dialog:**
```tsx
<DialogContent className="glass rounded-2xl p-8">
  {children}
</DialogContent>
```

### cn() Utility Function

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose:** Merges Tailwind classes correctly, handling conflicts (e.g., `p-4` overrides `p-2`)

### shadcn/ui Dialog Architecture

**Component structure:**
- `Dialog` - Root component (Radix Primitive wrapper)
- `DialogOverlay` - Backdrop with blur (z-[500], bg-black/60, backdrop-blur-sm)
- `DialogContent` - Modal content (glassmorphism, responsive width, animations)
- `DialogHeader/Footer` - Layout helpers
- `DialogTitle/Description` - Accessible text components

**Responsive behavior:**
- Mobile: `w-[90vw] max-w-full` (90% viewport width)
- Desktop: `md:max-w-lg md:w-auto` (max 512px width, auto height)

**Animations:**
- Enter: fade-in-0, zoom-in-95, slide-in-from-left-1/2
- Exit: fade-out-0, zoom-out-95, slide-out-to-left-1/2
- Duration: 200ms

**Z-index hierarchy:**
- Modal: z-[500] (above tldraw canvas at z-200-300)
- Overlay: z-[500] (same layer as content for proper stacking)

## Verification Results

✅ **All verification checks passed:**

1. **Package versions verified:**
   ```
   tailwindcss@4.2.2
   @tailwindcss/vite@4.2.2
   motion@12.38.0
   @radix-ui/react-dialog@1.1.15
   clsx@2.1.1
   tailwind-merge@2.6.0
   class-variance-authority@0.7.0
   ```

2. **Build verification:**
   ```bash
   npm run build  # ✓ Success (after fixing unused imports)
   # Output: dist/index.html (0.79 kB)
   #         dist/assets/index-Cb7wJCn9.css (104.74 kB)
   #         dist/assets/index-BVdA9b4P.js (1,908.73 kB)
   ```

3. **Dev server verification:**
   ```bash
   npm run dev  # ✓ Starts on http://localhost:5175
   # Timeline generated: 11 entries
   # About data generated
   # No console errors
   ```

4. **TypeScript compilation:**
   ```bash
   npx tsc --noEmit  # ✓ Success (0 errors)
   ```

## Success Criteria Met

- [x] Tailwind CSS v4.2.2 installed with @tailwindcss/vite plugin
- [x] Motion.dev v12.38.0 installed (import from motion/react works)
- [x] @radix-ui/react-dialog v1.1.15 installed
- [x] src/styles/index.css contains complete @theme configuration with all design tokens
- [x] src/lib/utils.ts exports cn() function
- [x] src/components/ui/dialog.tsx exports Dialog components with glassmorphism and responsive styling
- [x] npm run dev works, canvas loads, no regressions
- [x] npm run build succeeds

## Dependencies for Plan 02

**Ready for Plan 02 (Component Migration):**
- ✅ Tailwind utilities available for CanvasControls, CanvasLoader, MilestoneModal
- ✅ Motion.dev ready for exit animations (AnimatePresence pattern)
- ✅ shadcn/ui Dialog ready to replace custom MilestoneModal
- ✅ cn() utility ready for conditional class merging
- ✅ .glass utility ready for glassmorphism effects
- ✅ Design tokens accessible via both CSS variables and Tailwind classes

**Migration path for Plan 02:**
1. Migrate CanvasLoader to Tailwind classes + Motion.dev exit animation
2. Migrate CanvasControls to Tailwind classes
3. Replace MilestoneModal with shadcn/ui Dialog (preserve glassmorphism)
4. Add Motion.dev AnimatePresence for smooth transitions
5. Make modal responsive (fullscreen on mobile, centered on desktop)

## Self-Check: PASSED

**Files created:**
- [x] FOUND: src/styles/index.css (304 lines, @theme configuration)
- [x] FOUND: src/lib/utils.ts (6 lines, cn() function)
- [x] FOUND: src/components/ui/dialog.tsx (118 lines, Dialog component)

**Commits:**
- [x] FOUND: `1cd2b52` - chore(05-01): install Tailwind v4.2.2, Motion.dev v12.38.0, and shadcn/ui deps
- [x] FOUND: `6757f3d` - feat(05-01): create @theme configuration with design tokens
- [x] FOUND: `063692d` - feat(05-01): create cn() utility and install shadcn/ui Dialog component
- [x] FOUND: `6cd791f` - fix(05-01): comment out unused imports in Canvas.tsx
- [x] FOUND: `ee51ef5` - chore(05-01): add phase context and regenerated timeline

**Verification:**
- [x] PASSED: npm list (all packages at correct versions)
- [x] PASSED: npm run build (successful build with no errors)
- [x] PASSED: npm run dev (server starts, canvas loads)
- [x] PASSED: npx tsc --noEmit (TypeScript compilation succeeds)

**All checks passed. Plan 05-01 execution complete.**
