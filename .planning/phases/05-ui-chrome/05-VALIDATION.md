---
phase: 05
slug: ui-chrome
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (already installed) |
| **Config file** | vite.config.ts (test section exists) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- {changed-file}.test.tsx --run`
- **After every plan wave:** Run `npm test --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (per file), 30 seconds (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | UI-01 | integration | `npm test -- theme.test.ts --run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | UI-02, UI-03 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | UI-01 | unit | `npm test -- CanvasControls.test.tsx --run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | UI-05 | integration | `npm test -- CanvasLoader.test.tsx --run` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | UI-04 | integration | `npm test -- MilestoneModal.test.tsx --run` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | UI-01, UI-04 | unit | `npm test -- responsive.test.tsx --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/theme.test.ts` — @theme compilation to CSS variables (UI-01)
- [ ] `tests/CanvasControls.test.tsx` — Tailwind utilities on controls (UI-01)
- [ ] `tests/CanvasLoader.test.tsx` — Motion.dev exit animation (UI-03, UI-05)
- [ ] `tests/MilestoneModal.test.tsx` — shadcn/ui Dialog, responsive modal (UI-02, UI-04)
- [ ] `tests/responsive.test.tsx` — Responsive utilities at breakpoints (UI-04)
- [ ] `tests/Canvas.test.tsx` — Loading integration (UI-05)
- [ ] Add `@testing-library/user-event` dependency for interaction testing

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Loading exit animation smoothness | UI-05 | Visual quality, 60 FPS performance verification | Run `npm run dev`, refresh page, observe ghost hub fade + scale exit. Verify smooth transition without frame drops. |
| Canvas performance with Tailwind classes | UI-01 | Runtime performance profiling | Open DevTools Performance tab, pan/zoom canvas for 10s, verify 60 FPS maintained. Compare before/after Tailwind migration. |
| Touch gestures on mobile devices | UI-04 | Real device testing required | Test on iPhone/Android: touch controls, pinch-to-zoom canvas, fullscreen modal close. |
| Glassmorphism rendering across browsers | UI-02 | Cross-browser visual verification | Test backdrop-filter in Chrome, Safari, Firefox. Verify blur effect renders correctly. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
