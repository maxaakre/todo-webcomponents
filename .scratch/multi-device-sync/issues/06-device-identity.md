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
