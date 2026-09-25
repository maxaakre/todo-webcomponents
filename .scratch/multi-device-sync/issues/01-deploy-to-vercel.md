# 01 — Deploy the static build to Vercel

Type: task
Status: claimed
Blocked by: —
Map: ../map.md

## Question

Nothing to decide. This makes the phone a real device, so later tickets can be judged against it instead of imagined.

Deploy the current app to Vercel as a **static Vite build**. No server, no database, no auth. Each device keeps its own independent `localStorage` list — that is expected, and is exactly the problem this map exists to solve.

Done when:

- The app is reachable at a URL on the user's phone.
- `pnpm build` output is what Vercel serves; pushes to `main` redeploy.
- The URL is recorded in the answer, because tickets 02, 06 and 07 all need it.

HITL: the user must connect their own Vercel account. Hand them a precise checklist rather than guessing at their dashboard — `mattpocock-skills:wizard` fits.

## Comments

**2026-09-22, agent session.** Everything AFK on this ticket is done; what remains needs the user's Vercel account.

Verified locally:
- `pnpm build` is clean — `dist/` is 28.20 kB of JS, **9.88 kB gzipped**, plus 0.66 kB CSS.
- `main` is in sync with `origin/main`, so the GitHub integration has something to deploy.
- `index.html` already carries `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, so the phone will not get a zoomed-out desktop layout.
- Node is v24.1.0 locally; the build itself pins nothing, so Vercel's default Node should serve.

Deliberately **not** added: a `vercel.json`. Vercel auto-detects Vite, the app has no router so it needs no SPA rewrites, and it reads no environment variables. Adding config it does not need is drift.

Also done: `.claude/worktrees/` added to `.gitignore` (agent worktrees were showing up untracked).

**To finish this ticket**, run the wizard: `./.scratch/multi-device-sync/deploy-to-vercel.sh`
It walks the Vercel import, checks the build settings, verifies the deployed URL responds, helps get it onto the phone, and appends the production URL below.

**2026-09-25, agent session.** The app moved to **`apps/daily-todo/`** — the repo is now a pnpm workspace so a component library can live beside it (see `docs/superpowers/specs/2026-09-25-ui-library-design.md`). In Vercel, set **Root Directory = `apps/daily-todo`**; framework, build command and output directory are unchanged. The wizard's settings step now says so. Vercel detects pnpm workspaces and installs from the repo root.

**2026-09-25, later.** Superseding the Root Directory note above: a **`vercel.json` now sits at the repo root** (`buildCommand: pnpm --filter daily-todo build`, `outputDirectory: apps/daily-todo/dist`), so **no Vercel project setting is needed** — leave Root Directory empty. The earlier "no vercel.json" call was right for a single-package repo; the workspace makes the config necessary rather than drift. The wizard's settings step matches.
