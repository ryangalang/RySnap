// app/api/generate-sticker/route.js
//
// Generates a small transparent-friendly sticker image from a text prompt.
// Requires OPENAI_API_KEY (server-only — see .env.local.example). If it's
// not set, isAiStickersEnabled() (used by the client) returns false and
// the UI hides this feature entirely, so nothing breaks without a key.

import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_PER_WINDOW = 6;
const WINDOW_MS = 10 * 60 * 1000;

export async function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.OPENAI_API_KEY) });
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI stickers aren't configured on this server." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`sticker:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many sticker requests. Try again in a bit." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body?.prompt || "").toString().trim().slice(0, 120);
  if (!prompt) {
    return NextResponse.json({ error: "Please describe a sticker." }, { status: 400 });
  }

  const stickerPrompt =
    `A single cute die-cut sticker of ${prompt}, kawaii style, thick white sticker border outline, ` +
    `simple flat colors, centered, isolated on a plain white background, no text, no watermark`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: stickerPrompt,
        size: "256x256",
        n: 1,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("BoothPH: sticker generation failed", res.status, errBody);
      return NextResponse.json({ error: "Sticker generation failed." }, { status: 502 });
    }

    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;
    const url = json?.data?.[0]?.url;
    if (!b64 && !url) {
      return NextResponse.json({ error: "No image returned." }, { status: 502 });
    }

    return NextResponse.json({ imageUrl: b64 ? `data:image/png;base64,${b64}` : url });
  } catch (err) {
    console.error("BoothPH: sticker generation error", err);
    return NextResponse.json({ error: "Sticker generation failed." }, { status: 500 });
  }
}
