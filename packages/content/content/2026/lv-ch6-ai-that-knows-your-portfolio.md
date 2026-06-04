---
type: blog
title: "The AI that knows your portfolio"
date: May 18, 2026
url: "/blog/lv-ch6-ai-that-knows-your-portfolio"
description: The AI assistant uses rig-core and tool-calling to query real portfolio data without sending your financial information to any cloud. Local models, no cloud, no data leakage.
tags: ["the-local-first-accountant", "liquidview", "ai", "rig-core", "tool-calling", "llm", "local-ai", "build-in-public"]
category: Engineering
---

The AI assistant in LiquidView can answer questions like "how much did I pay in fees last year?" and "what's my most concentrated holding?" and "should I rebalance my portfolio?"

It can do this without sending your financial data to OpenAI or Anthropic or any cloud LLM provider. It's powered by `rig-core` — a Rust LLM framework — and uses tool-calling to let the model query the same internal APIs the app uses. The model never sees your raw data. It sees function signatures, return schemas, and the results of those functions.

This was the feature I was most skeptical about. I'm still skeptical. But it works well enough that I use it daily.

---

## Why Not Just Use ChatGPT

Every AI finance chatbot I've tried follows the same pattern: you paste your portfolio into a text box, the app sends it to an LLM API, and the model generates analysis. This is bad for three reasons:

1. **Your portfolio goes to a third-party server.** The privacy promise of LiquidView — "your data never leaves your machine" — is broken the first time you ask the AI a question.
2. **The model doesn't know your actual data.** It knows what you pasted. If your portfolio has 50 holdings across 8 accounts, you're not pasting it. You're summarizing it, and the summary misses the details.
3. **Hallucination is baked in.** Ask ChatGPT "what's my most concentrated position?" and it will make up a number because it doesn't have access to your data. It's not trying to be wrong — it's trying to be helpful, which is worse.

The solution is to give the model tool access to the actual application data, not the raw data itself.

---

## Tool-Calling with rig-core

`rig-core` is a Rust LLM framework — an LLM programming model. You define tools as Rust functions:

```rust
#[tool]
async fn get_portfolio_summary(account_id: Option<String>) -> Result<PortfolioSummary, ToolError> {
    let service = PortfolioService::new();
    service.summary(account_id).await.map_err(ToolError::from)
}

#[tool]
async fn get_holding_concentration(min_pct: f64) -> Result<Vec<ConcentrationRow>, ToolError> {
    let service = PortfolioService::new();
    service.concentration(min_pct).await.map_err(ToolError::from)
}

#[tool]
async fn get_fee_analysis(year: i32) -> Result<FeeSummary, ToolError> {
    let service = ActivityService::new();
    service.fees_for_year(year).await.map_err(ToolError::from)
}
```

Each tool has a name, description, typed input schema, and typed output schema. rig-core generates the JSON schema for each tool and sends it to the LLM as part of the system prompt. The model decides which tool to call based on the user's question.

---

## The Agent Loop

When a user asks a question, the agent loop runs:

```rust
async fn chat(message: &str, context: &ChatContext) -> Result<Answer> {
    let agent = rig::agent::AgentBuilder::new()
        .model(context.model.clone())
        .preamble(SYSTEM_PROMPT)
        .tool(get_portfolio_summary)
        .tool(get_holding_concentration)
        .tool(get_fee_analysis)
        .tool(get_rebalance_suggestions)
        .build();

    let response = agent.prompt(message).await?;
    Ok(Answer::new(response))
}
```

The system prompt is explicit about what the agent should and should not do:

```
You are a financial analysis assistant with tool access to the user's
portfolio data. You can query holdings, balances, fees, and market data.

Rules:
- NEVER invent data. If a tool returns empty, say "I couldn't find data."
- NEVER make assumptions about the user's financial situation beyond
  what the tools return.
- If you're unsure, say "I don't have enough data to answer that."
- Cite your sources: "According to your portfolio summary..."
- Do not give financial advice. Present data and let the user decide.
```

The model doesn't see your account numbers, your holding names, or your transaction history. It sees the return value of `get_portfolio_summary()` — a structured JSON object with aggregate data like total value, allocation percentages, and fee totals.

---

## Local Models

The assistant works with local LLMs (via llama.cpp, Ollama, or the `rig-llama` backend):

```rust
fn local_model() -> impl Model {
    rig::providers::llama::Client::new()
        .model("llama-3-8b-instruct")
        .build()
}
```

Local models are slower and less capable than GPT-4. But they never leave your machine. For the privacy-conscious user, a local model that answers "your portfolio is worth $124,500" correctly 90% of the time is preferable to GPT-4 that answers it correctly 99% of the time but sends your data to a server.

And for users who don't care about privacy, the assistant works with remote providers too — OpenAI, Anthropic, Groq — all through the same rig-core abstraction.

---

## What This Enabled

The AI assistant turned LiquidView from a "look at my portfolio" app into a "ask anything about my finances" app. The most common queries:

- "What did I pay in fees this year?" — the fee analysis tool
- "Should I rebalance?" — the rebalance suggestions tool
- "How much do I have in international stocks?" — the allocation drill-down tool
- "Show me my top 5 holdings" — the concentration analysis tool

None of these require the user to navigate menus, find the right chart, or export data to a spreadsheet. They just ask.

---

## The Cost

- **Tool-calling is unpredictable.** The model doesn't always call the right tool. Sometimes it calls `get_portfolio_summary` when it should call `get_fee_analysis`.
- **rig-core is evolving.** Breaking changes between versions have broken the assistant twice. I pin the version in Cargo.toml and test against upgrades.
- **Local models are slow.** A query that takes 2 seconds with GPT-4 takes 15 seconds with a local 8B model. Streaming helps the perception of speed, but it's still not instant.
- **The hallucination risk never goes to zero.** The system prompt helps, the tool schemas help, the structured outputs help. But LLMs are stochastic. The system is designed to minimize this, not eliminate it.

---

I built the AI assistant because I wanted to be able to ask "how much did I pay in fees last year?" without clicking through five screens. The fact that it works with local models and never exposes your data to a third party is the real feature.

→ Next: Chapter 7 — The write actor: ~50 lines that make SQLite concurrent
