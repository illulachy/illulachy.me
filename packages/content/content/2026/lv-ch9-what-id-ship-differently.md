---
type: blog
title: "What I'd ship differently"
date: June 08, 2026
url: "/blog/lv-ch9-what-id-ship-differently"
description: Two years of weekends. One side project that hit #1 on HN. Here's the honest accounting of what worked, what didn't, and what I'd tell someone starting a local-first app today.
tags: ["the-local-first-accountant", "liquidview", "retrospective", "local-first", "lessons", "build-in-public"]
category: Engineering
---

This series covered 9 architectural decisions across 2 years of building LiquidView. The adapter pattern, the provider chain, the addon system, E2EE sync, the FIRE calculator, the AI assistant, the write actor, the spending module — each one was a response to a real problem that emerged from real users.

Some of them were right. Some of them I'd do differently.

This is the honest accounting. What worked, what didn't, and what I'd tell someone starting a local-first app today.

---

## What Worked

### The adapter pattern (Chapter 1)

The single best architectural decision I made. One codebase, two runtimes, shared business logic. When the web version launched, it had feature parity on day one because every service already existed in `crates/core/`. The Axum server was ~1000 lines of routing atop 15,000 lines of shared code.

If I started over tomorrow, I'd still build the core as a library first and add the runtimes later.

### The provider chain (Chapter 2)

The most expensive architecture to build, and the most valuable. The chain-of-responsibility pattern for market data means the system has no single point of failure.

The key insight I'd keep: **the abstraction is the product.** Users don't care which provider served the price. They care that the price is accurate and available. Building the abstraction around that user need, not around the technical implementation, made the system resilient by design.

### The write actor (Chapter 7)

~50 lines of Rust that eliminated an entire category of bugs. Before the actor, every write path had retry logic for `SQLITE_BUSY`. After the actor, writes are serialized by design. It's the kind of pattern that's invisible when it works and obvious when it doesn't. It works.

---

## What I'd Change

### E2EE before market data

I built the market data provider chain before the sync engine. This was a mistake. Market data is a convenience — you can enter prices manually. Sync is a requirement — if you use the app on two machines, you need your data on both.

The E2EE sync engine is also the harder problem. Building it first would have surfaced the cryptographic design questions earlier and forced a cleaner data model from the start.

### The addon SDK before the addon store

I published the addon SDK before building the in-app store. The SDK is good. The store is fine. I should have built them together.

The problem with launching the SDK first was that every addon developer had to figure out distribution themselves. SDK adoption was slower than it could have been because I shipped the tools without the marketplace.

If I shipped it again, I'd launch SDK + store in the same release. A list of addons with source code links and a one-click install button is enough. It just needs to exist so developers know their work will be discoverable.

### Spending as a core feature, not a module

I'm still proud of the additive architecture. But in practice, most users want spending tracking, and the module boundary creates friction I didn't anticipate.

Cross-module queries — "show my portfolio performance and my spending trends on the same dashboard" — require coordination between schemas. The feature flag in Cargo.toml adds build complexity for marginal benefit.

If I did it over, I'd add spending to the core schema but keep the UI routes separate. The database is already the integration point — fighting that by separating schemas was over-engineering.

---

## The Numbers

Two years of weekends. One side project that hit #1 on HN. Here's the scorecard:

| Metric | Value |
|---|---|
| Rust crates | 7 |
| Tauri IPC commands | ~200 |
| Market data providers | 8 |
| Addons in the store | 3 (community-built) |
| GitHub stars | 10,000+ |
| Revenue | $0 (AGPL, free, no cloud) |
| Lines of E2EE crypto | ~370 |
| Lines of write actor | ~50 |
| Lines of Monte Carlo simulation | ~400 |

The revenue number is deliberate. LiquidView doesn't sell anything. There's no cloud tier, no premium features, no donation button. The AGPL license means anyone can use it, modify it, redistribute it.

This was never a business. It was a thing I built because I wanted it to exist.

---

## What the Addon Ecosystem Taught Me

The three community addons — Goal Progress Tracker, Investment Fees Tracker, Swingfolio — taught me more about software design than any single feature I built.

**Addon developers use your code in ways you never imagined.** The Goal Progress Tracker uses the portfolio service to pull holding values into a goal visualization. I never considered that use case.

**Permission scanning is table stakes for third-party code.** I built the permission scanner because I was paranoid about security. It turned out to be the feature that addon developers and users both cite as the reason they trust the system.

**A platform is just an app with a good extension API.** I didn't set out to build a platform. I set out to build a finance tracker. The platform emerged because I made the core architecture clean enough that other people could build on top of it.

---

## Advice for a Local-First App

If you're starting a local-first app today:

**1. SQLite is the right choice.** One file, no server, no configuration. It handles more data than you think and it's faster than you expect. The write actor pattern makes concurrency manageable.

**2. Build the core as a library first.** Separate your business logic from your platform code. A clean boundary between `crates/core` and the runtime means you can add targets (desktop, web, mobile, CLI) without rewriting anything.

**3. E2EE from day one.** Adding encryption after users have data is exponentially harder than designing for it from the start. The key exchange protocol, the sync engine, the outbox table — these are easier to build before you have users than after.

**4. Ship the thing.** The first version of LiquidView had three features and a React table. It was ugly, slow, and I was embarrassed to show it. I posted it to HN anyway. If I'd waited until it was "ready," it would never have shipped.

---

I built LiquidView because I wanted a finance app that respected my data. I didn't expect anyone else to use it. The HN launch, the 10,000+ stars, the community addon developers — that was all accidental.

What I learned is that the local-first approach resonates beyond my own preferences. People want to own their data. They want apps that work without subscriptions. They want software that respects their privacy not as a marketing feature but as an architectural principle.

Build the thing that respects the user. Everything else follows.

---

*This is the final chapter of The Local-First Accountant. LiquidView is open source and available on GitHub.*
