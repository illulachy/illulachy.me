---
type: blog
title: "20 providers, one interface, and 1500 lines of abstraction"
date: February 17, 2026
url: "/blog/tn-ch2-20-providers-one-interface"
description: The simple way to build an AI coding tool is to pick one LLM. We wanted hg to talk to any of them. Here's the 1500 lines of code that make provider-agnostic architecture actually work.
tags: ["the-terminal-native", "hg", "llm", "providers", "abstraction", "build-in-public"]
category: Engineering
---

The simplest way to build an AI coding tool is to pick one LLM and optimize for it.

Claude does structured output well. GPT-4o is fast and cheap. Gemini has the biggest context window. Pick one, build for its strengths, and call it done. Most AI tools do this.

That approach works until it doesn't. A model gets deprecated. A provider changes its pricing. A better model launches and your users can't try it because you're coupled to the old one.

We wanted hg to be the thing you use to talk to *any* LLM — not the thing that forces you into one.

This chapter is about the 1500 lines of code that make that possible.

---

## The Naive Approach

The obvious design: define an interface, have each provider implement it, switch on a config value.

```typescript
interface ModelProvider {
  chat(messages: Message[]): AsyncIterable<Chunk>
}
```

This works for a simple chatbot. It doesn't work for a coding agent that needs tool calling, structured output, streaming, multi-modal input, system prompts, stop sequences, and provider-specific parameters like `thinking_budget` or `reasoning_effort`.

The problem isn't the interface — it's that every provider speaks a different dialect. OpenAI uses `tool_choice`. Anthropic uses `tools` with a different schema. Google uses `function_declarations`. Each one handles streaming differently, errors differently, rate limits differently.

A thin interface over all of them is either too generic to be useful or too leaky to be maintainable.

---

## The Model Database

We took a different approach. Instead of a provider interface, we built a **model database** — a data structure that knows everything about every model:

```typescript
const models = {
  "claude-sonnet-4-20250514": {
    provider: "anthropic",
    capabilities: ["text", "tool_use", "streaming", "thinking"],
    contextWindow: 200_000,
    maxOutput: 8192,
    costPerInputToken: 3,  // per million
    costPerOutputToken: 15,
    supportsSystemPrompt: true,
    supportsParallelToolCalls: true,
  },
  "gpt-4o": {
    provider: "openai",
    capabilities: ["text", "tool_use", "streaming", "vision"],
    contextWindow: 128_000,
    maxOutput: 16384,
    costPerInputToken: 2.5,
    costPerOutputToken: 10,
    supportsSystemPrompt: true,
    supportsParallelToolCalls: true,
  },
  // 300+ more entries
}
```

300+ models, each with costs, capabilities, and limits baked in. This database is the source of truth. When you select a model, the system knows before making a single API call: what this model can do, how much it costs, what its limits are.

The database is also how we handle capability negotiation. If a model doesn't support parallel tool calls, the agent serializes them. If a model has no vision support, the system doesn't send images. If a model's context window is small, compaction kicks in earlier.

---

## The Provider Resolution Layer

The database tells us *what* a model can do. The provider resolution layer tells us *how* to connect to it.

Every provider is a plugin. They're loaded lazily — `import()` at runtime, never loaded until you select that provider. This means the binary doesn't include 20 SDKs; it includes the ones you use.

```typescript
async function resolveProvider(modelName: string): Promise<LanguageModelV3> {
  const model = modelDatabase[modelName]
  const sdk = await import(`@ai-sdk/${model.provider}`)
  const config = await loadProviderConfig(model.provider)
  const auth = await resolveAuth(model.provider, config)

  return sdk.createModel({
    model: modelName,
    ...auth,
    ...config.settings,
  })
}
```

Lazy loading matters because some provider SDKs are heavy. `@ai-sdk/amazon-bedrock` brings in AWS SDK v3. `@ai-sdk/google-vertex` brings in Google Cloud auth. You don't want any of this in memory if you're using Claude.

The resolution layer handles:
- **Auth resolution**: API keys, OAuth tokens, managed identity, plugin auth hooks — each provider has a different auth model
- **Config merging**: Global config → project config → environment variables → managed settings, with cascade
- **Custom loaders**: Azure, Bedrock, GitLab — providers that need special setup beyond what the standard SDK supports
- **Model discovery**: Some providers (like GitLab agent platform) self-describe available models. We query them at runtime.

---

## What Didn't Work

We originally tried to build everything around the Vercel AI SDK's `generateText` and `streamText` utilities. They handle the core LLM interaction well. But coding agents need more: tool execution that interrupts the stream, context window management, parallel tool calls that complete out of order, retry with per-provider backoff strategies.

The AI SDK is an excellent foundation. But building a coding agent on top of it meant writing a lot of code *around* it — wrapping it, extending it, hooking into its internals.

The provider package list grew as we went: `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/mistral`, `@ai-sdk/groq`, `@ai-sdk/azure`, `@ai-sdk/bedrock`, `@ai-sdk/xai`, and more. Each one added a provider, a model, and a new auth path to test.

---

## The Moment It Worked

I was testing an edge case with a user who used hg with Groq (fast inference, limited context). They hit a context window issue. I asked what model they were using. The answer was `llama-3.1-8b-instant`. I looked it up in the database: 8K context, no parallel tool calls, no system prompt.

The compact settings adjusted automatically. The tool dispatcher serialized calls. The session prompt was rewritten to work without a system prompt. The user didn't change any configuration. The system knew what the model could do and adapted.

That's the whole point. The user doesn't think about providers. They think about the task. The abstraction handles the rest.

---

## What Came Next

Provider agnosticism meant we could talk to any LLM. The model database meant we knew what each one could do. But the loop needed a process to live in.

In Chapter 0, I mentioned we chose a client/server architecture. That decision is about to matter in ways we didn't anticipate. The server was supposed to be a small RPC layer for the TUI. It became the backbone of the entire system.

---

→ Next: Chapter 3 — The server that wasn't supposed to be a server
