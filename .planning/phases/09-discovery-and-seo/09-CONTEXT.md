# Phase 9: Discovery and SEO - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the blog fully discoverable. Delivers: navigation header on every blog page, category and tag listing pages, RSS feed at /rss.xml, sitemap at /sitemap.xml, per-post OG/meta tags for social sharing, and a styled 404 page.

**What this phase delivers:**
- Navigation header — sticky glassmorphism bar present on every blog page
- Category listing pages — `/category/[name]` — filtered post list per category
- Tag listing pages — `/tag/[name]` — filtered post list per tag
- RSS feed at `/rss.xml` — post titles, dates, excerpts, canonical URLs
- Sitemap at `/sitemap.xml` — all post URLs
- OG/meta tags on every post — og:title, og:description, og:image, canonical URL
- Static OG image — one branded fallback image for all posts
- Styled 404 page — playful but minimal, no nav

**What this phase does NOT include:**
- Full-text search (Phase 10 — Pagefind)
- Copy-to-clipboard on code blocks (Phase 10)
- Table of contents (Phase 10)
- Canvas backlink "See on timeline" (Phase 10)
- Manual dark/light toggle (not in v1.1 scope)
- Per-post dynamically generated OG images (deferred — static fallback is sufficient)

</domain>

<decisions>
## Implementation Decisions

### Navigation Header

- **D-01:** Nav is sticky — stays at top as user scrolls
- **D-02:** Nav uses glassmorphism backdrop blur (frosted glass floating bar effect) — consistent with Phase 8 rule that glassmorphism is allowed on floating/nav overlays
- **D-03:** Left side: wordmark/logo treatment — "Writing" in styled, heavier weight font (Noto Serif or Space Grotesk bold), links to blog index (`/`)
- **D-04:** Right side: single link to portfolio — `illulachy.me` — plain text, not a button
- **D-05:** Nav appears on all blog pages EXCEPT the 404 page

### Category & Tag Listing Pages

- **D-06:** Category pages at `/category/[name]` — same post list layout as the index page (`index.astro`) with a heading at the top (e.g., "Engineering")
- **D-07:** Tag pages at `/tag/[name]` — same layout treatment as category pages — identical design, just different heading (tag name)
- **D-08:** No post count in the heading — keep it clean (e.g., "Engineering" not "Engineering — 3 posts")
- **D-09:** Post cards on index and listing pages show category only (already implemented in PostCard.astro) — tags are NOT shown on cards
- **D-10:** Category and tag links on post cards (category pill) should link to their respective listing pages (currently they're static — make them clickable in this phase)

### OG / Meta Tags

- **D-11:** Each post page includes: `og:title` (post title), `og:description` (excerpt), `og:image` (static fallback), canonical URL `<link rel="canonical">`, `og:type: article`, `og:url`
- **D-12:** Static OG fallback image: dark background `#131313`, "Writing" wordmark, and `writing.illulachy.me` — generated as a static PNG asset committed to the repo. Claude creates this as an SVG converted to PNG, or a plain SVG served directly (Astro supports SVG as OG image if Twitter/LinkedIn accept it — otherwise PNG)
- **D-13:** OG image dimensions: 1200×630px (standard OG card size)
- **D-14:** BaseLayout.astro already has `<title>` — extend it with the full OG head block. PostLayout.astro passes post-specific title/excerpt; BaseLayout accepts optional `description` and `ogImage` props.

### RSS Feed

- **D-15:** RSS at `/rss.xml` — use Astro's `@astrojs/rss` package (official, zero config)
- **D-16:** Feed includes: title, date, excerpt (as description), and canonical URL per post — no full HTML content in the feed
- **D-17:** Feed metadata: title "Writing — illulachy.me", description "Thoughts on engineering, learning, and building.", link to `https://writing.illulachy.me`

### Sitemap

- **D-18:** Sitemap at `/sitemap.xml` — use `@astrojs/sitemap` Astro integration (official, auto-generates from static routes)
- **D-19:** Sitemap includes all post URLs and listing pages — standard priority/changefreq defaults

### 404 Page

- **D-20:** Slightly playful, minimal — a short witty line (e.g., "Nothing here. The page you're looking for doesn't exist.") with a single "← Back to writing" link
- **D-21:** No navigation header on 404 — stripped down, standalone page
- **D-22:** Uses same dark background and typography tokens as the rest of the blog — on-brand even without nav

### Claude's Discretion

- Exact wording of the 404 witty line
- Whether to use Astro's `404.astro` convention or a custom error page
- SVG vs PNG for the OG image asset (whichever is more reliably supported)
- Slug normalization for category/tag URLs (e.g., "Engineering" → "engineering", spaces → hyphens)
- Whether `@astrojs/rss` or manual endpoint is cleaner given the existing `import.meta.glob` pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `.stich/DESIGN.md` — Core design philosophy, color palette, "No-Line Rule", glassmorphism rules (allowed on floating/nav overlays)
- `.stich/visual/COMPONENTS.html` — Dark mode CSS token values
- `.stich/visual/COMPONENTS_LIGHT.html` — Light mode CSS token values

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 9 — Goal, success criteria, requirements TAX-01 through TAX-04, SEO-01 through SEO-04
- `.planning/REQUIREMENTS.md` §Taxonomy & Navigation, §SEO & Discovery — Full requirement definitions

### Existing Blog Code (Phase 8 output)
- `apps/blog/src/layouts/BaseLayout.astro` — Base HTML shell (extend with OG meta props)
- `apps/blog/src/layouts/PostLayout.astro` — Post page layout (passes title/excerpt to BaseLayout)
- `apps/blog/src/components/PostCard.astro` — Post card (category pill needs to become a link)
- `apps/blog/src/pages/index.astro` — Post list page (template for category/tag listing pages)
- `apps/blog/src/pages/[slug].astro` — Post detail page (extend with OG tags)
- `apps/blog/astro.config.ts` — Astro config (add sitemap integration here)
- `apps/blog/package.json` — Current deps (check before adding @astrojs/rss, @astrojs/sitemap)

### Content
- `packages/content/content/posts/` — All blog posts (frontmatter: title, date, excerpt, tags[], category)

### Prior Phase Context
- `.planning/phases/08-blog-foundation/08-CONTEXT.md` — Full Phase 8 decisions (design system, content model, glob pattern, layout decisions)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro` — accepts `title` prop today; extend to accept `description`, `ogImage`, `canonicalUrl` for Phase 9 OG block
- `PostCard.astro` — category pill already rendered as a `<span>`; change to `<a href="/category/{slug}">`
- `index.astro` — post list layout is the template for `/category/[name]` and `/tag/[name]` pages; can extract a shared `PostList` component or duplicate with minor heading change
- `import.meta.glob('../../../../packages/content/content/posts/**/*.md')` — established cross-workspace glob pattern; reuse exactly in listing pages

### Established Patterns
- Tailwind v4 `@theme` tokens from `.stich` — `surface-default`, `text-primary`, `text-secondary`, `interactive-default`, etc.
- No 1px borders — tonal surface shifts and negative space only
- Glassmorphism limited to floating overlays (nav qualifies)
- System preference dark/light with CSS `prefers-color-scheme` — no JS toggle

### Integration Points
- `astro.config.ts` — add `@astrojs/sitemap` to `integrations[]` array
- `apps/blog/public/` — place static OG image here (e.g., `og-default.png`)
- New pages to create: `src/pages/category/[category].astro`, `src/pages/tag/[tag].astro`, `src/pages/rss.xml.ts`, `src/pages/404.astro`

</code_context>

<specifics>
## Specific Ideas

**Nav glassmorphism:** `backdrop-blur` + semi-transparent `surface-default` background (e.g., `bg-surface-default/80`). Matches Phase 8's allowance for glassmorphism on floating/nav overlays.

**Wordmark treatment:** "Writing" in Space Grotesk 600 or Noto Serif semibold — heavier than body text, smaller than h1. Links to `/`.

**Category/tag slug normalization:** lowercase, spaces to hyphens — e.g., "Engineering" → `engineering`. Apply consistently in: PostCard link, listing page `getStaticPaths`, and RSS feed.

**RSS endpoint:** Astro supports `src/pages/rss.xml.ts` as an API endpoint using `@astrojs/rss`. It can reuse the same glob pattern from index.astro to get posts. Feed description item uses `excerpt` field.

**OG image:** Create `apps/blog/public/og-default.png` — 1200×630, dark `#131313` background, "Writing" in white Noto Serif, `writing.illulachy.me` in mauve/subtle below. Committed as a static asset.

**404 tone:** On-brand minimal with one dry/slightly-witty line. Something like: "This page doesn't exist. But the writing does." — exact wording is Claude's discretion.

</specifics>

<deferred>
## Deferred Ideas

- **Dynamic per-post OG images** — User confirmed static fallback is sufficient. Satori/resvg approach would generate unique images per post title. Defer to backlog if social sharing becomes a priority.
- **Tag pills on post cards** — Only category shown on cards. Tags are accessible via `/tag/[name]` URLs but not surfaced on cards.
- **Category nav links in header** — User chose portfolio link only in the nav (not category links). Could be revisited when there are more categories.
- **Subscribe/RSS link in nav** — Not discussed, not in scope.

</deferred>

---

*Phase: 09-discovery-and-seo*
*Context gathered: 2026-03-30*
