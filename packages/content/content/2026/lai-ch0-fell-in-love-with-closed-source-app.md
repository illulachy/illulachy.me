---
type: blog
title: "I fell in love with an app. It was closed source. So I reverse-engineered it."
date: May 18, 2026
url: "/blog/lai-ch0-fell-in-love-with-closed-source-app"
description: Superconductor is exactly the workspace I wanted — multiple AI agents, git worktrees, per-branch context. It's also closed source. So I'm building the open version. This is how lai started.
tags: ["lai", "rust", "gpui", "agentic-ide", "claude-code", "reverse-engineering", "build-in-public"]
category: Engineering
---

I've been using Superconductor for two months.

It's an Arc-inspired macOS workspace for running multiple AI coding agents simultaneously. Each agent gets its own git worktree. You can have five Claude sessions running on five different branches at once, with a unified view across all of them. Review comments, branch status, agent output — all in one panel.

It is exactly the tool I wanted to exist. It's also closed source, $40/month after the trial, and built by a company that may or may not exist in eighteen months.

So I'm building the open version. I'm calling it **lai** — liquid agentic IDE.

And I'm doing it in Rust, a language I am learning as I go.

---

## The Reverse Engineering Phase

Before writing a line of code, I spent a week figuring out how Superconductor works.

The usual tricks. `sc --help` to see what the CLI exposes. `strings` on the binary to find embedded strings — API paths, configuration keys, protocol hints. `~/.superconductor/` for config files. `lsof -p $(pgrep sc)` to see what file handles it holds open. `dtrace` for system call tracing.

What I found:

The worktree model is simpler than I expected. Each worktree is a directory, a git branch, and a metadata JSON file. The agent binding is loose — the CLI creates the worktree and invokes the agent separately. There's no tight coupling between the workspace manager and the agent process.

The inter-process protocol uses Unix domain sockets. The workspace UI talks to a local daemon that manages worktrees and agent state. The daemon is the thing that survives when you close and reopen a panel.

The agent integration is a thin wrapper. The daemon spawns `claude` (or whatever CLI), pipes its output, and forwards events to the UI layer.

None of this is complicated. It's well-engineered, but it's not magic. A 34-crate Cargo workspace and GPUI can rebuild the essential behavior in public.

---

## Why GPUI

GPUI is Zed's UI framework. It's GPU-accelerated, targets macOS first, and is designed for applications that need fluid, low-latency rendering — the kind of UI that feels like a native app, not a web app wrapped in a shell.

It's also not well-documented. There's no tutorial. The learning resource is the Zed codebase itself.

I chose it because the alternative was Tauri + React. I already have one Tauri project (LiquidView). Two Tauri projects would feel like I'm defaulting to what I know rather than building to what lai needs. A terminal-native, multi-pane AI workspace should feel like a terminal. GPUI gives me that texture.

The cost is real. GPUI evolves fast, has no stable API, and expects you to read source to understand behavior. Every time I hit a wall I'm grepping through `~/src/zed/` for examples.

---

## The 34-Crate Workspace

The Cargo workspace has more crates than I originally planned.

`sc_core` — shared types, the `Worktree` struct, session protocol definitions.

`sc_agent` — the daemon. Unix socket server, agent lifecycle, PTY management, persistence. This is where Claude runs.

`sc_git` — git2 wrapper. Worktree creation, diff summaries, status queries. The bits that talk to git live here and nowhere else.

`sc_ui` — the GPUI application. Panels, views, event routing.

`sc_cli` — the `lai` binary. Parses commands, starts the daemon if not running, hands off to the UI.

Five main crates, then a constellation of smaller ones for protocol types, error types, test fixtures, and configuration.

The split is aggressive for a project this young. But the boundaries pay for themselves quickly — when I'm debugging the PTY layer, I don't want to think about UI layout. When I'm building the panel system, I don't want to think about git operations. The crates enforce that.

---

## What I Didn't Know When I Started

I didn't know Rust well enough to build this.

I'd read the book. I'd written small utilities. I'd contributed small patches to existing Rust projects. I had not written a 34-crate async application with GPUI, rusqlite, PTY management, and git2 in Rust from scratch.

I still don't know Rust well enough to build this. I'm learning it by building it.

Some things that surprised me:

The ownership model at the architecture level — not the borrow checker (I expected that), but the way ownership shapes API design. In Rust you can't just return a reference to data inside a Mutex from a method that takes `&self`. You have to clone or restructure. That forces you to think about data ownership at the API boundary. The result is cleaner APIs. The process is frustrating.

Async Rust is not the same as async JavaScript. `tokio::spawn`, `spawn_blocking`, and `block_in_place` have distinct semantics that matter. Getting them wrong causes deadlocks that are extremely hard to trace.

`#[cfg(test)]` doesn't work across crate boundaries. I learned this one the hard way.

The errors are good, actually. The Rust compiler's error messages are genuinely useful in a way that most compiler errors aren't.

---

The code exists. The daemon talks to itself. Events flow from a PTY through a channel to a Unix socket to nowhere, because the UI doesn't exist yet.

Building it in public. All of it.

→ Next: Chapter 1 — I assumed Claude could hold a conversation. It can't.
