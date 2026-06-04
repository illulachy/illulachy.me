---
type: blog
title: "Giving the LLM a real shell"
date: March 10, 2026
url: "/blog/tn-ch5-giving-llm-real-shell"
description: The first version of hg ran commands with child_process.exec. It worked for 'ls'. It failed on 'npm run dev'. Here's what it took to give an LLM a real pseudo-terminal — and why the #pty import map trick is the most elegant line in the codebase.
tags: ["the-terminal-native", "hg", "pty", "shell", "websocket", "platform-compat", "build-in-public"]
category: Engineering
---

The first version of hg ran commands with `child_process.exec`.

It worked for simple cases: `ls`, `cat`, `grep`. The LLM would say "I need to read your package.json," the system would spawn a process, capture stdout, return the result. Clean, simple, wrong.

The problem showed up on the third command. The LLM asked to run `npm test`. The test suite took 45 seconds. `child_process.exec` has a default buffer of 1MB. The output was 1.2MB. The process crashed silently. The LLM thought the tests passed.

Then we tried `npm run dev`, which starts a long-running server. `child_process.exec` waited for the process to exit. The process never exits. The LLM hung forever.

Then we tried interrupting a running command. The LLM had been running `find / -name "*.config.js"` for three minutes and wanted to stop. We sent SIGINT to the process. But `child_process.exec` wraps the command in `sh -c`, and SIGINT went to the shell, not the `find` process. The `find` kept running.

Every one of these is a solved problem in terminal emulators. That's because they use a pseudo-terminal — a PTY.

---

## What a PTY Actually Is

A pseudo-terminal is a pair of virtual devices — a master and a slave. The slave looks like a real terminal to whatever process is attached to it. The master is the other end, where the terminal emulator reads and writes.

When you start a new terminal window, the system creates a PTY pair. The slave end becomes `/dev/ttysXXX`, and the shell attaches to it. The master end is connected to the terminal emulator's UI.

This matters because a shell behaves differently when it's attached to a PTY vs. a pipe. With a PTY:

- `PS1` is set (the prompt you see)
- `TERM=xterm-256color` is set (colored output works)
- The shell sources `.bashrc`, `.zshrc`, `.profile`
- `stty` settings apply (line discipline, echo, signals)
- SIGINT goes to the foreground process group, not the shell
- Programs like `less`, `top`, and `vim` can render their TUI

With `child_process.exec` (a pipe), none of this happens. The shell knows it's not interactive. It skips `.bashrc`. It doesn't set `PS1`. SIGINT kills the entire process tree or nothing at all.

A coding agent needs colored output — `git diff`, `ls --color`, `npm test` with pass/fail colors — to see what a human would see. That's why we needed a PTY.

---

## The Platform Puzzle

PTY support on macOS and Linux is well-established. On Windows, it's a different story.

The Node.js ecosystem has `node-pty` — a native module that wraps the OS PTY APIs. It works well on all three platforms. But we wanted to use Bun as the runtime, and Bun has `bun-pty` — a native Bun module with a different API.

We couldn't depend on either one exclusively. Users might install hg with Bun (preferred) or with npm (Node.js). Some users use the Electron desktop app, which needs Node.js native modules.

The solution is in `package.json`:

```json
{
  "imports": {
    "#pty": {
      "bun": "./src/pty/pty.bun.ts",
      "default": "./src/pty/pty.node.ts"
    }
  }
}
```

Bun's import map lets you switch implementations based on the runtime. When Bun runs hg, it loads `pty.bun.ts` (wrapping `bun-pty`). When Node.js runs it, it loads `pty.node.ts` (wrapping `node-pty`). The TypeScript interface is the same:

```typescript
interface Proc {
  onData: (callback: (data: Uint8Array) => void) => void
  onExit: (callback: (code: number) => void) => void
  write(data: Uint8Array): void
  resize(cols: number, rows: number): void
  kill(): void
}
```

The import map trick saved us from writing a platform abstraction layer. The runtime provides the branch. TypeScript ensures both implementations satisfy the contract.

---

## The Rolling Buffer

The LLM needs to see command output. But output can be enormous — a test suite might produce 500K lines. We can't send all of it to the LLM's context window. We can't throw it away either, because the user might scroll back through the terminal pane.

The solution is a 2MB rolling output buffer. Every chunk of PTY output goes into the buffer. When the buffer exceeds 2MB, the oldest data is discarded. The buffer is cursor-addressable: each write has a cursor position, and reconnecting clients can request "everything after cursor X."

This enables:

- **Live streaming**: Every chunk is pushed to the WebSocket immediately
- **Reconnection**: A disconnected TUI requests the buffer from its last cursor and catches up in one shot
- **Scrolling**: The TUI's PTY pane renders from the buffer, supporting scrollback up to 2MB
- **Truncation for the LLM**: The session processor picks the last N lines as context, not the entire buffer

The buffer isn't a file. It's an in-memory ring buffer, persisted to SQLite when the session ends.

---

## The WebSocket Bridge

The PTY runs in the server process. The TUI is a separate process. The data crosses the process boundary through a WebSocket bridge.

When the PTY produces output:
1. The PTY's `onData` fires with a Uint8Array chunk
2. The chunk goes to the rolling buffer (cursor advances)
3. The chunk is published as a `pty.output` bus event
4. The WebSocket handler pushes the event to all connected clients
5. The TUI's PTY renderer receives the event and writes the bytes to its terminal emulator component

When the user types in the TUI's terminal pane:
1. Keyboard events are captured and serialized
2. Sent over WebSocket as `pty.input`
3. Server writes the bytes to the PTY's `write()` method
4. The PTY sends them to the running process
5. If the process is a shell, it echoes the characters back through the PTY

This round trip takes about 1ms on localhost — fast enough that the typing experience feels native.

---

## What Still Breaks

**Interactive programs.** `less`, `top`, `vim`, `htop` — programs that take over the terminal and expect keyboard input. The LLM can start them but can't navigate them.

**`sudo` and password prompts.** The PTY doesn't have a TTY for password entry. The LLM can't respond to "sudo: password".

**Large output.** A 2MB buffer covers most cases. A user running `cat` on a 200MB log file will overflow the buffer and lose early output.

Every one of these is a known limitation, documented, and tracked. Some will be solved. Some are inherent to giving a non-human access to a human interface.

---

## What Came Next

The LLM had a real shell. It could `ls`, `grep`, `npm test`, `git diff` — all with proper terminal semantics. The output streamed to the TUI in real time. The user could see what the LLM was doing.

But the shell was just one tool. The LLM needed to read files, write code, search the codebase, delegate tasks — and orchestrate all of these in a single session without losing context or hitting context window limits. That required a session processor that could manage the complexity without leaking it.

---

→ Next: Chapter 6 — The agentic loop, observable
