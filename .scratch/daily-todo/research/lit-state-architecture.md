# Research — How state flows between Lit components

Ticket: [`issues/01-lit-state-architecture.md`](../issues/01-lit-state-architecture.md)
Map: [`map.md`](../map.md)
Researched: 2026-09-17. All version facts verified against the npm registry and
`github.com/lit/lit` on that date.

---

## Recommendation (short version)

**Use top-down data flow with immutable objects: a plain TypeScript store module
that owns the Tasks and `localStorage`, held as reactive state on one root
component, passed down as properties, changed via events bubbling up.**

**Do not add `@lit/context` yet.** Add it later, if and when prop drilling
actually hurts — most likely when a second view and routing arrive.

**Do not use `@lit-labs/signals`.** It is a Labs package whose own README says it
is "not recommended for production use", and it sits on a TC39 proposal that is
still Stage 1.

The store-module seam is the important decision here. Props-vs-context is a
detail that can be changed in an afternoon; where `localStorage` lives is not.

---

## Verified package status and versions

Queried from `registry.npmjs.org` on 2026-09-17.

| Package | `latest` | Published | Status |
|---|---|---|---|
| `lit` | **3.3.3** | 2026-05-14 | Stable core |
| `@lit/reactive-element` | **2.1.2** | 2025-12-23 | Stable core |
| `@lit/context` | **1.1.6** | 2025-07-11 | **Stable**, graduated out of Labs |
| `@lit-labs/signals` | **0.3.0** | 2026-05-14 | **Labs**, 0.x, experimental |
| `signal-polyfill` | **0.2.2** | 2025-01-17 | Transitive dep of `@lit-labs/signals` |
| `@lit-labs/context` | 0.5.1 | 2023-10-28 | **Superseded** by `@lit/context` — do not install |
| `@lit/task` | 1.0.3 | 2025-07-11 | Stable; for async data, not needed for `localStorage` |

Notes on the table:

- `@lit/context@1.1.6` carries no npm deprecation flag and no Lit Labs warning in
  its README ([README](https://github.com/lit/lit/blob/main/packages/context/README.md)).
  Graduation out of Labs is confirmed by the naming policy: "When a Lit Labs
  project is ready to graduate out of labs, we'll begin publishing it under the
  `@lit` scope."
  ([labs.md](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/libraries/labs.md))
- `@lit-labs/signals` is listed on the Labs page under **"Under development"** —
  not "Near graduation"
  ([labs.md](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/libraries/labs.md)).
- `@lit-labs/signals` declares `lit: ^2.0.0 || ^3.0.0` and `signal-polyfill: ^0.2.2`
  as **dependencies**, not peer dependencies
  ([npm packument](https://registry.npmjs.org/@lit-labs%2Fsignals/0.3.0)).
- The TC39 Signals proposal is **Stage 1**
  ([tc39/proposal-signals README](https://github.com/tc39/proposal-signals#readme)).

---

## Option A — Props down, events up

### Status

Stable and permanent. It is not a library; it is the DOM's own model, and it is
what lit.dev teaches first.

> "When exchanging data with subcomponents, the general rule is to follow the
> model of the DOM: _properties down_, _events up_."
> — [component-composition.md:50](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/composition/component-composition.md)

> "A component should be the source of truth for the subcomponents in its shadow
> DOM. Subcomponents shouldn't set properties or call methods on their host
> component."
> — [component-composition.md:58](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/composition/component-composition.md)

And, directly on the question this ticket asks:

> "**In general, using top-down data flow with immutable objects is best for most
> applications.** It ensures that every component that needs to render a new value
> does (and does so as efficiently as possible, since parts of the data tree that
> didn't change won't cause components that rely on them to update)."
> — [properties.md:360](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/components/properties.md)

### Boilerplate cost

Low, but it scales with **tree depth**. Each hop needs one `@property` on the
child and one `@state` + event listener on the parent. For a daily todo app the
tree is about three deep:

```
<daily-todo-app>        owns state, talks to the store
  <task-list>           receives tasks[], re-fires events
    <task-item>         receives one task, fires task-toggled
  <triage-view>         receives staleTasks[], fires task-triaged
```

Two hops of drilling. That is comfortably inside the range where drilling is
cheaper than the machinery to avoid it.

### With `localStorage` as source of truth

Good fit, with one mandatory discipline: **immutable updates**.

Lit's change detection is strict inequality by default:

> "By default Lit uses a strict inequality test to determine if the value has
> changed (that is `newValue !== oldValue`)."
> — [properties.md:328](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/components/properties.md)

> "Mutating an object or array doesn't change the object reference, so it won't
> trigger an update."
> — [properties.md:341](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/components/properties.md)

This is the number one beginner surprise in Lit, and it matters twice here: once
for re-rendering, and once because `localStorage` needs a serialize step anyway.
Doing `this.tasks = [...this.tasks, newTask]` gives both a re-render and a clean
object to `JSON.stringify`. `localStorage` is synchronous, so there is no async
loading problem and no need for `@lit/task`.

### Surviving a move to synced remote state

Survives well — **provided the store is a separate module**. If components call
`localStorage` directly, the answer flips to "badly". See
[The store seam](#the-store-seam-the-actual-decision) below.

---

## Option B — A store element plus `@lit/context`

### Status

**Stable.** `@lit/context@1.1.6`, graduated from `@lit-labs/context`. It
implements the Web Components Community Group
[Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md),
so it is a cross-library standard, not a Lit-only invention.

### What lit.dev says it is for

> "Context is particularly useful for data that is needed by a wide variety and
> large number of components — such as an app's data store, the current user, a UI
> theme — or when data-binding isn't an option, such as when an element needs to
> provide data to its light DOM children."
> — [context.md](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/data/context.md)

> "The most common context use cases involve data that is global to a page and
> possibly only sparsely needed in components throughout the page."
> — [context.md:288](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/data/context.md)

Neither condition is true of a three-deep todo app. The data is not sparsely
needed — it is the whole app — and there is no light-DOM problem.

### Boilerplate cost

Moderate, and front-loaded: a context object module, a provider, a `@consume` on
every reader, and `subscribe: true` on each one that needs live updates
(it defaults to `false`).

```ts
// context.ts
export const storeContext = createContext<TaskStore>(Symbol('task-store'));

// consumer
@consume({context: storeContext, subscribe: true})
store!: TaskStore;
```

### The catch that matters for this app

Context notifies on **value identity**, not on mutation:

> "`setValue(value, force)` — Sets the value provided, and notifies any subscribed
> consumers of the new value if the value changed. `force` causes a notification
> even if the value didn't change, which can be useful if an object had a deep
> property change."
> — [context.md:428](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/data/context.md)

So providing a long-lived `TaskStore` **instance** through context does not make
anything re-render when a task inside it changes. You still need either immutable
values through `setValue`, or a separate subscription mechanism on the store, or
manual `force`. Context solves *distribution*, not *observation*. Lit's own RFC
states this plainly:

> "Lit doesn't have a built-in or endorsed shared *observable* state system.
> Properties can be passed down a component tree, and the `@lit/context` package
> allows sharing of values across a tree, but to observe changes to the individual
> data objects themselves, developers have to choose from a number of possible
> solutions"
> — [lit/rfcs 0005-standard-signals.md](https://github.com/lit/rfcs/blob/main/rfcs/0005-standard-signals.md)

This is the single most useful thing I found. It kills the intuition that
"store element + context" is a complete state solution. It is half of one.

### With `localStorage` and with later sync

Both fine, and context is genuinely the right tool **eventually** — a sync client
or an auth token is exactly the "app-global service" case lit.dev names. It is
just not the right tool at three components deep.

---

## Option C — Lit Signals (`@lit-labs/signals`)

### Status

**Labs, 0.x, explicitly not production-ready.** The package's own README:

> "This package is part of Lit Labs. It is published in order to get feedback on
> the design and may receive breaking changes or stop being supported."

> "So `@lit-labs/signals` is not recommended for production use. If you choose to
> use it, please thouroughly test and check the performance of your components
> and/or app _at scale_"
> — [signals README](https://github.com/lit/lit/blob/main/packages/labs/signals/README.md)

lit.dev repeats the warning and adds the polyfill constraint:

> "There may be missing features, serious bugs in the implementation, and more
> frequent breaking changes than with the core Lit libraries." … "there can be
> only one copy of the polyfill package in any page or app."
> — [lit.dev/docs/data/signals/](https://lit.dev/docs/data/signals/)

Two independent sources of churn stack here: the Lit integration layer, and the
TC39 proposal underneath it, which is still **Stage 1** and whose own README says
the plan is "significant early prototyping … before advancing beyond Stage 1"
([tc39/proposal-signals](https://github.com/tc39/proposal-signals#readme)).

The churn is not hypothetical. `0.2.0` shipped a real behaviour change:

> "`watch` no longer triggers update; adds `effect(callback, options)`"
> — [signals CHANGELOG](https://github.com/lit/lit/blob/main/packages/labs/signals/CHANGELOG.md)

That is a silent semantic change to a directive, in a 0.x minor. For someone
learning Lit, debugging "why did my component stop updating" against a moving
Labs package is the worst possible use of the learning budget.

### Boilerplate cost

Genuinely low — arguably the lowest of the three. `SignalWatcher(LitElement)` plus
module-level `signal()` values and shared state just works, with no drilling and
no provider:

```ts
const tasks = signal<Task[]>([]);

@customElement('task-list')
class TaskList extends SignalWatcher(LitElement) {
  render() { return html`${tasks.get().map(...)}`; }
}
```

This is the one honest argument in its favour, and it is why this option is
tempting rather than silly.

### With `localStorage` and with later sync

Would work well in principle — an `effect()` that persists on change is a tidy
pattern, and signals are a good fit for a sync client pushing remote updates into
shared observable state. Both are reasons to keep signals on the radar for later,
not reasons to adopt a 0.x package now.

### Where the RFC is headed

RFC 0005 is `Status: Active` and its goals include giving "real-world,
production-tested feedback to the signals champions". Meaning: Lit is
deliberately using adopters as the experiment. Reasonable for Lit; not what a
learning project should sign up for.

---

## The store seam (the actual decision)

The three options above are about *transport*. The decision that actually
constrains the future is *where `localStorage` lives*.

Recommended shape — a plain TypeScript module, no Lit imports:

```ts
// store.ts — knows about Tasks and persistence, knows nothing about components
export function loadDay(date: string): Day
export function addTask(day: Day, title: string): Day    // returns a NEW Day
export function toggleTask(day: Day, id: string): Day
export function triage(task: Task, verdict: Verdict): ...
```

Why this shape earns its place:

- **It is testable and readable without Lit in the way** — which matters when the
  point of the project is to learn Lit. Domain logic and framework logic stay
  separable in the reader's head.
- **`localStorage` is swappable.** Moving to IndexedDB, or to a remote API with a
  local cache, changes this one module. This is the map's deferred-sync
  requirement, honoured cheaply.
- **Immutable returns match Lit's change detection**, so the
  mutation-doesn't-re-render trap never fires.
- **It is orthogonal to the transport choice.** If drilling later hurts, wrap this
  same module in a `ContextProvider` — the module does not change. If signals
  later graduate, its internals can become signals — the module's public API does
  not change.

With this seam in place, the props-vs-context question stops being architectural
and becomes a refactor.

---

## Reasoning, compressed

| | Props + events | Store + `@lit/context` | `@lit-labs/signals` |
|---|---|---|---|
| Status | Permanent (DOM model) | Stable, `1.1.6` | Labs `0.3.0`, "not recommended for production" |
| Boilerplate at 3 deep | Low | Moderate, front-loaded | Lowest |
| Boilerplate at 6 deep | Painful | Low | Lowest |
| Handles `localStorage` | Yes, with immutable updates | Yes, same discipline | Yes, plus `effect()` |
| Solves *observation* | Yes (via re-render) | **No** — identity only | Yes |
| Survives move to sync | Via the store module | Via the store module | Via the store module |
| Teaches transferable skill | **Yes — the DOM's own model** | Yes, WCCG standard | Partly; API may change |
| Risk of breaking under you | None | Very low | Real (0.x + Stage 1 proposal) |

Three things decide it:

1. **The tree is shallow.** Context's stated use case is "a wide variety and large
   number of components". Three levels is not that. Adding a provider now buys
   nothing and costs a concept the learner has to hold.
2. **Learning is the destination, per the map.** Properties down / events up is
   the DOM's model, so it transfers to Stencil, FAST, plain custom elements, and
   to reading anyone else's web components. It is also the thing lit.dev teaches
   first and most thoroughly — the best-documented path is the best path for
   someone learning.
3. **Sync-later is protected by the store module, not by the transport.** Since
   all three options route persistence through the same seam, "which one survives
   sync best" is close to a non-question, which removes the main argument for
   paying context's or signals' cost up front.

---

## Suggested trigger points for revisiting

Concrete, so the decision can be revisited on evidence rather than vibes:

- **Adopt `@lit/context`** when a piece of state is drilled through a component
  that does not itself use it, twice — or the moment routing and a second view
  land (both are in the map's "Not yet specified").
- **Reconsider signals** only when `@lit-labs/signals` is listed under **"Near
  graduation"** on [lit.dev/docs/libraries/labs/](https://lit.dev/docs/libraries/labs/),
  or ships as `@lit/signals`. Today it is under "Under development".

---

## New questions this raised (not in the map)

1. **Does the store expose a subscription, or is the root component the only
   reader?** A single reader is simpler and enough for v1, but a `subscribe()`
   callback is what a sync client would later push into. Worth deciding now while
   it costs nothing — it is the difference between adding a method and rewiring.

2. **Multi-tab is an unplanned mini-sync problem, and it is live from day one.**
   Two tabs open on the app already means two writers over one `localStorage`. The
   `storage` event fires in *other* tabs, not the one that wrote — so it is
   available as a cheap conflict-detection rehearsal. The map defers multi-*device*
   sync; it does not mention multi-*tab*, which needs no new infrastructure to
   occur.

3. **Does `updatedAt` mean "wall clock at write"?** The map hangs future sync on
   `id` + `updatedAt`, but `CONTEXT.md` defines `Today` as `currentDay()` —
   deliberately not the calendar date. If the day boundary can be shifted (the 4am
   example), it is worth being explicit that `updatedAt` is an absolute instant and
   `Day` is a label, or ticket 04 will collide with this.

4. **Immutable-update discipline is now load-bearing and undocumented.** The
   recommendation depends on it, and violating it fails *silently* — the UI just
   does not update. It is probably worth a line in `CONTEXT.md` or the scaffold
   ticket rather than living only in this file.

---

## Sources

All accessed 2026-09-17.

- lit.dev — [Component composition](https://lit.dev/docs/composition/component-composition/)
  ([source](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/composition/component-composition.md))
- lit.dev — [Reactive properties](https://lit.dev/docs/components/properties/)
  ([source](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/components/properties.md))
- lit.dev — [Context](https://lit.dev/docs/data/context/)
  ([source](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/data/context.md))
- lit.dev — [Signals](https://lit.dev/docs/data/signals/)
  ([source](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/data/signals.md))
- lit.dev — [Lit Labs](https://lit.dev/docs/libraries/labs/)
  ([source](https://github.com/lit/lit.dev/blob/main/packages/lit-dev-content/site/docs/v3/libraries/labs.md))
- GitHub — [`@lit-labs/signals` README](https://github.com/lit/lit/blob/main/packages/labs/signals/README.md)
- GitHub — [`@lit-labs/signals` CHANGELOG](https://github.com/lit/lit/blob/main/packages/labs/signals/CHANGELOG.md)
- GitHub — [`@lit/context` README](https://github.com/lit/lit/blob/main/packages/context/README.md)
- GitHub — [lit/rfcs RFC 0005: Standard Signals](https://github.com/lit/rfcs/blob/main/rfcs/0005-standard-signals.md)
- GitHub — [TC39 proposal-signals](https://github.com/tc39/proposal-signals)
- GitHub — [WCCG Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md)
- npm registry — packuments for `lit`, `@lit/context`, `@lit-labs/signals`,
  `@lit-labs/context`, `@lit/reactive-element`, `@lit/task`, `signal-polyfill`
