"use client";
import Link from "next/link";
import AuthWidget from "./AuthWidget";

export default function Navbar() {
  return (
    <header className="site">
      <nav className="site">
        <Link href="/" className="logo">
          <span className="mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 8.5C4 7.12 5.12 6 6.5 6H8L9.2 4.4C9.5 4 9.97 3.75 10.47 3.75H13.53C14.03 3.75 14.5 4 14.8 4.4L16 6H17.5C18.88 6 20 7.12 20 8.5V16.5C20 17.88 18.88 19 17.5 19H6.5C5.12 19 4 17.88 4 16.5V8.5Z" stroke="white" strokeWidth="1.6"/>
              <circle cx="12" cy="12.5" r="3.4" stroke="white" strokeWidth="1.6"/>
            </svg>
          </span>
          BoothPH
        </Link>
        <ul className="nav-links">
          <li><Link href="/#features">Features</Link></li>
          <li><Link href="/#how">How It Works</Link></li>
          <li><Link href="/#themes">Themes</Link></li>
          <li><Link href="/gallery">Gallery</Link></li>
          <li><Link href="/privacy">Privacy</Link></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AuthWidget />
          <Link href="/session" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: 14 }}>
            Start a Session ✦
          </Link>
        </div>
      </nav>
    </header>
  );
}
