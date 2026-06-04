---
type: blog
title: "The first time I opened a 200,000-line codebase and had no idea where to start"
date: May 04, 2026
url: "/blog/ua-ch0-first-time-opened-200k-line-codebase"
description: The README said 'see architecture docs.' The architecture docs said 'see the wiki.' The wiki hadn't been updated in two years. This is why I built Understand Anything — a tool that turns any codebase into an interactive knowledge graph.
tags: ["understand-anything", "knowledge-graph", "origin", "codebase-intelligence", "onboarding", "build-in-public"]
category: Engineering
---

The README said "see architecture docs."

The architecture docs said "see the wiki."

The wiki hadn't been updated in two years.

This was my third week on the team. I had a login, a laptop, and an editor open to a codebase I didn't understand. My tech lead, well-meaning and busy, had given me the standard advice: "Just read the code. Start at main and follow the imports."

I opened main. It was 40 lines. It imported a function from a file I hadn't seen. I opened that file. It imported six more files. I opened one of those. It extended a base class from a directory three levels up that I hadn't even noticed.

After two hours, I had 14 files open in my editor, no mental model of how any of them connected, and a growing suspicion that "just read the code" was something people said when they had no better answer.

---

## The Problem That Hasn't Been Solved

Every developer has lived this. It's an onboarding ritual as universal as setting up your local environment: you join a new team, open the repository, and stare at a directory tree of folders you don't recognize, files you haven't read, and patterns you haven't learned.

The scale varies — 20,000 lines, 200,000, 2 million — but the feeling doesn't. There's a wall between you and the code, and nobody has built a decent door.

The tools we reach for don't help:

- **The directory tree** tells you the folder structure, not the architecture. `src/services/` means someone decided these things are services. It doesn't tell you which service calls which, or what happens when you change one.
- **Grep** is fine when you know what you're looking for. Useless when you don't know the vocabulary yet.
- **READMEs** are aspirational fiction. They describe what the code *should* do, not what it *does*. And they rot the moment the first PR merges.
- **Architecture decision records** are useful if you can find them and if they cover the question you have. Most of the time, they cover neither.

The best tool we have for understanding a new codebase is a patient teammate who sits with you for two hours and draws boxes on a whiteboard. Those people are rare, expensive, and usually behind on their own work.

**This is a solved problem for physical spaces.** When you move to a new city, you open Google Maps. When you walk into an unfamiliar building, there's a floor plan by the elevator.

When you open a 200,000-line codebase, there's a directory tree. That's it.

---

## The Naive Attempt

I didn't start by building Understand Anything. I started by building smaller things that failed in instructive ways.

First attempt: **a documentation generator.** Scan the code, extract comments, produce a static site. It worked technically. The output was technically accurate. It was also useless — the generated docs were as hard to navigate as the source code. I'd just moved the problem from my editor to a browser.

Second attempt: **a directory tree visualizer with file sizes.** Treemaps and sunburst diagrams. It was beautiful. It showed me that `src/legacy/` was 60% of the codebase. It did not tell me what any of those files did, how they connected, or whether I should care about them.

Third attempt: **an LLM-powered Q&A bot.** Point it at the repo, ask questions in natural language. This was closer. But it had a fundamental limitation: it answered questions one at a time. It told me facts — "the payment service lives in `src/payments/`" — but it didn't give me a map. I couldn't zoom out and see the whole thing.

I was asking "what's here?" and getting answers. I wanted to ask "how does this work?" and get understanding.

---

## The Wrong Kind of "AI-Powered"

Here's the part that tripped me up for months.

Every AI-powered code tool in 2024 made the same bet: chunk everything, embed it, retrieve relevant chunks on query. RAG. It's the obvious architecture. It's also wrong for this problem.

RAG is excellent at answering questions. "Where is the authentication middleware?" Those are single-hop lookups. RAG crushes them.

RAG is terrible at building mental models. You can't navigate a vector index. You can't zoom out from a chunk to see the system. You can't discover structure you didn't already know to ask about. RAG gives you facts. Understanding requires a map.

This distinction — facts vs. maps — became the design constraint that shaped everything else.

---

## What We Actually Needed

A map.

Not a file tree (those show locations, not relationships). Not a vector index (those retrieve facts, not structure). A real map: typed nodes, named relationships, architectural layers, guided tours, search that works by meaning and by name.

A map you can zoom in on — "what does this file do?" — and zoom out from — "how does this layer connect to that one?" A map that a teammate can drop you into and say "start here, follow the tour, you'll know the architecture in an hour."

A map that doesn't rot, because it's generated from the actual code, not from a README someone wrote on the first sprint.

---

## What We Built (Briefly)

We built a tool that turns any codebase into an interactive knowledge graph.

It runs a multi-agent pipeline — project scanner, file analyzers, architecture analyzer, tour builder, graph reviewer — that reads your code, extracts structure and meaning, and produces a graph of every file, function, class, and dependency. Then it serves an interactive dashboard where you can pan, zoom, search, and explore.

It runs entirely on your machine. Your code never leaves.

It's open source. MIT from day one.

---

## What I Didn't Expect

The first time I ran the full pipeline on a real codebase — a 180,000-line Django monolith — I watched the dashboard render and felt... embarrassed.

The graph was beautiful. It was also wrong.

The LLM had invented relationships. It connected two files that shared a similar comment but had zero runtime dependency. It labeled a utility module as "core business logic." It grouped files into layers that reflected the README's aspirational architecture, not the code's actual dependency graph.

The review phase caught most of it — that's why it exists. But watching the first draft of the graph was a humbling reminder: LLMs are confident, specific, and occasionally hallucinating. The tool had to be designed around that fact, not despite it.

That design — the pipeline, the review phase, the incremental updates, the fingerprint-based change detection — is the real story of this project. The graph is the output. The architecture is the point.

---

I built this because I kept joining codebases I didn't understand and wishing for a map.

I kept it open source because I suspect I'm not the only one.

The next chapter is about the pipeline — how we orchestrate 5 LLM agents to analyze a codebase, why they hallucinate, and what we built to catch it.

→ Next: Chapter 1 — Building a multi-agent pipeline that doesn't hallucinate your architecture
