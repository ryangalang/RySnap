export const metadata = { title: "Terms & Conditions — BoothPH" };

export default function TermsPage() {
  return (
    <section className="legal">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <span className="eyebrow">✦ Legal</span>
        <h1>Terms & Conditions</h1>
        <p className="updated">Last updated: July 15, 2026</p>
        <div className="legal-card">
          <p>By using BoothPH, you agree to the following terms. Please read them carefully before using the service.</p>

          <h2>1. The Service</h2>
          <p>BoothPH is a browser-based photobooth application that lets you capture, customize, and download photos using your device&apos;s camera. It is free to use for personal, non-commercial purposes unless a separate agreement exists for business or event use.</p>

          <h2>2. Camera Access & Use</h2>
          <ul>
            <li>You&apos;ll be asked to allow browser access to your camera before starting a session.</li>
            <li>You control when the camera stream opens and closes — it automatically ends when your session finishes or you leave the page.</li>
            <li>You&apos;re responsible for making sure anyone else appearing in your photos has given their consent.</li>
          </ul>

          <h2>3. User Content</h2>
          <ul>
            <li>Photos you capture with BoothPH belong to you. We do not own or use them for marketing unless you clearly opt in.</li>
            <li>You may not use the service to create content that is harmful, defamatory, or unlawful.</li>
            <li>We reserve the right to remove access for anyone using the service for a purpose prohibited by law.</li>
          </ul>

          <h2>4. Photo Storage</h2>
          <p>Raw captures are stored only temporarily while your browser session is open — they are not automatically uploaded to any server unless we add cloud storage integration in the future (see the Privacy Policy for details). The final output you download stays permanently on your own device.</p>

          <h2>5. Service Availability</h2>
          <p>We aim to keep BoothPH running smoothly, but we don&apos;t guarantee it will always be available without interruption, errors, or delays.</p>

          <h2>6. Limitation of Liability</h2>
          <p>BoothPH is not liable for any loss of data, photos, or disruption caused by use of the service, to the extent permitted by law.</p>

          <h2>7. Changes to These Terms</h2>
          <p>We may update these terms from time to time. Continuing to use BoothPH after any changes means you accept the new terms.</p>

          <h2>8. Contact Us</h2>
          <p>Questions about these terms? Message us on our official social media pages.</p>
        </div>
      </div>
    </section>
  );
}
