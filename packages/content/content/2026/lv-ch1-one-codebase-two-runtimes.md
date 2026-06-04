---
type: blog
title: "One codebase, two runtimes: the adapter pattern"
date: April 13, 2026
url: "/blog/lv-ch1-one-codebase-two-runtimes"
description: The first version was a Tauri desktop app. Then users wanted a web server for their NAS. The adapter pattern is how I avoided writing the same business logic twice.
tags: ["the-local-first-accountant", "liquidview", "architecture", "adapter", "tauri", "axum", "rust", "build-in-public"]
category: Engineering
---

The first version of LiquidView was a Tauri app. Desktop only. One binary, one SQLite file, one user.

Then people wanted a web version. Not "can you make a web app?" — that's easy, just build a different frontend. They wanted a self-hosted web server they could run on their NAS, their VPS, their Raspberry Pi. The same app, but delivered through a browser.

I had two options:
1. Maintain two separate codebases — a Tauri app and a web server — with duplicated business logic
2. Find a way to run the same Rust core on both runtimes

I chose option 2. The adapter pattern was the result. It's not elegant — it's necessary. And it saved me from maintaining two apps.

---

## The Problem

LiquidView's architecture has three layers:

1. **Rust core** — business logic, services, domain models, persistence. All the hard stuff.
2. **Runtime layer** — the platform that hosts the core (Tauri desktop process vs Axum HTTP server).
3. **Frontend** — React app that calls backend commands.

The Rust core is the same in both runtimes. `crates/core` contains all the business logic, completely database-agnostic. `crates/storage-sqlite` implements the persistence interfaces. Both runtimes depend on the same crates.

The problem is the command surface. In Tauri mode, the frontend calls `invoke("get_accounts")` and gets a JSON response over IPC. In web mode, the frontend calls `fetch("/api/v1/accounts")` and gets a JSON response over HTTP. The Rust handlers are different (Tauri commands vs Axum route handlers), but they call the same core services.

I needed the frontend to not care which runtime it was talking to.

---

## The Invoke Abstraction

In the Tauri version, every frontend function looks like this:

```typescript
import { invoke } from "@tauri-apps/api/core";

export async function getAccounts(): Promise<Account[]> {
  return invoke("get_accounts");
}
```

In the web version, it looks like this:

```typescript
export async function getAccounts(): Promise<Account[]> {
  const res = await fetch("/api/v1/accounts");
  return res.json();
}
```

Different calls, same return type. The solution was a compile-time adapter pattern using Vite's `resolve.alias`:

```
apps/frontend/src/adapters/
  index.ts        -- re-exports from ./tauri (default)
  types.ts        -- shared type definitions
  tauri/           -- invoke() via @tauri-apps/api/core
  web/             -- fetch() to /api/v1/*
  shared/          -- shared command implementations
```

At build time, an environment variable selects the adapter:

```typescript
// apps/frontend/src/adapters/index.ts
// BUILD_TARGET=tauri → ./tauri
// BUILD_TARGET=web   → ./web
export * from "./commands";
```

The web adapter contains a command-to-route map:

```typescript
const COMMANDS = {
  get_accounts: { method: "GET", path: "/accounts" },
  create_account: { method: "POST", path: "/accounts" },
  get_holdings: { method: "GET", path: "/holdings" },
  // ~200 commands total
};
```

Every frontend function calls `invoke("get_accounts")`. The adapter decides whether that means Tauri IPC or an HTTP fetch. The frontend never knows.

---

## The Rust Side

The Rust side follows the same pattern. Both `apps/tauri` and `apps/server` build the same `AppState` from the same crates:

```rust
// Simplified — both runtimes do this:
let db_pool = create_pool(&config);
let write_actor = spawn_writer(db_pool.clone());
let account_service = AccountService::new(
    AccountRepository::new(db_pool, write_actor)
).with_event_sink(sink);
let portfolio_service = PortfolioService::new(
    PortfolioRepository::new(db_pool, write_actor)
).with_event_sink(sink);
// ... 20+ services wired the same way
```

The difference is how commands are exposed:

**Tauri** — each command is a `#[tauri::command]` function:

```rust
#[tauri::command]
async fn get_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, AppError> {
    state.account_service.list_accounts().await.map_err(Into::into)
}
```

**Axum** — each route is a handler function:

```rust
async fn get_accounts(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Account>>, AppError> {
    state.account_service.list_accounts().await.map(Json).map_err(Into::into)
}
```

Same service, same error type, same response. Different wiring.

---

## What This Enabled

When someone requested a self-hosted web version, I didn't have to build a new backend. I wrote ~1000 lines of Axum route handlers that wrapped the existing Tauri commands, added JWT auth middleware, CORS headers, and a rate limiter. The entire web server was a thin HTTP layer over the same business logic.

The Docker image? Same binary. `cargo build --release` produces a single `liquidview-server` binary that serves both the API and the compiled frontend assets. The Tauri version uses the same frontend code, compiled to a different target with a different adapter.

This meant the web version shipped with feature parity on day one. Every account feature, every holdings calculation, every CSV import path — all shared. No "web version coming soon" caveats.

---

## The Cost

The adapter pattern isn't free. Here's what it costs:

- **Two files for every command.** The web adapter's `COMMANDS` map must stay in sync with the Tauri IPC surface. When I add a Tauri command, I have to add the corresponding API route and the frontend adapter entry.
- **Frontend type duplication.** TypeScript types mirror Rust `#[derive(Serialize)]` structs. There's no automatic generation — I maintain them by hand.
- **Testing surface doubles.** Changes that touch shared core code need testing on both runtimes.
- **Build complexity.** Two Rust targets, two frontend builds, one Docker image. The CI matrix is wider than a single-platform app.

But the alternative was two separate codebases. Two separate frontends. Two separate backends that would drift apart over time. The adapter pattern forces a clean boundary between platform code and business logic, and that boundary is worth the friction.

---

## The Pattern in Practice

The adapter pattern is visible in every layer:

| Layer | Tauri | Axum |
|---|---|---|
| Command dispatch | `#[tauri::command]` handlers | Axum route handlers |
| Event delivery | `app.emit("event", payload)` | SSE via `EventBus` |
| AI streaming | Tauri Channels | HTTP fetch streaming |
| File dialogs | `@tauri-apps/plugin-dialog` | Browser `<input>` |
| Secrets | OS keyring via `keyring` crate | Encrypted file via `WF_SECRET_KEY` |
| Device sync | Background thread + periodic | Background thread + periodic (same code) |

Same core, different edges.

---

I didn't choose the adapter pattern because it was architecturally pure. I chose it because I didn't want to write the same business logic twice. The fact that it created a clean separation between platform and domain was a side effect.

The next chapter is about the market data provider chain — how the app fetches stock prices, exchange rates, and dividend data from 8+ providers without any single point of failure.

→ Next: Chapter 2 — 8 providers, one interface: the market data chain
