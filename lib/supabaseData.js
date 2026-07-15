// lib/supabaseData.js
//
// Client-side data helpers. Writes (uploading a finished strip) go through
// the /api/upload-session server route — see that file for why. Reads
// (the gallery) still query Supabase directly from the browser using the
// anon key, which is safe because RLS restricts each user to their own
// rows (see supabase/schema.sql).

import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Uploads the final canvas (as a PNG/JPEG data URL) via the secure server
 * route. Returns { publicUrl, sessionRowId } or null on failure — callers
 * should treat null as "couldn't save" and fall back gracefully.
 */
export async function uploadSessionResult({ dataUrl, sessionCode, layoutId, filterId, frameColor, caption, userId }) {
  try {
    const res = await fetch("/api/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, sessionCode, layoutId, filterId, frameColor, caption, userId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("BoothPH: upload failed", res.status, body?.error);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("BoothPH: upload request failed", err);
    return null;
  }
}

/**
 * Fetches the signed-in user's past sessions (most recent first), joined
 * with their photo URLs, for the gallery page. Returns [] if not
 * configured, not logged in, or on error. This reads directly via the
 * browser client — RLS's "Owners can read their sessions" policy makes
 * sure a user only ever sees their own rows.
 */
export async function fetchUserGallery(userId) {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, session_code, layout_id, caption, created_at, session_photos(public_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("BoothPH: fetching gallery failed", err);
    return [];
  }
}
