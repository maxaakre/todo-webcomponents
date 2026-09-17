# 09 — How is the app styled?

Type: grilling
Status: resolved
Blocked by: —
Map: ../map.md

## Question

Graduated from the fog by ticket 06: the fog entry said this could not be specified until the component seams existed. They now do.

- Each element's styles are scoped by **shadow DOM**. What, if anything, is **shared** across elements — and how does it cross the shadow boundary? **CSS custom properties** are the usual seam; are they the seam here?
- Is there a **token set** (spacing, colour, type scale) defined once on `:root`, or does each element style itself independently?
- **Dark mode**: in scope, out of scope, or `prefers-color-scheme` only?
- Does `<task-list>` let its host restyle it — it appears in two places (inside `<triage-view>` and standalone) and may need to look different in each. If so, **`::part`** is the other seam available. Worth deciding before the two call sites disagree.
- Where does the page-level reset live, given `index.html` is outside every shadow root?

The prototype on branch `prototype/triage-flow` has a working visual language already (neutral greys, one accent blue, one danger red). It is throwaway code, but it is a real reference for what the app looked like when it read well.

## Answer

### One global stylesheet, tokens on `:root`

Shadow DOM scopes each element's styles, and **CSS custom properties are the one thing that pierces it** — so they are the seam.

A single global stylesheet, linked from `index.html`, holds:

- the **page reset** — `index.html` sits outside every shadow root, so nothing else can reach it
- the **token set** on `:root` — colour, spacing, type scale

Elements keep their own `static styles` and consume the tokens. The prototype already proved the shape: `--ink`, `--dim`, `--line`, `--accent`, `--danger` carried all three variants without any element hard-coding a colour.

Per-element independence was rejected: it gives up the only clean cross-shadow seam available, and produces five elements that quietly disagree about grey.

### Dark mode: `prefers-color-scheme` only

Follows the OS. **No in-app toggle.**

With tokens on `:root` this is one media query redefining a handful of values — nearly free.

A toggle is the expensive option, and not for the obvious reason: it means **persisting a preference**, which needs somewhere to live, which means **amending ticket 03's `State`**. A resolved decision reopened for a theme switch.

### No `::part`

`<task-list>` exposes no parts, even though it renders in two places (inside `<triage-view>` and standalone).

Same rule that removed `subscribe()` (ticket 06) and the `readonly` flag: **one adapter means a hypothetical seam**. The two contexts are supposed to look the same — that is why it is one element. If they ever genuinely need to diverge, add the part then, with the real case in hand.
