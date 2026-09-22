# 10 — Which backend?

Type: research
Status: open
Blocked by: 03, 08
Map: ../map.md

## Question

Pick one. **Do not stand it up** — provisioning is only worth a task ticket if a later decision is genuinely blocked on seeing it run.

Hosting is fixed as **Vercel**, which constrains but does not decide this:

- **Vercel Functions plus a database** (Vercel Postgres/Neon, Upstash, Turso, or similar), or an **external service** the client talks to directly?
- Serverless functions are **stateless and short-lived**. Does the merge rule from ticket 08 need anything that fights that — a long-lived connection, a lock, a transaction spanning requests?
- What are the **free-tier limits**, and what happens when a hobby project quietly exceeds them? This holds one person's only copy of their daily plan.
- **Does the data survive the provider?** There is no other copy. Export matters more than features.
- Cost of reversal: how much of the design is provider-shaped, and how much is portable?

Judge against provider documentation and current pricing pages, not recollection.

## Comments

**2026-09-22, from ticket 06.** The identity decision lands a hard constraint here: **WebAuthn verification on a stateless function.**

The backend must be able to:
- Generate and hold a **challenge** across a two-request ceremony, with a short TTL. Serverless functions keep no state between invocations, so this needs storage, not a variable.
- **Verify a signature** — a WebAuthn server library that runs in whatever runtime is chosen (Node vs Edge matters here).
- Store **public keys and a user handle**, persistently.

What it does **not** need, thanks to ticket 06's revoke-all decision: any device-management API, device naming, or per-credential listing.
