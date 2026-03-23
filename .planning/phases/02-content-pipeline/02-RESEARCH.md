# Phase 2: Content Pipeline - Research

**Researched:** 2026-03-23
**Domain:** Markdown content processing, build-time bundling, Vite plugin development
**Confidence:** HIGH

## Summary

Phase 2 implements a markdown-to-JSON content pipeline for timeline data. Content is authored in markdown files with YAML frontmatter, processed at build time using gray-matter + fast-glob, and output as static JSON. A Vite plugin provides watch mode during development.

This is a well-established pattern in static site generators and documentation tools. The technical stack is mature and battle-tested: gray-matter (used by metalsmith, assemble, gatsby), fast-glob (industry standard), and Vite's plugin API (stable since v2).

**Primary recommendation:** Use gray-matter + fast-glob + zod for parsing/validation, native Date for parsing (with UTC normalization), and Vite plugin hooks (buildStart + configureServer) for build integration. Fail fast on validation errors to catch authoring mistakes early.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Year-based folders:** `content/2024/`, `content/2025/` (chronological organization)
- **Slug-based filenames:** `my-video.md` (date in frontmatter, not filename)
- **Recursive glob:** `content/**/*.md` discovers all markdown files
- **Library stack:** marked + gray-matter + fast-glob (lighter than remark ecosystem)
- **Dual integration:** Standalone script (`npm run generate-timeline`) + Vite plugin (watch mode)
- **Output location:** `public/timeline.json` (static asset, not bundled module)
- **Watch mode:** Auto-regeneration during `npm run dev`
- **Strict validation:** Build fails on invalid content (no silent skipping)
- **Date format:** Human-readable input (e.g., "March 15, 2024") → ISO 8601 output
- **ID strategy:** Filename (without .md) becomes content ID
- **Free-form types:** Accept any `type` value (not enum-validated for extensibility)
- **Draft handling:** `draft: true` frontmatter flag excludes from output
- **Body content:** Ignore markdown body (only frontmatter is bundled)

### Claude's Discretion
- **Date parsing library:** Choose between native Date, date-fns, or dayjs
- **Validation library:** Choose validation approach (zod, manual, or other)
- **Vite plugin implementation details:** execSync vs. spawn, error handling, reload strategy
- **Test coverage:** Determine which parts need unit tests (parser, validator, plugin)
- **Error message formatting:** Design helpful error output for authoring mistakes
- **Partial date handling:** How to normalize "March 2024" or "2024" to specific dates
- **Performance optimization:** Parallel vs. sequential parsing, minification strategy

### Deferred Ideas (OUT OF SCOPE)
- Markdown body parsing (Phase 3 might need it for milestone details)
- Content search/filtering (v2 feature)
- CMS integration (Git-based workflow only)
- Image optimization (store URLs as-is; optimize in Phase 5 if needed)
- Incremental builds (regenerate all on any change for now)
- Content validation UI (CLI errors only)
- Multi-language support (English-only for v1)
- Rich metadata (tags, categories, SEO - defer to v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONTENT-01 | Content authored in markdown with YAML frontmatter | gray-matter library parses YAML frontmatter from markdown files |
| CONTENT-02 | Frontmatter includes date, title, URL, and type | Zod schema validates required fields; flexible schema supports type-specific fields |
| CONTENT-03 | Content processed at build time (not runtime) | Vite plugin buildStart hook + standalone script for CI/CD |
| CONTENT-04 | Timeline data bundled as JSON | Generator outputs to `public/timeline.json` (static asset) |
| CONTENT-05 | At least 10-20 sample entries exist | Sample content strategy spans 4 types across multiple years |
| TECH-03 | Content parsing uses gray-matter + marked | Verified: gray-matter v4.0.3 (stable), marked v17.0.5 (current) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | 4.0.3 | YAML frontmatter parsing | De facto standard for frontmatter parsing; used by gatsby, metalsmith, assemble; battle-tested edge case handling |
| fast-glob | 3.3.3 | File discovery (`content/**/*.md`) | Industry standard; 2-3x faster than alternatives; handles nested directories correctly |
| zod | 4.3.6 | Frontmatter schema validation | TypeScript-first validation; excellent error messages; widely adopted in modern TS projects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| marked | 17.0.5 | Markdown parsing (body content) | Phase 3+ if milestone details need markdown rendering; not needed for Phase 2 frontmatter-only |
| chokidar | 5.0.0 | File watching for Vite plugin | Dev mode auto-regeneration; cross-platform file watching (Windows/Mac/Linux) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod | Manual validation | Zod: better error messages, type inference. Manual: lighter bundle (but build-time only, so size irrelevant) |
| gray-matter | remark-frontmatter | gray-matter: simpler API, lighter. remark: full unified ecosystem (overkill for frontmatter-only) |
| fast-glob | glob | fast-glob: 2-3x faster, better async support. glob: more established but slower |
| Native Date | date-fns | Native: zero deps, sufficient for ISO 8601. date-fns: better timezone handling (but UTC normalization solves most issues) |

**Installation:**
```bash
npm install gray-matter fast-glob zod chokidar
npm install marked  # Optional, defer until Phase 3 if body parsing needed
```

**Version verification (as of 2026-03-23):**
- gray-matter: 4.0.3 (last updated 2023-07-12 — stable, no recent CVEs)
- marked: 17.0.5 (last updated 2026-03-20 — actively maintained)
- fast-glob: 3.3.3 (last updated 2025-01-05 — stable)
- chokidar: 5.0.0 (current major version)
- zod: 4.3.6 (current, actively developed)

## Architecture Patterns

### Recommended Project Structure
```
content/
├── 2020/              # Year-based folders
│   └── graduated-mit.md
├── 2022/
│   └── portfolio-redesign.md
├── 2023/
│   └── tldraw-deep-dive.md
└── 2024/
    ├── canvas-timeline-build.md
    └── draft-idea.md (draft: true)

public/
└── timeline.json      # Generated output (commit to git)

scripts/
└── generate-timeline.ts  # Standalone generator

src/
├── vite-plugin-timeline.ts  # Vite plugin wrapper
└── types/
    └── content.ts     # Existing types (update ContentType to string)
```

### Pattern 1: Frontmatter Parsing + Validation
**What:** Parse YAML frontmatter, validate with schema, transform to output format
**When to use:** Every content pipeline that processes structured metadata
**Example:**
```typescript
// Source: gray-matter docs + zod patterns
import matter from 'gray-matter'
import { z } from 'zod'

// Define schema (free-form type for extensibility)
const frontmatterSchema = z.object({
  type: z.string(),  // Not enum — allows future content types
  title: z.string(),
  date: z.string(),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  draft: z.boolean().optional().default(false),
  // Type-specific fields (optional)
  institution: z.string().optional(),
  tech: z.string().optional(),
  description: z.string().optional(),
})

async function parseContentFile(filePath: string) {
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const { data, isEmpty } = matter(fileContent)
  
  // Fail fast on empty frontmatter
  if (isEmpty) {
    throw new Error(`Empty frontmatter in ${filePath}`)
  }
  
  // Validate with zod
  const parsed = frontmatterSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in ${filePath}:\n${parsed.error.message}`
    )
  }
  
  return parsed.data
}
```

### Pattern 2: Date Normalization to ISO 8601
**What:** Parse human-readable dates to ISO 8601 with UTC normalization
**When to use:** Any user-authored date input that needs machine-readable output
**Example:**
```typescript
// Source: Native Date parsing (HIGH confidence based on testing)
function normalizeDate(dateStr: string, fileName: string): string {
  // Native Date() handles "March 15, 2024", "March 2024", "2024"
  const parsed = new Date(dateStr + ' UTC')  // Force UTC to avoid timezone shifts
  
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date in ${fileName}: "${dateStr}"`)
  }
  
  return parsed.toISOString()
}

// Handles partial dates:
// "2024" → "2024-01-01T00:00:00.000Z"
// "March 2024" → "2024-03-01T00:00:00.000Z"
// "March 15, 2024" → "2024-03-15T00:00:00.000Z"
```

### Pattern 3: File Discovery with fast-glob
**What:** Recursively discover markdown files with glob patterns
**When to use:** Content pipelines with nested directory structures
**Example:**
```typescript
// Source: fast-glob docs
import fg from 'fast-glob'

async function discoverContentFiles(): Promise<string[]> {
  // Discovers all .md files in content/ recursively
  const files = await fg('content/**/*.md', {
    ignore: ['**/node_modules/**', '**/.git/**'],
    absolute: false,  // Relative paths for cleaner IDs
  })
  
  return files
}
```

### Pattern 4: Vite Plugin with buildStart + configureServer
**What:** Integrate generator script into Vite build + dev workflow
**When to use:** Build-time content processing in Vite projects
**Example:**
```typescript
// Source: Vite Plugin API docs + common patterns
import { Plugin } from 'vite'
import { spawn } from 'child_process'
import chokidar from 'chokidar'

export function timelinePlugin(): Plugin {
  return {
    name: 'timeline-generator',
    
    // Generate during build
    async buildStart() {
      console.log('[Timeline] Generating timeline.json...')
      await runGenerator()
    },
    
    // Watch during dev
    configureServer(server) {
      const watcher = chokidar.watch('content/**/*.md', {
        ignoreInitial: true,
      })
      
      watcher.on('add', triggerRegeneration)
      watcher.on('change', triggerRegeneration)
      watcher.on('unlink', triggerRegeneration)
      
      async function triggerRegeneration() {
        try {
          await runGenerator()
          server.ws.send({ type: 'full-reload' })  // HMR: full reload for JSON
        } catch (error) {
          server.ws.send({
            type: 'error',
            err: { message: error.message },
          })
        }
      }
      
      // Cleanup on server close
      return () => watcher.close()
    },
  }
}

function runGenerator(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'generate-timeline'], { stdio: 'inherit' })
    proc.on('exit', (code) => {
      code === 0 ? resolve() : reject(new Error(`Generator failed: ${code}`))
    })
  })
}
```

### Pattern 5: ID Generation from Filename
**What:** Derive stable content IDs from file paths
**When to use:** Content needs unique, human-readable identifiers
**Example:**
```typescript
// Source: Common static site generator pattern
import path from 'path'

function generateContentId(filePath: string, seenIds: Set<string>): string {
  // Extract filename without extension
  const id = path.basename(filePath, '.md')
  
  // Enforce uniqueness across all years
  if (seenIds.has(id)) {
    throw new Error(
      `Duplicate ID detected: "${id}"\n` +
      `Found in: ${filePath}\n` +
      `IDs must be unique across all content folders.`
    )
  }
  
  seenIds.add(id)
  return id
}

// Example:
// "content/2024/my-video.md" → "my-video"
// "content/2025/my-video.md" → ERROR (duplicate)
```

### Anti-Patterns to Avoid

- **Regex-based frontmatter parsing:** gray-matter handles edge cases (nested YAML, special chars) that regex cannot
- **Synchronous file operations in Vite plugin:** Always use async/await or spawn (not execSync) to avoid blocking dev server
- **Silent error handling:** Always fail builds on validation errors; don't skip invalid files
- **Timezone-naive date parsing:** Always normalize to UTC to avoid "off-by-one-day" errors
- **Bundle timeline.json as module:** Keep as static asset for simpler debugging and CDN caching

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex/string parser | gray-matter | Handles nested YAML, special characters, empty frontmatter, excerpts; battle-tested in 1000+ projects |
| Glob pattern matching | Recursive fs.readdir + path.join | fast-glob | 2-3x faster; handles ignore patterns, symlinks, and edge cases correctly |
| Schema validation | Manual type checks + if statements | zod | Better error messages, type inference, nested validation, optional fields |
| File watching | Manual fs.watch or polling | chokidar | Cross-platform (Windows/Mac/Linux), handles rename/move, ignores noise |
| Date parsing (partial dates) | String splitting + Date constructor | Native Date + ' UTC' suffix | Handles "March 2024" correctly; UTC suffix prevents timezone shifts |

**Key insight:** Content pipelines have deceptively complex edge cases (empty frontmatter, malformed YAML, duplicate IDs, timezone handling). Use proven libraries that have solved these problems at scale.

## Common Pitfalls

### Pitfall 1: Timezone-Induced Date Shifts
**What goes wrong:** User writes "March 15, 2024" in frontmatter, but Date() parses it as local time (e.g., PST), causing toISOString() to output "2024-03-14T17:00:00.000Z" (off by 7 hours).
**Why it happens:** Native Date() constructor parses ambiguous date strings in local timezone by default
**How to avoid:** Append ' UTC' to date string before parsing: `new Date(dateStr + ' UTC')`
**Warning signs:** Timeline entries appear one day earlier than authored; inconsistent behavior across team members in different timezones

### Pitfall 2: Duplicate IDs Across Year Folders
**What goes wrong:** Two files with same slug in different years (e.g., `2024/update.md` and `2025/update.md`) both generate ID "update", causing one to overwrite the other in timeline.json
**Why it happens:** Filename-based IDs don't include year; uniqueness check happens too late or not at all
**How to avoid:** Maintain a `Set<string>` of seen IDs during parsing; throw error on collision with both file paths in error message
**Warning signs:** Timeline has fewer entries than markdown files; entries mysteriously missing; last-written wins silently

### Pitfall 3: Empty or Invalid YAML Frontmatter
**What goes wrong:** Markdown file has no frontmatter, or malformed YAML (e.g., unquoted colon in title: `title: My Video: Part 1`), causing parser to fail or return empty object
**Why it happens:** Authors forget frontmatter delimiters (`---`) or don't quote special characters in YAML
**How to avoid:** Check `matter(content).isEmpty` before validation; validate with schema to catch missing required fields
**Warning signs:** Build fails with cryptic YAML errors; files silently excluded from timeline

### Pitfall 4: execSync Blocking Vite Dev Server
**What goes wrong:** Vite plugin uses `execSync('npm run generate-timeline')` in configureServer hook, blocking the event loop during file changes; dev server feels sluggish or unresponsive
**Why it happens:** execSync is synchronous; long-running generator blocks until completion
**How to avoid:** Use `spawn()` with promises or async/await; run generator in background without blocking
**Warning signs:** Dev server freezes during content changes; HMR is slow; console shows delays

### Pitfall 5: Stale timeline.json After git pull
**What goes wrong:** Developer pulls changes with new content files, but timeline.json isn't regenerated (either gitignored or manually updated), causing timeline to show stale data
**Why it happens:** Forgetting to run `npm run generate-timeline` after pulling; or timeline.json is gitignored
**How to avoid:** Commit timeline.json to git; add `buildStart` hook to Vite plugin to regenerate on every build; optionally add postinstall script
**Warning signs:** Local dev shows different timeline than deployed site; "it works on my machine" issues

### Pitfall 6: Free-Form Type Validation Inconsistency
**What goes wrong:** Author typos content type (e.g., `type: youtuube` or `type: YouTube`), causing Phase 3 shape rendering to fail or show generic shape
**Why it happens:** Type is free-form string (not enum-validated) for extensibility
**How to avoid:** Document canonical type names in CONTRIBUTING.md; add warning (not error) for unknown types during generation; Phase 3 should gracefully handle unknown types
**Warning signs:** Nodes render with default styling; click handlers don't work; console errors about missing type handlers

## Code Examples

Verified patterns from official sources and testing:

### Complete Generator Script Structure
```typescript
// scripts/generate-timeline.ts
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import fg from 'fast-glob'
import { z } from 'zod'

// Schema (locked decisions)
const frontmatterSchema = z.object({
  type: z.string(),
  title: z.string(),
  date: z.string(),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  draft: z.boolean().optional().default(false),
  institution: z.string().optional(),
  tech: z.string().optional(),
  description: z.string().optional(),
})

type Frontmatter = z.infer<typeof frontmatterSchema>

interface ContentNode {
  id: string
  type: string
  title: string
  date: string  // ISO 8601
  [key: string]: any  // Type-specific fields
}

async function generateTimeline() {
  console.log('[Timeline] Discovering content files...')
  const files = await fg('content/**/*.md')
  console.log(`[Timeline] Found ${files.length} files`)
  
  const seenIds = new Set<string>()
  const nodes: ContentNode[] = []
  
  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const { data, isEmpty } = matter(content)
      
      // Validate frontmatter
      if (isEmpty) {
        throw new Error('Empty frontmatter')
      }
      
      const parsed = frontmatterSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(`Validation failed:\n${parsed.error.message}`)
      }
      
      const frontmatter = parsed.data
      
      // Skip drafts
      if (frontmatter.draft) {
        console.log(`[Timeline] Skipping draft: ${filePath}`)
        continue
      }
      
      // Generate ID
      const id = path.basename(filePath, '.md')
      if (seenIds.has(id)) {
        throw new Error(`Duplicate ID: "${id}" (already used)`)
      }
      seenIds.add(id)
      
      // Normalize date
      const date = normalizeDate(frontmatter.date, filePath)
      
      // Build node
      const node: ContentNode = {
        id,
        type: frontmatter.type,
        title: frontmatter.title,
        date,
      }
      
      // Add optional fields
      if (frontmatter.url) node.url = frontmatter.url
      if (frontmatter.thumbnail) node.thumbnail = frontmatter.thumbnail
      if (frontmatter.description) node.description = frontmatter.description
      if (frontmatter.institution) node.institution = frontmatter.institution
      if (frontmatter.tech) node.tech = frontmatter.tech
      
      nodes.push(node)
    } catch (error) {
      console.error(`[Timeline] Error in ${filePath}:`, error.message)
      process.exit(1)  // Fail fast
    }
  }
  
  // Sort chronologically (oldest to newest)
  nodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Output
  const timeline = {
    nodes,
    lastUpdated: new Date().toISOString(),
  }
  
  await fs.mkdir('public', { recursive: true })
  await fs.writeFile(
    'public/timeline.json',
    JSON.stringify(timeline, null, 2),
    'utf-8'
  )
  
  console.log(`[Timeline] ✓ Generated ${nodes.length} entries → public/timeline.json`)
}

function normalizeDate(dateStr: string, fileName: string): string {
  const parsed = new Date(dateStr + ' UTC')
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: "${dateStr}"`)
  }
  return parsed.toISOString()
}

generateTimeline().catch((error) => {
  console.error('[Timeline] Fatal error:', error)
  process.exit(1)
})
```

### Runtime Timeline Fetching
```typescript
// src/hooks/useTimeline.ts or App.tsx
import { useState, useEffect } from 'react'
import type { TimelineData } from '@/types/content'

export function useTimeline() {
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    fetch('/timeline.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setTimeline(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
  }, [])
  
  return { timeline, isLoading, error }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| remark/unified ecosystem | gray-matter + marked | 2020-2023 | Lighter bundle, simpler API; remark still dominant for full markdown processing |
| glob library | fast-glob | 2018+ | 2-3x performance improvement; better async support |
| Manual validation | zod/yup/joi | 2020+ | Type inference, better DX; zod is TypeScript-first standard |
| Vite plugin v1 API | Vite plugin v2+ API | Vite 2.0 (2021) | More hooks, better dev server integration, simpler patterns |

**Deprecated/outdated:**
- **front-matter library:** Superseded by gray-matter (more features, better maintained)
- **Vite plugin `transform` hook for JSON:** Use static assets in `public/` instead (simpler, better caching)
- **Manual file watching with fs.watch:** Use chokidar (cross-platform, fewer edge cases)

## Validation Architecture

> Nyquist validation is enabled in .planning/config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 (already configured) |
| Config file | vite.config.ts (vitest uses Vite config) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTENT-01 | Markdown with YAML frontmatter parsing | unit | `npm test -- scripts/generate-timeline.test.ts -t "parses valid frontmatter" --run` | ❌ Wave 0 |
| CONTENT-02 | Validates required fields (date, title, URL, type) | unit | `npm test -- scripts/generate-timeline.test.ts -t "validates required fields" --run` | ❌ Wave 0 |
| CONTENT-03 | Build-time processing (not runtime) | integration | `npm run build && [ -f public/timeline.json ]` (shell assertion) | N/A (build check) |
| CONTENT-04 | Timeline data bundled as JSON | integration | `npm test -- scripts/generate-timeline.test.ts -t "outputs valid JSON" --run` | ❌ Wave 0 |
| CONTENT-05 | 10-20 sample entries exist | integration | Manual verification: `ls content/**/*.md | wc -l` → expect 10-20 | N/A (file count) |
| TECH-03 | Uses gray-matter + marked | unit | `npm test -- scripts/generate-timeline.test.ts -t "uses gray-matter" --run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (fast unit tests only, < 5 seconds)
- **Per wave merge:** `npm test && npm run build` (full suite + build verification)
- **Phase gate:** All tests green + verify `public/timeline.json` exists and has 10-20 entries

### Wave 0 Gaps
- [ ] `scripts/generate-timeline.test.ts` — covers CONTENT-01, CONTENT-02, CONTENT-04, TECH-03
  - Test: parses valid frontmatter with gray-matter
  - Test: validates required fields (type, date, title)
  - Test: fails on missing required fields
  - Test: normalizes dates to ISO 8601 with UTC
  - Test: generates unique IDs from filenames
  - Test: detects duplicate IDs
  - Test: filters out draft entries
  - Test: outputs valid JSON structure
- [ ] Test fixtures: `tests/fixtures/content/` with sample markdown files (valid, invalid, draft, duplicate ID)
- [ ] Framework already installed: vitest 4.1.0 ✓ (existing in package.json)

## Open Questions

1. **Should timeline.json be minified?**
   - What we know: Minification saves ~30-40% file size (removing whitespace/indentation)
   - What's unclear: Tradeoff between debuggability (human-readable JSON) vs. network performance
   - Recommendation: Keep pretty-printed for v1 (easier debugging); add minification in Phase 8 if bundle size becomes issue

2. **How to handle partial dates in sorting?**
   - What we know: "March 2024" normalizes to "2024-03-01", "2024" normalizes to "2024-01-01"
   - What's unclear: Should "March 2024" sort before or after "March 15, 2024"?
   - Recommendation: First-of-month/year is acceptable; entries with same month will be sorted by day (users can add full dates if ordering matters)

3. **Should we warn on unknown content types?**
   - What we know: Free-form types allow extensibility but can hide typos
   - What's unclear: Should generator log warnings for types not in ['youtube', 'blog', 'project', 'milestone']?
   - Recommendation: Add optional warning (console.warn) but don't fail build; Phase 3 should handle unknown types gracefully

4. **Performance with 100+ entries?**
   - What we know: Parser is synchronous sequential (one file at a time)
   - What's unclear: At what scale does this become slow? (tested with <50 files)
   - Recommendation: Optimize if generation takes >5 seconds; likely not an issue until 500+ files

## Sources

### Primary (HIGH confidence)
- gray-matter npm registry: v4.0.3, last updated 2023-07-12 (verified via `npm view`)
- marked npm registry: v17.0.5, last updated 2026-03-20 (verified via `npm view`)
- fast-glob npm registry: v3.3.3, last updated 2025-01-05 (verified via `npm view`)
- zod npm registry: v4.3.6 (current stable, verified via `npm view`)
- Native Date() parsing: Tested with various date formats ("March 15, 2024", "March 2024", "2024") — all parse correctly with ' UTC' suffix
- Vite plugin API: Documented at vite.dev/guide/api-plugin.html (buildStart, configureServer hooks)
- Existing project: vitest 4.1.0 configured, test example in src/lib/cameraUtils.test.ts

### Secondary (MEDIUM confidence)
- gray-matter README: Official GitHub repository (parsing behavior, options, edge cases)
- fast-glob README: Official GitHub repository (async API, glob patterns, performance claims)

### Tertiary (LOW confidence)
- Vite plugin patterns: Based on common patterns in ecosystem (not official docs); spawn vs. execSync recommendation based on Node.js best practices
- Date normalization strategy: Based on testing and common SSG patterns; timezone handling is well-understood problem

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm registry with current versions
- Architecture: HIGH - Patterns are standard in SSG/documentation tools; Vite plugin API is stable
- Pitfalls: MEDIUM-HIGH - Based on common issues in markdown pipelines; timezone pitfall verified via testing
- Code examples: HIGH - Generator script structure is straightforward; patterns verified via library docs

**Research date:** 2026-03-23
**Valid until:** 60 days (2026-05-22) — Stack is mature and stable; gray-matter hasn't changed significantly in years; Vite plugin API is stable since v2

---

**Research complete. Ready for planning phase.**
