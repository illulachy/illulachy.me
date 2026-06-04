---
type: blog
title: "One codebase, four plugin manifests, and the version I forgot to bump"
date: June 08, 2026
url: "/blog/ua-ch5-four-plugin-manifests-version-forgot"
description: Six version fields. One version. A checklist that's easy to forget. This is what supporting 13 AI coding platforms looks like from the inside.
tags: ["understand-anything", "cross-platform", "plugins", "claude-code", "cursor", "build-in-public"]
category: Engineering
---

I shipped version 2.7.0 with a bug fix in the architecture analyzer. Updated the package.json. Tagged the release. Pushed to GitHub.

The Claude Code marketplace showed version 2.6.3 for two weeks.

I'd forgotten to update `.claude-plugin/plugin.json`. The marketplace reads its version from there, not from package.json. Users who installed via the marketplace got the old version with the bug. Users who cloned from GitHub got the fix. Two weeks of "works for me, can't reproduce" before I found the mismatch.

That's when I counted the version fields I now had to maintain: `packages/core/package.json`, `packages/dashboard/package.json`, `understand-anything-plugin/package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `.copilot-plugin/plugin.json`. Six places. One version.

Every release now starts with a checklist.

---

## The Platform Explosion

In 2025, every AI coding tool wanted plugins. Claude Code launched its plugin system. Cursor added rules-based extensions. GitHub Copilot shipped skill support. opencode, Codex, Gemini CLI, Pi Agent, Vibe CLI — each announced they supported custom tools, commands, or skills.

The pipeline — the actual code that scans, parses, analyzes, and graphs a codebase — is identical across all these platforms. The integration surface is completely different. The core is shared. The manifest is per-platform.

---

## The Three Manifest Formats

**The marketplace manifest** (Claude Code). `.claude-plugin/plugin.json` with name, version, author, repository. Plus a `marketplace.json` that maps the marketplace entry to the nested plugin directory via a `source` field.

The marketplace manifest is the most opinionated. You bump the code, you bump the package.json, and you separately bump the plugin manifest. Forget one step and the marketplace shows stale metadata for days.

**The auto-discovery manifest** (Cursor, Copilot). `.cursor-plugin/plugin.json` and `.copilot-plugin/plugin.json`. These are nearly identical: name, version, description, author, then explicit `skills` and `agents` paths pointing into the nested plugin directory.

The irony is that Cursor and Copilot (competing products) have nearly identical manifest formats, while Claude Code (different product) has the most different one. The platforms converged on a solution shape despite competing.

**The symlink manifest** (everyone else). opencode, Codex, Gemini CLI, Pi Agent, Vibe CLI, OpenClaw, Antigravity, Hermes, Cline, KIMI CLI, Trae — none of these have manifest files in the repository. They install via `install.sh <platform>`, which clones the repo and creates symlinks from the platform's skill directory to the plugin's skill files.

The symlink approach has zero manifest overhead. No JSON files to maintain. No version fields to keep in sync. The file system IS the manifest.

The trade-off: symlink-based installs can't auto-update. Claude Code's marketplace checks for updates. The symlink doesn't.

---

## The Version Field Problem

Six files. One version. A checklist that's easy to forget.

The root cause is architectural: the manifests live at the repo root, the plugin code lives in a subdirectory, and the package.json lives inside the plugin. These are three different scopes, each with a legitimate claim to a version number.

The six-version problem won't be solved by better tooling. It'll be solved when the industry converges on a single plugin manifest format. I'm not holding my breath.

---

## The Installation Matrix

| Platform | Install Method | Update Method | Manifest Required |
|---|---|---|---|
| Claude Code | Marketplace | Auto (marketplace) | `.claude-plugin/plugin.json` |
| Cursor | Auto-discovery | Git pull | `.cursor-plugin/plugin.json` |
| Copilot | Auto-discovery | Git pull | `.copilot-plugin/plugin.json` |
| opencode | `install.sh opencode` | Re-run install | None |
| Codex | `install.sh codex` | Re-run install | None |
| Gemini CLI | `install.sh gemini` | Re-run install | None |
| 8 more | `install.sh <name>` | Re-run install | None |

Three platforms with manifest files. Eleven without. The manifest platforms cover about 60% of users. The manifest platforms took 80% of the integration work.

That ratio — 80% of work for 60% of users — is the hidden cost of multi-platform support.

---

## Shared File, Different Treatment

Every platform reads the same `SKILL.md` files. The markdown is identical. The instructions are identical. The pipeline executes identically.

The only difference is how the platform discovers the skill files in the first place. Claude Code reads the marketplace manifest. Cursor and Copilot read their manifests and follow explicit paths. The symlink platforms just find the files in their well-known location.

The skill file itself is platform-agnostic. It doesn't reference Claude, Cursor, or Copilot by name. It references scripts, agents, and paths that are relative to its own location. The same markdown works everywhere.

This was the design goal from the beginning: one skill definition, all platforms. Not one per platform with conditional sections. One file, literally the same file on disk, consumed by thirteen different AI agents on thirteen different platforms.

It works because the platform-specific part (discovery) is separated from the platform-agnostic part (execution). The manifest handles discovery. The skill handles execution. They never touch each other.

→ Next: Chapter 6 — The most boring file in the project and why it's the most important one
