# Phase 8: Blog Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a readable Astro blog at writing.illulachy.me. Delivers: post list page (Medium-style editorial layout), individual post pages (rendered markdown with syntax highlighting), reading time per post, and dark/light mode using the `.stich` design system.

**What this phase delivers:**
- Post list page — Medium-style list layout (title + excerpt + metadata left, small thumbnail right)
- Individual post pages — full markdown rendering with Shiki syntax highlighting, reading time, responsive prose
- Dark/light mode — system preference with dark default, tokens from `.stich/visual/`
- New `@illu/tokens` package — extracts design tokens from `.stich` Stitch files, shared by portfolio and blog
- Real blog post content — some existing `@illu/content` markdown files upgraded to full posts, new posts added to `packages/content/content/posts/`

**What this phase does NOT include:**
- Navigation header with links (TAX-03 — Phase 9)
- Category / tag listing pages (Phase 9)
- RSS, sitemap, OG meta (Phase 9)
- Search, copy-code button, table of contents (Phase 10)
- Subscribe/newsletter button (not in scope for v1.1)
- Featured/hero post section (not in scope — defer to backlog)

</domain>

<decisions>
## Implementation Decisions

### Content Model

- **D-01:** Blog posts live in `packages/content/content/posts/` as a new subfolder within `@illu/content` — shared source of truth alongside timeline entries
- **D-02:** Blog post frontmatter: `title`, `date`, `excerpt`, `tags` (array), `category` (string). No `draft` flag in Phase 8.
- **D-03:** Some existing timeline content files (e.g. `deep-dive-typescript.md`, `year-in-review.md`, `building-in-public.md`) are upgraded to full posts with prose body content. Others stay as timeline stubs. Claude picks which make sense based on having meaningful blog-worthy content.
- **D-04:** Content is consumed via `import.meta.glob()` in Astro pages — no Astro content collections, no package-exported `getPosts()` helper. Simple direct glob reads from the monorepo path.

### Visual Identity

- **D-05:** Follow `.stich/DESIGN.md` and `.stich/visual/COMPONENTS.html` / `.stich/visual/COMPONENTS_LIGHT.html` exactly for all token values, typography, and component rules
- **D-06:** New `packages/tokens/` package (`@illu/tokens`) extracts design tokens from the Stitch files as a Tailwind v4 `@theme` block importable by both `apps/blog/` and `apps/portfolio/`
- **D-07:** Dark mode = `#131313` charcoal surfaces, white text. Light mode = `#FAFAFA` near-white, near-black text. System preference (`prefers-color-scheme`) controls the default — no manual toggle in Phase 8.
- **D-08:** Fonts: Noto Serif for display/headlines, Space Grotesk for body (per Stitch component files — overrides DESIGN.md mention of Inter)
- **D-09:** "No-Line Rule" strictly applied — no 1px borders for section separation; use tonal surface shifts and negative space instead
- **D-10:** Glassmorphism restricted to floating/nav overlays only — article content uses clean tonal surfaces, no glass
- **D-11:** Prose layout: max-width ~65ch, fluid typography, generous whitespace, `spacing-8` minimum from screen edges on desktop

### Post List Design

- **D-12:** Medium-style editorial list — each post row has title + excerpt + metadata (date, reading time, category tag) on the left, small thumbnail image on the right. No card borders.
- **D-13:** Metadata row per post: date + reading time + category tag
- **D-14:** Layout reference: `.stich/layout.jpeg` — use as the visual target for list density, spacing, and item structure
- **D-15:** Posts ordered reverse-chronological (newest first), no year grouping in Phase 8

### Syntax Highlighting

- **D-16:** Shiki at build time (zero runtime JS) — already built into Astro
- **D-17:** Custom Shiki theme matching `.stich` tokens: dark theme maps to `#131313` background + Stitch surface/text tokens; light theme maps to `#FAFAFA` + light mode tokens. Claude builds the custom theme JSON from the Stitch token values.

### Claude's Discretion

- Exact monorepo path resolution for `import.meta.glob()` across workspace boundaries
- `@illu/tokens` package structure (CSS file export, Tailwind plugin, or both)
- Whether to use Astro's built-in `<Image />` component or plain `<img>` for thumbnails
- Reading time calculation library or inline implementation
- Astro layout component structure (BaseLayout, BlogLayout, PostLayout hierarchy)
- Whether existing timeline content files need updated frontmatter or can keep current shape alongside new blog frontmatter

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `.stich/DESIGN.md` — Core design philosophy, color palette, typography rules, "No-Line Rule", glassmorphism rules, spacing principles
- `.stich/visual/COMPONENTS.html` — Dark mode CSS token values (source of truth for dark @theme)
- `.stich/visual/COMPONENTS_LIGHT.html` — Light mode CSS token values (source of truth for light @theme)
- `.stich/layout.jpeg` — Visual reference for post list layout (Medium-style editorial)

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 8 — Goal, success criteria, requirements BLOG-01 through BLOG-04, VIS-01, VIS-02
- `.planning/REQUIREMENTS.md` §Blog Core, §Visual Identity — Full requirement definitions

### Existing Code
- `apps/blog/package.json` — Current blog app config (Astro 6.1.1, @illu/content dep)
- `apps/blog/astro.config.ts` — Current Astro config (site: writing.illulachy.me)
- `apps/blog/src/pages/index.astro` — Phase 7 placeholder (to be replaced)
- `packages/content/package.json` — @illu/content package config
- `packages/content/content/` — Existing markdown content files (timeline entries, some becoming blog posts)
- `packages/content/src/index.ts` — Content package exports (types)
- `apps/portfolio/src/index.css` — Existing portfolio @theme tokens (base reference for @illu/tokens extraction)

### Prior Phase Context
- `.planning/phases/05-ui-chrome/05-CONTEXT.md` — Tailwind v4 @theme setup, glassmorphism patterns, design token inventory
- `.planning/phases/07-monorepo-scaffold/07-CONTEXT.md` — Monorepo structure, @illu/content JIT pattern, Turborepo pipeline

</canonical_refs>

<specifics>
## Specific Ideas

**Token package strategy:** Extract tokens from both Stitch HTML files into `packages/tokens/` as `@illu/tokens`. The package exports a single CSS file that both apps `@import`. This avoids duplicating token definitions between portfolio and blog.

**Content upgrade approach:** Claude should check existing content files — ones with meaningful potential body content (tech topics, reflections) get upgraded to real posts. YouTube/project stubs stay as timeline entries only.

**Reading time formula:** ~200 words/minute, round to nearest minute, minimum "1 min read".

**Medium-style post list:** Title is Noto Serif headline-sized, excerpt is Space Grotesk body text, metadata is small label text. Thumbnail is square or 16:9, right-aligned, ~120-160px. The layout reference (`.stich/layout.jpeg`) is the visual target.

**Shiki custom theme naming:** `illu-dark` and `illu-light` — two themes registered in Astro's Shiki config with token values from Stitch.

**Note on VIS-01:** Requirements say "Catppuccin Mocha" but the actual design system (`.stich/DESIGN.md`) is a custom editorial palette — charcoal + white + mauve. The Stitch design supersedes the Catppuccin reference in REQUIREMENTS.md.

</specifics>

<deferred>
## Deferred Ideas

- **Featured/hero post section** — User's layout reference shows a hero post at top. Deferred — not in Phase 8 success criteria. Consider for backlog.
- **Subscribe/newsletter button** — Visible in layout reference. Not in v1.1 scope.
- **Manual dark/light toggle** — Phase 8 uses system preference only. User toggle could be added later.
- **Draft flag in frontmatter** — Not needed for Phase 8 (no drafts yet). Add in Phase 9 if needed.

</deferred>

---

*Phase: 08-blog-foundation*
*Context gathered: 2026-03-29*
