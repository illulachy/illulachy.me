---
type: blog
title: "The .understandignore file and the art of knowing what to skip"
date: June 22, 2026
url: "/blog/ua-ch7-understandignore-art-of-knowing-what-to-skip"
description: A generated protobuf file — 12,000 lines of Go structs — was consuming four seconds of parse time and producing exactly zero useful graph nodes. This is how we built the ignore system that fixed it.
tags: ["understand-anything", "knowledge-graph", "ignore", "configuration", "ux", "build-in-public"]
category: Engineering
---

A generated protobuf file — 12,000 lines of Go structs, automatically emitted by the protocol buffer compiler — was consuming four seconds of WASM parse time and producing exactly zero useful graph nodes.

The structs had no functions, no methods, no imports, no dependencies. They were data containers. They serialized and deserialized. They were essential to the running application and entirely irrelevant to understanding its architecture.

But the pipeline didn't know that. It saw a `.go` file and parsed it. tree-sitter spent four seconds. The file-analyzer agent spent 500 tokens summarizing it as "protobuf-generated data structures for API messages." The assembler created a node for it. The architect assigned it to a layer. The reviewer audited it.

Every phase touched it. Every phase got nothing useful from it.

That's the problem that `.understandignore` solves: not "what's in the project," but "what should the analysis care about?"

---

## The .gitignore Fallacy

My first instinct was to use `.gitignore` as the analysis filter. If a file isn't tracked by git, why analyze it?

This breaks on a simple observation: many files that are tracked by git are terrible candidates for analysis.

Generated code is the clearest example. Protobuf, OpenAPI clients, GraphQL codegen, database migration files — these are checked into version control because the build system expects them, or because the team wants reproducible builds without running the generation step. They're essential to the project. They're noise in a knowledge graph.

Lock files are another case. `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` are committed in most projects. They're large, structured, deterministic, and analysis-proof. A tree-sitter parse of `package-lock.json` produces no functions, no classes, no imports.

Binary files crash the parser. PNG, JPG, SVG, fonts, PDFs, archives — tree-sitter doesn't handle these, but the scanner doesn't know that until it tries.

The `.gitignore` filters all of none of these.

---

## The 69 Defaults

The ignore filter ships with 69 hardcoded patterns. They're the accumulated knowledge of what's safe to skip.

**Dependency directories.** `node_modules/`, `vendor/`, `venv/`, `.venv/`, `__pycache__/`. These are never analyzed. The scanner's fallback walker has these hardcoded as do-not-descend directories, skipping the entire tree without enumerating it.

**Build output.** `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.cache/`, `.turbo/`, `target/`, `obj/`. Every language ecosystem has its own build output directory. Analyzing them is like analyzing the compiled binary instead of the source.

**Lock files.** `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`. Every dependency manager produces them. Every one is completely uninteresting to architectural analysis.

**Binary and asset files.** Seventeen extension patterns covering images, fonts, audio, video, PDFs, and archives.

**Generated code markers.** `*.min.js`, `*.min.css`, `*.map`, `*.generated.*`. These file-naming conventions reliably indicate machine-produced code.

The defaults are conservative. They exclude only files that are definitively uninteresting — dependency trees, build artifacts, binaries. Everything else passes through to the user's judgment.

---

## What's NOT in the Defaults

Some deliberate omissions are more interesting than the inclusions.

`migrations/` is not in the defaults. Database migrations are auto-generated in name only — they contain hand-written schema changes that reveal data model evolution. Excluding them would hide one of the most informative artifact types in the graph.

Protobuf files (`.proto`) are not in the defaults. The protobuf IDL itself — the schema definitions, the message structures, the service interfaces — is a legitimate architectural artifact. The *generated Go code* from those protos is what should be excluded. The tool treats `.proto` files as analyzable schemas and the generated `*.pb.go` files as built artifacts.

Test directories — `__tests__/`, `test/`, `tests/`, `fixtures/`, `testdata/` — are not in the defaults. They're *suggested* by the starter file generator (commented out), but the decision is left to the user. Some teams want test files in the graph. Some don't.

---

## The Starter File

When the pipeline runs for the first time on a new project, Phase 0.5 checks for a `.understandignore` file. If none exists, it generates one in `.understand-anything/.understandignore`.

The generator reads the project's `.gitignore`, filters out patterns already covered by the 69 defaults, and writes each remaining pattern as a commented-out suggestion. Then it checks for 10 common directories — `__tests__/`, `test/`, `tests/`, `fixtures/`, `testdata/`, `docs/`, `examples/`, `scripts/`, `migrations/`, `.storybook/` — and writes each detected one as a commented-out pattern.

Every line is commented out. The user must explicitly uncomment patterns to activate them. This is intentional: the default behavior is to analyze everything that isn't a build artifact. The user opts out, not in.

The pipeline pauses after generating the file and waits for the user to confirm. This pause was nearly cut during the 1.0 release.

The argument for removing it: the pipeline should be fully automatic. No user interaction, no prompts, no pauses.

The argument for keeping it: the first analysis is the most important one. If the graph includes 500 irrelevant nodes because `generated/` wasn't excluded, the user's first impression is "this tool doesn't understand my project."

The pause stayed. In the beta period, projects where the user reviewed the ignore file had 40% higher satisfaction scores on the first analysis. The one-time configuration cost was more than offset by the quality improvement.

---

## The Three-Layer Filter

The ignore filter loads in three layers. Later patterns override earlier ones via the `!` negation syntax.

**Layer 1: Hardcoded defaults.** The 69 patterns. Always active, never discussed. Invisible to the user.

**Layer 2: `.understand-anything/.understandignore`.** Project-specific overrides stored in the tool's data directory. This is the primary user configuration point.

**Layer 3: `.understandignore` at project root.** Visible to everyone who browses the repo, useful for team-wide ignore policies. Optional.

A `!` negation in Layer 3 can re-include a file that Layer 1 excluded. If a team has a legitimate source file inside `dist/`, they can add `!dist/legitimate-source.ts` and the scanner will pick it up.

---

## The Dual-Filter Accounting

When the scanner enumerates files, it runs two ignore filters simultaneously: one with the full combined configuration (defaults + user patterns) and one with defaults only.

Every file is checked against both. If the full filter excludes a file but the defaults-only filter includes it, that file counts as `filteredByIgnore` — a user-driven exclusion. If both filters exclude it, it's a baseline default exclusion and isn't counted.

This dual accounting answers the question "how many files did the user's configuration actually skip?" The answer is reported as `filteredByIgnore=N` in the scanner output. Early users didn't know if their `.understandignore` was doing anything. The counter made the effect transparent.

---

## What Gets Through

When the filter is configured well, the scanner produces a clean manifest: source code, configuration files, documentation, schema definitions, migration files, test files (if opted in). Everything that reveals intent. Nothing that obstructs it.

The distinction between "build artifact" and "source of truth" is the most important classification the ignore filter makes. A `.proto` file is a source of truth — it defines the API contract. The generated `.pb.go` file is a build artifact — it implements the contract mechanically. Both are valid Go files. Only one belongs in the graph.

The tool can't make this distinction automatically. The ignore filter's job is to provide the mechanism for exclusion without imposing a specific policy.

The defaults handle 90% of cases. The `.understandignore` file handles the remaining 10%. The user's judgment handles the edge cases that neither the defaults nor the templates anticipated.

---

Sixty-nine hardcoded patterns. Three configuration layers. One ignored file. A pause that almost didn't exist. All of it exists so the pipeline analyzes the right things and ignores the wrong ones.

The scanner finds files. The filter excludes the wrong ones. Tree-sitter parses the right ones. The LLM agents analyze them. The assembler builds the graph. The architect labels the layers. The tour builder guides the walk. The reviewer catches hallucinations. The dashboard renders it all. The fingerprints make it fast. The manifest makes it cross-platform.

The entire system is about taking a codebase — any codebase, any language, any size — and producing a map that a developer can navigate.

Your codebase could look like this too.
