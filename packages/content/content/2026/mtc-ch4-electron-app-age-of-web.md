---
type: blog
title: "Building an Electron app in the age of the web"
date: February 02, 2026
url: "/blog/mtc-ch4-electron-app-age-of-web"
description: We could have built a web app. Here's why we didn't — and what three processes, 50+ IPC channels, and a pnpm symlink workaround actually cost us.
tags: ["memory-that-compounds", "electron", "ipc", "esbuild", "pnpm", "desktop-app", "build-in-public"]
category: Engineering
---

We could have built a web app.

Every piece of engineering advice you hear says the same thing: ship a web app first, validate the idea, then think about native. It's the YC mantra. It's what we told ourselves for the first six weeks.

But a knowledge tool that lives on the user's machine, reads their email, watches their filesystem, and runs background agents — that's not a web app. It's a process that needs to stay alive, keep state, and respond to OS-level events. You can't do that from a browser tab that the user might close.

So we built an Electron app. Three processes, 50+ IPC channels, a custom esbuild bundling pipeline, and a pnpm symlink workaround that consumed more engineering time than the entire knowledge graph.

This chapter is what it cost.

---

## The Three-Process Architecture

Electron gives you two processes by default: the **main process** (Node.js, system access) and the **renderer** (Chromium, UI). We added a third: the **preload** script.

The main process is the server. It starts an Express server for OAuth callbacks, manages Google API connections, runs the knowledge sync engines, and hosts the MCP client. It's the only process that touches the filesystem.

The preload script is a bridge. It exposes a typed `ipc` object to the renderer via `contextBridge.exposeInMainWorld`. The renderer never calls `ipcRenderer` directly — it calls `window.ipc.invoke(channel, args)` which goes through the preload's validation layer.

The validation layer is Zod. Every IPC channel has a Zod schema that validates both the request and response payloads at runtime. If the renderer sends a malformed request, it gets rejected before reaching the handler.

```typescript
// Preload: expose validated IPC
contextBridge.exposeInMainWorld('ipc', {
  invoke(channel, args) {
    const validated = validateRequest(channel, args);
    return ipcRenderer.invoke(channel, validated);
  },
});
```

The renderer never imports from `electron`. It doesn't know what Node.js is. It talks to the outside world exclusively through typed IPC channels defined in a shared schema file.

---

## 50+ IPC Channels

The IPC surface grew to cover everything the renderer needed from the system:

- **Workspace operations** — readdir, readFile, writeFile, mkdir, rename, copy, remove, stat, exists
- **Runs** — create, stop, fetch, list, delete
- **Gmail** — getImportant, getEverythingElse, sync
- **Composio** — is-configured, set-api-key, initiate-connection, list-connected, list-toolkits
- **Live notes** — run, get, set, delete, stop
- **Background tasks** — run, get, patch, create, delete, stop, list
- **Knowledge** — history, restore
- **OAuth** — connect, disconnect, list-providers

Plus event streams pushed from main to renderer: knowledge commits, workspace changes, run events, live note agent events, OAuth connection events.

The shared schema file is 966 lines.

The advantage: the renderer is decoupled from the system. You could replace the main process entirely — swap Electron for Tauri or a local server — and the renderer wouldn't change. The IPC contract is the API boundary.

The disadvantage: every new feature adds two files of boilerplate. The schema file became the most frequently edited file in the codebase.

---

## The esbuild Bundling Pipeline

The hardest part of shipping the Electron app wasn't the IPC — it was the build.

The codebase uses pnpm workspaces. The electron app depends on `@x/core` and `@x/shared` as workspace packages. pnpm uses symlinks to resolve these dependencies. This works fine in development. It does not work for packaging.

Electron Forge's packaging step uses flora-colossus to walk the dependency tree and copy `node_modules` into the packaged app. flora-colossus cannot follow pnpm's symlinked workspace packages. When it hit `@x/core`, it found an empty directory. The packaging step failed silently.

The fix was to bundle the entire main process into a single CJS file using esbuild:

```javascript
await esbuild.build({
  entryPoints: ['./dist/main.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: './.package/dist/main.cjs',
  external: ['electron'],
  format: 'cjs',
  banner: { js: `var __import_meta_url = require('url').pathToFileURL(__filename).href;` },
  define: {
    'import.meta.url': '__import_meta_url',
  },
});
```

The esbuild bundle inlines `@x/core`, `@x/shared`, and all their transitive dependencies into one file. The Forge packaging step never sees symlinks — it just copies the bundle.

The build order became:

```
shared (tsc) → core (tsc) → renderer (Vite) → preload (tsc) → main (tsc) → main (esbuild bundle)
```

---

## The Cost

The Electron app cost us in three dimensions:

**Build complexity.** The esbuild bundling pipeline, the build order, the CJS polyfill — these are not portable knowledge. When we hired a new engineer, their first two weeks were spent understanding the packaging pipeline, not shipping features.

**Bundle size.** The single-file main process bundle is about 15 MB. Electron itself is ~180 MB. The total app is ~200 MB for a tool whose core logic is a folder of Markdown files.

**IPC latency.** Most IPC calls take under 1ms. But when they don't — when the renderer calls `knowledge:history` and the main process has to walk 500 files — the UI stutters. The fundamental issue is that the renderer is blocked on main-process I/O because every IPC call is synchronous from the renderer's perspective.

---

## What I'd Change

In retrospect, I would have invested in making the preload bridge thinner. Electron supports custom protocols (`protocol.registerFileProtocol`) that let you serve files over `custom://` URLs as if they were local. That would have eliminated half the workspace IPC channels.

But we didn't discover this until we'd already written 50 handlers. By then, the schema was established and the cost of changing it exceeded the benefit.

The lesson: when you build an Electron app, the IPC surface is your API design. Get it wrong early and you carry the cost for the rest of the project.

---

## The Next Problem

The Electron app worked. But everything was driven by polling. The Gmail sync polled every 30 seconds. The knowledge graph rebuilt every 15 seconds. The live note scheduler checked every 5 seconds. Cumulatively, the system was running hundreds of polling cycles a day, most of which found nothing new.

Chapter 5 is about events on a filesystem, the directory as a message queue, and why we chose JSON files over Kafka.

---

→ Next: Chapter 5 — The event loop that runs on the filesystem
