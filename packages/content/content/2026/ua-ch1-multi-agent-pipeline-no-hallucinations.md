---
type: blog
title: "Building a multi-agent pipeline that doesn't hallucinate your architecture"
date: May 11, 2026
url: "/blog/ua-ch1-multi-agent-pipeline-no-hallucinations"
description: The LLM said user_service.py depended on payment_gateway.py. It didn't. Here's the 7-phase pipeline we built to catch hallucinated relationships — and why the review phase is the whole point.
tags: ["understand-anything", "knowledge-graph", "pipeline", "agents", "hallucination", "tree-sitter", "build-in-public"]
category: Engineering
---

The LLM said `user_service.py` depended on `payment_gateway.py`.

It didn't.

They weren't in the same directory. They weren't imported by the same module. They didn't share a single function call, class reference, or variable name. The only connection between them was that the LLM had seen the words "user" and "payment" in the same README and decided they were probably related.

That was hallucination #14 in a single pipeline run. The review phase caught it. That's the whole story of this chapter in miniature: the LLM will confidently invent relationships between files that have never met. If your architecture assumes it won't, your architecture is wrong.

We built a pipeline that assumes the opposite. Every agent output is a draft. Every draft gets reviewed. The system is designed around correction, not prevention.

---

## The Single-Agent Trap

My first attempt was embarrassingly simple. One prompt. One LLM call. Feed it the repo structure, a few key files, and ask it to describe the architecture.

It produced beautiful prose. Confident, specific, detailed. It named three architectural layers, listed their responsibilities, and drew dependency arrows between them. Every paragraph sounded like the author had spent weeks studying the codebase.

It was also wrong.

The layers were aspirational — they described what the README *said* the architecture was, not what the code *did*. The "core domain" it identified was a utility folder that happened to be imported by everything (because it contained string helpers). A single agent with a full-context prompt produces plausible fiction. It maps onto the textual surface of the code — filenames, comments, READMEs — and synthesizes a narrative that sounds right. But it hasn't parsed a single import statement.

---

## The Pipeline

The pipeline runs in seven phases. Each has a single job.

```
Phase 1: Scan       — Find every file in the project.
Phase 2: Batch      — Group files into analysis batches.
Phase 3: Analyze    — Analyze every file for structure and meaning.
Phase 4: Assemble   — Merge all file analyses into a raw graph.
Phase 5: Architect  — Detect layers, identify entry points, infer patterns.
Phase 6: Tour       — Build guided walks through the graph.
Phase 7: Review     — Audit the entire graph for hallucinations and errors.
```

The pipeline is sequential. The agents within a phase run in parallel. Phases write intermediate results to disk — JSON files that the next phase reads. This is the intermediate file protocol. Because phases are file-isolated, you can re-run a single phase without redoing all the work.

---

## Phase 1: Scan

The scanner walks the file tree and identifies everything it should analyze. It respects `.gitignore` by default and `.understandignore` as an override. It classifies files by language — TypeScript, Python, Go, Rust, whatever tree-sitter has a grammar for.

The scanner produces a manifest: file paths, languages, sizes, modification timestamps. That manifest is the pipeline's first output. Every subsequent phase references it.

---

## Phase 2: Batch

Not every file deserves the same analysis. Phase 2 groups files into three tiers:

- **Trivial** — configuration, tests, generated files. Quick scan, light analysis.
- **Standard** — most source files. Full parse with tree-sitter, AST extraction, dependency tracing.
- **Critical** — entry points, core modules, files with high centrality. Deep analysis: function-level breakdown, cross-module dependencies, architectural role inference.

Batching also solves a practical constraint: LLM context windows. A single `file-analyzer` agent can handle about 12 standard files before the response quality degrades. We batch in groups of 12 for standard files, 4 for critical.

---

## Phase 3: Analyze

Five parallel `file-analyzer` agents. Each receives a batch of files and a shared context file (the project's dependency map so far, key vocabulary, architectural hints).

Each agent produces:

- A summary of each file's purpose
- Functions, classes, and exported symbols
- Dependencies (imports, requires, extends, implements, calls)
- File-level tags ("middleware", "model", "controller", "service", "utility", "config")
- Confidence scores for every claim

The prompt is specific. We ask agents to distinguish between *certain* dependencies (explicit imports) and *inferred* dependencies (functions that call something defined elsewhere). These are tracked separately in the graph. Certain edges get a high confidence weight. Inferred edges get flagged for the review phase.

The shared context file prevents the five agents from producing five different vocabularies for the same codebase. Without it, Agent 1 might call something "user-auth-service" and Agent 2 calls it "auth-module." The assembler would have to reconcile them into one node — harder than it sounds.

---

## Phase 4: Assemble

The assembler merges every file analysis into a single raw graph. This is pure logic — no LLM involvement.

It resolves symbols: if three files import `src/auth/authenticate.ts`, that's a single node with three incoming edges. It deduplicates: if two agents assigned different tags to the same file, the assembler picks the higher-confidence one. It builds the adjacency matrix.

The output is a graph with ~13 node types and ~26 edge types. Everything from `file` and `function` to `external-package` and `entry-point`.

---

## Phase 5: Architect

The architect agent reviews the raw graph and detects structure that wasn't explicit in the files:

- **Layers** — "these 12 files form a service layer"
- **Entry points** — `main.ts`, the Express app mount, the server bootstrap
- **Boundaries** — where one concern ends and another begins
- **Patterns** — repository pattern, factory pattern, adapter pattern

This is the phase where the LLM is most creative and most dangerous. The architect agent has the highest hallucination rate because it's extrapolating from patterns, not reading explicit structures. The architect's output is stored separately from the raw graph. Layers and patterns are *annotations* on the graph, not baked-in facts.

---

## Phase 6: Tour

The tour builder constructs guided walks through the graph. A tour is a sequence of nodes with commentary: "start here, this is the entry point. Next, see how it calls the service layer."

One of our early beta users handed a tour link to a new hire, said "read this, then we'll talk," and the new hire understood the architecture in 45 minutes. That's the moment I knew the tour builder wasn't a nice feature. It was the feature.

---

## Phase 7: Review

This is the phase that earns trust.

Every edge, annotation, and label from every prior phase gets examined by a dedicated `graph-reviewer` agent. It checks:

- **Edge verifiability** — is there an actual import or call chain supporting this dependency?
- **Label accuracy** — does this file actually do what the label claims?
- **Layer consistency** — do the files in a "service layer" share common characteristics?
- **Hallucination** — did any agent create a relationship that lacks code-level evidence?

The reviewer cross-references every claim with the AST data from Phase 3. Imports are checked against actual import statements. If the raw AST says `File A` imports `File B`, the reviewer marks that edge as certain. If it doesn't, the edge gets flagged.

Flagged edges aren't discarded — they're demoted. In the graph UI, hallucinated edges render as dashed lines with a warning tooltip.

On the last full run before writing this chapter: Phase 7 flagged 47 edges. 31 were false positives. 16 were genuine hallucinations. 11 were caught by the import cross-reference. 5 were caught by the layer consistency check. 1 slipped through as a dashed line.

47 hallucinations flagged. 16 confirmed. 1 slipped through. That's a 97% catch rate.

The goal isn't zero hallucinations. The goal is zero *silent* hallucinations. Trust comes from transparency, not perfection.

---

## Why Seven Phases

I didn't design seven phases from the start. The first prototype had three: scan, analyze, render. Each phase did too much. When something hallucinated, I couldn't tell which agent produced the bad output.

The seven-phase split emerged from debugging. Every time I couldn't isolate a bug, I'd split a phase. Seven phases is the result of chasing bugs until they stopped being ambiguous. It's not a magic number. It's the granularity at which every failure mode has a clear owner.

→ Next: Chapter 2 — tree-sitter in WASM: why we took the 3x performance hit
