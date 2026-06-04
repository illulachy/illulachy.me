---
type: blog
title: "Effect TS, the framework nobody has heard of, and why we bet on it anyway"
date: February 10, 2026
url: "/blog/tn-ch1-effect-ts-framework-nobody-heard-of"
description: Every project has a decision that looks reckless at the time and obvious in hindsight. For us, that was committing to Effect TS at beta.15 — before the docs, before the ecosystem, before anyone knew it would work.
tags: ["the-terminal-native", "hg", "effect-ts", "typescript", "architecture", "build-in-public"]
category: Engineering
---

Every project has a decision that looks reckless at the time and obvious in hindsight.

For us, that was committing to Effect TS at beta.15 — before the documentation site had more than three pages, before there were tutorials, before the ecosystem existed. It was a bet on a paradigm, not a library.

The bet paid off. But there was a moment, about three weeks in, when I wasn't sure it would.

---

## The Problem That Needed a Different Tool

In Chapter 0, I said we had a prototype — the loop worked, we could send a message to an LLM and get a tool call back. What I didn't say is how that code looked.

It was a mess.

Global singletons for state. `Map<Directory, Session>` that never got cleaned up. Manual error handling with try/catch blocks that caught everything and handled nothing. Promise chains so deep they had their own weather. A file watcher that leaked because nobody remembered to close the handle.

This is the standard way to write a Node.js CLI tool. And it works — until you have multiple projects open, multiple concurrent sessions, file watchers that need lifecycle management, and an LLM that can request five parallel file reads at once.

The problem wasn't the code. The problem was the programming model. JavaScript's concurrency model doesn't give you scoped state, doesn't give you typed errors, doesn't give you structured cleanup. It gives you callbacks and hope.

I needed something that made it *impossible* to forget to clean up a subscription. That's when I found Effect.

---

## What Effect Actually Is

Effect TS is a TypeScript library for structured concurrency and dependency injection. Here's the web developer translation table:

| React concept | Effect equivalent |
|---|---|
| `useContext` | `Context.Tag` + `yield*` |
| `useMemo` | `Effect.cached` |
| `useEffect` cleanup | `Effect.acquireRelease` |
| Prop drilling | `Layer` composition |
| Context providers | `Layer.mergeAll` |
| Global store | `ScopedCache` |
| Error boundaries | Typed `Effect.Effect<A, E, R>` |

The last one is the most important. In Effect, every function returns a type that encodes its success value, its error type, and its dependencies. The compiler checks that you handle all three. If a function can fail with a `DatabaseError`, you can't ignore that. If a function needs a `Bus` service, the type system knows.

I had been writing TypeScript for years. I didn't know what I was missing until the compiler caught a missing error handler that would have crashed fifty user sessions.

---

## The Bet

When we started, Effect was at version 0.0.0-beta.15. The API was changing weekly. We had a choice:

- **Option A**: Roll our own DI system, use `async/await` for concurrency, manage state with singletons and `Map`s. This would ship faster. It would also accumulate technical debt from day one.
- **Option B**: Bet on Effect. Learn a paradigm that almost nobody in the TypeScript ecosystem was using. Accept that breaking changes would force rewrites of working code.

I chose B. The argument that convinced the team was simple: *"We're building a server that manages state across projects, sessions, and plugins. If we use manual state management, every leak is a production bug we won't know about until a user reports it. If we use Effect, leaks are compile-time errors."*

We committed. Then the breaking changes came.

---

## The Breaking Change That Almost Broke Us

Effect went through several major API revisions during our build. The first one hurt most: they changed how `Context` works. We had written ~2000 lines of service definitions using the old API. The new API was better — cleaner, more type-safe — but it meant every single service had to be rewritten.

For two days, the entire codebase was red squiggles.

We fixed them one by one. Every error the compiler caught. Every type mismatch was a test that the new API was more precise — because if the compiler caught it, it meant the old code was less safe than we thought.

That week, we wrote a script that patched the Effect source to backport a feature we needed before it shipped. The patch is still in the repo. It's a monument to how early we were.

Looking back, those breaking changes were the best thing that happened to the codebase. They forced us to understand Effect's model deeply. They forced us to keep our service boundaries clean — because if a service was too coupled, the migration was painful and we refactored it.

---

## What It Unlocked

Once Effect was the substrate, everything else became possible.

**InstanceState** — ~20 lines of code wrapping `ScopedCache<Directory, State>`. Every open project directory gets its own isolated state, its own config, its own cleanup. Two projects open? Two independent instances. One crashes? The other doesn't notice.

**The AppRuntime** — 50+ Effect services merged into a single `ManagedRuntime`. Every service knows its dependencies. The runtime wires them together at startup and tears them down in reverse order on shutdown. No singletons. No global state. No initialization order bugs.

**Typed errors everywhere** — When a provider's API key is invalid, that's typed. When a file doesn't exist, that's typed. When a PTY session disconnects, that's typed. Every failure mode is explicit in the type system.

**Safe concurrency** — The LLM wants to read five files at once. Effect's `Fiber` and `PubSub` handle the fan-out, the result collection, and the cleanup if any one of them fails. No dangling promises.

Without Effect, we would have built a working prototype and then spent six months fixing the bugs that structured concurrency prevents.

---

## The Cost

Effect's learning curve is real. New contributors struggle. The error messages, while precise, are verbose — a type error involving a `Layer` composition can produce a 50-line message where the relevant information is in line 47.

The ecosystem is still small. When we needed a rate limiter, we wrote it ourselves. When we needed an HTTP client, we wrapped one.

And Effect's API is still evolving. The codebase has migration comments scattered through it — `// TODO: update to new Effect.X when it ships` — marking the places where we know a better API exists but we haven't paid the migration cost yet.

But every one of those costs is a one-time payment. The learning curve flattens. The missing libraries get built. The API stabilizes. Meanwhile, the benefits pay out every single day.

---

## What Came Next

Effect gave us the foundation: scoped services, safe concurrency, typed errors. We had a programming model that could hold the weight of what we were building.

Now we needed to talk to an LLM. And not just one LLM — any of them. Because the second big bet we made was that coupling to a single provider was an architectural dead end.

That's Chapter 2.

---

→ Next: Chapter 2 — 20 providers, one interface, 1500 lines of abstraction
