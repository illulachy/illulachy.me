---
type: blog
title: "What I'd ship differently"
date: April 07, 2026
url: "/blog/tn-ch9-what-id-ship-differently"
description: I've spent eight chapters explaining what we built and why. This chapter is about what I'd burn down. The honest story of a project isn't the series of correct decisions — it's the ones that were correct enough to let you keep building.
tags: ["the-terminal-native", "hg", "retrospective", "lessons", "yagni", "build-in-public"]
category: Engineering
---

I've spent eight chapters explaining what we built and why. This chapter is about what I'd burn down.

Every architecture has decisions that looked right at the time and revealed themselves differently later. The honest story of a project isn't the series of correct decisions — it's the series of decisions that were correct *enough* to let you keep building.

This is my list.

---

## What I Overengineered: Event Sourcing Before Users

I committed to event sourcing before we had 100 users.

The event store was correct in theory. In practice, it added weeks of development before we had a working product. Every state change needed to be modeled as an event type. Every event needed a projector. Every projector needed tests. The infrastructure was solid — and entirely unnecessary at that stage.

For the first 100 users, SQLite snapshots would have worked perfectly. Session data is small. Crash recovery isn't critical. The undo feature could have been a simpler mechanism — store a checkpoint every N turns, restore from checkpoint on revert.

The cost wasn't just development time. It was cognitive overhead for every new contributor: "Add a new feature? First, define your event types. Then write a projector. Then add a migration." Simple features required event-sourcing ceremony.

**The lesson:** Build the simplest thing that works. Events are an optimization, not a foundation. Add them when the snapshots hurt, not before.

---

## What I Underengineered: Error Messages

Effect TS has a type system for errors. Every function encodes its failure modes. The compiler catches unhandled errors.

The compiler doesn't help you write good error messages.

We shipped with errors like:

```
SessionError: session not found
ConfigError: invalid configuration
ToolError: tool execution failed
```

Each of these is correct. Each of these is useless. The user with "session not found" doesn't know why the session wasn't found, what session ID was queried, or what to do next.

Effect's typed errors are precise at compile time and opaque at runtime. The type tells you `ConfigError` was thrown. The message tells you nothing.

We've been retrofitting better error messages for months. Each one requires: understanding the failure context, writing a message that includes the relevant values, and testing that the message is actionable.

**The lesson:** Error messages are UX, not metadata. The type system can tell you *what* failed. Your job is to tell the user *what to do about it*.

---

## The Monorepo Question

We have 13+ packages in a Bun workspace. Some are clear boundaries: the TUI package, the shared UI components, the SDK, the plugin types. Others are artifacts of "this might be useful on its own someday."

The monorepo gives us shared dependency management, consistent tooling, and parallel builds.

It also gives us: dependency confusion (which package should this live in?), build overhead, and versioning complexity.

If I started today, I'd start with fewer packages. Maybe 3, not 13. The tight coupling in the early stages doesn't need the boundary enforcement. The boundaries emerge as the product matures. Let the architecture lag the product.

---

## The Maturity Gap

Effect TS was at beta.15 when we adopted it. @opentui didn't exist — we built it. The Vercel AI SDK was pre-1.0. bun-pty was experimental. We were building on foundations that were still settling.

The cost was: breaking changes that forced rewrites, missing features we had to build ourselves, documentation that didn't exist, and bugs that were our problem because there was no upstream to report to.

The benefit was: an architecture that wouldn't have been possible with the stable alternatives.

I'd make the same bet again. But I'd acknowledge the risk more explicitly to the team. "We're building on v0 libraries. They will change. We will have to rewrite things. That's the price of using technology that exists at the frontier."

---

## The Thing I Got Right on the First Try

InstanceState.

```typescript
const instances = ScopedCache<Directory, InstanceContext>()

function getInstance(dir: Directory) {
  return instances.get(dir, () => createInstanceContext(dir))
}
```

Every open project directory gets its own isolated state, its own config, its own plugin hooks, its own PTY sessions, its own file watchers, its own cleanup. Close a project? The cache entry is disposed. All resources are released. No leaks. No cleanup to remember.

This pattern shipped in the first month and hasn't changed. It's the foundation for: multi-project support, safe restart, resource isolation, and parallel work.

I got this right because I approached it from the wrong direction. I wasn't trying to design a state management system. I was trying to prevent memory leaks. The solution emerged from the constraint.

---

## If I Started Today

The ecosystem is different in 2026 than it was in 2024.

Effect TS is approaching stability. @opentui is extracted and open source. MCP has broader adoption. ACP is gaining editor support.

The one thing I'd do differently: I'd ship a usable product *before* architecting for scale. The first version would be simpler — fewer abstractions, more direct code. I'd refactor toward the architecture as the product proved itself, not ahead of it.

Because the best architecture advice I can give is also the simplest: you can't overarchitect your way to product-market fit. You can only ship your way there.

---

## What Came Next

Nine chapters. From terminal.shop to a shipping AI coding agent with 20+ providers, a reactive TUI, real PTY sessions, event-sourced persistence, and protocol-driven extensibility.

There's one more episode. It's not about me or the team. It's about you.

---

→ Next: Bonus — You could build this too
