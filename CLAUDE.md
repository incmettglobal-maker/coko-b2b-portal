# coko-b2b-portal — standing rules for any Claude Code session

This repo is COKO Jewellery / Incmett Global LLP's **B2B wholesale self-serve ordering portal** —
a *separate* platform from the D2C Shopify store (cokojewellery.com). Read this file in full
before making any change. It is the first thing every future session should read, the same way
the Claude Projects docs (`claude/*.md`) document the business side of this.

Full background docs live in the "COKO Jewellery | Zevar By COKO" Claude Project:
- `claude/b2b-wholesale-portal-build-plan.md` — reference-site teardown (lasakiceramics.com) + architecture
- `claude/b2b-portal-tech-stack-decision.md` — this stack's rationale, free-tier launch path
- `claude/zoho-crm-b2b-setup-plan.md` — the pending CRM field plan this portal depends on
- `claude/zoho-shopify-payment-sync-system.md` — the existing direct-API pattern this repo's Zoho
  client should follow (same org, same style of calls)

## What this is, in one paragraph

A Next.js app, buyer-facing, gated behind an approved dealer account. Public catalog browsing,
no prices shown until logged in. Logged-in buyers see per-account wholesale pricing, build a
cart or paste a bulk SKU/qty list, and submit it — which creates a **Zoho Books Estimate**, not
a live sale. Your ops team confirms pricing/freight/stock in Zoho and converts it to a Sales
Order → Invoice. Payment is 50% advance / balance before dispatch, collected via a Razorpay
payment link sent off the invoice — **there is no in-app checkout/cart-to-gateway flow**, by
design, matching the reference site's model. Do not add one without being asked.

## System of record — do not duplicate it

**Zoho One (Books + CRM + Inventory) is the source of truth.** This app's own Postgres
(Supabase) is a *cache* for fast page rendering (catalog, session, cart-in-progress) — never
the system of record for stock, pricing, or order status. Every sync job pulls *from* Zoho into
Postgres; nothing in this app writes authoritative business state anywhere but Zoho.

Known Zoho Books identifiers (Incmett Global LLP org, India edition, already used by the
existing Shopify↔Zoho sync system — reuse these, don't invent new ones):
- `organization_id = 60046812966`
- Payment mode label for Razorpay entries: `"Razorpay"`
- GST: org is `is_registered_for_gst: true`; both intra-state and inter-state tax IDs exist per
  item — look them up live via `list_taxes`/`get_item`, never hardcode a tax_id in this repo.

Zoho API credentials for this portal must be a **separate, dedicated API Console client**
(Books + CRM + Inventory scopes only) from whatever else the business already has authorized —
easy to audit/revoke independently. Never commit a token, client secret, or `.env` file with
real values — see `.env.example` for the variable names only.

## Channel Eligibility — the one shared concept with the D2C side

The warehouse SOP already defines a per-item "Channel Eligibility" field in Zoho (B2B-only /
D2C-only / both / neither) and a "Shopify Listing Status" field. This repo adds a **"B2B
Portal" value to that same picklist** rather than inventing a parallel concept — a SKU's
channel eligibility is decided once, in Zoho, not duplicated here.

## Auth model

Supabase Auth, email + OTP (magic link / one-time code) — chosen over phone+OTP because it's
free and built in; phone OTP needs a paid SMS provider (Twilio/MSG91), which isn't worth it at
launch volume. `dealer_accounts.phone` still exists as an optional business contact field but
is no longer used for login.

Login works for anyone; **pricing and ordering are gated separately** by `dealer_accounts.status`
(`pending` / `approved` / `rejected` / `suspended`), which only moves to `approved` once the
buyer's linked Zoho CRM Account/Lead shows portal access approved. Never show a price or allow
a cart submission to an account whose status isn't `approved`, even if logged in.

## Conventions

- TypeScript everywhere. No `any` without a comment explaining why.
- Drizzle ORM only — schema lives in `db/schema.ts`, migrations are generated files in
  `db/migrations/`, never hand-edited.
- Server Components by default; Server Actions for forms (access request, quick order, quote
  request) — no client-side fetch to a REST/GraphQL layer for these.
- Every Zoho API call goes through `lib/zoho/` — never call the Zoho REST API directly from a
  page or component.
- Before marking any change done: run `npm run lint`, `npm run test` (Vitest), and if the
  change touches a user-facing flow, `npm run test:e2e` (Playwright). Report what actually
  passed — don't report success without having run them.
- Money: store as integer paise/rupees per Zoho's own convention for that field, never float.
- Dates sent to Zoho follow the standing rule already established on the D2C side: an
  order/estimate's `date` field is the date the order was actually placed, not the date the
  Zoho record happens to be created — same reasoning as in `zoho-shopify-payment-sync-system.md`.

## What NOT to do without being explicitly asked

- Don't add an in-app payment/checkout flow (see above).
- Don't make this app a second source of truth for stock or pricing.
- Don't auto-approve dealer accounts.
- Don't point this repo's Zoho client at the same API credentials as the D2C Shopify sync.
- Don't commit real `.env` values, Zoho tokens, or Supabase service-role keys.

## Status

Scaffolding stage — see README.md for what's built vs. still open.
