import "./globals.css";

export const metadata = {
  title: "BoothPH — The People's Photobooth",
  description: "A photobooth session, right in your browser. Pick the layout, angle, and filter you want.",
};

// Fonts are loaded via a plain <link> tag instead of next/font/google.
// This keeps `next build` fully offline-safe (no build-time fetch to
// fonts.googleapis.com), which matters in sandboxed/CI environments.
// The fonts still load normally for real visitors in the browser.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
