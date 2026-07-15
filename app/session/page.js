"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Webcam from "react-webcam";
import { QRCodeCanvas } from "qrcode.react";
import { LAYOUTS, ANGLES, FILTERS, COLORS, STICKERS, VIBES } from "@/lib/boothConfig";
import { drawStripToCanvas, layoutCanvasSize } from "@/lib/compositor";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { uploadSessionResult } from "@/lib/supabaseData";
import {
  CameraIcon, AngleHighIcon, AngleNormalIcon, AngleLowIcon, DownloadIcon, QrIcon,
  RefreshIcon, ArrowRightIcon, ArrowLeftIcon,
} from "@/components/Icons";
import { SwitchCamera, Wand2, Loader2 } from "lucide-react";

const SCREEN_NAMES = ["Start", "Layout", "Angle", "Capture", "Decorate", "Done"];
const ANGLE_ICONS = { high: AngleHighIcon, normal: AngleNormalIcon, low: AngleLowIcon };
const INACTIVITY_LIMIT_MS = 90 * 1000; // kiosk mode: auto-reset after 90s idle
const INACTIVITY_WARNING_MS = 15 * 1000; // show a warning for the last 15s
let stickerIdCounter = 1;

/** A card that's both clickable and keyboard-accessible (Enter/Space). */
function SelectCard({ selected, onSelect, className, children, ariaLabel }) {
  return (
    <div
      className={className + (selected ? " selected" : "")}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {children}
    </div>
  );
}

export default function SessionPage() {
  const [screen, setScreen] = useState(0);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(false);

  const [layout, setLayout] = useState(null);
  const [angle, setAngle] = useState(null);
  const [shots, setShots] = useState([]);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [frameColor, setFrameColor] = useState(COLORS[0]);
  const [stickers, setStickers] = useState([]);
  const [caption, setCaption] = useState("");
  const [facingMode, setFacingMode] = useState("user");

  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [camMsg, setCamMsg] = useState('Tap "Start Capturing" when you\'re ready.');

  const webcamRef = useRef(null);
  const stripStageRef = useRef(null);
  const stripCanvasRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const draggingId = useRef(null);

  const goTo = (n) => {
    setScreen(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextEnabled = () => {
    if (screen === 1) return !!layout;
    if (screen === 2) return !!angle;
    return true;
  };

  const handleNext = () => {
    if (screen === 2) {
      goTo(3);
      startCaptureScreen();
      return;
    }
    if (screen < 5) goTo(screen + 1);
  };

  const handleBack = () => {
    if (screen > 0) goTo(screen - 1);
  };

  /* ---------- KIOSK MODE: inactivity auto-reset ---------- */
  const [idleWarning, setIdleWarning] = useState(false);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    setIdleWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    // Don't auto-reset on the consent screen or mid-capture — an idle
    // countdown, camera flash, etc. would look like a bug otherwise.
    if (screen === 0 || capturing) return;
    warningTimerRef.current = setTimeout(() => setIdleWarning(true), INACTIVITY_LIMIT_MS - INACTIVITY_WARNING_MS);
    idleTimerRef.current = setTimeout(() => {
      handleNewSession();
    }, INACTIVITY_LIMIT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, capturing]);

  useEffect(() => {
    resetIdleTimer();
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [resetIdleTimer]);

  /* ---------- SCREEN 0: camera consent ---------- */
  const handleAllowCam = () => {
    setCamError(false);
    setCamReady(true); // mounts <Webcam>, which itself requests permission
  };

  const onUserMedia = () => {
    goTo(1);
  };

  const onUserMediaError = () => {
    setCamError(true);
    setCamReady(false);
  };

  function toggleFacingMode() {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }

  /* ---------- SCREEN 3: capture ---------- */
  function startCaptureScreen() {
    setShots([]);
    setCamMsg('Tap "Start Capturing" when you\'re ready.');
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function countdownOnce(n) {
    let c = n;
    setCountdown(c);
    while (c > 0) {
      await wait(700);
      c -= 1;
      setCountdown(c > 0 ? c : null);
    }
  }

  async function runCaptureSequence() {
    setCapturing(true);
    const collected = [];
    for (let i = 0; i < layout.shots; i++) {
      setCamMsg("Shot " + (i + 1) + " of " + layout.shots + " — strike a pose!");
      await countdownOnce(3);
      const shot = webcamRef.current?.getScreenshot();
      if (shot) collected.push(shot);
      setShots([...collected]);
      setFlash(true);
      await wait(400);
      setFlash(false);
      await wait(500);
    }
    setCamMsg("All done! You can retake individual shots later if needed.");
    setCapturing(false);
    await wait(500);
    goTo(4);
  }

  function handleRetakeFromDecorate() {
    goTo(3);
    startCaptureScreen();
  }

  function retakeSingleShot(idx) {
    goTo(3);
    setShots((prev) => prev.filter((_, i) => i !== idx));
    setCamMsg("Retaking shot " + (idx + 1) + " — get ready!");
    setTimeout(async () => {
      setCapturing(true);
      await countdownOnce(3);
      const shot = webcamRef.current?.getScreenshot();
      setShots((prev) => {
        const next = [...prev];
        next.splice(idx, 0, shot);
        return next;
      });
      setFlash(true);
      await wait(400);
      setFlash(false);
      setCapturing(false);
      setCamMsg("Shot retaken!");
      await wait(400);
      goTo(4);
    }, 300);
  }

  /* ---------- SCREEN 4: decorate — live canvas preview (filter + frame + stickers) ---------- */
  const renderStrip = useCallback(async () => {
    if (!layout || !stripCanvasRef.current) return;
    const { w, h } = layoutCanvasSize(layout);
    const maxDisplayW = Math.min(320, (typeof window !== "undefined" ? window.innerWidth : 400) - 64);
    const displayH = maxDisplayW * (h / w);
    if (stripStageRef.current) {
      stripStageRef.current.style.width = maxDisplayW + "px";
      stripStageRef.current.style.height = displayH + "px";
    }
    await drawStripToCanvas(stripCanvasRef.current, { layout, shots, filter, frameColor, caption, stickers });
  }, [layout, shots, filter, frameColor, caption, stickers]);

  useEffect(() => {
    if (screen === 4) renderStrip();
  }, [screen, renderStrip]);

  useEffect(() => {
    if (screen === 5 && finalCanvasRef.current) {
      drawStripToCanvas(finalCanvasRef.current, { layout, shots, filter, frameColor, caption, stickers });
    }
  }, [screen, layout, shots, filter, frameColor, caption, stickers]);

  useEffect(() => {
    const onResize = () => { if (screen === 4) renderStrip(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [screen, renderStrip]);

  function addSticker(emoji) {
    setStickers((prev) => [...prev, { id: stickerIdCounter++, emoji, x: 0.5, y: 0.5, size: 40 }]);
  }

  function removeSticker(id) {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  }

  function applyVibe(v) {
    setFrameColor(v.color);
    setStickers(v.stickers.map((s) => ({ id: stickerIdCounter++, emoji: s.e, x: s.x, y: s.y, size: 40 })));
  }

  function onStickerPointerDown(e, id) {
    draggingId.current = id;
    e.target.setPointerCapture(e.pointerId);
  }

  function onStickerPointerMove(e) {
    if (draggingId.current == null || !stripStageRef.current) return;
    const rect = stripStageRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    x = Math.min(0.96, Math.max(0.04, x));
    y = Math.min(0.96, Math.max(0.04, y));
    setStickers((prev) => prev.map((s) => (s.id === draggingId.current ? { ...s, x, y } : s)));
  }

  function onStickerPointerUp() {
    draggingId.current = null;
  }

  /* ---------- AI sticker generation (optional — needs OPENAI_API_KEY server-side) ---------- */
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetch("/api/generate-sticker")
      .then((r) => r.json())
      .then((d) => setAiEnabled(Boolean(d?.enabled)))
      .catch(() => setAiEnabled(false));
  }, []);

  async function handleGenerateSticker(e) {
    e.preventDefault();
    if (!aiPrompt.trim() || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch("/api/generate-sticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data?.error || "Failed");
      setStickers((prev) => [...prev, { id: stickerIdCounter++, imageUrl: data.imageUrl, x: 0.5, y: 0.5, size: 44 }]);
      setAiPrompt("");
    } catch {
      setAiError("Couldn't generate that sticker — try a different description.");
    } finally {
      setAiBusy(false);
    }
  }

  /* ---------- SCREEN 5: final ---------- */
  function handleDownload() {
    if (!finalCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = "BoothPH-" + Date.now() + ".png";
    link.href = finalCanvasRef.current.toDataURL("image/png");
    link.click();
  }

  const [showQr, setShowQr] = useState(false);
  const [sessionCode] = useState(() => "BOOTHPH-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (screen !== 5 || !isSupabaseConfigured || uploadedUrl || uploading) return;
    (async () => {
      setUploading(true);
      await wait(500);
      const dataUrl = finalCanvasRef.current?.toDataURL("image/png");
      if (!dataUrl) { setUploading(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      const result = await uploadSessionResult({
        dataUrl,
        sessionCode,
        layoutId: layout?.id,
        filterId: filter?.id,
        frameColor,
        caption,
        userId: userData?.user?.id,
      });
      if (result?.publicUrl) setUploadedUrl(result.publicUrl);
      setUploading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function handleNewSession() {
    setShots([]);
    setLayout(null);
    setAngle(null);
    setStickers([]);
    setCaption("");
    setFilter(FILTERS[0]);
    setFrameColor(COLORS[0]);
    setShowQr(false);
    setUploadedUrl(null);
    setUploading(false);
    goTo(1);
  }

  const progressPct = Math.round((screen / 5) * 100);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ fontSize: 18 }}>
          <span className="mark" style={{ width: 30, height: 30 }}>
            <CameraIcon width={15} height={15} style={{ color: "#fff" }} aria-hidden="true" />
          </span>
          BoothPH
        </Link>
        <div className="progress-track" role="progressbar" aria-valuenow={screen + 1} aria-valuemin={1} aria-valuemax={6}>
          <div className="progress-fill" style={{ width: progressPct + "%" }} />
        </div>
        <div className="step-label" aria-live="polite">Step {screen + 1} / 6 · {SCREEN_NAMES[screen]}</div>
      </div>

      {idleWarning && (
        <div role="alert" style={{ background: "#3B2734", color: "#fff", textAlign: "center", padding: "10px 16px", fontSize: 13.5 }}>
          Still there? This session will reset soon due to inactivity — tap anywhere to keep going.
        </div>
      )}

      <div className="stage">
        <div className="panel">

          {screen === 0 && (
            <div>
              <div className="panel-head"><h1>Ready to go? 🎀</h1><p>We just need access to your camera to get started.</p></div>
              <div className="consent-card">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <span style={{ width: 64, height: 64, borderRadius: 20, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CameraIcon width={30} height={30} style={{ color: "var(--primary-deep)" }} aria-hidden="true" />
                  </span>
                </div>
                <p>Your camera is only used while this session is open. Nothing is saved or sent anywhere until you tap Download. Read our <Link href="/privacy" style={{ color: "var(--primary-deep)", fontWeight: 600 }}>Privacy Policy</Link> for details.</p>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleAllowCam}>Allow Camera Access <ArrowRightIcon width={16} height={16} aria-hidden="true" /></button>
                {camError && <div className="cam-error" role="alert">Couldn&apos;t access the camera. Make sure you allowed the permission, or try a device with a camera.</div>}
                {camReady && !camError && (
                  <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
                    <Webcam audio={false} mirrored onUserMedia={onUserMedia} onUserMediaError={onUserMediaError} />
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === 1 && (
            <div>
              <div className="panel-head"><h1>Choose a Layout</h1><p>Your shot count is built right into it.</p></div>
              <div className="layout-grid">
                {LAYOUTS.map((l) => (
                  <SelectCard key={l.id} className="layout-card" selected={layout?.id === l.id} onSelect={() => setLayout(l)} ariaLabel={`${l.badge}, ${l.desc}`}>
                    <div className="badge-num">{l.label}</div>
                    <div className="layout-preview" style={{ gridTemplateColumns: `repeat(${l.cols},1fr)` }}>
                      {Array.from({ length: Math.min(l.rows * l.cols, 6) }).map((_, i) => <div className="cell" key={i} />)}
                    </div>
                    <h3>{l.badge}</h3>
                    <span>{l.desc}</span>
                  </SelectCard>
                ))}
              </div>
            </div>
          )}

          {screen === 2 && (
            <div>
              <div className="panel-head"><h1>Choose a Camera Angle</h1><p>An on-screen guide helps you nail the pose.</p></div>
              <div className="angle-grid">
                {ANGLES.map((a) => {
                  const AngleIcon = ANGLE_ICONS[a.id];
                  return (
                    <SelectCard key={a.id} className="angle-card" selected={angle?.id === a.id} onSelect={() => setAngle(a)} ariaLabel={`${a.name}: ${a.desc}`}>
                      <div className="icon" style={{ display: "flex", justifyContent: "center" }}>
                        <AngleIcon width={30} height={30} style={{ color: "var(--primary-deep)" }} aria-hidden="true" />
                      </div>
                      <h3>{a.name}</h3>
                      <p>{a.desc}</p>
                    </SelectCard>
                  );
                })}
              </div>
            </div>
          )}

          {screen === 3 && (
            <div>
              <div className="panel-head">
                <h1>Let&apos;s shoot! {layout ? "(" + layout.shots + " shots)" : ""}</h1>
                <p>Angle: {angle?.name} — follow the countdown.</p>
              </div>
              <div className="capture-wrap">
                <div className="camera-frame">
                  <Webcam
                    key={facingMode}
                    ref={webcamRef}
                    audio={false}
                    mirrored={facingMode === "user"}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }}
                  />
                  <div className="angle-guide" />
                  <div className={"flash-overlay" + (flash ? " flash" : "")} />
                  <div className={"count-overlay" + (countdown ? " show" : "")} aria-live="assertive">{countdown}</div>
                  {!capturing && (
                    <button
                      onClick={toggleFacingMode}
                      aria-label="Switch between front and back camera"
                      title="Switch camera"
                      style={{ position: "absolute", bottom: 14, right: 14, width: 42, height: 42, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <SwitchCamera width={20} height={20} color="#fff" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="shots-dots" aria-hidden="true">
                  {Array.from({ length: layout?.shots || 0 }).map((_, i) => (
                    <span key={i} className={i < shots.length ? "done" : ""} />
                  ))}
                </div>
                <p className="cam-msg" aria-live="polite">{camMsg}</p>
                <div className="cam-actions">
                  {!capturing && shots.length === 0 && (
                    <button className="btn btn-primary" onClick={runCaptureSequence}><CameraIcon width={16} height={16} aria-hidden="true" /> Start Capturing</button>
                  )}
                  {!capturing && shots.length > 0 && (
                    <>
                      <button className="btn btn-ghost" onClick={startCaptureScreen}><RefreshIcon width={16} height={16} aria-hidden="true" /> Retake All</button>
                      <button className="btn btn-primary" onClick={() => goTo(4)}>Continue <ArrowRightIcon width={16} height={16} aria-hidden="true" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {screen === 4 && (
            <div>
              <div className="panel-head"><h1>Decorate Your Strip</h1><p>Pick a filter, frame color, and stickers — drag stickers wherever you like.</p></div>
              <div className="customize-grid">
                <div>
                  <div className="tool-card">
                    <h4 id="shots-heading">Your Shots</h4>
                    <div className="shot-grid" role="group" aria-labelledby="shots-heading">
                      {shots.map((src, idx) => (
                        <div className="shot-thumb" key={idx} style={{ position: "relative" }}>
                          <img src={src} style={{ filter: filter.css }} alt={"Shot " + (idx + 1)} />
                          <button
                            onClick={() => retakeSingleShot(idx)}
                            aria-label={`Retake shot ${idx + 1}`}
                            title="Retake this shot"
                            style={{ position: "absolute", bottom: 6, right: 6, width: 28, height: 28, borderRadius: "50%", background: "rgba(59,39,52,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <RefreshIcon width={14} height={14} style={{ color: "#fff" }} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tool-card">
                    <h4>Filter</h4>
                    <div className="filter-row" role="radiogroup" aria-label="Photo filter">
                      {FILTERS.map((f) => (
                        <SelectCard key={f.id} className="filter-chip" selected={filter.id === f.id} onSelect={() => setFilter(f)} ariaLabel={f.name}>
                          <img src={shots[0] || ""} style={{ filter: f.css }} alt="" />
                          <span>{f.name}</span>
                        </SelectCard>
                      ))}
                    </div>
                  </div>
                  <div className="tool-card">
                    <h4>Ready-made Vibe</h4>
                    <div className="vibe-row" role="group" aria-label="Ready-made vibe presets">
                      {VIBES.map((v) => (
                        <div key={v.id} className="vibe-chip" role="button" tabIndex={0} onClick={() => applyVibe(v)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); applyVibe(v); } }}>
                          {v.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tool-card">
                    <h4>Frame Color</h4>
                    <div className="swatch-row" role="radiogroup" aria-label="Frame color">
                      {COLORS.map((c) => (
                        <div
                          key={c} className={"swatch" + (frameColor === c ? " selected" : "")}
                          style={{ background: c, borderColor: c === "#FFFFFF" ? "#eee" : undefined }}
                          role="radio" aria-checked={frameColor === c} aria-label={c} tabIndex={0}
                          onClick={() => setFrameColor(c)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFrameColor(c); } }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="tool-card">
                    <h4>Stickers (click to add)</h4>
                    <div className="sticker-row" role="group" aria-label="Add a sticker">
                      {STICKERS.map((emo) => (
                        <button key={emo} className="sticker-btn" onClick={() => addSticker(emo)} aria-label={`Add ${emo} sticker`}>{emo}</button>
                      ))}
                    </div>
                    {aiEnabled && (
                      <form onSubmit={handleGenerateSticker} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        <label htmlFor="ai-sticker-prompt" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>✨ Or describe a custom AI sticker</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            id="ai-sticker-prompt"
                            type="text"
                            className="text-input"
                            placeholder="e.g. a sleepy cloud with a bow"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            maxLength={120}
                          />
                          <button className="btn btn-soft" type="submit" disabled={aiBusy || !aiPrompt.trim()} style={{ padding: "0 16px" }}>
                            {aiBusy ? <Loader2 width={16} height={16} className="spin" aria-hidden="true" /> : <Wand2 width={16} height={16} aria-hidden="true" />}
                          </button>
                        </div>
                        {aiError && <p role="alert" style={{ fontSize: 12, color: "#B4453D" }}>{aiError}</p>}
                      </form>
                    )}
                  </div>
                  <div className="tool-card">
                    <h4>Caption</h4>
                    <label htmlFor="caption-input" className="sr-only">Caption text</label>
                    <input id="caption-input" type="text" className="text-input" maxLength={28} placeholder="e.g. squad day! 🎀" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  </div>
                  <button className="btn btn-ghost" style={{ width: "100%" }} onClick={handleRetakeFromDecorate}>
                    <RefreshIcon width={16} height={16} aria-hidden="true" /> Retake All Photos
                  </button>
                </div>
                <div className="strip-preview-wrap">
                  <div id="stripStage" ref={stripStageRef} onPointerMove={onStickerPointerMove} onPointerUp={onStickerPointerUp} role="img" aria-label="Live preview of your decorated photo strip">
                    <canvas id="stripCanvas" ref={stripCanvasRef} />
                    {stickers.map((s) => (
                      <div
                        key={s.id} className="sticker-el" style={{ left: s.x * 100 + "%", top: s.y * 100 + "%", fontSize: s.size * 0.72 }}
                        onPointerDown={(e) => onStickerPointerDown(e, s.id)}
                        role="button" tabIndex={0} aria-label={s.emoji ? `${s.emoji} sticker, draggable` : "Custom sticker, draggable"}
                      >
                        {s.imageUrl ? <img src={s.imageUrl} alt="" style={{ width: s.size, height: s.size, borderRadius: 8 }} /> : s.emoji}
                        <span className="del" onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }} role="button" tabIndex={0} aria-label="Remove sticker" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); removeSticker(s.id); } }}>✕</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 5 && (
            <div>
              <div className="panel-head"><h1>All done! 🎉</h1><p>Download your final strip or generate a QR code.</p></div>
              <div className="final-wrap">
                <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow)", maxWidth: 360 }}>
                  <canvas ref={finalCanvasRef} style={{ width: "100%", display: "block" }} role="img" aria-label="Your final decorated photo strip" />
                </div>
                {isSupabaseConfigured && (
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }} aria-live="polite">
                    {uploading ? "Saving to your gallery…" : uploadedUrl ? "✓ Saved — ready to share via QR." : "Couldn't save to Supabase — QR will use a local demo link instead."}
                  </p>
                )}
                <div className="final-actions">
                  <button className="btn btn-primary" onClick={handleDownload}><DownloadIcon width={16} height={16} aria-hidden="true" /> Download</button>
                  <button className="btn btn-soft" onClick={() => setShowQr(true)}><QrIcon width={16} height={16} aria-hidden="true" /> Generate QR</button>
                  <button className="btn btn-ghost" onClick={handleNewSession}><RefreshIcon width={16} height={16} aria-hidden="true" /> New Session</button>
                </div>
                {showQr && (
                  <div id="qrBox">
                    <QRCodeCanvas
                      value={uploadedUrl || ("BoothPH session " + sessionCode + " — connect Supabase Storage for a real shareable link.")}
                      size={160}
                      fgColor="#3B2734"
                    />
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", maxWidth: 280, textAlign: "center" }}>
                      {uploadedUrl
                        ? "Scan to open and download this exact strip on any device."
                        : isSupabaseConfigured
                          ? "Upload still in progress — try generating the QR again in a moment."
                          : "This is a demo QR. For real cross-device sharing, connect Supabase (see the README)."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="nav-buttons">
        <button className="btn btn-ghost" style={{ visibility: screen === 0 ? "hidden" : "visible" }} onClick={handleBack}><ArrowLeftIcon width={16} height={16} aria-hidden="true" /> Back</button>
        <button className="btn btn-primary" disabled={!nextEnabled()} style={{ visibility: (screen === 0 || screen === 3 || screen === 5) ? "hidden" : "visible" }} onClick={handleNext}>Next <ArrowRightIcon width={16} height={16} aria-hidden="true" /></button>
      </div>
    </div>
  );
}
