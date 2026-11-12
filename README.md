# coko-b2b-portal

B2B wholesale self-serve ordering portal for COKO Jewellery / Zevar by COKO. Read
[`CLAUDE.md`](./CLAUDE.md) first — it has the standing rules and architecture context
any session (human or Claude Code) needs before touching this code.

## Status: scaffolding stage

**Built so far:**
- Next.js (App Router, TypeScript) project structure
- Drizzle schema (`db/schema.ts`): dealer accounts, product cache, cart items, order requests
- Supabase Auth wiring (server client + middleware session refresh) — not yet wired to any
  actual login UI
- Zoho API client skeleton (`lib/zoho/client.ts`) — OAuth token refresh + a typed fetch
  wrapper; no Books/CRM/Inventory-specific calls written yet
- CI (lint + unit tests on every PR) and a Supabase free-tier keepalive workflow
- One placeholder homepage, one passing unit test, one passing e2e test

**Not built yet** (see the phased plan in the Claude Project's
`claude/b2b-wholesale-portal-build-plan.md`): public catalog pages, dealer access-request
form → Zoho CRM Lead creation, login UI, per-account pricing resolution, cart/quick-order,
Estimate creation, order history/reorder, Razorpay payment links.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in real values (Supabase project URL/keys,
   Zoho API Console credentials, Razorpay keys). Never commit `.env.local`.
3. `npm run db:generate` then `npm run db:migrate` to create the schema in your Supabase
   Postgres database.
4. `npm run dev` — app runs at http://localhost:3000.

## Testing

- `npm run test` — Vitest, unit tests only, no live credentials needed.
- `npm run test:e2e` — Playwright, builds and serves the app first.
- `npm run lint` — Next.js/ESLint.

Run all three before considering any change done (see CLAUDE.md).

## Deploying

Free-tier launch path (see the Claude Project's `claude/b2b-portal-tech-stack-decision.md`
for the full reasoning):
- **Netlify**, not Vercel — Vercel's free Hobby plan's terms don't allow commercial use;
  Netlify's free tier does.
- **Supabase free tier**, with the keepalive workflow above preventing the 7-day inactivity
  pause. Upgrade to Supabase Pro ($25/mo) before real launch volume, then this workflow can
  be deleted (paid projects are never auto-paused).

To deploy: connect this repo to Netlify (or Vercel, once paying), set the same environment
variables from `.env.example` in its dashboard, and every push to `main` deploys automatically
with a preview URL per pull request.

## Committing the lockfile

This repo was scaffolded without running `npm install` (no network access in the environment
that wrote it), so there's no `package-lock.json` yet. Run `npm install` once locally or let
Netlify's build generate it, then commit the resulting `package-lock.json` — and switch
`.github/workflows/ci.yml` from `npm install` back to `npm ci` (faster, reproducible) once
it exists.
