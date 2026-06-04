---
type: blog
title: "No tests, no database, no regrets"
date: March 02, 2026
url: "/blog/mtc-ch8-no-tests-no-database-no-regrets"
description: This project has zero test infrastructure. No unit tests. No integration tests. The CONCERNS.md file lists this as the #1 risk. Here's why we made that call — and whether we'd do it again.
tags: ["memory-that-compounds", "trade-offs", "retrospective", "testing", "zod", "typescript", "architecture", "build-in-public"]
category: Engineering
---

Let me name the thing that most technical blog posts skip: this project has zero test infrastructure.

No unit tests. No integration tests. No end-to-end tests. The only quality gates are TypeScript strict mode and Zod runtime validation. The CONCERNS.md file lists this as the #1 risk, written in plain text: *"No tests — #1 risk."*

We knew it was a risk. We chose it anyway.

---

## The No-Tests Decision

The decision wasn't made in a meeting. It was made by the accumulation of small choices, each one rational in isolation:

**YC batch pressure.** Demo Day is fixed. A test suite doesn't ship a feature. Every hour spent writing tests is an hour not spent building something investors can see.

**Rapid prototyping.** The product direction changed every 2-3 weeks in the first two months. Tests written for the web app would have been obsolete when we pivoted to desktop. The knowledge graph schema changed four times. The IPC surface grew from 5 handlers to 50+. Tests written early would have been deleted, not maintained.

**The type system as a test harness.** TypeScript strict mode catches null references, undefined access, and type mismatches at compile time. Zod catches malformed data at runtime. Together, they eliminate entire categories of bugs that tests would catch — null pointer exceptions, schema violations, invalid states.

**Single-developer velocity.** With one person writing code, the communication cost of a bug is zero: the same person who introduced the bug fixes it. Tests become useful when someone else touches your code. We weren't there yet.

**The filesystem as the data layer.** A database needs migrations, connection pooling, and query testing. The filesystem needs `fs.writeFileSync`. If you're comparing two branches, you diff the files.

None of these justifications holds up for a production system serving paying customers. But we weren't there. We were building a tool for ourselves and a waitlist.

---

## What No Tests Cost

**Regressions in the IPC layer.** A refactor of the Gmail sync broke the inbox cache format. The renderer tried to parse the new cache format with the old schema. The error was caught by Zod validation at runtime — but the user saw a blank inbox for 30 seconds. A test for the cache format would have caught this.

**Silent errors in the event processor.** An event producer wrote events with a legacy field name. The migration function handled the known rename, but a second rename happened in the same deploy and the migration only covered one case. The event was processed with missing data. A test with the exact event format would have caught this.

**Onboarding friction for new contributors.** Every new engineer spent their first week discovering bugs by watching the logs. They found 5-10 bugs per person — race conditions in the live note runner, edge cases in the Gmail MIME parser, unhandled promise rejections in the MCP client. A test suite would have caught most of them before onboarding.

**Fear of refactoring.** The biggest cost was invisible: we avoided refactors that would have improved the code. The IPC handler map could have been split into domain-specific files. The shared schema module was 966 lines and growing. But refactoring without tests felt risky, so we left it. The code grew, the complexity accumulated, and the cost of change increased.

---

## What Zod Caught

Zod runtime validation caught more bugs than I expected. Every IPC channel validates both the request and response payloads. Every event in the event system validates against `RowboatEventSchema`. Every Gmail thread snapshot validates against a Zod schema before classification.

The validation is not optional. If the schema doesn't match, the operation fails with a structured error message. Malformed data is caught at the boundary, not deep in the code.

TypeScript strict mode catches null/undefined errors, unreachable code, and type mismatches. Combined with Zod, the system has a defense-in-depth layer that's caught more bugs than I can count — but only the bugs that violate type constraints or schema definitions. Logic errors, race conditions, and integration issues slip through.

---

## The Database That Isn't

The no-database decision gets more attention than the no-tests decision, but it's easier to defend.

The entire "database" is a Markdown vault in the user's workspace directory. Notes are files. Relationships are wikilinks. Metadata is YAML frontmatter. Version history is git.

The filesystem-as-database has real limitations:
- No query engine
- No transactions
- No full-text search (we had to build our own)
- No referential integrity

But it also has advantages that a database doesn't:
- Zero operations. No database to install, migrate, or back up.
- Human-readable. The entire data store is a folder of plain text files.
- Git-native. Every change is a diff.
- Portable. Copy the workspace folder to another machine. The app works.

For a local-first tool, the filesystem is the right data layer. The limitations are real constraints that shape the architecture — but they're constraints that a desktop app can live with.

---

## Would We Do It Again?

If I were starting today, I would still skip the test suite in the first 8 weeks. The YC timeline and the iteration rate make tests a drag on velocity, not a safety net.

But at week 8, when the product direction was stable and the architecture had settled, I should have started writing tests for the IPC layer and the event processor. Those are the two surfaces where bugs are expensive.

The refactoring fear was the signal I missed. When the IPC handler map felt too big to split, that was the moment tests would have paid for themselves.

The no-database decision I'd make again without hesitation. The filesystem is not a good database, but it's better at being the user's data than any database could be.

---

→ Bonus: Chapter B — You could build this too
