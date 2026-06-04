---
type: blog
title: "The knowledge graph that lives in a folder of Markdown files"
date: January 12, 2026
url: "/blog/mtc-ch1-knowledge-graph-folder-of-markdown"
description: Most knowledge graphs are built around a database. Ours is built around a directory — 7,174 nodes, zero databases, all plain text.
tags: ["memory-that-compounds", "knowledge-graph", "architecture", "filesystem", "obsidian", "local-first", "build-in-public"]
category: Engineering
---

Most knowledge graphs are built around a database. Ours is built around a directory.

When you run the app, there's a folder on your machine called `workdir/knowledge/`. Inside it, subdirectories organize entities by type: `People/`, `Organizations/`, `Projects/`, `Topics/`, `Meetings/`. Each entity is a single Markdown file. Relationships between entities are `[[wikilinks]]` — Obsidian-compatible backlinks that point from one note to another.

The entire graph is a file system. There is no graph database, no vector index, no triple store. There's a directory, a naming convention, and a 798-line TypeScript file that runs a `while(true)` loop every 15 seconds, scanning for new or changed files, feeding them to an LLM agent that writes new notes and updates existing ones.

This chapter is about why that architecture made sense, how it works, and where it breaks.

---

## The Incremental Pipeline

The graph builder starts as a service when the app launches. Its `init()` function logs where it's watching:

```
Monitoring folders: gmail_sync, knowledge/Meetings/fireflies,
knowledge/Meetings/granola, knowledge/Meetings/rowboat,
knowledge/Voice Memos
Will check for new content every 15 seconds
```

Then it enters an infinite loop:

```
while (true) {
    await new Promise(resolve => setTimeout(resolve, 15000));
    await processAllSources();
}
```

Each tick, `processAllSources()` loads the current state from `knowledge_graph_state.json` and walks the source directories looking for files that have changed. Change detection uses a two-level check: file modification time first (fast, skips most files), then SHA-256 content hash (accurate). If neither has changed since the last processed timestamp, the file is skipped.

This incremental approach is the whole philosophy in microcosm. We never rebuild the full graph. We process the delta. New email arrives, the file appears in `gmail_sync/`, the next 15-second tick picks it up.

---

## The Pipeline, Step by Step

When new files are found, they're collected by source folder, then processed in batches of 10. Each batch goes through this flow:

1. **Knowledge index refresh** — before the agent runs, we rebuild an index of all existing notes. This is a TextFile index, not a vector index: it lists every known person, organization, project, and topic by name, alias, and file path. The index becomes the agent's reference — it tells the LLM what it already knows.

2. **Agent invocation** — the batch of source files (emails, meeting transcripts, voice memos) is packaged into a prompt with the knowledge index and sent to a `note_creation` agent. The agent's instructions are explicit: "Use the knowledge base index below to resolve entities. Extract entities from ALL files below. Create or update notes in 'knowledge' directory. If the same entity appears in multiple files, merge the information into a single note."

3. **Tool calls** — the agent writes notes using `workspace-writeFile` and `workspace-edit` tools. The main loop subscribes to these events to track what was created and modified.

4. **State save** — after each batch, `knowledge_graph_state.json` is updated to mark processed files with their mtime, hash, and timestamp. If the process crashes mid-cycle, only the current batch is lost — everything before it is checkpointed.

5. **Version history commit** — after every batch, the changes are committed to a local git repository. Every note edit is a commit. You can run `git log` on the knowledge directory and see the graph grow, note by note.

The cycle repeats every 15 seconds. In practice, most ticks process zero files. When the Gmail sync dumps 50 new emails, the graph absorbs them over 5-6 batches, each taking maybe 10-30 seconds depending on the LLM's latency.

---

## The Gmail Filter Pass

Email is the noisiest source. Every spammer, newsletter, and "unsubscribe here" generates a file in `gmail_sync/`. If we fed all of them to the agent, the graph would be 90% noise within a week.

The filter pass runs before the agent sees any email. Each Gmail file's frontmatter is checked for a `filter:` key. The tag system defines 12 noise categories — things like `cold-outreach`, `spam`, `notification`, `receipt`, `newsletter-digest`. If the email is tagged with any of these, the filter pass skips it without invoking the LLM.

This is a fast-path optimization, but it reveals a deeper design principle: **the graph is only as valuable as its signal-to-noise ratio.** A graph that includes every "meeting cancelled" notification is worse than a graph that misses some real connections. We tuned the noise tags aggressively, and the filter pass fires before the LLM does — because the cheapest LLM call is the one you don't make.

---

## What "Knowledge Graph" Means When It Lives in Files

The term "knowledge graph" suggests a database with triple stores, SPARQL queries, and ontology layers. Ours has none of that.

A person note looks like this:

```markdown
---
type: person
email: alex@example.com
aliases: [Alex Chen, A. Chen]
organization: Acme Corp
role: CTO
---

# Alex Chen

CTO at [[Acme Corp]].

**Projects:** [[Q3 Platform Migration]], [[API v2 Design]]

**Recent context:** Working with [[Sarah Kim]] on the data pipeline.
```

Every `[[bracket]]` is an edge. The graph's edges are parsed from note content by the `knowledge_index.ts` module, which scans notes for wikilinks and builds a typed index with four entity categories: people, organizations, projects, and topics. That index is the graph — a list of 7,174 nodes assembled from 1,004 source files, organized by type, searchable by name and alias.

The `knowledge_index.ts` module is about 355 lines. It walks the `knowledge/` directory, reads each file's frontmatter and content, and produces a typed index. The index is plain text, formatted for an LLM prompt. There's no query engine, no vector search, no graph traversal library. Just a directory walk, some regex for frontmatter fields, and a text serializer.

This is the bet: **a filesystem-backed graph is inspectable, editable, and portable in a way no database-backed graph can match.**

---

## When the Filesystem Breaks

The filesystem-as-database has three failure modes that we hit repeatedly:

**No transactions.** Two agents cannot edit the same note simultaneously. The batch architecture serializes processing — one batch completes before the next starts — which prevents concurrent writes within the pipeline. But the user can be editing a note in the app while the agent is trying to update it. The agent's write wins, silently overwriting user changes.

**No query engine.** When the graph was 200 nodes, "find all notes related to Project X" was a simple directory grep. At 7,174 nodes, grep doesn't cut it. Multi-hop queries require walking the graph from scratch, which means reading many files, which means slow responses.

**No full-text search.** We had to build our own, because the filesystem doesn't provide it. The knowledge index includes aliases and keywords, but searching the body of notes requires a separate search index or an LLM-powered summary.

These are real costs. We accepted them because the benefit — user ownership, inspectability, portability — outweighed the engineering effort required to build around the gaps.

---

## The 7,174-Node Test

The graph currently holds 7,174 nodes and 14,321 edges. It was built entirely from one source: a single person's email inbox, meeting transcripts, and voice memos. No batch import, no historical data dump. A year of incremental growth.

The filesystem passed the scale test for this use case. The app didn't slow down. The agent can still find the right note. The user can still edit any file with `vim`. The graph is still inspectable — the `People/` directory is a file listing, not a query result.

But the query test failed. When we tried to render the full graph in a browser, the frontend froze at about 5,000 nodes. We shipped a static graph view instead: a snapshot rendered at build time, not a live view.

That's the boundary of the filesystem approach. It works for storing and indexing. It breaks for querying and visualizing at scale.

---

## What the Filesystem Buys

The filesystem-backed graph means the user's data is not in a proprietary format. Every note is a Markdown file. If the app disappeared tomorrow, the user would lose zero data — they'd have a folder of cross-referenced notes they can open in any editor.

The graph is human-editable. You don't need a dashboard, an admin panel, or a query language to fix a mistake. Open the note, fix the link, save.

The app is offline by default. No sync, no server, no database connection.

The architecture question was never "filesystem or database." It was "who owns the user's knowledge?" The filesystem answer is: the user does. Everything else is the engineering tax we pay for that answer.

---

## The Next Problem

The incremental pipeline works. But it has a blind spot: it can only process what arrives. It can't *go get* information — research a topic, monitor a thread, prepare a briefing on a schedule. For that, we needed a note that could wake up on its own.

That's what the `live:` frontmatter block does. A single YAML key that turns a static Markdown note into a self-updating artifact with its own scheduler, its own agent loop, and its own event triggers.

Chapter 2 is about writing permission — what happens when you give an LLM the ability to edit your notes autonomously.

---

→ Next: Chapter 2 — Live notes: documents that write themselves
