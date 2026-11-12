-- Initial schema for coko-b2b-portal, matching db/schema.ts exactly.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Once you have Node set up locally and run `npm run db:generate`, drizzle-kit will take over
-- generating migrations from here on — this file just gets you started without needing Node now.

create type "dealer_status" as enum ('pending', 'approved', 'rejected', 'suspended');
create type "order_request_status" as enum ('submitted', 'confirmed', 'invoiced', 'dispatched', 'cancelled');

create table "dealer_accounts" (
  "id" uuid primary key default gen_random_uuid(),
  "auth_user_id" uuid not null unique,
  "phone" text not null unique,
  "business_name" text not null,
  "contact_name" text not null,
  "email" text,
  "city" text,
  "state" text,
  "gstin" text,
  "status" "dealer_status" not null default 'pending',
  "zoho_crm_lead_id" text,
  "zoho_crm_account_id" text,
  "zoho_books_contact_id" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table "products" (
  "id" uuid primary key default gen_random_uuid(),
  "zoho_item_id" text not null unique,
  "sku" text not null unique,
  "name" text not null,
  "description" text,
  "line_code" text,
  "images" jsonb default '[]',
  "stock_status" text not null default 'in_stock',
  "dispatch_days" integer,
  "is_active" boolean not null default true,
  "last_synced_at" timestamptz not null default now()
);

create table "cart_items" (
  "id" uuid primary key default gen_random_uuid(),
  "dealer_account_id" uuid not null references "dealer_accounts"("id") on delete cascade,
  "product_id" uuid not null references "products"("id") on delete restrict,
  "quantity" integer not null,
  "added_at" timestamptz not null default now()
);

create table "order_requests" (
  "id" uuid primary key default gen_random_uuid(),
  "dealer_account_id" uuid not null references "dealer_accounts"("id") on delete restrict,
  "status" "order_request_status" not null default 'submitted',
  "line_items_snapshot" jsonb not null,
  "zoho_estimate_id" text,
  "zoho_sales_order_id" text,
  "zoho_invoice_id" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Row Level Security: lock every table down by default. The app's server-side code uses
-- the service_role key (which bypasses RLS) for trusted operations; these policies are the
-- safety net if the anon/public key is ever used directly against the DB.
alter table "dealer_accounts" enable row level security;
alter table "products" enable row level security;
alter table "cart_items" enable row level security;
alter table "order_requests" enable row level security;

-- Products are safe to read publicly (no prices stored here — see CLAUDE.md).
create policy "products_public_read" on "products" for select using (true);

-- A dealer can only ever see/modify their own account and their own cart/orders.
create policy "dealer_accounts_own_row" on "dealer_accounts"
  for select using (auth.uid() = auth_user_id);

create policy "cart_items_own_rows" on "cart_items"
  for all using (
    dealer_account_id in (select id from "dealer_accounts" where auth_user_id = auth.uid())
  );

create policy "order_requests_own_rows" on "order_requests"
  for select using (
    dealer_account_id in (select id from "dealer_accounts" where auth_user_id = auth.uid())
  );
