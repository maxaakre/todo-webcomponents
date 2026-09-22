# 06 — How does the server tell my devices from everyone else's?

Type: grilling
Status: resolved
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

## Answer

**A passkey for auth, a separate random device id for merging, and no enrolment mechanism at all.**

### Two things, not one

The ticket conflated them. Ticket 05 made the difference load-bearing:

| | What it answers | Same on both devices? | Secret? |
|---|---|---|---|
| **Passkey credential** | "Is this my data?" | No — one per device | Yes |
| **Device id** | "Which of my devices wrote this?" | No — must differ | No |

Different lifetimes, different failure modes. Conflating them means either a device that re-enrols changes its merge identity, or a device id that has to be kept secret.

### Passkey, not a capability token

This **reverses** the early recommendation in favour of a token. What changed is ticket 03's Safari finding: **ITP deletes script-writable storage, and a token in `localStorage` is exactly that.** A passkey lives in the platform keychain, not in origin storage, so it survives. A token-based design needs an answer for "the browser deleted your credentials", and that answer turns out to be "enrol again" — worse than the ceremony it was avoiding.

*Worth verifying before building on it: that a passkey survives an ITP clear. It follows from where credentials are stored, but it was not read off a WebKit page saying so in words.*

Per-device credentials also make revocation nearly free, and give a natural per-device identity.

### No enrolment mechanism

**The QR-code enrolment settled while charting is overturned.** The user's phone is an **iPhone**, and the laptop is a Mac: **a passkey created in Safari syncs to the iPhone through iCloud Keychain on its own.** There is nothing to transfer, so there is nothing to build — no one-time token, no QR, no enrolment endpoint.

The phone still performs a normal WebAuthn authentication with the synced credential (Face ID). What disappears is the *transfer* mechanism, not the sign-in.

**This depends on iCloud Keychain being enabled and both devices being on the same Apple ID.** If that ever stops being true — or a non-Apple device joins — a one-time enrolment token behind a QR is the fallback, and it becomes a ticket then. It is not one now.

### Lifecycle

- **The device id exists from first run.** It must be available before the first merge, which can happen offline, so it cannot wait for a server. Random value, its own `localStorage` key, **regenerated if missing**.
- **The passkey is created only when sync is switched on.** Credentials for a user who never enables sync are a prompt they would rightly find baffling.
- **A wiped device gets a new device id, and that is fine.** A device whose storage ITP cleared has also lost every Task, so it re-syncs wholesale and holds no local writes to tie-break. Ticket 05's stability requirement holds exactly where it is load-bearing.
- **An unauthenticated or unrecognised request is refused.** No fallback, no anonymous mode.

### Revocation — graduated from the fog and settled here

**Revoke-all.** One endpoint, one button: delete every credential, then re-enrol on whichever device you still have. Rejected: a device list with individual revocation — it needs a settings screen, human-readable device names and a management API, for something used approximately never.

**This is the difference between ticket 10 needing a device-management API and not.** Decided now, deliberately, for that reason.

### Does this break the "no accounts" boundary?

The map admits auth as *"one secret, one person"* and rules out accounts. A passkey needs a **user handle** server-side, which is account-shaped. But there is no sign-up, no email, no password, no provider, and no second user. The boundary holds in substance.

### Handed to ticket 10

**WebAuthn verification is real server work** — challenge generation, signature verification, credential storage. It needs a library that runs on a stateless function and somewhere to keep public keys. This is the most demanding constraint the backend ticket has so far, and it arrived from the cheapest-looking ticket on the map.
