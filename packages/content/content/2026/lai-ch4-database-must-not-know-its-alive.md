---
type: blog
title: "The database must not know it's alive."
date: June 15, 2026
url: "/blog/lai-ch4-database-must-not-know-its-alive"
description: Persistence should be a silent partner to the live stream. A failed DB write doesn't cancel a conversation. A restored session doesn't reconstruct a PTY. The two concerns must not couple.
tags: ["lai", "rust", "sqlite", "rusqlite", "persistence", "git2", "agentic-ide", "build-in-public"]
category: Engineering
---

The stream works. Events flow. Turns start and cancel cleanly.

Then you restart the process and everything is gone.

Sessions: gone. Chat history: gone. Worktree settings: gone. The app behaves like it was born five seconds ago, every single time. That's fine for a prototype. It's not fine for anything you'd actually use.

So: persistence. SQLite, sessions, events, review comments. The standard story.

Except there's one decision in here that took me longer to get right than I expected. Not the schema. Not the migrations. Something subtler — about what it means for a database to exist inside a live system.

---

## The Standard Parts

First, the parts that were straightforward.

I reached for `rusqlite` with the `bundled` feature rather than `sqlx`. The async ORM is attractive until you look at what it costs: `sqlx` wants async traits, compile-time query checking, a connection pool, the whole ceremony. The rest of `sc_agent` uses `std::sync::Mutex` throughout. Adding SQLite with `Arc<Mutex<rusqlite::Connection>>` and wrapping calls in `spawn_blocking` is idiomatic for this codebase. The `bundled` feature pins SQLite 3.49+ and means I'm not fighting whatever macOS decided to ship.

Schema is five tables: sessions, chat events, worktree settings, review comments, review replies.

One decision worth naming: chat events are stored as a JSON blob, not normalized columns. `ChatEvent` has 13+ variants — `MessageDelta`, `ThinkingDelta`, `ToolStarted`, errors, cancellations. Normalizing them into columns would mean a schema migration every time a new variant appears. JSON blob is forward-compatible. Adding a new event type to the protocol requires zero DB changes. The DB doesn't care what's inside the envelope. It just stores it.

One gotcha: `rusqlite_migration` requires WAL mode set *before* the first migration runs — not after. If you apply it after, the migration transaction conflicts with the WAL switch. The README says this. I missed it the first time.

These are fine details. Not the story.

---

## The Real Question

Here's the question I didn't think carefully enough about at the start:

*What happens if a DB write fails while a live session is streaming?*

The obvious answer is: propagate the error. Something failed, report it, let the caller decide.

The problem with that answer is who the caller is.

`push_envelope` is called from inside the live PTY session, every time Claude emits an event. There's already a subscriber on the other end — an SSE client receiving those events in real time. The event has already been broadcast to them. The DB write is happening in parallel, after the fact, as a durability side effect.

If I propagate a DB error here, what does the caller do with it? Stop streaming? Tell the subscriber their session failed? The subscriber didn't ask for persistence. They asked for a live event stream. The DB is just taking notes in the background. A failed note doesn't cancel the conversation.

```rust
// push_envelope in LiveSession
cx.spawn(async move {
    if let Err(e) = db_events::insert_event(&conn, &envelope).await {
        tracing::warn!("Failed to persist event: {e}");
        // and nothing else
    }
});
```

No propagation. No panic. A `warn!` log and a shrug.

This sounds like giving up. It's not. It's a deliberate split: **liveness failure** and **durability failure** are different categories with different responses. If the stream breaks, that's a liveness failure — the subscriber knows immediately, the session dies. If the DB write fails, that's a durability problem — the subscriber might never find out, and that's fine, because they got their events. The worst outcome is that history is incomplete. The session still happened.

The two concerns must not couple. The DB layer must be a silent partner to the stream. It does not get a vote on whether the stream continues.

---

## The Restore Problem

The other edge of this: startup.

When the process restarts, it needs to load existing sessions so `chat_list` works. But a `LiveSession` is not just a data record — it wraps an active PTY process, a broadcast channel, a running parser task. There is no PTY to restore. The process is gone.

So `restore_from_db` loads sessions into the `sessions` HashMap — the metadata layer — and leaves `live_sessions` completely empty. A restored session appears in the list. You can read its history. You cannot re-attach to its PTY, because the PTY no longer exists.

This distinction matters more than it sounds. If you tried to reconstruct a `LiveSession` from a DB row, you'd create an object with no child process — a ghost with the shape of a live session but nothing underneath. The first action on it would panic or silently fail.

The rule: **restore proto state, never PTY state.** The DB knows what happened. It does not know what is happening. That's a different layer entirely.

---

## A Rust Trap I Didn't See Coming

Unrelated to the persistence design, but worth documenting because it wasted twenty minutes.

I wrote a test helper on the bridge: `set_worktree_path_for_test`. Annotated it `#[cfg(test)]` — standard Rust idiom for test-only code. Works fine in unit tests inside the crate. Then I wrote integration tests in `tests/e2e_phase2.rs` and the method simply didn't exist.

No error message pointing to `cfg(test)`. Just "method not found."

The reason: integration tests in `tests/` compile as a *separate crate*. They depend on the library crate as an external dependency. Items gated with `#[cfg(test)]` in the library are compiled away in the library artifact — the integration test crate gets a version of the library with those methods removed.

The fix is `#[doc(hidden)] pub`. The method stays out of generated docs, but it's visible to all dependents, including integration tests. The test helper isn't on the `AppBridge` trait and unreachable via HTTP, so the security surface is negligible.

I've been writing Rust for the duration of this project. This is a fundamental property of how the compiler works, and it bit me anyway. File it under: things that are obvious in retrospect and invisible until they aren't.

---

## git2 Has Opinions About Untracked Files

One more friction point, from the git2 work that ran in parallel.

`repo.diff_tree_to_workdir_with_index(tree, None)` — the default call with no options — returns zero stats for untracked files. Files I'd just written to disk, not staged, simply not present in the diff output.

The fix is three `DiffOptions` flags:

```rust
let mut opts = git2::DiffOptions::new();
opts.include_untracked(true)
    .recurse_untracked_dirs(true)
    .show_untracked_content(true);
```

`show_untracked_content` is the one that makes untracked files appear in insertion counts. Without it, the file shows up as a path entry but with zero lines — not useful for a diff summary.

The default behavior tracks only changes to files git already knows about. Untracked new files are invisible. This is arguably correct behavior for a diff tool. It's wrong behavior for a "what changed in this worktree" summary. Read the options before assuming the defaults match your intent.

---

The backend now has memory. Sessions persist, chat history survives restarts, worktree settings hold. The stream and the DB coexist without either interrupting the other.

There's one thing that still doesn't exist: a window. The whole system — the chat loop, the cancellation, the persistence — runs headless, talking to itself over a Unix socket, with no interface a human can see or touch.

That changes next.

→ Next: Chapter 5 — Building UI in a framework that has no tutorial
