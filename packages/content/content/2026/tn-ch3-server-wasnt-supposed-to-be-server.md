---
type: blog
title: "The server that wasn't supposed to be a server"
date: February 24, 2026
url: "/blog/tn-ch3-server-wasnt-supposed-to-be-server"
description: I never set out to build a platform. I set out to build a TUI. The server was supposed to be an internal detail. Then the web app happened. Then the Slack bot. Then editors started using it as their AI backend.
tags: ["the-terminal-native", "hg", "architecture", "client-server", "acp", "build-in-public"]
category: Engineering
---

I never set out to build a platform. I set out to build a TUI.

The server was supposed to be an internal detail — a thin RPC layer that the TUI process used to talk to the agent process. Process isolation, no shared memory, a clean protocol boundary. A pragmatic implementation decision, not a product architecture.

Then the web app happened. Then the Slack bot. Then the desktop app. Then editors started implementing the ACP protocol to use hg as their AI agent.

At some point you have to admit: the server is not an implementation detail. The server *is the product*. The TUI is just one of its clients.

---

## Why a CLI Tool Needs a Server

The standard model for a CLI tool is: one process, one job, one exit. You run `grep`, it searches, it prints, it exits. That model doesn't work for an AI coding agent that holds state, manages file watchers, runs PTY sessions, and responds to user messages across multiple channels.

We needed a long-running process that could:

- Hold session state across multiple turns
- Manage concurrent tool executions (read 5 files at once)
- Stream LLM output in real time to any connected client
- Handle reconnection when the TUI restarts
- Execute shell commands in persistent PTY sessions

A single process could do all of this. But then every client — TUI, web app, CLI, Slack — would need its own process, and they couldn't share state or sessions. You'd have one agent per interface, not one agent that all interfaces connect to.

So the server was born. Not as a product decision. As a practical one.

---

## The Protocol

The server exposes three transport mechanisms, each for a different job:

**HTTP** for command-and-response. List sessions, get a session by ID, update config, export data. Simple REST semantics. The TUI calls these on startup to hydrate its state.

**WebSocket** for real-time streaming. Every LLM token, every tool call, every state transition — published as events over a persistent connection. The TUI subscribes to the events it cares about and updates its reactive state.

**SSE** for one-way event streams. Server-sent events for clients that don't need bidirectional communication. The web app uses this to stream LLM output without managing a WebSocket connection.

The event schema is shared across all three transports. A `session.started` event has the same shape whether it arrives over WebSocket, SSE, or HTTP polling. Adding a new client type is just a matter of connecting to the right transport.

---

## The RPC Layer

The TUI doesn't call the server's HTTP API directly. It talks through an RPC layer that handles serialization, connection management, and reconnection.

When the TUI starts, it connects to the server over WebSocket. It sends a ticket-based auth token (the server verifies it's the same user). It receives a stream of events — current state, active sessions, running commands.

When the TUI sends a message, it goes through the RPC layer:
1. Serialize the message as JSON
2. Send over WebSocket
3. Server receives it, routes it to the session processor
4. Session processor invokes the LLM, streams tokens back
5. Each token is published as a `session.text-delta` event
6. WebSocket pushes the event to the TUI
7. TUI's reactive state updates, SolidJS re-renders the affected component

The round trip is visible in the TUI as tokens appearing character by character. From the architecture's perspective, every character is an event flowing through a protocol.

---

## The Accidental Platform

The first sign that the server was more than an implementation detail came when someone asked: "Can I use hg from a different machine?"

The question exposed an assumption we hadn't examined: the server listens on localhost. But the protocol doesn't know about localhost. The protocol is just JSON over WebSocket.

We built a web app in a weekend. The server already had every API endpoint the web app needed. We just needed a browser to connect to it. The web app (`@hg-ai/app`) is a SolidJS SPA that connects to the same WebSocket endpoints the TUI uses.

The Slack bot (~200 lines of TypeScript) connects the same way. The desktop apps (Tauri and Electron) are just native wrappers around the web app.

The ACP protocol — Agent Client Protocol — is a standardized JSON-RPC interface that lets editors like Zed use hg as their AI backend. The server implements ACP as another transport layer on top of the same session processing engine.

None of this was planned. The server existed because we needed process isolation. Everything else was a side effect.

---

## The Cost of the Architecture

Client/server adds complexity that a monolithic tool doesn't have.

**Serialization.** Every event crosses a process boundary. Objects that could be shared in memory are serialized to JSON and deserialized on the other side.

**Connection management.** The TUI can disconnect and reconnect. The server needs to track which events each client has seen and replay missed ones. We use a cursor-based system: each event has a sequence number, clients report their last seen cursor, the server replays from there.

**State synchronization.** When the TUI starts, it fetches the current state from the server. But the server's state might have changed while it was down. The TUI needs to reconcile.

**Testing.** You can't test the TUI without the server running. The testing surface is larger.

But every one of these costs is a one-time engineering investment. The benefit — multiple clients, shared state, reconnection support, protocol-driven extensibility — pays out on every feature.

---

## What Came Next

The server was running. The protocol was stable. Clients connected and received events.

But the TUI needed a rendering model — because the terminal has no DOM.

---

→ Next: Chapter 4 — The terminal UI that thinks it's a browser
