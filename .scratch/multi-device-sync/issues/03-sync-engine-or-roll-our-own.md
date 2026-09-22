# 03 — Roll our own sync, or adopt a sync engine?

Type: research
Status: resolved
Blocked by: —
Map: ../map.md

## Question

The map assumes **rolling our own**, on two grounds: near-zero real concurrency, and a learning goal that an engine would hide. That was decided on impression. Validate it against primary sources before it hardens, because it silently decides the merge rule, the local storage layer and half the backend ticket.

Survey the current state of local-first sync for a **small, single-user, two-device, offline-capable web app** — against project documentation and release notes, not blog hearsay:

- **Replicache / Zero**, **ElectricSQL**, **PowerSync**, **Yjs** (and whether a CRDT is proportionate here at all), **Automerge**, and BaaS options with offline support.
- For each: **maturity and licence**, whether it works with a **Vite SPA on Vercel** (many assume a specific framework or a long-lived server), what it **mandates** about local storage, and what it **takes away** — the parts a learner would never see.
- Note the cost of reversal: if rolling our own turns out wrong six months in, how much is thrown away?

Answer the question asked — *is rolling our own still right?* — not merely "here are the options."

## Answer

**Keep rolling our own.** The map's assumption survives — but the sources move the *reason*, which matters, because the reason is what a future reversal gets tested against.

The map argued from near-zero concurrency and the learning goal. Those are the second and third reasons. The first has nothing to do with taste:

> **Every deployable sync engine surveyed needs a long-running stateful server process, and most also need a Postgres with logical replication attached. This app is a static build on Vercel.**

Zero needs a persistent `zero-cache` container; Electric needs an Elixir container and a replication slot (and does **read-path only**, so it never answered this ticket); PowerSync needs a long-running service plus bucket storage. Vercel's WebSocket beta does not rescue any of them — a connection is pinned to a function for its max duration, which is an endpoint, not an always-on stateful server.

**A CRDT is not proportionate.** Neither Yjs's `Y.Array` nor Automerge's list API documents a **move primitive** — so the one genuinely hard merge in this app, `order`, gets no help from the thing that costs the most. Automerge is also 1.14 MB gzipped of WASM.

**The one category that fit the deployment shape — offline-capable BaaS — failed on stability.** InstantDB was the best fit and is **sunsetting** (signups closed, cloud shuts down 2027-08-31). Triplit has ~12 months without commits, is **AGPL-3.0-only**, and has closed its cloud. Replicache is in maintenance mode, superseded by Zero.

**Runner-up, held in reserve: Yjs behind a hand-written stateless HTTP provider.** MIT, 62 KB gzipped, and its update API is documented for commutative blob merge. The researcher flags this as *their inference from Yjs's API, not a Yjs recommendation* — prototype before trusting it.

**Reversal is cheap**: a merge function over a flat array, a pending-write queue and two HTTP endpoints, all behind the existing `storage.ts` seam. Not a data model, not a schema, not a hosting decision.

**This verdict does not license inventing a CRDT.** It rests on the problem being small. If the merge rule starts growing vector clocks, a durable operation log or per-field causality, the premise is gone and this ticket reopens.

**Reopen if**: sharing a list with another person comes back into scope (that exclusion is load-bearing here); the learning goal is met or dropped; the data stops being tiny and flat; hosting stops being Vercel-static; the merge rule grows; or `updatedAt` proves untrustworthy (ticket 05) — in which case the fallback is a **server-assigned version, not a CRDT**.

**Findings**: `.scratch/multi-device-sync/research/03-sync-engines.md` on branch `research/sync-engines` (commit `ef25164`). 740 lines, every claim linked, with an explicit **Gaps** section — read that section before leaning on any single fact.
