---
type: blog
title: "The AI Engine — Agents, Memory, and the Prompt Loop"
date: April 17, 2026
url: "/opencode-ai-engine"
description: How a single user message in opencode triggers agent selection, a multi-step tool loop, and transparent conversation compaction when history grows too long.
tags: ["opencode", "ai", "agents", "typescript", "llm"]
category: Engineering
---

A single user message in opencode triggers more machinery than it appears. Agent selection reshapes the model, system prompt, and tool set. A multi-step loop runs until the model stops calling tools. When the conversation grows long enough, a hidden agent summarizes the history and the session replays — all transparent to the user.

---

## Part A: Agent Harnessing

### Agent Types

opencode defines agents as **personas**: named configurations that determine which model runs, what tools are available, what the system prompt says, and how aggressively the agent acts.

| Agent        | Mode             | Role                                                |
| ------------ | ---------------- | --------------------------------------------------- |
| `build`      | primary          | Default. Full tool access, can enter/exit plan mode |
| `plan`       | primary          | Read-only. Edit tools denied except plan files      |
| `general`    | subagent         | Multi-step parallel task executor; no TodoWrite     |
| `explore`    | subagent         | Fast codebase navigator; read-only tools only       |
| `compaction` | primary (hidden) | Summarizes conversation history                     |
| `title`      | primary (hidden) | Generates session titles; fixed temperature 0.5     |
| `summary`    | primary (hidden) | Summarizes file diffs and session outcomes          |

Hidden agents are never user-selectable — they're invoked internally by the system.

### Agent Selection Cascade

When a user sends a message, the agent is selected and the execution environment is fully configured from it:

```mermaid
flowchart TD
    msg[User Message]
    msg --> pick{Agent specified?}
    pick -- yes --> agent[Use specified agent]
    pick -- no --> default[Use defaultAgent from config]
    agent --> model{Agent has model override?}
    model -- yes --> agentmodel[Use agent.modelID + providerID]
    model -- no --> lastmodel[Use session's last model]
    agentmodel --> system[Compose system prompt]
    lastmodel --> system
    system --> provider{Which provider?}
    provider -- Anthropic/Claude --> aprompt[PROMPT_ANTHROPIC]
    provider -- GPT-4 --> bprompt[PROMPT_BEAST]
    provider -- Other GPT --> gprompt[PROMPT_GPT]
    provider -- Gemini --> gemprompt[PROMPT_GEMINI]
    aprompt --> envctx[+ environment context\n directory, git status, date, platform]
    bprompt --> envctx
    gprompt --> envctx
    gemprompt --> envctx
    envctx --> skills[+ skill catalog\n if agent allows skill tool]
    skills --> agentprompt[+ agent.prompt override\n e.g. PROMPT_EXPLORE for explore agent]
    agentprompt --> resolve[resolveTools\n filter by agent permission ruleset]
    resolve --> loop[Enter prompt loop]
```

The same `build` agent behaves differently when pointed at Claude vs GPT-4, because the base system prompt adapts to the model's strengths and known quirks. The `explore` agent uses `PROMPT_EXPLORE` — a custom prompt teaching parallel search strategies — layered on top.

### Subagent Sandboxing

`general` and `explore` are `mode: "subagent"` — they're not user-selectable. The parent LLM invokes them via the `task` tool:

```mermaid
sequenceDiagram
    participant Parent as Parent LLM (build agent)
    participant Task as task tool handler
    participant Child as Child Agent (explore)
    participant Stream as Parent message stream

    Parent->>Task: tool call: task { agent: "explore", prompt: "find auth files" }
    Task->>Task: merge permissions: agent defaults + session config
    Task->>Child: SessionPrompt.prompt({ agent: "explore", parentID: messageID })
    Child->>Child: runs in isolation with explore's read-only tool set
    Child-->>Task: returns structured output
    Task->>Stream: inject as ToolPart in parent's message
    Stream-->>Parent: parent sees result inline
```

The child agent runs a full independent prompt loop with its own permission ruleset. Its output is re-injected as a `ToolPart` in the parent's message stream. The parent sees it as a tool result and continues. Neither agent sees the other's internal state — clean separation with no shared mutable state.

The `explore` agent's tool allowlist: `grep`, `glob`, `list`, `bash` (read-only commands only via permission rules), `read`, `webfetch`, `websearch`, `codesearch`. No `edit`, no `write`, no `bash` for destructive operations.

---

## Part B: Session Memory

### The Context Overflow Problem

Language models have a finite context window. A long coding session — with tool outputs, file contents, diffs, and back-and-forth conversation — can easily exceed it. opencode uses three layers of defense:

```mermaid
flowchart TD
    step[Assistant message completes]
    step --> overflow{isOverflow?\n tokens >= limit - 20k buffer}
    overflow -- no --> prune[async prune old tool outputs]
    overflow -- yes --> compact[compaction agent runs]
    prune --> store[store message, continue]
    compact --> summary[generates structured summary]
    summary --> replay{auto-continue\n enabled?}
    replay -- yes --> synthetic[inject synthetic continuation message]
    replay -- no --> wait[wait for user]
    synthetic --> loop[re-enter prompt loop]

    style compact fill:#f96,stroke:#333
    style prune fill:#9f9,stroke:#333
```

### Layer 1: Async Pruning

After each session step, a background pass walks backwards through tool outputs. Once cumulative tool output exceeds `PRUNE_PROTECT` (40,000 tokens), older outputs are cleared:

```
Tool result (10k tokens) → compacted = Date.now()
Future prompts see: "[Old tool result content cleared]"
```

The model loses the verbatim output but retains the fact that the tool ran (the tool call and its metadata remain). This is safe for most tool types — the model can re-run a tool if it needs fresh data.

Protected from pruning: `skill` tool results (they contain instructions the model may still need).

### Layer 2: Compaction + Replay

When `isOverflow()` fires — input tokens plus output tokens plus cache tokens ≥ model limit minus a 20,000-token safety buffer — the `compaction` agent runs:

```mermaid
sequenceDiagram
    participant PromptLoop as Prompt Loop
    participant Compact as SessionCompaction
    participant CompactAgent as compaction agent (hidden)
    participant Session as Session storage

    PromptLoop->>Compact: process({ sessionID, overflow: true })
    Compact->>Session: load all messages
    Compact->>CompactAgent: prompt with PROMPT_COMPACTION\n "Summarize: goal, instructions, discoveries,\n accomplished, relevant files"
    CompactAgent-->>Compact: structured summary text
    Compact->>Session: store CompactionPart in new message\n metadata: summary = true
    Compact->>PromptLoop: "continue" or "stop"
    PromptLoop->>PromptLoop: filterCompacted() — discard pre-compaction history
    PromptLoop->>PromptLoop: re-enter with summary + recent messages only
```

The compaction prompt template asks for: what was the overall goal, what instructions were given, what was discovered, what was accomplished, what files are relevant. The output becomes a `CompactionPart` stored in the session, marked `summary: true`.

### Layer 3: Message Filtering

Before every prompt iteration, `filterCompacted()` determines what actually gets sent to the model:

```mermaid
graph LR
    all[All session messages\n oldest to newest]
    filter[filterCompacted]
    result[Messages sent to LLM]

    all --> filter
    filter --> boundary{Find last compaction\n boundary}
    boundary -- found --> discard[Discard everything before it]
    boundary -- not found --> keep[Keep all messages]
    discard --> keep2[Keep: summary + post-compaction messages]
    keep2 --> result
    keep --> result
```

The logic: walk backwards through messages, find the most recent one where a compaction summary exists AND the immediately prior turn completed successfully. Everything before that point is discarded. The model receives: the summary, then whatever happened after.

A compaction part in the message stream becomes `"What did we do so far?"` when rendered for the LLM — the model naturally explains its context by reading the summary response.

---

## Part C: The Prompt Loop

### The Loop

The core of prompt execution is a `while(true)` loop that runs until the model signals completion with no pending tool calls:

```mermaid
flowchart TD
    enter[Enter loop\n step++]
    enter --> status[set session status = busy]
    status --> msgs[load filtered messages\n filterCompacted]
    msgs --> tools[resolveTools\n build tool map for this step]
    tools --> llm[call LLM\n streamText with messages + tools]
    llm --> stream[stream text tokens + tool calls]
    stream --> toolcalls{pending tool calls?}
    toolcalls -- yes --> dispatch[dispatch tools\n check permissions, run, collect results]
    dispatch --> publish[Bus.publish message.updated]
    publish --> overflow{isOverflow?}
    overflow -- yes --> compact2[run compaction]
    overflow -- no --> enter
    compact2 --> enter
    toolcalls -- no --> finish{model finish reason?}
    finish -- stop/end-turn --> exit[exit loop\n return final message]
    finish -- tool-calls --> dispatch
```

The exit condition is deliberate: the loop only exits when `finish != "tool-calls"` AND there are no pending unexecuted tool calls. This handles models that signal `stop` before all tool results have been processed — the loop re-enters to give the model the remaining results.

### Tool Dispatch

`resolveTools()` builds the tool map before each LLM call. Each tool is wrapped with:

```mermaid
graph LR
    registry[ToolRegistry\n 19 built-in tools]
    mcp[MCP tools\n per instance]
    resolve[resolveTools]
    registry --> resolve
    mcp --> resolve
    resolve --> filter[filter by agent permission ruleset]
    filter --> wrap[wrap each tool]
    wrap --> perm[permission check\n ctx.ask — may suspend]
    wrap --> before[plugin hook: tool.execute.before]
    wrap --> execute[tool.execute\n the actual work]
    wrap --> after[plugin hook: tool.execute.after]
    wrap --> truncate[auto-truncate output\n to fit model context]
```

`ctx.ask()` is particularly interesting: it suspends the tool's Effect on a `Deferred` and publishes a `permission.asked` event to the Bus. The TUI receives this via SSE, shows a dialog, and the user's reply resolves the Deferred. The tool execution resumes — or fails with `RejectedError` if denied.

No polling, no timeouts, no callbacks. Effect's structured concurrency makes "suspend here until the user responds" a one-liner.

### Concurrent Prompt Protection

A session can only have one active prompt at a time:

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> busy: prompt starts\n Runner.ensureRunning
    busy --> idle: prompt finishes\n Runner.onIdle
    busy --> busy: tool dispatch during prompt
    busy --> [*]: error/interrupt → onInterrupt
    busy --> BusyError: second prompt arrives\n runner.busy() throws
```

`SessionRunState` maintains a `Runner` per session. If `runner.busy` is true and a new prompt arrives, it throws `BusyError` immediately — the HTTP 200 or 204 response already went out, so the error surfaces via Bus publish → SSE → TUI toast.

### Async Variant

Route handlers offer two prompt modes:

```
POST /session/:id/message     → waits for completion, returns final message
POST /session/:id/prompt_async → returns 204 immediately, fires and forgets
```

The async variant (`prompt_async`) is used by the TUI when a message is sent: return fast, let the SSE stream deliver progress. If it fails, the error is published as a `session.error` Bus event — the TUI shows it as a toast without blocking.
