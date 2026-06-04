---
type: blog
title: "The FIRE calculator that would've been a whole SaaS"
date: May 11, 2026
url: "/blog/lv-ch5-fire-calculator-whole-saas"
description: Monte Carlo simulation, sequence-of-return risk analysis, glidepath modeling, and stress tests — all in pure Rust, running locally on your machine, free. The kind of feature financial advisors charge $500/hour to deliver.
tags: ["the-local-first-accountant", "liquidview", "fire", "monte-carlo", "rust", "financial-planning", "build-in-public"]
category: Engineering
---

The most dangerous question a finance app can answer is "am I on track for retirement?"

Get it wrong and someone makes bad decisions with decades of consequences. Get it right and you've built a product that financial advisors charge $500/hour to deliver. The FIRE (Financial Independence, Retire Early) calculator in LiquidView generates Monte Carlo simulations, analyzes sequence-of-return risk, models glidepath transitions, and stress-tests portfolios against market crashes.

In most finance apps, this would be a premium feature behind a $15/month subscription. In LiquidView, it's a function in a Rust crate that any user can run on their own machine with their own data.

---

## Why Monte Carlo

The naive approach to retirement planning is: "If you have $1M and spend $40k/year, you need a 4% return to break even." This is dangerously wrong because it ignores sequence-of-return risk — the order in which good and bad years happen.

If the market drops 30% in your first year of retirement, your $1M becomes $700k. The 4% withdrawal is now $28k, not $40k. And that $700k has to recover from a lower base. One bad year at the wrong time can break a retirement plan that looks solid on paper.

Monte Carlo simulation handles this by running thousands of possible futures:

```rust
struct MonteCarloConfig {
    num_simulations: u32,      // default: 10,000
    simulation_years: u32,     // default: 30
    withdrawal_rate: f64,      // annual withdrawal as % of portfolio
    asset_allocation: AssetMix, // equity/bond/cash split
    expected_returns: ReturnAssumptions,
    volatility: VolatilityAssumptions,
    inflation: InflationAssumptions,
}
```

Each simulation randomly samples historical return distributions and runs a full 30-year projection:

```rust
fn run_simulation(config: &MonteCarloConfig) -> SimulationResult {
    let mut portfolio = config.initial_balance;
    for year in 0..config.simulation_years {
        let return_rate = sample_return(
            &config.asset_allocation,
            &config.expected_returns,
            &config.volatility,
        );
        portfolio *= (1.0 + return_rate);
        portfolio -= config.annual_withdrawal * (1.0 + config.inflation).powi(year);
        if portfolio <= 0.0 {
            return SimulationResult::ruined_at(year);
        }
    }
    SimulationResult::survived(portfolio)
}
```

Run this 10,000 times and you get a probability distribution. "82.3% chance your portfolio survives 30 years" is a more honest answer than "you'll be fine."

---

## Sequence-of-Return Risk

The Monte Carlo simulation reveals SORR naturally — some paths survive because good returns come first, others fail because bad returns come first. But I wanted to analyze it explicitly:

```rust
struct SORRAnalysis {
    worst_case_order: Vec<f64>,
    best_case_order: Vec<f64>,
    actual_order: Vec<f64>,
    
    worst_case_outcome: f64,
    best_case_outcome: f64,
    actual_outcome: f64,
    
    sorr_risk_score: f64,  // 0.0 - 1.0, higher = more sequence risk
}
```

The risk score measures how sensitive the portfolio is to return ordering. A portfolio with high SORR risk (e.g., high equity allocation with large withdrawals) gets a higher score. The app suggests mitigation strategies: reduce withdrawal rate, shift to bonds, or delay retirement by a year.

---

## Glidepath Modeling

Traditional retirement planning assumes a static asset allocation. Reality is more nuanced — many retirees gradually shift from growth (equities) to preservation (bonds) as they age. This is called a glidepath:

```rust
struct Glidepath {
    phases: Vec<GlidepathPhase>,
}

struct GlidepathPhase {
    start_age: u32,
    end_age: u32,
    equity_pct: f64,
    bond_pct: f64,
    cash_pct: f64,
}
```

A typical glidepath:

| Age range | Equity | Bonds | Cash |
|---|---|---|---|
| 50-60 | 70% | 25% | 5% |
| 60-70 | 55% | 35% | 10% |
| 70-80 | 40% | 45% | 15% |
| 80+ | 30% | 50% | 20% |

The Monte Carlo simulation interpolates between phases linearly, so the allocation shifts gradually rather than jumping at birthday milestones.

---

## Stress Tests

Monte Carlo simulations are probabilistic. Stress tests are deterministic — they answer "what happens if X occurs?":

```rust
enum StressScenario {
    MarketCrash {
        drop_pct: f64,
        recovery_years: u32,
    },
    Stagflation {
        inflation_rate: f64,
        equity_return: f64,
        duration_years: u32,
    },
    EarlyRetirement {
        retire_at: u32,
        years_to_cover: u32,
    },
    Longevity {
        additional_years: u32,
    },
}
```

The app runs the scenario against the user's actual portfolio data and shows the impact:

> **Scenario: 2008-style crash (-40% equities, 3-year recovery)**
> Portfolio value: $1,240,000 → $744,000
> Recovery time: 3.7 years
> Impact on retirement age: +2.3 years
> Probability of recovery within 5 years: 87%

---

## Decision Sensitivity Maps

The most useful output of the FIRE calculator isn't a single number — it's a sensitivity map that shows how changes in inputs affect outcomes:

```
              Annual withdrawal
              $30k   $35k   $40k   $45k
Initial      -------------------------
$800k  |     98.2%  94.1%  82.3%  64.7%
$1M    |     99.1%  97.3%  91.5%  80.2%
$1.2M  |     99.8%  98.9%  96.4%  90.1%
$1.5M  |     99.9%  99.7%  98.8%  95.6%
```

Each cell shows the probability of portfolio survival over 30 years. The user can find their comfort zone — maybe 95%+ is your threshold, maybe 80%+ is acceptable with a flexible withdrawal plan.

---

## What This Enabled

The FIRE calculator is popular. It's the feature that generates the most engagement, the most "I shared this with my financial advisor" emails, and the most feature requests.

But the important thing isn't the calculator itself — it's that the calculator lives in `crates/core/src/portfolio/fire/`, alongside the holdings service, the valuation engine, the performance calculator, and the allocation module. It uses the same portfolio data, the same account structures, the same market data. There's no separate database, no separate UI framework, no separate deployment.

In a SaaS product, this feature would be a separate microservice with its own pricing tier. In LiquidView, it's a directory in a Rust crate that calls the same services as everything else.

---

## The Cost

- **Monte Carlo is slow in debug builds.** 10,000 simulations × 30 years in debug mode takes seconds. Release mode is fast enough to feel instant.
- **The math is harder than it looks.** Correlated return sampling, inflation adjustments, tax considerations — every simplification is a potential complaint from a user who found the edge case.
- **Users trust the number too much.** "This is a simulation based on historical data and your assumptions. It is not a guarantee." The disclaimer is necessary but never sufficient.

---

The FIRE calculator is the feature I'm most proud of — not because it's technically impressive, but because it takes something that financial advisors charge hundreds of dollars for and makes it available to anyone who can run a desktop app.

→ Next: Chapter 6 — The AI that knows your portfolio
