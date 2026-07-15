"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AngleNormalIcon, FilterSlidersIcon, FrameIcon, PaletteIcon, SparkleIcon, DownloadIcon } from "@/components/Icons";

const FEATURES = [
  { title: "Multiple Camera Angles", desc: "High-angle, normal, and low-angle guides — an on-screen overlay helps you nail the pose.", bg: "var(--primary-light)", stroke: "#D45C82", Icon: AngleNormalIcon },
  { title: "Filter After You Shoot", desc: "Vivid, B&W, Vintage, Soft Glam — choose based on your real shots, not just a live preview.", bg: "#EFE3F7", stroke: "#A87FC7", Icon: FilterSlidersIcon },
  { title: "4 Layout Options", desc: "2x6 (3 or 4 photos), 4x6 with 2 stripes (6 photos), or 4x6 portrait (1 photo).", bg: "#FCEED3", stroke: "#C79233", Icon: FrameIcon },
  { title: "Sticker & Frame Editor", desc: "Drag-and-drop cute stickers, a frame color picker, and a text tool.", bg: "#DFF2EE", stroke: "#4E9284", Icon: PaletteIcon },
  { title: "Ready-made Vibes", desc: "Kawaii, Y2K, Minimalist, Vintage Film — one tap and the decorating is done.", bg: "var(--primary-light)", stroke: "#D45C82", Icon: SparkleIcon },
  { title: "Instant Download & QR", desc: "Download high-res straight from your browser, or scan a QR so your friends can grab a copy too.", bg: "#FCEED3", stroke: "#C79233", Icon: DownloadIcon },
];

const STEPS = [
  { n: "01", title: "Pick a layout", desc: "Your shot count comes built right into it." },
  { n: "02", title: "Strike a pose", desc: "Follow the countdown with a live preview." },
  { n: "03", title: "Decorate it", desc: "Choose a filter, frame color, and stickers." },
  { n: "04", title: "Download", desc: "Grab it instantly or QR it to the whole group." },
];

const THEMES = [
  { title: "Soft Girl Pink", tag: "Everyday hangout", grad: "linear-gradient(160deg, #F3A6C0, #E8749A)" },
  { title: "Lavender Dream", tag: "Birthdays & events", grad: "linear-gradient(160deg, #D8B8EE, #A87FC7)" },
  { title: "Golden Hour", tag: "Seasonal special", grad: "linear-gradient(160deg, #F6D186, #E8749A)" },
  { title: "Mint Kawaii", tag: "Minimalist", grad: "linear-gradient(160deg, #A8DAD1, #5FA79A)" },
  { title: "Bubblegum", tag: "Y2K vibes", grad: "linear-gradient(160deg, #F7B4C6, #C9A8E0)" },
];

export default function Home() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const iv = setInterval(() => setCount((c) => (c === 1 ? 3 : c - 1)), 1100);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">✦ A new booth, no lines</span>
            <h1>
              A photobooth session, <em>right in your browser</em>.
            </h1>
            <p className="lead">
              Pick the layout, angle, and filter you want — no app to download, no line to wait in. Lighter, cuter, more you.
            </p>
            <div className="hero-actions">
              <Link href="/session" className="btn btn-primary">Start a Session →</Link>
              <Link href="#how" className="btn btn-ghost">See How It Works</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 14, color: "var(--ink-soft)" }}>
              <div style={{ display: "flex" }}>
                {["#E8749A", "#C9A8E0", "#F6D186", "#A8DAD1"].map((c, i) => (
                  <span key={c} style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid var(--cream)", marginLeft: i === 0 ? 0 : -10, background: c, display: "inline-block" }} />
                ))}
              </div>
              <span>2,400+ sessions this week</span>
            </div>
          </div>

          <div>
            <div className="booth-card">
              <span style={{ position: "absolute", top: -24, right: -20, background: "var(--lavender)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "10px 16px", borderRadius: 16, boxShadow: "var(--shadow)", transform: "rotate(5deg)" }}>
                🎀 5-shot mode
              </span>
              <div className="booth-screen">
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, #6d4a5c, #3B2734 70%)" }} />
                <svg style={{ position: "relative", zIndex: 2, width: "58%", opacity: 0.9 }} viewBox="0 0 200 220" fill="none">
                  <ellipse cx="70" cy="80" rx="34" ry="38" fill="#7a5568" />
                  <path d="M20 210C20 160 42 130 70 130C98 130 120 160 120 210" fill="#7a5568" />
                  <ellipse cx="140" cy="90" rx="30" ry="34" fill="#8f6579" />
                  <path d="M95 210C95 165 116 138 140 138C164 138 185 165 185 210" fill="#8f6579" />
                </svg>
                <div className="countdown-badge">{count}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>● High-angle · Soft Glam</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>📍 4x6 · 6 photos</span>
              </div>
              <div className="strip-card">
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%) rotate(-4deg)", width: 60, height: 22, background: "rgba(246,209,134,0.8)", borderRadius: 2 }} />
                <div className="frame" />
                <div className="frame" />
                <div className="frame" />
                <small style={{ display: "block", textAlign: "center", fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: "var(--ink-soft)", fontSize: 12 }}>BoothPH ✦</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--primary-light)", padding: "14px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", gap: 48, fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: 18, color: "var(--primary-deep)" }}>
          {"High-angle shots · Sticker customization · Instant download · Seasonal frames · 4 layout options · ".repeat(2)}
        </div>
      </div>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">✦ What&apos;s inside</span>
            <h2>Every option you need, no digging required.</h2>
            <p>From the camera angle to the sticker on your strip — it&apos;s all in one clean screen.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon" style={{ background: f.bg }}>
                  <f.Icon width={22} height={22} style={{ color: f.stroke }} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: "var(--cream-deep)", borderRadius: 40, margin: "0 24px" }}>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">✦ It&apos;s simple</span>
            <h2>Four steps and you&apos;re done.</h2>
            <p>No complicated setup. Open the site, set up your session, shoot, download.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px" }}>
                <span style={{ fontFamily: "var(--font-fraunces)", fontSize: 36, fontWeight: 600, color: "var(--primary)", opacity: 0.85, display: "block", marginBottom: 10 }}>{s.n}</span>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="themes">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">✦ Themes</span>
            <h2>A design for every occasion.</h2>
            <p>Scroll through the frame collection — new ones drop every season.</p>
          </div>
          <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 10 }}>
            {THEMES.map((t) => (
              <div key={t.title} style={{ flex: "0 0 210px", borderRadius: 20, padding: 18, height: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: t.grad, boxShadow: "var(--shadow)" }}>
                <h4 style={{ fontFamily: "var(--font-fraunces)", color: "#fff", fontSize: 18, fontWeight: 600 }}>{t.title}</h4>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>{t.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Ready for your first session?</h2>
              <p>Free to try, no app to install. Just open your browser and get started.</p>
            </div>
            <Link href="/session" className="btn btn-primary">Start Now →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
