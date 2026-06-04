---
type: blog
title: "The terminal UI that thinks it's a browser"
date: March 03, 2026
url: "/blog/tn-ch4-terminal-ui-thinks-its-browser"
description: No CSS. No layout engine. No click events. No hot reload. Just a 2D grid of characters and a keyboard. Here's how we built a real-time streaming agent UI without any of the tools we'd spent years learning.
tags: ["the-terminal-native", "hg", "tui", "solid-js", "opentui", "rendering", "build-in-public"]
category: Engineering
---

The terminal is a 2D grid of characters.

No CSS. No layout engine. No click events. No flexbox. No grid. No z-index. No border-radius. No responsive design. No dev tools. No inspector. No hot reload. No React DevTools. No "just inspect element."

You have a cursor, a keyboard, and 256 colors (more if you're lucky). That's the entire rendering surface for a UI that needs to show: an LLM's streaming output, a real terminal emulator, a file tree, a diff viewer, tool call results, permission dialogs, a command palette, and sub-agent progress — all in one window.

This chapter is about how we built that UI without any of the tools we'd spent years learning.

---

## Why Not Ink

There is a React library for terminal UIs: Ink. It renders React components to stdout using a virtual DOM diffing algorithm. If you know React, you can write a terminal UI.

We tried it. It didn't work for us.

The problem isn't Ink — it's React's rendering model. React's virtual DOM is designed for a browser where layout is free and reconciliation is fast enough. In a terminal, every reconciliation cycle causes a visible flicker because the entire screen gets redrawn. React components re-render in batches. The terminal sees each intermediate state. The result is a flashing, jittery interface that feels worse than a 1990s terminal app.

Ink works well for simple tools — a form, a progress bar, a list. It doesn't work well for a real-time streaming agent interface where every character from the LLM needs to appear on screen without the entire component tree re-rendering.

We needed fine-grained reactivity. Not "diff the virtual DOM and find what changed." Just "this value changed, update this one cell in the character grid."

That's what led us to SolidJS.

---

## Why SolidJS

SolidJS doesn't have a virtual DOM. It compiles JSX into direct DOM mutations — or, in our case, direct framebuffer mutations.

When you write:

```jsx
<div>{count()}</div>
```

SolidJS doesn't create a vDOM node and diff it later. It tracks `count` as a reactive signal. When `count` changes, SolidJS knows exactly which DOM node needs to update and updates it in place. There's no reconciliation. No diffing. No intermediate states. Just the minimal mutation.

In a terminal, this is transformative. Every character cell in the grid can be a reactive signal. When the LLM emits a new token, only the cell at row 10, column 32 needs to update. The rest of the grid stays untouched. No screen flicker. No full redraw. Just a single ANSI escape code updating one character position.

SolidJS's rendering model maps directly to the terminal's rendering model. Signals are cells. Computations are escape codes. Effects are screen writes. There's no translation layer, no overhead, no impedance mismatch.

---

## @opentui: The Bridge

SolidJS connects to the browser DOM out of the box. The terminal doesn't have a DOM. We needed a renderer that could bridge SolidJS components to a terminal framebuffer.

That renderer is `@opentui` — an open source terminal UI framework we built (and later extracted) that compiles SolidJS components into ANSI escape codes.

The rendering pipeline:

```
SolidJS Component (JSX)
  → @opentui/solid render()
    → Renderable tree (Box, Text, ScrollBox, etc.)
      → CliRenderer
        → Framebuffer (2D character grid)
          → ANSI escape codes
            → Terminal
```

The key abstraction is the `Renderable` — a terminal-native layout primitive. `BoxRenderable` handles layout within a rect. `ScrollBoxRenderable` manages scrolling content. `TextRenderable` handles styled text with foreground, background, bold, italic, underline, and strikethrough.

These aren't divs. They're regions of the character grid with explicit positions and dimensions. Layout is done at the renderable level, not by the browser engine. Every cell has a position, a character, and a style. That's the entire layout model.

---

## The Split Pane That Made It Real

The TUI's main view is a split pane: LLM output on the left, PTY terminal on the right. This was the first real test of the rendering model.

The LLM side needs to: display streaming text character by character, render tool call results in real time, show file diffs with syntax highlighting, display sub-agent progress trees.

The PTY side needs to: render a real terminal emulator (not just text output), handle its own cursor and scrolling independently, respond to keyboard input even when the LLM side has focus.

With SolidJS's fine-grained reactivity, each side is an independent reactive subtree. The LLM output view subscribes to `session.text-delta` events. The PTY view subscribes to `pty.output` events. The split pane subscribes to `window.resize` and `user.drag` events. When one changes, the other doesn't re-render. There's no shared state to reconcile.

This works because SolidJS tracks dependencies at the signal level, not the component level. A change to the PTY's cursor position doesn't trigger the LLM output view to re-render.

---

## Keyboard-First, Not Keyboard-Only

Terminal apps are keyboard-first by default. hg's TUI supports: tab switching between split panes, command palette (Cmd+K) for every action, model switching, agent mode toggling (build/plan), plugin commands, slash commands in the input, `vi` keybindings in the terminal pane, and arrow navigation in the file tree.

The keyboard system (`useKeyboard`) maps key sequences to actions. It handles: chorded keybindings (Cmd+K, then K), layered keymaps (insert mode vs. normal mode), plugin-registered keybindings, and pass-through to the PTY when the terminal pane is focused.

All keyboard-navigable. All without a mouse.

---

## What the TUI Can't Do

**No guaranteed mouse support.** Some terminal emulators support mouse events (iTerm2, Kitty, WezTerm). Some don't. Every action must have a keyboard equivalent.

**No standard layout engine.** CSS has 20+ years of layout optimization. The terminal has "put this at coordinates (x, y)." We built layout primitives inside @opentui, but they're nowhere near as capable as CSS.

**No GPU acceleration.** The browser composits layers on the GPU. The terminal writes escape codes to a file descriptor. Every frame is a full write to stdout. At 60fps, that's a 16ms budget for computing the entire character grid, generating all escape codes, and flushing them to the terminal.

**No accessibility for free.** The browser has screen readers, ARIA labels, focus management. The terminal has a character stream.

These constraints shaped every UI decision. When every cell is accounted for, there's no hidden cost.

---

## What Came Next

The TUI could display LLM output, render a terminal emulator, and accept keyboard input. But the terminal emulator in the split pane — the one where the LLM runs commands — wasn't a simple text display. It was a real PTY session.

The LLM needed `bash --login`, `$PS1`, `$TERM=xterm-256color`, `SIGINT`, colored output, and everything else a shell expects when talking to a human. That turned out to be one of the hardest problems we solved.

---

→ Next: Chapter 5 — Giving the LLM a real shell
