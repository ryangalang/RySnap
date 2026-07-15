// app/api/upload-session/route.js
//
// This route is the ONLY way a final strip gets saved to Supabase. The
// browser never writes to Storage or the `sessions`/`session_photos`
// tables directly — it POSTs here instead. That means:
//   1. We can rate-limit per IP before touching Supabase at all.
//   2. We can validate the payload (size, mime type) before storing it.
//   3. The service role key (which bypasses RLS) never leaves the server.
//   4. RLS on the tables/bucket can stay locked down to "no public insert",
//      closing off the abuse path that existed when the client held write
//      access directly (see supabase/schema.sql for the tightened policies).

import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const BUCKET = "boothph-outputs";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB safety ceiling for one strip image
const MAX_UPLOADS_PER_WINDOW = 8; // per IP
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function dataUrlToBuffer(dataUrl) {
  const match = /^data:(image\/png|image\/jpeg);base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_BYTES) return null;
  return { mime, buffer };
}

export async function POST(request) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`upload:${ip}`, MAX_UPLOADS_PER_WINDOW, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads from this connection. Please wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { dataUrl, sessionCode, layoutId, filterId, frameColor, caption, userId } = body || {};

  if (typeof sessionCode !== "string" || !/^[A-Z0-9-]{5,40}$/i.test(sessionCode)) {
    return NextResponse.json({ error: "Invalid session code." }, { status: 400 });
  }
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid or too-large image." }, { status: 400 });
  }

  const ext = parsed.mime === "image/png" ? "png" : "jpg";
  const path = `sessions/${sessionCode}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.mime,
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub?.publicUrl;

  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .insert({
      user_id: typeof userId === "string" ? userId : null,
      session_code: sessionCode,
      layout_id: typeof layoutId === "string" ? layoutId.slice(0, 40) : null,
      filter_id: typeof filterId === "string" ? filterId.slice(0, 40) : null,
      frame_color: typeof frameColor === "string" ? frameColor.slice(0, 80) : null,
      caption: typeof caption === "string" ? caption.slice(0, 120) : null,
    })
    .select()
    .single();
  if (sessionError) {
    return NextResponse.json({ error: "Could not save session record." }, { status: 500 });
  }

  const { error: photoError } = await supabaseAdmin.from("session_photos").insert({
    session_id: sessionRow.id,
    storage_path: path,
    public_url: publicUrl,
  });
  if (photoError) {
    return NextResponse.json({ error: "Could not save photo record." }, { status: 500 });
  }

  return NextResponse.json({ publicUrl, sessionRowId: sessionRow.id });
}
