---
type: blog
title: "The team that sold donuts in a terminal built an AI coding agent"
date: February 03, 2026
url: "/blog/tn-ch0-team-sold-donuts-terminal"
description: There were around 40 AI coding tools by the time we decided to build one. Every single one made the same mistake. Here's why the terminal was the right answer — and what it cost to find out.
tags: ["the-terminal-native", "hg", "tui", "terminal", "origin", "build-in-public"]
category: Engineering
---

There were around 40 AI coding tools by the time we decided to build one.

Cursor. Copilot. Cody. Continue. Zed AI. Windsurf. Codeium. Each one a chat window bolted onto an editor, a web wrapper pretending to be native, or a CLI that printed text and called it done. Every single one made the same assumption: the developer will come to *our* interface.

We wanted to make something that went where the developer already was.

The terminal.

---

## The Terminal.shop Thing

Before hg, the same small team built terminal.shop. It was a joke that became real: you could buy a donut from a Brooklyn shop by running `curl` in your terminal. No browser. No app. No checkout flow. Just a curl command, an API key, and a donut arriving at your door.

It worked. People used it. Not because they wanted donuts that badly — because it proved something about the terminal. It proved that a real product, with real payments, real inventory, real delivery logistics, could live entirely inside a terminal emulator. No Electron. No browser. No "install our app."

That was the thesis. And when AI coding agents exploded in 2024, we looked at the landscape and saw the same mistake repeated 40 times: everyone was building *another web UI*.

---

## The Question

The first question was not "what stack?" or "which LLM?" It was simpler and harder:

*Where should the developer interact with this tool?*

A VS Code extension means you have to use VS Code. An Electron app means a 150MB download and a startup time. A web UI means a browser tab you have to find, keep open, and not lose. Every one of these is a tax on the developer.

The terminal has none of that tax. It's already open. It's already focused. Every developer lives there — checking git status, running tests, grepping logs, deploying, debugging. The question wasn't "can we build a good UI in a terminal?" The question was "why does everyone keep making developers leave the terminal?"

We decided to be the tool that didn't.

---

## The Reality Check

The terminal doesn't have a DOM.

You can't drop in React, reach for flexbox, and call it done. There is no CSS. There is no layout engine. There are no click events. There is a 2D grid of characters, a sequence of ANSI escape codes, and keyboard input. That's the entire surface area.

The first prototype was embarrassing.

A single text line in stdout. "Hello from hg." No framework, no rendering, no component tree. Just `console.log` in a Node process. It felt like the first time I wrote HTML in 1999.

That prototype ran one command: `ls`. The LLM said "I will list the files in your current directory." It ran `ls`. The output appeared in stdout. The LLM read the output and said "You have a README.md, a package.json, and a src folder."

It took 47 seconds for that round trip. It was the most exciting 47 seconds of the project.

Because it worked. Badly, slowly, with zero UI, but it worked. The loop was real: user message → LLM → tool call → execution → result → LLM → next turn. That's the engine. Everything else — the TUI, the provider abstraction, the event sourcing, the plugin system — is scaffolding around that loop.

We had the loop. Now we had to build the scaffolding without relying on anything the web gives you for free.

---

## The First Architecture Decision

The first real decision was: *monolithic or client/server?*

A monolithic CLI tool is simpler. One binary, one process, no networking, no serialization. The TUI and the LLM run in the same address space. State is global. You don't think about protocol design because there is no protocol.

We almost built it that way. It would have shipped faster. And it would have been wrong.

Here's why: if the TUI and the agent run in the same process, you can't have more than one client. You can't have a web app. You can't have a Slack bot. You can't have a desktop app. You can't attach a debugger to a running session. You can't separate the interface from the agent.

So we made the harder choice: the agent runs as a local server. The TUI connects to it as a client. The server exposes an HTTP API with WebSocket streaming. Everything — every tool call, every LLM token, every state transition — is an event flowing through a bus that both the server and client subscribe to.

This decision cost us weeks of development time in the first month. It paid for itself in month two, when we built a web app in a weekend because the server already had the API. It paid for itself again in month three, when we wrote a Slack integration in ~200 lines.

---

## What Came Next

We had a loop. We had an architecture direction. What we didn't have was a programming model.

The monorepo would grow to 13+ packages. The server would merge 50+ Effect services into a single runtime. The TUI would render at 60fps using a framework almost nobody has heard of. The LLM would get a real pseudo-terminal — not `child_process.exec` — because a shell that thinks it's talking to a human behaves differently.

But first, we had to decide what actually held the code together. Chapter 1 is about the bet that shaped everything: Effect TS, adopted at beta.15, before the ecosystem, before the tutorials, before anyone knew it would work.

---

→ Next: Chapter 1 — Effect TS, the framework almost nobody has heard of, and why we bet on it anyway
