# Phase 2 Context: Content Pipeline

**Phase Goal:** Content is authored in markdown and bundled as JSON at build time  
**Depends on:** Phase 1 (needs TypeScript types from foundation)  
**Context Gathered:** 2026-03-23

---

## Implementation Decisions

### 1. Markdown Organization

**Directory Structure:**
- **Year-based folders:** `content/2024/`, `content/2025/`, etc.
- **Rationale:** Chronological organization matches timeline nature; easy to navigate by year
- **Glob pattern:** `content/**/*.md` (recursive discovery across all year folders)
- **Flexibility:** New years automatically discovered without config changes

**File Naming Convention:**
- **Slug-based:** `my-first-video.md`, `portfolio-redesign.md`, `graduation.md`
- **NOT date-prefixed:** Date comes from YAML frontmatter, not filename
- **Rationale:** Clean filenames in editor, easy to rename without breaking IDs
- **ID generation:** Filename (without .md extension) becomes content ID

**Draft Handling:**
- **Frontmatter flag:** `draft: true` to exclude from build
- **Default behavior:** Files without `draft` field are treated as published
- **Build behavior:** Drafts are parsed but filtered out before JSON generation
- **Rationale:** Keep work-in-progress content in repo without showing on timeline

**Discovery Strategy:**
- **Recursive glob:** `content/**/*.md` finds all markdown files in any nested folder
- **No explicit year filtering:** Accept any subfolder structure (2020-2099+)
- **Skip patterns:** `.git`, `node_modules`, `dist` automatically excluded by glob
- **Future-proof:** New content types or organizational changes don't break discovery

---

### 2. Frontmatter Schema

**Schema Strategy:**
- **Shared base + type-specific fields**
- **Base schema (all types):**
  ```yaml
  type: youtube       # Required: content type
  date: March 15, 2024  # Required: human-readable date
  title: My First Video  # Required: display title
  draft: false        # Optional: defaults to false (published)
  ```
- **Type-specific extensions:**
  - **YouTube:** `url` (video URL), `thumbnail` (optional - can auto-generate from YouTube)
  - **Blog:** `url` (letters.illulachy.me link), `tags` (optional)
  - **Project:** `url` (external project URL), `tech` (optional tech stack)
  - **Milestone:** `institution` (school/company), `duration` (optional), `description` (optional)

**Required vs. Optional Fields:**
- **Minimal required set:** `type`, `date`, `title` only
- **Rationale:** Flexibility for different content types; milestones may not have URLs
- **Optional fields:** `url`, `thumbnail`, `description`, `tags`, `tech`, `institution`, `duration`
- **Validation:** Build fails if any required field is missing

**Date Format:**
- **Input format:** Human-readable strings (e.g., "March 15, 2024", "January 2023", "2022")
- **Parsing strategy:** Use JavaScript `Date()` constructor or date parsing library
- **Output format:** ISO 8601 strings (e.g., "2024-03-15T00:00:00.000Z")
- **Validation:** Build fails if date cannot be parsed to valid Date object
- **Partial dates:** Accept year-only or month-year, normalize to first of month/year
- **Rationale:** Author-friendly input, machine-readable output for timeline sorting

**Markdown Body Content:**
- **Ignore completely:** Only frontmatter is parsed and bundled
- **Phase 2 scope:** Body content not needed for timeline visualization
- **Future consideration:** If Phase 3 milestone details require it, body parsing can be added later
- **Rationale:** Simpler pipeline; reduces bundle size; timeline shows metadata only

**Example Frontmatter:**

```yaml
# YouTube entry
---
type: youtube
title: How I Built This Canvas Timeline
date: March 15, 2024
url: https://www.youtube.com/watch?v=example
thumbnail: https://img.youtube.com/vi/example/maxresdefault.jpg
draft: false
---
```

```yaml
# Milestone entry
---
type: milestone
title: Graduated from MIT
date: May 2023
institution: Massachusetts Institute of Technology
description: Bachelor's in Computer Science
---
```

```yaml
# Project entry
---
type: project
title: Canvas Portfolio Site
date: January 2024
url: https://illulachy.me
tech: React, tldraw, Vite
draft: false
---
```

---

### 3. Build Integration

**Build Architecture:**
- **Dual-mode integration:**
  1. **Standalone script:** `npm run generate-timeline` (manual execution)
  2. **Vite plugin:** Watches content files during dev, triggers regeneration
- **Rationale:** Script for CI/build pipelines, plugin for DX during development
- **Plugin responsibility:** Watch `content/**/*.md`, call generator script on changes

**Output Location:**
- **Path:** `public/timeline.json` (static asset)
- **Access pattern:** Fetch at runtime via `/timeline.json`
- **Not imported as module:** Keeps Vite bundle separate from content data
- **Gitignore:** DO NOT ignore `timeline.json` (commit generated file for deployments)
- **Rationale:** Static asset = simple fetch, no bundler dependency, easy debugging

**Development Workflow:**
- **Watch mode:** Vite plugin watches `content/**/*.md` during `npm run dev`
- **Auto-regeneration:** File changes trigger timeline.json rebuild
- **HMR behavior:** Timeline changes require full page reload (JSON fetch, not module)
- **Manual mode:** `npm run generate-timeline` for explicit regeneration
- **Build enforcement:** `npm run build` runs generator script before Vite build

**Parsing Libraries:**
- **Updated choice:** `marked` + `gray-matter` + `fast-glob`
- **Rationale:** Lighter than remark ecosystem; body content ignored anyway
- **Dependencies:**
  - `gray-matter` - YAML frontmatter parsing
  - `marked` - Markdown parsing (if body needed later)
  - `fast-glob` - File discovery with `content/**/*.md` pattern
  - `chokidar` - File watching for Vite plugin
- **NOT using:** remark/unified ecosystem (heavier, unnecessary for frontmatter-only)

**Generator Script Structure:**
```typescript
// scripts/generate-timeline.ts
import matter from 'gray-matter'
import fg from 'fast-glob'
import fs from 'fs/promises'

// 1. Discover: fast-glob content/**/*.md
// 2. Parse: gray-matter extracts frontmatter
// 3. Validate: Check required fields (type, date, title)
// 4. Transform: Parse dates, generate IDs from filenames
// 5. Filter: Remove draft: true entries
// 6. Sort: Chronological order (oldest to newest)
// 7. Output: Write public/timeline.json
```

**Vite Plugin Structure:**
```typescript
// vite-plugin-timeline.ts
import { Plugin } from 'vite'
import chokidar from 'chokidar'
import { execSync } from 'child_process'

export function timelinePlugin(): Plugin {
  return {
    name: 'timeline-generator',
    configureServer(server) {
      // Watch content/**/*.md
      const watcher = chokidar.watch('content/**/*.md')
      watcher.on('change', () => {
        execSync('npm run generate-timeline')
        server.ws.send({ type: 'full-reload' })
      })
    },
    buildStart() {
      // Ensure timeline.json exists before build
      execSync('npm run generate-timeline')
    }
  }
}
```

---

### 4. Content Validation

**Validation Philosophy:**
- **Strict validation:** Build fails on invalid content
- **Fail fast:** Catch authoring errors at build time, not runtime
- **Helpful errors:** Log which file + which field failed validation
- **No silent skipping:** Invalid entries prevent successful build

**Required Field Validation:**
- **Must exist:** `type`, `date`, `title`
- **Validation logic:**
  ```typescript
  if (!frontmatter.type || !frontmatter.date || !frontmatter.title) {
    throw new Error(`Missing required fields in ${filename}`)
  }
  ```
- **Build failure:** Stops build immediately with error message
- **Rationale:** Enforce content quality; prevent incomplete entries on timeline

**Content Type Validation:**
- **Free-form strings:** Accept ANY type value (not enum-validated)
- **No TypeScript enforcement:** Parser doesn't restrict to 'youtube' | 'blog' | 'project' | 'milestone'
- **Rationale:** Extensibility - can add new types (e.g., 'podcast', 'talk') without code changes
- **Frontend responsibility:** Phase 3 shape rendering can handle unknown types gracefully
- **Future-proof:** v2 might add content types not planned in v1

**Date Validation & Normalization:**
- **Parse to ISO 8601:** Convert human-readable to standardized format
- **Fail if unparseable:** Invalid dates stop the build
- **Parsing strategy:**
  ```typescript
  const parsedDate = new Date(frontmatter.date)
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date in ${filename}: ${frontmatter.date}`)
  }
  const isoDate = parsedDate.toISOString()
  ```
- **Partial date handling:**
  - "2024" → "2024-01-01T00:00:00.000Z"
  - "March 2024" → "2024-03-01T00:00:00.000Z"
  - "March 15, 2024" → "2024-03-15T00:00:00.000Z"
- **Future dates:** Allowed (e.g., scheduled content)

**ID Generation:**
- **Strategy:** Use filename (without `.md` extension) as content ID
- **Example:** `content/2024/my-video.md` → ID: `my-video`
- **Uniqueness check:** Build fails if duplicate IDs detected
- **Validation:**
  ```typescript
  const id = path.basename(filename, '.md')
  if (seenIds.has(id)) {
    throw new Error(`Duplicate ID detected: ${id}`)
  }
  seenIds.add(id)
  ```
- **Rationale:** Simple, predictable, human-readable IDs; filenames must be unique anyway
- **Cross-year collision:** `2024/video.md` and `2025/video.md` both produce ID `video` - BUILD FAILS
- **Solution:** Enforce unique slugs across all years

**Error Reporting:**
- **Format:** `[Timeline Generator] Error in content/2024/my-video.md: Missing required field 'date'`
- **Stack trace:** Include for debugging
- **Exit code:** Non-zero to fail CI/CD builds
- **Color coding:** Red for errors (if terminal supports colors)

---

## Code Context

### Existing Assets (from Phase 1)

**TypeScript Types (Ready to Use):**
- **Location:** `src/types/content.ts`
- **Existing interface:**
  ```typescript
  export type ContentType = 'youtube' | 'blog' | 'project' | 'milestone'
  export interface ContentNode {
    id: string
    type: ContentType
    title: string
    date: string  // ISO 8601
    url?: string
    thumbnail?: string
    description?: string
  }
  export interface TimelineData {
    nodes: ContentNode[]
    lastUpdated: string
  }
  ```
- **Phase 2 action:** Update `ContentType` to `string` (free-form validation choice)
- **Extension needed:** Add type-specific fields if needed (institution, tech, etc.)

**Project Structure:**
- **Vite setup:** `vite.config.ts` exists, ready for plugin integration
- **Package manager:** npm (based on `package.json`)
- **Dev server:** `npm run dev` runs Vite dev server
- **Build script:** `npm run build` compiles TypeScript + bundles with Vite

**Design System:**
- **Not applicable to Phase 2:** Content pipeline is build-time tooling, no UI components
- **Future phases:** Phase 3+ will use `.stitch/` design tokens for timeline node rendering

### Integration Points

**Canvas Component (Phase 1):**
- **Timeline prop:** Canvas.tsx accepts `timeline?: TimelineData` prop (defined but unused)
- **Phase 2 deliverable:** Populate this prop with fetched timeline.json
- **Fetch location:** App.tsx or Canvas.tsx (decide during planning)
- **Loading state:** Use existing CanvasLoader while fetching timeline.json

**Phase 2 Scope Boundaries:**
- ✅ Content directory structure (`content/YYYY/*.md`)
- ✅ Frontmatter schema definition (YAML spec)
- ✅ Generator script (`scripts/generate-timeline.ts`)
- ✅ Vite plugin for watch mode (`vite-plugin-timeline.ts`)
- ✅ Timeline JSON output (`public/timeline.json`)
- ✅ Sample content (10-20 entries spanning all types)
- ✅ Validation logic (required fields, date parsing, ID uniqueness)
- ✅ Dependencies installation (gray-matter, marked, fast-glob, chokidar)
- ❌ Timeline node rendering (Phase 3: Custom Shapes & Hub)
- ❌ Layout algorithm (Phase 4: Timeline Layout)
- ❌ UI components for content display (Phase 5: UI Chrome)

**Downstream Phase Dependencies:**
- **Phase 3** will consume timeline.json to render custom shapes on canvas
- **Phase 4** will use date fields for chronological positioning
- **Phase 5** might add loading UI for timeline.json fetch
- **Phase 6** (Game Mode) will navigate between timeline nodes (needs IDs)

---

## Requirements Coverage

Phase 2 delivers these requirements from REQUIREMENTS.md:

- **CONTENT-01**: Content authored in markdown with YAML frontmatter ✓
- **CONTENT-02**: Frontmatter includes date, title, URL, and type ✓
- **CONTENT-03**: Content processed at build time (not runtime) ✓
- **CONTENT-04**: Timeline data bundled as JSON ✓
- **CONTENT-05**: At least 10-20 sample entries exist ✓
- **TECH-03**: Content parsing uses gray-matter + marked ✓ (updated from remark)

**Success Criteria (from ROADMAP.md):**
1. ✓ Developer can create markdown file with YAML frontmatter (date, title, URL, type) and it validates at build time
2. ✓ Build process parses markdown files and outputs timeline.json with all entries
3. ✓ At least 10-20 sample entries exist spanning multiple content types (YouTube, blog, project, milestone)
4. ✓ Timeline JSON loads at runtime without parsing markdown

---

## Sample Content Strategy

**10-20 Sample Entries Distribution:**
- **YouTube:** 4-5 entries (2023-2024)
- **Blog:** 4-5 entries (2022-2024)
- **Project:** 3-4 entries (2021-2024)
- **Milestone:** 3-4 entries (2018-2023, education + career milestones)

**Content Realism:**
- Use realistic titles and dates (not "Test Entry 1", "Test Entry 2")
- Span multiple years (demonstrate chronological layout works)
- Include draft examples (1-2 draft entries to test filtering)
- Mix of entries with/without optional fields (thumbnails, descriptions)

**Sample Entry Examples:**

**content/2024/canvas-timeline-build.md:**
```markdown
---
type: youtube
title: Building an Infinite Canvas Portfolio
date: March 15, 2024
url: https://www.youtube.com/watch?v=example
thumbnail: https://img.youtube.com/vi/example/maxresdefault.jpg
---
```

**content/2023/tldraw-deep-dive.md:**
```markdown
---
type: blog
title: Deep Dive into tldraw Architecture
date: November 3, 2023
url: https://letters.illulachy.me/tldraw-deep-dive
---
```

**content/2022/portfolio-redesign.md:**
```markdown
---
type: project
title: Portfolio Site Redesign
date: June 2022
url: https://illulachy.me
tech: React, TypeScript, Tailwind
---
```

**content/2020/graduated-mit.md:**
```markdown
---
type: milestone
title: Graduated from MIT
date: May 2020
institution: Massachusetts Institute of Technology
description: Bachelor of Science in Computer Science
---
```

**content/2024/draft-idea.md:**
```markdown
---
type: blog
title: Upcoming Post About WebGPU
date: April 2024
draft: true
---
```

---

## Open Questions for Research Phase

**Technical Investigations Needed:**

1. **Date Parsing Strategy:**
   - Which library for human-readable date parsing? (date-fns, dayjs, or native Date?)
   - How to handle ambiguous dates like "March 2024"? (first of month? mid-month?)
   - Timezone handling? (Default to UTC?)

2. **Vite Plugin Implementation:**
   - Best practice for executing scripts from Vite plugin? (execSync vs. spawn?)
   - How to trigger HMR/full reload after timeline.json changes?
   - Performance impact of watch mode on large content directories?

3. **Content Fetching Strategy (Runtime):**
   - Fetch timeline.json in App.tsx or Canvas.tsx?
   - Cache strategy? (Service worker, localStorage, no cache?)
   - Error handling if fetch fails? (Show empty timeline? Error state?)

4. **Generator Script Performance:**
   - Parallel vs. sequential file parsing? (Promise.all vs. for-loop?)
   - Performance benchmarks: How long for 100 entries? 1000 entries?
   - Should we minify timeline.json? (Tradeoff: file size vs. debuggability)

5. **Type Extensions:**
   - Should ContentNode interface be extended with type-specific fields?
   - Union types for different content types? (YouTubeNode | BlogNode | etc.)
   - Or keep flat interface with optional fields?

**Research Should Produce:**
- Generator script implementation (TypeScript)
- Vite plugin implementation
- Sample content files (10-20 realistic entries)
- Validation logic with error messages
- Date parsing utilities
- Timeline.json schema example

---

## Deferred Decisions (Out of Scope for Phase 2)

- **Markdown body parsing:** Ignored in v1; add if Phase 3 milestone details need it
- **Content search/filtering:** v2 feature (SEARCH-01, SEARCH-02)
- **CMS integration:** Out of scope; content is Git-based
- **Image optimization:** Phase 2 stores thumbnail URLs as-is; Phase 5 might optimize
- **Incremental builds:** Regenerate all content on any change (optimize later if slow)
- **Content validation UI:** CLI errors only; no web-based validation tool
- **Multi-language support:** English-only for v1
- **Rich metadata:** Tags, categories, SEO fields - defer to v2

---

## Success Indicators

**Developer can:**
- ✅ Create markdown file in `content/2024/my-entry.md` with frontmatter
- ✅ Run `npm run generate-timeline` and see `public/timeline.json` created
- ✅ Run `npm run dev` and see timeline.json auto-regenerate on content changes
- ✅ Introduce invalid frontmatter (missing date) and see build fail with clear error
- ✅ Mark entry as `draft: true` and confirm it's excluded from timeline.json
- ✅ Create 10-20 sample entries spanning all content types
- ✅ Inspect timeline.json and see valid ISO 8601 dates, correct IDs, sorted chronologically

**Timeline.json structure:**
```json
{
  "nodes": [
    {
      "id": "graduated-mit",
      "type": "milestone",
      "title": "Graduated from MIT",
      "date": "2020-05-15T00:00:00.000Z",
      "institution": "Massachusetts Institute of Technology",
      "description": "Bachelor of Science in Computer Science"
    },
    {
      "id": "canvas-timeline-build",
      "type": "youtube",
      "title": "Building an Infinite Canvas Portfolio",
      "date": "2024-03-15T00:00:00.000Z",
      "url": "https://www.youtube.com/watch?v=example",
      "thumbnail": "https://img.youtube.com/vi/example/maxresdefault.jpg"
    }
  ],
  "lastUpdated": "2024-03-23T02:00:00.000Z"
}
```

**Build passes when:**
- All markdown files have required fields (type, date, title)
- All dates parse to valid ISO 8601 strings
- No duplicate IDs exist
- Draft entries are filtered out

**Build fails when:**
- Missing required fields
- Unparseable dates
- Duplicate IDs (same filename in different year folders)

---

**Context complete. Ready for research and planning phases.**
