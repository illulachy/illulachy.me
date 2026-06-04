---
type: blog
title: "The addon system with a security scanner"
date: April 27, 2026
url: "/blog/lv-ch3-addon-system-security-scanner"
description: Letting third-party code run inside a desktop app that holds your financial data requires more than a manifest. We scan addon code at install time and ask for permission — like an app store, but automated and local.
tags: ["the-local-first-accountant", "liquidview", "addons", "permissions", "typescript-sdk", "security", "build-in-public"]
category: Engineering
---

The worst thing you can do to a desktop app is let someone else run code inside it. The second worst thing is not letting them.

LiquidView stores your financial data in a SQLite file on your machine. Bank account numbers, brokerage holdings, transaction history, net worth — all of it in one file, protected by nothing but your operating system's file permissions. The idea of letting a third-party addon read that data kept me up at night.

But without addons, I'd be responsible for every feature request that came in. Import from this broker. Support that chart type. Add a goal tracker. Show dividends differently. The community wanted to build features I didn't have time for.

The solution was an addon system that scans code before it runs, detects what APIs it needs, and asks the user for permission — like an app store review, but automated, local, and transparent.

---

## The Permission Model

Every addon declares its permissions in a manifest:

```json
{
  "id": "goal-tracker",
  "name": "Goal Progress Tracker",
  "version": "1.0.0",
  "permissions": ["accounts:read", "portfolio:read", "ui:sidebar"],
  "sdkVersion": "1.0.0"
}
```

There are 16 permission categories, each with a risk level:

| Risk | Categories |
|---|---|
| **Low** | market-data, quotes, currency, events, ui |
| **Medium** | assets, performance, financial-planning, contribution-limits, settings, files |
| **High** | accounts, portfolio, activities, secrets, snapshots |

Each category maps to specific function-level permissions:

```typescript
// accounts:read → AccountAPI.getAccounts(), AccountAPI.getAccount()
// accounts:write → AccountAPI.createAccount(), AccountAPI.updateAccount()
// portfolio:read → PortfolioAPI.getHoldings(), PortfolioAPI.getValuation()
// secrets:* → SecretsAPI.getSecret(), SecretsAPI.setSecret()
```

Low-risk permissions are auto-granted. High-risk permissions require explicit user consent with a dialog explaining why the addon needs it.

---

## Static Analysis at Install Time

But here's the thing: developers lie. Or they make mistakes. Or they add a permission to the manifest and then use a different API at runtime.

So the addon system doesn't just trust the manifest. It scans the addon's source code at install time to detect what APIs it actually uses:

```typescript
// PermissionDetector scans the bundled JS for patterns like:
// api.accounts.getAccounts()
// api.secrets.getSecret("some-key")
// api.portfolio.getHoldings()

const detectedPermissions = await PermissionDetector.scan(addonBundle);
// Returns: ["accounts:read", "secrets:read"]
```

The scanner uses AST pattern matching. It looks for method calls on the `api` object, maps them to permission categories, and compares the result against the declared manifest. If the detected permissions exceed the declared ones, the user sees a warning:

> **"Goal Tracker" requests access to your portfolio data.**
> Detected additional permissions not declared in manifest: secrets:read.
> Grant anyway? [Yes] [No] [Review Code]

This isn't a plugin system. This is an OS security model for a desktop app.

---

## The SDK

Addon developers get a full TypeScript SDK published to npm (`@liquidview/addon-sdk`):

```typescript
import { defineAddon } from "@liquidview/addon-sdk";

export default defineAddon({
  id: "goal-tracker",
  name: "Goal Progress Tracker",
  permissions: ["accounts:read", "portfolio:read", "ui:sidebar"],

  setup(ctx) {
    ctx.sidebar.addItem({
      id: "goals",
      label: "Goals",
      icon: "target",
      route: "/goals",
    });

    ctx.router.add({
      path: "/goals",
      component: GoalsPage,
    });

    ctx.events.on("portfolio:updated", (data) => {
      console.log("Portfolio changed:", data);
    });

    const accounts = await ctx.api.accounts.getAccounts();
    const holdings = await ctx.api.portfolio.getHoldings();

    return () => {
      ctx.sidebar.removeItem("goals");
    };
  },
});
```

The SDK provides 19 domain APIs, each with full type safety:

```typescript
ctx.api.accounts     // full CRUD for accounts
ctx.api.portfolio    // holdings, valuation, allocation, performance
ctx.api.activities   // transactions, CSV import
ctx.api.marketData   // quotes, search, dividends
ctx.api.secrets      // secure key-value storage (encrypted)
ctx.api.events       // real-time event subscription
ctx.api.navigation   // sidebar items, routes
ctx.api.toast        // user notifications
// ... and 11 more
```

---

## The Runtime

When the app starts, the addon runtime:

1. Scans the addons directory for installed addons
2. Validates each addon's manifest against the detected permissions
3. Loads each addon into a sandboxed JavaScript context
4. Calls the addon's `setup()` function with a scoped API context
5. Subscribes to the addon's dynamic route registrations
6. Tracks API calls at runtime and blocks undeclared ones

The sandboxing is crucial. An addon with `accounts:read` permission can call `ctx.api.accounts.getAccounts()`. If it tries to call `ctx.api.secrets.getSecret()`, the runtime throws a `PermissionDeniedError`:

```typescript
class PermissionDeniedError extends Error {
  constructor(apiName: string, requiredPermission: string) {
    super(
      `Addon attempted to call ${apiName} without declaring ${requiredPermission} permission. ` +
      `This call has been blocked.`
    );
  }
}
```

---

## The Addon Store

Addons are distributed through a separate repository and discovered through an in-app store. The store doesn't host binaries. It hosts metadata and source code links. Users install addons from GitHub repos, which means every addon's source code is public and reviewable. The permission scanner runs locally at install time — no server required, no trust needed.

The system turned LiquidView into a platform. Third-party developers have built:

- **Goal Progress Tracker** — visual goal tracking with a calendar-like interface
- **Investment Fees Tracker** — track and analyze brokerage fees
- **Swingfolio** — swing trading performance tracker with open position management

These aren't features I built. They're features the community built because the SDK gave them the tools and the permission system gave them confidence that their data was safe.

---

## The Cost

The addon system was the most complex feature to build:

- **The permission scanner uses AST analysis.** JavaScript has dynamic property access — `api["get" + "Accounts"]()` — which is hard to detect statically. The scanner catches the common cases and warns about dynamic patterns.
- **Sandboxing JavaScript in a Rust desktop app** is awkward. The addon runtime runs in the frontend process, which means it shares the browser context. Memory leaks in addons affect the main app.
- **SDK maintenance.** Every new API I add to the core app is a potential addition to the SDK. Breaking changes in the core mean version bumps in the SDK and addon compatibility checks.

---

The addon system that scans your code before it runs, checks what APIs it needs, and asks for permission — that's not a plugin system. That's an OS security model for a desktop app. And it's the reason LiquidView can have a community of developers without compromising on data privacy.

→ Next: Chapter 4 — Sync that doesn't trust the server
