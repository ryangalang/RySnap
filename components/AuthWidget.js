"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Mail, LogOut, X } from "lucide-react";

export default function AuthWidget() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return null; // stays hidden until you add Supabase env vars

  async function handleSendLink(e) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setBusy(false);
    if (!error) setSent(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (user) {
    return (
      <button className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 13 }} onClick={handleSignOut}>
        <LogOut width={15} height={15} /> {user.email?.split("@")[0]}
      </button>
    );
  }

  return (
    <>
      <button className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => setOpen(true)}>
        <Mail width={15} height={15} /> Sign in
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(59,39,52,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setOpen(false)}>
          <div className="consent-card" style={{ maxWidth: 360, position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>
              <X width={18} height={18} />
            </button>
            {sent ? (
              <>
                <h3 style={{ marginBottom: 10 }}>Check your inbox 📬</h3>
                <p>We sent a sign-in link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: 10 }}>Sign in to BoothPH</h3>
                <p>We&apos;ll email you a magic link — save your sessions to a personal gallery, no password required.</p>
                <form onSubmit={handleSendLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="email" required className="text-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <button className="btn btn-primary" disabled={busy} type="submit">{busy ? "Sending…" : "Send Magic Link"}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
