---
type: blog
title: "The Architecture of a TUI AI Coding Agent"
date: April 17, 2026
url: "/opencode-architecture"
description: How opencode ships as a single binary running two cooperating processes — a local HTTP server and a terminal UI client — and why that separation shapes everything else.
tags: ["opencode", "architecture", "typescript", "ai"]
category: Engineering
---

opencode ships as a single binary but runs as two cooperating processes: a local HTTP server and a terminal UI client. This separation is the foundational design decision that shapes everything else.

---

## What opencode Is

opencode is an AI coding agent that runs in your terminal. You give it a task — "fix this bug", "refactor this module" — and it uses language models to write code, run commands, and edit files, asking for permission before doing anything irreversible.

It is fully open-source, self-hosted (models run through your own API keys), and extensible via a plugin system.

---

## The Monorepo

The codebase is a Bun workspace with these primary packages:

| Package | Role |
|---------|------|
| `packages/opencode` | Core server, TUI client, and CLI — the main package |
| `packages/sdk` | JavaScript SDK for building clients against the server |
| `packages/plugin` | Plugin system SDK (`@opencode-ai/plugin`) |
| `packages/console` | Admin web console (Solid.js) for opencode.ai |
| `packages/desktop` | Native desktop app wrapper |
| `packages/shared` | Shared utilities (FileSystem, npm helpers) |

Everything interesting lives in `packages/opencode`.

---

## The Client/Server Split

The most important architectural decision: **the TUI is a client**.

When you run `opencode`, it starts a local HTTP server on a random port, then launches the terminal UI as a separate process that connects to it via HTTP and Server-Sent Events (SSE).

```
┌─────────────────┐        HTTP + SSE        ┌──────────────────────┐
│   TUI Client    │ ◄────────────────────── │   opencode Server     │
│  (SolidJS +     │ ──POST /session/prompt─► │   (Hono + Effect)     │
│   OpenTUI)      │                          │   localhost:RANDOM    │
└─────────────────┘                          └──────────────────────┘
```

Why? Several reasons:
- The same server can power the TUI, a desktop app (Tauri/Electron), or a remote browser client
- You can run the server headless on a remote machine and connect the TUI from your laptop
- Multiple clients can observe the same session simultaneously

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| TUI rendering | OpenTUI + SolidJS | Fine-grained reactivity without VDOM; handles 60 FPS terminal updates efficiently |
| HTTP server | Hono | Fast, lightweight, excellent TypeScript support |
| Async/services | Effect (v4) | Composable async, typed errors, structured concurrency |
| Database | SQLite + Drizzle ORM | Embedded, zero-config, works offline |
| AI integration | Vercel AI SDK | Unified interface over 20+ model providers |
| Runtime | Bun (primary) / Node.js | Bun for speed; Node.js adapter for compatibility |

---

## Startup Flow

When the user runs `opencode`:

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI (src/index.ts)
    participant Run as run.ts
    participant Server as Hono Server
    participant TUI as TUI (app.tsx)
    participant SDK as SDK Context (sdk.tsx)

    User->>CLI: opencode
    CLI->>Run: bootstrap project
    Run->>Run: detect directory, init worktree
    Run->>Server: Server.listen(random port)
    Server-->>Run: listening on :PORT
    Run->>TUI: spawn TUI process
    TUI->>SDK: createOpencodeClient(localhost:PORT)
    SDK->>Server: GET /event (SSE subscription)
    Server-->>SDK: stream: server.connected
    TUI->>User: renders home screen
```

The server and TUI share the same process via a single binary — the "spawn" is logical, not a separate OS process. The TUI renders inside the same Bun process using OpenTUI's synchronous renderer.

---

## Sending a Message: End-to-End Flow

The most important user flow:

```mermaid
sequenceDiagram
    participant User
    participant TUI as TUI (prompt component)
    participant Server as Server
    participant LLM as LLM / AI Provider
    participant Bus as Event Bus (SSE)

    User->>TUI: types message, hits Enter
    TUI->>Server: POST /session/:id/message { text, agent }
    Server->>Server: SessionPrompt.prompt() — starts loop
    Server->>LLM: streamText(messages, tools, model)
    LLM-->>Server: stream: text tokens, tool calls
    Server->>Bus: Bus.publish(session.message.updated, ...)
    Bus-->>TUI: SSE event: message.part.updated
    TUI->>TUI: Solid store updates → re-render
    Server->>Server: dispatch tool calls (bash, edit, read...)
    Server->>Bus: Bus.publish after each tool result
    Bus-->>TUI: SSE event: tool result
    LLM-->>Server: finish
    Server-->>TUI: HTTP 200 (final message)
```

The TUI never polls. All updates arrive via the SSE stream — the server pushes state as events.

---

## Permission Flow

When a tool needs user approval (e.g., editing a file):

```mermaid
sequenceDiagram
    participant Server as Server (tool execution)
    participant Bus as Bus (SSE)
    participant TUI as TUI
    participant User

    Server->>Server: tool.ask({ permission: "edit", diff: "..." })
    Server->>Bus: Bus.publish(permission.asked, { requestID, diff })
    Bus-->>TUI: SSE event: permission.asked
    TUI->>User: show permission dialog with diff preview
    User->>TUI: clicks "Allow" or "Deny"
    TUI->>Server: POST /permission/:requestID/reply { action: "allow" }
    Server->>Server: Deferred resolves → tool continues
```

The tool's Effect is suspended on a `Deferred` while waiting for the reply. No polling, no timeout machinery — Effect's structured concurrency handles it.

---

## TUI Architecture

The TUI is built with SolidJS running inside OpenTUI, a terminal UI framework that speaks SolidJS's reactivity model.

```mermaid
graph TD
    app[app.tsx — root component]
    app --> sdk[SDKProvider\n connects to server, owns SSE]
    app --> sync[SyncProvider\n reactive store of server state]
    app --> local[LocalProvider\n TUI-only state: agent, model, prompt draft]
    app --> route[RouteProvider\n navigation: home / session / plugin]
    app --> theme[ThemeProvider\n light/dark/custom themes]
    app --> keybind[KeybindProvider\n keyboard shortcut registry]

    route --> home[routes/home.tsx\n prompt input, logo]
    route --> session[routes/session/index.tsx\n message thread, sidebar, footer]
    route --> plugin[plugin routes\n custom screens from plugins]

    session --> permission[permission.tsx]
    session --> question[question.tsx]
    session --> dialogs[dialog-*.tsx\n session list, model select, timeline]
```

Key design: context providers own all state. Components read from providers via SolidJS signals — when the server pushes an event, `SyncProvider` updates its store, and all dependent components re-render automatically.

---

## Server Architecture

Inside the server, Hono middleware wraps all routes:

```mermaid
graph LR
    req[HTTP Request]
    req --> err[ErrorMiddleware]
    err --> auth[AuthMiddleware\n optional Basic Auth]
    auth --> log[LoggerMiddleware]
    log --> gz[CompressionMiddleware\n skips SSE/WS routes]
    gz --> cors[CorsMiddleware]
    cors --> inst[InstanceRoutes\n /session /provider /permission /pty /event ...]
    cors --> ctrl[ControlPlaneRoutes\n workspace management]
    cors --> ui[UIRoutes\n static assets]
```

All business logic runs through `AppRuntime.runPromise(Effect.gen(...))` — a single composed Effect that yields all the services it needs.

---

## Service Layer at a Glance

The server manages ~50 services in two scopes:

```mermaid
graph TD
    ar[AppRuntime\n ManagedRuntime wrapping all layers]

    ar --> global[Global Services\n one instance, shared across all projects]
    ar --> inst[Instance-Scoped Services\n one per open directory]

    global --> auth[Auth\n API keys, OAuth tokens]
    global --> afs[AppFileSystem\n Effect wrapper around fs]
    global --> install[Installation\n version, channel]

    inst --> bus[Bus\n typed pub/sub backbone]
    inst --> config[Config\n layered JSONC config]
    inst --> session[Session cluster\n CRUD, prompt, compaction, revert]
    inst --> provider[Provider\n model registry, SDK wiring]
    inst --> agent[Agent\n persona definitions]
    inst --> tools[ToolRegistry\n 19 built-in tools + MCP]
    inst --> lsp[LSP\n language server client]
    inst --> mcp[MCP\n model context protocol client]
```

Instance-scoped means: open two projects, get two independent Bus instances, two Config instances, two Session stores. They don't share state.

---

## Why This Architecture Works

The client/server split looks like added complexity, but it pays off in several ways:

1. **Multiple clients**: the desktop app reuses the same server — no duplicate logic
2. **Remote operation**: run the server on a devcontainer, connect TUI from your laptop
3. **Clean separation**: the TUI is a thin reactive client; all AI logic lives in the server
4. **SSE simplicity**: streaming AI output over SSE is simpler and more reliable than WebSockets for this use case — it's unidirectional by nature
