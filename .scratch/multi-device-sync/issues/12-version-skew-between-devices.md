# 12 — Two devices on different builds

Type: grilling
Status: open
Blocked by: 08, 10
Map: ../map.md

## Question

Settled while charting: this is a **first-class case, not an edge case.** With a service worker (ticket 07) a stale client is normal, not unlucky — the phone can run last week's build for as long as it likes.

The predecessor decided that an unrecognised `version` makes `load()` **refuse**, putting the app into a read-only error state with `save()` disabled, and "start fresh" a button the user presses. That was right for one device. On two it needs re-examining:

- Does the **server** reject a write from a build whose version it does not understand? It is the only actor that sees both devices.
- A refusing phone is **bricked until the user notices and force-refreshes.** Is that acceptable, or does the app need to tell the user to update — and can it, if it refuses to read anything?
- Tickets 04 and 09 both likely bump the schema. **Two migrations are coming**; this ticket decides how they reach a device that is offline while they ship.
- "Start fresh" is now dangerous in a new way: on a synced device it could mean *start fresh everywhere.* The predecessor's guarantee was "there is one copy of this data and no undo." Is that still the guarantee, or does sync quietly become the backup?

## Comments

**2026-09-22, from ticket 03's research.** The "is sync the backup?" sub-question is now forced rather than philosophical.

On iOS, a device's local copy can be **deleted by the browser** — Safari's ITP clears script-writable storage after seven days without site interaction ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). So a device arriving empty is not necessarily a new device, and not necessarily a user who pressed "start fresh": it may be a device whose data the platform threw away.

The predecessor's guarantee was *"there is one copy of this data and no undo."* That is no longer true in either direction — there are now two copies, and one of them can vanish without anyone acting. **An empty local store must not be allowed to propagate as a deletion.**
