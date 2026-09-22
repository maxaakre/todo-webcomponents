# 07 — Offline on the phone: service worker and PWA?

Type: grilling
Status: open
Blocked by: 01
Map: ../map.md

## Question

The destination says **both devices stay fully usable offline.** On a laptop that came free — the app was served from a local dev server. On a phone, loading from a URL, it does not: **without a service worker the app will not even open offline.** The data being local is irrelevant if the shell cannot load.

- Does the app need a **service worker**, and therefore a caching strategy for the built assets?
- Does it need to be an **installable PWA** (manifest, icons, home-screen launch), or is a browser tab enough?
- A service worker makes a **stale client the normal case**, not bad luck — the phone can run last week's build indefinitely. That is the premise ticket 12 is built on; confirm it here.
- How does a new build reach a device that already has one cached, and does the user get a say?

This is the first ticket where the learning goal's new target — the web platform — is the actual subject.

## Comments

**2026-09-22, from ticket 03's research.** The PWA question just got much less optional.

Safari's Intelligent Tracking Prevention **deletes all of a site's script-writable storage after seven days of Safari use without interaction with the site** — and the list explicitly includes **IndexedDB, localStorage, sessionStorage, and service worker registrations and cache** ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

So on an iPhone, **"the phone holds a copy" is not a durable statement.** Skip a week and the local data is gone.

Two mitigations, both belonging to this ticket:
- **Install to the home screen.** WebKit says it does not expect a first-party in such a web application to have its website data deleted. This turns the PWA from a nicety into the durability mechanism.
- **`navigator.storage.persist()`**, available across browsers since December 2021 — but "the browser may or may not honor the request" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)).

Also settled by the same research: **do not design sync triggers around the Background Synchronization API.** MDN marks it "Limited availability — not Baseline".
