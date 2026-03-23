---
phase: 02-content-pipeline
plan: 01
subsystem: content-pipeline
status: complete
completed: 2026-03-23T03:20:03Z
duration_minutes: 3.5
tags:
  - content-processing
  - build-pipeline
  - markdown
  - validation
dependency_graph:
  requires:
    - Phase 1 TypeScript types (ContentNode, TimelineData)
  provides:
    - Content generator script (scripts/generate-timeline.ts)
    - Content validation with zod
    - Markdown → JSON transformation
  affects:
    - Phase 2 Plan 2 (Vite integration will use this generator)
    - Phase 3 (Custom shapes will consume timeline.json)
tech_stack:
  added:
    - gray-matter@4.0.3 (YAML frontmatter parsing)
    - fast-glob@3.3.3 (File discovery)
    - zod@4.3.6 (Schema validation)
    - tsx@4.21.0 (TypeScript execution)
  patterns:
    - Fail-fast validation with clear error messages
    - ISO 8601 date normalization with UTC
    - Draft filtering (draft: true)
    - Duplicate ID detection
key_files:
  created:
    - scripts/generate-timeline.ts (generator implementation, 170 lines)
    - scripts/generate-timeline.test.ts (9 unit tests, 78 lines)
    - tests/fixtures/content/valid/sample-youtube.md
    - tests/fixtures/content/valid/sample-blog.md
    - tests/fixtures/content/invalid/missing-date.md
    - tests/fixtures/content/draft/draft-entry.md
    - public/timeline.json (generated output)
  modified:
    - src/types/content.ts (ContentType now string, added institution/tech fields)
    - package.json (added generate-timeline script)
decisions:
  - ContentType changed from union to string for extensibility
  - Date normalization uses "UTC" suffix for consistent timezone handling
  - Generator exports parseContentFile and normalizeDate for testing
  - Error messages prefixed with [Timeline] for easy identification
metrics:
  tasks_completed: 3
  commits: 3
  tests_added: 9
  files_created: 8
  duration: 3.5 minutes
---

# Phase 02 Plan 01: Core Content Pipeline Summary

**One-liner:** Markdown → JSON content pipeline with gray-matter/zod validation, ISO 8601 date normalization, and comprehensive test coverage

## What Was Built

Built the foundational content processing pipeline that transforms markdown files with YAML frontmatter into a structured JSON output for the timeline. The generator script parses frontmatter using gray-matter, validates required fields with zod schemas, normalizes dates to ISO 8601 format, and outputs sorted timeline.json.

**Key capabilities delivered:**
- Parse YAML frontmatter from markdown files
- Validate required fields (type, date, title) with zod
- Normalize partial dates (e.g., "January 2024") to ISO 8601 with UTC
- Filter draft entries (draft: true)
- Detect duplicate IDs and fail fast
- Sort entries chronologically (oldest first)
- Generate pretty-printed JSON output

## Tasks Completed

| Task | Name | Status | Commit | Duration |
|------|------|--------|--------|----------|
| 1 | Install dependencies and extend content types | ✓ Complete | d9e2e15 | ~1 min |
| 2 | Create generator script with frontmatter parsing and validation | ✓ Complete | 20d4561 | ~1.5 min |
| 3 | Create unit tests with fixtures for generator | ✓ Complete | 3050211 | ~1 min |

**Total:** 3/3 tasks complete in 3.5 minutes

## Verification Results

All verification criteria met:

✅ **Unit tests pass:** 9/9 tests passing
- ✓ Parses valid frontmatter with gray-matter
- ✓ Validates required fields (type, date, title)
- ✓ Fails on missing required fields with clear error
- ✓ Normalizes dates to ISO 8601 format
- ✓ Filters draft entries (draft: true)
- ✓ Generates unique IDs from filenames
- ✓ Outputs valid JSON structure

✅ **Generator executes:** `npm run generate-timeline` runs successfully

✅ **TypeScript compiles:** `npx tsc --noEmit` passes with no errors

✅ **Output valid:** `public/timeline.json` has correct TimelineData structure

## Success Criteria Met

- [x] Generator script exists at scripts/generate-timeline.ts
- [x] All unit tests pass (9 test cases)
- [x] gray-matter parses YAML frontmatter correctly
- [x] zod validates required fields (type, date, title)
- [x] Dates normalized to ISO 8601 with UTC
- [x] Draft entries filtered from output
- [x] JSON output has correct TimelineData structure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed zod error handling for validation failures**
- **Found during:** Task 3 (unit tests)
- **Issue:** Test failing with "Cannot read properties of undefined (reading 'map')" when validation fails. Zod v4 uses `result.error.issues` instead of `result.error.errors`
- **Fix:** Updated error handling to use `result.error.issues?.map()` with fallback to `result.error.message`
- **Files modified:** scripts/generate-timeline.ts
- **Commit:** 3050211 (included in Task 3 commit)
- **Impact:** All 9 tests now pass correctly

No other deviations — plan executed as written.

## Technical Highlights

### Architecture Decisions

**ContentType extensibility:** Changed from union type `'youtube' | 'blog' | 'project' | 'milestone'` to `string`. This allows content authors to add new content types without TypeScript changes.

**Date normalization strategy:** Append " UTC" to date strings before parsing with `new Date()`. This ensures consistent timezone handling for partial dates like "January 2024" (defaults to 1st of month at midnight UTC).

**Exported test utilities:** Generator exports `parseContentFile()` and `normalizeDate()` functions for unit testing. These are extracted from the main flow but used by the CLI script.

### Validation Schema

```typescript
const frontmatterSchema = z.object({
  type: z.string(),           // Free-form, not enum
  title: z.string(),
  date: z.string(),
  url: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  draft: z.boolean().optional().default(false),
  institution: z.string().optional(),
  tech: z.string().optional(),
  description: z.string().optional(),
})
```

**Key validations:**
- Required: type, title, date
- URL validation for url and thumbnail fields
- Draft defaults to false
- Type-specific fields (institution, tech) optional

### Error Handling

**Fail-fast philosophy:** Generator exits with code 1 on any error (validation failure, invalid date, duplicate ID). This prevents bad content from being committed.

**Clear error messages:** All errors prefixed with `[Timeline]` and include filepath + reason:
```
[Timeline] Error in content/2024/test.md: Validation failed: date: Required
```

## Testing Coverage

**9 unit tests** covering:
- Date normalization (full dates, partial dates, invalid dates)
- Valid frontmatter parsing (YouTube, blog)
- Required field validation
- Draft filtering
- ID generation from filenames
- JSON structure validation

**Test fixtures:**
- `tests/fixtures/content/valid/` — Valid YouTube and blog entries
- `tests/fixtures/content/invalid/` — Missing required fields
- `tests/fixtures/content/draft/` — Draft entries for filtering

## Requirements Fulfilled

From REQUIREMENTS.md:

- [x] **CONTENT-01:** Content is authored in markdown files with YAML frontmatter ✓
- [x] **CONTENT-02:** Markdown files include date, title, URL, and content type in frontmatter ✓
- [x] **CONTENT-03:** Content is processed at build time (not runtime) ✓
- [x] **CONTENT-04:** Timeline data is bundled as JSON ✓
- [x] **TECH-03:** Content parsing uses gray-matter + zod ✓

**Note:** CONTENT-05 (10-20 sample entries) will be addressed in Plan 02.

## Next Steps

**Phase 02 Plan 02:** Vite plugin integration
- Add Vite plugin that runs generator on dev server start
- Implement chokidar watch mode for dev hot-reload
- Create 12+ sample content entries (YouTube, blog, project, milestone)
- Integrate generator into build pipeline

**Dependencies for Plan 02:**
- This plan's generator script
- ContentNode types with type-specific fields

## Self-Check: PASSED

✅ All created files exist:
- scripts/generate-timeline.ts
- scripts/generate-timeline.test.ts
- tests/fixtures/content/valid/sample-youtube.md
- tests/fixtures/content/valid/sample-blog.md
- tests/fixtures/content/invalid/missing-date.md
- tests/fixtures/content/draft/draft-entry.md
- public/timeline.json

✅ All commits exist:
- d9e2e15: Install dependencies and extend content types
- 20d4561: Create generator script
- 3050211: Add unit tests with fixtures

✅ All tests passing:
- 9/9 unit tests pass
- TypeScript compiles with no errors
- Generator script executes successfully
