---
phase: 10
slug: search-and-extras
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `apps/blog/vitest.config.ts` |
| **Quick run command** | `pnpm --filter blog test --run` |
| **Full suite command** | `pnpm --filter blog test --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter blog test --run`
- **After every plan wave:** Run `pnpm --filter blog test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-W0-01 | W0 | 0 | SRCH-04 | unit | `pnpm --filter blog test --run timeline-match` | ❌ W0 | ⬜ pending |
| 10-01-01 | 01 | 1 | SRCH-01 | manual | See manual verifications | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | SRCH-01 | manual | See manual verifications | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | SRCH-02 | manual | See manual verifications | ✅ | ⬜ pending |
| 10-03-01 | 03 | 1 | SRCH-03 | unit | `pnpm --filter blog test --run` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 2 | SRCH-04 | unit | `pnpm --filter blog test --run timeline-match` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/blog/src/lib/timeline-match.ts` — utility to match blog post slug against timeline entries
- [ ] `apps/blog/src/test/timeline-match.test.ts` — unit tests for SRCH-04 slug matching logic

*All other phase behaviors use existing infrastructure or manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pagefind search bar renders and returns results | SRCH-01 | Requires built site + pagefind binary to run | `pnpm build` then serve `dist/`, type a query, confirm results appear |
| Search unavailable in dev mode (graceful) | SRCH-01 | No pagefind.js in dev | `pnpm dev`, open blog index, confirm no JS error in console |
| Copy button hover-reveal + icon swap | SRCH-02 | Browser interaction required | Open any post with a code block, hover, click copy, confirm checkmark appears then resets |
| ToC sticky sidebar renders on desktop | SRCH-03 | Visual/layout check | Open a post with h2+h3 headings on desktop, confirm sidebar visible and sticky on scroll |
| ToC hidden on mobile | SRCH-03 | Responsive layout | Same post on <768px viewport, confirm ToC is not rendered |
| Jump links navigate to correct heading | SRCH-03 | Browser scroll behavior | Click a ToC entry, confirm page scrolls to correct heading anchor |
| "See on timeline" appears in header + footer on matched posts | SRCH-04 | Requires content data | Open a post whose slug exists in timeline, confirm link in both header and footer |
| "See on timeline" absent on unmatched posts | SRCH-04 | Requires content data | Open a post with no timeline entry, confirm link not rendered |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
