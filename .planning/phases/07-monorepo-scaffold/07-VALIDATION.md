---
phase: 7
slug: monorepo-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) |
| **Config file** | `vitest.config.ts` (existing in portfolio root, moves to `apps/portfolio/vitest.config.ts`) |
| **Quick run command** | `pnpm --filter @illu/content test` |
| **Full suite command** | `pnpm build && pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build` from repo root (verifies task graph)
- **After every plan wave:** Run `pnpm build && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | MONO-01 | build | `pnpm install --frozen-lockfile` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | MONO-01 | build | `pnpm turbo build` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | MONO-02 | build | `pnpm --filter @illu/portfolio build` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 2 | MONO-03 | build | `pnpm --filter @illu/content build 2>/dev/null || true` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 2 | MONO-04 | grep | `grep -r 'writing.illulachy.me' content/` | ✅ | ⬜ pending |
| 07-01-06 | 01 | 3 | MONO-05 | build | `pnpm install 2>&1 | grep -v "ERR_PNPM_MISSING_DEPS"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm-workspace.yaml` — defines workspace packages
- [ ] `turbo.json` — defines task graph with build/dev/lint/test tasks
- [ ] Root `package.json` — devDependencies: turbo, engines: node/pnpm
- [ ] `.npmrc` — pnpm strict mode config

*Wave 0 creates the scaffolding before any migration tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas renders and game mode works | MONO-02 | Visual browser check needed | Open `pnpm --filter @illu/portfolio dev`, navigate canvas, press G for game mode |
| pnpm strict mode — no phantom dep errors | MONO-05 | Requires visual scan of pnpm install output | Run `pnpm install` from root, check for missing dep errors in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
