---
type: blog
title: "Permissions are a graph. We stored them like a list."
date: April 06, 2026
url: "/blog/vigil-ch5-permissions-are-a-graph"
description: The flat user_roles table worked until it didn't. The permission model has three levels of inheritance — org, project, deliverable set — and a list can't represent containment. Here's how we fixed it.
tags: ["vigil-devlog", "rbac", "permissions", "graph", "redis", "caching", "architecture", "build-in-public"]
category: Engineering
---

The permission check is one of the most frequent operations in the platform. Every protected endpoint, every document fetch, every annotation thread — before the response goes out, the platform needs to answer one question: is this user allowed to do this?

The naive answer to "how do you store permissions" is a table. A user, a role, a resource. One row per assignment. Simple to reason about. Simple to query. Simple to get wrong at scale.

---

## The First Model

Early schema: `user_roles(user_id, role, resource_type, resource_id)`.

A project lead gets a row: `(user_123, 'project_lead', 'project', project_456)`. A reviewer gets a row for each deliverable set they're assigned to. An org admin gets a single row at the org level.

Checking permissions: `SELECT role FROM user_roles WHERE user_id = ? AND resource_id = ?`. One query. Fast.

The problem surfaces the first time someone checks whether an org admin can access a specific deliverable set.

The org admin doesn't have a row for that deliverable set. They have a row for the org. The query returns nothing. Access denied.

Fix one: when assigning an org-level role, also write rows for every resource below it. Materialise the inheritance. This works until a new deliverable set is created — it gets added to the project, but the org admin's permissions don't automatically propagate. Manual backfill required.

Fix two: check at every level in the query. `WHERE resource_id IN (deliverable_set_id, project_id, org_id)`. This requires knowing the full hierarchy chain at query time, which means a join or a separate lookup before the permission check happens.

Both fixes are managing the same underlying problem: the data model doesn't match the structure of the problem.

---

## The Structure of the Problem

The permission model has three levels of scope: organisation → project → deliverable set. A role at a higher level grants access to everything below it.

That's not a list structure. It's a tree — a containment hierarchy. Each deliverable set belongs to a project. Each project belongs to an organisation. Access flows downward through the containment edges.

The flat `user_roles` table treats this as a set of independent assignments. It has no model of the hierarchy. Any query that needs to respect inheritance has to reconstruct the hierarchy from scratch, or the application carries it, or you materialise all inherited assignments in the database.

Materialised inheritance has a specific failure mode: every time a deliverable set is added to a project, you need to backfill all users with project-level roles. Every role change cascades into bulk writes. The write path gets complicated in proportion to how many assignments exist — which grows as the organisation grows. At ten organisations, it's manageable. At one hundred, it becomes a background job that has to run reliably, transactionally, and without racing against concurrent role changes.

The model that fits the problem is the hierarchy itself.

---

## Modelling the Graph

The schema that replaced the flat table has two parts.

**Role assignments** stay sparse: `(user_id, role, scope_type, scope_id)`. A user holds a role within a scope — an organisation, a project, or a deliverable set. Most users have one or two assignments. Even org admins have one row.

**The hierarchy** is explicit: organisations contain projects, projects contain deliverable sets. Each layer has a foreign key to its parent. The containment structure lives in the database, not in application code.

The `PermissionChecker` uses both:

1. Given a user and a resource, resolve the resource's *scope chain* — the path from the resource up through the hierarchy to the organisation.
2. Check whether the user has any role assignment at any node in that chain.
3. If yes, evaluate whether that role grants the requested permission.

The scope chain for a deliverable set is three nodes: the deliverable set, its project, its organisation. The permission check is: does this user have a relevant role at any of these three nodes? That's a lookup against a sparse assignment table with a small, known key set. It's fast. And it's correct regardless of whether the user was assigned at the org, project, or deliverable set level — the check covers all three without special-casing any of them.

---

## The Cache Architecture

With 10,000 concurrent sessions and permission checks on every hot-path request, the database cannot be in the loop.

Two caches, with different TTLs, for different reasons.

**The hierarchy cache** stores the scope chain for each resource: given a deliverable set ID, what is the path up to the organisation? This is stable. A deliverable set doesn't move between projects. A project doesn't move between organisations. TTL: one hour. In steady state, the cache hit rate for hierarchy lookups is near 100%.

**The permission cache** stores the resolved result for a specific `(user, resource, action)` triple. This is volatile — a role change should propagate within minutes. TTL: five minutes. Fast enough to absorb high traffic. Short enough that a permission change is visible quickly.

Separating them makes invalidation tractable. A role change at the project level invalidates the permission cache entries for that user across all resources in the project. It doesn't touch the hierarchy cache — the structure of the project hasn't changed, only who has access to it.

A structural change — a deliverable set moved into a different project — invalidates the hierarchy cache entries for the affected resources and all permission results that depended on those scope chains. In practice, structural changes are rare. Role changes are more frequent. The cache design reflects the actual mutation pattern.

Performance targets: permission checks under 20ms at p95 for warm cache hits, under 50ms for cold misses. Cache hit rate above 95%.

---

## The Cross-Service Problem

The hierarchy and permission caches live in Redis. The `PermissionChecker` is a shared library deployed to each service.

The write path is in the identity service. When an admin assigns a role, the identity service writes to `identity_db`, publishes a `RoleUpdatedEvent` to the event bus, and the Redis consumer updates the cache. Services that need to check permissions never call the identity service directly — they hit Redis.

The problem this doesn't fully solve on its own: cache invalidation across services when the hierarchy changes.

If a deliverable set is reassigned to a different project, every service that has cached permission results for resources inside that deliverable set now has stale data. The invalidation event has to reach all of them. The event bus handles delivery. But the Redis consumer in each service has to know which keys to purge — and that logic depends on understanding the hierarchy.

The `PermissionChecker` library carries the invalidation logic. Same codebase, same cache key conventions, deployed to every service. A hierarchy change event triggers the same invalidation walk in each service simultaneously. The set of affected cache keys is computable from the event itself.

Getting this right took longer than the permission model did. A unit test covering the happy path doesn't catch the case where a project-level role change fails to invalidate a downstream deliverable set cache in a different service. That failure is silent: the user sees stale permissions until the TTL expires, with no error and no log.

The fix was integration tests exercising the full invalidation path across services — role change event in, verify stale entries are purged, verify fresh checks return the correct result. Not glamorous. Necessary.

---

## What the Graph Model Buys

The flat table was simpler to write. The graph model is simpler to reason about.

With the flat table, the inheritance logic lived in application code — scattered across services, inconsistently maintained, tested in isolation. When a new service needed permission checks, it had to reimplement the inheritance logic or copy it from somewhere.

With the hierarchy model and the shared `PermissionChecker`, the logic is in one place. A new service imports the library. The scope chain walk is the same. The cache keys are the same. The invalidation behaviour is the same.

The insight in retrospect: the flat model forced every query to re-encode the hierarchy. The graph model encodes the hierarchy once — in the data — and every query is simpler for it.

"RBAC is a graph problem pretending to be a list" is the summary. The pretending is what creates the complexity. We stopped pretending.

---

→ Next: Chapter 6 — Real-time is easy. Real-time at 99.9% uptime is not.
