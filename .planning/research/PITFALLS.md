# Pitfalls Research

**Domain:** Turborepo Monorepo Conversion + Blog Site Addition (Vite + React + pnpm)
**Researched:** 2026-03-28
**Confidence:** HIGH (monorepo migration), HIGH (Tailwind v4 monorepo), MEDIUM (shared content package patterns)

---

## Overview

This document covers pitfalls specific to the v1.1 milestone: converting the existing single Vite+React app to a Turborepo pnpm monorepo and adding a blog site at writing.illulachy.me. It is structured in three layers — critical (causes broken builds or rewrites), moderate (causes integration bugs or wasted time), and minor (commonly overlooked details).

The prior canvas/tldraw pitfalls from the original project are retained at the bottom under "Retained: Canvas Pitfalls" since those phases are complete and the warnings remain valid for maintenance.

---

## Critical Pitfalls

### Pitfall 1: Flat node_modules Assumptions Break After npm-to-pnpm Switch

**What goes wrong:**
Scripts, tools, or config files that assume npm's flat node_modules structure silently fail after switching to pnpm. pnpm uses a content-addressable store and strict linking — packages that were accidentally accessible via hoisting disappear. Build scripts that use `require('some-unlisted-dep')` or Vite configs that import from unlisted packages break with "Cannot find module" errors.

**Why it happens:**
npm hoists all packages to the root node_modules, so phantom dependencies (packages you use but don't list) often work by accident. pnpm enforces that packages only see their declared dependencies. The existing portfolio app may use dependencies not explicitly listed in package.json.

**How to avoid:**
1. Before deleting package-lock.json, audit all imports vs. declared dependencies: `pnpm why <package>` reveals if something is an accidental transitive dep.
2. After switching to pnpm, run the dev server and build and fix every "Cannot find module" error — do not suppress or work around them.
3. Add every real dependency to the correct package.json (app or root), not the root as a shortcut.
4. Never install packages globally at the workspace root just to unblock a sub-package build.

**Warning signs:**
- `pnpm install` succeeds but `pnpm dev` or `pnpm build` throws "Cannot find module"
- A package works in one workspace app but not another
- Vite config or PostCSS config fails to import a plugin

**Phase to address:** Phase 1 of the milestone — monorepo scaffold and npm-to-pnpm migration.

---

### Pitfall 2: Forgetting pnpm-workspace.yaml Before Running Turbo Commands

**What goes wrong:**
Running any `turbo` command before creating `pnpm-workspace.yaml` at the repo root produces the error `--workspace-root may only be used inside a workspace`. Turborepo cannot discover packages, caching does not work, and tasks fail silently or error immediately.

**Why it happens:**
Developers follow Turborepo quickstart docs but skip the pnpm-specific prerequisite. The error message points to Turborepo, not pnpm, so the root cause is non-obvious.

**How to avoid:**
Create `pnpm-workspace.yaml` first, before installing Turborepo or running any `turbo` command:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
Then run `pnpm install` from the root to generate the pnpm lockfile, then install Turborepo.

**Warning signs:**
- Error: `--workspace-root may only be used inside a workspace`
- `turbo run build` says "no packages found"
- `pnpm -r install` does not create symlinks in node_modules

**Phase to address:** Phase 1 — monorepo scaffold.

---

### Pitfall 3: Moving the Existing App Breaks Relative Paths and Git History

**What goes wrong:**
Moving all existing source files from the root into `apps/portfolio/` breaks relative import paths (e.g., `../../content/timeline.md`), Vite config root assumptions, and all path-based tsconfig references. Additionally, git blame and log for those files appear to reset if `git mv` is not used.

**Why it happens:**
The existing app was built with the assumption that the project root is the app root. Vite, TypeScript, and Vite plugins resolve paths relative to `vite.config.ts`, which is now nested one level deeper. Developers often do a file copy instead of `git mv`, losing history.

**How to avoid:**
1. Use `git mv` (not a file copy) to preserve git history through the move.
2. After moving, update `vite.config.ts` `root` and `resolve.alias` to use `__dirname`-relative paths.
3. Update tsconfig `baseUrl` and `paths` to account for the new location.
4. Update any hardcoded content paths in Vite plugins or build scripts.
5. Run `tsc --noEmit` and `vite build` immediately after the move to catch all broken paths before any other work.

**Warning signs:**
- TypeScript "cannot find module" errors on existing imports that previously worked
- Vite plugin fails to find markdown files
- `git log apps/portfolio/src` shows no history (copy was used instead of mv)

**Phase to address:** Phase 1 — move existing app into `apps/portfolio/`.

---

### Pitfall 4: Tailwind CSS v4 Does Not Auto-Detect Components in Sibling Packages

**What goes wrong:**
Tailwind v4's automatic content scanning only looks inside the current package directory. When shared UI components live in `packages/ui` or the blog app imports from a shared content package, Tailwind does not generate utility classes used in those components. The result is missing styles in production with no build error — the styles silently vanish.

**Why it happens:**
Tailwind v4 changed from requiring a `content` array in config to auto-detection. Auto-detection is scoped to the consuming app's own directory, not the monorepo root. This is a known upstream issue (tailwindlabs/tailwindcss#13136).

**How to avoid:**
In each app's CSS entry file, add explicit `@source` directives pointing to all packages that contain Tailwind classes:
```css
/* apps/portfolio/src/index.css */
@import "tailwindcss";
@source "../../../packages/ui/src/**/*.{ts,tsx}";

/* apps/blog/src/index.css */
@import "tailwindcss";
@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/content/src/**/*.{ts,tsx}";
```
This is the officially recommended fix as of Tailwind v4.0.0-alpha.19+.

Alternatively, configure PostCSS in each app's `postcss.config.js`:
```js
const path = require("path");
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.resolve(__dirname, "../../"),
    },
  },
};
```

**Warning signs:**
- Components look correct in dev but classes are absent from the production build CSS
- Specific utility classes applied in shared components are missing from output CSS
- Tailwind VS Code extension shows no completions inside `packages/ui` or `packages/content`

**Phase to address:** Phase 2 — shared packages setup; Phase 3 — blog app creation.

---

### Pitfall 5: Turbo Cache Produces Wrong Output Due to Undeclared env Variables

**What goes wrong:**
Turborepo caches task outputs based on inputs including declared environment variables. If `VITE_API_URL`, `BASE_URL`, or any runtime-injected env variable is used by the app but not listed in `turbo.json`'s `env` or `globalEnv`, Turborepo will serve a cached build artifact from a previous environment, producing a build that targets the wrong URL silently.

**Why it happens:**
Developers configure Vite env variables but forget to tell Turborepo about them. This is especially dangerous in CI/CD where staging and production share the same code but different env vars.

**How to avoid:**
Declare every env variable read during a build task in `turbo.json`:
```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "env": ["VITE_*", "BASE_URL", "NODE_ENV"]
    }
  }
}
```
Use glob patterns (`VITE_*`) to catch all Vite-prefixed vars at once.

**Warning signs:**
- Production build contains development API URLs
- `turbo run build --dry` shows cache hit when env was changed
- Deployed app behaves as if it is pointing to a different environment

**Phase to address:** Phase 1 — turbo.json task configuration; revisit when adding deployment.

---

### Pitfall 6: Circular Task Dependencies Lock Up the Build

**What goes wrong:**
Turborepo cannot resolve circular task dependencies. If `packages/content` depends on `apps/portfolio` (e.g., to validate that timeline entries link to real blog posts) and `apps/portfolio` depends on `packages/content`, turbo hangs indefinitely or errors with a cycle detection message.

**Why it happens:**
Content validation logic that "reaches back" into an app is a tempting pattern. Shared packages must never import from apps — the dependency must be one-directional: apps depend on packages, never the reverse.

**How to avoid:**
Enforce strict one-directional dependency: `apps/* -> packages/*`, never `packages/* -> apps/*`. If cross-validation is needed, extract it into a separate `packages/validation` package that neither app imports from the other.

**Warning signs:**
- `turbo run build` hangs without output
- Turborepo prints "Cycle detected" in task graph
- IDE shows circular import warnings between workspace packages

**Phase to address:** Phase 2 — shared content package design.

---

## Moderate Pitfalls

### Pitfall 7: workspace:* Protocol Confuses Publishing and Deployment Tools

**What goes wrong:**
Deployment tools (Vercel, Netlify) or CI scripts that run `pnpm install` from a subdirectory (not workspace root) fail to resolve `workspace:*` dependencies. The error is "Cannot resolve workspace protocol". This also breaks if anyone tries to publish a `packages/content` package to npm with internal `workspace:*` deps still listed.

**How to avoid:**
1. Always run `pnpm install` from the workspace root, never from a sub-package directory.
2. For Vercel deployments, set Root Directory in project settings to the workspace root, not the app folder.
3. Never publish internal packages (content, config) to npm — they are private workspace packages. Add `"private": true` to their package.json.
4. For Netlify or Vercel, use a filter command: `pnpm turbo run build --filter=apps/blog`.

**Warning signs:**
- CI fails with "Cannot resolve workspace protocol of dependency"
- Vercel deployment fails during `pnpm install` step
- A package appears as unresolved in a fresh clone

**Phase to address:** Phase 3 — blog app deployment setup.

---

### Pitfall 8: Shared Config Package Needs a Build Step That Runs First

**What goes wrong:**
If a shared `packages/content` package exports TypeScript files and depends on a build step (e.g., Zod schemas, typed frontmatter parsers), consuming apps that reference `packages/content` fail at build time because the built output (`dist/`) does not exist yet when Turborepo starts the app build in parallel.

**How to avoid:**
Two options:
1. **Internal packages (no build):** Use `"main": "./src/index.ts"` directly and configure the consuming app's Vite/TypeScript to transpile the package source. Turborepo treats it as source code. This works well for a private monorepo.
2. **Declare build dependency in turbo.json:** If the package does build, declare `"dependsOn": ["^build"]` so Turborepo always builds dependencies before consumers.

For this project, option 1 (no separate build step for the content package) is simpler and avoids the ordering problem entirely.

**Warning signs:**
- Build error: "Cannot find module '@repo/content/dist/index'"
- Works locally after first `pnpm build` but fails in fresh CI clone
- `turbo run build` succeeds only after running `pnpm build` in the packages directory manually

**Phase to address:** Phase 2 — shared content package scaffold.

---

### Pitfall 9: Root package.json Dependencies Bleed Into All Workspace Apps

**What goes wrong:**
Installing app-specific packages at the workspace root makes them available to all apps but creates maintenance confusion and can cause version conflicts. The root `package.json` should only contain Turborepo, workspace-level tooling (ESLint, TypeScript, Prettier), and scripts. App-specific packages (React, Vite, Tailwind) belong in each app's own `package.json`.

**How to avoid:**
- Root `package.json` devDependencies: `turbo`, `typescript`, `eslint`, `prettier`
- Each app's `package.json`: its own `react`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, etc.
- Run `pnpm add <pkg> --filter apps/blog` to target a specific workspace.

**Warning signs:**
- Accidentally running `pnpm add react` at root, then finding react in root node_modules
- One app's React version differs from another's because both versions are installed
- "Invalid hook call" errors caused by multiple React instances

**Phase to address:** Phase 1 — workspace scaffold; ongoing hygiene.

---

### Pitfall 10: turbo.json outputs Field Missing — No Caching

**What goes wrong:**
If the `outputs` field for a task is missing or misconfigured in `turbo.json`, Turborepo runs the task every time with no caching benefit. The build still works but is slow. For the `dev` task (which is intentionally not cached), this is fine; for `build` and `lint`, missing outputs negates Turborepo's primary value.

**How to avoid:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".vite/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```
Vite outputs go to `dist/`. Confirm the exact output directory matches `vite.config.ts` `build.outDir`.

**Warning signs:**
- `turbo run build` says "cache miss" on every run even with no code changes
- Build times are identical whether cache should hit or not
- `.turbo/` directory stays empty

**Phase to address:** Phase 1 — turbo.json configuration.

---

### Pitfall 11: Combined Build Scripts Are Not Individually Cacheable

**What goes wrong:**
Scripts like `"build": "tsc && vite build"` run two tasks as one shell command. Turborepo cannot cache them independently. If TypeScript succeeds but Vite fails, or if only types changed, the entire combined step re-runs. This is wasteful and masks type errors.

**How to avoid:**
Split into separate scripts:
```json
{
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  }
}
```
In `turbo.json`, declare them as separate tasks so Turborepo can cache each independently.

**Warning signs:**
- `package.json` scripts contain `&&` chaining multiple build tools
- Type errors are not surfaced until the entire build is re-run
- Turborepo cache statistics show "time saved: 0" across multiple runs

**Phase to address:** Phase 1 — turbo.json + package.json script alignment.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Install all deps at workspace root | Faster setup | Version conflicts, all apps coupled, phantom dep reliance | Never |
| Skip `pnpm-workspace.yaml` and use npm workspaces instead | Avoids learning pnpm | Breaks Turborepo pnpm integration, loses disk dedup | Never (pnpm is the documented choice) |
| Keep `package-lock.json` alongside new `pnpm-lock.yaml` | Easier rollback | Two lockfiles conflict, contributors confused | During first 24 hours of migration only |
| Use `@source "../../**"` glob too broadly in Tailwind | No missed classes | Bloated CSS output, slower builds | Never in production |
| Hardcode workspace paths in vite.config | Works immediately | Breaks when directory structure changes | Never |
| Skip `"private": true` on internal packages | No immediate impact | Risk of accidental npm publish of internal code | Never |

---

## Integration Gotchas

Common mistakes when connecting the workspace components.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Portfolio app + content package | Import from `packages/content/src/index.ts` using a relative path | Use workspace alias `@repo/content` declared in package.json with `workspace:*` |
| Blog app + Tailwind v4 | Assume Tailwind auto-detects components from content package | Add `@source` directive in blog's CSS entry pointing to content package src |
| Turborepo + Vercel | Set Vercel Root Directory to `apps/blog` | Set Root Directory to workspace root; configure build command with `--filter` |
| pnpm + CI | Run `npm ci` or `npm install` in CI | Run `pnpm install --frozen-lockfile` from workspace root |
| Shared tsconfig + per-app tsconfig | Override all settings in each app's tsconfig | Use `extends` from a root `tsconfig.base.json`; only override `outDir` and `include` per app |
| tldraw (portfolio) + pnpm strict mode | tldraw accesses peer deps not listed directly | Verify tldraw peer deps are listed in portfolio app's package.json explicitly |

---

## Performance Traps

Patterns that work at small scale but fail as content grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all markdown files at blog build time without pagination | Blog build is slow | Process incrementally; generate paginated index | 50+ blog posts |
| Generating RSS feed synchronously at build time from all posts | Build hangs on RSS step | Generate RSS as a separate Vite plugin output | 200+ posts |
| Storing parsed markdown content in-memory for portfolio canvas | High memory, slow canvas init | Bundle pre-processed JSON at build time via Vite plugin | 100+ timeline nodes |
| Re-running full Turborepo pipeline on every markdown file change | Slow developer feedback loop | Use `turbo run dev` with `cache: false` and `persistent: true` | Day 1 of development |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **pnpm migration:** `package-lock.json` deleted and `.npmrc` updated — verify `pnpm-lock.yaml` is committed and `package-lock.json` is gitignored
- [ ] **Workspace links:** `packages/content` listed in both apps' `package.json` as `"workspace:*"` — verify with `pnpm why @repo/content` in each app
- [ ] **Tailwind v4 in blog:** Styles visible in dev — verify production build CSS contains classes from shared components (not just app-local classes)
- [ ] **Turborepo caching:** Cache says "hit" after rebuild with no changes — verify by running `turbo run build` twice and confirming ">>> FULL TURBO" message
- [ ] **Blog deployment:** `pnpm turbo run build --filter=apps/blog` works locally — verify Vercel build uses same command with correct root directory
- [ ] **Portfolio app unchanged:** Canvas still renders correctly after monorepo restructuring — run full local build and smoke test pan/zoom/game mode
- [ ] **Content package typing:** TypeScript reports errors on malformed frontmatter — verify Zod schema is enforced at build time, not just runtime
- [ ] **tldraw still functions:** No "Invalid hook call" or multiple React instance errors — verify React is listed only in `apps/portfolio/package.json`, not also at root

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Flat node_modules phantom deps break after pnpm switch | MEDIUM | Run `pnpm why` for each missing package; add to correct package.json; re-run install |
| Tailwind classes missing in production | LOW | Add `@source` directive for missing package; rebuild; verify output CSS |
| Git history lost due to file copy instead of mv | HIGH | Cannot recover history; use `git log --follow` as workaround; lesson for future |
| Cache serving wrong env in deployment | LOW | Run `turbo run build --force` to bypass cache; then fix turbo.json env declarations |
| Turborepo circular dependency hang | MEDIUM | Kill process; use `turbo run build --graph` to visualize dependency graph; restructure shared package |
| Multiple React instances after monorepo setup | MEDIUM | Deduplicate React: move React to devDependencies only in each app; use pnpm overrides to force single version if needed |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Flat node_modules phantom deps | Phase 1: npm-to-pnpm migration | `pnpm build` in portfolio app succeeds with zero "Cannot find module" errors |
| Missing pnpm-workspace.yaml | Phase 1: monorepo scaffold | `turbo run build --dry` lists all workspace packages |
| Broken paths after app move | Phase 1: move portfolio app to apps/ | `tsc --noEmit && vite build` succeeds immediately after move |
| Tailwind v4 content scanning | Phase 2: shared packages; Phase 3: blog app | Production build CSS contains classes from packages/content |
| Undeclared env variables in turbo cache | Phase 1: turbo.json setup | Running build with changed env produces cache miss |
| Circular task dependencies | Phase 2: content package design | `turbo run build --graph` shows no cycles |
| workspace:* resolution in CI/CD | Phase 3: blog deployment | Vercel/CI builds succeed from a fresh clone with no local state |
| Shared package build ordering | Phase 2: content package setup | Fresh `pnpm install && turbo run build` succeeds from clean state |
| Root package.json dep pollution | Phase 1: workspace scaffold | `apps/portfolio/package.json` lists all its own deps; root has only tooling |
| Missing turbo.json outputs | Phase 1: turbo.json setup | Second `turbo run build` with no code changes shows ">>> FULL TURBO" |
| Combined scripts not cacheable | Phase 1: script alignment | `turbo run build` and `turbo run typecheck` are separate tasks in turbo.json |

---

## Retained: Canvas Pitfalls (Phases 1-6, Complete)

These were documented during the original build phases. They remain relevant for maintenance and are not re-introduced in this milestone.

### Pitfall C1: Canvas Performance Degradation with 200+ Nodes
Prevention: Profile with realistic node counts, lazy-load images, use React.memo on custom shapes.

### Pitfall C2: SSR Complexity with tldraw
Prevention: Use Vite (client-side SPA only). Already implemented. Do not introduce SSR.

### Pitfall C3: Timeline Node Overlap (Date Clustering)
Prevention: Collision detection in layout algorithm, vertical stacking. Already implemented.

### Pitfall C4: Runtime Markdown Parsing
Prevention: Parse at build time via Vite plugin. Already implemented.

### Pitfall C5: Touch Gesture Conflicts
Prevention: Disable browser zoom override, test on real devices. Already implemented.

---

## Sources

- Turborepo "Add to Existing Repository" docs: https://turborepo.dev/docs/getting-started/add-to-existing-repository
- Turborepo environment variables guide: https://turborepo.dev/docs/crafting-your-repository/using-environment-variables
- Turborepo Vite framework guide: https://turborepo.dev/docs/guides/frameworks/vite
- pnpm workspaces docs: https://pnpm.io/workspaces
- Tailwind CSS v4 monorepo content detection issue: https://github.com/tailwindlabs/tailwindcss/issues/13136
- Tailwind v4 in Turborepo (Medium): https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039
- Turborepo pitfalls (DEV Community): https://dev.to/_gdelgado/pitfalls-when-adding-turborepo-to-your-project-4cel
- pnpm + Turborepo monorepo configuration (Nhost): https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo
- Complete monorepo guide pnpm 2025: https://jsdev.space/complete-monorepo-guide/
- Turborepo migration (Dub): https://dub.co/blog/turborepo-migration

---
*Pitfalls research for: Turborepo monorepo conversion + blog site (writing.illulachy.me)*
*Researched: 2026-03-28*
