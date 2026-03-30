# Phase 9: Discovery and SEO - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 09-discovery-and-seo
**Areas discussed:** Navigation header, Category & tag listing pages, OG image strategy, 404 page

---

## Navigation Header

| Option | Description | Selected |
|--------|-------------|----------|
| Portfolio link only + blog title/logo on left | Minimal — just the portfolio link and wordmark | ✓ |
| Portfolio link + blog index link | Both always visible in nav | |
| Portfolio link + category nav links | Shows Engineering, Reflections, etc. in header | |

**Scroll behavior:**

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky | Stays at top as you scroll | |
| Static | Scrolls away with content | |
| Sticky with glassmorphism backdrop blur | Frosted floating bar | ✓ |

**Left identity:**

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text "Writing" | Simple link to blog index | |
| Wordmark/logo treatment | Styled, heavier weight | ✓ |
| Nothing on the left | Just right-side links | |

**User's choice:** Sticky glassmorphism bar — wordmark on left, portfolio link on right
**Notes:** Glassmorphism is consistent with Phase 8's rule allowing it on floating/nav overlays

---

## Category & Tag Listing Pages

**Layout:**

| Option | Description | Selected |
|--------|-------------|----------|
| Same list layout, heading at top | e.g., "Engineering" heading above same post list | ✓ |
| Index + post count | e.g., "Engineering — 3 posts" | |
| Filtered view (no separate page) | URL-based filter on main index | |

**Cats vs tags visual treatment:**

| Option | Description | Selected |
|--------|-------------|----------|
| Same layout for both | Just different heading | ✓ |
| Categories = editorial, tags = pill-filtered | Different visual treatment | |
| You decide | Only 2 categories, Claude picks | |

**Post card display:**

| Option | Description | Selected |
|--------|-------------|----------|
| Category only (already implemented) | Keep current PostCard behavior | ✓ |
| Both category + tag pills | Show all tags too | |
| Category on card, tags on post page only | Split display | |

**User's choice:** Same layout for both, category only on cards (keep existing), no post count in heading
**Notes:** Category pill on PostCard should become a clickable link to `/category/[name]`

---

## OG Image Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Static fallback image | One branded image for all posts | ✓ |
| Dynamic per-post (Satori) | Generated from post title + category at build time | |
| Text-only OG tags | No og:image | |

**Static image design:**

| Option | Description | Selected |
|--------|-------------|----------|
| Dark #131313 + "Writing" wordmark + URL | Minimal branded card | ✓ |
| Skip — user provides asset | Manual image asset | |
| You decide | Claude picks design | |

**User's choice:** Static fallback — dark background, "Writing" wordmark, writing.illulachy.me
**Notes:** 1200×630px standard OG size; deferred dynamic per-post images to backlog

---

## 404 Page

**Tone:**

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal, on-brand | Short message + back link | |
| Slightly playful | Short witty line, still minimal | ✓ |
| You decide | | |

**Navigation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Include nav header | Keeps navigation available | |
| No nav — stripped down | Just message + back link | ✓ |

**User's choice:** Slightly playful + no nav — a witty line with a single "← Back to writing" link
**Notes:** On-brand with Stitch tokens even without nav; exact wording is Claude's discretion

---

## Claude's Discretion

- Exact 404 witty line wording
- SVG vs PNG for OG image asset
- Category/tag slug normalization (lowercase, hyphens)
- Whether `@astrojs/rss` or manual endpoint is cleaner
- Astro `404.astro` convention vs custom error page
