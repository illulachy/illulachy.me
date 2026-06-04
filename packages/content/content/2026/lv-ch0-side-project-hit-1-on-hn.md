---
type: blog
title: "The side project that hit #1 on HN and became a platform"
date: April 06, 2026
url: "/blog/lv-ch0-side-project-hit-1-on-hn"
description: I built a personal finance tracker because I was tired of giving my bank credentials to SaaS companies. It hit #1 on Hacker News and Product Hunt in the same week. This is what happened next.
tags: ["the-local-first-accountant", "liquidview", "local-first", "tauri", "rust", "hn-launch", "build-in-public"]
category: Engineering
---

I built a personal finance tracker because I was tired of giving my bank credentials to SaaS companies.

Every app in 2024 wanted the same thing: your read-only API key, your Plaid login, your monthly subscription. They'd pull your transactions, store them on their servers, sell you insights derived from your own data, and charge you $15/month for the privilege. The business model was "your data is the product" — and you were paying for the extraction.

I wanted something that stored everything in a SQLite file on my machine. One file. No cloud. No subscription. No API key to a startup that might pivot next quarter.

So I built it. As a side project. Over weekends.

Then it hit #1 on Hacker News and Product Hunt in the same week, and suddenly I wasn't building a side project anymore.

---

## The First Version

The initial prototype was a Tauri app with Rust backend and a React frontend. I chose Tauri because I wanted a native desktop app without Electron's memory footprint — a personal finance app sits open on your desktop all day, and I didn't want it consuming 300MB just to render a dashboard.

The first version had three features: track holdings, see your portfolio value, record transactions. That was it. No market data, no charts, no retirement planning, no AI assistant. Just a SQLite database and a React table.

It took about three months of weekends to get it to something I'd let myself use with real money.

---

## The Launch

I posted it to Hacker News on a Tuesday morning, expecting maybe 50 upvotes and a few polite "interesting project" comments.

It hit the front page in two hours. Number one by lunch. The GitHub repo went from 0 to 2,000 stars that day. By the end of the week, it was at 5,000. Product Hunt featured it and it won Product of the Day.

The comments were a mix of "finally, a finance app that doesn't want my data" and "why would I trust a side project with my finances?" — both fair. The HN thread surfaced exactly the tension that makes this project interesting: local-first means you own your data, but it also means you own your backups, your security, your disaster recovery. There's no "we'll handle that" — there's only SQLite and the Rust you write.

People wanted more. Market data. Charts. Multiple currencies. Retirement planning. An AI they could ask about their portfolio. An addon system so the community could build features I hadn't thought of.

I spent the next year building all of it.

---

## The Architecture That Emerged

What started as a single Tauri app became a multi-crate Rust workspace with a shared TypeScript frontend, two runtime targets (desktop Tauri and web Axum), eight market data providers, an E2EE device sync engine, a FIRE calculator with Monte Carlo simulation, an AI assistant with tool-calling, and an addon system with permission scanning at install time.

I didn't plan any of this. Each feature was a response to a real need that emerged from real users. The architecture wasn't designed upfront — it was carved by the problems that mattered.

This series is the story of those problems and what I built to solve them.

---

## The Road Ahead

**Chapter 1 — One codebase, two runtimes.** How the adapter pattern lets the same business logic run on Tauri desktop and Axum web server. The `invoke()` abstraction that routes to either IPC or REST. Why I chose this over maintaining two apps.

**Chapter 2 — 8 providers, one interface.** The market data provider chain. Yahoo Finance, Alpha Vantage, Finnhub, Boerse Frankfurt, and more — tried in priority order with circuit breakers, rate limiting, and automatic failover. Provider-agnostic design for a problem that's full of edge cases.

**Chapter 3 — The addon system with a security scanner.** Permission analysis at install time. A TypeScript SDK for third-party developers. Dynamic route registration. How to make a desktop app extensible without compromising security.

**Chapter 4 — Sync that doesn't trust the server.** X25519 ECDH, HKDF key derivation, XChaCha20-Poly1305 authenticated encryption. End-to-end sync where the server never sees your financial data.

**Chapter 5 — The FIRE calculator that would've been a whole SaaS.** Monte Carlo simulation, sequence-of-return risk, glidepath modeling, stress tests. Financial math in pure Rust.

**Chapters 6 through 9** cover the AI assistant, the SQLite write actor, the spending module, and the retrospective.

---

I didn't set out to build a platform. I set out to build a finance tracker that respected my data. The platform was what happened when other people wanted the same thing and started asking for features I hadn't imagined.

The next chapter is about the architectural decision that made all of this possible: the adapter pattern that lets one codebase run on two runtimes without duplicating business logic.
