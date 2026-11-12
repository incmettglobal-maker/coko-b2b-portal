// Drizzle schema — the whole data model in one readable file (see CLAUDE.md).
//
// This database is a CACHE for fast storefront rendering, not the system of record.
// - `products`        mirrors Zoho Inventory items eligible for the "B2B Portal" channel.
// - `dealer_accounts`  mirrors a buyer's approval status, linked to a Zoho CRM Account/Contact.
// - `cart_items`       in-progress cart state only — cleared once an Estimate is created in Zoho.
// - `order_requests`   a local record of "we submitted this to Zoho as an Estimate", for the
//                      buyer's own order history / reorder UI; the authoritative status always
//                      comes from re-reading the linked Zoho Estimate/Sales Order/Invoice.

import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const dealerStatusEnum = pgEnum("dealer_status", [
  "pending", // access requested, Zoho CRM Lead created, awaiting approval
  "approved", // Zoho CRM flag flipped — pricing + ordering unlocked
  "rejected",
  "suspended",
]);

export const orderRequestStatusEnum = pgEnum("order_request_status", [
  "submitted", // Estimate created in Zoho, awaiting ops review
  "confirmed", // converted to Sales Order in Zoho
  "invoiced", // Invoice created in Zoho
  "dispatched",
  "cancelled",
]);

export const dealerAccounts = pgTable("dealer_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Matches Supabase Auth's user id (auth.users.id) — not a foreign key across schemas,
  // just the convention; enforce the link in application code / RLS policy.
  authUserId: uuid("auth_user_id").notNull().unique(),
  phone: text("phone").notNull().unique(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email"),
  city: text("city"),
  state: text("state"),
  gstin: text("gstin"),
  // Set once the linked Zoho CRM Account/Lead is approved. This is the ONLY gate for
  // seeing prices and submitting orders — see CLAUDE.md auth model.
  status: dealerStatusEnum("status").notNull().default("pending"),
  // Zoho CRM identifiers, filled in once the Lead/Account exists there.
  zohoCrmLeadId: text("zoho_crm_lead_id"),
  zohoCrmAccountId: text("zoho_crm_account_id"),
  zohoBooksContactId: text("zoho_books_contact_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  // The Zoho Inventory/Books item is the authority; this row is a refreshed cache of it.
  zohoItemId: text("zoho_item_id").notNull().unique(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  // Line/category grouping, mirrors the SKU prefix convention from the warehouse SOP.
  lineCode: text("line_code"),
  images: jsonb("images").$type<string[]>().default([]),
  // "in_stock" | "made_to_order" — paired with dispatchDays when made to order.
  stockStatus: text("stock_status").notNull().default("in_stock"),
  dispatchDays: integer("dispatch_days"),
  // Retail list price is NOT shown publicly; wholesale price resolution happens per
  // dealer account at render time against the Zoho Price Book, not stored flat here.
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealerAccountId: uuid("dealer_account_id")
    .notNull()
    .references(() => dealerAccounts.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderRequests = pgTable("order_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealerAccountId: uuid("dealer_account_id")
    .notNull()
    .references(() => dealerAccounts.id, { onDelete: "restrict" }),
  status: orderRequestStatusEnum("status").notNull().default("submitted"),
  // Snapshot of what was submitted, for the buyer's own order-history display — NOT the
  // authoritative record; always re-read the linked Zoho objects for current state/pricing.
  lineItemsSnapshot: jsonb("line_items_snapshot").notNull(),
  zohoEstimateId: text("zoho_estimate_id"),
  zohoSalesOrderId: text("zoho_sales_order_id"),
  zohoInvoiceId: text("zoho_invoice_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
