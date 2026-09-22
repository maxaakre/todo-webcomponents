# 05 — Two devices, two clocks: whose "today" is it?

Type: grilling
Status: resolved
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

## Answer

**`day` stays a local label, stamped by the creating device and never moved. Merging trusts device clocks, but only in the direction where trust is safe.**

### The Day label

A new Task is stamped with the **creating device's** `currentDay()`, and that label is final. Rejected: a home-timezone setting (adds a persisted preference, reopening the storage shape) and deriving `day` per viewing device (a Task's Day would *move under you* depending on which device you opened — worse than the problem).

The predecessor's reasoning — *`day` is a label, so nothing can be lost* — **survives the second device.** Worst case: a Task created on a phone in an earlier timezone shows up in the laptop's Triage a day early, and dealing with that is precisely Triage's job.

**What counts as "today" is the viewing device's `currentDay()`**, unchanged. `DayController` keeps re-resolving it on focus.

### The gap this leaves

The mirror case is not benign. A Task created just after midnight on the laptop is dated **tomorrow** from a phone in an earlier timezone — so it is in neither Today nor Triage. **It exists and is visible nowhere.**

This is the inherited "Upcoming view" problem, and a second device makes it much easier to hit. Not solved here; **logged in the map's fog with its severity raised**, because unlike the early-Triage case it is completely silent.

### The clock rule

**Device `updatedAt` decides a merge, with a one-sided server guard.**

- The **server rejects a write timestamped implausibly far in the future** — a few minutes' tolerance. A write claiming to predate its own arrival is not credible.
- **It never rejects an old write.** A past timestamp is exactly what an offline queue looks like; a phone in a tunnel for an hour is indistinguishable from a phone an hour slow. No server-side rule can separate them.
- **The other direction closes on the client.** The server returns its own time on every response; the client compares and warns locally — *"this device's clock is 12 minutes off."* One field, no extra round trip, and it catches **both** directions. The server cannot tell slow-clock from long-offline; the device itself can.
- Rejection, not clamping. Silently rewriting a user's timestamps is the opposite of ticket 08's direction that a discarded write is never silent.

Rejected: server-assigned versions, which are trustworthy but **unavailable offline** — exactly when writes queue. That remains the documented fallback if device clocks prove worse than expected (see ticket 03's findings), but it is a real design change, not a tweak.

### Ties

Two writes sharing an `updatedAt` millisecond are broken by **comparing device ids**, higher wins. It is the only rule where **both devices reach the same answer without asking anyone**, which is required because each merges locally while offline. Server arrival order cannot do this; leaving it unspecified is how two devices stop agreeing permanently.

**This makes ticket 06's device id load-bearing for merging, not just for auth.** It must be stable, and it must be comparable.
