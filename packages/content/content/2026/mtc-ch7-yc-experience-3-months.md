---
type: blog
title: "The YC experience: building a knowledge tool in 3 months"
date: February 23, 2026
url: "/blog/mtc-ch7-yc-experience-3-months"
description: We started Y Combinator S24 with a different product. Here's what three months of batch pressure taught us about building AI memory — and what we didn't know on day one.
tags: ["memory-that-compounds", "yc", "startup", "y-combinator", "building-in-public", "retrospective"]
category: Engineering
---

We started Y Combinator S24 with a different product.

The pitch was something about AI agents that automate workflows. It was vague because we didn't know what we were building yet — and YC knows this. The batch is designed for founders who start with a direction and iterate into a product.

What we learned in those three months wasn't how to build a company. It was what "memory" means for an AI tool — and that the right abstraction was a folder of Markdown files, not a vector database.

---

## The First 6 Weeks

The first six weeks of YC are a blur of dinners, office hours, and pivoting. We spent those weeks building a web app. It was terrible.

The web app needed a server, which needed a database, which needed state management, which needed API endpoints — and none of it was the product. The product was supposed to be "AI that remembers." The web app was a distraction.

The turning point was an office hour where a partner asked: "Why does this need to be a web app? Your users' data is on their machine. Your value is having access to it. If you make this a web app, you're adding latency, privacy risk, and a subscription fee for something that should run locally."

We didn't have a good answer. So we threw out the web app and started building a desktop app.

---

## The Mid-Batch Pivot

Throwing out the web app meant throwing out three weeks of work. But it also meant we could use the filesystem as our database. No PostgreSQL schema. No API design. Just a folder of Markdown files with `[[wikilinks]]` between them.

With the filesystem as our data layer, every feature became simpler:
- Storage? Write a file.
- Query? Grep the workspace.
- Relationships? Parse wikilinks.
- Version history? Git commit.
- Export? Copy the folder.

We shipped the first working version at week 9. It could sync Gmail, build a knowledge graph from the email, and answer questions about what you'd discussed. It was ugly, slow, and broke constantly.

But it worked. You could type a question and get an answer grounded in your own email. That was enough to show at the next office hour.

---

## The Batch Pressure

YC applies pressure in ways you don't notice until later:

**Demo Day is fixed.** The date doesn't move. Whatever you have on that day is what investors see. This forces hard prioritization: no features that aren't demo-able in 3 minutes.

**Office hours are weekly.** Every Tuesday, you sit with a partner and explain what you built. If you have nothing new, the conversation is awkward. This creates a weekly shipping cadence.

**The batch is competitive.** Not explicitly — YC is collaborative by design — but everyone knows who's building something real and who's spinning wheels.

**Fundraising starts during the batch.** You're supposed to start meeting investors in week 8, while still building the product. The distraction is enormous. We handled it by having one founder build and one founder fundraise, swapping every week.

What saved us was that the product was easy to demo. You opened the app, it showed your email, you asked a question, and it answered. No staging server, no fake data, no "this feature isn't ready yet."

---

## What We Shipped

On Demo Day, we showed:
- A desktop app that syncs Gmail in real-time
- A knowledge graph built from email threads, contacts, and calendar events
- A chat interface that answers questions using the graph as context
- A preview of live notes — documents that update themselves based on new data

The knowledge graph had ~2,000 nodes from one founder's email. The classification system could distinguish important correspondence from newsletters. The chat could answer "What did we discuss in the last meeting with X?" and get it right.

It was enough to start conversations. Not enough to be a product. The chat was slow, the graph was incomplete, and the desktop app crashed on Windows.

---

## The Post-Batch Insight

After YC, we kept building. The real learning wasn't from the batch structure — it was from watching how people actually used the tool.

The knowledge graph was useful, but the live notes were transformative. Users didn't just query the graph — they looked at their live notes every day. The daily briefing note. The weekly review note. The "What happened while I was out" note. These notes became habits in a way the search interface never did.

We doubled down on live notes after YC. The scheduler, the event-driven updates, the edit-pattern matching — all of it was post-batch.

---

## What I'd Tell a YC Founder Building AI

**Don't build a web app if your user's data is on their machine.** The cloud is not a default. Local-first is harder to distribute but easier to build.

**The filesystem is your best API.** Your user already has a data model — it's the files on their computer. If you can read and write those files, you don't need a database or a schema.

**Ship the thing that works for one person, then figure out distribution.** Our first user was the founder who built it. The product was not ready for general availability after YC — and it didn't need to be.

---

## The Next Problem

The product was built. The graph was growing. The live notes were running. But four months of relentless building, without tests, without a database — the cracks were showing. The CONCERNS.md file said, bluntly: *"No tests — #1 risk."*

Chapter 8 is about that bet: why we chose it, what it cost, and whether we'd make it again.

---

→ Next: Chapter 8 — No tests, no database, no regrets
