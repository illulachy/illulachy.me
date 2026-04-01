# Phase 10: Search and Extras - Research

**Researched:** 2026-04-01
**Domain:** Pagefind static search, clipboard API, rehype heading extraction, IntersectionObserver ToC, Astro build integration
**Confidence:** HIGH

## Summary

Phase 10 adds four reader-experience features to the existing Astro blog: Pagefind static search, copy-to-clipboard on code blocks, a sticky table of contents sidebar, and a canvas backlink. All four are self-contained additions — no new runtime infrastructure, no backend. The blog currently uses a custom unified + rehype pipeline (not Astro Content Collections) with Tailwind v4 and Stitch design tokens. This context shapes every technical decision.

Pagefind 1.4.0 (confirmed current via npm) runs as a CLI binary post-build against the `dist/` folder. The JavaScript API (`/pagefind/pagefind.js`) is loaded dynamically on the client — this is the correct approach for the custom-styled, no-default-CSS implementation decided in D-02/D-03. The copy button and ToC are both client-side JavaScript attached to server-rendered HTML. The canvas backlink is pure build-time data matching: post slug extracted from filename vs. `url` field in yearly-directory `.md` files (the timeline source of truth).

The single technical complexity worth highlighting: heading IDs for ToC jump links require `rehype-slug` added to the `[slug].astro` unified pipeline (not the Astro config markdown pipeline, which doesn't apply to raw-string processing). Pagefind indexes the `dist/` output, so heading IDs added by rehype-slug will be present in the index — both purposes served by one plugin addition.

**Primary recommendation:** Add `rehype-slug` to the unified pipeline in `[slug].astro`, run `pagefind --site dist` as the `postbuild` script, use the Pagefind JS API with a custom Astro component for search, and drive both copy button and ToC via `<script>` tags in PostLayout.astro.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Search (SRCH-01)**
- D-01: Search entry point is a search bar prominently displayed on the blog index page, below the header — not in the Nav, not a dedicated `/search` page
- D-02: Custom Stitch-styled UI — dark `surface-container` background, mauve highlight/accent, matches blog aesthetic exactly. Do NOT use Pagefind's default CSS; build custom result rendering using Pagefind's JavaScript API
- D-03: Pagefind 1.4.x (decided in STATE.md) — WASM query, zero server required, build-time index generation via `pagefind` binary after `astro build`

**Copy Button (SRCH-02)**
- D-04: Copy button is hover-to-reveal — appears when the user hovers the code block, hidden at rest
- D-05: Feedback is icon swap — copy icon briefly becomes a checkmark icon, then resets after ~2 seconds. No toast or text label change
- D-06: Button positioned top-right corner of the code block (floating over the pre element)

**Table of Contents (SRCH-03)**
- D-07: Sticky sidebar — fixed to the right of the 65ch prose column on desktop, stays visible as user scrolls
- D-08: Includes h2 and h3 — two levels of depth. h3 entries are indented under their parent h2
- D-09: Hidden entirely on mobile — ToC only renders on desktop (no collapsible inline version)
- D-10: Headings are extracted from rendered post content and each gets an `id` anchor for jump links

**Canvas Backlink (SRCH-04)**
- D-11: Simple link to `https://illulachy.me` — no query params, no deep-linking
- D-12: Link appears in both the post header (near title/metadata) and the post footer (alongside "Browse all posts")
- D-13: Only show the backlink on posts that have a matching timeline entry — post slug matches a timeline entry `url` that points to `writing.illulachy.me/[slug]`
- D-14: Link text: "See on timeline ↗" — minimal, consistent with blog's typographic tone

### Claude's Discretion

- Pagefind build integration method (postbuild script in `package.json` vs Vite plugin vs Astro integration)
- Whether copy button uses inline SVG icons or a lightweight icon library already in the project
- How to extract headings for ToC (rehype plugin at build time vs client-side DOM query)
- Exact mechanism for matching post slug to timeline entry (filename comparison vs URL field matching)
- Whether ToC uses `IntersectionObserver` to highlight the active heading as the user scrolls

### Deferred Ideas (OUT OF SCOPE)

- Deep-link canvas navigation (`illulachy.me?node=slug`) — user chose simple homepage link
- Per-post dynamic OG images — already deferred in Phase 9
- Dark/light toggle — not in v1.1 scope
- Comments, newsletter, or other engagement features
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | User can search blog posts via Pagefind (static build-time index, WASM query) | Pagefind 1.4.0 JS API, postbuild pattern, custom UI component pattern |
| SRCH-02 | Code blocks have a copy-to-clipboard button | Clipboard API, hover CSS + `<script>` in PostLayout, existing `.astro-code`/`.shiki` selectors |
| SRCH-03 | Long posts display a table of contents generated from headings | rehype-slug in unified pipeline, client-side DOM query pattern, IntersectionObserver active state |
| SRCH-04 | Each blog post links back to its position on the canvas timeline | Timeline `.md` files in yearly dirs have `url` field matching `writing.illulachy.me/[slug]`; slug extracted from filename |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pagefind | 1.4.0 (confirmed npm) | Build-time search index + WASM client query | Zero-server, static-site native; decided in STATE.md |
| rehype-slug | 6.0.0 (confirmed npm) | Add `id` attributes to headings in unified pipeline | Standard rehype plugin; enables both ToC anchors and Pagefind section indexing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hast-util-to-string | 3.0.1 (confirmed npm) | Extract text from hast nodes (heading labels) | Needed if heading text is extracted at build time via custom rehype plugin |
| Clipboard API | Browser native | `navigator.clipboard.writeText()` | Use for copy button; no library needed |
| IntersectionObserver | Browser native | Active heading highlighting in ToC | Well-supported; no library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| postbuild npm script | astro-pagefind integration | astro-pagefind adds default UI assets; postbuild is simpler and matches D-02 (custom UI only) |
| rehype-slug in unified pipeline | Client-side DOM ID injection | Build-time is more reliable; IDs present in Pagefind index for section search |
| IntersectionObserver for ToC active state | Scroll event listener | IntersectionObserver is more performant and simpler |
| Inline SVG for copy icons | Heroicons / Lucide | Project has no existing icon library; two SVG paths inline is simplest |

**Installation:**
```bash
# From apps/blog/
pnpm add rehype-slug
# pagefind runs via npx (no install needed) or installed as devDependency:
pnpm add -D pagefind
```

**Version verification:** pagefind@1.4.0 and rehype-slug@6.0.0 confirmed against npm registry on 2026-04-01.

---

## Architecture Patterns

### Recommended Project Structure
```
apps/blog/
├── src/
│   ├── components/
│   │   ├── SearchBar.astro       # NEW: Pagefind JS API custom UI
│   │   ├── TableOfContents.astro # NEW: ToC sidebar (rendered server-side, activated client-side)
│   │   └── Nav.astro             # existing — unchanged
│   ├── layouts/
│   │   └── PostLayout.astro      # MODIFIED: add ToC sidebar grid, copy button script, backlink
│   ├── pages/
│   │   └── index.astro           # MODIFIED: add SearchBar component below header
│   └── lib/
│       └── timeline-match.ts     # NEW: slug-to-timeline-entry matching utility
├── astro.config.ts               # unchanged
└── package.json                  # MODIFIED: postbuild script
```

### Pattern 1: Pagefind Postbuild Integration

**What:** Run pagefind CLI after `astro build` to generate the search index in `dist/`.
**When to use:** Always for static Astro sites using Pagefind without default UI.

```json
// apps/blog/package.json — add postbuild script
{
  "scripts": {
    "build": "astro build",
    "postbuild": "pagefind --site dist"
  }
}
```

The `postbuild` hook runs automatically after `npm/pnpm run build` completes. `pagefind --site dist` crawls the HTML in `dist/`, generates `dist/pagefind/pagefind.js` and the WASM index bundle.

### Pattern 2: Pagefind JS API Custom UI

**What:** Import Pagefind's JS file dynamically in a client-side `<script>` inside an Astro component. Render results with custom HTML/CSS using Stitch tokens.
**When to use:** Any time the default Pagefind UI CSS is not used (D-02).

```astro
<!-- SearchBar.astro -->
---
// Server-rendered shell — no props needed
---
<div class="search-container bg-surface-container rounded-md px-4 py-3">
  <input
    id="search-input"
    type="search"
    placeholder="Search posts..."
    class="w-full bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
    aria-label="Search posts"
    autocomplete="off"
  />
  <div id="search-results" class="mt-4 flex flex-col gap-3" aria-live="polite"></div>
</div>

<script>
  // Dynamic import — pagefind.js only exists in dist/, not during dev
  const pagefind = await import('/pagefind/pagefind.js').catch(() => null)
  if (!pagefind) return // dev mode: search not available

  const input = document.getElementById('search-input') as HTMLInputElement
  const results = document.getElementById('search-results')!

  input.addEventListener('input', async () => {
    const query = input.value.trim()
    if (!query) { results.innerHTML = ''; return }

    const search = await pagefind.debouncedSearch(query)
    if (!search) return

    const loaded = await Promise.all(search.results.slice(0, 8).map(r => r.data()))
    results.innerHTML = loaded.map(r => `
      <a href="${r.url}" class="block text-text-primary hover:text-interactive-default transition-colors">
        <div class="font-heading font-semibold">${r.meta?.title ?? ''}</div>
        <div class="text-sm text-text-secondary mt-1">${r.excerpt}</div>
      </a>
    `).join('')
  })
</script>
```

**Key detail:** `/pagefind/pagefind.js` is a path-absolute URL that resolves to `dist/pagefind/pagefind.js` at runtime. During `astro dev`, this file does not exist — the `.catch(() => null)` guard prevents errors. Pagefind's `debouncedSearch()` already debounces; use it instead of `search()` for input events.

**Result data object fields (from official docs):**
- `url` — page URL string
- `excerpt` — HTML snippet with `<mark>` tags around matched terms
- `meta.title` — page title (from `<title>` or `data-pagefind-meta` attributes)
- `sub_results` — array of section-level matches within the page

### Pattern 3: rehype-slug in Custom Unified Pipeline

**What:** Add `rehypeSlug` to the existing unified processor in `[slug].astro`. This adds `id` attributes to all `<h1>`–`<h6>` elements using the GitHub slugger algorithm (e.g., "My Heading" → `id="my-heading"`).
**When to use:** Any time heading anchors or ToC jump links are needed.

```typescript
// apps/blog/src/pages/[slug].astro — processor chain
import rehypeSlug from 'rehype-slug'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)                   // ADD: generates heading id attributes
  .use(rehypeShiki, { themes: { light: illuLight, dark: illuDark } })
  .use(rehypeStringify, { allowDangerousHtml: true })
```

`rehype-slug` must come BEFORE `rehypeStringify` and AFTER `remarkRehype` (needs an hast tree). Order relative to `rehypeShiki` does not matter since Shiki only touches `<pre><code>` elements.

### Pattern 4: Client-Side ToC Generation

**What:** After rehype-slug adds IDs server-side, extract headings client-side via `querySelectorAll` and build the ToC list dynamically. This avoids serializing heading data through Astro props.
**When to use:** ToC for posts rendered with `Fragment set:html={html}` — the HTML is opaque to Astro at component level.

```astro
<!-- TableOfContents.astro — renders an empty shell; script populates it -->
<aside id="toc-sidebar" class="hidden xl:block sticky top-24 w-56 shrink-0 self-start">
  <p class="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">
    On this page
  </p>
  <nav id="toc-nav" aria-label="Table of contents">
    <!-- Populated by script below -->
  </nav>
</aside>

<script>
  const article = document.querySelector('article .prose')
  const tocNav = document.getElementById('toc-nav')
  if (!article || !tocNav) return

  const headings = Array.from(article.querySelectorAll('h2, h3'))
  if (headings.length < 2) {
    document.getElementById('toc-sidebar')?.remove()
    return
  }

  tocNav.innerHTML = headings.map(h => {
    const level = h.tagName.toLowerCase()
    const indent = level === 'h3' ? 'ml-3' : ''
    return `<a href="#${h.id}" data-toc-link="${h.id}"
              class="${indent} block text-sm text-text-tertiary hover:text-text-primary
                     transition-colors py-1 leading-snug toc-link">
              ${h.textContent}
            </a>`
  }).join('')

  // IntersectionObserver for active heading highlight
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = tocNav.querySelector(`[data-toc-link="${entry.target.id}"]`)
      if (entry.isIntersecting) {
        tocNav.querySelectorAll('.toc-link').forEach(l => l.classList.remove('text-interactive-default'))
        link?.classList.add('text-interactive-default')
      }
    })
  }, { rootMargin: '-10% 0% -80% 0%' })

  headings.forEach(h => observer.observe(h))
</script>
```

**ToC suppression:** If fewer than 2 headings are found, the sidebar is removed — no empty box on short posts.

### Pattern 5: Copy Button on Code Blocks

**What:** Add a `<button>` element to each `<pre>` block via a client-side script. CSS handles hover-reveal. Clipboard API copies the `<code>` text content. Icon swap gives feedback.
**When to use:** Injected after page load since code blocks are rendered server-side.

```astro
<!-- Inside PostLayout.astro <script> -->
<script>
  document.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code')
    if (!code) return

    const btn = document.createElement('button')
    btn.innerHTML = `<!-- copy SVG icon -->`
    btn.className = 'copy-btn absolute top-2 right-2 p-1.5 rounded opacity-0 transition-opacity duration-150 bg-surface-container-high text-text-tertiary hover:text-text-primary'
    btn.setAttribute('aria-label', 'Copy code')

    pre.style.position = 'relative'
    pre.appendChild(btn)

    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(code.innerText)
      btn.innerHTML = `<!-- checkmark SVG icon -->`
      setTimeout(() => { btn.innerHTML = `<!-- copy SVG icon -->` }, 2000)
    })
  })
</script>
```

CSS for hover-reveal in `global.css`:
```css
pre:hover .copy-btn { opacity: 1; }
```

**Key detail:** The button is appended to `<pre>` (not `<code>`) because `<pre>` is the block-level container that has `position: relative`. The Shiki-generated `<pre>` already has `overflow: auto` — ensure `z-index` on the button so it stays above scrolled content.

### Pattern 6: Canvas Backlink Data Resolution

**What:** At build time in `[slug].astro`, resolve whether a given slug has a matching timeline entry by reading timeline `.md` files from the yearly directories.
**When to use:** Post slug needs to be matched to `url` field in yearly-directory content.

**Data model confirmed:**
- Timeline entries live in `packages/content/content/{year}/{slug}.md`
- Each has a `url` field: `https://writing.illulachy.me/{post-slug}`
- Blog posts live in `packages/content/content/posts/{slug}.md`
- A post `slug` matches a timeline entry if the timeline entry's `url` ends with `/${slug}`

```typescript
// apps/blog/src/lib/timeline-match.ts
export function hasTimelineEntry(slug: string, timelineRaw: Record<string, any>): boolean {
  return Object.values(timelineRaw).some(mod => {
    const url: string = mod.frontmatter?.url ?? ''
    return url.endsWith(`/${slug}`)
  })
}
```

In `[slug].astro` (build-time, server-side):
```typescript
const timelineFiles = import.meta.glob(
  '../../../../packages/content/content/[0-9][0-9][0-9][0-9]/**/*.md',
  { eager: true }
)
const showTimelineLink = hasTimelineEntry(slug, timelineFiles)
```

Then pass `showTimelineLink` as a prop to `PostLayout.astro` which conditionally renders the backlink in both header and footer.

### Layout Change: PostLayout Prose + ToC Grid

Current `PostLayout.astro` is single-column `max-w-[65ch]`. Adding the ToC requires a two-column layout on desktop:

```astro
<!-- PostLayout.astro — revised outer wrapper -->
<main class="max-w-[65ch] xl:max-w-[calc(65ch+14rem+3rem)] mx-auto px-8 max-sm:px-4 py-16">
  <div class="xl:flex xl:gap-12">
    <article class="min-w-0 flex-1">
      <!-- existing article content -->
    </article>
    <TableOfContents />
  </div>
</main>
```

The `65ch` prose column is preserved. The ToC sidebar (14rem width) sits to the right only on `xl:` breakpoint (1280px+). On smaller screens, `<aside>` is `hidden` per D-09.

### Anti-Patterns to Avoid

- **Using Pagefind's default CSS:** D-02 explicitly forbids it. Do NOT import `/pagefind/pagefind-ui.css`. Only use the JS API.
- **Adding rehype-slug to `astro.config.ts` `rehypePlugins`:** That pipeline only applies to `.md`/`.mdx` files processed natively by Astro. `[slug].astro` uses a manual unified pipeline — plugins must be added there.
- **Blocking the dev server with pagefind:** The postbuild script runs only on `pnpm build`. Do NOT add pagefind to the `dev` script; the index will not exist in dev and the `.catch(() => null)` guard handles this gracefully.
- **Adding a global `position: relative` to all `<pre>`:** Only do this via inline style on the element to avoid conflicts with Shiki's pre styling.
- **Importing timeline files with the posts glob pattern:** The yearly-directory files use a different glob pattern (`[0-9][0-9][0-9][0-9]/**/*.md`). Posts glob (`posts/**/*.md`) will not find them.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search index generation | Custom indexer | `pagefind --site dist` | WASM query, stemming, multi-language support are non-trivial |
| Heading slug generation | Custom slugifier | `rehype-slug` | Must match GitHub slugger algorithm; collisions, special chars, Unicode are edge cases |
| Search result highlighting | Custom mark wrapping | Pagefind `excerpt` field | Pagefind already wraps matched terms in `<mark>` elements |
| Copy to clipboard cross-browser | Custom clipboard shim | `navigator.clipboard.writeText()` | Supported in all modern browsers; old `execCommand` is deprecated |

**Key insight:** Pagefind's WASM engine handles stemming, multi-word queries, and ranking — building equivalent functionality would take weeks and still be worse.

---

## Common Pitfalls

### Pitfall 1: Pagefind JS Not Found During Dev
**What goes wrong:** `import('/pagefind/pagefind.js')` throws in `astro dev` because the file only exists in `dist/` after a build.
**Why it happens:** Pagefind runs post-build; the dev server serves `src/` not `dist/`.
**How to avoid:** Wrap the dynamic import in `.catch(() => null)` and guard all pagefind calls with `if (!pagefind) return`.
**Warning signs:** Console error "Failed to fetch /pagefind/pagefind.js" during dev — this is expected and harmless if guarded.

### Pitfall 2: rehype-slug Added to Wrong Pipeline
**What goes wrong:** Heading IDs are missing in rendered post HTML; ToC links don't jump anywhere.
**Why it happens:** `astro.config.ts` `rehypePlugins` only applies to Astro's native markdown pipeline, not the manual unified processor in `[slug].astro`.
**How to avoid:** Add `.use(rehypeSlug)` directly in the `unified()` chain in `[slug].astro`, after `.use(remarkRehype)`.
**Warning signs:** Built HTML shows `<h2>My Heading</h2>` with no `id` attribute.

### Pitfall 3: Pagefind Indexes Dev-Mode Files
**What goes wrong:** Running `pagefind --site src` or `pagefind --site .` indexes source files with frontmatter artifacts, not rendered HTML.
**Why it happens:** Pagefind is run against the wrong directory.
**How to avoid:** Always use `pagefind --site dist` — the Astro build output.
**Warning signs:** Search returns results with raw markdown content or YAML frontmatter visible in excerpts.

### Pitfall 4: Copy Button Appears Under Scrolled Code
**What goes wrong:** The copy button scrolls horizontally with the code content instead of staying fixed in the top-right corner.
**Why it happens:** `overflow: auto` on `<pre>` creates a scroll container; `position: absolute` children scroll with it.
**How to avoid:** Use `position: sticky` with `float: right` trick, or wrap the pre in a relative-positioned container `<div>` and place the button as a sibling to `<pre>` (not inside it).
**Warning signs:** Button disappears when scrolling long code lines horizontally.

### Pitfall 5: ToC Sidebar Breaks 65ch Prose Width
**What goes wrong:** Adding the sidebar shifts the prose column or causes horizontal overflow on intermediate breakpoints.
**Why it happens:** Flexbox child without `min-w-0` causes overflow; or the outer `max-w` is not widened for xl.
**How to avoid:** Add `min-w-0 flex-1` to the `<article>` element when it becomes a flex child; set outer max-width to accommodate both columns only at `xl:`.
**Warning signs:** Prose text becomes narrower than 65ch or overflows its container.

### Pitfall 6: Timeline Slug Match Returns False Positives
**What goes wrong:** A post with slug `typescript` matches a timeline entry with URL `https://writing.illulachy.me/deep-dive-typescript` because `endsWith('/typescript')` matches the suffix.
**Why it happens:** Naive suffix matching without anchoring.
**How to avoid:** Match the full last path segment: `url.split('/').pop() === slug`.
**Warning signs:** Backlink appears on posts that have no actual timeline entry.

---

## Code Examples

### Pagefind Result Object (from official docs)
```javascript
// Source: https://pagefind.app/docs/api/
const search = await pagefind.debouncedSearch("query")
const result = await search.results[0].data()
// result shape:
// {
//   url: "/blog/my-post/",
//   excerpt: "A snippet with <mark>highlighted</mark> terms",
//   meta: { title: "My Post Title" },
//   sub_results: [{ url, excerpt, title, anchor }]
// }
```

### rehype-slug Usage (from official package, version 6.0.0)
```typescript
// Source: https://github.com/rehypejs/rehype-slug
import rehypeSlug from 'rehype-slug'

// Added to unified chain — generates id="my-heading" from "My Heading"
const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSlug)  // adds id attributes to headings
  .use(rehypeStringify)
```

### IntersectionObserver ToC Active Highlight Pattern
```javascript
// Source: https://css-tricks.com/table-of-contents-with-intersectionobserver/
// rootMargin shrinks the observation zone so only the "current" heading is active
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // highlight the corresponding ToC link
    }
  })
}, {
  rootMargin: '-10% 0% -80% 0%'
  // Top: ignore 10% of viewport (sticky nav overlap)
  // Bottom: only mark as active when heading is in top 10%-20% of viewport
})
```

### Clipboard API (Browser Native)
```javascript
// Source: MDN Web Docs — Clipboard API
await navigator.clipboard.writeText(code.innerText)
// Supported: Chrome 66+, Firefox 63+, Safari 13.1+
// No library needed
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build scripts, Astro | Yes | v20.12.2 | — |
| pnpm | Package management | Yes | (workspace) | — |
| pagefind CLI | SRCH-01 search index | Not yet installed | — | Install as devDependency: `pnpm add -D pagefind` |
| rehype-slug | SRCH-03 heading IDs | Not yet installed | — | Install: `pnpm add rehype-slug` |
| Clipboard API | SRCH-02 copy button | Browser native | — | — |
| IntersectionObserver | SRCH-03 active ToC | Browser native | — | — |

**Missing dependencies with no fallback:**
- `pagefind` — must be installed; no alternative for SRCH-01
- `rehype-slug` — must be installed; enables both SRCH-03 (ToC IDs) and Pagefind heading section indexing

**Missing dependencies with fallback:**
- None

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `apps/blog/vitest.config.ts` |
| Quick run command | `pnpm --filter @illu/blog test` |
| Full suite command | `pnpm --filter @illu/blog test` (runs all tests in apps/blog/src/test/) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Pagefind postbuild script added to package.json | manual (integration — requires build) | `pnpm --filter @illu/blog build && ls apps/blog/dist/pagefind/pagefind.js` | ❌ Wave 0 |
| SRCH-02 | Copy button DOM injection logic (pure function) | unit | `pnpm --filter @illu/blog test -- copy-button` | ❌ Wave 0 |
| SRCH-03 | Timeline slug matching returns correct boolean | unit | `pnpm --filter @illu/blog test -- timeline-match` | ❌ Wave 0 |
| SRCH-03 | ToC hides when < 2 headings | manual | Browser visual check | N/A — UI behavior |
| SRCH-04 | `hasTimelineEntry` returns true for matching slug | unit | `pnpm --filter @illu/blog test -- timeline-match` | ❌ Wave 0 |
| SRCH-04 | `hasTimelineEntry` returns false for no match | unit | `pnpm --filter @illu/blog test -- timeline-match` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @illu/blog test`
- **Per wave merge:** `pnpm --filter @illu/blog test`
- **Phase gate:** Full suite green + manual browser smoke test of search, copy, ToC before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/blog/src/test/timeline-match.test.ts` — covers SRCH-04 and slug-matching logic in SRCH-03
- [ ] `apps/blog/src/lib/timeline-match.ts` — the utility being tested (also a Wave 0 creation)

*(Existing tests in `apps/blog/src/test/` cover reading-time, taxonomy, sorting, glob resolution, RSS — none cover Phase 10 features.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `execCommand('copy')` for clipboard | `navigator.clipboard.writeText()` | ~2020 | execCommand is deprecated; use Clipboard API |
| Pagefind default UI with CSS import | Pagefind JS API + custom render | Pagefind 0.12+ | Full design control, no default styles to override |
| Scroll event listeners for ToC active state | IntersectionObserver | ~2018 | Better performance, simpler code |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated in all browsers; use `navigator.clipboard.writeText()` instead.
- `/pagefind/pagefind-ui.js` + `/pagefind/pagefind-ui.css`: Default UI bundle. D-02 forbids its use — use `/pagefind/pagefind.js` (the raw JS API) only.

---

## Open Questions

1. **Pagefind in Turborepo build graph**
   - What we know: `postbuild` in `apps/blog/package.json` runs after `astro build`; Turborepo runs `build` tasks per workspace
   - What's unclear: Whether Turborepo's task cache correctly invalidates when content changes (pagefind index is in `dist/`, which Turborepo excludes from cache by default)
   - Recommendation: Add `"outputs": ["dist/**"]` to the `build` task in `turbo.json` if not already present; ensure pagefind runs within the blog's build task, not a separate Turborepo task

2. **Pagefind in dev mode UX**
   - What we know: Search does not work during `astro dev`; the guard returns early
   - What's unclear: Whether to show a "Search only available in production" message or silently hide the input during dev
   - Recommendation: Hide the search input during dev using a data attribute that Astro sets at build time (Astro's `import.meta.env.DEV` flag accessible in frontmatter)

---

## Sources

### Primary (HIGH confidence)
- https://pagefind.app/docs/api/ — JS API initialization, search method, result shape, debouncedSearch
- https://pagefind.app/docs/installation/ — CLI command syntax, postbuild integration
- https://github.com/rehypejs/rehype-slug — plugin purpose, installation, usage in unified pipeline
- npm registry — pagefind@1.4.0 and rehype-slug@6.0.0 confirmed versions (2026-04-01)
- Codebase inspection — PostLayout.astro, [slug].astro, global.css, package.json, content types

### Secondary (MEDIUM confidence)
- https://css-tricks.com/table-of-contents-with-intersectionobserver/ — IntersectionObserver rootMargin technique for ToC active heading
- https://benfrain.com/building-a-table-of-contents-with-active-indicator-using-javascript-intersection-observers/ — complete ToC implementation pattern

### Tertiary (LOW confidence)
- WebSearch results on Astro + Pagefind integration patterns (multiple community blog posts confirming `postbuild` approach)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pagefind and rehype-slug versions confirmed against npm registry; Clipboard API and IntersectionObserver are browser standards
- Architecture: HIGH — patterns derived from official Pagefind docs + direct codebase inspection of [slug].astro unified pipeline
- Pitfalls: HIGH — copy button z-index and rehype-slug pipeline placement verified by reading the actual code; others from Pagefind official docs
- Timeline matching: HIGH — data model confirmed by reading actual content files (yearly dirs + posts/) and ContentNode type

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (Pagefind 1.4.x is stable; rehype-slug 6.0.0 is stable)
