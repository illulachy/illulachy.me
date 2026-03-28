# Feature Research

**Domain:** Blog site (writing.illulachy.me) + Turborepo monorepo shared content
**Researched:** 2026-03-28
**Confidence:** HIGH

## Context

This research covers only the NEW features for milestone v1.1. The canvas portfolio (Phases 1-6) is already built. The focus is:

1. **Blog site** at writing.illulachy.me — a full reading-focused blog with categories, tags, RSS, and search
2. **Turborepo monorepo** — restructuring the repo so portfolio + blog + shared content coexist
3. **Shared content package** — a workspace package (`@osaka/content`) consumed by both apps

Existing tech already in place: React 19, Vite, Tailwind v4, shadcn/ui, Motion.dev, Markdown pipeline.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on any blog. Missing these makes the site feel unfinished or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Post list / index page | Entry point to the blog — users need to see all posts | LOW | Sorted reverse-chronological; show title, date, short excerpt |
| Individual post pages | Readable article view for each blog post | LOW | Markdown rendered to HTML; title, date, reading time, body |
| Markdown rendering | Content is authored in `.md` files — this is the pipeline | LOW | Already exists in portfolio. For blog: needs full prose rendering (headings, code blocks, lists, links) |
| Code syntax highlighting | Developer blog content will contain code blocks | LOW | Use Shiki at build time — zero runtime cost; Shiki is the current standard (Prism is legacy) |
| Estimated reading time | Readers want to know time investment before starting | LOW | Calculate from word count at build time (~200 WPM); frontmatter or computed |
| Post date / timestamps | Recency signal; readers gauge how current the content is | LOW | Pull from markdown frontmatter; format as "March 28, 2026" |
| Categories | Broad topic groupings (e.g. "Engineering", "Reflections") | LOW | Array in frontmatter; filtered listing pages per category |
| Tags | Fine-grained labels across categories (e.g. "React", "Canvas") | LOW | Array in frontmatter; filtered listing pages per tag |
| RSS feed | Readers subscribe via RSS readers; expected on any serious blog | MEDIUM | `/rss.xml` at build time; include title, date, excerpt, canonical URL |
| Sitemap | SEO — search engines index content faster with sitemap.xml | LOW | Static `/sitemap.xml` listing all post URLs |
| Responsive layout | Blog content must be readable on mobile (60%+ of traffic) | LOW | Prose max-width (~65ch), fluid typography, padding |
| Open Graph / meta tags | Social sharing previews (Twitter/X, iMessage link previews) | LOW | Per-post `og:title`, `og:description`, `og:image` from frontmatter |
| Canonical URLs | SEO — prevents duplicate content penalties | LOW | `<link rel="canonical">` per post; absolute URL |
| 404 page | Broken links happen — a useful 404 maintains trust | LOW | Static 404.html with link back to blog index |
| Navigation / header | Users need to navigate between blog, home, and portfolio | LOW | Link to illulachy.me (portfolio) + blog index |

**Why these are non-negotiable:**
- Without post list + individual pages: the blog literally cannot be read
- Without RSS: power readers (who drive repeat traffic) cannot subscribe
- Without OG tags: shared links look blank — a real visibility hit
- Without syntax highlighting: code-heavy posts are unreadable
- Without responsive layout: majority of readers on mobile get a broken experience

---

### Differentiators (Competitive Advantage)

Features that set this blog apart from a default markdown blog. Align with the visual/interactive identity of illulachy.me.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Full-text search (client-side) | Readers find specific posts without server dependency | MEDIUM | Use Pagefind — build-time index, WASM query, ~15 lines of integration; Lunr.js unmaintained since 2020; Pagefind is the current standard for static sites |
| Canvas portfolio backlink | Each post links back to its card on the infinite canvas | LOW | UI link like "See on timeline" — deep link to canvas position |
| Content shared with portfolio | Blog posts auto-appear on the canvas via `@osaka/content` package | MEDIUM | Shared content package is the Turborepo workspace package; both apps consume same markdown source of truth |
| Dark mode | Personal brand is Catppuccin Mocha (dark-first); blog should match | LOW | Tailwind v4 dark variant; CSS variables from existing `@theme` tokens |
| Copy-code button | Developer readers expect one-click copy for code blocks | LOW | Add via rehype plugin or small JS snippet; standard DX expectation |
| Table of contents | Long technical posts benefit from a sidebar/inline TOC | MEDIUM | Generate from headings at build time (rehype-toc or custom); sidebar on desktop, inline on mobile |
| Category + tag listing pages | Curated views: "All posts tagged React" as shareable URLs | LOW | Static pages per category and per tag; generated at build time |

**Why these differentiate:**
- Pagefind search: Most small blogs have no search at all — adds real utility with near-zero infra cost
- Shared content: Portfolio + blog share a single source of truth — genuine architectural advantage, not just tooling
- Canvas backlink: Unique to this site — connects blog reading back to the visual journey
- Copy-code: Small touch but immediately noticed by developer readers

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Comments section | Social validation, discussion | Requires backend (or Disqus with tracking), spam moderation; single-author blog does not need it | Link to Twitter/X or email for discussion |
| CMS / admin panel | "Easy" content editing | Adds backend, auth, hosting costs; Git workflow is already in place and works for a developer author | Continue using markdown files + Git commits to publish |
| Infinite scroll | Modern feel, no pagination click | Breaks browser history/back button, poor for SEO (search engines cannot follow dynamic loads) | Simple pagination or show all posts (up to ~50); no pagination needed for a small blog |
| Server-side rendering | SEO improvements | Overkill for a static blog — build-time rendering gives the same SEO benefits with simpler hosting | Vite static generation (vite-ssg or custom static export) |
| Email newsletter | Recurring readership | Requires email service (Mailchimp etc.), consent management, GDPR compliance; complexity far exceeds value for a personal blog v1 | RSS feed satisfies the subscribe use case without infrastructure |
| View counters / analytics dashboard | Curiosity about traffic | Adds JS payload, external calls, privacy implications | Use Vercel built-in analytics (zero-config, privacy-respecting) |
| Social sharing buttons | "Shareability" | Large JS payload from social SDKs; users who want to share know how to copy URLs | OG tags make native sharing look great — that is enough |
| Related posts (ML-based) | Discovery | Heavy to compute; manual tags + categories + search covers discovery | Tag/category browsing + search is sufficient |

---

## Feature Dependencies

```
Monorepo structure (Turborepo + pnpm workspaces)
    └──enables──> @osaka/content shared package
                      ├──consumed by──> Portfolio app (apps/portfolio)
                      └──consumed by──> Blog app (apps/blog)

Blog app foundations
    ├── Markdown pipeline (already built in portfolio → extract to shared package)
    │      └── Post frontmatter parsing (title, date, tags, categories, slug)
    │               └── RSS feed (needs slug + title + date + excerpt)
    │               └── Sitemap (needs slug + date)
    │               └── Category pages (needs categories array)
    │               └── Tag pages (needs tags array)
    │
    ├── Prose rendering (remark + rehype pipeline)
    │      ├── Syntax highlighting (Shiki — build-time, no runtime cost)
    │      ├── Copy-code button (rehype plugin or JS — post-v1)
    │      └── Table of contents (rehype-toc or custom — post-v1)
    │
    └── Post index page
           └── Post detail page
                  ├── OG tags (per-post)
                  ├── Reading time (computed from word count)
                  └── Canvas backlink (links to portfolio with post hash — post-v1)

Search (Pagefind)
    └──requires──> Static HTML output (must run AFTER build)
                       └── pagefind --site dist/ as Turborepo pipeline step

Dark mode
    └──requires──> Tailwind v4 @theme tokens (already exist in portfolio — reuse)
```

### Dependency Notes

- **Shared content package requires monorepo first:** Cannot share markdown between apps without Turborepo workspace wiring. This is step zero.
- **RSS and sitemap require post metadata:** Both are computed from the same frontmatter fields (title, date, slug, excerpt); build together in the same pipeline step.
- **Pagefind requires static HTML output:** Must run `pagefind --site dist/` after `vite build`; wire as a post-build step in Turborepo pipeline.
- **Syntax highlighting has no runtime dependency:** Shiki runs at build time — zero client JS bundle impact.
- **OG tags require per-post routing:** Each post needs its own HTML file with unique meta tags; static generation per route is required (not SPA client-side routing alone).

---

## MVP Definition

### Launch With (v1 — this milestone)

Minimum to make writing.illulachy.me a real, usable blog.

- [ ] Turborepo + pnpm monorepo structure — enables shared content; required before building blog app
- [ ] `@osaka/content` shared package — markdown source of truth consumed by both portfolio and blog
- [ ] Blog app scaffolding (apps/blog) — Vite + React + routing
- [ ] Post list page — reverse-chronological, title + date + excerpt
- [ ] Post detail page — full markdown rendering, reading time, date
- [ ] Syntax highlighting (Shiki) — required for developer content
- [ ] Categories listing + filtered pages — broad topic groupings
- [ ] Tags listing + filtered pages — fine-grained labels
- [ ] RSS feed (`/rss.xml`) — subscribe use case
- [ ] Sitemap (`/sitemap.xml`) — SEO baseline
- [ ] OG / meta tags per post — social sharing
- [ ] Dark mode — matches portfolio visual identity
- [ ] Responsive prose layout — mobile-first reading experience
- [ ] Deploy to writing.illulachy.me (Vercel) — separate deployment from portfolio

### Add After Validation (v1.x)

Features to add once core blog is live and being used.

- [ ] Full-text search (Pagefind) — add when post count makes browsing impractical (>20 posts)
- [ ] Copy-code button — small DX improvement; add when developer posts go live
- [ ] Table of contents — add for long technical posts (>2000 words)
- [ ] Canvas backlink ("See on timeline") — add when deep-link parameter is implemented in portfolio

### Future Consideration (v2+)

- [ ] Email newsletter — only if RSS subscriber count signals demand
- [ ] Comments — only if there is consistent readership wanting to discuss
- [ ] Automatic OG image generation — nice for social presence, significant build complexity

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Monorepo + shared content package | HIGH | MEDIUM | P1 |
| Post list + post detail pages | HIGH | LOW | P1 |
| Markdown rendering + syntax highlighting (Shiki) | HIGH | LOW | P1 |
| Categories + tags (listing pages) | HIGH | LOW | P1 |
| RSS feed | HIGH | MEDIUM | P1 |
| OG / meta tags | HIGH | LOW | P1 |
| Responsive layout + dark mode | HIGH | LOW | P1 |
| Sitemap | MEDIUM | LOW | P1 |
| Reading time | MEDIUM | LOW | P1 |
| Full-text search (Pagefind) | HIGH | MEDIUM | P2 |
| Copy-code button | MEDIUM | LOW | P2 |
| Table of contents | MEDIUM | MEDIUM | P2 |
| Canvas backlink | MEDIUM | MEDIUM | P2 |
| Comments | LOW | HIGH | P3 |
| Email newsletter | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

Reference blogs for comparison (all markdown-driven personal developer blogs).

| Feature | steipete.me (Astro) | timlrx/tailwind-nextjs-starter-blog | Our Approach (Vite + React) |
|---------|---------------------|--------------------------------------|------------------------------|
| Markdown rendering | Astro content collections | MDX + contentlayer | remark + rehype pipeline |
| Syntax highlighting | Shiki | Shiki | Shiki (build-time) |
| RSS | @astrojs/rss | Built-in | Custom rss or feed package |
| Search | None observed | kbar (command palette) | Pagefind (post-v1) |
| Categories / tags | Not confirmed in README | Yes (built-in) | Yes (from frontmatter) |
| Dark mode | Yes (Tailwind) | Yes | Yes (Tailwind v4 @theme tokens) |
| OG images | Yes | Auto-generated | Frontmatter-driven static |
| Monorepo | Not observed | No | Yes (Turborepo) |
| Shared content | No | No | Yes (@osaka/content workspace) |
| Canvas integration | No | No | Yes (unique differentiator) |

---

## Sources

- [Astro RSS docs](https://docs.astro.build/en/recipes/rss/) — RSS implementation patterns (HIGH confidence)
- [Pagefind replacing Lunr for static sites (2026)](https://www.allaboutken.com/posts/20260228-replacing-lunr-with-pagefind/) — Pagefind vs Lunr analysis (MEDIUM confidence)
- [Turborepo + shared packages tutorial 2026](https://noqta.tn/en/tutorials/turborepo-nextjs-monorepo-shared-packages-2026) — monorepo shared content patterns (MEDIUM confidence)
- [Astro vs Next.js for blogs 2026](https://sourabhyadav.com/blog/astro-vs-nextjs-for-blogs-2026/) — framework comparison for blog sites (MEDIUM confidence)
- [steipete.me GitHub](https://github.com/steipete/steipete.me) — inspiration reference; Astro-based markdown blog structure (MEDIUM confidence)
- [Pagination vs infinite scroll for blogs](https://nexterwp.com/blog/pagination-vs-infinite-scroll/) — UX pattern analysis (MEDIUM confidence)
- [React + Vite monorepo with pnpm](https://dev.to/lico/react-monorepo-setup-tutorial-with-pnpm-and-vite-react-project-ui-utils-5705) — Vite monorepo patterns (MEDIUM confidence)
- [SEO + OG tags for React/Vite](https://dev.to/ali_dz/optimizing-seo-in-a-react-vite-project-the-ultimate-guide-3mbh) — meta tag implementation (MEDIUM confidence)

---
*Feature research for: blog site (writing.illulachy.me) + Turborepo monorepo*
*Researched: 2026-03-28*
