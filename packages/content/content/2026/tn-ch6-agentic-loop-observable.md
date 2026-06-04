---
type: blog
title: "The agentic loop, observable"
date: March 17, 2026
url: "/blog/tn-ch6-agentic-loop-observable"
description: The core loop sounds simple. User sends a message, LLM responds, tools execute, repeat. The hard part is everything around it — and making all of it visible through an event bus.
tags: ["the-terminal-native", "hg", "session-processor", "tools", "streaming", "events", "build-in-public"]
category: Engineering
---

The core loop sounds simple.

1. User sends a message
2. LLM receives it, produces a response
3. If the response contains tool calls, execute them
4. Send results back to the LLM
5. Repeat until done

That's the loop. It's what every AI coding agent does. And it's not the hard part.

The hard part is everything around it: streaming the response token by token, detecting tool calls mid-stream, executing multiple tools in parallel, managing the context window so the LLM doesn't forget the beginning, handling errors without crashing the session, retrying with the right strategy for each failure type, and making every step of this visible to the user through the event bus.

This chapter is about the session processor — the state machine that makes the loop work without falling apart.

---

## The State Machine

The session has five states:

```
idle → streaming → tools → compacting → done
     → error (from any state)
```

**Idle.** Waiting for user input. No active processing. The session is ready.

**Streaming.** Tokens are coming from the LLM. The TUI shows them character by character. The processor collects them into structured output — text, tool calls, reasoning blocks. Tool calls are detected as they stream in, not after the response is complete.

**Tools.** One or more tool calls are being executed. The LLM might have asked to read 5 files, run a shell command, and search the codebase — all at once. Parallel tool execution means managing 3 concurrent operations, collecting results, and returning them together.

**Compacting.** The context window is getting full. The processor summarizes older conversation turns and compresses the history into something the LLM can continue with.

**Done.** The session has completed a full turn. Waiting for the next user message.

Each transition is an event. Each event is published to the bus. The TUI renders the state changes reactively.

---

## Streaming and Tool Detection

The LLM doesn't produce a response as a single blob. It produces a stream of events: `onStart`, `onText`, `onToolCall`, `onFinish`.

When a tool call starts streaming in, we see it as a structured object in the output long before the response is complete. The processor can begin preparing for tool execution — resolving tool definitions, checking permissions, allocating resources — before the LLM finishes its sentence.

This matters for latency. If the LLM says "I'll read your package.json" as a tool call, the processor can start loading the file before the LLM finishes saying "and check your tsconfig." The tool result arrives faster because we started early.

Parallel tool calls are the same idea. The LLM requests 5 file reads at once. The processor fans out: all 5 go to the tool registry simultaneously. Each tool executes independently. Results collect in a `Map<toolCallId, result>`. When all 5 are done, the collection is sent back to the LLM as a single event.

If one of the 5 fails — file not found, permission denied — the error is collected with the results. The LLM sees which ones failed and can decide what to do next. The processor doesn't crash.

---

## The Tool Registry

20+ tools, each with a schema, an implementation, and a permission level:

| Tool | What it does | Permission |
|---|---|---|
| `bash` | Execute shell commands via PTY | Always (with approval for destructive) |
| `read` | Read file contents with line ranges | Always |
| `write` | Create or overwrite files | Always (with approval) |
| `edit` | Line-based file editing | Always (with approval) |
| `glob` | Pattern-based file discovery | Always |
| `grep` | Content search via ripgrep | Always |
| `webfetch` | Fetch URLs and extract content | Always |
| `task` | Delegate work to a sub-agent | Always |
| `question` | Ask the user a question | Always (triggers UI dialog) |
| `lsp` | Query language servers for diagnostics | Always |

Every tool is an Effect service with a Schema-validated parameter contract. Tools can be added by plugins, MCP servers, and per-project tool toggles.

---

## Compaction: The Art of Forgetting

The LLM has a context window. No matter how large, a long coding session will fill it.

Compaction is the process of fitting a conversation into the context window without losing the information the LLM needs to continue working.

The compaction algorithm:

1. **Truncate tool call artifacts.** Old tool results are replaced with summaries.
2. **Summarize conversation turns.** Earlier turns are compressed into short descriptions.
3. **Preserve recent context.** The last N turns are kept at full fidelity.
4. **Keep system prompts and instructions.** These are never compacted.

The result is a conversation that can run for 50+ turns without hitting the context limit.

---

## Observability Through the Bus

Every turn, every tool call, every compaction, every error — published as an event:

```typescript
Bus.publish("session.tool-start", { toolCallId, toolName, args })
Bus.publish("session.tool-result", { toolCallId, result })
Bus.publish("session.text-delta", { content: "A" })
Bus.publish("session.compacting", { before: 45000, after: 28000 })
```

The TUI subscribes to these events and updates its reactive state. The event log is persisted to SQLite for replay and debugging.

This observability is not a nice-to-have. It's how the TUI renders without polling. It's how the user sees what the LLM is doing. Every event is a data point that tells us what happened, when, and why.

---

## The Revert

Every turn is revocable. The user can undo the last turn and fork from any previous state.

The revert system works because every event is persisted with a sequence number. To revert, you truncate the event log and rebuild the state from the remaining events.

This isn't a git revert. It's a replay from a checkpoint. The LLM doesn't know it was reverted. It sees the conversation up to the revert point and continues from there.

---

## What Came Next

The session processor was stable. The loop worked. Tools executed. Events streamed. But all of this state needed to survive a restart. In-memory state dies when the process dies.

The first attempt was JSON files. Then raw SQLite. Then we realized we were building an event store. That realization changed everything.

---

→ Next: Chapter 7 — I accidentally built an event store
