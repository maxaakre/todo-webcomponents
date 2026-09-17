# 08 — What happens when stored data doesn't match the current version?

Type: grilling
Status: resolved
Blocked by: —
Map: ../map.md

## Question

Graduated from the fog by ticket 03, which put a `version: 1` field in the stored payload. That field now needs a meaning.

- What does the store do when it reads a `version` it **does not recognise** — a **higher** one (an older build reading newer data), or a **lower** one (a shape that predates a change)?
- Options at the extremes: **wipe and start fresh**, **refuse to load and say so**, or **migrate forward** through a chain of transforms.
- Is anything needed in v1 beyond *"if it isn't version 1, wipe it"* — given there is only one version and no users?
- Does a malformed or unparseable payload take the same path as a version mismatch, or a different one?

Small, but it is the difference between a silent data loss and a deliberate one. Cheap to decide before there is anything to lose.

## Added after ticket 07

`load()` now does two jobs: it returns `State` **and** retains the raw string it read for the write guard. Whatever this ticket decides about an unrecognised `version` has to say what the retained string is after a wipe or a refusal — otherwise the guard compares against something that was never really loaded.

## Answer

**Never wipe. Refuse, and say so.**

### Unrecognised `version`

An unrecognised version — in **either** direction — means `load()` refuses. It does not clear the key, and it does not write.

The two directions are different problems, but they get the same answer:

- **Lower** (old data, newer build) is a migration. There are no earlier versions yet, so it cannot occur in v1. When it can, migrations go here.
- **Higher** (newer data, stale build) means storage holds **good data from a version this build predates** — typically a cached tab. Wiping would destroy valid data precisely because the *app* is out of date. The app is the stale party; it does not get to delete the record.

*"If it isn't version 1, wipe it"* is the tempting shortcut and it is the one that eats a year of someone's list the first time a stale tab loads. There is exactly **one copy** of this data: no backups, no sync, no undo.

### Unparseable payload

**Same path.** Refuse, show a message, and offer **"start fresh"** as a button the user presses deliberately. Never automatic.

Unparseable to *this* code is not the same as worthless — the raw string is still in `localStorage` and can be copied out of devtools. Auto-wiping is the same silent destruction as above with a better excuse.

### What "refuse" means for the app

A refused load puts the app in a **read-only error state with `save()` disabled entirely**.

This answers the question ticket 07 threaded in: there is **no retained raw string** after a refusal, because nothing may write, so the write guard never runs. The only escape is the explicit "start fresh" action, which writes a new empty document at the current version.
