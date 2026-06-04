---
type: blog
title: "I assumed Claude could hold a conversation. It can't."
date: May 25, 2026
url: "/blog/lai-ch1-assumed-claude-could-hold-conversation"
description: The plan was simple — keep a persistent PTY session open, pipe messages in, stream events out. Claude CLI has had this broken for months. Here's the workaround that actually works.
tags: ["lai", "rust", "claude-code", "pty", "agentic-ide", "build-in-public", "debugging"]
category: Engineering
---

The design was obvious. Keep a PTY open. Pipe messages in. Stream JSON events out. One persistent session per worktree, surviving multiple turns.

`claude --output-format stream-json`

Send a message. Receive events. Send another message. Receive more events. Simple.

Except: the persistent PTY session is broken. Has been broken for months. There are GitHub issues about it — #17248, #41230, #5034. The Claude CLI does not correctly handle subsequent input to a running session. It echoes, it duplicates, it exits, it hangs. The behavior is non-deterministic across versions.

I spent three days trying to make persistent sessions work before I looked at the issues and realized: this is a known, unfixed bug. I was not going to fix it. I needed a different model.

---

## The Workaround: Per-Turn Spawn

If I can't keep a session alive across turns, I'll spawn a new process for every turn and use `--resume` to reconnect to the same session.

```
claude --resume <session_id> --output-format stream-json --print
```

`--resume` tells the CLI to continue an existing conversation. `--print` gives the answer and exits — no interactive mode, no TTY required. The session ID is stored in the agent state after the first turn.

The first turn creates the session:

```
claude --output-format stream-json --print <message>
```

The response stream contains the session ID in a `session_initialized` event. Store it. Every subsequent turn uses `--resume`.

Each spawn is ~100ms of overhead. For an agentic coding tool where turns take 5–120 seconds, 100ms is invisible.

The lifecycle is cleaner too. Process starts, streams events, exits. No zombie state. No half-open session. The process table stays clean. If a turn hangs, you kill the PID. The next turn spawns fresh.

---

## The PTY Echo Problem

Even in per-turn mode, PTY creates a problem: it echoes stdin.

When you spawn a process with a PTY and write a message to its stdin, the PTY driver immediately echoes that text back through stdout before the process has processed it. So if I write `"explain this function"`, the first thing I read back is `"explain this function"`.

The naive reader sees: input echo, then actual response. They're interleaved in the same stream.

Fix: scan forward to the first `{` or `[` character. The Claude CLI's JSON output starts with a JSON object or array. Everything before the first `{` is either the echo or shell initialization output. Discard it.

```rust
// Advance past any PTY echo
loop {
    let byte = reader.read_u8().await?;
    if byte == b'{' || byte == b'[' {
        buf.push(byte);
        break;
    }
}
// Now read the rest of the JSON stream
```

This is fragile in theory — what if the message the user sends starts with `{`? In practice, Claude's first output byte is always the opening brace of a JSON event object. The echo comes first, but it's plain text, not JSON. The heuristic works.

---

## PTY Reads in Async Rust

PTY file descriptors are blocking by default. Wrapping them naively in async Rust causes the async runtime to block — a blocking read inside a future starves other tasks on the executor thread.

The fix: `tokio::task::spawn_blocking` for PTY reads, with an mpsc channel to bridge back to the async side.

```rust
let (tx, rx) = mpsc::channel(256);

tokio::task::spawn_blocking(move || {
    let mut buf = [0u8; 4096];
    loop {
        match pty_fd.read(&mut buf) {
            Ok(0) => break,                     // EOF
            Ok(n) => {
                if tx.blocking_send(buf[..n].to_vec()).is_err() {
                    break;
                }
            }
            Err(e) if e.kind() == io::ErrorKind::WouldBlock => continue,
            Err(_) => break,
        }
    }
});
```

The blocking reader lives in a dedicated thread. The async task consumes from the channel. The two worlds communicate through the channel without either blocking the other.

The channel buffer size (256) is tuned for streaming JSON events. Large enough to absorb bursts. Small enough to apply backpressure if the consumer falls behind.

---

## Session ID Recovery

The first turn doesn't have a session ID yet. The session ID appears in the stream, in a `system` event early in the output.

```json
{"type": "system", "subtype": "init", "session_id": "abc123..."}
```

The parser watches for this event during the first turn and stores the ID in `AgentState.session_id`. All subsequent turns get `--resume abc123`.

There's a race: what if the first turn fails before emitting the `session_id` event? Then `session_id` stays `None`. The next turn becomes another "first turn" — it creates a new session rather than resuming. The history is split.

This is acceptable for the current implementation. Fixing it properly requires either: (a) generating the session ID client-side before the first spawn, or (b) using a persistent session model — which takes us back to the broken PTY session problem.

I filed it as a known limitation and kept moving.

---

## What the Protocol Looks Like Now

Each turn is a full process lifecycle:

1. Spawn `claude [--resume <id>] --output-format stream-json --print`
2. Write message to stdin, close stdin
3. Read stdout line by line, parse JSON events, broadcast to subscribers
4. Process exits with code 0 (success) or nonzero (error)
5. Record exit code and session ID in agent state

The agent state lives in the daemon. The daemon is the thing that survives across UI reconnects. The CLI process is ephemeral — spawned for a turn, gone when the turn ends.

The turn model is simple enough that the remaining problems are knowable. Session splits on first-turn failure. The 100ms spawn overhead. PTY echo parsing. These are manageable edges, not architectural flaws.

It's not elegant. The persistent session is the elegant solution. But the persistent session is broken, and "wait for upstream to fix it" is not a release strategy.

→ Next: Chapter 2 — Async is hard to test. Pure functions are not.
