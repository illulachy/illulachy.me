---
type: blog
title: "MCP, Composio, and the art of not building integrations"
date: February 16, 2026
url: "/blog/mtc-ch6-mcp-composio-not-building-integrations"
description: Every integration we built was a custom job. The best integration strategy is a protocol someone else already maintains — here's what that actually means in practice.
tags: ["memory-that-compounds", "mcp", "protocols", "composio", "integrations", "architecture", "build-in-public"]
category: Engineering
---

Every integration we built was a custom job.

Gmail sync: OAuth2 with `gmail.readonly` scope, Google API client, history API polling, thread parsing, MIME extraction. Calendar sync: another API client, another OAuth scope, event parsing. Slack: yet another API client, different auth flow, different data model.

Each integration was 300-800 lines of code. Each one broke when Google or Slack changed their API. Each one needed its own error handling, rate limiting, and retry logic.

The insight came late, but it was decisive: the best integration strategy is a protocol someone else already maintains. You don't build connectors. You implement a protocol and let the ecosystem come to you.

That protocol turned out to be MCP — the Model Context Protocol.

---

## The Pre-MCP World

Before MCP, every integration worked the same way:

1. User authenticates via OAuth in a browser window.
2. The app stores the refresh token and scopes.
3. A sync engine polls the API at a fixed interval.
4. New data gets classified, formatted, and written to the knowledge directory.
5. The knowledge graph picks it up on its next rebuild cycle.

This works. But it scales linearly with the number of integrations. Each new service adds an OAuth handler, an API client with auth refresh, a sync engine, a data transformation layer, a classification step, and error handling for rate limits.

We had five integrations. The fifth one took as long to build as the first. We weren't getting faster.

---

## What MCP Changed

MCP defines a standard interface for tools that an LLM can call. The protocol specifies how to discover tools, how to invoke them, how to stream responses, and what transports to use (stdio, SSE, Streamable HTTP).

The MCP module manages a registry of server connections:

```typescript
async function getClient(serverName: string): Promise<Client> {
  const repo = container.resolve<IMcpConfigRepo>('mcpConfigRepo');
  const { mcpServers } = await repo.getConfig();
  const config = mcpServers[serverName];

  let transport;
  if ('command' in config) {
    transport = new StdioClientTransport({
      command: config.command, args: config.args, env: config.env
    });
  } else {
    transport = new StreamableHTTPClientTransport(new URL(config.url));
  }

  const client = new Client({ name: 'rowboatx', version: '1.0.0' });
  await client.connect(transport);
  return client;
}
```

The client supports three transports: **stdio** (for local MCP servers like filesystem tools), **SSE** (for server-sent events), and **Streamable HTTP** (for modern MCP servers). The transport is decided by the server config — the client code doesn't change.

Once connected, the MCP client exposes tools to the agent runtime as if they were native capabilities. The agent doesn't know whether it's calling a local tool or a remote API.

---

## Composio — Managed MCP Connections

Composio entered the stack as a managed layer on top of MCP. Instead of configuring individual MCP servers for each integration, Composio provides a single API endpoint that exposes 200+ integrations as MCP-compatible tools.

Flow:
1. User provides their Composio API key.
2. The app calls `composio:list-toolkits` to show available integrations.
3. User selects integrations (Google Calendar, GitHub, Notion, etc.)
4. `composio:initiate-connection` opens the OAuth flow.
5. Once connected, Composio exposes each integration's tools via its MCP endpoint.

The Composio module is four files: `client.ts` (API wrapper), `repo.ts` (config persistence), `types.ts` (type definitions), and `index.ts` (exports). Total: ~400 lines. That replaced what would have been thousands of lines of bespoke integration code.

The trade-off: Composio is a third-party service. If their API goes down, all integrations stop working. We don't control the tool definitions — if Composio changes a tool's interface, our agent might call it with invalid parameters. And the user has to trust another service with their OAuth tokens.

---

## What MCP Cost

**Latency.** Every MCP tool call goes through the transport layer. A local stdio server adds ~50ms per call. A remote HTTP server adds 200-500ms. Compared to a direct API call, the overhead is significant — especially when the agent chains 5-10 tool calls sequentially.

**Connection state.** The client pool stores connections in memory. If a connection drops (server restart, network error), the next call reconnects lazily. But this means the first call after a crash is slow because it includes connection setup.

**Error opacity.** When an MCP server returns an error, the standard format is a string message. There's no structured error code, no retry hint, no rate-limit header. The agent sees "Internal error" and has to decide whether to retry, abort, or try a different tool.

---

## The Protocol Lesson

MCP taught us something that applies beyond integrations: **protocols are better than APIs for systems that need to evolve independently.**

An API is a contract between two specific services. When one side changes, the other breaks. A protocol is a contract between any two implementations. You can swap the server without changing the client.

The app uses this pattern for more than MCP. The IPC layer is a protocol between the renderer and main process. The event system is a protocol between producers and consumers. The knowledge note format (Markdown with frontmatter) is a protocol between the storage layer and the agent runtime.

Every protocol we adopted has outlasted the API integrations we built custom code for.

---

## The Next Problem

The architecture was stable. The knowledge graph grew. The integrations connected. But four months of relentless building, without tests, without a database, without a second UX pass — the cracks were showing.

Chapter 7 is about building a knowledge tool during Y Combinator: what we thought we were building, what the batch taught us, and what we shipped when the clock ran out.

---

→ Next: Chapter 7 — The YC experience
