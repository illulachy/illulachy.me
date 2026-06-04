---
type: blog
title: "The write actor: ~50 lines that make SQLite concurrent"
date: May 25, 2026
url: "/blog/lv-ch7-write-actor-50-lines-sqlite-concurrent"
description: SQLite allows only one writer at a time. With ~200 concurrent write paths, retry logic doesn't scale. Here's the write actor pattern that serializes all writes through a channel in ~50 lines of Rust.
tags: ["the-local-first-accountant", "liquidview", "sqlite", "concurrency", "rust", "diesel", "actor-pattern", "build-in-public"]
category: Engineering
---

SQLite is the best database for a local-first app. One file, no server, no configuration. But SQLite has a hard limit: only one writer at a time.

LiquidView has ~200 Tauri IPC commands. Many of them write to the database. If two writes arrive simultaneously — say, a market data update and a user adding a transaction — one of them fails with `SQLITE_BUSY`.

The solution is a write actor. A single async task that serializes all writes through a channel. It's ~50 lines of Rust and it's the most important concurrency code in the app.

---

## The Problem

Diesel (LiquidView's ORM) manages a pool of SQLite connections via `r2d2`. Reads can be concurrent — SQLite allows multiple readers with `WAL` mode. But writes must be serialized:

```
Read 1 ──→ SQLite (OK)
Read 2 ──→ SQLite (OK)
Write 1 ──→ SQLite (OK)
Write 2 ──→ SQLite (BUSY — fails)
```

The naive solution is retry logic. `r2d2` has configurable connection timeouts. Set a 5-second timeout and hope writes don't collide. This works until they do, and then the user sees a spurious error that's impossible to reproduce.

The better solution is to never let writes collide in the first place.

---

## The Actor

The write actor is a `tokio::spawn`'d task that owns a dedicated database connection:

```rust
pub struct WriteActor {
    tx: mpsc::Sender<WriteCommand>,
}

struct WriteCommand {
    query: Box<dyn FnOnce(&mut SqliteConnection) -> Result<()> + Send>,
    response: oneshot::Sender<Result<()>>,
}
```

The actor receives commands through an `mpsc` channel and executes them sequentially on its private connection:

```rust
pub fn spawn_writer(database_url: &str) -> (WriteActor, JoinHandle<()>) {
    let (tx, mut rx) = mpsc::channel::<WriteCommand>(256);
    let handle = tokio::spawn(async move {
        let mut conn = SqliteConnection::establish(database_url)
            .expect("write actor: failed to open database");

        while let Some(cmd) = rx.recv().await {
            let result = (cmd.query)(&mut conn);
            let _ = cmd.response.send(result);
        }
    });

    (WriteActor { tx }, handle)
}
```

Every write in the app goes through this actor:

```rust
impl WriteActor {
    pub async fn execute(
        &self,
        query: impl FnOnce(&mut SqliteConnection) -> Result<()> + Send + 'static,
    ) -> Result<()> {
        let (tx, rx) = oneshot::channel();
        self.tx.send(WriteCommand {
            query: Box::new(query),
            response: tx,
        }).await.map_err(|_| ActorDisconnected)?;
        rx.await.map_err(|_| ActorDisconnected)?
    }
}
```

The caller awaits a `oneshot` response. The actor processes commands in FIFO order. There is never a `SQLITE_BUSY` error because there is never a concurrent write.

---

## Integration with Diesel

In practice, the `WriteActor` is wired into every repository:

```rust
pub struct AccountRepository {
    pool: DbPool,        // for reads (r2d2 pool)
    writer: WriteActor,  // for writes (serialized actor)
}

impl AccountRepository {
    pub async fn create_account(&self, input: NewAccount) -> Result<Account> {
        self.writer.execute(|conn| {
            diesel::insert_into(accounts::table)
                .values(&input)
                .execute(conn)?;
            Ok(())
        }).await
    }

    pub async fn list_accounts(&self) -> Result<Vec<Account>> {
        // Reads go through the pool — fully concurrent
        let mut conn = self.pool.get()?;
        accounts::table.load(&mut conn).map_err(Into::into)
    }
}
```

Reads are concurrent. Writes are serialized. The actor pattern makes this explicit at the type level — you can't accidentally write through the pool.

---

## What This Enabled

The write actor is invisible to users. That's the point. Every feature that writes to the database — adding accounts, recording transactions, syncing device data, importing CSVs — works because the actor serializes writes without exposing the serialization to the caller.

It also enabled a cleaner architecture. Before the actor, repositories managed their own retry logic and connection timeouts. After the actor, the concurrency model is centralized in one place:

```rust
// Before: every write had to handle SQLITE_BUSY
pub fn create_account(&self, input: NewAccount) -> Result<Account> {
    for attempt in 0..5 {
        match self.try_create(input) {
            Ok(account) => return Ok(account),
            Err(DieselError::DatabaseError(_, info))
                if info.message().contains("SQLITE_BUSY") && attempt < 4 => {
                std::thread::sleep(Duration::from_millis(100 * (attempt + 1)));
                continue;
            }
            Err(e) => return Err(e.into()),
        }
    }
    Err(anyhow!("max retries exceeded"))
}

// After: the actor handles it
pub async fn create_account(&self, input: NewAccount) -> Result<Account> {
    self.writer.execute(|conn| {
        diesel::insert_into(accounts::table)
            .values(&input)
            .execute(conn)?;
        Ok(())
    }).await
}
```

---

## The Cost

- **The actor is a single point of failure.** If the actor panics, every write in the system fails simultaneously. The `JoinHandle` lets the supervisor task restart the actor, but there's a window where writes queue up in the channel buffer.
- **Transactions cross the channel boundary.** If a single operation needs multiple writes in a transaction, they must be wrapped in a single `WriteCommand`. Splitting them across commands loses the transactional guarantee.
- **The actor adds complexity for tiny gains.** For most apps, Diesel's built-in connection pooling with `busy_timeout` is good enough. The actor is only necessary because LiquidView has ~200 concurrent write paths.

---

SQLite doesn't handle concurrent writes. So I built one actor that serializes them all. It's ~50 lines and it's the most important code in the app.

→ Next: Chapter 8 — Building optional features that stay optional
