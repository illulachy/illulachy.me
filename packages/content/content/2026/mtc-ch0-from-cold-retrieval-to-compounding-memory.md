---
type: blog
title: "From cold retrieval to compounding memory"
date: January 05, 2026
url: "/blog/mtc-ch0-from-cold-retrieval-to-compounding-memory"
description: Every AI tool in 2024 forgot who I was between conversations. This is the story of how we spent a Y Combinator batch building a knowledge graph that compounds instead of retrieves.
tags: ["memory-that-compounds", "knowledge-graph", "ai-coworker", "yc-s24", "local-first", "build-in-public"]
category: Engineering
---

Every AI tool I used in 2024 forgot who I was between conversations.

I'd spend 20 minutes in a ChatGPT thread, establish context, build a shared understanding of the problem. Then I'd close the tab, open a new one the next day, and it was a fresh start — no memory of what we'd discussed, no accumulated understanding, no sense that this was a continuing relationship. Every session was the same first date.

This isn't a complaint about LLMs. It's a statement about how we design systems around them.

The prevailing approach to AI memory in 2024 was *retrieval-augmented generation*. You dump documents into a vector database, embed them, and at query time, you search for the most relevant chunks and stuff them into the prompt. It works. It's the standard architecture. And it treats every interaction the same way: pull context from a cold start, answer the question, discard everything.

I wanted something different. I wanted context that *accumulated*, not context that was *reconstructed*.

This is the story of how we spent a Y Combinator batch building it.

---

## The Cold Start Problem

The idea came from a simple observation: most knowledge work is not about answering a single question. It's about carrying threads across time.

You have a meeting with a colleague on Monday. You agree on next steps. On Wednesday, you get an email from a client that relates to that conversation. On Friday, you need to prepare a brief for next week's review. Each of these interactions is connected. But in the standard AI architecture, each one starts cold — you paste in the meeting transcript, you attach the email thread, you hope the model identifies the relationship.

This isn't just an AI problem. It's a human problem that AI is supposed to solve but, in practice, reproduces.

The insight was: *what if memory was the product, not a feature?* What if, instead of retrieving context on demand, the system maintained a long-lived graph of people, projects, decisions, and commitments — and updated it continuously as new information arrived?

That's not RAG. That's a different architecture entirely.

---

## The YC Bet

We applied to Y Combinator with a pitch that boiled down to: "AI tools are stateless. We want to build the state layer."

The batch started in Summer 2024. We had three months to ship something real.

Day one, we didn't have a knowledge graph. We didn't have an Electron app. We didn't have Gmail sync, or live notes, or any of the features that define the product now. We had a folder of Markdown files and a script that asked an LLM to write notes about what it found in Gmail.

The first prototype was a `people/` directory. Every time the script found a new email from someone it hadn't seen before, it created a Markdown file with their name, their email address, and a summary of what the thread was about. The file used Obsidian-style `[[wikilinks]]` to connect to other files — projects they'd mentioned, companies they worked for, decisions they'd been part of.

It was crude. The notes were verbose. The LLM hallucinated relationships that didn't exist. But there was something in it that felt right — because the graph was inspectable. You could open the `people/` directory, click on a name, and see what the system believed about that person. If it was wrong, you could edit the note. The knowledge wasn't hidden inside a vector embedding. It was text. Editable. Yours.

That's the moment the architecture chose itself: *a knowledge graph is just a folder of notes that link to each other.*

---

## The First Architecture Decision

The obvious architecture for an AI memory system is a vector database. You embed everything, store the vectors, and retrieve by similarity. This is what every RAG tutorial teaches. It scales. It's battle-tested. It's what we should have built.

We built the opposite.

Every piece of knowledge is a Markdown file. Relationships are `[[wikilinks]]`. The entire graph lives in a directory on the user's machine, organized by convention — `people/`, `organizations/`, `projects/`, `meetings/` — not by schema. There is no database, no vector store, no embedding pipeline between the user and their data.

The trade-off was stark:

- **Filesystem limits**: no query engine, no ACID transactions, no built-in full-text search (we had to write our own). Race conditions are managed with file locks.
- **User ownership**: every note is a plain text file you can open in any editor. Back up with `rsync`. Grep with `grep`. Edit with `vim`. There is no proprietary format, no export step, no lock-in.
- **Obsidian compatibility**: the vault is an Obsidian vault. Users who have Obsidian installed can open it, see the graph view, and edit notes with backlinks rendered in real time. The knowledge graph you built in the app is also a knowledge graph in Obsidian — because they're the same files.

We chose the filesystem because it was the only architecture that made the user's ownership real. If the data lives in a vector database, you don't own it — the database does. If the data lives in Markdown files, you own it the same way you own any file on your computer.

This decision — files, not vectors — shaped everything that followed.

---

## The Prototype That Wasn't a Product

Three weeks in, we had:

- A directory of ~200 Markdown notes about the people in my inbox
- A script that polled Gmail every 5 minutes and classified threads into categories
- An LLM agent that read new threads and either created new notes or updated existing ones
- A graph with maybe 300 nodes and 600 edges

It wasn't a product. It was a demonstration that the concept worked.

We showed it to other YC founders. The reaction was always the same: "This is interesting... but what do I do with it?"

That question — *what do I do with it* — became the design brief for the next eight weeks. The knowledge graph wasn't the product. It was the substrate. The product was what the knowledge graph *enabled you to do*: prep for a meeting, draft an email, track a topic, generate a deck, produce a brief.

The graph was the engine. The user needed a cockpit.

That's when we started building the desktop app.

---

## The Electron Call

A knowledge graph that lives in a folder of files doesn't need an app. You can open the folder in any editor and read the notes. But the *product* needs an app — because the product isn't the graph. The product is the agent that acts on the graph.

We needed a place where the user could:
- See their knowledge graph visualized
- Chat with an AI that had real context
- Configure Gmail and calendar sync
- Create and manage live notes
- See meeting briefs and email drafts generated from their graph

A web app would have been simpler. But a knowledge tool that runs on your data has a responsibility: the data should never leave your machine unless you explicitly share it. A web app breaks that promise by default.

So we built an Electron app. Three processes, 100+ IPC handlers, an embedded Express server, OAuth flows, chokidar file watchers, and a React frontend that renders the graph, the chat, and the live note panels.

Electron is not the elegant choice. But it was the honest choice — because it was the only way to give users a real interface to their local data without uploading it anywhere.

This was month two of the YC batch. We had a folder of notes and a lot of Electron build errors.

---

## What We Had at the End of the Batch

By demo day, the knowledge graph had grown to several thousand nodes. The app could sync Gmail, classify threads, create notes about people and projects, generate meeting briefs from calendar events, and run a simple version of what would become live notes.

It was rough. The Electron packaging had a bug that crashed on Linux. The Gmail classification was too aggressive — every "meeting cancelled" email created a new note about a cancelled meeting as if it were a significant event. The graph visualization worked up to about 5,000 nodes, then the browser tab crashed.

But the core loop was real:

1. New email arrives → Gmail sync picks it up
2. LLM classifies the thread → knowledge graph updates
3. Related notes get backlinks → the graph accumulates
4. User asks a question → agent searches the graph, finds connected notes, answers with full context
5. The answer generates new notes → the graph grows

Step 4 is the moment that made the whole thing worth building. When you ask "Prep me for my meeting with Alex" and the agent returns a brief that references decisions from three different email threads, a project note from last month, and an action item from a meeting last week — that's not RAG. That's memory compounding.

---

## What Came Next

We shipped. Users started running the app. The knowledge graph grew from one person's data to many people's data. The notes got better. The sync got faster. The live note feature — a single `live:` frontmatter block that turns a static Markdown note into a self-updating artifact — became the feature nobody asked for and everyone used.

But the foundation was already laid in that first week of the batch: the choice to use files, not vectors. The decision to build a desktop app, not a web service. The bet that long-lived knowledge, even in its crude early form, was worth more than perfect retrieval that started cold every time.

The rest of this series is about how that foundation held up — where it worked, where it broke, and what we learned from both.

Chapter 1 starts with the vault itself: how a folder of Markdown files became a knowledge graph, what the filesystem-as-database buys and costs, and why `[[wikilinks]]` were the right abstraction for a system that had to be both machine-readable and human-editable.

---

→ Next: Chapter 1 — The knowledge graph that lives in a folder of Markdown files
