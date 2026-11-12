-- Switches dealer login from phone+OTP to email+OTP.
-- Reason: phone OTP requires a paid SMS provider (Twilio/MSG91); Supabase's email OTP
-- (magic link / one-time code) is built in and free. See CLAUDE.md "Auth model".
--
-- Run this once in the Supabase SQL Editor (same place you ran 0000_init.sql).
-- Safe to run even though dealer_accounts has 0 rows right now.

alter table "dealer_accounts" alter column "phone" drop not null;
alter table "dealer_accounts" drop constraint if exists "dealer_accounts_phone_key";

alter table "dealer_accounts" alter column "email" set not null;
alter table "dealer_accounts" add constraint "dealer_accounts_email_key" unique ("email");
