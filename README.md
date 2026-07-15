# BoothPH — Next.js Version 🎀

Ang totoong Next.js na build ng BoothPH gamit ang stack na napagusapan natin:

| Layer | Tool |
|---|---|
| Frontend + Backend | **Next.js 16** (App Router) on **Vercel** |
| Camera | **react-webcam** (front/back toggle) |
| Icons | **lucide-react** |
| Sticker editor | Custom pointer-drag system on Canvas + optional AI-generated stickers |
| QR Code | **qrcode.react** |
| Database + Auth + Storage | **Supabase** (hardened — writes only via a server route + service role key) |
| Rate limiting | In-memory sliding window (see `lib/rateLimit.js` — swap for Upstash Redis at scale) |
| Scheduled cleanup | Supabase Edge Function + `pg_cron` |
| Styling | Plain CSS (`app/globals.css`) + Tailwind v4 available |

✅ **Successfully build-tested** — `npm run build` completes with zero errors, including the two new API routes.

## 🔐 Security Model (why this isn't "anyone can write to your database")

Earlier versions of this app let the browser write directly to Supabase using the public anon key, protected only by RLS policies with `using (true)` — meaning anyone with devtools open could spam-insert rows or upload arbitrary files. This version closes that off:

- **The browser can only read.** `sessions` and `session_photos` have `select` policies but **no** `insert`/`update`/`delete` policies for the anon/authenticated roles (see `supabase/schema.sql`, section 2). Same for the Storage bucket.
- **All writes go through `app/api/upload-session/route.js`**, a server-only Route Handler that:
  1. Rate-limits by IP (8 uploads / 10 minutes — see `lib/rateLimit.js`)
  2. Validates the payload (must be a real PNG/JPEG data URL under 8MB, session code must match a strict pattern)
  3. Uses the **service role key** (`lib/supabaseAdmin.js`) to perform the actual insert/upload — that key never ships to the browser
- **AI sticker generation** (`app/api/generate-sticker/route.js`) follows the same pattern: server-only API key, rate-limited, input-length capped.

## 🧹 Scheduled Storage Cleanup

`supabase/functions/cleanup-old-sessions/index.ts` is a Supabase Edge Function that deletes **guest** sessions (no `user_id`) and their Storage files once they're older than 24 hours — matching what the Privacy Policy tells users. Signed-in users' saved sessions are never touched.

To activate it:
```bash
supabase functions deploy cleanup-old-sessions
supabase secrets set CLEANUP_FUNCTION_SECRET=some-long-random-string
```
Then run the `pg_cron` snippet in `supabase/schema.sql` (section 4) in the SQL Editor, filling in your project ref and the same secret, so it runs hourly.

## ⏱️ Kiosk Mode: Inactivity Auto-Reset

If a user leaves the wizard idle for 90 seconds (outside the consent screen and mid-capture), a warning banner appears with 15 seconds left, then the session automatically resets to the layout-picker — handy if you deploy this on a mall/event kiosk and don't want someone's photos left on screen for the next person. Tune `INACTIVITY_LIMIT_MS` / `INACTIVITY_WARNING_MS` at the top of `app/session/page.js`.

## ♿ Accessibility

- Every selectable card (layout, angle, filter, color swatch, vibe) is a real `role="button"`/`role="radio"` with `tabIndex`, keyboard support (Enter/Space), and an `aria-label`.
- Camera status, the countdown, and the step indicator are `aria-live` regions so screen readers announce progress.
- Visible focus rings on every interactive element (`:focus-visible` in `app/globals.css`).
- Icon-only buttons (camera switch, retake-single-shot, remove-sticker) all carry `aria-label`s.

This covers the common cases but hasn't been through a full audit (e.g. the drag-and-drop sticker positioning is mouse/touch-first — keyboard users can add/remove stickers but not fine-tune position yet).

## 🎨 AI-Generated Custom Stickers (optional, bring your own key)

Set `OPENAI_API_KEY` in `.env.local` (server-only) to enable a "describe a custom AI sticker" box on the Decorate screen, calling OpenAI's image API server-side. Leave it unset and the box simply doesn't render — nothing else changes.

## 🔌 Supabase Setup (accounts, permanent gallery, real QR links)

This app is fully wired for Supabase — you just need to point it at your own project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste in the contents of `supabase/schema.sql`, and run it. This creates:
   - `sessions` and `session_photos` tables (RLS: public read only, no public write)
   - a public `boothph-outputs` Storage bucket for the final strips
   - the `pg_cron` job for scheduled cleanup (edit the project ref + secret placeholders first)
3. Go to **Project Settings → API**, copy your Project URL, `anon public` key, and `service_role` key.
4. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Go to **Authentication → URL Configuration** and add `http://localhost:3000` (and your production URL later) to the allowed redirect URLs, so magic-link sign-in emails work.
6. Deploy the cleanup function: `supabase functions deploy cleanup-old-sessions` and set its secret (see "Scheduled Storage Cleanup" above).
7. Restart `npm run dev`.

Once configured:
- The **Sign in** button appears in the navbar (email magic link, no password).
- The session wizard **automatically uploads** the final strip to Storage when you reach the Done screen, and the **QR code becomes a real, scannable link** to that image instead of a demo placeholder.
- Signed-in users can see everything they've saved on the **`/gallery`** page.

Without Supabase configured, none of the above breaks — the app simply runs as a client-only demo (camera, capture, filters, stickers, download all still work with zero backend).

## 📁 Structure

```
boothph-nextjs/
├── app/
│   ├── layout.js          → Root layout, fonts, Navbar/Footer
│   ├── globals.css         → Pink & cute theme (all styling)
│   ├── page.js               → Landing page
│   ├── session/page.js         → Full photobooth wizard (client component)
│   ├── terms/page.js             → Terms & Conditions
│   └── privacy/page.js             → Privacy Policy
├── components/
│   ├── Navbar.js
│   └── Footer.js
├── lib/
│   ├── boothConfig.js       → Layouts, angles, filters, colors, stickers, vibes
│   ├── compositor.js         → Canvas drawing logic for the final strip
│   └── supabaseClient.js       → Supabase client (inactive until you add env vars)
├── .env.local.example
└── package.json
```

## ▶️ Paano Patakbuhin

```bash
npm install
npm run dev
```

Buksan ang `http://localhost:3000`. Kakailanganin ng **HTTPS o localhost** para gumana ang camera — parehong okay ang dalawa.

## 🚀 Paano I-deploy sa Vercel

1. I-push ang folder na ito sa isang GitHub repo.
2. Sa vercel.com, i-click "New Project" → i-import ang repo mo.
3. Awtomatikong made-detect ni Vercel na Next.js app ito — walang extra config kailangan.
4. (Optional) Kung gagamit ka ng Supabase, idagdag ang `NEXT_PUBLIC_SUPABASE_URL` at `NEXT_PUBLIC_SUPABASE_ANON_KEY` sa Vercel's Environment Variables settings.
5. Deploy — may libreng `.vercel.app` domain ka na agad.

## 🔌 Pag-activate ng Supabase (Optional, para sa Accounts/Gallery/Real QR)

1. Gumawa ng project sa supabase.com (may free tier: 500MB DB, 1GB storage, 50k MAU).
2. Kopyahin ang Project URL at anon key.
3. Kopyahin ang `.env.local.example` bilang `.env.local`, lagyan ng values.
4. I-restart ang `npm run dev`.
5. `lib/supabaseClient.js` ay awtomatikong mag-a-activate — `isSupabaseConfigured` ay magiging `true`, at ang QR code sa final screen ay magbabago ng messaging para ipakita na ready na ito para sa totoong Storage-backed na sharing.
6. Susunod na hakbang (hindi pa kasama dito, pero straightforward idagdag): gumawa ng `sessions` at `session_photos` tables, i-upload ang final canvas bilang blob papunta sa isang Storage bucket, at gamitin ang na-generate na public URL bilang laman ng QR code sa halip na yung demo text.

## ✅ Features na Gumagana Ngayon (walang kailangang Supabase)

- Landing page (pink & cute theme, Fraunces + Poppins)
- Camera consent flow gamit ang react-webcam
- 4 layout options (2x6 3-photo, 2x6 4-photo, 4x6 2-stripe 6-photo, 4x6 portrait 1-photo)
- 3 camera angle guides
- Live countdown capture na may flash at auto-progression, retake-all
- 5 post-capture filters
- Drag-and-drop sticker customization (16 stickers, delete, live canvas preview)
- 10 frame color swatches + 5 ready-made "vibe" presets
- Custom caption tool
- High-res PNG download
- Demo QR code generation via qrcode.react
- Terms & Conditions, Privacy Policy pages

## ⚠️ Mga Kilalang Limitasyon

- Walang persistent account/gallery hangga't hindi naka-configure ang Supabase
- Ang QR code ay naglalaman pa lang ng session code text, hindi pa totoong downloadable link (kailangan ng Supabase Storage step sa itaas)
- Walang payment integration pa (GCash/Maya) — planned para sa business/event tier
