import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// One shared connection, reused across the app per Next.js's own server-module caching.
// DATABASE_URL is the direct Postgres connection string from Supabase project settings
// (not the pooled "transaction mode" URL — use the session-mode one for Drizzle).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase project's connection string."
  );
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
