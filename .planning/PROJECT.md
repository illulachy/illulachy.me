# illulachy.me

## What This Is

A personal website featuring an infinite canvas timeline that visualizes my journey — school, work, projects, blogs, and learning experiences. Visitors can pan and zoom through a chronological timeline with a central portfolio node as the hub. Content is managed via markdown files and built into an interactive visual experience.

## Core Value

The canvas must feel smooth and intuitive to explore — pan/zoom navigation works flawlessly, and the timeline layout clearly communicates my journey over time.

## Requirements

### Validated

**Phase 1 (Canvas Foundation):**
- [x] Infinite canvas with pan and zoom navigation (mouse drag, scroll wheel, touch gestures, arrow keys)
- [x] Responsive on desktop and mobile (touch navigation)

**Phase 2 (Content Pipeline):**
- [x] Content sourced from markdown files in the repository
- [x] Multiple content types: YouTube videos (thumbnails), blog posts, notes, projects

**Phase 3 (Custom Shapes & Hub):**
- [x] Central portfolio node (16:9) displaying an "about me" section
- [x] Content nodes as clickable cards — click to open external links
- [x] YouTube nodes link to YouTube
- [x] Blog/note nodes link to letters.illulachy.me
- [x] Project nodes link to external project URLs

**Phase 4 (Timeline Layout):**
- [x] Timeline extending left from the portfolio node, showing chronological entries (most recent closest to center)

**Phase 5 (UI Chrome):**
- [x] Tailwind CSS v4 with @theme design tokens for consistent styling
- [x] shadcn/ui Dialog component for accessible modals
- [x] Motion.dev animations for smooth loading transitions
- [x] Responsive layout (mobile and desktop)
- [x] Loading spinner with exit animation

### Active
- [ ] "Game mode" — hotkey switches to spaceship cursor, arrow key navigation through timeline
- [ ] Monorepo structure: portfolio site (illulachy.me) + blog site (letters.illulachy.me)

### Out of Scope

- Search/filter functionality — defer to v2 (focus on exploration first)
- CMS or admin panel — content managed via markdown in source code
- Embedded video playback — link out to YouTube instead (simpler)
- Real-time collaboration features — single-author site
- Authentication — public site, no login needed

## Context

**Inspiration:** Similar to https://github.com/steipete/steipete.me — a monorepo with markdown-based blog site.

**Purpose:** Document and reflect on learning journey in a visual, interactive format. Public portfolio but primarily for personal documentation.

**Tech Stack:**
- React 19 for UI components
- tldraw for infinite canvas implementation (proven library for pan/zoom canvas experiences)
- Tailwind CSS v4 with @theme design tokens for styling
- shadcn/ui for accessible UI components
- Motion.dev for animations and transitions
- Markdown for content authoring
- Vite for build tooling
- Monorepo structure (portfolio + blog)

**Content Types:**
- **YouTube videos:** Display thumbnail, link to YouTube when clicked
- **Blog posts/notes:** Display card, link to letters.illulachy.me when clicked
- **Projects:** Display thumbnail/card, link to external project URL
- **Education/milestones:** Display card with details
- **Work experience:** Display card with details

**Layout:**
- Central node (16:9 aspect ratio) = portfolio/about me
- Timeline flows to the left (oldest → newest, with newest closest to center)
- Chronological arrangement — time-based positioning

## Constraints

- **Tech stack:** React + tldraw (user specified)
- **Content management:** Markdown files in source code (no database)
- **Navigation:** Must support mouse, touch, and keyboard (including "game mode")
- **Performance:** Canvas must handle potentially hundreds of timeline nodes smoothly
- **Hosting:** Static site deployment (Vercel, Netlify, or similar)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use tldraw for canvas | Mature library with built-in pan/zoom, handles performance | — Pending |
| External links for content | Simplifies v1 — no modal/overlay complexity | — Pending |
| Monorepo structure | Portfolio and blog share repo, different deployment targets | — Pending |
| Game mode with spaceship | Adds personality and playful interaction to exploration | — Pending |

---
*Last updated: 2026-03-23 after Phase 5 completion*
