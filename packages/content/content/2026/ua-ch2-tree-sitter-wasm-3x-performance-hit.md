---
type: blog
title: "tree-sitter in WASM: why we took the 3x performance hit"
date: May 18, 2026
url: "/blog/ua-ch2-tree-sitter-wasm-3x-performance-hit"
description: Native tree-sitter is 3x faster. It also fails on Apple Silicon + Node 24, Linux arm64, and Windows. Here's why we chose WASM and what we built to mitigate the cost.
tags: ["understand-anything", "tree-sitter", "wasm", "static-analysis", "performance", "cross-platform", "build-in-public"]
category: Engineering
---

The first time I ran the parser on a 50,000-line Go file, the CLI hung for four seconds and then returned nothing.

I'd forgotten to call `tree.delete()`. The WASM runtime was holding a 70MB tree in memory, the next parse blocked, and the pipeline silently deadlocked.

I fixed the memory leak. The four-second parse time stayed. That's the ceiling of tree-sitter in WASM on a large file. It's slow, single-threaded, and limited by the browser runtime. And I'd choose it again every time.

---

## The Right Tool, Wrong Runtime

tree-sitter is the best thing that's happened to code analysis in years. It's a parser generator that produces fast, error-tolerant ASTs for dozens of languages. Unlike regular expressions, it understands grammar. Unlike full compilers, it's embeddable and recovers gracefully from syntax errors.

It's written in C. The native bindings are fast — really fast. On a modern machine, tree-sitter can parse a 5,000-line TypeScript file in about 30 milliseconds. That's the baseline we assumed we'd get.

The native bindings have one problem: they're native.

`node-tree-sitter` ships a `.node` binary per platform. Linux x64, macOS x64, macOS arm64, Windows x64 — each needs its own prebuilt binary. If your platform isn't in the prebuilt set, you're compiling from source. Compiling from source requires `node-gyp`, which requires Python, a C compiler, and build tools that no developer has installed until the moment they're missing.

On Apple Silicon Macs with Node 24, the native bindings don't work at all. The prebuilt binaries are compiled for x64, Rosetta translation produces cryptic segfaults, and compiling from source fails because the build chain assumptions don't match Apple's current toolchain.

This isn't a hypothetical. The project's CLAUDE.md documents it: *"Uses web-tree-sitter (WASM) instead of native tree-sitter — native bindings fail on darwin/arm64 + Node 24."*

---

## The First Attempt: Native Bindings

I started with native `tree-sitter`. It worked on my machine. MacBook Pro, Intel, Node 20.

The first issue report came in six hours later. A user on an M3 MacBook Pro with Node 22 got an error: `Error: Module did not self-register`. The second issue was a user on Linux arm64 (a Raspberry Pi running a CI server). No prebuilt binary for that platform. The third was Windows.

In two weeks, I had seven open issues that were all variations of "your tool won't install" — and none of them were about the tool itself. I was spending more time debugging platform compatibility than building features.

That's the moment I realized: a tool that analyzes codebases needs to install trivially on every platform. If the first interaction is a compile error, there is no second interaction.

---

## WASM: Slower, Everywhere

`web-tree-sitter` is the same parser compiled to WebAssembly. It runs in a WASM runtime — Node.js, the browser, Deno, Bun — anywhere that supports the WebAssembly standard. One binary, every platform.

The trade-off is speed.

WASM tree-sitter is about 3x slower than native. A 30ms native parse becomes 90ms in WASM. There's no threading in WASM. Web Workers help for parallelism but not for a single large parse — the WASM runtime itself is single-threaded by design.

The project loads all 10 language grammars eagerly — TypeScript, JavaScript, Python, Go, Rust, Java, Ruby, PHP, C++, C# — about 12MB of WASM total. Every grammar is loaded into memory at startup, even if the codebase only uses two. That's startup time traded for predictability.

This is objectively worse than native on performance metrics. Every benchmark confirms it. And I still wouldn't go back.

---

## What the Performance Cost Buys

The WASM binary is the same on every machine. The same bytes, the same behavior, the same bugs.

When a user reports a parsing error, I can reproduce it without asking what platform they're on. The WASM grammar is deterministic. The same source file produces the same AST regardless of OS, CPU architecture, or Node.js version. Debugging a native bindings issue requires asking for system details, reproducing platform-specific builds, and frequently saying "I can't reproduce this."

WASM eliminates that class of bug entirely. Not reduces — eliminates.

The zero-install property is also real. `npm install` downloads the WASM files as precompiled artifacts. No `node-gyp`. No Python. No C compiler. It just works. The user's first interaction with the tool is using it, not debugging its installation.

---

## The Escape Hatches

WASM is slow. We accepted that. But we built two escape hatches for the worst cases.

**First: tiered analysis.** The batch phase groups files into trivial, standard, and critical tiers. Trivial files — configs, tests, generated code — skip tree-sitter entirely. They get a lightweight regex scan that's fast enough. tree-sitter only runs on standard and critical files. In a typical project, that's about 60% of files. The other 40% never touch WASM.

**Second: structural fingerprints baseline.** A structural fingerprint is a hash of a file's parsed AST subtrees. If the file hasn't changed between commits, the fingerprint stays the same, and we skip re-parsing entirely. The first full parse pays the WASM cost. Every subsequent incremental run pays zero — just a hash comparison.

This turns the 3x slowdown from a constant tax into a one-time cost. You pay it once per file, when the file changes. Between changes, you get incremental updates with WASM-parsed data in the cache.

That design — fingerprints, tiering, incremental bypass — exists because WASM forced us to think about performance from the start. If we'd used native bindings, we might never have designed the caching layer. The constraint made the architecture better.

---

## The WASM + Agent Pipeline

tree-sitter produces the ground truth — actual import statements, actual function declarations, actual class hierarchies. The `file-analyzer` agents read that ground truth and enrich it with meaning — purpose summaries, architectural role, confidence scores.

The two systems have different failure modes. tree-sitter fails by omission (it doesn't parse dynamic imports). The LLM fails by commission (it hallucinates relationships). Together, they compensate for each other. The LLM can infer the dynamic import that tree-sitter missed. tree-sitter provides the cross-reference that catches hallucinated imports.

This division of labor is the architecture's strongest property. The parser handles certainty. The agent handles ambiguity. Neither replaces the other.

---

The performance gap is real. The caching layer will narrow it. The tiered analysis avoids it for most files. But the gap will never fully close — WASM has overhead that native doesn't.

I made that trade intentionally. The tool's value is understanding codebases, not parsing them fast. A parser that works everywhere, even at 3x slower, is better than a parser that's fast where it works and broken where it doesn't.

→ Next: Chapter 3 — 21 node types, 35 edge types, and the schema that holds them together
