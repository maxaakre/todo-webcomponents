# 09 — How is the app styled?

Type: grilling
Status: open
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
