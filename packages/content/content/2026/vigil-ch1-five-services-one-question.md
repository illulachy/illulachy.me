---
type: blog
title: "Five services, one question: what does each one own?"
date: March 09, 2026
url: "/blog/vigil-ch1-five-services-one-question"
description: The first architecture mistake is always the same — you build services before you understand ownership. Here's how we decomposed Vigil's five services, and why the message broker is the most important boundary we drew.
tags: ["vigil-devlog", "microservices", "architecture", "postgresql", "istio", "build-in-public"]
category: Engineering
---

The first architecture question is never "how do we build this?" It's "what does each part own?"

Ownership means: this service is the single source of truth for this data. It reads from its own database. Other services ask it, they don't reach past it. When its data changes, it decides whether to notify others, and how.

Without clear ownership, you get: two services writing to the same table (who wins on conflict?), service A reading service B's database directly (now you have two schemas to maintain for one concept), and "we'll sort it out in the API gateway" (you won't).

Vigil has five services. Getting ownership right took three iterations of the architecture. Here's what we ended up with.

---

## The Four Databases

Four databases. One per domain boundary.

**`identity_db`** — owned exclusively by the Identity Service. Contains: users, organizations, projects, deliverable sets, roles, invitations, permission grants, service accounts, API keys. No other service touches this database directly.

**`document_db`** — owned exclusively by the Document Service. Contains: documents (metadata), document versions, chunks (extracted text), chunk embeddings, OCR results, layout analysis, table extractions. No other service touches this database directly.

**`admin_db`** — owned exclusively by the Admin Service. Contains: audit events, electronic signatures, workflow states, review assignments, findings (the output of AI review), finding acknowledgements, sign-off records. The AI Service writes findings here through the Admin Service's API, not directly.

**`analytics_db`** — owned exclusively by the Analytics Service. A read-optimized replica for reporting. The Admin Service publishes events; the Analytics Service projects them into queryable form. Never the source of truth — always a projection.

No service reads another service's database. This is the rule, and we enforced it by putting each database in its own PostgreSQL instance.

---

## The Message Broker Boundary

The most important boundary in the system isn't between services. It's between the document processing pipeline and the AI pipeline.

Here's the sequence:
1. A user uploads a document
2. The Document Service stores the raw file in Azure Blob
3. Document Intelligence extracts the layout, tables, and text
4. The chunks are embedded and indexed
5. **A message is published: "document ready for AI processing"**
6. The AI Service picks up the message and starts the extraction pipeline

Step 5 is the boundary. Before it: document processing (deterministic, fast, cheap). After it: AI processing (probabilistic, slow, expensive).

The boundary exists because:

**Error handling is different.** If OCR fails, we retry with a different model or flag for manual processing. If the AI pipeline fails, we retry with different prompt parameters or fall back to a simpler extraction. These are different retry strategies for different failure modes. The message broker lets each side handle its failures independently.

**Cost accounting is different.** OCR is billed per page. AI extraction is billed per token. We track them separately in the analytics service. The message is the cost boundary.

**Compliance requires it.** The audit trail needs to distinguish "the document was processed" from "AI analysis was run." These are different events for different compliance purposes.

---

## The Istio Layer

Five services talking to each other. Without infrastructure, that's a mess of HTTP clients, timeouts, and retry logic duplicated in every service.

Istio sits in front of all intra-service communication. It handles: mTLS between services (everything encrypted in transit, even inside the cluster), circuit breaking (if the AI service is overloaded, requests fail fast instead of queueing indefinitely), distributed tracing (every request gets a trace ID that spans across service boundaries), and traffic policy (retry configurations, timeout policies).

The result: service code doesn't have retry logic. It doesn't have circuit breaker logic. It doesn't have TLS configuration. All of that lives in Istio policy files. The services make HTTP requests like they're talking to localhost. The mesh handles everything else.

---

## The Audit Trail Centralization

Every significant action in the system produces an audit event. Every audit event ends up in `admin_db`.

This created a problem: the Document Service needed to log "document uploaded" events. The Identity Service needed to log "user invited" events. The AI Service needed to log "extraction started" and "extraction completed" events. But all of these events needed to end up in `admin_db`, which the Admin Service owns.

We could have each service call the Admin Service's API for every event. We did this in v1. It created tight coupling — if the Admin Service was down, document uploads failed.

The solution: the message broker. Each service publishes audit events to a durable topic. The Admin Service consumes the topic and writes to `admin_db`. Services don't need to know whether the Admin Service is up. The audit trail is eventually consistent but guaranteed — the broker guarantees delivery.

The tradeoff: the audit trail has a brief lag. An event published now might appear in `admin_db` 50ms later. For compliance purposes, this is acceptable — the event timestamp is the publish time, not the write time. The audit trail is accurate even if it's slightly delayed.

---

## The Shared Library Problem

Five services. Common concepts across them: user identity, permission checks, audit event schemas, error types.

We built a shared Python library: `vigil-common`. It contained:

- `PermissionChecker` — given a user ID and a resource, returns True/False after checking `identity_db` via the Identity Service API and caching in Redis
- `AuditPublisher` — publishes audit events to the message broker with the correct schema
- Event schemas — Pydantic models for every event type
- Error types — a hierarchy of `VigilError` subclasses with error codes

The library was a good idea until it wasn't. When the Identity Service changed its permission API, we updated `vigil-common`. Then we had to redeploy all five services simultaneously, because they all depended on the same version of the library. A "simple" API change required a coordinated deploy.

The lesson: shared libraries between services that must be deployed independently are coupling through a different channel. The library is not the contract — the API is the contract. We extracted the event schemas (stable) into the shared library and moved the `PermissionChecker` into each service as a client for the Identity Service API (explicit coupling, visible in code).

---

## What We Got Wrong First

The first version of the Admin Service owned too much. It was: the audit trail, the workflow engine, the finding store, the report generator, and the compliance reporting API. One service, five responsibilities.

The finding store was the problem. The AI Service needed to write findings. The Document Service needed to attach findings to document versions. The Identity Service needed to filter findings by user permission. Everyone needed to read from the finding store, but only the AI Service wrote to it — through the Admin Service's API.

This made the Admin Service the bottleneck for every AI pipeline completion. A slow Admin Service write meant a slow AI pipeline. An Admin Service deployment meant an AI pipeline outage window.

We extracted the finding store into a separate `findings` namespace within `admin_db` with a dedicated API surface. The AI Service now writes findings directly to this API, independent of the broader Admin Service audit trail flow.

The audit trail for the finding write still goes through the Admin Service. But the finding itself doesn't wait for the audit trail.

---

## What Came Next

The hardest service to get right wasn't the AI Service. It was Identity. Not because auth is hard — auth patterns are well-understood — but because our first choice of auth provider gave us the wrong abstractions for our user model.

The invitation flow is where it broke first.

---

→ Next: Chapter 2 — The identity layer is never "just auth"
