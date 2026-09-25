# Changesets

Every change to `packages/ui` needs a changeset. Run `pnpm changeset` and pick:

- **patch** — a fix. No API change.
- **minor** — new API, nothing removed. Before 1.0, a minor may also break things.
- **major** — a removal or a breaking change. After 1.0 only.

**Deprecation rule:** mark it `@deprecated` and warn in dev. Keep it for one minor version. Remove it in the next major.

`pnpm changeset version` turns the pending changesets into version bumps and CHANGELOG entries.
