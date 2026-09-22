# Research — Roll our own sync, or adopt a sync engine?

Ticket: [`issues/03-sync-engine-or-roll-our-own.md`](../issues/03-sync-engine-or-roll-our-own.md)
Map: [`map.md`](../map.md)
Researched: 2026-09-22. Version and licence facts were verified against
`registry.npmjs.org`, the GitHub API, and each project's own repository and
documentation on that date. Every factual claim below carries the link it came
from. Where a claim is my inference from evidence rather than something a source
states, it says so; the "Gaps" section lists what I could not verify at all.

---

## Verdict

**Yes — keep rolling our own. The map's working assumption survives contact with
the sources, but not for the reason the map gave.**

The map justified rolling our own on *near-zero concurrency* and *the learning
goal*. Those are real, but they are the second and third reasons. The first is
blunter and does not depend on taste at all:

> **Every deployable sync engine in this survey requires a long-running stateful
> server process, and most also require a Postgres with logical replication
> attached to it. This app is a static build on Vercel.**

Zero needs `zero-cache` — a persistent container with a disk
([deployment](https://zero.rocicorp.dev/docs/deployment)). Electric needs an
Elixir container with a persistent filesystem
([deployment](https://electric.ax/docs/guides/deployment)). PowerSync needs a
long-running service plus a bucket-storage database
([architecture](https://docs.powersync.com/architecture/powersync-service)).
Automerge's only official network adapters are websocket, MessageChannel and
BroadcastChannel
([networking](https://automerge.org/docs/reference/repositories/networking/)).
Yjs's providers need a persistent websocket server
([y-websocket](https://docs.yjs.dev/ecosystem/connection-provider/y-websocket)).
None of these is a Vercel Function. Adopting one does not simplify the project; it
adds a second thing to operate, of a kind the map explicitly put out of scope
("learning a backend framework"), and it *still* leaves the app with the tickets it
was trying to avoid.

*(One genuine exception, handled in full below: Yjs's **core** update API is
documented for stateless blob exchange, so Yjs-the-library could work here behind a
provider we write ourselves. That is the strongest alternative in this document and
it is beaten on merit, not filtered out.)*

Four further findings sharpen this:

1. **Electric does not solve the problem being asked about.** Its own docs say
   "Electric does read-path sync… **Electric does not do write-path sync**"
   ([writes guide](https://electric.ax/docs/guides/writes)). Adopting Electric
   would leave ticket 08 — the merge rule — exactly where it is today, while
   adding a Postgres and a container.
2. **Replicache is in maintenance mode** and its vendor says to leave: "Existing
   users should migrate to Zero as they are able"
   ([replicache.dev](https://replicache.dev/)). It is, contrary to the common
   claim, now Apache-2.0 and free — see its section, which corrects that.
3. **A CRDT is not proportionate here, and is actively wrong for `order`.**
   See "Is a CRDT proportionate?" below.
4. **The most fitting product in the whole survey is shutting down.** InstantDB —
   Apache-2.0, offline-by-default, vanilla-JS friendly, needs no server of ours —
   announced its sunset: "New signups are closed" and "On August 31st, 2027, all
   cloud apps will shut down" ([pricing](https://www.instantdb.com/pricing)).
   Triplit, the next nearest, has not shipped in fourteen months and has closed
   its cloud to new users.

**The honest counter-argument.** One category *does* fit the deployment shape: a
hosted, offline-capable BaaS talked to directly from a static SPA. These need no
server of ours at all, and if the goal were "ship a two-device todo list this
weekend," one of them would be the right answer and this document would end
differently. Three things rule them out here:

- **The category is less stable than it looks.** Of the six surveyed, one is
  sunsetting (InstantDB), one is stalled with its cloud closed (Triplit), and one
  has no offline story at all (Supabase). That leaves Firestore, a paid
  account-based service (Dexie Cloud), and a pre-1.0 project (Jazz).
- **They are account-shaped where the map is not.** Auth here is "one secret, one
  person"; these products are built around users, sign-in and per-user
  authorisation. Bending them to a single shared secret is extra work, not saved
  work. *(I did not verify each product's minimum viable auth path — this is a
  shape objection, not a measured one.)*
- **They take away precisely the syllabus.** The map's learning target is "the
  web platform: service workers, IndexedDB, WebAuthn, online/offline." Every one
  of these owns the IndexedDB layer, the pending-write queue, the retry/backoff,
  and the online/offline transition. A learner adopting one would never see any of
  it. That is the whole cost, and here it is a deciding one.

**And the reversal is cheap.** The thing being written is roughly: a merge
function over a flat array, a pending-write queue, and two HTTP endpoints. If in
six months it proves wrong, what is thrown away is a few hundred lines behind an
existing seam (`storage.ts`), not a data model, not a schema, and not a hosting
decision. See "Cost of reversal."

### What this verdict does *not* license

It does not license inventing a CRDT. The reason rolling our own is right is that
the problem is small; if the design starts growing vector clocks and operation
logs, the premise has been abandoned and this decision should be reopened.

---

## Verified status table

`latest` dist-tag, publish date and declared licence queried from
`registry.npmjs.org` on 2026-09-22.

| Project | Package | `latest` | Published | Licence | Fits static Vite SPA on Vercel? |
|---|---|---|---|---|---|
| **Replicache** | `replicache` | 15.3.0 | **2025-07-02** | Apache-2.0 in repo; npm metadata still says `roci.dev/terms.html` | **No — maintenance mode**, vendor says migrate to Zero |
| **Zero** | `@rocicorp/zero` | 1.9.0 | 2026-08-14 | Apache-2.0 | **No** — needs long-running `zero-cache` + Postgres logical replication + persistent disk |
| **Electric** | `@electric-sql/client` | 1.5.28 | 2026-09-09 | Apache-2.0 | **No** — Elixir container + persistent dir + logical replication. *And does not do write-path sync at all.* |
| **PowerSync** | `@powersync/web` | 2.4.0 | 2026-09-21 | Client Apache-2.0; **service FSL-1.1-ALv2** (source-available) | **No** — long-running service + CDC + bucket-storage DB |
| **Yjs** | `yjs` | 13.6.32 | 2026-08-04 | MIT | **Yes, uniquely** — core update API is documented for stateless blob merge; but every official *provider* needs a persistent server |
| — persistence | `y-indexeddb` | 9.0.12 | **2023-11-02** | MIT | Official offline provider; repo last pushed 2025-02-12 |
| **Automerge** | `@automerge/automerge` | 3.5.0 | 2026-09-16 | MIT | **No** — sync protocol is stateful and multi-round-trip; 1.14 MB gzipped WASM |
| — sync layer | `@automerge/automerge-repo` | 2.6.0-alpha.3 | 2026-08-07 | MIT | `latest` tag points at an **alpha**; last plain-stable 2.5.6 (2026-05-18) |
| **Supabase** | `@supabase/supabase-js` | — | — | Apache-2.0 (platform) | Yes as a database — but **zero offline pages in 2,795 doc URLs** |
| **Firestore** | `firebase` | — | — | Apache-2.0 (SDK) | **Yes** — offline is opt-in on web; old enable API deprecated |
| **InstantDB** | `@instantdb/core` | 1.0.67 | 2026-08-31 | Apache-2.0 | **Was the best fit — now SUNSETTING.** Signups closed; cloud shuts down 2027-08-31 |
| **Triplit** | `@triplit/client` | 1.0.50 | **2025-07-31** | **AGPL-3.0-only** | Stalled — ~12 months no commits; **Cloud closed to new users** |
| *(not in ticket)* **Dexie Cloud** | `dexie-cloud-addon` | 4.4.15 | 2026-09-09 | Apache-2.0 (addon); server commercial | **Yes** — but paid hosted server, accounts required |
| *(not in ticket)* **Jazz** | `jazz-tools` | 0.20.19 | 2026-07-03 | MIT | **Yes** — but pre-1.0 |

The licence column reconciles the npm `license` field with the repository
`LICENSE`. Those two disagree for **Replicache** (repo is Apache-2.0, published
package metadata is stale) and are split by component for **PowerSync** (client
Apache-2.0, service FSL). Both are explained in their sections.

---

## The deployment filter, stated once

Vercel Functions are the only compute this project has. Two properties matter:

- **Max duration on Hobby is 300s**, and there is no persistent process between
  invocations ([Vercel Functions
  limits](https://vercel.com/docs/functions/limitations)).
- **WebSockets exist but do not change this.** Vercel put WebSocket support into
  public beta on 2026-06-22 ([changelog](https://vercel.com/changelog/websocket-support-is-now-in-public-beta)),
  and the KB notes a connection is "pinned to a Function for its maximum
  duration" and recommends "using Redis from the Vercel Marketplace" for
  "durable state across WebSocket connections"
  ([KB](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)).
  That is a websocket *endpoint*, not an always-on stateful sync server. A Yjs
  room or a `zero-cache` view-syncer cannot live there.

So any engine whose server is "a process that stays up and holds state" is out —
unless we pay for that engine's hosted cloud, which swaps the operational cost
for a vendor and a bill, and in Zero's and Electric's cases *still* requires a
Postgres we would also have to run.

---

## Replicache — maintenance mode, superseded by Zero

This one needed correcting mid-research. The commonly repeated claim that
Replicache is proprietary and requires a licence key **is out of date.**

- **It is now Apache-2.0 and free.** Rocicorp's own site says: "We have
  open-sourced the code", "no longer charge for its use", that Replicache is "now
  in maintenance mode", and that "Existing users should migrate to Zero as they
  are able" ([replicache.dev](https://replicache.dev/)). The source now lives in
  the Zero monorepo and
  [`packages/replicache/package.json`](https://github.com/rocicorp/mono/blob/main/packages/replicache/package.json)
  declares `"license": "Apache-2.0"`, under the repo's Apache 2.0
  [`LICENSE`](https://github.com/rocicorp/mono/blob/main/LICENSE).
- **No licence key.** The source marks the option dead: "`@deprecated` Replicache
  no longer uses a license key. This option is now ignored and will be removed in
  a future release."
  ([replicache-options.ts](https://github.com/rocicorp/mono/blob/main/packages/replicache/src/replicache-options.ts))
- **But the published artifact disagrees with the repository.** `replicache@15.3.0`
  on npm was last published **2025-07-02** and its `license` field still reads the
  URL `https://roci.dev/terms.html` (npm packument, queried 2026-09-22), and
  [those terms](https://rocicorp.dev/terms) still say "Using Replicache requires
  acquiring a license key by agreeing to these Terms of Service". That is a stale
  package, not a live restriction — but anyone doing a licence audit from npm
  metadata alone would reach the wrong conclusion, and that is worth knowing.
- **The standalone repo is archived**: "This repository was archived by the owner
  on Jun 10, 2026. It is now read-only."
  ([github.com/rocicorp/replicache](https://github.com/rocicorp/replicache)) By
  then it was only an issue tracker; the code had moved.

**Verdict: excluded, but on maintenance status rather than licence.** The vendor
itself says to migrate to Zero. Starting a new project in 2026 on a package in
maintenance mode, last published over a year ago, whose author points elsewhere,
is not defensible — and Zero, the thing it points to, is excluded below for
reasons Replicache would share anyway.

---

## Zero — mature, free, and the wrong shape

- **GA.** "As of March 2026, Zero is generally available and fully-supported"
  ([status](https://zero.rocicorp.dev/docs/status)). Latest `@rocicorp/zero` is
  1.9.0, 2026-08-14.
- **Apache-2.0.** "the Zero client and server are Apache-2 licensed", and the
  page states "we have no plans to ever change the licensing of the core product"
  ([open source](https://zero.rocicorp.dev/docs/open-source)). The
  `rocicorp/mono` `LICENSE` is the Apache License 2.0
  ([LICENSE](https://github.com/rocicorp/mono/blob/main/LICENSE)). This is a
  genuinely good licence position — the problem is not the licence.
- **What it mandates operationally.** `zero-cache` is "one or more view-syncers:
  serving client queries using a SQLite replica" plus "one replication-manager:
  bridge between the Postgres replication stream and view-syncers". It requires
  Postgres with `wal_level=logical`, a direct (non-pgbouncer) replication
  connection, and a persistent volume for the SQLite replica at
  `ZERO_REPLICA_FILE`. The named deployment targets are Docker Compose, Fly.io,
  SST (AWS), Kubernetes and container registries
  ([deployment](https://zero.rocicorp.dev/docs/deployment)). Vercel is not among
  them, and the requirements explain why.
- **Lit is not the obstacle.** Zero "has first-class support for React and
  SolidJS, and there is also a low-level API you can use in any TypeScript-based
  project" ([install](https://zero.rocicorp.dev/docs/install)). The reactive path
  for a non-React UI is `zero.materialize(query)` plus `view.addListener(...)`
  ([queries](https://zero.rocicorp.dev/docs/queries)). There is no official Lit
  binding, so you would write a small adapter — which is entirely reasonable.
  **Zero's exclusion here is about infrastructure, not frameworks.**
- **One nuance worth keeping.** Our own endpoints *can* be serverless: "The API
  behind `ZERO_QUERY_URL` and `ZERO_MUTATE_URL` can live anywhere zero-cache can
  reach" ([self-host](https://zero.rocicorp.dev/docs/self-host)). It is
  `zero-cache` itself that cannot be.
- **The hosted escape hatch is not free.** Cloud Zero is listed at $30/mo (Hobby),
  $300/mo (Professional) and $1000/mo+ AWS (BYOC), with no free tier
  ([zero.rocicorp.dev](https://zero.rocicorp.dev/)).
- **What it takes away.** The local store, the query layer, the mutation queue,
  the rebase-on-authoritative-result loop, and the transport. That is most of the
  syllabus in one dependency.

**Verdict: excluded on deployment shape.** Zero is the strongest engine in the
survey on maturity and licence, and it would be a serious candidate for a
different project. Here it means running two long-lived services, or paying
$30/mo, to synchronise about thirty rows.

---

## Electric — read-path only, so it does not answer this ticket

- The project now serves from `electric.ax`; `electric-sql.com` 301-redirects
  there (observed 2026-09-22).
- **Scope, in its own words:** "Electric does read-path sync. It syncs data
  out-of Postgres, into local apps and services. **Electric does not do write-path
  sync.** It doesn't provide (or prescribe) a built-in solution for getting data
  back into Postgres from local apps and services."
  ([writes guide](https://electric.ax/docs/guides/writes))
- The writes guide describes four patterns the *developer* implements: online
  writes, optimistic state, shared persistent optimistic state, and through-the-
  database sync (which requires embedding PGlite locally). Offline write support
  begins at pattern 2 and is full only at pattern 4
  ([writes guide](https://electric.ax/docs/guides/writes)).
- **Operationally:** "The Electric sync engine is an Elixir web service, packaged
  using Docker"; "Postgres must have logical replication enabled"; and the
  `ELECTRIC_STORAGE_DIR` contents "must survive sync service's restarts". Named
  targets are AWS, GCP, Digital Ocean, Fly.io and Render
  ([deployment](https://electric.ax/docs/guides/deployment)).
- **It also needs a backend of ours for auth**, not only for writes: "production
  applications should proxy Electric requests through your backend API rather than
  exposing Electric directly to clients"
  ([HTTP API](https://electric.ax/docs/api/http)), with proxy-auth and
  gatekeeper-auth patterns both requiring our own infrastructure
  ([auth](https://electric.ax/docs/guides/auth)).
- **Electric Cloud hosts the sync service — not your Postgres.** You still supply a
  Postgres with logical replication. Pricing is usage-based: PAYG at $0/month plus
  "$1 per 1M writes" and "$0.10 per GB·month", with monthly bills under $5 waived;
  Pro $249/month; Scale $1,999/month ([pricing](https://electric.ax/pricing)).
- **The product has repositioned.** The homepage headline is now "The agent
  platform built on sync" ([electric.ax](https://electric.ax)), with Postgres Sync
  one primitive among several. Whatever that means for the roadmap, it is not a
  project aimed at two-device todo lists.
- `@electric-sql/client` is Apache-2.0, 1.5.28, 2026-09-09 (npm).

**Verdict: excluded.** This is the sharpest finding in the survey. Adopting
Electric would mean running a Postgres, an Elixir container and an auth proxy *and
then still writing our own merge rule and pending-write queue* — all the work of
rolling our own plus all the work of operating an engine. Note also that the
earlier ElectricSQL — the one with bidirectional active-active replication into
local SQLite that people remember — is not what the current product is.

---

## PowerSync — closest to "an engine that does offline properly," and still out

- **Client SDK is Apache-2.0** (`powersync-js` `LICENSE` is the Apache License
  2.0, and `@powersync/web@2.4.0` declares Apache-2.0 — npm, 2026-09-21).
- **The service is not OSS.** `powersync-service/LICENSE` is the **Functional
  Source License, Version 1.1, ALv2 Future License (FSL-1.1-ALv2)**, Copyright
  2023-2026 Journey Mobile, Inc. It grants use "for any Permitted Purpose", where
  "A Permitted Purpose is any purpose other than a Competing Use"
  ([LICENSE](https://github.com/powersync-ja/powersync-service/blob/main/LICENSE)).
  For a personal todo app this restriction is irrelevant in practice — but it is
  a source-available licence, not an open-source one, and the table should say so.
- **Operationally:** the service is a long-running component requiring change
  data capture ("Postgres logical replication, MongoDB change streams, the MySQL
  binlog, SQL Server Change Data Capture, or Convex document deltas") and a
  bucket-storage database — "MongoDB and Postgres are currently supported as
  bucket storage databases"
  ([architecture](https://docs.powersync.com/architecture/powersync-service)).
  Also requires a role with `REPLICATION` and `BYPASSRLS` and a publication named
  `powersync` ([database setup](https://docs.powersync.com/installation/database-setup)).
- **What it mandates locally:** SQLite in the browser, non-negotiably. "App
  clients always read data from the client-side SQLite database, regardless of
  whether the user is online or offline"
  ([client architecture](https://docs.powersync.com/architecture/client-architecture)).
  The web SDK runs wa-sqlite with a selectable VFS — IndexedDB is the default, with
  OPFS variants available
  ([web SDK reference](https://docs.powersync.com/client-sdks/reference/javascript-web)).
  You also declare a client-side SQLite schema, i.e. a second schema maintained
  alongside the server's.
- **Lit is fine.** `@powersync/web` is the framework-agnostic core; the React, Vue
  and Nuxt packages are optional add-ons (same reference page).
- **Cloud does not rescue it.** PowerSync Cloud's Free tier is $0 with "Up to 2 GB
  data synced / month" and "Up to 500 MB of data hosted", Pro from $49/month — and
  "Free projects are deactivated after 1 week of inactivity"
  ([pricing](https://www.powersync.com/pricing)). A todo list that goes quiet over
  a holiday is exactly the profile that policy targets.
- **And it still does not write for you.** "The Client SDK processes the upload
  queue by invoking an `uploadData()` function that you define when you integrate
  the Client SDK", which should "call your backend application API to persist the
  mutations to the backend source database"
  ([client architecture](https://docs.powersync.com/architecture/client-architecture)).

**Verdict: excluded on deployment shape and disproportion.** Source database + CDC
+ bucket-storage database + long-running service + a second local schema + *our own
write API anyway*, for one flat array of about thirty rows.

---

## Is a CRDT proportionate? — No

Worth answering on its own, because "just use a CRDT" is the common reflex. It is
also where the deployment filter stops being decisive, so this section has to win
on merit.

**First, an important correction to the blanket claim above: Yjs is the one
library in this survey that genuinely can sync over stateless HTTP.** Its core
update API is documented for exactly that. "Document updates are *commutative,
associative,* and *idempotent*. This means that you can apply them in any order and
multiple times", and "It is possible to sync clients and compute delta updates
without loading the Yjs document to memory", via `Y.mergeUpdates`,
`Y.encodeStateVectorFromUpdate` and `Y.diffUpdate`
([document updates](https://docs.yjs.dev/api/document-updates)). A Vercel Function
could store one binary blob and answer with a diff, never instantiating a `Y.Doc`.
The docs never say the word "serverless" — that application is mine — but the
mechanism is theirs and it is fully specified.

So the real runner-up to rolling our own is not an engine at all. It is
**Yjs-as-a-merge-primitive behind a hand-written stateless provider.** That is a
serious option and deserves to be beaten rather than filtered out. Here is why it
loses:

**1. There is no concurrency to resolve.** A CRDT's value is that two peers editing
the same object at the same moment both keep their work without a server
arbitrating. This app has one person and two devices, and the map states the same
Task is essentially never edited twice within seconds. The property being bought is
not needed; the costs are paid anyway.

**2. It buys nothing for `order` — the one field where merging is actually
ambiguous.** The model carries `order: number`, "renumbered within a Day"
(`src/model.ts`). Manual reordering means *moving* an item, and **neither library
has a move primitive.** Automerge's list reference documents `push`, `unshift`,
`insertAt`, `deleteAt` and `splice`
([lists](https://automerge.org/docs/reference/documents/lists/)); Y.Array's
documented methods are `from, insert, delete, push, unshift, get, slice, toArray,
toJSON, forEach, map, clone, observe, unobserve, observeDeep, unobserveDeep`
([Y.Array](https://docs.yjs.dev/api/shared-types/y.array)), and `YArray.js` has no
move method at
[v13.6.32](https://github.com/yjs/yjs/blob/v13.6.32/src/types/YArray.js). The Yjs
README points at a *third-party* package, `yjs-orderedtree`, for move
([tooling](https://github.com/yjs/yjs#tooling)) — move is something the ecosystem
builds on top of a map plus an ordering key, not something the sequence types give
you.

  Note carefully what is and is not claimed: **neither project documents what
  happens when two peers reorder concurrently, and neither warns against it.**
  Automerge says only that its RGA sequence "means that concurrent insertions and
  deletions can be merged in a manner which attempts to preserve user intent"
  ([documents](https://automerge.org/docs/reference/documents/)) — insertions and
  deletions, not moves. The finding is an absence of a primitive, not a documented
  failure.

  The consequence is the decisive bit: to get sane reordering you would model Tasks
  as a map keyed by `id` with `order` as a scalar field — at which point **reorder
  is a last-writer-wins scalar write anyway.** The CRDT is doing no work on the only
  hard field.

**3. It replaces an inspectable document with an opaque, monotonically growing
one.** `storage.ts` guarantees that "An unreadable document refuses" and leaves bad
data untouched — a guarantee that only means something because the stored bytes are
JSON a human can open. A CRDT doc is binary, and it only grows:
- **Automerge keeps everything, deliberately.** "Automerge documents hold their
  entire change histories", and on pruning: "The savings are not all that great,
  which is why we haven't prioritised history truncation so far"
  ([modeling data](https://automerge.org/docs/cookbook/modeling-data/)). Note that
  automerge-repo's "compaction" is chunk consolidation, not history removal
  ([storage](https://automerge.org/docs/reference/under-the-hood/storage/)).
- **Yjs keeps tombstones but frees content.** `doc.gc` controls it — "Set `doc.gc =
  false` to disable garbage collection and be able to restore old content"
  ([Y.Doc](https://docs.yjs.dev/api/y.doc)) — and the README is candid that these
  structures "only grow in size"
  ([algorithm](https://github.com/yjs/yjs#yjs-crdt-algorithm)). Their FAQ adds that
  "Size is very rarely a practical problem as long as you deal with human-entered
  text input" ([FAQ](https://docs.yjs.dev/api/faq)) — true, and not a reason to
  adopt it.
- The stateless path has its own catch: "this feature only merges document updates
  and doesn't garbage-collect deleted content. You still need to load the document
  to a Y.Doc to reduce the document size"
  ([document updates](https://docs.yjs.dev/api/document-updates)). So the tidy
  serverless story eventually needs a non-serverless compaction step.

**4. Automerge specifically does not fit the deployment at all.** Its complete
official network adapter list is websocket, MessageChannel and BroadcastChannel
([networking](https://automerge.org/docs/reference/repositories/networking/)), and
the official sync server is "a very simple automerge-repo synchronization
server… an unsecured Express app" run as a long-lived process
([sync-server](https://github.com/automerge/automerge-repo-sync-server)). The sync
protocol is stateful per peer and multi-round-trip by construction —
`initSyncState`, then alternating `generateSyncMessage` / `receiveSyncMessage`
([API](https://automerge.org/automerge/api-docs/js/functions/initSyncState.html)).
There is no stateless-HTTP equivalent of Yjs's `mergeUpdates`/`diffUpdate` story.
Its packaging is also awkward for a Vite SPA: "In vite you'll need to add two
plugins, `vite-plugin-wasm` and `vite-plugin-top-level-await`", and the docs'
own vanilla sample calls it "our annoying WASM hack"
([library initialization](https://automerge.org/docs/reference/library-initialization/)).

**5. Weight.** Neither project publishes an official bundle size, so these are
measured from the published npm tarballs (2026-09-22): `yjs@13.6.32`
`dist/yjs.mjs` is 62.6 KB gzipped; `@automerge/automerge@3.5.0`
`dist/automerge.wasm` is 1.14 MB gzipped. The app's entire dependency list today is
`lit`.

**6. Maturity of the surrounding layer.** Yjs's own offline provider, `y-indexeddb`,
last published **2023-11-02** (v9.0.12) with its repository last pushed 2025-02-12
(npm and GitHub API, 2026-09-22) — not archived, but well behind the core, which
shipped 13.6.32 in August 2026. On the Automerge side, the `latest` dist-tag for
`@automerge/automerge-repo` points at `2.6.0-alpha.3`; the last plain-stable is
2.5.6 (2026-05-18). A plain `npm install` of the batteries-included layer gets you
an alpha.

There is a fourth, softer cost: adopting a CRDT replaces our JSON document with
the library's binary format. `storage.ts` currently guarantees "An unreadable
document refuses" and leaves bad data untouched. That guarantee is only meaningful
because the stored bytes are inspectable JSON. A binary CRDT doc is not something
the user — or the developer — can open and read.

**What a CRDT is still worth reading for:** the *idea* of a monotonic,
order-independent merge. `CONTEXT.md` now says abandonment "is **final** — there
is no un-dropping." That is a one-way latch: a field that only ever goes false →
true, merged by OR, is trivially commutative and needs no timestamp at all. That
is a hand-rolled, one-field CRDT, and it is the right amount of CRDT for this app.
It belongs in ticket 08's answer, not in a dependency.

---

## The BaaS category — fits the deployment shape, fails on stability and constraints

These are the only options that genuinely work as "static build on Vercel, no
server of ours." They pass the filter that killed every engine above, which makes
them the real competition — so they get the closest reading.

### Supabase — not an offline product, at all
Supabase's architecture documentation does not mention offline support,
local-first operation, or client-side sync
([architecture](https://supabase.com/docs/guides/getting-started/architecture)).
This is not a gap in my reading: the Supabase docs sitemap
(`https://supabase.com/docs/sitemap.xml`, fetched 2026-09-22) contains **2,795
URLs and not one whose path contains "offline" or "local-first."** `supabase-js`
is a Postgres/REST/Realtime client; there is no first-party queue for writes made
while offline. Choosing Supabase means rolling our own sync anyway, on top of
someone else's database — a legitimate answer to *ticket 10*, not an answer to
this one. **Supabase does not remove the merge decision.**

Also relevant to ticket 10 rather than here: "We may pause applications on the
Free Plan that exhibit low activity in a 7-day period to save on server
resources"
([going into prod](https://supabase.com/docs/guides/platform/going-into-prod)).

### Firestore — real offline, opt-in on web, with caveats
- Offline persistence is **not on by default on web**: "For the web, offline
  persistence is disabled by default"
  ([enable offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline)).
- The API to enable it has moved. `enableIndexedDbPersistence` and
  `enableMultiTabIndexedDbPersistence` are both marked `@public @deprecated` in
  Firebase's own API report
  ([firestore.api.md](https://github.com/firebase/firebase-js-sdk/blob/main/common/api-review/firestore.api.md)),
  with the source TSDoc reading "This function will be removed in a future major
  release. Instead, set `FirestoreSettings.localCache` to an instance of
  `PersistentLocalCache` to turn on IndexedDb cache"
  ([database.ts](https://github.com/firebase/firebase-js-sdk/blob/main/packages/firestore/src/api/database.ts)).
  The current form is `initializeFirestore(app, { localCache:
  persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
- **Browser support is limited**: "Offline persistence is supported only by the
  Chrome, Safari, and Firefox web browsers" (same guide).
- **Multi-tab is supported but opt-in** — single tab is the default, and the
  documented failure is `failed-precondition: The app is already open in another
  browser tab and multi-tab is not enabled.`

I deliberately do **not** claim Firestore resolves cross-device conflicts by
last-write-wins per document — I could not find that stated in the official docs
and will not assert it. What is documented is that `writeBatch` is persisted
offline while "Transactions will fail when the client is offline"
([transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)).

### InstantDB — **shutting down**
This was the best technical fit in the whole survey, and it is being withdrawn.

- Its own pricing page states "New signups are closed", "Existing users should
  migrate off of Instant Cloud within the next 12 months", and "On August 31st,
  2027, all cloud apps will shut down" ([pricing](https://www.instantdb.com/pricing)).
  Every page carries the banner "Instant is sunsetting."
  ([about](https://www.instantdb.com/about))
- Its offline design is genuinely the right one for this app — "You don't enable
  offline mode. It's already on", "Mutations are saved to a persistent outbox
  before they're ever sent to the server", and "When the connection returns, the
  outbox flushes in order and the server reconciles"
  ([about](https://www.instantdb.com/about)). Its architecture essay reasons its
  way to the same local store this project is heading for: "If we want to show the
  app offline, we need a place for data to live across refreshes. For the web you
  don't have too many choices. IndexedDB is the best candidate"
  ([architecture](https://www.instantdb.com/essays/architecture)).
- The code is Apache-2.0 and self-hostable (`@instantdb/core@1.0.67`, npm), and it
  documents a vanilla-JS entry point, so Lit would have been fine. But
  self-hosting it is a server to operate, which returns us to the deployment
  filter.

**This is the clearest single data point in the document.** An actively-developed,
Apache-2.0, technically-excellent sync BaaS — the best fit in the survey — announced
its shutdown inside the window this app is being designed in. Ticket 10 asks "does
the data survive the provider?"; this is what that question looks like when the
answer is no. "Roll our own over a boring database" is the position least exposed
to it, because the only provider-shaped thing in it is the database.

### Triplit — effectively stalled
`@triplit/client@1.0.50` and `@triplit/db@1.1.10` were both last published
**2025-07-31**, licensed **AGPL-3.0-only** (npm `license` field; the GitHub API
reports the looser `AGPL-3.0` for the same file). The repository is not archived
and carries no status notice, but the three most recent default-branch commits are
2025-09-11, 2025-08-05 and 2025-08-05 (GitHub API, 2026-09-22). Their own docs
source says "Triplit Cloud is no longer accepting new users, and we recommend that
you self-host your Triplit database instead"
([docs source](https://github.com/aspen-cloud/triplit/blob/main/packages/docs/src/pages/triplit-cloud/index.mdx)).
A hosted service closed to new users plus a year of silence is enough to exclude
it without needing an official statement.

### Dexie Cloud and Jazz *(not named in the ticket)*
Included because they are the closest fits to this app's exact shape, and
researched less deeply than the named candidates.

- **Dexie Cloud** — IndexedDB via Dexie, syncing to a hosted server, and "Your app
  can be hosted on any static web server or CDN." The addon is Apache-2.0
  (`dexie-cloud-addon@4.4.15`, npm, 2026-09-09) but the server is a commercial
  service: "The Free tier includes 3 production users and 100 MB storage — forever
  free" ([dexie.org/cloud](https://dexie.org/cloud/)). Built around passwordless
  email OTP accounts.
- **Jazz** — "a local-first relational database with row-level permissions,
  real-time sync, and offline support — no separate API layer needed", listing
  plain TypeScript among supported clients ([docs](https://jazz.tools/docs)).
  `jazz-tools` is MIT at **0.20.19** (npm, 2026-07-03) — pre-1.0.

### Verdict on the category
**Excluded — and after InstantDB, on stronger grounds than "the map says so."**

Of the six offline-capable BaaS options surveyed, one is shutting down, one is
stalled with its cloud closed, one has no offline story at all, and the three that
remain are either pre-1.0, a paid account-based service, or Google. All of them
are account-shaped where the map wants "one secret, one person", and all of them
own the IndexedDB layer, the write queue and the online/offline transition — the
exact list the map names as the learning target.

This was the category that could have won. It is being declined for the learning
goal *and* because the category itself turned out to be less stable than the
alternative it was supposed to de-risk.

---

## Cost of reversal

**Low — provided the seam is respected.**

What "rolling our own" actually commits us to building:

| Piece | Rough size | Thrown away if we switch? |
|---|---|---|
| Merge function over `Task[]` | small, pure, unit-testable | Yes — but it is pure and tested in isolation |
| Pending-write queue | small | Yes |
| Two HTTP endpoints (push / pull) | small | Yes |
| The `Task` shape in `src/model.ts` | already exists | **No** — every candidate takes arbitrary JSON rows |
| Move from `localStorage` to IndexedDB (ticket 11) | moderate | **Mostly no** — needed regardless; PowerSync/Dexie/Instant all sit on IndexedDB or SQLite anyway |
| Service worker / PWA (ticket 07) | moderate | **No** — needed regardless; no engine ships the app shell |
| Hosting decision (Vercel) | fixed | **No** |

The genuinely reversible part is the merge rule plus a queue plus two endpoints,
all of which live behind the seam `storage.ts` already establishes and which
ticket 11 is about to redraw. `storage.ts` is documented as "The ONLY module that
touches localStorage" — if the replacement keeps that discipline, swapping the
implementation for an engine's client later is a module rewrite, not an app
rewrite.

**The asymmetry runs the other way.** Adopting an engine is the expensive thing to
reverse: it dictates the local schema (PowerSync's SQLite tables, a CRDT's binary
doc, Firestore's collections), the server, and often the auth model. Migrating
*off* one means exporting from its format. Migrating off a plain JSON array in
IndexedDB means reading a plain JSON array.

**And reversal is not always voluntary.** InstantDB users are being given twelve
months to migrate off a product they chose on merit
([pricing](https://www.instantdb.com/pricing)); Triplit Cloud users were told to
self-host instead
([docs source](https://github.com/aspen-cloud/triplit/blob/main/packages/docs/src/pages/triplit-cloud/index.mdx));
Replicache users are told to move to Zero ([replicache.dev](https://replicache.dev/)).
Three of the surveyed products issued a migrate-away instruction, and the cost of
that reversal is set by the vendor's timetable, not ours. The hand-rolled option is
the only one where nobody else can start the clock.

**The one irreversible-ish commitment** is the shape of the merge rule leaking into
the `Task` type — a `deletedAt`, per-field timestamps, a device id. Keep those
additive and optional and even that stays cheap. That is ticket 08's problem, and
this decision hands it to them unconstrained, which is the right outcome.

---

## One platform fact that should change a neighbouring ticket

Not asked for, but it falls out of the research and bears on the premise that the
server copy is optional.

Safari's Intelligent Tracking Prevention deletes "all of a website's
script-writable storage after seven days of Safari use without user interaction on
the site", and the list of what is deleted includes "Indexed DB", "LocalStorage",
"SessionStorage" and "Service Worker registrations and cache"
([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).
MDN records the same policy
([storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).

Two consequences:

1. **On an iPhone, "the phone holds a copy" is not a durable statement** unless
   the user opens the app at least weekly, or the app is installed to the home
   screen — WebKit says it does "not expect the first-party in such a web
   application to have its website data deleted." That is an independent argument
   for ticket 07's PWA question.
2. `navigator.storage.persist()` is the standard mitigation and has been "available
   across browsers since December 2021"
   ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)),
   though "The browser may or may not honor the request."

Also relevant to any "sync in the background" instinct: the Background
Synchronization API is marked **"Limited availability — This feature is not
Baseline because it does not work in some of the most widely-used browsers"**
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)).
Sync triggers should not be designed around it.

---

## What would change this verdict

Reopen this decision if any of these becomes true:

1. **The concurrency assumption breaks.** If sharing a list with another person
   ever comes back into scope, near-zero concurrency dies with it and a real CRDT
   becomes proportionate — specifically **Yjs**, which is the only library here that
   both merges properly and can run on the hosting we have. The map currently puts
   sharing out of scope; that exclusion is load-bearing for this verdict.
2. **The learning goal is met or abandoned.** The learning goal is doing a large
   share of the work in this verdict. Once service workers, IndexedDB and WebAuthn
   have been built once, the argument for continuing to hand-roll the merge is much
   weaker. But note the survey's own warning: this is the category where InstantDB
   shut down and Triplit went quiet inside a year. "Pick a BaaS later" is reasonable;
   "pick a BaaS and stop thinking about it" is not.
3. **The data stops being tiny or flat.** If Tasks acquire nesting, attachments, or
   a history that must be queried rather than replayed, "one document, merged in
   memory" stops being adequate. The trigger is concrete: when the whole document
   no longer comfortably fits in one request/response.
4. **Hosting stops being Vercel-static.** If a long-running process ever becomes
   available and free-ish, Zero specifically becomes a serious option again — it
   is GA, Apache-2.0, and its licence position is explicitly defensive.
5. **The merge rule starts growing.** If ticket 08's answer needs vector clocks, a
   durable operation log, or per-field causality, the "it's small" premise has
   failed. At that point **Yjs behind a hand-written stateless provider** becomes
   cheaper than finishing what we started — it is the documented fallback this
   document keeps in reserve, and it does not require changing hosting.
6. **`updatedAt` turns out to be untrustworthy** (ticket 05). Last-write-wins is
   what makes rolling our own small. If two devices' clocks cannot be trusted
   against each other at all, the fallback is a server-assigned version, not a
   CRDT — but that is a real design change and worth a second look at this ticket.

---

## Gaps and things I could not verify

Stated plainly rather than filled in:

- **"Zero cannot run on Vercel" is inference, not a quotation.** No Rocicorp page
  says that in words. It follows from requirements they *do* state — a persistent
  SQLite replica file, an owned Postgres replication slot, a 10-minute stop grace
  period, and container-only deployment targets. I am confident in the conclusion;
  the sources support the premises, not the sentence.
- **Firestore's cross-device conflict rule.** Cut deliberately. An earlier draft
  asserted last-write-wins per document; I could not source that from official
  docs, so it is not claimed.
- **InstantDB's offline write durability.** Instant says mutations go to "a
  persistent outbox" ([about](https://www.instantdb.com/about)) and its
  architecture essay reasons toward IndexedDB, but I did not find a page that
  states the outbox itself is IndexedDB-backed and survives a reload. Moot now
  that the product is sunsetting, but the distinction matters if the self-hosted
  version is ever revisited.
- **Triplit's own position.** The publishing gap, commit gap and closed cloud are
  all sourced; the word "stalled" is my inference from them, not a statement
  Triplit makes. Separately, I could not reach `triplit.dev` itself, so all Triplit
  quotes come from their GitHub docs source rather than the live site.
- **Each BaaS's minimum auth path.** I treated the category as account-shaped
  without measuring how close each could get to "one secret, one person."
  Firestore anonymous auth in particular may or may not span two devices cleanly —
  I did not check.
- **Replicache's licence history dates.** I verified the *current* state (repo
  Apache-2.0, npm metadata stale, no licence key). I did not independently verify
  when the change from BSL happened.
- **Concurrent-move behaviour in CRDT lists.** I verified that neither Automerge's
  list reference nor Yjs's `Y.Array` API documents a move primitive, and that
  `YArray.js` has none in source. I did *not* find any official statement describing
  what happens when two replicas reorder concurrently, so I have not claimed one —
  in particular, neither project *warns* about it.
- **"Yjs over stateless HTTP" is my application of their API, not their
  recommendation.** `mergeUpdates` / `diffUpdate` / `encodeStateVectorFromUpdate`
  and the commutativity guarantee are documented
  ([document updates](https://docs.yjs.dev/api/document-updates)); the words
  "serverless" and "Vercel" appear nowhere. If this option is ever pursued, prototype
  it before trusting the inference.
- **Bundle sizes are measured, not published.** Neither project states an official
  size. The gzipped figures quoted were measured by me from the published npm
  tarballs on 2026-09-22 (`yjs@13.6.32` `dist/yjs.mjs` → 62,594 B;
  `@automerge/automerge@3.5.0` `dist/automerge.wasm` → 1,136,563 B).
- **Free-tier limits generally.** I verified Supabase's and PowerSync's
  inactivity-deactivation wording, PowerSync Cloud's and Electric Cloud's pricing,
  and Zero Cloud's prices. Nothing else. Free-tier economics belong to ticket 10 and
  should be checked there rather than taken from here.
- **Electric Cloud's GA/beta status** is not stated on its cloud page, so I do not
  claim one.
- **Dexie Cloud and Jazz** were not in the ticket's list. I included them because
  they are the strongest fits for this app's exact shape, but I researched them
  less deeply than the named candidates — the licence and version figures are from
  npm and their own sites, and nothing more.
