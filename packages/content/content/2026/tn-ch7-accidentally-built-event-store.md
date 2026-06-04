---
type: blog
title: "I accidentally built an event store"
date: March 24, 2026
url: "/blog/tn-ch7-accidentally-built-event-store"
description: I started with JSON files. Moved to SQLite snapshots. Then noticed the pattern. I wasn't storing state — I was storing snapshots and discarding history. Here's how event sourcing crept in through the back door.
tags: ["the-terminal-native", "hg", "event-sourcing", "sqlite", "persistence", "architecture", "build-in-public"]
category: Engineering
---

I started with JSON files.

A single file per session, written to disk after every LLM turn. Simple, human-readable, easy to debug. It worked for the first 50 sessions. Then it broke in three ways at once: concurrent writes corrupted a file, a 200-turn session file grew to 12MB and took seconds to parse, and I realized JSON doesn't support partial reads.

So I moved to SQLite. One table, one row per session, queryable, transactional, no corruption. It felt like a real database decision.

Then I noticed a pattern. Every time the session state changed, I was writing a new row to SQLite and reading the entire session back to rebuild the in-memory state. I wasn't storing state. I was storing snapshots, discarding the history, and wondering why I couldn't answer questions like "what was the LLM doing five turns ago?"

That's when I realized I was building an event store. I just hadn't admitted it to myself yet.

---

## The Evolution

**Phase 1: JSON files.** One file per session. Write after every turn. Simple. Fragile. No concurrent access. No partial reads. Corruption on crash.

**Phase 2: SQLite snapshots.** One row per session. `session.content` was a JSON blob with the full conversation. Every update replaced the entire blob. This was JSON files with better concurrency — same problem, different storage.

**Phase 3: SQLite with history.** A `session_part` table — one row per LLM turn. Parts had sequence numbers. I could replay a session from its parts. But the parts were opaque blobs, not typed events.

**Phase 4: Actual event sourcing.** An `event` table — one row per event. A `event_sequence` table — ordered list of event IDs per aggregate. Events are typed: `session.text-delta`, `session.tool-start`, `session.tool-result`, `session.started`, `session.compacted`. Each event has a type, a payload, a timestamp, and an aggregate ID.

State is a projection. You want a session's current state? Play all `session.*` events in order. You want to undo a turn? Remove events from the sequence. You want to replay a session to debug an issue? Replay the same events into a new projection.

This is Redux for a server process. Reducers, actions, projections — the same pattern, the same benefits, but for a long-running service instead of a browser.

---

## The Two-Layer Architecture

The event system has two layers: the in-process bus and the persisted event store.

**Bus** (`packages/hg/src/bus/`). In-process typed PubSub. Events are published and subscribed in the same process. Zero serialization overhead. Used for real-time communication between services: the session processor publishes `session.text-delta`, the TUI bridge subscribes and forwards to the WebSocket.

**SyncEvent** (`packages/hg/src/sync/`). The persisted layer on top of the bus. When an event is published, SyncEvent writes it to SQLite before the subscribers see it. The write-and-notify is transactional: if the write fails, subscribers never see the event.

The separation matters. The bus is fast and ephemeral. SyncEvent is durable and replayable. Most events travel through both layers.

---

## Projectors

An event is a fact. "Something happened." A projector turns facts into state.

```typescript
function projectSession(sessionId: string): SessionState {
  const events = loadEvents(sessionId)
  let state: SessionState = { parts: [], status: "idle" }

  for (const event of events) {
    switch (event.type) {
      case "session.started":
        state.status = "active"
        break
      case "session.text-delta":
        state.parts.push({ type: "text", content: event.payload.content })
        break
      case "session.tool-start":
        state.parts.push({ type: "tool-call", ...event.payload })
        break
    }
  }

  return state
}
```

Projectors are deterministic. Same events, same state, every time. This is what makes replay debugging possible.

---

## When Event Sourcing Was Overkill

I promised honesty in this series. Here it is: event sourcing added complexity before it added value.

For the first 100 users, SQLite snapshots would have worked fine. The session data was small. Crash recovery wasn't critical. The event store was built for a scale that didn't exist yet.

The cost was:
- More code to write before shipping the first feature
- More concepts to explain to new contributors
- Slower initial development because every state change had to be modeled as an event
- Query difficulty: "give me all sessions from last week" is a SQL query for snapshots; for events, it's a projection over filtered events

**The lesson:** Build the simplest thing that works. Events are an optimization, not a foundation. Add them when the snapshots hurt, not before.

---

## When It Was Exactly Right

The revert system is the killer feature that event sourcing enables that nothing else does well.

A user runs 12 turns with an LLM. The 13th turn goes wrong — the LLM deleted a file it shouldn't have. The user says "undo." The system:
1. Determines which sequence numbers belong to turn 13
2. Deletes those events from the event sequence
3. Replays the remaining events through the projector
4. Session state is back to where it was before turn 13

No rollback logic. No compensatory actions. No "undo handler." Just replay without the bad events.

The user sees a clean undo. The developer sees a full audit trail of what happened, including the undone turn.

---

## What Came Next

The event store gave us persistence, replay, undo, and cross-process sync. But an AI coding agent needs more than its own features. It needs to integrate with the developer's existing ecosystem: language servers for code intelligence, external tools for data access, editors for seamless workflow.

That's where we faced the hardest architectural question: build a plugin system or integrate with existing protocols?

The answer surprised us.

---

→ Next: Chapter 8 — Protocols over platforms
