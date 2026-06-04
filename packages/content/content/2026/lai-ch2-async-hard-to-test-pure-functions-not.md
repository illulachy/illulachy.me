---
type: blog
title: "Async is hard to test. Pure functions are not."
date: June 01, 2026
url: "/blog/lai-ch2-async-hard-to-test-pure-functions-not"
description: The Claude CLI emits 13+ event types across a streaming JSON protocol. The translator that maps them to internal events is the most complex logic in the codebase. Here's how I made it trivially testable.
tags: ["lai", "rust", "testing", "pure-functions", "agentic-ide", "build-in-public", "architecture"]
category: Engineering
---

The translator is the most complex logic in `sc_agent`.

It reads Claude CLI's streaming JSON output and converts it into `ChatEvent` — lai's internal event type. There are 13+ Claude event types. Some are stateful: `content_block_start` opens a block, `content_block_delta` extends it, `content_block_stop` closes it. Thinking blocks work differently from text blocks. Tool calls span multiple events. Error events can arrive mid-stream.

If I built this as an async state machine reading from the PTY, it would be hard to reason about and nearly impossible to test without a real Claude process.

So I didn't. I pulled the translation logic out of the async runtime entirely.

---

## The Pure Translator

```rust
pub fn translate_event(
    state: &mut TranslatorState,
    raw: &Value,
) -> Vec<ChatEvent> {
    // ...
}
```

No async. No I/O. No spawning. Takes a mutable state reference and a raw JSON value, returns a vector of `ChatEvent` values. Everything stateful about the translation — accumulated text, open blocks, pending tool calls — lives in `TranslatorState`. The function is pure in the sense that matters: no side effects, no I/O, deterministic given the same inputs.

The async layer is a thin wrapper:

```rust
while let Some(line) = lines.next().await {
    let raw: Value = serde_json::from_str(&line)?;
    let events = translate_event(&mut state, &raw);
    for event in events {
        broadcaster.send(event)?;
    }
}
```

The async code does one thing: feed lines to the translator and broadcast results. No logic. No state. Swapping the broadcaster or the line source doesn't require touching the translation logic.

---

## 19 Test Fixtures

Testing `translate_event` is trivial:

```rust
#[test]
fn test_text_delta() {
    let mut state = TranslatorState::new();
    
    // Open text block
    let events = translate_event(&mut state, &json!({
        "type": "content_block_start",
        "index": 0,
        "content_block": { "type": "text", "text": "" }
    }));
    assert!(events.is_empty());
    
    // Extend it
    let events = translate_event(&mut state, &json!({
        "type": "content_block_delta",
        "index": 0,
        "delta": { "type": "text_delta", "text": "Hello" }
    }));
    assert_eq!(events.len(), 1);
    assert!(matches!(&events[0], ChatEvent::MessageDelta { text, .. } if text == "Hello"));
}
```

No mocks. No process spawning. No async executor. The test is a few JSON values and some assertions.

I wrote 19 fixtures, covering every Claude event type: text deltas, thinking deltas, tool starts, tool inputs, tool results, stop events, error events, the weird cases where `content_block_stop` arrives before the delta. The full suite runs in milliseconds.

The alternative — testing the async PTY reader with a real Claude process — would make the test suite slow, flaky, and dependent on a working `claude` binary. Some tests would only be writable with real tokens. You'd be testing the network as much as the logic.

Separate the logic. Test the logic.

---

## The Subscriber Race

There's a race condition in the broadcast layer that I hit in integration testing.

The scenario: a new subscriber arrives during an active turn. They want the current snapshot of accumulated text plus all future events.

The naive implementation:

```rust
let snapshot = state.current_snapshot();
// ← subscriber could miss events emitted here
subscriber.send(snapshot);
broadcaster.subscribe(subscriber);
```

If events are emitted between taking the snapshot and subscribing, the subscriber gets a stale snapshot and misses the gap.

The fix: hold the lock across both operations.

```rust
let _guard = broadcast_lock.lock();
let snapshot = state.current_snapshot();
broadcaster.subscribe(subscriber);
drop(_guard);
subscriber.send(snapshot);
```

The subscriber is registered before the lock is released. No events can be emitted between snapshot and subscription. The snapshot is consistent with the subscription point.

The `drop(_guard)` before `subscriber.send(snapshot)` is intentional — we don't want to hold the lock while sending (which might block if the subscriber's buffer is full). We only need the lock to guarantee the snapshot/subscribe atomicity, not for the entire send operation.

---

## Three Error Layers

The error type for the agent bridge went through three iterations before it settled.

The first version was `anyhow::Error` everywhere. Fine for prototyping, unusable for anything that needs to distinguish error types at a call site.

The second version was a flat `AgentError` enum with fifteen variants. The match arms were getting long. Error handling in HTTP handlers was a wall of pattern matching.

The final version is a three-layer model:

**`AppBridgeError`** — the rich internal error type. All variants, full context, used inside the agent crate.

**`proto::ApiError`** — a protocol error with a code and message. `AppBridgeError` converts into this. Loses detail, gains serializability.

**`StatusCode`** — the HTTP response code. `proto::ApiError` converts into this for the Axum handler.

```rust
// Handler
async fn chat_start(/* ... */) -> Result<Json<proto::StartResponse>, StatusCode> {
    bridge.start_turn(req)
        .await
        .map(Json)
        .map_err(|e| proto::ApiError::from(e).status_code())
}
```

The handler only sees `StatusCode`. The proto layer only sees `proto::ApiError`. The bridge only sees `AppBridgeError`. Each layer knows exactly what it needs to know.

The three-layer model is more code than `anyhow`. It pays for itself when you're debugging a 500 and need to trace the error from HTTP status back through the proto layer to the original cause — because the conversion chain is explicit, and so is what each layer preserves.

---

The translator works. The tests run in milliseconds. The errors are traceable.

What doesn't work yet: cancellation. Specifically, what happens when the user cancels a turn mid-stream — and the race between the kill signal, the watchdog, and the cancel request.

→ Next: Chapter 3 — How to cancel a running AI turn (and why zombie processes have opinions about it)
