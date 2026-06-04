---
type: blog
title: "Documents that write themselves — the live note system"
date: January 19, 2026
url: "/blog/mtc-ch2-documents-that-write-themselves"
description: A single YAML key that turns a static Markdown note into a self-updating artifact. The feature I least expected to work, and the one that changed how I think about AI tools.
tags: ["memory-that-compounds", "live-notes", "agent", "scheduling", "event-driven", "local-first", "build-in-public"]
category: Engineering
---

The knowledge graph worked. Email arrived, the graph grew. Meeting transcripts landed, notes linked to each other. The user opened the app and saw a growing web of people, projects, and decisions.

But the graph only reacted. It couldn't act.

If you wanted to know what happened on a project this week, you had to ask. If you wanted a daily briefing on a topic, you had to request it. If you wanted the system to watch for something important and notify you, it couldn't — because there was no concept of "watching" in the architecture. There was only ingestion and query.

The graph needed notes that could wake up on their own.

This chapter is about the `live:` frontmatter block — a single YAML key that turns a static Markdown note into a self-updating artifact. It's the feature I least expected to work and the one that changed how I think about AI tools.

---

## The First Instinct: Refresh Buttons

Our first attempt at "active" notes was manual. We added a "Regenerate" button to the meeting note view. Click it, and the agent re-reads the source transcript and rewrites the summary.

This was fine for a specific use case. But it missed the point. The whole reason to have a knowledge graph is so the system *knows what you care about* without you having to ask. A regen button requires you to remember to press it. That's still cognitive load.

What we wanted was: the user expresses intent once — "keep an eye on this" — and the system follows through on its own schedule. No reminders, no dashboards, no daily click-throughs.

The insight was that the intent should live *in the note itself*. Not in a scheduler config file, not in a cron table, not in a separate UI panel. In the note. Because the note is where the intent is expressed — "I want this note to contain the current state of X." The system's job is to make that true.

---

## The `live:` Frontmatter Block

A live note is a standard Markdown file with one extra piece of YAML frontmatter:

```markdown
---
live:
  objective: |
    Show the current time in Chicago, IL in 12-hour format.
    Keep it as one short line, no extra prose.
  active: true
  triggers:
    cronExpr: "0 * * * *"
  lastRunAt: "2026-05-08T15:00:01.234Z"
  lastRunSummary: "Updated — 3:00 PM, Central Time."
  lastRunError: null
---

# Chicago time

3:00 PM, Central Time
```

The `live:` block is the runtime contract. The fields above the user-authored line — `objective`, `active`, `triggers` — are configurable by the user. The fields below — `lastRunAt`, `lastRunId`, `lastRunSummary`, `lastRunError` — are written by the system after each run.

The most important constraint: **one note, one `live:` block, one objective.** You don't configure multiple agents per note. You write one objective in natural language — "Track prices from our top three competitors in the CRM space" — and the agent handles the rest.

This wasn't an obvious choice. Early prototypes allowed multiple `live:` blocks per note. What we found was that users wrote objectives that naturally blended concerns. Splitting them created scoping confusion: which agent owned which paragraph? Who cleaned up when content overlapped?

One note, one objective, one agent. That's the invariant.

---

## The Architecture

The live note system has four components that run continuously:

**Scheduler** — polls every 15 seconds, scans all Markdown files in `knowledge/`, checks each one for a `live:` block. If the note has active triggers — a cron expression or a time window — and is due, it fires the agent.

**Event processor** — polls every 5 seconds, checks a `events/pending/` directory for new event files. Events are produced by other services: Gmail sync ("email arrived for thread X"), calendar sync ("meeting schedule changed"). For each event, a two-pass routing system determines which live notes should fire:

- **Pass 1 (cheap LLM classifier)**: given an event and a batch of 20 eligible live notes, which ones *might* be relevant? This is intentionally liberal — false positives are expected.
- **Pass 2 (inside the agent)**: if the note's agent actually runs, it receives the event payload and a directive: "Only edit if the event genuinely warrants it."

Two passes because Pass 1 costs cents per batch and Pass 2 costs dollars per invocation. Route cheap, evaluate expensive.

**Runner** — the core execution engine. When a trigger fires, `runLiveNoteAgent()`:

1. Acquires a concurrency guard — static set of running note paths. If this note is already running, return "skip."
2. Fetches the note from disk. Snapshots the body for diffing.
3. Creates an agent run with the `live-note-agent` model.
4. Bumps `lastAttemptAt` immediately (covers both in-flight and post-failure backoff).
5. Sends the agent a message: the path, the objective, the trigger type, and any event context.
6. Waits for completion. The agent calls `workspace-readFile` to read the current body, makes small `workspace-edit` calls to update sections, and ends with a 1-2 sentence summary.
7. On success: bumps `lastRunAt`, stores the summary, clears the error.
8. On failure: records the error in `lastRunError`. Leaves `lastRunAt` untouched so the scheduler retries.

---

## The Single-Writer Invariant

The hardest problem in the live note system wasn't scheduling or routing. It was concurrent writes.

If the user is editing a note in the app while the scheduler fires the agent, who wins?

The answer is a set of architectural rules:

1. **The renderer never writes the `live:` block.** The frontend's YAML editor explicitly filters out the `live:` key. When the user saves frontmatter changes, the original `live:` block is spliced back byte-for-byte.

2. **All `live:` mutations go through fileops.** The backend helpers — `setLiveNote`, `patchLiveNote`, `setLiveNoteActive` — run under `withFileLock()`.

3. **The agent only writes the body.** The agent's system prompt forbids touching the frontmatter. The runner patches `lastRunAt` and `lastRunSummary` separately after the agent completes.

The result is a system where the user, the agent, and the runtime each own a different part of the file:

| Owner | Owns | Writes via |
|---|---|---|
| User | `live.active`, `live.objective`, `live.triggers` | Frontend panel → IPC → file lock |
| Agent | Body below H1 | `workspace-edit` tool |
| Runtime | `live.lastRunAt`, `live.lastRunSummary`, `live.lastRunError` | Runner → file lock |

This separation is what makes live notes safe. The user can't break the agent's runtime state. The agent can't overwrite the user's configuration.

---

## Backoff, Grace Windows, and Storms

A live note that fires every hour and fails is a problem. A live note that fires every hour, fails, and retries immediately is a disaster.

The backoff system addresses this with a single number: `lastAttemptAt`. Set at the start of every run, it anchors a 5-minute retry window. The scheduler checks `backoffRemainingMs(lastAttemptAt)` and skips any note that attempted less than 5 minutes ago.

Cron triggers have a separate 2-minute grace window. If the app was offline and the cron time passed more than 2 minutes ago, the scheduled fire is skipped entirely, not replayed. This prevents a pile-up when the laptop wakes from sleep.

The principle is: **cron schedules are strict, windows are forgiving, events are opportunistic.**

---

## What Live Notes Actually Do

The most common live note patterns:

- **Daily briefing**: fired by a window trigger (8 AM–9 AM), the agent produces a rolling summary of new people, projects, and decisions.
- **Competitor monitoring**: fired by event triggers, watches Gmail for emails mentioning competitor names and updates a table.
- **Project status**: fired by cron (every 4 hours), scans recent meetings and emails and writes a status paragraph.
- **Team standup**: triggered by a calendar event (meeting ended), reads the transcript and generates linked action items.

The common thread is delegation. The user doesn't say "run this query every hour." They say "keep this updated." The objective is expressed in natural language, not in a query language.

---

## Why It Works

I was skeptical at first. Giving an LLM write access to your notes sounds like an invitation to chaos. What if it deletes something important?

What I found was the opposite. The `live:` block creates a safe container. The agent writes below the H1. The runtime owns the metadata. The user owns the configuration. The boundary is enforced at the file system level.

And because the output is Markdown — not a database record, not a JSON blob — the user can always see what changed. The diff is readable. The version history shows every edit the agent made.

The feature I least expected to work became the one that made the product feel like it was working *with* you, not responding to you.

---

## The Next Problem

Live notes worked because we constrained them: one objective, patch-style edits, single-writer invariant. But the biggest source of fuel for live notes — and for the knowledge graph itself — was email.

Chapter 3 is about the Gmail sync — how we classify, label, and link 12 categories of email into the graph without drowning in newsletters and spam.

---

→ Next: Chapter 3 — Your inbox as a knowledge source
