---
type: blog
title: "The identity layer is never 'just auth'"
date: March 16, 2026
url: "/blog/vigil-ch2-identity-layer-never-just-auth"
description: We started with Entra External ID. We ended with Clerk. The migration taught us that auth providers sell you on login flows and make you pay for invitation flows, permission hierarchies, and organization management.
tags: ["vigil-devlog", "auth", "clerk", "entra-id", "rbac", "redis", "build-in-public"]
category: Engineering
---

Auth providers sell you on the login page.

The login page is the easy part. Credential validation, session management, token issuance — these are solved problems. Every auth provider does them well.

The invitation flow is where they diverge.

In regulated software, users don't sign up. They're invited. A pharmaceutical company has existing employees who need access to specific projects. Those employees don't create accounts — they receive invitations that provision accounts with predefined roles within predefined organizational boundaries. An invitation isn't "click here to register." It's "here is your access, here are your permissions, here are the projects you can see."

We built Vigil on Microsoft Entra External ID (formerly Azure AD B2C) because our target customers were enterprise pharma companies running on Azure. The integration seemed natural. It wasn't.

---

## What Entra External ID Got Wrong for Us

Entra External ID is excellent for consumer-facing apps with enterprise login requirements. It handles: social login, MFA, custom branding, and federation with corporate Active Directory instances.

It is not excellent for B2B SaaS with complex invitation flows and multi-level organizational hierarchy.

The invitation model in Entra: you send an invitation link, the user clicks it, they're provisioned in your directory. Simple, works for most cases.

Our invitation model: a project manager invites a reviewer to a specific project within a specific organization. The reviewer gets access only to that project — not the organization, not other projects. The invitation carries the role grant. When the invitation is accepted, the user account is created with that role grant already applied.

Entra's invitation model doesn't support role grants at invite time. You send the invitation, then after the user accepts, you make a second API call to assign the role. The invitation and the role grant are separate operations. In a regulated system where the audit trail needs "user was granted role X as part of invitation Y," having two separate operations creates a gap in the audit chain.

We worked around this. We maintained a shadow table in `identity_db` that tracked pending invitations and their intended role grants. When a user accepted an Entra invitation, our webhook handler looked up the shadow table and applied the role grant. It worked. It was fragile and hard to audit.

---

## The Migration to Clerk

Clerk's B2B model matched our data model:

- Organizations are first-class objects
- Members have roles within organizations
- Invitations carry role metadata
- The invitation → acceptance → role grant flow is a single atomic operation

The migration was: move user authentication from Entra to Clerk, preserve the existing permission model, shadow the Clerk user IDs against our internal user IDs during the transition.

We ran both systems in parallel for six weeks. Every user had an `entra_oid` (Entra object ID) and, after migration, a `clerk_oid` (Clerk user ID). The Identity Service accepted tokens from both providers, looked up the user by either ID, and returned the same internal user object.

```python
async def resolve_user(token: str) -> User:
    claims = await verify_token(token)  # tries Entra, then Clerk
    
    if claims.issuer == "entra":
        user = await db.find_user_by_entra_oid(claims.sub)
    else:
        user = await db.find_user_by_clerk_oid(claims.sub)
    
    if not user:
        raise UserNotFoundError(claims.sub)
    
    return user
```

After six weeks, all active users had migrated. We cut off Entra token acceptance and removed the migration code. The shadow table remained for audit trail completeness.

---

## The RBAC Hierarchy

Our permission model has three levels:

**Organization** — the pharmaceutical company or CRO. A user can be an org admin, an org member, or have no access.

**Project** — a specific clinical trial or submission package within an organization. A user can be a project manager, a senior reviewer, a reviewer, or have no access. Project roles are inherited from org roles downward (an org admin is implicitly a project manager for all projects in the org).

**Deliverable Set** — a specific document package within a project. A user can be assigned as lead reviewer, co-reviewer, or observer for a specific deliverable set. These are the most granular permissions — they control who can sign off on what.

This creates a three-level hierarchy. Checking permissions naively requires: "is this user an org admin?" + "is this user a project manager?" + "is this user assigned to this deliverable set?" — three database queries for every permission check.

---

## Redis as the Permission Cache

Twenty milliseconds. That's our target for permission checks at p95.

Without caching, a permission check required: verify the JWT (fast), query `identity_db` for org membership (5–10ms), query for project role (5–10ms), query for deliverable set assignment (5–10ms). Total: 15–30ms, before any business logic ran.

With Redis caching:

```python
async def check_permission(
    user_id: str,
    resource: Resource,
    action: Action
) -> bool:
    cache_key = f"perm:{user_id}:{resource.type}:{resource.id}:{action}"
    
    cached = await redis.get(cache_key)
    if cached is not None:
        return cached == "1"
    
    result = await _compute_permission(user_id, resource, action)
    
    ttl = 300  # 5 minutes
    await redis.setex(cache_key, ttl, "1" if result else "0")
    
    return result
```

Permission grants change infrequently (an invitation accepted, a role changed). When they do, we invalidate the relevant cache keys. The TTL is a safety net — even if an invalidation fails, the cache expires within 5 minutes.

The 5-minute window is a known compliance risk. A permission revoked at 10:00 AM might still be exercised by a cached grant until 10:05. We accepted this for performance, documented it in the system validation plan, and added an "invalidate now" admin action for urgent revocations.

---

## M2M Tokens for Service Communication

Services talk to each other. That communication needs to be authenticated — the AI Service calling the Admin Service's findings API needs to prove it's the AI Service, not an external caller.

We use Machine-to-Machine (M2M) tokens. Each service has a client ID and secret. It requests a short-lived token (1 hour TTL) from Clerk's M2M endpoint. That token is passed as a bearer token in intra-service calls.

The Admin Service validates intra-service tokens against a different audience claim than user tokens. A user token with the `ai-service` audience claim is a configuration error, not valid authentication.

This means: service compromise doesn't automatically mean user data compromise. The AI Service's token can call the findings API. It cannot call the user management API, the invitation API, or the signature API. The permission scope is baked into the audience claim.

---

## What the Compliance Audit Cared About

When we went through system validation for our first enterprise customer, the auditors had specific questions about the identity layer:

1. Can a user's access be revoked immediately if needed? → Yes (admin invalidation action + cache expiry)
2. Is every user action attributed to a specific user identity? → Yes (user_id on every audit event)
3. Can an invitation be forged to grant elevated permissions? → No (invitation metadata is server-signed, not client-controlled)
4. What happens when a user's session token expires mid-operation? → The operation fails with a 401, the client re-authenticates, the operation retries. No partial state.

The questions they didn't ask but we answered anyway: What happens if Redis is unavailable during a permission check? (Fall through to `identity_db`, with a latency penalty.) What happens if Clerk is unavailable during login? (Auth fails closed — no access granted — not open.)

Fail closed is the only compliant answer.

---

## What Came Next

With identity solved, we turned to the core value proposition: what does the AI actually do with a clinical document?

The answer is a pipeline. Nine steps, async, with a specific handoff between the AI extraction stage and the Python validation stage.

The handoff is where the interesting architecture lives.

---

→ Next: Chapter 3 — We gave the AI a pipeline, not a prompt
