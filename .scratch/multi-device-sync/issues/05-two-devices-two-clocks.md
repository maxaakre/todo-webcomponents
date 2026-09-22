# 05 — Two devices, two clocks: whose "today" is it?

Type: grilling
Status: open
Blocked by: —
Map: ../map.md

## Question

The predecessor made two time decisions that were safe on one device and are not safe on two:

- `currentDay()` returns `"YYYY-MM-DD"` in **device local time**. Two devices in different timezones disagree about what today is. So do two devices in the *same* timezone with skewed clocks, near midnight.
- `updatedAt` is an **absolute instant from the device clock**. Any last-write-wins rule is only as trustworthy as that clock — a phone running ten minutes fast wins every conflict, permanently and invisibly.

- Is **`day` still a local label**, resolved per device? Or does a Task's Day get fixed when it is created and stop moving?
- The predecessor explicitly ignored timezones because "`day` is a label, so nothing can be lost". Does that reasoning survive a second device?
- Whose clock decides ordering — **the device's, or the server's**? A server timestamp is trustworthy but unavailable offline, which is precisely when writes are queued.
- What happens to a Task created offline on a phone whose clock is simply wrong?

This blocks the merge rule: **LWW is not a design until you say which clock.**

## Comments

**2026-09-22, from ticket 03's research.** Recorded as the named fallback: if device clocks cannot be trusted against each other, the answer is a **server-assigned version, not a CRDT**. The research flags that as a real design change and a reason to revisit ticket 03 — but it is the cheap direction, and it does not touch hosting.

Note the tension this ticket has to resolve: a server-assigned version is trustworthy but **unavailable offline**, which is exactly when writes are queued.
