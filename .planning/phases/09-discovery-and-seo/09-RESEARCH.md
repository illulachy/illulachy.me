# Phase 9: Discovery and SEO — Research

**Researched:** 2026-03-30
**Domain:** Astro SSG — taxonomy pages, RSS feed, sitemap, OG meta tags, navigation, 404 page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Nav is sticky — stays at top as user scrolls
- **D-02:** Nav uses glassmorphism backdrop blur (frosted glass floating bar) — `surface-container-high` at 70% opacity, 20px backdrop-blur
- **D-03:** Left: "Writing" in Noto Serif or Space Grotesk bold, links to `/`
- **D-04:** Right: `illulachy.me` plain text link to `https://illulachy.me`
- **D-05:** Nav on all blog pages EXCEPT the 404 page
- **D-06:** Category pages at `/category/[name]` — same post-list layout as `index.astro`, heading at top
- **D-07:** Tag pages at `/tag/[name]` — identical design to category pages
- **D-08:** No post count in the heading
- **D-09:** Post cards show category only — tags NOT shown on cards
- **D-10:** Category pill on PostCard changes from `<span>` to `<a href="/category/{slug}">`
- **D-11:** Per-post OG meta: `og:title`, `og:description`, `og:image`, canonical URL, `og:type: article`, `og:url`
- **D-12:** Static OG fallback image: dark `#131313` bg, "Writing" wordmark, `writing.illulachy.me` — committed as PNG to `apps/blog/public/og-default.png`
- **D-13:** OG image dimensions: 1200×630px
- **D-14:** Extend `BaseLayout.astro` — accepts `description?`, `ogImage?`, `canonicalUrl?` props; PostLayout passes post-specific values
- **D-15:** RSS at `/rss.xml` via `@astrojs/rss` (official package)
- **D-16:** Feed: title, date, excerpt as description, canonical URL per post — no full HTML
- **D-17:** Feed metadata: title "Writing — illulachy.me", description "Thoughts on engineering, learning, and building.", link `https://writing.illulachy.me`
- **D-18:** Sitemap via `@astrojs/sitemap` integration (auto-generates from static routes)
- **D-19:** Sitemap standard priority/changefreq defaults
- **D-20:** 404: witty minimal line + single "← Back to writing" link
- **D-21:** No navigation on 404 page
- **D-22:** 404 uses same dark background and typography tokens

### Claude's Discretion

- Exact wording of the 404 witty line (UI-SPEC has locked this to: "This page doesn't exist. The writing does.")
- Whether to use Astro's `404.astro` convention or custom error page
- SVG vs PNG for OG image asset
- Slug normalization: lowercase, spaces to hyphens
- Whether `@astrojs/rss` or manual endpoint is cleaner given existing glob pattern

### Deferred Ideas (OUT OF SCOPE)

- Dynamic per-post OG images (Satori/resvg approach)
- Tag pills on post cards
- Category nav links in header
- Subscribe/RSS link in nav
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TAX-01 | User can browse posts by category via category listing pages | Dynamic route `[category].astro` using `getStaticPaths` + category slug normalization from existing glob |
| TAX-02 | User can browse posts by tag via tag listing pages | Dynamic route `[tag].astro` using same `getStaticPaths` pattern — tags array from frontmatter |
| TAX-03 | Blog has a navigation header linking to portfolio and blog index | New `Nav.astro` component with sticky glassmorphism, inserted into `BaseLayout.astro` |
| TAX-04 | Blog displays a styled 404 page for invalid URLs | `src/pages/404.astro` — Astro convention, no nav, centered layout |
| SEO-01 | RSS feed at /rss.xml with post titles, dates, excerpts, canonical URLs | `src/pages/rss.xml.ts` endpoint using `@astrojs/rss` + existing glob pattern |
| SEO-02 | Sitemap at /sitemap.xml listing all post URLs | `@astrojs/sitemap` integration in `astro.config.ts` — auto-generates from static routes |
| SEO-03 | Each post includes OG/meta tags for social sharing | Extend `BaseLayout.astro` props; `PostLayout.astro` passes post-specific values |
| SEO-04 | Each post includes a canonical URL link tag | Part of BaseLayout OG head block — `<link rel="canonical" href={canonicalUrl}>` |
</phase_requirements>

---

## Summary

Phase 9 adds discoverability infrastructure to the Astro blog built in Phase 8. All decisions are locked — the implementation is a set of mechanical additions to an already-working blog. No architectural changes are required; the existing glob-based content loading pattern, Tailwind v4 token system, and Astro static generation pipeline are all reused directly.

The two official Astro packages `@astrojs/rss@4.0.18` and `@astrojs/sitemap@3.7.2` handle the feed and sitemap without hand-rolled solutions. Both are zero-config for static sites with the `site` URL already set in `astro.config.ts` (`https://writing.illulachy.me`). The category and tag pages follow the exact same `import.meta.glob` + `getStaticPaths` pattern used in `[slug].astro` — the key implementation detail is slug normalization (lowercase + hyphens) applied consistently in four places: PostCard link, category `getStaticPaths`, tag `getStaticPaths`, and RSS feed canonical URLs.

The OG image is a static PNG asset created once and committed. The nav component is a new Astro component inserted into `BaseLayout.astro` via a slot or direct render. The 404 page uses Astro's built-in `404.astro` file convention.

**Primary recommendation:** Add both packages first, then implement in dependency order: Nav component → BaseLayout extension → category/tag pages → RSS endpoint → sitemap integration → 404 page → OG image asset.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/rss` | 4.0.18 | RSS feed endpoint generation | Official Astro package, integrates with `import.meta.glob` via `pagesGlobToRssItems` helper or manual array |
| `@astrojs/sitemap` | 3.7.2 | Auto-generate `/sitemap.xml` from static routes | Official Astro integration, zero-config when `site` is set in `astro.config.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind v4 `@illu/tokens` | current | All CSS styling via design tokens | Always — no raw hex values in component code |
| `import.meta.glob` | built-in Vite | Load all markdown posts at build time | Reused exactly from `index.astro` and `[slug].astro` |
| Astro `404.astro` convention | built-in | Custom 404 page | `src/pages/404.astro` — Astro automatically serves this for unmatched routes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/rss` | Manual `GET` endpoint with XML template string | Manual approach is viable with the existing glob pattern but skips built-in item sanitization and RFC compliance — no reason to hand-roll |
| `@astrojs/sitemap` | Manual `sitemap.xml.ts` endpoint | Requires knowing all routes at generation time — integration is automatic |
| PNG OG image | SVG served directly | Twitter/X does not reliably accept SVGs as OG images — PNG is the safe choice (HIGH confidence — documented Twitter Card validator behavior) |

**Installation (packages not yet in `apps/blog/package.json`):**
```bash
cd apps/blog && pnpm add @astrojs/rss @astrojs/sitemap
```

**Version verification (confirmed 2026-03-30):**
```
@astrojs/rss    → latest: 4.0.18
@astrojs/sitemap → latest: 3.7.2
```

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
apps/blog/src/
├── components/
│   └── Nav.astro                    # NEW — sticky glassmorphism header
├── pages/
│   ├── category/
│   │   └── [category].astro         # NEW — TAX-01 category listing
│   ├── tag/
│   │   └── [tag].astro              # NEW — TAX-02 tag listing
│   ├── rss.xml.ts                   # NEW — SEO-01 RSS feed endpoint
│   └── 404.astro                    # NEW — TAX-04 styled 404 page
└── layouts/
    ├── BaseLayout.astro             # MODIFIED — add OG/meta props + Nav
    └── PostLayout.astro             # MODIFIED — pass description/canonicalUrl to BaseLayout

apps/blog/public/
└── og-default.png                   # NEW — SEO-03 static OG fallback image (1200×630)

apps/blog/astro.config.ts            # MODIFIED — add sitemap integration
```

### Pattern 1: Astro `getStaticPaths` for taxonomy pages

**What:** Collect all unique category/tag values from post frontmatter at build time, emit one route per value.

**When to use:** Any dynamic route that must pre-generate pages from content metadata.

```typescript
// Source: Astro docs — getStaticPaths
// apps/blog/src/pages/category/[category].astro
export async function getStaticPaths() {
  const postModules = import.meta.glob(
    '../../../../../packages/content/content/posts/**/*.md',
    { eager: true }
  )

  const allPosts = Object.entries(postModules).map(([path, mod]: [string, any]) => ({
    slug: path.split('/').pop()!.replace('.md', ''),
    frontmatter: mod.frontmatter,
    readingTime: calcReadingTime(mod.rawContent?.() ?? ''),
  })).filter(p => p.frontmatter?.title)

  // Collect unique categories with normalized slugs
  const categories = [...new Set(
    allPosts
      .map(p => p.frontmatter.category)
      .filter(Boolean)
  )]

  return categories.map(category => ({
    params: { category: category.toLowerCase().replace(/\s+/g, '-') },
    props: {
      categoryName: category,
      posts: allPosts
        .filter(p => p.frontmatter.category === category)
        .sort((a, b) =>
          new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
        ),
    },
  }))
}
```

**Note on glob path depth:** `[slug].astro` uses 4 levels (`../../../../`). `category/[category].astro` is one level deeper inside `pages/category/`, so the path requires 5 levels (`../../../../../`). Verify this at implementation — Phase 8 confirmed the 4-level depth from `src/pages/` directly.

### Pattern 2: Tag listing (same shape, tags array instead of category string)

```typescript
// apps/blog/src/pages/tag/[tag].astro — key difference from category
const allTags = [...new Set(
  allPosts.flatMap(p => p.frontmatter.tags ?? [])
)]

return allTags.map(tag => ({
  params: { tag: tag.toLowerCase().replace(/\s+/g, '-') },
  props: {
    tagName: tag,
    posts: allPosts.filter(p =>
      (p.frontmatter.tags ?? [])
        .map((t: string) => t.toLowerCase().replace(/\s+/g, '-'))
        .includes(tag.toLowerCase().replace(/\s+/g, '-'))
    ).sort(...)
  },
}))
```

### Pattern 3: RSS endpoint with `@astrojs/rss`

```typescript
// Source: @astrojs/rss official docs
// apps/blog/src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const postModules = import.meta.glob(
    '../../../../packages/content/content/posts/**/*.md',
    { eager: true }
  )

  const posts = Object.entries(postModules)
    .map(([path, mod]: [string, any]) => ({
      slug: path.split('/').pop()!.replace('.md', ''),
      ...mod.frontmatter,
    }))
    .filter(p => p.title)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return rss({
    title: 'Writing — illulachy.me',
    description: 'Thoughts on engineering, learning, and building.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.title,
      pubDate: new Date(post.date),
      description: post.excerpt,
      link: `/${post.slug}/`,
    })),
  })
}
```

### Pattern 4: Sitemap integration

```typescript
// apps/blog/astro.config.ts — add sitemap integration
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://writing.illulachy.me',  // already set
  integrations: [sitemap()],             // add this
  vite: { plugins: [tailwindcss()] },
  markdown: { /* unchanged */ },
})
```

`@astrojs/sitemap` automatically discovers all static routes including `/category/*` and `/tag/*` pages when `site` is set. No additional configuration needed for standard priority/changefreq defaults.

### Pattern 5: BaseLayout OG head extension

```astro
---
// apps/blog/src/layouts/BaseLayout.astro — extended
interface Props {
  title?: string
  description?: string
  ogImage?: string
  canonicalUrl?: string
}
const {
  title = 'Writing — illulachy.me',
  description = 'Thoughts on engineering, learning, and building.',
  ogImage = '/og-default.png',
  canonicalUrl,
} = Astro.props
---
<head>
  <!-- existing meta -->
  <title>{title}</title>
  <!-- OG block (SEO-03, SEO-04) -->
  <meta name="description" content={description} />
  {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content="article" />
  {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
  <!-- RSS autodiscovery -->
  <link rel="alternate" type="application/rss+xml" title="Writing — illulachy.me" href="/rss.xml" />
</head>
```

**PostLayout.astro must pass canonicalUrl:** Construct from `Astro.site` + post slug.
```astro
const canonicalUrl = `https://writing.illulachy.me/${frontmatter.slug ?? slug}/`
```

Since `[slug].astro` parses raw markdown via gray-matter (not Astro Content Collections), the slug comes from the file path. PostLayout receives the slug via a new prop added in this phase, or PostLayout infers it from `Astro.url.pathname`.

**Simplest approach:** Use `Astro.url.href` as canonical URL inside PostLayout — Astro sets this correctly based on `site` in the config.

### Pattern 6: Nav component

```astro
---
// apps/blog/src/components/Nav.astro
// No props needed — static content
---
<nav class="sticky top-0 z-[200] flex items-center justify-between px-8 py-3
            backdrop-blur-[20px] bg-surface-container-high/70
            shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
  <a href="/"
     class="font-heading font-semibold text-xl tracking-tight text-text-primary
            hover:text-interactive-default transition-colors duration-150">
    Writing
  </a>
  <a href="https://illulachy.me"
     class="font-body text-base text-text-secondary
            hover:text-interactive-default transition-colors duration-150">
    illulachy.me
  </a>
</nav>
```

Insert into `BaseLayout.astro` before `<slot />`. The 404 page bypasses `BaseLayout` — it's a standalone page (see Anti-Patterns).

### Anti-Patterns to Avoid

- **Using the wrong glob depth in subdirectory pages:** `[category].astro` lives one level deeper than `index.astro`. The glob path requires one additional `../` segment. Failure mode: build-time `ENOENT` or empty post list.
- **Not normalizing slugs consistently:** Category "Engineering" must map to slug "engineering" in PostCard links, `getStaticPaths`, AND in any URL comparisons. Using raw frontmatter values in one place and normalized slugs in another creates 404s on category links.
- **Astro `og:type` on non-post pages:** Set `og:type` to `"website"` on index/listing pages and `"article"` only on post pages. The default in BaseLayout should be `"website"` with PostLayout overriding to `"article"`.
- **Including nav in 404 by importing BaseLayout with nav slot:** 404 page must NOT use `BaseLayout` or must use a stripped variant. Create `src/pages/404.astro` as a fully self-contained page with its own `<html>` shell (or use a `BaseLayoutMinimal` without nav), per D-21.
- **Sitemap missing taxonomy pages:** `@astrojs/sitemap` discovers pages automatically from static routes — category/tag pages must be implemented before the sitemap integration runs at build time. Order matters: create pages first, then add sitemap.
- **RSS `context.site` being undefined:** `context.site` is `undefined` if `site` is not set in `astro.config.ts`. This is already set (`https://writing.illulachy.me`) — verify it remains after config modification to add sitemap.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS feed XML generation | Manual XML template string with escaping | `@astrojs/rss` | Handles XML escaping, RFC 2822 date formatting, CDATA wrapping for descriptions with special chars |
| Sitemap XML | Manual `sitemap.xml.ts` with hardcoded URLs | `@astrojs/sitemap` | Automatically discovers all static routes — would require manual update every time a new category/tag page is added |
| OG image generation | Satori + resvg + serverless function | Static PNG committed to `public/` | Per-post dynamic images are explicitly deferred. Static asset is simpler and loads faster |

**Key insight:** Both `@astrojs/rss` and `@astrojs/sitemap` are official Astro packages maintained by the core team. They handle edge cases (encoding, date formats, route discovery) that manual implementations frequently miss.

---

## Common Pitfalls

### Pitfall 1: Glob path depth mismatch in subdirectory pages

**What goes wrong:** Category and tag pages live at `src/pages/category/[category].astro` — one directory level deeper than `index.astro`. Using the same 4-level glob path (`../../../../packages/...`) resolves incorrectly from the subdirectory.

**Why it happens:** `import.meta.glob` paths are relative to the file — not to `src/pages/`. The extra `category/` directory in the file path means one more `../` is needed.

**How to avoid:** Use 5 levels (`../../../../../packages/content/content/posts/**/*.md`) in listing pages. Write a unit test that imports the glob count and asserts `> 0`.

**Warning signs:** Empty post list on category/tag pages at build time; no `getStaticPaths` entries generated.

### Pitfall 2: Category pill link creates click-to-navigate inside a card that is itself a link

**What goes wrong:** `PostCard.astro` wraps the entire article in `<a href="/{slug}">`. Adding `<a href="/category/{slug}">` for the category pill creates nested `<a>` tags — invalid HTML, broken click behavior in some browsers.

**Why it happens:** The card link wraps all content including the metadata row where the category pill lives.

**How to avoid:** Remove the outer card `<a>` wrapper from PostCard and instead make only the title a link. Or use `e.stopPropagation()` on the inner link. Looking at the existing `PostCard.astro` — the outer `<a>` wraps the entire article block. The simplest fix is to move the outer anchor to wrap only the title/excerpt, leaving the metadata row outside.

**Warning signs:** Browser console HTML validation warning about nested anchors; clicking category pill navigates to post instead.

### Pitfall 3: RSS feed breaks with special characters in frontmatter

**What goes wrong:** Post titles or excerpts containing `&`, `<`, `>`, or quotes cause malformed XML.

**Why it happens:** RSS is XML — content must be escaped.

**How to avoid:** `@astrojs/rss` handles escaping automatically for string fields. Do NOT pass pre-rendered HTML (set `content` field only if using HTML; `description` field for plain text excerpt is safe).

**Warning signs:** RSS validator reports "not well-formed XML"; feed readers show blank or broken entries.

### Pitfall 4: `@astrojs/sitemap` not including taxonomy pages

**What goes wrong:** Sitemap only lists `/` and individual post URLs; category/tag pages missing.

**Why it happens:** `@astrojs/sitemap` traces static routes — if category/tag pages are not implemented before running the build that generates the sitemap, they won't appear.

**How to avoid:** Ensure category/tag pages are created and working before adding sitemap integration. Build and inspect the output `dist/sitemap-*.xml` to verify.

**Warning signs:** `dist/sitemap-0.xml` has fewer URLs than expected; `curl https://writing.illulachy.me/sitemap.xml | grep category` returns empty.

### Pitfall 5: OG image path is absolute vs relative

**What goes wrong:** Setting `og:image` to `/og-default.png` works locally but social crawlers (Twitter, LinkedIn) need a fully qualified URL (`https://writing.illulachy.me/og-default.png`).

**Why it happens:** OG spec requires absolute URLs for `og:image`.

**How to avoid:** Construct the absolute URL using `Astro.site`: `new URL('/og-default.png', Astro.site).href`. This resolves to `https://writing.illulachy.me/og-default.png` correctly.

**Warning signs:** Twitter Card Validator shows no image preview despite tag being present; LinkedIn debugger reports "invalid image URL".

### Pitfall 6: 404 page body content area needs top padding adjustment when nav is absent

**What goes wrong:** The 404 page without nav has no element consuming the top of the viewport — if other pages add top padding to account for the sticky nav height, the 404 page layout looks off-center.

**Why it happens:** Sticky nav takes 56px at the top of all other pages, shifting content down. 404 page is standalone with vertically centered content.

**How to avoid:** The 404 page uses `min-h-screen flex flex-col items-center justify-center` with no nav — centering is absolute, not relative to nav height. This is already correct per UI-SPEC.

---

## Code Examples

### Slug normalization utility (reuse in 3 places)

```typescript
// Apply consistently in: PostCard.astro, [category].astro, [tag].astro
function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-')
}
```

### RSS endpoint with existing glob pattern

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const postModules = import.meta.glob(
    '../../../../packages/content/content/posts/**/*.md',
    { eager: true }
  )
  const posts = Object.entries(postModules)
    .map(([path, mod]: [string, any]) => ({
      slug: path.split('/').pop()!.replace('.md', ''),
      title: mod.frontmatter?.title,
      date: mod.frontmatter?.date,
      excerpt: mod.frontmatter?.excerpt ?? '',
    }))
    .filter(p => p.title)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return rss({
    title: 'Writing — illulachy.me',
    description: 'Thoughts on engineering, learning, and building.',
    site: context.site!,
    items: posts.map(p => ({
      title: p.title,
      pubDate: new Date(p.date),
      description: p.excerpt,
      link: `/${p.slug}/`,
    })),
  })
}
```

### Canonical URL from Astro.url (simplest approach)

```astro
---
// In PostLayout.astro — uses the request URL set by Astro
const canonicalUrl = Astro.url.href
---
<BaseLayout
  title={pageTitle}
  description={frontmatter.excerpt}
  ogImage={new URL('/og-default.png', Astro.site).href}
  canonicalUrl={canonicalUrl}
>
```

### OG image absolute URL construction

```astro
// In BaseLayout.astro — absolute URL for social crawlers
const ogImageAbsolute = ogImage.startsWith('http')
  ? ogImage
  : new URL(ogImage, Astro.site).href
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/rss` `pagesGlobToRssItems` helper | Manual `items` array construction | rss v3+ | `pagesGlobToRssItems` works with Astro Content Collections; glob pattern used here returns raw modules not compatible with that helper — use manual mapping instead |
| Astro `pages/sitemap.xml.ts` manual | `@astrojs/sitemap` integration | Astro 2+ | Integration is zero-config and auto-discovers all routes |
| Hardcoded OG tags per page | BaseLayout prop-based OG block | — | Centralizes OG logic; each layout passes its own values |

**Deprecated/outdated:**
- `pagesGlobToRssItems`: Works with Astro Content Collections, NOT with raw `import.meta.glob` returning module objects. The blog uses the glob pattern (not Content Collections) — do NOT use `pagesGlobToRssItems` here.

---

## Environment Availability

Step 2.6: SKIPPED — this phase adds new source files and two npm packages. No external services, databases, CLI tools, or OS-level registrations are required beyond the existing pnpm + Node.js toolchain already in use.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm build | ✓ | v20.12.2 | — |
| pnpm | Package install | ✓ | present | — |
| `@astrojs/rss` | SEO-01 | ✗ (not installed) | 4.0.18 | None — must install |
| `@astrojs/sitemap` | SEO-02 | ✗ (not installed) | 3.7.2 | None — must install |

**Missing dependencies with no fallback:**
- `@astrojs/rss@4.0.18` — install via `pnpm add @astrojs/rss` in `apps/blog`
- `@astrojs/sitemap@3.7.2` — install via `pnpm add @astrojs/sitemap` in `apps/blog`

---

## Validation Architecture

nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `apps/blog/vitest.config.ts` |
| Quick run command | `cd apps/blog && pnpm test` |
| Full suite command | `cd apps/blog && pnpm test` |

Existing tests: `reading-time.test.ts`, `sort.test.ts`, `glob-resolution.test.ts` — all unit-level, run in < 5s.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAX-01 | Category pages generate correct slugs from frontmatter | unit | `cd apps/blog && pnpm test -- src/test/taxonomy.test.ts` | ❌ Wave 0 |
| TAX-02 | Tag pages generate correct slugs from tags array | unit | `cd apps/blog && pnpm test -- src/test/taxonomy.test.ts` | ❌ Wave 0 |
| TAX-03 | Nav renders on non-404 pages / absent on 404 | manual-only | Visual inspection — Astro component rendering not testable in Vitest without browser | — |
| TAX-04 | 404 page renders for invalid routes | manual-only | `pnpm build && pnpm preview` — navigate to `/nonexistent` | — |
| SEO-01 | RSS feed item shape (title, date, description, link) | unit | `cd apps/blog && pnpm test -- src/test/rss.test.ts` | ❌ Wave 0 |
| SEO-02 | Sitemap generated (integration test) | manual-only | `pnpm build && cat apps/blog/dist/sitemap-*.xml` | — |
| SEO-03 | OG meta tags present on post pages | manual-only | Build + inspect HTML output or use `curl` on preview URL | — |
| SEO-04 | Canonical URL link present and correct | unit | Covered by rss.test.ts (URL construction logic) | ❌ Wave 0 |

**Manual-only justifications:**
- TAX-03, TAX-04: Require full Astro SSG build + browser navigation — not viable in sub-30s unit test
- SEO-02: Sitemap is an integration artifact — requires `astro build` to verify
- SEO-03: OG tag rendering requires rendered HTML output from full build

### Sampling Rate

- **Per task commit:** `cd apps/blog && pnpm test`
- **Per wave merge:** `cd apps/blog && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/blog/src/test/taxonomy.test.ts` — covers TAX-01, TAX-02: `slugify()` function, `getStaticPaths` category/tag extraction logic
- [ ] `apps/blog/src/test/rss.test.ts` — covers SEO-01, SEO-04: RSS item mapping (title, pubDate, description, link), canonical URL construction

*(Existing `glob-resolution.test.ts` may partially cover the content-loading aspect — verify before creating duplicates.)*

---

## Open Questions

1. **PostCard nested anchor issue**
   - What we know: `PostCard.astro` wraps the entire article in `<a href="/{slug}">`. The category pill must become `<a href="/category/{slug}">`.
   - What's unclear: Whether the implementation should restructure the card HTML (only title as link) or use `e.stopPropagation()` on the inner link.
   - Recommendation: Restructure the card so only the heading is the outer link. Keep the metadata row outside the anchor — this also improves accessibility (screen readers won't announce the entire card as a single link).

2. **OG image creation method**
   - What we know: Must be 1200×630 PNG. Design: `#131313` bg, "Writing" in white Noto Serif, `writing.illulachy.me` in mauve below.
   - What's unclear: How to generate the PNG without Figma or a browser. Options: (a) create as SVG and convert with `sharp` or `svgexport`, (b) use a Node canvas script, (c) create inline as a base64-encoded minimal SVG then convert.
   - Recommendation: Claude's discretion per CONTEXT.md — create a Node.js script using `sharp` (if available) or hand-author a minimal SVG and convert. If no conversion tool is available, commit an SVG and note that PNG conversion can be done by the developer before deployment. Twitter accepts PNG most reliably.

3. **`Astro.url.href` vs manual URL construction for canonical**
   - What we know: `Astro.url` contains the full URL including protocol/host when `site` is set and during build.
   - What's unclear: Behavior during `astro dev` — `Astro.url.href` would return `http://localhost:4321/...` instead of the production URL.
   - Recommendation: Use `new URL(Astro.url.pathname, Astro.site).href` — this always uses the `site` config value for the origin, giving the correct production canonical URL even during dev.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md does not exist in the working directory. No project-level directives to enforce beyond what is documented in CONTEXT.md and DESIGN.md.

The following constraints are extracted from existing project documentation and must be treated as equivalent to CLAUDE.md directives:

- **No 1px borders** — No-Line Rule from `.stich/DESIGN.md`. Use tonal surface shifts or negative space only.
- **No raw hex values in component code** — Use `@illu/tokens` CSS custom properties (`--color-surface-default`, `--color-interactive-default`, etc.) via Tailwind token classes.
- **No `prefers-color-scheme` in `@theme` blocks** — Phase 8 hard-won lesson. Use `:root` overrides in media queries for light mode; do not nest theme inside `@media`.
- **Glassmorphism only on floating/nav overlays** — Confirmed by DESIGN.md §Signature Textures: `surface-container-high` at 70% opacity, `backdrop-blur: 20px`.
- **Astro 6.x (^6.1.1) + Tailwind v4** — Do not use Astro Content Collections APIs (different from the glob pattern in use). Do not use Tailwind v3 syntax.
- **pnpm workspace** — `pnpm add` from `apps/blog/`, not root. `workspace:*` for internal packages.
- **`import.meta.glob` with `eager: true`** — Established pattern for cross-workspace content loading. The 4-level depth from `src/pages/` (5 from subdirectories) is validated.
- **`.shiki` class alongside `.astro-code`** — Both classes must be styled in `global.css` for syntax highlighting to work.

---

## Sources

### Primary (HIGH confidence)
- `apps/blog/src/layouts/BaseLayout.astro` — Current props interface (title only), confirmed needs extension
- `apps/blog/src/components/PostCard.astro` — Nested anchor structure confirmed; category pill is a `<span>` today
- `apps/blog/src/pages/index.astro` — Glob pattern, post shape, list layout — template for listing pages
- `apps/blog/src/pages/[slug].astro` — `getStaticPaths` with raw glob, canonical pattern for taxonomy pages
- `apps/blog/astro.config.ts` — `site` already set; `integrations[]` array missing — add sitemap here
- `apps/blog/package.json` — Neither `@astrojs/rss` nor `@astrojs/sitemap` present; both must be added
- `apps/blog/vitest.config.ts` — Vitest config with globals; test framework in place
- `packages/tokens/src/tokens.css` — Full token definitions confirmed

### Secondary (MEDIUM confidence)
- `npm view @astrojs/rss version` → 4.0.18 (verified 2026-03-30)
- `npm view @astrojs/sitemap version` → 3.7.2 (verified 2026-03-30)
- `.planning/phases/09-discovery-and-seo/09-UI-SPEC.md` — Full visual/copy contract already authored; all component specs locked
- `.planning/STATE.md` — Astro 6.x decisions, glob pattern decisions, Tailwind v4 @theme constraints

### Tertiary (LOW confidence)
- `pagesGlobToRssItems` deprecation for non-Content-Collections usage — inferred from API signature inspection; would require testing to confirm 100%

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both packages verified via npm registry 2026-03-30; API patterns from existing code
- Architecture: HIGH — all patterns derived from existing working Phase 8 code; taxonomy page pattern is a direct extension of `[slug].astro` `getStaticPaths`
- Pitfalls: HIGH for glob depth and nested anchor (code inspection confirms both); MEDIUM for OG image absolute URL (common issue, documented behavior)

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (Astro integrations are stable; patterns are locked by existing Phase 8 code)
