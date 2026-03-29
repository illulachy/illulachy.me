---
phase: 8
slug: blog-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (add to blog app; already in @illu/content as 4.1.0) |
| **Config file** | `apps/blog/vitest.config.ts` — does not exist yet (Wave 0 gap) |
| **Quick run command** | `pnpm --filter @illu/blog test` |
| **Full suite command** | `pnpm test` (Turborepo runs all packages) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @illu/blog build` (build must pass)
- **After every plan wave:** Run `pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green + visual verification of dark mode and prose layout
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-W0-01 | 01 | 0 | BLOG-01 | Unit | `pnpm --filter @illu/blog test -- glob.test.ts` | ❌ W0 | ⬜ pending |
| 8-W0-02 | 01 | 0 | BLOG-01 | Unit | `pnpm --filter @illu/blog test -- sort.test.ts` | ❌ W0 | ⬜ pending |
| 8-W0-03 | 01 | 0 | BLOG-04 | Unit | `pnpm --filter @illu/blog test -- reading-time.test.ts` | ❌ W0 | ⬜ pending |
| 8-xx-01 | TBD | 1+ | BLOG-01 | Build smoke | `pnpm --filter @illu/blog build` | ❌ W0 | ⬜ pending |
| 8-xx-02 | TBD | 1+ | BLOG-02 | Build smoke | `pnpm --filter @illu/blog build` | ❌ W0 | ⬜ pending |
| 8-xx-03 | TBD | 1+ | BLOG-03 | Build artifact | `pnpm --filter @illu/blog build` + inspect dist/ | ❌ W0 | ⬜ pending |
| 8-xx-04 | TBD | 1+ | VIS-01 | Manual visual | `pnpm --filter @illu/blog dev` + browser devtools | N/A | ⬜ pending |
| 8-xx-05 | TBD | 1+ | VIS-02 | Manual visual | `pnpm --filter @illu/blog dev` + resize browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/blog/vitest.config.ts` — test framework configuration
- [ ] `apps/blog/src/test/glob-resolution.test.ts` — validates glob path resolves to >0 posts (covers known STATE.md risk for cross-workspace glob)
- [ ] `apps/blog/src/test/sort.test.ts` — covers BLOG-01 (post sort order by date, reverse-chronological)
- [ ] `apps/blog/src/test/reading-time.test.ts` — covers BLOG-04 (~200 words/min formula, minimum "1 min read")
- [ ] Framework install: `pnpm --filter @illu/blog add -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode tokens applied via CSS @theme (charcoal #131313 bg, white text) | VIS-01 | CSS custom properties require visual/devtools inspection | `pnpm --filter @illu/blog dev` → open browser devtools → verify `--color-surface` resolves to `#131313` in dark mode |
| Light mode switches via system preference | VIS-01 | OS-level preference toggle | Switch OS to light mode → verify `#FAFAFA` bg, near-black text |
| Prose max-width ~65ch, mobile responsive | VIS-02 | Layout requires visual browser inspection | `pnpm --filter @illu/blog dev` → resize browser to 375px width → verify prose content readable with `spacing-8` min margins |
| Post list Medium-style layout (title/excerpt left, thumbnail right) | BLOG-01 | Visual layout requires browser inspection | Open post list → verify each row has title+excerpt on left, square thumbnail on right, no card borders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
