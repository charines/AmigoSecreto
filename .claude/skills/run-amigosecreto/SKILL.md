---
name: run-amigosecreto
description: Run, launch, start, build, smoke-test the AmigoSecreto app locally (frontend + backend) and drive its API. Use when asked to run the app, start the dev server, test an endpoint manually, or get a reveal_token for a local chat/reveal test.
---

Paths below are relative to the repo root (`<repo>/`), not this skill's directory.

AmigoSecreto is a React 19 + Vite 7 frontend (`frontend/`) calling a
TypeScript backend made of standalone Vercel Functions (`backend/api/*.ts`,
no framework, no built-in dev server). There is **no local MySQL** —
`backend/.env` points at the project's real remote MySQL (HostGator), which
is the accepted way to run this locally (already used for prior email
testing). Do not confuse this with `backend/.env.local`, which is the env
Vercel pulls for **production** and has a known-broken `SMTP_HOST` (DNS does
not resolve) — never use `.env.local` for email-sending tests.

## Run (agent path)

The driver is `.claude/skills/run-amigosecreto/driver.sh`. It starts the
frontend's own dev server and a tiny local adapter
(`local-api-server.ts`) that imports `backend/api/*.ts` handlers directly
and serves them over plain Node `http` — no Vercel CLI needed.

```bash
cd <repo>
bash .claude/skills/run-amigosecreto/driver.sh start   # backend :3001, frontend :5173
bash .claude/skills/run-amigosecreto/driver.sh status   # check both are up
bash .claude/skills/run-amigosecreto/driver.sh smoke    # curl-based smoke test
bash .claude/skills/run-amigosecreto/driver.sh stop     # kill both (PID-tracked)
```

`start` prints UP/DOWN for each; logs land in `/tmp/amigosecreto-run-skill/{frontend,backend}.log`.

To test a flow that needs a `reveal_token` (e.g. `/chat?token=...`,
`/reveal?token=...`) without inventing fake data, look one up **read-only**
for an existing group:

```bash
cd backend
npx tsx --env-file=.env ../.claude/skills/run-amigosecreto/find-reveal-token.ts "<group title>"
```

Prints `id, name, email, reveal_token, status` for every confirmed
participant of that group who already has a token (i.e. the draw already
ran). Never writes to the database.

Then open `http://localhost:5173/<route>?token=<reveal_token>` in a browser,
or hit the API directly:

```bash
curl -s "http://localhost:3001/api/chat?token=<reveal_token>"
```

## Run (human path)

`cd frontend && npm run dev` opens a normal Vite dev server at
`localhost:5173`, but it has no backend behind it unless the driver's
backend half (or `vercel dev`, not installed here) is also running — same
CORS/port caveat as below.

## Gotchas

- **Frontend port must be 5173, not whatever Vite falls back to.**
  `backend/.env`'s `APP_ORIGIN` is `http://localhost:5173` and CORS is
  locked to that exact origin (`backend/lib/cors.ts`) — if port 5173 is
  taken and Vite silently picks 5174+, every API call fails CORS with no
  obvious error in the Network tab pointing at the real cause. Free the
  port first (see Troubleshooting) rather than let Vite pick another one.
- **A bare `pkill` call in this container reliably reports a nonzero/odd
  exit (observed: 144), even when it kills exactly the right process.**
  It is not a failure signal — verify with `pgrep` afterward rather than
  trusting the exit code. `driver.sh stop` already wraps its `pkill` calls
  with `|| true` so this doesn't abort the script; do the same in any ad
  hoc `pkill`, or just call `driver.sh stop`.
- **`backend/api/*.ts` handlers are plain Node, not Vercel sugar.** They
  only use `res.writeHead` / `res.statusCode` / `res.end` and read
  `req.method` / `req.query` / `req.body` — no `res.json()`/`res.status()`.
  `local-api-server.ts` relies on exactly this; if a new handler ever uses
  Vercel-specific sugar, the adapter needs updating.
- **Don't install the Vercel CLI globally without asking first** — this
  project previously had none installed, and `vercel dev` would also need
  team/project linking and pulls the (currently broken) `.env.local`
  values.
- **Never `cat`/print `backend/.env` or `backend/.env.local`.** Both hold
  real credentials (DB, SMTP, Vercel OIDC tokens). To check something about
  a var without exposing it, use a throwaway `node -e` that only prints a
  boolean/length/DNS-resolves check, never the value.
- **`README.md` at the repo root is stale** (describes a pre-migration PHP
  backend with different endpoints and setup steps). Don't trust it for
  anything about running the app; this skill is the current source.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `driver.sh start` reports `backend: DOWN` | Check `/tmp/amigosecreto-run-skill/backend.log`. Usually `backend/.env` is missing or `npx tsx` isn't resolvable from `backend/` — re-run `cd backend && npx tsx --env-file=.env ../.claude/skills/run-amigosecreto/local-api-server.ts` directly to see the real error. |
| Frontend loads but every API call fails / CORS error in console | Frontend is probably not on port 5173 (see Gotchas). Run `driver.sh stop` then `driver.sh start` again; if port 5173 is still taken by something outside this driver, find it with `pgrep -fa vite` and `kill <pid>` directly. |
| `find-reveal-token.ts` prints `[]` | The named group has no participant with both a confirmed status and a drawn `reveal_token` yet — the draw hasn't run for that group, or the title doesn't match exactly. |
| `vitest run` not found when testing `frontend/` | Run `npm install` in `frontend/` first — `vitest` is a devDependency added for `chatMerge.test.js`, not a global tool. |

## Test

```bash
cd frontend && npm test   # vitest run — unit tests (chatMerge, etc.)
cd backend && npm test    # vitest run — handler/lib tests
```

For a broader pass (build + lint + both test suites + Mermaid drift check),
use the repo's own `./preflight.sh` from the repo root.
