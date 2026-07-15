import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 40,
          }}
        >
          <div>
            <Link href="/" className="logo" style={{ marginBottom: 14, fontSize: 18 }}>
              <span className="mark" style={{ width: 32, height: 32 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" />
                </svg>
              </span>
              BoothPH
            </Link>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, maxWidth: 260, lineHeight: 1.6, marginTop: 10 }}>
              The people&apos;s photobooth — cute, fast, and right in your browser.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Product</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <li><Link href="/#features" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Features</Link></li>
              <li><Link href="/#themes" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Themes</Link></li>
              <li><Link href="/session" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Start a Session</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Legal</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <li><Link href="/terms" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Terms & Conditions</Link></li>
              <li><Link href="/privacy" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Follow Us</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              <li><a href="#" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Instagram</a></li>
              <li><a href="#" style={{ color: "var(--ink-soft)", fontSize: 14 }}>Facebook</a></li>
              <li><a href="#" style={{ color: "var(--ink-soft)", fontSize: 14 }}>TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 BoothPH. Made in the Philippines, for everyone.</span>
          <span>
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
