// lib/supabaseClient.js
//
// Stub Supabase client. To activate real backend features (accounts,
// permanent gallery, true cross-device QR sharing), do the following:
//
// 1. Create a free project at https://supabase.com
// 2. Copy your Project URL and anon public key
// 3. Create a `.env.local` file in the project root with:
//      NEXT_PUBLIC_SUPABASE_URL=your-project-url
//      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// 4. Restart `npm run dev`
//
// Until those env vars are set, `supabase` below will be `null` and any
// code that calls it should fall back to local/client-only behavior
// (which is exactly what the session wizard does by default).

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
