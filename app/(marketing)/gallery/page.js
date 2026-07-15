"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchUserGallery } from "@/lib/supabaseData";
import { Download, ImageOff } from "lucide-react";

export default function GalleryPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (u) {
        const rows = await fetchUserGallery(u.id);
        setItems(rows);
      }
      setLoading(false);
    });
  }, []);

  return (
    <section className="legal">
      <div className="wrap" style={{ maxWidth: 900 }}>
        <span className="eyebrow">✦ Your Gallery</span>
        <h1>Saved Sessions</h1>
        <p className="updated">Every strip you&apos;ve saved while signed in shows up here.</p>

        {!isSupabaseConfigured && (
          <div className="legal-card" style={{ textAlign: "center" }}>
            <ImageOff style={{ margin: "0 auto 12px", color: "var(--ink-soft)" }} width={32} height={32} />
            <p style={{ marginBottom: 0 }}>
              The gallery needs Supabase connected to work. Add your <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (see the README), then run the SQL in{" "}
              <code>supabase/schema.sql</code>.
            </p>
          </div>
        )}

        {isSupabaseConfigured && loading && (
          <div className="legal-card" style={{ textAlign: "center" }}><p style={{ marginBottom: 0 }}>Loading your gallery…</p></div>
        )}

        {isSupabaseConfigured && !loading && !user && (
          <div className="legal-card" style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 0 }}>Sign in from the navbar to see your saved sessions.</p>
          </div>
        )}

        {isSupabaseConfigured && !loading && user && items.length === 0 && (
          <div className="legal-card" style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 12 }}>No saved sessions yet.</p>
            <Link href="/session" className="btn btn-primary">Start a Session →</Link>
          </div>
        )}

        {isSupabaseConfigured && !loading && items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 18 }}>
            {items.map((it) => {
              const url = it.session_photos?.[0]?.public_url;
              return (
                <div key={it.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  {url ? (
                    <img src={url} alt={it.session_code} style={{ width: "100%", display: "block" }} />
                  ) : (
                    <div style={{ aspectRatio: "2/3", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
                      <ImageOff width={24} height={24} />
                    </div>
                  )}
                  <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
                      {new Date(it.created_at).toLocaleDateString()}
                    </p>
                    {url && (
                      <a href={url} download className="btn btn-soft" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}>
                        <Download width={14} height={14} /> Download
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
