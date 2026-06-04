---
type: blog
title: "Building optional features that stay optional"
date: June 01, 2026
url: "/blog/lv-ch8-building-optional-features"
description: The spending module is a separate Rust crate with its own database schema and frontend routes. If you never enable it, the rest of the app doesn't know it exists. This is how optional features should work.
tags: ["the-local-first-accountant", "liquidview", "modularity", "rust", "feature-flags", "additive-architecture", "build-in-public"]
category: Engineering
---

LiquidView started as a portfolio tracker. It was never supposed to track your spending.

But every finance app tracks spending. Mint does it. YNAB does it. Every neobank does it. It's the feature that justifies a monthly subscription — "track your spending patterns, get insights, save money." Users asked for it constantly.

I resisted for a year. Not because it was hard to build — it's not. Adding transactions and categories to a SQLite database is straightforward. I resisted because spending tracking is a product, not a feature. It changes how people interact with the app. It changes what the app is for.

When I finally built it, I made it entirely modular. The spending module is a separate crate. It has its own database tables, its own services, its own frontend routes. It's installed and enabled separately. If you never enable it, the rest of the app doesn't know it exists.

---

## The Temptation

The pressure to add spending tracking came from three directions:

1. **Users wanted it.** The #1 feature request for a year was "track my expenses."
2. **Competitors had it.** Every consumer finance app leads with spending.
3. **It's easy to build.** Compared to the market data provider chain or the E2EE sync engine, spending tracking is CRUD.

The easy answer was to add it to the core. Extend the existing `accounts` table with a `type` field (brokerage vs checking). Add a `transactions` table alongside `activities`. Build a dashboard with spending charts. Ship it.

I almost did. The PR was drafted. The database migration was written.

---

## The Resistance

I stopped because I realized spending tracking would change the app's identity.

LiquidView was designed for investors. The core data model revolves around holdings, valuations, cost basis, and performance. The charts show asset allocation, sector exposure, and return over time.

Spending tracking answers different questions: "where is my money going?" and "am I overspending on dining?" These are valid questions. But they require a different data model (categorized transactions instead of holdings), a different aggregation strategy (monthly sums instead of daily valuations), and a different UI (category pie charts instead of portfolio treemaps).

Mixing both in one core would create a codebase that serves two masters. The `Account` model would need an `account_type` field and branching logic everywhere. The dashboard would need to show portfolio metrics and spending metrics in the same view. The database schema would accumulate optional columns and nullable foreign keys.

So I built the spending module as a separate crate.

---

## The Additive Architecture

The spending module lives in `crates/spending/`:

```
crates/
  core/          -- portfolio tracking (holdings, valuations, accounts, activities)
  storage-sqlite/-- SQLite implementation of core's repository traits
  spending/      -- spending tracking (transactions, categories, budgets, rules)
  addon-runtime/ -- the addon system
  sync-engine/   -- E2EE device sync
  providers/     -- market data providers
  server/        -- Axum web server
  tauri-app/     -- Tauri desktop app
```

The spending crate defines its own domain models, its own repository traits, and its own services:

```rust
pub struct Transaction {
    pub id: Uuid,
    pub account_id: Uuid,
    pub date: NaiveDate,
    pub description: String,
    pub amount: Decimal,
    pub category_id: Uuid,
    pub tags: Vec<String>,
}

pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub parent_id: Option<Uuid>,
    pub icon: String,
    pub budget_amount: Option<Decimal>,
}
```

It has its own database schema, its own migrations, and it registers its own frontend routes:

```typescript
export const spendingRoutes = [
  { path: "/spending", component: SpendingDashboard },
  { path: "/spending/transactions", component: TransactionList },
  { path: "/spending/categories", component: CategoryManager },
  { path: "/spending/budgets", component: BudgetTracker },
];
```

And it's compiled only when the `spending` feature flag is enabled:

```toml
[features]
default = []
spending = ["liquidview-spending"]
```

---

## Feature Flag Wires

The integration between core and spending is a single integration point:

```rust
let app_state = AppState::new(config).await;

#[cfg(feature = "spending")]
let app_state = {
    let spending = SpendingModule::new(
        app_state.db_pool(),
        app_state.write_actor(),
    );
    app_state.with_spending(spending)
};
```

If `spending` isn't enabled, the rest of the app compiles without it. No feature detection at runtime, no conditional branches, no `Option<SpendingService>` fields. The compiler strips the spending code entirely.

---

## What This Enabled

The additive architecture turned spending from a core feature into a module. Three effects I didn't fully anticipate:

**1. Separate iteration velocity.** Spending gets its own backlog, its own bugs, its own releases. A bug in spending categorization doesn't block a portfolio calculation fix.

**2. User choice.** Some users don't want spending tracking. They use LiquidView exclusively for portfolio tracking and retirement planning. Without the spending module, the app is simpler, faster, and has fewer database tables.

**3. Dogfooding the addon pattern.** The spending module proved the additive architecture works. The same pattern — separate crate, feature flag, route registration — is what the addon system uses.

---

## The Cost

- **Feature flags in Rust are awkward.** Cargo features are additive and transitive. I've had to add `spending` to the workspace default features just to avoid confusing compilation errors.
- **The frontend isn't gated as cleanly.** The spending UI is a separate route tree, but it still ships in the same JavaScript bundle. Users who don't enable spending pay the bundle cost for code they never use.
- **Cross-module queries are harder.** "Show me my portfolio performance alongside my monthly spending" requires coordinating between two databases or joining across schema boundaries. The core and spending modules have separate migration histories.

---

I built the spending module last because I wanted to prove that the core could stand on its own. It can. The portfolio tracker that started as a side project is a complete product without spending tracking. Adding spending as an optional module didn't dilute the core — it expanded the platform without compromising the original vision.

→ Next: Chapter 9 — What I'd ship differently
