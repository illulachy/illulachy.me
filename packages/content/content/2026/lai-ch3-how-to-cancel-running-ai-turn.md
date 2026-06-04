---
type: blog
title: "How to cancel a running AI turn (and why zombie processes have opinions about it)"
date: June 08, 2026
url: "/blog/lai-ch3-how-to-cancel-running-ai-turn"
description: Cancellation is two races. The first is between kill and read. The second is between a dead process and the kernel. Get either wrong and you have a zombie or a lost turn ID.
tags: ["lai", "rust", "processes", "cancellation", "agentic-ide", "build-in-public", "systems"]
category: Engineering
---

Cancellation looks simple. The user clicks stop. The agent kills the process. The stream ends.

Two races later, you have a zombie process and a lost turn ID.

---

## What Cancellation Actually Involves

When the user sends a cancel request, four things have to happen:

1. The active turn process gets killed
2. The turn record gets cleaned up from agent state
3. A cancel event gets broadcast to subscribers
4. The response to the cancel request confirms success

The problem is that these four things involve at least three concurrent actors: the HTTP handler that received the cancel request, the watchdog task that monitors the child process, and the agent state protected by a mutex.

---

## Race One: The Turn ID Problem

The naive implementation:

```rust
// In chat_cancel handler
let turn_id = active_turn.lock().unwrap().as_ref().map(|t| t.turn_id.clone());
kill_process_group(pid);
// ← watchdog wakes up here, clears active_turn
active_turn.lock().unwrap().take(); // now returns None
broadcast(ChatEvent::Cancelled { turn_id: ??? });
```

The watchdog runs on a separate task. When the child process exits — which happens immediately after `kill_process_group` — the watchdog sees the exit, acquires the lock, and clears `active_turn`. By the time the cancel handler tries to read the turn ID, it's gone.

The fix is to read the turn ID *before* killing:

```rust
// Read turn ID before kill — watchdog may clear active_turn after kill
let turn_id_opt = active_turn.lock().unwrap()
    .as_ref()
    .map(|t| t.turn_id.clone());

kill_process_group(pid);

// Now it's fine if watchdog clears active_turn; we already have the ID
if let Some(turn_id) = turn_id_opt {
    broadcaster.send(ChatEvent::Cancelled { turn_id });
}
```

The ordering is: read → kill → broadcast. The read happens while the process is still alive and `active_turn` is still populated. The kill happens after. The broadcast uses the pre-read value.

---

## Race Two: The Watchdog and the Cancel Handler

There's a second race: the watchdog and the cancel handler both try to clean up `active_turn`.

The cancel handler calls `active_turn.lock().unwrap().take()` to clear the current turn. The watchdog, when it sees the child exit, does the same. Whichever runs second sees `None` and does nothing — which is correct, but it's correctness by accident.

The explicit fix: the cancel handler sets a `cancelled` flag before killing, and the watchdog checks the flag before cleaning up.

```rust
// Cancel handler
turn.cancelled.store(true, Ordering::SeqCst);
kill_process_group(pid);

// Watchdog
if !turn.cancelled.load(Ordering::SeqCst) {
    // Unexpected exit — log and clean up as error
    broadcaster.send(ChatEvent::Error { ... });
}
active_turn.lock().unwrap().take();
```

Both paths call `.take()`. Only the watchdog emits an error event, and only when the exit was unexpected (not cancelled). The cancel handler is the one that broadcasts the `Cancelled` event.

---

## The Zombie

SIGKILL does not remove a process from the process table.

When you call `kill_process_group(pid)`, the kernel delivers SIGKILL to the process group. The processes die. But their PIDs remain in the process table as zombie entries, waiting for their parent to acknowledge their exit status by calling `wait()`.

The parent here is the `sc_agent` daemon. If the daemon never calls `wait()` on the killed child, the zombie persists until the daemon itself exits.

```rust
// After kill
match child.wait() {
    Ok(status) => {
        tracing::debug!("Child exited: {:?}", status);
    }
    Err(e) => {
        tracing::warn!("wait() failed: {e}");
    }
}
```

`child.wait()` reaps the zombie. The PID is released. The process table entry is gone.

There's a subtlety: after SIGKILL, `kill(pid, 0)` — the signal zero trick for checking if a process exists — returns `EPERM` rather than `ESRCH`. `EPERM` means "the process exists but you can't signal it," which is the kernel's way of saying "it's a zombie and technically still there." `ESRCH` means "no such process." If you're checking for process existence after a kill, wait for the `wait()` call to complete before checking — otherwise you'll get `EPERM` and incorrectly conclude the process is still alive.

---

## The Watchdog Task

The watchdog runs as a `tokio::spawn` task alongside each active turn:

```rust
tokio::spawn(async move {
    // Wait for the child process to exit
    let exit_status = tokio::task::spawn_blocking(move || child.wait())
        .await??;
    
    // Child is gone. Clean up.
    let mut guard = active_turn.lock().unwrap();
    if let Some(turn) = guard.as_ref() {
        if !turn.cancelled.load(Ordering::SeqCst) {
            // Unexpected exit
            broadcaster.send(ChatEvent::Error {
                message: format!("Process exited unexpectedly: {:?}", exit_status),
            });
        }
    }
    guard.take();
});
```

The `spawn_blocking` is necessary because `child.wait()` is a blocking call — it blocks the calling thread until the child exits. Running it on the async executor would stall other tasks. The blocking thread pool handles it, and the result comes back to the async side as a future.

The watchdog is the thing that guarantees cleanup happens even if the cancel handler crashes, the connection drops, or the client disappears. The child either exits normally (turn complete) or gets killed (turn cancelled or timed out). Either way, the watchdog calls `wait()` and clears state.

---

## What the State Looks Like After Cancel

After a successful cancel:

- The child process is dead and reaped
- `active_turn` is `None`
- The broadcaster has emitted `ChatEvent::Cancelled { turn_id }`
- All subscribers have received the event
- The `chat_cancel` HTTP handler has returned 200

The session ID is preserved. The next `chat_start` will use `--resume` with the same session ID. The conversation history at the Claude CLI level is intact. From Claude's perspective, the turn simply ended — it doesn't know it was killed.

The turn boundary is clean. The daemon is ready for the next request.

---

Cancellation works. The races are handled. The zombies are reaped.

What still doesn't survive a process restart: everything. Session list, chat history, worktree settings. The daemon has no memory.

→ Next: Chapter 4 — The database must not know it's alive
