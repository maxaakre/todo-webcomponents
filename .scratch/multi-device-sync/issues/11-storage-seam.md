# 11 — What replaces the `storage.ts` seam?

Type: grilling
Status: open
Blocked by: 08
Map: ../map.md

## Question

The predecessor named `storage.ts` as **the seam sync replaces**. Time to collect on that.

Today it is a module with two functions and **module-level mutable state** — `lastRaw` and `loaded` — implementing a compare-and-swap write guard against other tabs.

- Does **`localStorage` survive**? It is synchronous, string-only and around 5MB. A pending-write queue and a tombstoned task list both push against that, and the sync layer wants to write off the main thread. Moving to **IndexedDB** is the obvious answer and a substantial change.
- The write guard was built for **two tabs**. Is it **subsumed** by the sync layer — which solves a strictly harder version of the same problem — or does it still earn its place?
- Where does the **pending-write queue** live, and does it survive the tab being closed? If not, offline writes are lost on a phone, which backgrounds tabs aggressively.
- `save()` can already fail with `conflict`. What failures can it return now, and can the root's funnel still handle all of them?
- Module-level mutable state is untestable and unmockable. Does the replacement stay a module, or become something instantiable?

## Comments

**2026-09-22, from ticket 03's research.** Moving to IndexedDB does **not** by itself buy durability on iOS. Safari's ITP deletes IndexedDB, localStorage and service worker caches alike after seven days without interaction ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). Choose IndexedDB for size, async access and structured storage if you like — but not on the grounds that it survives longer. Durability is ticket 07's home-screen-install question.

This also sharpens the pending-write queue sub-question: a queue whose storage can be evicted is a queue that can **silently drop offline writes**.
