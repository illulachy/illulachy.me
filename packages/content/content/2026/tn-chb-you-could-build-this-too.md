---
type: blog
title: "You could build this too"
date: April 14, 2026
url: "/blog/tn-chb-you-could-build-this-too"
description: This series is not a tutorial. It's a story. But I also want to end with a concrete invitation — because the most useful thing I can give you is permission to build something outside your comfort zone.
tags: ["the-terminal-native", "hg", "call-to-action", "open-source", "build-in-public"]
category: Engineering
---

This series is not a tutorial. It's a story.

If you want a tutorial, there are better resources: the hg source code, Effect TS documentation, the @opentui repository, the Vercel AI SDK docs. Those will teach you *how*. This series was meant to teach you *why*.

But I also want to end with a concrete invitation. Because the most useful thing I can give you is not an architecture diagram. It's permission.

Permission to build something outside your comfort zone. Permission to choose the terminal over the browser. Permission to bet on a framework nobody's heard of. Permission to ship something that works before it's beautiful.

---

## You Don't Need Effect

You need *something* for scoped state and typed dependencies. Effect TS is the best answer I've found. But it's not the only answer.

The minimum viable architecture for an agentic tool is three things:

1. **Scoped state** — State belongs to a context (a project, a session, a user). State leaks when contexts overlap. Pick any mechanism that prevents that.
2. **An event bus** — Components need to talk without knowing each other's types. A typed PubSub is worth building early, even if you only have two subscribers.
3. **A provider loop** — User input → LLM → tools → results → LLM. That loop is the product. Everything else is scaffolding.

Build those three things. Then add everything else when the need is proven.

---

## Start With One Shell Command

Don't build a TUI first. Don't build a plugin system. Don't build an event store. Build one thing: a script that takes a user message, sends it to an LLM, and executes a shell command.

```typescript
// The minimum viable coding agent
async function agent(userMessage: string) {
  const response = await llm.chat([
    { role: "system", content: "You are a coding agent. You can run shell commands." },
    { role: "user", content: userMessage },
  ])

  if (response.toolCall?.name === "bash") {
    const result = await exec(response.toolCall.args.command)
    console.log(result.stdout)
  }
}
```

This is 20 lines. It works. It doesn't have a TUI, a project system, or persistence. But it has the loop. And the loop is everything.

From here, you add: `read` (because the LLM needs file contents), `write` (because the LLM needs to create files), `edit` (because rewriting entire files is wasteful), streaming, and error handling.

Each addition is a small, testable feature. None requires a framework.

---

## The Framework Trap

If you're choosing React for your AI coding tool, you're choosing the browser. Not because React can't run in the terminal — Ink exists — but because React's rendering model was designed for the browser's constraints.

The terminal has different constraints. No layout engine. No click events. No GPU compositing. A rendering model designed for browser constraints is the wrong starting point for terminal constraints.

SolidJS worked for us because its rendering model — reactive signals, direct mutations, no virtual DOM — maps to the terminal's rendering model. @opentui works because it started from terminal primitives and built up.

If you build a terminal tool, start with terminal primitives. They're simpler than you think.

---

## Where to Go From Here

**Go deeper into terminal rendering.** Explore `@opentui/solid`, read the framebuffer implementation. The terminal is an underrated platform. There's room for more tools, more frameworks, more innovation.

**Go deeper into LLM internals.** Explore the Vercel AI SDK, build a custom provider, experiment with different prompt formats for tool calling. The best patterns for tool-using agents are still being discovered.

**Go deeper into Effect TS.** Explore the source code, understand `Scope` and `Fiber`, build something with `ScopedCache`. It's worth understanding even if you don't adopt it.

**Go deeper into protocols.** Set up an MCP server, connect it to hg, write custom tools. Build an LSP client from scratch. Protocols teach you more about system design than any framework.

All three paths lead to the same place: an understanding that the tools you use are not magic. They were built by people who started where you are now.

---

## The Closure

I wrote this series because ten years ago, someone told me I could build something I thought was out of reach. I didn't believe them. But I tried anyway. And it worked.

This is that sentence, pointed at you.

The terminal is not a legacy interface. It's not a constraint you work around. It's a platform — minimal, composable, universal. The best developer tools don't ask you to leave your environment. They meet you where you already are.

Go build something that lives in a place developers actually want to be.

---

*The Terminal Native is published at thegenerativeengineer.substack.com. hg is MIT licensed and available on GitHub.*
