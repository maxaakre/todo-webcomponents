# 06 — How does the server tell my devices from everyone else's?

Type: grilling
Status: open
Blocked by: —
Map: ../map.md

## Question

The map admits auth as **"one secret, one person"** — not accounts. Settled while charting: enrolment is a **QR code off the laptop screen**, once. What remains is the mechanism.

- **Capability token** (one long random string, stored on each device, sent on every request) or **passkey / WebAuthn**? The token is the smallest thing that works; the passkey is the one that teaches the web platform, which the map's Notes say is where learning now lives.
- Where does the secret live on each device — and does it survive the browser clearing site data? **If the secret lives in the same storage as the Tasks, "start fresh" may silently destroy access.**
- What does the **laptop** do before any phone exists? Is there a secret from first run, or only once sync is switched on?
- What does the server do with a request bearing no secret, or a wrong one?
- Revocation is fog for now, but do **not** pick a mechanism that makes revoking a lost phone impossible.

Out of scope: accounts, sign-up, passwords, OAuth providers.

## Comments

**2026-09-22, from ticket 05.** This ticket's output is now **load-bearing for merging, not just for auth.**

Ticket 05 breaks a merge tie — two writes sharing an `updatedAt` millisecond — by **comparing device ids, higher wins**. It is the only tiebreaker both devices can compute while offline without asking the server.

So whatever mechanism is chosen here must produce an id that is:
- **Stable** for the life of the device — if it changes, a device can lose a tie against its own earlier self.
- **Comparable** — an ordering both devices agree on.
- **Present before the first sync**, since a merge can need it offline.

A passkey credential id and a random token both satisfy this; it is worth checking rather than assuming.
