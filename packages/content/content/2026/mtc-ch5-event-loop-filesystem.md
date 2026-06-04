---
type: blog
title: "The event loop that runs on the filesystem"
date: February 09, 2026
url: "/blog/mtc-ch5-event-loop-filesystem"
description: Five polling loops, none of them necessary. Here's how JSON files in directories replaced them all — and what a directory-as-message-queue actually costs.
tags: ["memory-that-compounds", "events", "filesystem", "architecture", "polling", "build-in-public"]
category: Engineering
---

The Gmail sync polled every 30 seconds. The knowledge graph rebuilt every 15 seconds. The live note scheduler checked the schedule every 5 seconds. The event processor watched the `events/pending/` directory on a 2-second polling loop.

Cumulatively, the system was running hundreds of polling cycles a day, most of which found nothing new. On a laptop, that's battery drain. On a server, it's wasted compute. On a developer's machine, it's noisy logs that make real problems invisible.

The answer was a filesystem-based event system: JSON files in directories as a message queue.

---

## The Polling Sprawl

| Service | Interval | What it checks |
|---|---|---|
| Gmail sync | 30s | Google's history API for new email |
| Knowledge graph | 15s | Last-modified timestamps on source files |
| Live note scheduler | 5s | Cron-style schedule for live notes |
| Event processor | 2s | `events/pending/` directory for new files |
| Workspace watcher | Chokidar events | Filesystem changes in the workspace |

Five polling loops, each with its own state, its own error handling, and its own log output.

The insight was that most of these loops were doing the same thing: checking if new work existed. But the event processor didn't need to poll. It could be triggered.

---

## The Directory as a Message Queue

The event system is built on three directories:

```
events/
  pending/    ← producers write JSON files here
  done/       ← processor moves files here after handling
```

A producer (Gmail sync, calendar sync, live note runner) calls `createEvent()` which writes a JSON file to `events/pending/` with a monotonically increasing ID as the filename:

```typescript
export async function createEvent(event: Omit<RowboatEvent, 'id'>): Promise<void> {
  const idGen = container.resolve<IMonotonicallyIncreasingIdGenerator>('idGenerator');
  const id = await idGen.next();
  const fullEvent: RowboatEvent = { id, ...event };
  const filePath = path.join(PENDING_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(fullEvent, null, 2), 'utf-8');
}
```

The monotonically increasing ID is critical: it ensures files sort by creation order, so the processor can replay events in sequence. There's no database sequence, no Redis counter — just a file-based ID generator that writes a counter file.

The processor reads all files from `pending/`, validates each against `RowboatEventSchema` (Zod), and routes them to registered consumers. After processing, the event is written to `done/` with a `processedAt` timestamp. If the event is malformed, it still gets written to `done/` with an `error` field so it doesn't block subsequent events.

---

## The Bus Pattern on Top of Files

The filesystem directories work well for durable, replayable events. But they're slow for real-time notifications. When a live note completes running, the UI needs to know immediately — not on a 2-second poll.

That's where the in-memory bus comes in:

```typescript
bus.subscribe('*', async (event) => {
  emitRunEvent(event);  // send to renderer via IPC
});
```

There are five buses: run bus, service bus, live note bus, background task bus, and knowledge commit bus.

The buses are the fast path. The filesystem events are the durable path. The Gmail sync writes a file to `pending/` **and** publishes a bus event. The processor picks up the file, and the UI gets notified via the bus. If the process crashes before the bus delivers, the event is still in `pending/` and gets processed on restart.

---

## The Two-Second Poll

Despite the bus, the event processor still polls. Here's why: events can arrive from outside the app.

When the user edits a Markdown file in Obsidian, the workspace watcher fires. That watcher doesn't go through the bus — it writes a file directly. The event processor picks it up on the next poll.

The polling interval is 2 seconds. It could be 10 seconds — there's no real-time requirement for file changes. But 2 seconds feels instant to a user editing a note.

The processor handles each event sequentially. This is a deliberate choice: it preserves per-event ordering and avoids race conditions on the filesystem. At 200ms per event, the processor handles 10 events per second. In practice, it never sees more than 1-2 per minute.

---

## The Edge Cases

Three edge cases emerged that the directory-as-queue handles better than a traditional message broker:

**Crash recovery.** If the app crashes mid-processing, unprocessed events stay in `pending/`. On restart, the processor picks up everything. At-least-once delivery for free.

**Manual intervention.** A developer debugging a sync issue can look at `events/pending/` and `events/done/` to see exactly what happened. They can drag a file from `done/` back to `pending/` to replay an event. You can't do that with Kafka.

**Schema migration.** When the event schema changes, old events in `pending/` fail Zod validation. The migration function handles known cases. For unknown cases, the malformed event goes to `done/` with an error, and the developer can inspect it.

---

## What the Events Cost

The filesystem-as-message-queue works because the volume is low. We average 50-100 events per day across all services. At that scale, `readdir` on a directory is faster than querying a database.

At a higher volume — 10,000 events per day — `readdir` on a directory with 10,000 files starts to degrade. The solution would be hierarchical directories or a switch to SQLite. But we haven't crossed that threshold yet.

The real cost isn't technical. It's cognitive. New contributors need to understand that events are files, that `pending/` is the queue, that `done/` is the archive, and that the bus is separate from the queue.

---

## The Next Problem

The event loop solved the polling sprawl. But it created a new problem: the app needed to connect to more services than it could build bespoke connectors for.

Chapter 6 is about why we bet on MCP over bespoke integrations, and what that decision cost.

---

→ Next: Chapter 6 — MCP, Composio, and the art of not building integrations
