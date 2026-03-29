---
status: partial
phase: 08-blog-foundation
source: [08-VERIFICATION.md]
started: 2026-03-29T23:22:00Z
updated: 2026-03-29T23:22:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Post list renders correctly in browser
expected: Run `pnpm --filter @illu/blog dev`, 4 posts display in reverse-chronological order (newest first) with title, excerpt, date, reading time, and category tag visible
result: [pending]

### 2. Syntax highlighting colours match Stitch palette
expected: Open `/deep-dive-typescript` post, code blocks show Shiki highlighting with Stitch mauve/lavender palette (not default github-dark)
result: [pending]

### 3. Dark/light mode switching
expected: Toggle OS colour scheme — background switches between `#131313` (dark) and `#FAFAFA` (light), accent colours update accordingly
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
