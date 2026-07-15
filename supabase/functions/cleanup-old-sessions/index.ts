// supabase/functions/cleanup-old-sessions/index.ts
//
// Scheduled Edge Function. Deletes guest sessions (user_id IS NULL) — and
// their Storage files — once they're older than 24 hours, matching the
// retention policy described to users in the Privacy Policy. Sessions that
// belong to a signed-in user (user_id IS NOT NULL) are left alone forever,
// since those are the "saved to my gallery" photos.
//
// Deploy:
//   supabase functions deploy cleanup-old-sessions
//
// Schedule it (run once in the SQL Editor, after deploying):
//   see supabase/schema.sql, section 4, for the pg_cron + pg_net snippet
//   that calls this function on an hourly schedule.
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase sets the first two
//   automatically for Edge Functions; only confirm they're present).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "boothph-outputs";

Deno.serve(async (req) => {
  // Simple shared-secret check so this can't be triggered by just anyone
  // who guesses the function URL.
  const authHeader = req.headers.get("Authorization") || "";
  const expected = `Bearer ${Deno.env.get("CLEANUP_FUNCTION_SECRET") ?? ""}`;
  if (!Deno.env.get("CLEANUP_FUNCTION_SECRET") || authHeader !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: staleSessions, error: fetchError } = await supabase
    .from("sessions")
    .select("id, session_photos(storage_path)")
    .is("user_id", null)
    .lt("created_at", cutoff);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const paths = (staleSessions ?? []).flatMap((s) => (s.session_photos ?? []).map((p) => p.storage_path)).filter(Boolean);
  const sessionIds = (staleSessions ?? []).map((s) => s.id);

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
  if (sessionIds.length > 0) {
    // session_photos rows cascade-delete automatically via the FK constraint
    await supabase.from("sessions").delete().in("id", sessionIds);
  }

  return new Response(
    JSON.stringify({ deletedSessions: sessionIds.length, deletedFiles: paths.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
