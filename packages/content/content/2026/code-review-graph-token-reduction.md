---
type: blog
title: Your AI Code Reviewer Is Wasting 80% of Its Tokens
date: April 20, 2026
url: /blog/code-review-graph-token-reduction
description: Every AI code review reads your entire codebase when it only needs a fraction of it. code-review-graph fixes that — 8x token reduction, zero tradeoffs on accuracy.
tags: ["AI", "Developer Tools", "Code Review", "MCP", "Performance"]
category: Engineering
---

Every time you ask your AI coding assistant to review a PR, it reads your codebase from scratch.

Doesn't matter if you changed two files. It loads everything it can fit in the context window, scans for what's relevant, and hopes for the best.

You pay for every token. Most of them are wasted.

code-review-graph is the fix.

---

## What it actually does

The tool builds a persistent structural map of your codebase — a knowledge graph of functions, classes, imports, call chains, and file dependencies. It uses Tree-sitter for AST parsing across 23+ languages, stores everything locally in SQLite, and updates incrementally in under 2 seconds when files change.

When you ask your AI to review a change, instead of sending your entire repo, it runs **blast-radius analysis**: it traverses the graph to find exactly which functions, classes, and files are actually affected by your diff. Then it sends only those.

The result: your AI reviews the right code, not all the code.

---

## The numbers

Real benchmarks across 6 production repositories:

| Project | Files Before | Files After | Reduction |
|---|---|---|---|
| Next.js monorepo | 27,732 | ~15 | 27.3x |
| Mid-size Python service | ~3,400 | ~250 | 13.6x |
| Average across 6 repos | — | — | 8.2x |

Blast-radius analysis has 100% recall. It doesn't miss affected files. The F1 score of 0.54 means it's conservative — you might get a few extra files, not missing ones.

---

## How to use it

Install it:

```bash
pip install code-review-graph
# or
uvx code-review-graph
```

It integrates with your AI assistant via MCP (Model Context Protocol). Works with Claude Code, Cursor, Windsurf, Zed, Continue, and several others.

Once connected, it exposes 28 MCP tools your assistant can call — graph traversal, impact analysis, semantic search, community detection, execution flow tracing.

Set up the auto-update hook and the graph stays current automatically on every file edit and git commit. You don't have to think about it.

---

## What else you get

Token reduction is the headline, but the graph is genuinely useful for other things:

**Architecture visibility.** The D3.js visualization shows hub nodes (heavily connected files), bridge nodes (cross-community connectors), and surprise coupling scores (files that are more connected than their module structure suggests). Good for onboarding new engineers and spotting architectural drift.

**Knowledge gap analysis.** It identifies untested code hotspots — functions and classes with no test coverage and high connectivity. Useful for deciding where to write tests next.

**Auto-generated review questions.** Based on graph analysis, it surfaces non-obvious questions your reviewer should consider. Things like: "This function is a hub — does this change affect its 14 callers?"

**Multiple export formats.** GraphML, Neo4j Cypher, Obsidian vaults, SVG. If you want to pull your codebase graph into another tool, you can.

---

## Who built it

The repo has 11.3k stars, 64 contributors, and just shipped v2.3.2 on April 14, 2026. It supports Jupyter and Databricks notebooks alongside the standard language list, which tells you the team is thinking about data science workflows too.

The fact that it stores everything locally in SQLite — no external database, no cloud sync — matters. Your codebase graph doesn't leave your machine.

---

## The actual tradeoff

The one honest caveat: blast-radius analysis is structural, not semantic. It finds files connected by imports and call chains. It won't catch implicit dependencies — like two functions that need to be consistent because of a shared convention, not because one calls the other.

So you still need a human reviewer who knows the codebase. What you're eliminating is the token cost of feeding your AI reviewer irrelevant context, not the need for good review judgment.

---

If you're using an AI coding assistant and paying per token, this is worth setting up. The ceiling on reduction depends on your repo size. On large monorepos it's absurd. On small projects it's more modest.

Start with it on one repo and run the built-in token benchmark to see what you're actually saving.

GitHub: [https://github.com/tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph)
