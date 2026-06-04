---
type: blog
title: "21 node types, 35 edge types, and the schema that holds them together"
date: May 25, 2026
url: "/blog/ua-ch3-21-node-types-35-edge-types"
description: I added `concept` as a node type because the LLM kept inventing files that didn't exist. Every one of the 21 node types has a story like this — born from a specific failure.
tags: ["understand-anything", "knowledge-graph", "schema", "taxonomy", "validation", "build-in-public"]
category: Engineering
---

I added `concept` as a node type because the LLM kept inventing files that didn't exist.

It would see a function named `calculateRevenue` and, instead of creating a `function` node like it was supposed to, it would create a `file` node for `src/revenue/calculator.ts` — a file that didn't exist and had never existed. The function was defined inline in a service module. There was no revenue calculator file.

The LLM was trying to put things where they *should* be, not where they *are*. That's a feature of human cognition — pattern completion, gap filling — but it's a bug in a graph that claims to represent actual code.

I needed a node type for "this is not a file, it's an idea" — a placeholder for the concept the LLM detected, without pretending it was real code. That's why `concept` exists.

Every node type has a story like this. Twenty-one of them, each born from a specific failure.

---

## Where the Schema Lives

The entire schema is defined twice — once as TypeScript types, once as Zod runtime schemas. They mirror each other manually. The TypeScript types tell you at compile time if you're referencing a field that doesn't exist. The Zod schemas strip out any malformed nodes at runtime before they reach the dashboard.

The top-level shape is seven fields:

```typescript
interface KnowledgeGraph {
  version: string;
  project: ProjectMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Layer[];
  tour: TourStep[];
}
```

The raw graph of files and dependencies is ground truth. The layers are interpretations. They should be stored distinctly so they can be disagreed with independently.

---

## The Four Groups

Twenty-one node types split into four groups. Each group represents a different kind of analysis with its own failure mode.

**Code types** — `file`, `function`, `class`, `module`, `concept`

These come from the static analysis pipeline: tree-sitter parses the file, extracts functions, classes, and imports, and the assembler builds the dependency graph. `concept` is the outlier — it comes from the LLM, not the parser. It represents an abstraction that exists in the code's intent but not as a file.

**Failure mode**: tree-sitter misses dynamic imports. `concept` nodes compensate by naming what the static analysis can't see.

---

**Non-code types** — `config`, `document`, `service`, `table`, `endpoint`, `pipeline`, `schema`, `resource`

These cover everything that isn't a programming language. Docker Compose files, SQL migrations, GraphQL schemas, Terraform configs, CI pipelines, Markdown docs. Each type maps to a specific parser in our non-code analysis pipeline — lightweight, regex-based, zero WASM.

The mapping from file type to node type is many-to-one: a `.yml` file could be a Docker Compose service definition (`service`), a CI pipeline (`pipeline`), or an application config (`config`). The non-code parser disambiguates by checking the file's content structure.

**Failure mode**: A file gets misclassified. A YAML file with both `services:` and `jobs:` keys gets the first matching parser.

---

**Domain types** — `domain`, `flow`, `step`

These are the LLM's architectural interpretation of the codebase. `domain` represents a bounded context (payment processing, user management). `flow` represents a cross-cutting process (checkout flow, onboarding flow). `step` represents a single action within a flow.

**Failure mode**: The LLM imposes structure that isn't there. It sees two files that import a shared utility and declares them part of the same domain. Domain types are the most subjective category in the schema, and the hardest to verify. The review phase flags domain edges with extra scrutiny.

---

**Knowledge types** — `article`, `entity`, `topic`, `claim`, `source`

These were added later, when we realized that codebases contain documentation, wikis, and knowledge artifacts that aren't code but are essential to understanding the system. They connect code to intention: "this function implements the decision described in this ADR" is an edge that spans the gap between code and the reasoning behind it.

**Failure mode**: Knowledge types tend to proliferate. Every noun in a README becomes an entity. We introduced a significance threshold — a file must have at least three meaningful connections to existing code nodes before it creates knowledge nodes.

---

## The Node Itself

Every node, regardless of type, has the same core structure:

```typescript
interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
}
```

The `id` follows a strict convention: a colon-separated prefix of type and path. `file:src/index.ts`, `function:src/utils.ts:formatDate`, `module:auth`, `concept:caching`, `domain:payment-processing`.

`complexity` is a three-tier classification that guides the dashboard's visual treatment and the tour builder — complex nodes are more likely to appear in guided walks.

---

## Edges and the Weight System

Thirty-five edge types in nine categories. Structural edges (imports, contains, inherits) come from tree-sitter's AST analysis and get weights of 0.7 to 1.0. Data flow edges (reads from, writes to, transforms) come from LLM inference and get 0.5 to 0.6.

The weight is the system's confidence in the relationship. A `contains` edge between a file and its function gets 1.0 — certainty, the AST proved it. A `related` edge between two modules that share imports gets 0.5 — inference, the semantic similarity check suggested it.

Edge type aliases map the LLM's vocabulary to canonical types. When the architect agent writes `uses` or `requires`, the schema normalizes it to `depends_on`. There are 75+ aliases in the map, each one a case of the LLM using a slightly different word for the same relationship. The alias map grows with every release. A new LLM model ships with a different vocabulary, writes edges we've never seen before, and the alias map expands to accommodate it.

---

## The Four-Tier Validation Pipeline

Every graph passes through four tiers of validation before it reaches the dashboard.

**Tier 1 — Sanitize.** Null values become undefined. Enum values are lowercased. Null collections become empty arrays.

**Tier 2 — Normalize aliases.** The alias maps run over every node type and edge type. `func` becomes `function`. `uses` becomes `depends_on`. If a value doesn't match any canonical type or alias, it stays as-is and gets flagged for the review phase.

**Tier 3 — Validate and drop.** The Zod schema parses every node and edge. Any that fail validation are dropped and logged. A file node without a `filePath` is dropped. The dropped items are counted and surfaced to the user as a warning.

**Tier 4 — Fatal checks.** If the input is not an object, if the collections are malformed, if zero valid nodes remain after Tier 3, the pipeline aborts with a fatal error.

The cascade is designed to be permissive at the bottom and strict at the top. A graph with 195 valid nodes and 5 dropped ones is useful. A graph with zero nodes is not.

---

## Why 21 Types

Twenty-one node types is too many. It makes the schema harder to learn, the documentation harder to write, and the dashboard harder to design.

It's also exactly the right number.

Every type exists because a specific failure required it. `concept` because the LLM invented files. `step` because flows needed substructure. `claim` because ADRs contain decisions that code references. The types are not an attempt to model every possible codebase artifact — they're an accretion of specific problems the pipeline encountered and solved.

If I designed the schema from scratch, I'd probably choose 8 or 9 types. But I didn't design it from scratch. It grew from the codebase, from parsing failures, from hallucination patterns, from user requests.

The next type will be added when something new breaks.

→ Next: Chapter 4 — The 3,200-node graph that rendered in 200ms and was completely useless
