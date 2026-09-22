# Map: Multi-device sync

Label: `wayfinder:map`

## Destination

A **locked, written design for syncing one person's Tasks between their laptop and their phone.** Both devices stay fully usable offline and reconcile when they reconnect. The app is hosted on **Vercel**.

The design names the backend (chosen, not provisioned), what becomes of deletes, how ordering merges, what replaces the `storage.ts` seam, and how the server tells this person's devices from everyone else's. It ends as **a spec ready to build — not a running sync.**

## Notes

- **Predecessor**: [Map: Daily Todo (Lit)](../daily-todo/map.md), all 9 tickets resolved. This effort graduates its "Multi-device sync" fog entry. Zoom its Decisions-so-far before reopening anything it settled.
- **Domain**: glossary is `CONTEXT.md` at the repo root. It now defines **Drop** and **Abandoned** — added while charting this map.
- **Planning, not building.** Tickets resolve decisions. Two tasks are the exceptions: **ticket 01** deploys the app so the phone becomes a real device to judge against, and **ticket 13** carries out ticket 04's migration early, while there is still only one device and one copy of the data.
- **Hosting is fixed: Vercel.** Not a decision. It narrows the backend ticket to things that work with Vercel functions, or sit outside them entirely.
- **Auth is in scope as "one secret, one person."** The predecessor ruled auth out; sync moves that boundary deliberately. The requirement is *the server can tell my devices from everyone else's* — which admits a token or a passkey, and still rules out accounts, sign-up and multi-user.
- **The learning goal binds, but its target shifts.** The predecessor's goal was idiomatic Lit. Sync is where the **web platform** gets interesting: service workers, IndexedDB, WebAuthn, online/offline. Learning a backend framework is out of scope — without this, every ticket drifts serverward.
- **Rolling our own is the working assumption**, pending ticket 03. It follows from the learning goal and from near-zero real concurrency, but it was decided on impression, not sources.
- **Immutable updates remain mandatory.** Lit's change detection is strict `!==`; mutation re-renders nothing and fails silently. Inherited, non-negotiable.
- **Skills every session should consult**: `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`. Research tickets use `mattpocock-skills:research`; prototype tickets use `mattpocock-skills:prototype`. Ticket 01 may want `mattpocock-skills:wizard`.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [Roll our own sync, or adopt a sync engine?](issues/03-sync-engine-or-roll-our-own.md): **Keep rolling our own** — but the deciding reason is not the one the map assumed. **Every deployable sync engine needs a long-running stateful server, and this app is a static build on Vercel**; Vercel's WebSocket beta is an endpoint, not an always-on process. A CRDT is disproportionate and useless where it would matter most: neither Yjs nor Automerge documents a **move primitive**, so `order` gets no help. The one category that fit the hosting — offline BaaS — failed on stability (InstantDB **sunsetting**, Triplit stalled and AGPL, Replicache superseded). Runner-up held in reserve: **Yjs behind a hand-written stateless HTTP provider**. Reversal is cheap — a few hundred lines behind the `storage.ts` seam.
- [What replaces hard delete?](issues/04-what-replaces-hard-delete.md): **A `status` enum — `'open' | 'done' | 'abandoned' | 'erased'` — and nothing is ever removed from the array again.** `done: boolean` disappears into it. **Drop and `×` turn out to be different acts** the code wrongly shared: Drop (leftovers only) means *abandoned*, a fact about work; `×` (today's list only) means *erased*, a claim the Task never existed. `×` is always an erase, whatever the Task's age — a time-based rule would need a device clock, which ticket 05 says cannot be trusted. Tombstones kept **forever**; pruning quietly reinvents resurrection. Nothing new in the UI: on one device v1 and v2 behave identically. **Leaves two things for ticket 08**: abandoning and erasing must set `updatedAt` (the current delete never does, so a tombstone would lose every conflict), and any resurrection is by definition a merge bug, since the UI offers no un-drop.

- [Two devices, two clocks: whose "today" is it?](issues/05-two-devices-two-clocks.md): **`day` stays a local label**, stamped by the creating device and never moved; **what counts as "today" is the viewing device's**. The predecessor's "a label, so nothing can be lost" survives — worst case a Task hits Triage a day early, which is Triage's job. **Merging trusts device clocks one-sidedly**: the server rejects only **future-dated** writes (a few minutes' tolerance), never old ones, because an old write is indistinguishable from an offline queue. The other direction closes on the **client**, which compares against a server time returned on every response and warns about its own drift. **Rejection, never clamping.** Ties break on **device id**, the only rule both devices can compute offline — which makes ticket 06's id load-bearing for merging, not just auth.

- [How does the server tell my devices from everyone else's?](issues/06-device-identity.md): **A passkey for auth, a separate random device id for merging, and no enrolment mechanism at all.** The two are different things — the credential is secret and per-device, the id is public and only breaks merge ties. **Passkey reverses the earlier lean toward a capability token**: ITP deletes script-writable storage, so a token in `localStorage` is wiped after seven idle days while a keychain credential survives. **The QR enrolment settled while charting is overturned** — Mac plus iPhone means the passkey syncs through iCloud Keychain by itself, so there is nothing to transfer and nothing to build. Device id exists from first run (a merge can need it offline); the passkey only when sync is switched on. **Revocation graduated from the fog and was settled as revoke-all** — which is what keeps a device-management API out of ticket 10. Cost handed onward: **WebAuthn verification on a stateless function** is now the backend's hardest requirement.

## Not yet specified

- **How and when a sync actually fires.** Transport and triggers. The `DayController` already listens on `focus`/`visibilitychange` and has twice been given a second job; it may get a third. Depends on what the storage seam becomes. **Do not design around the Background Synchronization API** — MDN marks it "Limited availability", not Baseline (ticket 03 research).
- **What the server stores.** Whole documents, or an operation log. Falls out of the merge rule.
- **The first sync.** Two devices already holding independent `localStorage` data, meeting for the first time. Not a merge — a reconciliation with no shared history.
- **History and Backlog views.** Inherited fog, now closer: abandoned Tasks persist, so there is something to show. Still brings routing with it.
- **A Task that is visible nowhere. Severity raised by ticket 05.** A Task dated tomorrow is in neither Today nor Triage. One device hits this only by planning ahead; two devices hit it whenever they disagree about the date — a Task created just after midnight on the laptop is invisible on a phone in an earlier timezone. **Unlike every other divergence in this map, this one is silent.** It is the inherited "Upcoming view" question, and it is now the fog entry most likely to need a ticket of its own.
- **Keyboard and accessibility.** Inherited, untouched. A phone makes it less pressing, not more.

## Out of scope

- **Multi-user, accounts, sign-up.** Inherited from the predecessor and still standing. One person's daily plan.
- **Sharing a list with another person, and any presence or collaborative editing.** Real-time multiplayer is a different destination, and would invalidate the near-zero-concurrency assumption every merge decision rests on. **This exclusion is now load-bearing**: ticket 03's verdict rests on it, and names Yjs as the engine that would become proportionate the moment it falls.
- **Learning a backend framework.** The server is a means here. The client is where the learning happens.
