---
type: blog
title: "Real-time is easy. Real-time at 99.9% uptime is not."
date: April 13, 2026
url: "/blog/vigil-ch6-real-time-at-99-9-uptime"
description: The demo worked on two laptops in two minutes. The production version took three more weeks. Here's what Kubernetes does to WebSocket connections and why we moved to Azure Web PubSub.
tags: ["vigil-devlog", "real-time", "websockets", "azure-web-pubsub", "kubernetes", "presence", "build-in-public"]
category: Engineering
---

The demo worked perfectly. Two laptops, same document, one annotation appearing on both screens within a second. The engineer who built it closed the lid and said: *"Real-time is done."*

The production version of that problem took three more weeks.

---

## The First Instinct: WebSockets on the API Servers

The document service already had HTTP endpoints for everything. Adding WebSocket support to FastAPI is a small change — a `WebSocket` route alongside the REST routes, a connection manager to track active sockets, broadcast calls when something changes.

The flow for collaborative annotation was straightforward: reviewer A submits an annotation via POST, the document service saves it to `document_db`, the connection manager broadcasts the new annotation to all active WebSocket connections for that document. Reviewer B sees it appear.

In development, this works without friction. One server, two clients, one in-memory connection list. The connections don't go anywhere. The broadcasts are immediate. The latency is negligible.

The problem doesn't exist in development because development doesn't have Kubernetes.

---

## What Kubernetes Does to WebSockets

WebSocket connections are long-lived. A client opens a connection when it opens a document and holds it for as long as it stays on the page. In a session measured in minutes or hours, that connection is open continuously.

In a Kubernetes deployment, the application runs across multiple pods — and pods are ephemeral. They restart on deploys, on node pressure, on health check failures, on routine cluster maintenance. A rolling deploy replaces pods one at a time to maintain availability. From the uptime metric's perspective, the service never goes down. From the WebSocket's perspective, the pod holding your connection just terminated.

The naive fix is sticky sessions — route each client back to the same pod for the lifetime of their connection. Kubernetes ingress controllers support this with session affinity headers or cookies.

Sticky sessions solve the routing problem and introduce a scaling problem. If reviewer demand spikes — a large deliverable set, many reviewers working simultaneously — you need more pods. But you can't migrate existing WebSocket connections to new pods. The new capacity can accept new connections. The existing connections are pinned to the old pods, which are now handling disproportionate load. Horizontal scaling only helps new arrivals.

Sticky sessions also undermine the reasoning behind Kubernetes in the first place. Stateless pods that can be added, removed, and replaced freely are the premise. Pinning connection state to specific pods turns each pod into a fragile dependency. You've traded one problem for a smaller version of the monolith.

---

## The Insight: Connection Management Is Infrastructure

The application doesn't need to hold WebSocket connections. It needs to be able to send messages to clients.

These are different responsibilities. Holding connections — managing socket lifecycle, handling reconnects, routing messages across a multi-pod deployment — is infrastructure work. Sending messages based on application events is application work.

If the connection layer is a managed service, the application is stateless. A pod restart doesn't break any connections. Scaling the application adds pods that can send messages immediately, without inheriting any connection state. A rolling deploy is invisible to connected clients.

Azure Web PubSub handles the connection layer. The application talks to it via the Python SDK over HTTP.

---

## Azure Web PubSub

Azure Web PubSub is a fully managed WebSocket service. Clients connect to it directly over a standard WebSocket connection. The application sends messages to connected clients via the Python SDK — a thin HTTP call to the Web PubSub endpoint. The application pods never hold a WebSocket.

This inverts the naive model. The connection layer is infrastructure; the application is stateless. A pod restart doesn't affect any active client connections because no active client connections run through the pods.

The trade-off: the application can no longer receive messages from clients over WebSocket. Any client-to-server communication goes through the standard HTTP REST endpoints. This is not a loss for this architecture — annotation submission, review status updates, presence heartbeats, all of these were already HTTP calls. The WebSocket was only ever server-to-client: pushing updates out when something changed.

Web PubSub fits the actual communication pattern precisely. The application is a message producer, not a connection host.

---

## The Negotiate Flow

The client doesn't connect to a WebSocket endpoint on the application server. It calls a negotiate endpoint first.

`POST /api/realtime/negotiate` — the frontend calls this when it opens a document. The application server uses the Web PubSub Python SDK to generate a client access URL: a signed WebSocket URL that encodes the hub name, the client's group memberships, and an expiry. This URL goes back to the frontend. The client connects directly to Web PubSub using it.

```python
client = WebPubSubServiceClient.from_connection_string(connection_string, hub="review")
token = client.get_client_access_token(
    user_id=str(user.id),
    groups=[f"doc:{document_id}"],
    roles=["webpubsub.joinLeaveGroup", "webpubsub.sendToGroup"]
)
return { "url": token["url"] }
```

The negotiate endpoint is a fast, stateless call. The application is done the moment it returns the URL. What happens over the WebSocket after that is between the client and Web PubSub.

Groups determine who receives what. A reviewer opens document 789 — they join `doc:789`. When the document service processes a new annotation, it sends to the group via the SDK: `client.send_to_group("doc:789", payload, content_type="application/json")`. All clients in that group receive it. The application has no idea how many clients are in the group, or which pods connected them. It doesn't need to.

---

## Presence State

Real-time presence — who is currently viewing this document — is a distinct problem from message delivery.

The connection state lives in Web PubSub. But the *meaning* of a connection — this is reviewer Alice, she is viewing document 789, she has been active for eight minutes — lives in `document_db`. These two sources of truth can drift.

A client connects: the negotiate endpoint registers the presence record in the database, signals all others in the group that Alice is online.

A client disconnects gracefully: the client fires a departure event before closing. The application receives it via a normal HTTP POST, removes the presence record, notifies the group.

A client disconnects ungracefully — browser crash, network drop, closed laptop lid: the departure event doesn't arrive. The presence record in the database still says Alice is online. She isn't.

Azure Web PubSub publishes disconnect events to a webhook endpoint when a client drops. The application's presence handler receives this, looks up the connection ID, removes the associated presence record, and notifies the group. This works reliably for clean disconnects and most network drops.

The failure case is the delayed disconnect: a mobile client that loses signal but hasn't fully closed the TCP connection yet. Web PubSub's connection timeout fires eventually, but "eventually" can be 60 seconds or more. For 60 seconds, Alice appears online in a state she is not in.

The fix: presence heartbeats. The client sends a heartbeat every 30 seconds. If 90 seconds pass without a heartbeat from a connected client, the presence worker marks the record stale and removes it. The disconnect webhook is still the primary signal; the heartbeat timeout is the fallback for the edge cases the webhook misses.

Two mechanisms, the same outcome: presence state in the database eventually converges to the truth of who is actually online.

---

## What 99.9% Actually Requires

99.9% uptime is 8.7 hours of downtime per year, or roughly 43 minutes per month. For a platform serving pharmaceutical review teams with submission deadlines, those 43 minutes are not evenly distributed across low-traffic windows. Downtime at the wrong moment has consequences that outlast the incident.

The WebSocket architecture described at the start of this chapter — connections held in application pods — cannot meet this target under normal Kubernetes operations. Rolling deploys happen multiple times a week. Each one drops connections. Each dropped connection is a degraded experience for an active reviewer.

The Web PubSub architecture doesn't eliminate downtime. It moves the failure surface from the application pods — which restart routinely — to the Web PubSub Service, which is a managed Azure dependency with its own SLA. The SLA for Azure Web PubSub is 99.9%. The application tier's uptime no longer constrains the real-time layer's uptime.

This is the actual lesson: 99.9% for a real-time feature isn't achievable by writing better application code. It requires moving connection state out of the application layer entirely. The infrastructure has to absorb the connection lifecycle so the application can be redeployed freely.

The demo that worked in two minutes on two laptops worked because development has none of these constraints. Production has all of them.

---

→ Next: Chapter 7 — I asked the model to read a pharma table. It did. Mostly.
