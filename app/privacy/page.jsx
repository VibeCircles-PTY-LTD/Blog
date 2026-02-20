import { C } from "../../lib/blog-data";

export const metadata = {
  title: "Privacy Policy — VibeCircle Journal",
  description: "How VibeCircle Journal collects, uses, and protects your data.",
};

const SECTION_TITLE_STYLE = {
  fontFamily: "'Bebas Neue',sans-serif",
  fontSize: "clamp(20px,2.4vw,28px)",
  color: C.orange,
  letterSpacing: ".3px",
  margin: "32px 0 10px",
  lineHeight: 1.1,
};

const BODY_STYLE = {
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "clamp(14px,1.5vw,17px)",
  color: "rgba(255,255,255,0.74)",
  lineHeight: 1.85,
};

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ padding: "110px clamp(20px,4vw,56px) 60px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "4px", color: C.dimmer, marginBottom: "10px" }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,6vw,72px)", lineHeight: 0.95, color: C.white }}>
            Privacy Policy
          </h1>
          <p style={{ ...BODY_STYLE, marginTop: "14px", maxWidth: "720px" }}>
            Effective date: February 20, 2026. This policy explains how VibeCircle Journal collects, uses, and protects information
            when you visit our site or interact with our content.
          </p>
        </div>
      </section>

      <section style={{ padding: "48px clamp(20px,4vw,56px) 90px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2 style={SECTION_TITLE_STYLE}>What We Collect</h2>
          <p style={BODY_STYLE}>
            We collect information you provide directly, such as your email address if you subscribe to newsletters, along with
            basic contact details if you reach out to support. We also collect limited technical data like IP address, browser
            type, device identifiers, and usage events to keep the site secure and improve performance.
          </p>
          <ul style={{ ...BODY_STYLE, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
            <li>Contact details submitted through forms or email.</li>
            <li>Newsletter subscription data.</li>
            <li>Usage and diagnostics data (pages viewed, device, and browser info).</li>
          </ul>

          <h2 style={SECTION_TITLE_STYLE}>How We Use Information</h2>
          <p style={BODY_STYLE}>
            We use your information to deliver content, maintain site reliability, understand readership trends, and improve the
            overall experience. We do not sell personal information.
          </p>
          <ul style={{ ...BODY_STYLE, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
            <li>Send newsletters or updates you explicitly opt in to receive.</li>
            <li>Respond to inquiries and provide support.</li>
            <li>Analyze site usage to improve editorial and product decisions.</li>
            <li>Protect against fraud, abuse, and security issues.</li>
          </ul>

          <h2 style={SECTION_TITLE_STYLE}>Cookies & Analytics</h2>
          <p style={BODY_STYLE}>
            We may use cookies or similar technologies to remember preferences and understand how the site is used. You can
            control cookies through your browser settings. Disabling cookies may limit some site functionality.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Sharing</h2>
          <p style={BODY_STYLE}>
            We share information only with trusted service providers that help operate the site (analytics, hosting, email
            delivery), and only as needed to provide services on our behalf. We may also disclose information if required by law.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Data Retention</h2>
          <p style={BODY_STYLE}>
            We retain information only as long as needed to provide services, comply with legal obligations, and resolve disputes.
            You can request deletion of your contact information at any time.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Your Choices</h2>
          <p style={BODY_STYLE}>
            You can unsubscribe from newsletters at any time, adjust your browser cookie settings, or request access, correction,
            or deletion of your information by contacting us.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Security</h2>
          <p style={BODY_STYLE}>
            We use reasonable safeguards to protect your information. No method of transmission or storage is 100% secure, so we
            cannot guarantee absolute security.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Children</h2>
          <p style={BODY_STYLE}>
            The site is not intended for children under 13. We do not knowingly collect personal information from children.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Contact</h2>
          <p style={BODY_STYLE}>
            For privacy questions or requests, contact us at{" "}
            <a href="mailto:privacy@vibecircle.com" style={{ color: C.orange, textDecoration: "none" }}>privacy@vibecircle.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
