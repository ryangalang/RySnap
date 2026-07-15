export const metadata = { title: "Privacy Policy — BoothPH" };

export default function PrivacyPage() {
  return (
    <section className="legal">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <span className="eyebrow">✦ Legal</span>
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: July 15, 2026</p>
        <div className="legal-card">
          <p>We take your privacy seriously. This policy explains what information BoothPH collects, how it&apos;s used, and how long it&apos;s kept.</p>

          <h2>1. Camera & Photos</h2>
          <ul>
            <li>Your device camera is only used while a session is open — it is never recorded or stored beyond the photos you actively capture.</li>
            <li>Raw captures are temporary: they live in your browser session and are automatically cleared when you close the tab, or within 24 hours if connected to cloud storage.</li>
            <li>Final outputs (after editing and downloading) go straight to your device — they are not automatically uploaded to our servers in this version.</li>
          </ul>

          <h2>2. Account Data (if the login feature is enabled)</h2>
          <p>Once the account/login feature is enabled, the only information collected will be: email address, name, and the gallery history of your saved sessions. We do not sell or share this with third-party advertisers.</p>

          <h2>3. Cookies & Analytics</h2>
          <p>We may use basic analytics (e.g. session counts, most-used templates) to improve the service. This is not linked to your personal identity unless you&apos;re logged in.</p>

          <h2>4. Data Sharing</h2>
          <p>We do not sell your photos or personal information to anyone. The QR code sharing feature is designed only for you and the people in your session — it is not publicly accessible.</p>

          <h2>5. Your Rights</h2>
          <ul>
            <li>You have the right to request a copy or deletion of any data we hold about you (if you have an account).</li>
            <li>You can revoke camera access at any time through your browser settings.</li>
          </ul>

          <h2>6. Children&apos;s Safety</h2>
          <p>BoothPH is not specifically designed for children. If you are a minor, please get a parent or guardian&apos;s consent before using the service.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this policy from time to time. The updated date will be shown at the top of this page.</p>

          <h2>8. Contact Us</h2>
          <p>Questions about your privacy? Message us on our official social media pages.</p>
        </div>
      </div>
    </section>
  );
}
