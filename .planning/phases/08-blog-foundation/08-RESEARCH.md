# Phase 8: Blog Foundation - Research

**Researched:** 2026-03-29
**Domain:** Astro 6 blog, Tailwind v4 @theme, Shiki syntax highlighting, content collections, design token extraction
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Content Model**
- D-01: Blog posts live in `packages/content/content/posts/` as a new subfolder within `@illu/content`
- D-02: Blog post frontmatter: `title`, `date`, `excerpt`, `tags` (array), `category` (string). No `draft` flag in Phase 8.
- D-03: Some existing timeline content files upgraded to full posts with prose body content. Claude picks which ones based on blog-worthy potential.
- D-04: Content consumed via `import.meta.glob()` in Astro pages — no Astro content collections, no package-exported `getPosts()` helper. Simple direct glob reads from the monorepo path.

**Visual Identity**
- D-05: Follow `.stich/DESIGN.md` and `.stich/visual/COMPONENTS.html` / `COMPONENTS_LIGHT.html` exactly for all token values
- D-06: New `packages/tokens/` package (`@illu/tokens`) — exports a single CSS file with `@theme` block importable by both `apps/blog/` and `apps/portfolio/`
- D-07: Dark mode = `#131313` charcoal surfaces, white text. Light mode = `#FAFAFA` near-white, near-black text. System preference (`prefers-color-scheme`) controls default. No manual toggle.
- D-08: Fonts: Noto Serif for display/headlines, Space Grotesk for body
- D-09: "No-Line Rule" strictly applied — no 1px borders; use tonal surface shifts and negative space
- D-10: Glassmorphism restricted to floating/nav overlays only
- D-11: Prose layout: max-width ~65ch, fluid typography, `spacing-8` minimum from screen edges on desktop

**Post List Design**
- D-12: Medium-style editorial list — title + excerpt + metadata left, small thumbnail right. No card borders.
- D-13: Metadata row per post: date + reading time + category tag
- D-14: Layout reference: `.stich/layout.jpeg` — visual target for density, spacing, item structure
- D-15: Posts ordered reverse-chronological, no year grouping in Phase 8

**Syntax Highlighting**
- D-16: Shiki at build time (zero runtime JS) — already built into Astro
- D-17: Custom Shiki themes `illu-dark` and `illu-light` — built from Stitch token values

### Claude's Discretion
- Exact monorepo path resolution for `import.meta.glob()` across workspace boundaries
- `@illu/tokens` package structure (CSS file export, Tailwind plugin, or both)
- Whether to use Astro's built-in `<Image />` component or plain `<img>` for thumbnails
- Reading time calculation library or inline implementation
- Astro layout component structure (BaseLayout, BlogLayout, PostLayout hierarchy)
- Whether existing timeline content files need updated frontmatter or can keep current shape alongside new blog frontmatter

### Deferred Ideas (OUT OF SCOPE)
- Featured/hero post section
- Subscribe/newsletter button
- Manual dark/light toggle
- Draft flag in frontmatter
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BLOG-01 | Post list page with titles, dates, excerpts in reverse-chronological order | `import.meta.glob()` with eager:true across workspace path; date sort pattern; PostCard component |
| BLOG-02 | Full blog post with rendered markdown (headings, code blocks, lists, links, images) | Manual remark+rehype pipeline in `[slug].astro`; `set:html` directive; prose class |
| BLOG-03 | Code blocks display Shiki syntax highlighting at build time, zero runtime JS | Shiki built into Astro 6; `markdown.shikiConfig.themes`; `@shikijs/rehype` for manual pipeline |
| BLOG-04 | Each post displays estimated reading time | Inline word-count function (200 wpm, round, min 1) |
| VIS-01 | Dark mode using design system tokens via Tailwind v4 @theme | `@illu/tokens` package; `@tailwindcss/vite`; dark as base @theme, light in @media |
| VIS-02 | Responsive prose layout (max-width ~65ch, fluid typography, mobile-first) | `@tailwindcss/typography` 0.5.19 prose classes; custom overrides |
</phase_requirements>

---

## Summary

Phase 8 builds a complete Astro 6 blog at writing.illulachy.me. The primary technical challenge is loading markdown content from `packages/content/content/posts/` (outside the blog app's directory) into Astro pages. Decision D-04 locks this to `import.meta.glob()` — not Astro content collections. This is achievable via Vite's glob with a literal path that traverses up the monorepo (`../../../../packages/content/content/posts/**/*.md`) relative to the Astro page file location. The glob must be a string literal; no dynamic construction.

The design system side is well-defined: extract CSS custom properties from `.stich/visual/COMPONENTS.html` (dark) and `COMPONENTS_LIGHT.html` (light) into a new `packages/tokens/` package as a single CSS file containing a Tailwind v4 `@theme` block. Both apps import this file. Dark/light switching uses `@media (prefers-color-scheme: light)` to override the default-dark tokens — no JavaScript required.

Shiki is already bundled in Astro 6. Configure dual themes (`illu-dark` / `illu-light`) as custom JSON files imported into `astro.config.ts`. Shiki outputs CSS variables per token; a `@media (prefers-color-scheme: dark)` CSS rule in `global.css` applies the dark token set to `.astro-code` elements.

**Primary recommendation:** Use `import.meta.glob()` with `{ eager: true }` on the list page (frontmatter only needed) and `{ eager: true, as: 'raw' }` on the post route (body needed for remark pipeline). Parse frontmatter with `gray-matter` (already in `@illu/content`'s deps — add explicitly to blog's deps). Calculate reading time with a 5-line inline function. Validate glob path resolution in Wave 0 before building any UI — STATE.md flags this as a known risk.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.1 | SSG framework, markdown rendering, Shiki integration | Already installed; zero-JS output; built-in Shiki |
| @tailwindcss/vite | 4.2.2 | Tailwind v4 Vite plugin for Astro | Official v4 approach (replaces deprecated @astrojs/tailwind) |
| tailwindcss | 4.x (peer) | Utility CSS + @theme tokens | v4 CSS-first approach; @theme block native |
| @tailwindcss/typography | 0.5.19 | Prose styling for rendered markdown | Industry standard; covers ~40 element selectors; provides `.prose` class |
| shiki | 4.0.2 | Syntax highlighting (bundled in Astro) | Build-time only; zero runtime JS; already in Astro |
| gray-matter | 4.0.3 | Frontmatter parsing from raw markdown strings | Already in `@illu/content`'s deps; avoid adding a second parser |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shikijs/rehype | latest | Shiki as a rehype plugin in manual pipeline | Use in `[slug].astro` remark+rehype pipeline to highlight code blocks |
| remark-parse | (Astro bundled) | Markdown AST parsing | Part of the unified pipeline for post body rendering |
| remark-gfm | (Astro bundled) | GitHub Flavored Markdown (tables, task lists) | Enabled by default in Astro; include in manual pipeline |
| remark-rehype | (Astro bundled) | Convert markdown AST to HTML AST | Bridge between remark and rehype in the pipeline |
| rehype-stringify | (Astro bundled) | Serialize HTML AST to string | Final step of the pipeline |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `import.meta.glob()` | Astro content collections (`defineCollection` + `glob()` loader) | Collections offer type safety + Zod validation but D-04 explicitly prohibits them |
| Inline reading time function | `reading-time` npm package (1.5.0) | Package is tiny (1.5KB) and handles edge cases; D-04 context makes inline simpler since we're already parsing body manually |
| `@tailwindcss/typography` prose | Custom CSS per-element selectors | Typography plugin correct for ~40 selectors; not worth hand-rolling |
| Custom Shiki JSON themes | Built-in themes (e.g., `github-dark`) | Custom themes required to match Stitch design tokens per D-17 |
| CSS `@media prefers-color-scheme` | `data-theme` attribute + JS toggle | System preference approach requires zero JS per D-07 |

**Installation (blog app):**
```bash
pnpm --filter @illu/blog add @tailwindcss/vite @tailwindcss/typography gray-matter @shikijs/rehype
pnpm --filter @illu/blog add -D vitest
```

**Installation (new tokens package):**
```bash
# packages/tokens/ created manually (no runtime deps, no install needed)
# Then: pnpm install (from root) to wire up workspace symlink
```

**Version verification:** All versions confirmed via `npm view` on 2026-03-29.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/
├── content/
│   ├── content/
│   │   ├── posts/                   # NEW: blog post markdown files (D-01)
│   │   │   ├── deep-dive-typescript.md   # upgraded from 2024/ stub
│   │   │   ├── year-in-review.md         # upgraded from 2024/ stub
│   │   │   ├── tldraw-discovery.md       # upgraded from 2023/ stub
│   │   │   └── draft-webgpu-post.md      # upgraded from 2024/ stub
│   │   ├── 2020/ .. 2024/           # timeline stubs unchanged
│   └── src/
│       └── types/content.ts         # existing types, no changes needed
│
├── tokens/                          # NEW: @illu/tokens package (D-06)
│   ├── package.json                 # { exports: { ".": "./src/tokens.css" } }
│   └── src/
│       └── tokens.css               # @theme dark (default) + @media light overrides
│
apps/
└── blog/
    ├── astro.config.ts              # Tailwind vite plugin + Shiki dual themes
    ├── package.json                 # add deps: @tailwindcss/vite, @tailwindcss/typography, etc.
    └── src/
        ├── styles/
        │   └── global.css           # @import "tailwindcss"; + @import "@illu/tokens"; + Shiki CSS vars
        ├── shiki/
        │   ├── illu-dark.json       # custom Shiki theme (dark)
        │   └── illu-light.json      # custom Shiki theme (light)
        ├── layouts/
        │   ├── BaseLayout.astro     # <html>, <head>, fonts, global.css import
        │   └── PostLayout.astro     # prose wrapper, reading time display
        ├── components/
        │   └── PostCard.astro       # single post row (Medium-style)
        └── pages/
            ├── index.astro          # post list (replaces Phase 7 placeholder)
            └── [slug].astro         # dynamic post route
```

### Pattern 1: Cross-Workspace `import.meta.glob()`

**What:** Load markdown files from `packages/content/content/posts/` into Astro pages using Vite's `import.meta.glob()` with a relative path that crosses the monorepo boundary.

**When to use:** All post loading in both `index.astro` and `[slug].astro`.

**How it works:** From `apps/blog/src/pages/index.astro`, the path `../../../../packages/content/content/posts/**/*.md` navigates: `src/pages/` → `src/` → `apps/blog/` → `apps/` → repo root (4 levels) → down into `packages/content/content/posts/`. Vite resolves this statically at build time.

**Critical constraint:** Pattern MUST be a **string literal**. No template strings, no variables. Vite statically analyzes glob patterns at compile time.

```typescript
// Source: Vite docs (import.meta.glob) + Astro imports reference
// In apps/blog/src/pages/index.astro (frontmatter)

// For list page — only frontmatter needed, default module mode
const postModules = import.meta.glob(
  '../../../../packages/content/content/posts/**/*.md',
  { eager: true }
)

// For post route — raw string needed to parse body
const rawFiles = import.meta.glob(
  '../../../../packages/content/content/posts/**/*.md',
  { eager: true, as: 'raw' }
)
```

**What each mode returns:**
- Default (`{ eager: true }`): Astro module objects with `.frontmatter` (parsed) and `.rawContent()` method
- `as: 'raw'` (`{ eager: true, as: 'raw' }`): Raw file string content (unparsed)

**For the list page**, use the default mode and read `.frontmatter` directly — no gray-matter needed.

**For the post route**, use `as: 'raw'` + gray-matter to get the body for the remark pipeline.

### Pattern 2: Post List Page

**What:** `index.astro` renders all posts sorted reverse-chronologically.

```astro
---
// Source: Vite docs + Astro docs
import BaseLayout from '../layouts/BaseLayout.astro'
import PostCard from '../components/PostCard.astro'

const postModules = import.meta.glob(
  '../../../../packages/content/content/posts/**/*.md',
  { eager: true }
)

interface PostFrontmatter {
  title: string
  date: string
  excerpt: string
  tags: string[]
  category: string
}

const posts = Object.entries(postModules)
  .map(([path, mod]: [string, any]) => ({
    slug: path.split('/').pop()!.replace('.md', ''),
    frontmatter: mod.frontmatter as PostFrontmatter,
    readingTime: calcReadingTime(mod.rawContent?.() ?? ''),
  }))
  .sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  )

function calcReadingTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}
---

<BaseLayout title="writing.illulachy.me">
  <main class="max-w-[65ch] mx-auto px-8 py-16">
    {posts.map(post => <PostCard post={post} />)}
  </main>
</BaseLayout>
```

### Pattern 3: Dynamic Post Route

**What:** `[slug].astro` generates one static page per post, renders body through remark+rehype+Shiki pipeline.

```astro
---
// Source: Astro getStaticPaths docs + Shiki rehype plugin docs
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import PostLayout from '../../layouts/PostLayout.astro'

export async function getStaticPaths() {
  const rawFiles = import.meta.glob(
    '../../../../packages/content/content/posts/**/*.md',
    { eager: true, as: 'raw' }
  )
  return Object.entries(rawFiles).map(([path, raw]) => ({
    params: { slug: path.split('/').pop()!.replace('.md', '') },
    props: { raw },
  }))
}

const { raw } = Astro.props as { raw: string }
const { data: frontmatter, content: body } = matter(raw)

const words = body.trim().split(/\s+/).filter(Boolean).length
const readingTime = `${Math.max(1, Math.round(words / 200))} min read`

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeShiki, { theme: 'illu-dark' })  // or dual themes object
  .use(rehypeStringify, { allowDangerousHtml: true })

const html = String(await processor.process(body))
---

<PostLayout frontmatter={frontmatter} readingTime={readingTime}>
  <div class="prose prose-invert max-w-none" set:html={html} />
</PostLayout>
```

**Note:** `set:html` is Astro's safe HTML injection directive — it escapes user-controlled HTML but passes trusted builder-processed HTML correctly.

### Pattern 4: Tailwind v4 + @illu/tokens in Astro Blog

**`apps/blog/astro.config.ts`:**
```typescript
// Source: Tailwind CSS official Astro guide (tailwindcss.com/docs/installation/framework-guides/astro)
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import illuDark from './src/shiki/illu-dark.json'
import illuLight from './src/shiki/illu-light.json'

export default defineConfig({
  site: 'https://writing.illulachy.me',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: illuLight,
        dark: illuDark,
      },
      wrap: false,
    },
  },
})
```

**`apps/blog/src/styles/global.css`:**
```css
/* Source: Tailwind CSS official docs */
@import "tailwindcss";
@import "@illu/tokens";

/* Shiki dual-theme CSS variable switching */
/* Source: Astro syntax highlighting docs */
@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
  }
}
```

**`apps/blog/package.json` (add @illu/tokens dep):**
```json
{
  "dependencies": {
    "@illu/content": "workspace:*",
    "@illu/tokens": "workspace:*",
    "astro": "^6.1.1"
  }
}
```

### Pattern 5: @illu/tokens Package — CSS Structure

**What:** Single CSS file exporting design tokens as Tailwind v4 `@theme` block. Dark is default; light overrides via `@media (prefers-color-scheme: light)`.

**`packages/tokens/src/tokens.css`:**
```css
/* Dark mode tokens — DEFAULT (no media query) */
/* Source: .stich/visual/COMPONENTS.html */
@theme {
  /* Surfaces */
  --color-surface-dim: #0A0A0A;
  --color-surface-default: #131313;
  --color-surface-container-lowest: #1A1A1A;
  --color-surface-container-low: #1C1C1C;
  --color-surface-container: #212121;
  --color-surface-container-high: #272727;
  --color-surface-container-highest: #2E2E2E;

  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A1A1AA;
  --color-text-tertiary: #71717A;
  --color-text-quaternary: #52525B;

  /* Accents */
  --color-accent-mauve: #E0AFFF;
  --color-interactive-default: #E0AFFF;
  --color-interactive-hover: #EAC7FF;
  --color-interactive-active: #D197FF;

  /* Borders (ghost) */
  --color-border-ghost: rgba(255, 255, 255, 0.06);
  --color-border-subtle: rgba(255, 255, 255, 0.1);

  /* Fonts */
  --font-family-display: 'Noto Serif', Georgia, serif;
  --font-family-heading: 'Noto Serif', Georgia, serif;
  --font-family-body: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --spacing-8: 2rem;
  /* ... full scale from portfolio/src/index.css ... */
}

/* Light mode overrides */
/* Source: .stich/visual/COMPONENTS_LIGHT.html */
@media (prefers-color-scheme: light) {
  @theme {
    --color-surface-default: #FAFAFA;
    --color-surface-container-lowest: #F5F5F5;
    --color-surface-container-low: #F0F0F0;
    --color-surface-container: #EBEBEB;
    --color-surface-container-high: #E5E5E5;
    --color-surface-container-highest: #E0E0E0;
    --color-text-primary: #09090B;
    --color-text-secondary: #52525B;
    --color-text-tertiary: #71717A;
    --color-accent-mauve: #8B5CF6;
    --color-border-ghost: rgba(0, 0, 0, 0.06);
    --color-border-subtle: rgba(0, 0, 0, 0.1);
  }
}
```

**Note:** Tailwind v4 `@theme` within `@media` is supported and recommended for responsive token overrides. This is verified in the Tailwind v4 docs.

### Pattern 6: Custom Shiki Theme JSON

**What:** Minimal Shiki theme JSON matching Stitch token values.

**`apps/blog/src/shiki/illu-dark.json`:**
```json
{
  "name": "illu-dark",
  "type": "dark",
  "colors": {
    "editor.background": "#131313",
    "editor.foreground": "#FFFFFF"
  },
  "tokenColors": [
    {
      "scope": ["comment", "punctuation.definition.comment"],
      "settings": { "foreground": "#71717A", "fontStyle": "italic" }
    },
    {
      "scope": ["string", "string.quoted"],
      "settings": { "foreground": "#E0AFFF" }
    },
    {
      "scope": ["keyword", "keyword.control", "storage.type", "storage.modifier"],
      "settings": { "foreground": "#D197FF" }
    },
    {
      "scope": ["entity.name.function", "support.function"],
      "settings": { "foreground": "#EAC7FF" }
    },
    {
      "scope": ["variable", "variable.other"],
      "settings": { "foreground": "#FFFFFF" }
    },
    {
      "scope": ["constant.numeric", "constant.language"],
      "settings": { "foreground": "#E0AFFF" }
    },
    {
      "scope": ["entity.name.type", "entity.name.class"],
      "settings": { "foreground": "#EAC7FF", "fontStyle": "bold" }
    },
    {
      "scope": ["punctuation", "meta.brace"],
      "settings": { "foreground": "#A1A1AA" }
    }
  ]
}
```

### Anti-Patterns to Avoid

- **`import.meta.glob()` with template literals or variables:** Fails at Vite build time. Pattern must be a string literal.
- **Using `Astro.glob()`:** Deprecated in Astro 5+. Replace with `import.meta.glob()`.
- **Creating `src/content.config.ts`:** D-04 prohibits content collections. Do not create this file.
- **Installing `@astrojs/tailwind`:** Legacy integration for Tailwind v3. Use `@tailwindcss/vite` for v4.
- **Targeting `.shiki` in CSS:** Astro outputs `.astro-code`, not `.shiki`. Always target `.astro-code`.
- **Applying glassmorphism to article content area:** D-10 restricts glass to floating/nav overlays only.
- **Using 1px solid borders:** Violates D-09 ("No-Line Rule"). Use tonal surface shifts.
- **Writing dark tokens inside `@media (prefers-color-scheme: dark)`:** Makes dark mode opt-in. Dark must be the base (no media query); light is the override.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | Custom YAML/frontmatter parser | `gray-matter` (4.0.3, already in `@illu/content`) | Handles multiline strings, type coercion, nested YAML, edge cases |
| Prose typography | Custom h1/h2/p/ul/code/pre CSS | `@tailwindcss/typography` `.prose` class | ~40 element selectors with correct nesting, list styles, code background |
| Syntax highlighting | Custom tokenizer | Shiki (built into Astro 6) + `@shikijs/rehype` | Zero-runtime, TextMate grammars, 200+ languages |
| Markdown-to-HTML | Custom markdown parser | `unified`+`remark`+`rehype` (Astro bundled) | Handles GFM, XSS safety, extensible |
| Design token duplication | Copy-paste tokens into blog CSS | `@illu/tokens` shared package (D-06) | Single source of truth; portfolio and blog stay synchronized |

**Key insight:** Reading time is the one case where inline implementation (5 lines) is simpler than a package, because we already have the body string from gray-matter parsing. Every other item has significant edge cases not worth reimplementing.

---

## Common Pitfalls

### Pitfall 1: `import.meta.glob()` with Non-Literal Pattern

**What goes wrong:** Build fails with Vite error "The glob pattern must be a string literal" or silently returns empty object.

**Why it happens:** Vite statically analyzes glob patterns at compile time. Dynamic construction is impossible.

**How to avoid:** Write the full literal string in source code. The `../../../../` depth looks verbose but is correct.

**Warning signs:** Empty `posts` array on list page; Vite build error mentioning glob.

### Pitfall 2: Glob Path Depth from `src/pages/` vs. from `src/`

**What goes wrong:** Using the wrong number of `../` prefixes returns an empty match set.

**Why it happens:** `import.meta.glob()` paths resolve relative to the **file containing the call**, not the project root.

**From `apps/blog/src/pages/index.astro`:** `../../../packages/...` (3 levels up: pages → src → blog → apps → root... wait, that's 4). Let's count:
- `../` = `apps/blog/src/` (from `src/pages/`)
- `../../` = `apps/blog/`
- `../../../` = `apps/`
- `../../../../` = repo root

So the correct path from `src/pages/*.astro` is: `../../../../packages/content/content/posts/**/*.md`

**How to avoid:** Validate in Wave 0 with a debug page that logs `Object.keys(import.meta.glob(...))`.

**Depth calculation (from `apps/blog/src/pages/`):**
```
src/pages/ → src/ (../)
src/ → apps/blog/ (../../)
apps/blog/ → apps/ (../../../)
apps/ → repo root (../../../../)
repo root → packages/content/content/posts/
= ../../../../packages/content/content/posts/**/*.md
```

### Pitfall 3: `@astrojs/tailwind` vs. `@tailwindcss/vite`

**What goes wrong:** Installing `@astrojs/tailwind` installs Tailwind v3 as a peer dep. `@theme {}` blocks and v4 CSS syntax do not work.

**Why it happens:** `@astrojs/tailwind` is a legacy integration for Tailwind v3.

**How to avoid:** Install `@tailwindcss/vite` (v4 official). Configure in `astro.config.ts` under `vite.plugins`. Do not install `@astrojs/tailwind`.

**Warning signs:** `tailwind.config.js` error; `@theme` blocks silently ignored; content-based purging not working.

### Pitfall 4: Shiki `.shiki` vs `.astro-code` Class in CSS

**What goes wrong:** CSS targeting `.shiki` or `.shiki code` has no effect on code block colors.

**Why it happens:** Astro wraps Shiki output in `<pre class="astro-code">`, not `<pre class="shiki">`.

**How to avoid:** Always target `.astro-code` and `.astro-code span` in global CSS.

### Pitfall 5: `@illu/tokens` CSS Import Not Resolving

**What goes wrong:** Build error "cannot find module '@illu/tokens'" or CSS import not found.

**Why it happens:** pnpm workspace symlink for `@illu/tokens` not created until `pnpm install` is run after creating `packages/tokens/`.

**How to avoid:** After creating `packages/tokens/package.json`, run `pnpm install` from repo root. Also add `"@illu/tokens": "workspace:*"` to `apps/blog/package.json` dependencies before running install. Also add `"@illu/tokens": "workspace:*"` to `apps/portfolio/package.json` if migrating portfolio tokens.

**Warning signs:** Build error about CSS import; tokens not applied in browser.

### Pitfall 6: Out-of-Tree Glob Path Resolution (STATE.md Known Risk)

**What goes wrong:** `import.meta.glob()` returns empty object; posts array is empty.

**Why it happens:** STATE.md explicitly flags "Phase 8 risk: Astro out-of-tree content paths" as a known concern. The exact behavior depends on Vite cwd in Turborepo's build context.

**How to avoid:** Make glob path validation the **first Wave 0 task** — before building any UI. Create a temporary debug page, verify keys are non-empty, then remove before continuing.

### Pitfall 7: Date Format Inconsistency in Existing Stubs

**What goes wrong:** `new Date("January 15, 2024")` returns `Invalid Date` in some JS environments. Sort by date fails silently, showing unsorted posts.

**Why it happens:** Existing stub files use `date: January 15, 2024` (non-ISO format). The blog's sort logic calls `new Date(dateString).getTime()`.

**How to avoid:** Normalize all post frontmatter dates to ISO 8601 (`date: 2024-01-15`) when upgrading stubs to full posts. Use a defensive sort: if `getTime()` returns `NaN`, treat as 0.

**Warning signs:** Posts in wrong order; console warnings about invalid dates.

### Pitfall 8: Dark as Default in @theme

**What goes wrong:** Putting dark tokens inside `@media (prefers-color-scheme: dark)` makes them opt-in. On systems with no preference or light preference, the page shows unstyled (no tokens).

**Why it happens:** The incorrect assumption is "dark = dark media query."

**How to avoid:** Write dark tokens as the **base `@theme {}`** (no media query). Write light tokens inside `@media (prefers-color-scheme: light) { @theme { ... } }`. This matches D-07's "dark default, system preference controls."

---

## Code Examples

### Blog Post Frontmatter (D-02 Schema)

```markdown
---
title: Deep Dive into TypeScript Generics
date: 2024-01-15
excerpt: How generic types unlock reusable, type-safe abstractions — with real-world patterns you can apply today.
tags: [typescript, programming, generics]
category: Engineering
---

Full prose body begins here. Multiple paragraphs, code blocks, etc.
```

### PostCard Component (Medium-Style)

```astro
---
// Implements D-12, D-13 layout spec
interface Props {
  post: {
    slug: string
    frontmatter: { title: string; date: string; excerpt: string; category: string }
    readingTime: string
  }
}
const { post } = Astro.props
const date = new Date(post.frontmatter.date).toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
})
---

<article class="py-8 transition-colors hover:bg-surface-container-low">
  <a href={`/${post.slug}`} class="block no-underline">
    <div class="flex justify-between gap-6 items-start">
      <!-- Left: title, excerpt, metadata -->
      <div class="flex-1 min-w-0">
        <h2 class="font-heading text-2xl font-semibold text-text-primary leading-tight mb-2">
          {post.frontmatter.title}
        </h2>
        <p class="text-text-secondary text-base leading-relaxed mb-3 line-clamp-2">
          {post.frontmatter.excerpt}
        </p>
        <div class="flex items-center gap-3 text-sm text-text-tertiary">
          <span>{date}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime}</span>
          <span aria-hidden="true">·</span>
          <span class="text-accent-mauve">{post.frontmatter.category}</span>
        </div>
      </div>
      <!-- Right: thumbnail placeholder (120-160px per D-12) -->
      <div class="w-32 h-20 bg-surface-container-high flex-shrink-0 rounded-sm" aria-hidden="true" />
    </div>
  </a>
</article>
```

### BaseLayout.astro (Google Fonts + global CSS)

```astro
---
interface Props {
  title?: string
}
const { title = 'writing.illulachy.me' } = Astro.props
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <!-- global.css imported here applies @import "tailwindcss" and @import "@illu/tokens" -->
  </head>
  <body class="bg-surface-default text-text-primary font-body antialiased">
    <slot />
  </body>
</html>
```

**Note:** In Astro, CSS imports in layout frontmatter (`import '../styles/global.css'`) apply styles globally. The `@import "tailwindcss"` in global.css handles Tailwind's base/components/utilities all at once.

---

## Content Upgrade Decisions

Based on review of all existing content files, these are candidates for upgrade to full blog posts in `packages/content/content/posts/`:

| File | Current Location | Action | Rationale |
|------|-----------------|--------|-----------|
| `deep-dive-typescript.md` | `2024/` | Upgrade to post | Technical topic with clear description; excellent blog candidate |
| `year-in-review.md` | `2024/` | Upgrade to post | Reflective/editorial content; natural blog format |
| `tldraw-discovery.md` | `2023/` | Upgrade to post | Library exploration; tutorial-style content |
| `draft-webgpu-post.md` | `2024/` | Upgrade to post | Technical topic; has `draft: true` stub — needs real body |
| `canvas-timeline-idea.md` | `2024/` | Stay as timeline stub | YouTube-concept content in description; not article format |
| `building-in-public.md` | `2023/` | Stay as timeline stub | YouTube video content; not written-article format |

**Upgrade procedure:** Copy (not move) the file to `packages/content/content/posts/`. The original stub stays in its year directory (for the portfolio canvas). The posts/ version:
1. Adds required D-02 fields: `excerpt`, `tags`, `category`
2. Normalizes `date` to ISO 8601 format
3. Adds a full prose body (several paragraphs minimum)

Existing timeline stubs do NOT need frontmatter changes — they stay as-is for the portfolio canvas.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/tailwind` integration | `@tailwindcss/vite` Vite plugin | Tailwind v4 (2025) | No `tailwind.config.js`; CSS-first `@theme` |
| `Astro.glob()` | `import.meta.glob()` | Astro 5.0 | `Astro.glob()` deprecated |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | New location (N/A for this phase — D-04 prohibits collections) |
| Shiki as separate package | Built into Astro | Astro 5.0 | Configure via `markdown.shikiConfig` |
| `.shiki` CSS class | `.astro-code` CSS class | Astro 5.0 | All CSS overrides must target `.astro-code` |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Do not use with v4. Installs Tailwind v3 as peer dep.
- `Astro.glob()`: Deprecated Astro 5+. Will be removed in a future major.
- `astrojs/shiki` integration (old): No longer separate; built into Astro core.

---

## Open Questions

1. **Exact glob path depth from `src/pages/*.astro`**
   - What we know: `import.meta.glob()` resolves relative to the calling file; Vite supports cross-boundary paths
   - What's unclear: Whether `../../../../packages/content/content/posts/**/*.md` resolves correctly in Turborepo's build context where Vite may run from a different cwd
   - Recommendation: **Wave 0 spike required** — log `Object.keys(postModules)` in a test page, verify before any UI work. This is the highest-risk item.

2. **gray-matter availability in `apps/blog/` context**
   - What we know: `gray-matter` is in `@illu/content`'s `dependencies`, not blog's. pnpm strict mode may not hoist it.
   - What's unclear: Whether pnpm's `onlyBuiltDependencies` strict mode makes gray-matter unavailable to blog app without explicit declaration
   - Recommendation: Add `gray-matter` explicitly to `apps/blog/package.json` dependencies. Safe and explicit.

3. **`rehypeShiki` vs. `astro.config.ts` `shikiConfig` in manual pipeline**
   - What we know: `markdown.shikiConfig` in `astro.config.ts` applies to Astro's native markdown pipeline. The `[slug].astro` manual remark+rehype pipeline bypasses this.
   - What's unclear: Does `@shikijs/rehype` accept the same custom JSON theme objects, and does it respect the dual-theme setup?
   - Recommendation: Start with a single dark theme in `@shikijs/rehype`. Add light theme support via CSS variables in global.css as a second step.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ | v20.12.2 | — |
| pnpm | Package management | ✓ | 10.17.1 | — |
| Turborepo | Build orchestration | ✓ | 2.8.21 | — |
| Astro | Blog SSG | ✓ | 6.1.1 | — |
| Google Fonts CDN | Noto Serif + Space Grotesk | ✓ (network) | — | Self-host via public/fonts/ |
| @tailwindcss/vite | Tailwind v4 in Astro | to install | 4.2.2 | — |
| @tailwindcss/typography | Prose styles | to install | 0.5.19 | Custom CSS (not recommended) |
| gray-matter | Frontmatter parsing | to add to blog deps | 4.0.3 | Already available via @illu/content but add explicitly |
| @shikijs/rehype | Syntax highlighting in remark pipeline | to install | latest | Use astro.config shikiConfig only (requires moving to content collections) |

**Missing dependencies with no fallback:**
- None — all required packages are either already installed or have clear install paths.

**Missing dependencies with fallback:**
- `@shikijs/rehype` — if not available or incompatible, fallback is to handle syntax highlighting via the `astro.config.ts` `markdown.shikiConfig` (requires reworking the rendering approach).

---

## Validation Architecture

`workflow.nyquist_validation: true` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (add to blog app; already in @illu/content as 4.1.0) |
| Config file | `apps/blog/vitest.config.ts` — does not exist yet (Wave 0 gap) |
| Quick run command | `pnpm --filter @illu/blog test` |
| Full suite command | `pnpm test` (Turborepo runs all packages) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BLOG-01 | Post list shows all posts, sorted newest-first | Unit | `pnpm --filter @illu/blog test -- sort.test.ts` | ❌ Wave 0 |
| BLOG-01 | Glob path resolves to >0 post files | Smoke/Unit | `pnpm --filter @illu/blog test -- glob.test.ts` | ❌ Wave 0 |
| BLOG-02 | Markdown body renders headings, lists, code, links | Build smoke | `pnpm --filter @illu/blog build` + visual check | ❌ Wave 0 (build) |
| BLOG-03 | Code blocks highlighted with zero runtime JS | Build artifact | `pnpm --filter @illu/blog build` + inspect dist/ | ❌ Wave 0 (build) |
| BLOG-04 | Reading time displayed per post | Unit | `pnpm --filter @illu/blog test -- reading-time.test.ts` | ❌ Wave 0 |
| VIS-01 | Dark mode tokens applied via CSS @theme | Manual visual | `pnpm --filter @illu/blog dev` + browser devtools | N/A (visual) |
| VIS-02 | Prose max-width ~65ch, mobile responsive | Manual visual | `pnpm --filter @illu/blog dev` + resize browser | N/A (visual) |

### Sampling Rate
- **Per task commit:** `pnpm --filter @illu/blog build` (build must pass)
- **Per wave merge:** `pnpm test && pnpm build`
- **Phase gate:** Full suite green + visual verification of dark mode and prose layout

### Wave 0 Gaps

- [ ] `apps/blog/vitest.config.ts` — test framework configuration
- [ ] `apps/blog/src/test/glob-resolution.test.ts` — validates glob path resolves to >0 posts (covers known STATE.md risk)
- [ ] `apps/blog/src/test/sort.test.ts` — covers BLOG-01 (post sort order by date)
- [ ] `apps/blog/src/test/reading-time.test.ts` — covers BLOG-04 (word count formula)
- [ ] Framework install: `pnpm --filter @illu/blog add -D vitest`

---

## Project Constraints

No `CLAUDE.md` found in the project root. Constraints derived from:
- CONTEXT.md locked decisions (D-01 through D-17) — see User Constraints section above
- STATE.md accumulated context:
  - Turborepo v2 uses `tasks` key (not `pipeline`) in `turbo.json` — already correct
  - pnpm strict mode with `onlyBuiltDependencies` for fsevents and esbuild — don't add to that list
  - REPO_ROOT pattern for content path resolution — `import.meta.glob()` replaces this for blog
- `packages/content/package.json`: Zod 4.3.6 — if adding any Zod types to blog, use same version
- Design system rules from `.stich/DESIGN.md`:
  - No 1px solid borders anywhere
  - Glassmorphism only for floating/nav overlays
  - Minimum `spacing-8` (2rem) from screen edges on desktop
  - Noto Serif for headings, Space Grotesk for body

---

## Sources

### Primary (HIGH confidence)
- [Astro Syntax Highlighting Docs](https://docs.astro.build/en/guides/syntax-highlighting/) — Shiki dual theme config, `.astro-code` class, custom theme JSON import
- [Astro Imports Reference](https://docs.astro.build/en/guides/imports/) — `import.meta.glob()` rules: string literal, relative path, `eager`, `as: 'raw'`
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/) — glob() loader, base path, Astro 5+ collection API
- [Tailwind CSS Astro Official Guide](https://tailwindcss.com/docs/installation/framework-guides/astro) — `@tailwindcss/vite` plugin setup, `@import "tailwindcss"`
- [Astro Reading Time Recipe](https://docs.astro.build/en/recipes/reading-time/) — remark plugin pattern, `remarkPluginFrontmatter`
- [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/) — glob loader capabilities and base path parameter
- Existing codebase: `.stich/visual/COMPONENTS.html`, `COMPONENTS_LIGHT.html`, `apps/portfolio/src/index.css` — verified all token values

### Secondary (MEDIUM confidence)
- [Dual Shiki Themes in Astro](https://amanhimself.dev/blog/dual-shiki-themes-with-astro/) — CSS variable approach for dark/light switching
- `npm view` registry — confirmed all package versions on 2026-03-29
- [Tailkits: Astro + Tailwind v4 Setup](https://tailkits.com/blog/astro-tailwind-setup/) — corroborating Vite plugin approach

### Tertiary (LOW confidence, flagged for Wave 0 validation)
- Cross-workspace `import.meta.glob()` path resolution in Turborepo — no official Astro docs verify `../../../../` depth works in Turborepo cwd context. Treat as LOW confidence until Wave 0 validates.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via npm registry on research date
- Architecture: HIGH — patterns from official Astro docs, verified against existing codebase structure
- Pitfalls: HIGH — 6 of 8 pitfalls sourced from official docs; 2 from STATE.md explicit risk log
- Glob path depth: LOW — needs Wave 0 validation (counted 4 levels up, but must verify in actual Turborepo context)
- Content upgrade decisions: MEDIUM — based on frontmatter descriptions; full body quality TBD

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (Astro 6.x and Tailwind v4 are stable releases)
