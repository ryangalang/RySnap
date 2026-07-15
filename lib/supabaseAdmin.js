// lib/supabaseAdmin.js
//
// SERVER-ONLY. Uses the Supabase service role key, which bypasses Row Level
// Security entirely — it must never be imported from a "use client"
// component or exposed via a NEXT_PUBLIC_ env var. It's only ever used
// inside app/api/*/route.js handlers, which run on the server.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = url && serviceKey ? createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}) : null;

export const isAdminConfigured = Boolean(supabaseAdmin);
