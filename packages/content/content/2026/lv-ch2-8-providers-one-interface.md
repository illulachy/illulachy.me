---
type: blog
title: "8 providers, one interface: the market data chain"
date: April 20, 2026
url: "/blog/lv-ch2-8-providers-one-interface"
description: Yahoo Finance rate-limits. Alpha Vantage is slow. Every API fails eventually. Here's how I built a market data chain with circuit breakers and automatic failover so users never see an error.
tags: ["the-local-first-accountant", "liquidview", "market-data", "rust", "circuit-breaker", "chain-of-responsibility", "build-in-public"]
category: Engineering
---

Every personal finance app needs stock prices. The problem is that every stock price API wants you to pick one provider and trust it forever.

Yahoo Finance has rate limits. Alpha Vantage has a free tier that's aggressively slow. Finnhub charges after 100 calls a day. Boerse Frankfurt only covers German exchanges. And every single one of them will, at some point, return a 429, a 503, or a garbage response that looks like data but isn't.

I didn't want to pick one. I wanted a system where you throw an instrument at it and it comes back with a price, no matter which provider has to serve it.

This is the story of how I built a market data abstraction that chains 8 providers together with circuit breakers, rate limiters, and automatic failover — all in Rust.

---

## The Provider Interface

Every provider implements the same trait:

```rust
#[async_trait]
pub trait MarketDataProvider: Send + Sync {
    async fn get_latest_quote(&self, instrument: &ProviderInstrument) -> Result<Quote>;
    async fn get_historical_quotes(&self, instrument: &ProviderInstrument, range: &Range)
        -> Result<Vec<Quote>>;
    async fn search(&self, query: &str) -> Result<Vec<SearchResult>>;
    async fn get_profile(&self, instrument: &ProviderInstrument) -> Result<AssetProfile>;
    async fn get_splits(&self, instrument: &ProviderInstrument) -> Result<Vec<SplitEvent>>;
    async fn get_dividends(&self, instrument: &ProviderInstrument) -> Result<Vec<DividendEvent>>;
}
```

Each provider returns `ProviderCapabilities` — a description of what it can do, its rate limits, and its priority:

```rust
pub struct ProviderCapabilities {
    pub supports_historical: bool,
    pub supports_search: bool,
    pub supports_profile: bool,
    pub supports_dividends: bool,
    pub supports_splits: bool,
    pub rate_limit: RateLimit,
    pub priority: u32,
}
```

Lower priority number = tried first. Yahoo Finance is priority 10. Alpha Vantage is priority 20. The Fixture provider (test data) is priority 100.

---

## The Resolver Chain

Before you can ask a provider for a price, you need to know what symbol that provider expects. Apple is `AAPL` on Yahoo Finance, but on Boerse Frankfurt it's `APC.DE` (or is it `APC.F`? depends on the exchange). OpenFigi has a different identifier entirely.

The resolver chain handles this. It takes a canonical `InstrumentId` and converts it to whatever format each provider needs:

```
InstrumentId → ResolverChain → ProviderInstrument → Provider
```

There are three resolver types:
- **`SymbolResolver`** — maps canonical symbols to provider-specific symbols
- **`RulesResolver`** — applies exchange suffix rules (e.g., `.DE` for German exchanges on Yahoo)
- **`AssetResolver`** — maps asset profiles to provider-specific instrument types

The Yahoo resolver has its own exchange map:

```rust
struct YahooExchangeMap {
    // LSE stocks use .L suffix
    // TSX stocks use .TO suffix
    // Frankfurt uses .DE and .F depending on exchange
    // And none of this applies to ETFs, which have different rules
    map: HashMap<String, String>,
}
```

This was the part I got wrong three times before I got it right. The first version hardcoded Yahoo Finance symbols. The second version had a config file. The third version — the one that shipped — resolves symbols dynamically based on the instrument's exchange, type, and the provider's capabilities.

---

## The Registry and Circuit Breaker

Providers live in a `ProviderRegistry` that wraps each one with:

```rust
pub struct ProviderRegistry {
    providers: Vec<Box<dyn MarketDataProvider>>,
    circuit_breakers: HashMap<String, CircuitBreaker>,
    rate_limiters: HashMap<String, RateLimiter>,
    validators: HashMap<String, QuoteValidator>,
}
```

A **circuit breaker** tracks consecutive failures. After 3 failures, the provider is marked as "open" — no requests are sent to it for 60 seconds. After 60 seconds, it transitions to "half-open" — one request is tried. If it succeeds, the circuit closes. If it fails, the breaker stays open for another 60 seconds (with exponential backoff up to 5 minutes).

```rust
struct CircuitBreaker {
    failures: AtomicU32,
    last_failure: AtomicI64,
    state: AtomicU8,  // 0=closed, 1=half-open, 2=open
    timeout_ms: u64,
    max_failures: u32,
}
```

A **rate limiter** tracks calls per provider. Yahoo Finance allows 200 calls per minute for unauthenticated requests. Alpha Vantage allows 5 calls per minute on the free tier. Each rate limiter has a sliding window of timestamps.

A **quote validator** checks that the returned data is reasonable:

```rust
struct QuoteValidator {
    max_price: f64,      // $1M — anything above is suspicious
    min_price: f64,      // $0.0001 — anything below is likely an error
    max_change_pct: f64, // 1000% daily change — probably bad data
    require_volume: bool,// Some providers return price but no volume
}
```

When a provider returns a quote with a price of $0.00 or a daily change of 9000%, the validator rejects it and the chain tries the next provider.

---

## The Query Flow

Here's what happens when the user opens their portfolio and LiquidView needs 20 current prices:

1. The `MarketDataService` receives 20 `InstrumentId` values.
2. For each instrument, it asks the `ResolverChain` for the appropriate `ProviderInstrument` for each provider.
3. It queries providers in priority order: Yahoo Finance first, then Alpha Vantage, then Finnhub, etc.
4. If a provider has an open circuit breaker or is rate-limited, it's skipped.
5. The first provider to return a valid quote wins.
6. The quote is cached in SQLite for 15 minutes (real-time) or 24 hours (historical).
7. Failed providers get their circuit breaker incremented.

The result: a user in Europe with German stocks gets prices from Yahoo Finance (if available), falls back to Boerse Frankfurt (if the stock trades there), falls back to Alpha Vantage (if nothing else works). The system never shows "price unavailable" unless every provider has failed.

---

## The Provider Implementations

There are 8 providers, each in its own module:

| Provider | Coverage | Free tier | Priority |
|---|---|---|---|
| Yahoo Finance | Global | 200 calls/min | 10 |
| Alpha Vantage | Global | 5 calls/min | 20 |
| Finnhub | Global | 100 calls/day | 30 |
| Boerse Frankfurt | European | Unlimited | 40 |
| OpenFigi | Instrument resolution only | Unlimited | 50 |
| MetalPriceAPI | Precious metals | 100 calls/month | 60 |
| MarketDataApp | Global | 100 calls/day | 70 |
| US Treasury Calc | US Treasuries | Unlimited | 80 |

Each one has its own HTTP client, its own response parsing, its own error handling. The `Fixture` provider (priority 100) returns test data for development — no network calls needed.

The implementations range from straightforward (Yahoo Finance) to painful (Boerse Frankfurt, which returns XML in a custom schema with German field names through an API that looks like it was built in 2008).

---

## What This Enabled

The provider chain made two things possible that would have been dealbreakers otherwise:

**1. No API key required.** The app works out of the box with Yahoo Finance's free tier. Users who want better coverage can add their own Alpha Vantage or Finnhub keys. The app doesn't ship with a built-in API key that can be rate-limited.

**2. Custom scraper providers.** Users can write their own market data providers using the custom scraper system. If you have a brokerage that provides a REST API, or a spreadsheet you update manually, you can plug it into the chain as a provider. The trait is public; anyone can implement it.

The chain-of-responsibility pattern means there's no single point of failure. When Yahoo Finance rate-limits you (and it will), the app moves to the next provider transparently. The user sees a price, not an error.

---

I spent more time on the market data system than on any other single feature. It's the most "product" part of the architecture — the user doesn't care which provider served the price, they just want to see their portfolio value. The abstraction is the product.

The next chapter is about the addon system — how LiquidView lets third-party developers build extensions that run inside a desktop app without compromising security.

→ Next: Chapter 3 — The addon system with a security scanner
