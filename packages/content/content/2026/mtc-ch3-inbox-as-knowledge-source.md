---
type: blog
title: "Your inbox as a knowledge source"
date: January 26, 2026
url: "/blog/mtc-ch3-inbox-as-knowledge-source"
description: Email is the most valuable knowledge source you have. It's also the most polluted. Here's the 30-second loop that turned a firehose into structured knowledge.
tags: ["memory-that-compounds", "gmail", "sync", "classification", "email", "knowledge-graph", "build-in-public"]
category: Engineering
---

Email is the most valuable knowledge source you have. It's also the most polluted.

Every thread in your inbox is a structured data source with people, dates, decisions, and commitments. But it's buried under newsletters, marketing blasts, automated notifications, receipts, spam, and the 47 "unsubscribe here" footers that every vendor sends you.

A knowledge graph built from email is only as good as the signal-to-noise ratio of the pipeline feeding it. If one newsletter-to-person relationship leaks in, the graph starts linking the wrong entities.

The first time I ran the sync against my own inbox, the graph grew by 400 nodes in an hour. About 300 of them were noise.

This chapter is about the 30-second loop that turned that firehose into structured knowledge.

---

## The Sync Engine

Gmail sync runs as a service with a simple `while (true)` loop, sleeping 30 seconds between cycles:

```
while (true) {
    if (hasCredentials) {
        await performSync();
    }
    await interruptibleSleep(30000);
}
```

The `interruptibleSleep` pattern is worth noting — it exposes a `triggerSync()` function that resolves the sleep promise immediately, so the graph builder or any other service can say "I just saw something happen, wake up and check now."

Each sync cycle uses Gmail's history API to fetch only what's changed since the last check:

1. Load the stored `historyId` from `sync_state.json`.
2. Call `users.history.list` with that history ID. Returns a list of changes — messages added, labels changed, threads modified.
3. Filter out SPAM and TRASH.
4. Collect unique thread IDs.
5. For each thread, call `users.threads.get` to fetch the full conversation.
6. Parse each message's MIME structure: extract text body (or convert HTML to Markdown via `NodeHtmlMarkdown`).
7. Write the thread as a Markdown file to `gmail_sync/{threadId}.md`.
8. Simultaneously build a structured snapshot in `inbox_lists/{threadId}.json` for the inbox UI.

If the Google API returns 404, the history ID has expired. The system falls back to a full sync, re-fetching all threads from the last 7 days.

---

## Three-Phase Signal Extraction

Each email thread goes through three phases before it enters the knowledge graph:

**Phase 1: Fetch and parse.** The Gmail API returns raw MIME. We extract the text body (preferring `text/plain` over HTML, using `NodeHtmlMarkdown` for the latter). Inline images referenced by CID are fetched via the attachments API and embedded as data URLs so the thread preview renders without Gmail's proxy.

**Phase 2: Classify.** The parsed thread is sent to an LLM classifier with a Zod schema that produces exactly one of two labels: `important` or `other`. The classification prompt is specific:

```
important: real human correspondence (customer, investor, team, vendor,
candidate); time-sensitive notifications; anything worth referencing
later (contracts, pricing, deadlines, decisions).

other: newsletters, industry digests, marketing, product tips from
vendors, automated notifications, transactional confirmations,
unsolicited cold outreach.
```

The classifier also reads the user's upcoming 7 days of calendar events to handle scheduling-related threads, and reads an optional email style guide from `knowledge/Agent Notes/style/email.md` to match the user's tone when drafting replies.

This is the only call to an LLM per thread.

**Phase 3: Graph ingest.** The classified thread file lives in `gmail_sync/`. The graph builder's 15-second loop picks it up when the file appears. Before the LLM agent sees it, a fast filter check runs: if the email's frontmatter contains a noise label (e.g., `cold-outreach`, `spam`, `notification`, `receipt`, `newsletter-digest`), the file is marked as processed and skipped.

The filter pass is not redundant with the classifier. The classifier labels a thread for the inbox UI. The noise tags govern whether the email enters the knowledge graph at all. These are different decisions.

---

## The Inbox as Two Views

The classification powers the inbox UI.

The app renders the inbox in two sections: **Important** and **Everything Else**. Each is a paginated list of threads, sorted newest-first, backed by the local `inbox_lists/` cache. The cursor-based pagination is entirely local — no Gmail API calls for the inbox view.

The user can move between sections. This was a deliberate design choice: we didn't want to hide the "other" classification behind a filter because the classifier is sometimes wrong. A thread about a contract update might get classified as `other` if the email address is a vendor's automated domain. The user needs to see it, correct the classification, and the correction persists.

---

## The Style Guide Feed

The email classifier has an unusual feature: it reads a Markdown file in the knowledge directory called `email.md` and uses it as a writing style guide for draft replies.

This file lives in `knowledge/Agent Notes/style/email.md`. It's a standard knowledge note — the user writes it once, or the LLM generates it by analyzing 50 sent emails. The style guide includes things like:

- Sign-off convention ("Best" vs "Thanks" vs nothing)
- Whether to use emoji
- How to structure action items in replies
- Whether to bottom-post or top-post

When the classifier drafts a reply, it reads this file and adjusts its output. Draft replies look like they came from the user, not from a generic AI model.

This revealed something important: the knowledge graph isn't just for structured data. It's also the right place for the system's configuration and style preferences — because they're files the user can read and edit.

---

## The 400-Node Noise Wake-Up

The first sync produced 400 graph nodes, 300 of which were noise:

- Every "You have a new voicemail" notification created a person note for the caller.
- Every LinkedIn connection request email created a note for the requester.
- Every GitHub issue notification created a project note for each repository.
- Every "Your meeting has been cancelled" email created a note about a cancelled meeting.

We fixed it by expanding the tag system to 12 noise categories and making the filter pass run *before* the agent. The principle: the graph should err on the side of missing a real connection rather than including a false one. A graph with omissions is still useful. A graph with hallucinations is not trustworthy.

The noise tags are files — `tag_system.ts` defines them, and the user can add their own.

---

## What the Sync Costs

**Google API quota.** The Gmail API allows 250 quota units per user per second. A history sync cycle consumes roughly 70-100 units — well within quota.

**LLM credits.** Each thread classification costs one LLM call. At 50 threads per cycle, that's roughly $0.15-0.50 per sync depending on the model.

**Storage.** Threads average 2-5 KB of useful text. A year of email at 10,000 threads is roughly 50 MB. Negligible.

The real cost isn't any of these. It's the cost of a bad classification. A business-critical email misclassified as `other` and buried in the "Everything Else" tab is worse than no sync at all.

---

## The Next Problem

The sync pipeline worked. Email flowed in, threads were classified, the graph grew. But all of this happened in a folder of files that needed a desktop app to make sense of.

Chapter 4 is about building an Electron app in the age of the web: why we chose it, what it cost, and how pnpm symlinks nearly killed the build.

---

→ Next: Chapter 4 — Building an Electron app in the age of the web
