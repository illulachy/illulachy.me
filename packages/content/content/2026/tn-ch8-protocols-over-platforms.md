---
type: blog
title: "Protocols over platforms"
date: March 31, 2026
url: "/blog/tn-ch8-protocols-over-platforms"
description: Every platform tries to be extensible. Most fail. We didn't want to build a plugin system nobody would use. The answer was three letters each — LSP, MCP, ACP — and three problems solved by standards that existed before we wrote a line of code.
tags: ["the-terminal-native", "hg", "plugins", "lsp", "mcp", "acp", "protocols", "build-in-public"]
category: Engineering
---

Every platform tries to be extensible. Most fail.

The cycle is predictable: build a core product, add a "plugin API," write documentation, wait for plugins to appear, watch nobody build them, blame the community, abandon the API. A plugin API is a contract you maintain forever. Every version change can break it. Every feature request for the API is work you didn't plan for.

We wanted hg to be extensible. But we didn't want to build a plugin system that nobody would use and we'd have to maintain.

The answer was protocols. Existing protocols that other people already implement, already maintain, already document.

LSP. MCP. ACP. Three letters each, three different problems solved by standards that existed before we wrote a line of code.

---

## LSP: Language Intelligence for Free

The Language Server Protocol is a JSON-RPC protocol that lets editors get code intelligence from language servers. TypeScript has `tsserver`. Rust has `rust-analyzer`. Python has `pyright`. Every language has a server that provides: diagnostics, code actions, hover information, completions, and go-to-definition.

We connected to LSP servers and exposed their capabilities as LLM tools.

When the LLM wants to understand a function, it calls `lsp.hover` with the file and position. The language server returns the function's signature, documentation, and type information.

When the LLM writes code that introduces a type error, the LSP diagnostics tool catches it on the next turn. The LLM sees the error and can fix it. No compile step, no manual review.

When the LLM wants to rename a symbol across the project, it calls `lsp.code-action`. The language server handles the scoping.

This was all free. We didn't write a parser, a type checker, or a linter. We connected to existing language servers and translated their JSON-RPC messages into tool calls.

---

## MCP: External Tools Without Writing Code

The Model Context Protocol is a standard for exposing external capabilities to LLMs. An MCP server declares tools — their names, schemas, and descriptions. An MCP client (like hg) discovers them, presents them to the LLM, and executes them on the LLM's behalf.

MCP let us integrate with hundreds of tools without writing any integration code. We connected to: filesystem servers, database servers (query PostgreSQL, SQLite, MySQL through natural language), API servers, search servers, and custom servers (deploy pipelines, ticket systems, monitoring dashboards).

Every MCP tool becomes available to the LLM through the same tool dispatch system as the built-in tools. The LLM doesn't know the difference between a built-in `bash` tool and an MCP-managed `deploy-to-production` tool.

The integration is ~300 lines of code. The MCP SDK handles the JSON-RPC transport, the capability negotiation, the lifecycle management. We just expose it as a tool registry.

---

## ACP: Editors Using hg as Their AI Backend

The Agent Client Protocol is a JSON-RPC standard for connecting editors to AI agents. An editor (like Zed) implements the ACP client. hg implements the ACP server. The editor sends "user said this" and receives "here's the response" — without either knowing the other's implementation details.

This is the cleanest extensibility pattern we found. Not a plugin API that allows editors to customize hg. A protocol that lets hg be *any* editor's AI backend.

The ACP implementation (`packages/hg/src/acp/`) is ~800 lines. It maps ACP sessions to hg sessions. It translates the editor's "user typed X" into `Session.process(userMessage)`. It translates hg's streaming output into ACP events.

When Zed integrated ACP support, they didn't ask us for anything. They implemented the protocol on their side, we had the server on ours, and it worked on the first connection. That's the power of protocols over platforms.

---

## The Plugin System That Exists Anyway

We did build a plugin system. It's not the main extensibility story, but it exists.

Server plugins register: tool definitions, auth hooks, config transforms, lifecycle hooks, and event hooks.

TUI plugins register: commands in the command palette, routes in the TUI router, UI slots, themes, and keybindings.

The plugin system exists because protocols can't cover everything. Auth hooks are inherently custom — every provider's auth flow is different. UI customizations are inherently local.

But the plugin system is secondary. The protocol integrations are the primary extensibility story. And that's intentional: protocols maintain themselves. Plugin APIs are forever.

---

## What I'd Still Do Differently

Plugin discoverability is unsolved. Plugins are discovered through GitHub repos, word of mouth, and blog posts. This is a solved problem in package managers — we haven't solved it for plugins.

Plugin versioning is immature. We don't have a clear upgrade path when the plugin API changes. Breaking changes in hg could silently break installed plugins.

And the documentation gap between "I want to write a plugin" and "I wrote a working plugin" is too wide. Writing a plugin should be a 30-minute task, not a multiday exploration of the plugin spec.

---

## What Came Next

We had built: a terminal-native TUI, a provider-agnostic LLM abstraction, a client/server architecture, a scoped state system, a session processor with 20+ tools, event-sourced persistence, and protocol-driven extensibility.

The architecture was shipping. Users were using it. The GitHub stars were growing.

At this point, you look at what you built and start seeing everything you'd do differently.

---

→ Next: Chapter 9 — What I'd ship differently
