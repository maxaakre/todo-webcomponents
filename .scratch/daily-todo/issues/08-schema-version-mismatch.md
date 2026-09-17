# 08 — What happens when stored data doesn't match the current version?

Type: grilling
Status: open
Blocked by: —
Map: ../map.md

## Question

Graduated from the fog by ticket 03, which put a `version: 1` field in the stored payload. That field now needs a meaning.

- What does the store do when it reads a `version` it **does not recognise** — a **higher** one (an older build reading newer data), or a **lower** one (a shape that predates a change)?
- Options at the extremes: **wipe and start fresh**, **refuse to load and say so**, or **migrate forward** through a chain of transforms.
- Is anything needed in v1 beyond *"if it isn't version 1, wipe it"* — given there is only one version and no users?
- Does a malformed or unparseable payload take the same path as a version mismatch, or a different one?

Small, but it is the difference between a silent data loss and a deliberate one. Cheap to decide before there is anything to lose.
