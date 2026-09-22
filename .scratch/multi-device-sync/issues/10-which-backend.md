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
