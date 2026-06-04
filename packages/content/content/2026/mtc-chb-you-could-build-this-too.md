---
type: blog
title: "You could build this too"
date: March 09, 2026
url: "/blog/mtc-chb-you-could-build-this-too"
description: The knowledge graph is not a technical achievement. It's a philosophical one. Here's the minimum viable architecture for building your own — starting with a single script and a folder called ~/knowledge.
tags: ["memory-that-compounds", "call-to-action", "open-source", "local-first", "build-in-public"]
category: Engineering
---

Every tool I described in this series is open source — Apache 2.0, available now, installable with a single command.

But that's not the point of this chapter. The point is that you could build this yourself. Not because the code is open source, but because the architecture is simple enough to replicate from scratch. The knowledge graph is a folder of Markdown files. The sync engine is a 30-second polling loop. The event system is three directories. The desktop app is a few hundred lines of IPC glue.

The tools we used are free or close to it: TypeScript, Electron, esbuild, Zod, Google API client, MCP SDK.

This chapter is the starter kit.

---

## The Minimum Viable Architecture

If you wanted to build something similar from scratch, you'd need:

**1. A workspace.** A directory on your machine where all data lives. No database setup, no schema migration, no cloud account. Just a folder you control.

**2. A note format.** Markdown with YAML frontmatter. Each file is a "node." The frontmatter contains metadata (tags, date, source). The body contains the content. Wikilinks (`[[Note Name]]`) are edges. You don't need a graph database — you need a parser for `[[wikilinks]]` and a grep for backlinks.

**3. A sync engine.** Pick one source of data — Gmail is the easiest because it's where most knowledge lives. Write a polling loop that checks for new data every 30 seconds. Parse the data into Markdown files in your workspace. Classify each file with a simple LLM prompt: "Is this important or noise?"

**4. An agent runtime.** Give an LLM access to your workspace. Let it read files, search for terms, and write new files. The most useful primitive is the "live note": a file with a `live:` frontmatter block that tells the agent to update it on a schedule.

**5. A chat interface.** The simplest version is a terminal REPL. The next version is a web UI that reads and writes the workspace. Start with the terminal.

That's it. Everything else — events, MCP, IPC, background tasks — is optimization for scale. The core insight doesn't require any of it.

---

## The First Thing to Build

Don't start with the desktop app. Start with a single script that:

1. Reads your Gmail inbox for the last 24 hours
2. Writes each thread as a Markdown file in `~/knowledge/email/<thread-id>.md`
3. Runs an LLM prompt that says: "Summarize anything important I should know"
4. Writes the summary to `~/knowledge/daily/$(date +%Y-%m-%d).md`

This script is maybe 100 lines of TypeScript. Run it once a day. Read the daily note. See if the system knows something you forgot.

If it's useful, expand it. Add calendar sync. Add a chat interface. Add live notes. Add the Electron app. But start with the script. Start with the knowledge that compounds.

---

## The Skills You Need

Building a knowledge system requires skills you already have if you've shipped a web app:

| Skill | Why you need it | What's different |
|---|---|---|
| TypeScript | The entire stack is TypeScript | More Node.js APIs, less DOM |
| Git | Version history for the workspace | Branching as knowledge fork |
| API integration | Gmail, Calendar, MCP | OAuth2 is the hard part |
| Markdown | The data format | YAML frontmatter is the schema |
| LLM prompting | Classification, summarization, agents | System prompts are the architecture |

The skills you don't need:
- Vector databases (the graph lives in wikilinks)
- Kubernetes (there's one user — you)
- Database administration (the filesystem is the database)

---

## The Philosophy

If there's one takeaway from this series: **long-lived knowledge beats per-query retrieval.**

Every AI tool I used before building this forgot who I was between conversations. But knowledge that accumulates — notes that grow as you email, meet, and think — is worth more than any single RAG pipeline.

The knowledge graph is not a technical achievement. It's a philosophical one. It says that the right unit of AI memory is not a vector embedding but a file you can read, edit, and link to other files. It says that the user should own their data, on their machine, in a format that outlasts any single application.

The code is Apache 2.0 and available on GitHub. But you don't need it. You have a terminal, a text editor, and an API key. That's enough to build the first version.

---

## The Start

Open your terminal. Create a directory:

```
mkdir ~/knowledge
```

Pick your first source of data. Write a script that reads it and saves a file. Read the file tomorrow.

That's how every knowledge system starts — with a single file that makes yesterday visible.

---

*Memory That Compounds is published at thegenerativeengineer.substack.com. The code is Apache 2.0 and available on GitHub.*
