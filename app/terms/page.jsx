import { C } from "../../lib/blog-data";

export const metadata = {
  title: "Terms of Service — VibeCircle Journal",
  description: "Terms and conditions for using the VibeCircle Journal site.",
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

export default function TermsPage() {
  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ padding: "110px clamp(20px,4vw,56px) 60px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "4px", color: C.dimmer, marginBottom: "10px" }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,6vw,72px)", lineHeight: 0.95, color: C.white }}>
            Terms of Service
          </h1>
          <p style={{ ...BODY_STYLE, marginTop: "14px", maxWidth: "720px" }}>
            Effective date: February 20, 2026. By accessing or using VibeCircle Journal, you agree to these terms. If you do not
            agree, please do not use the site.
          </p>
        </div>
      </section>

      <section style={{ padding: "48px clamp(20px,4vw,56px) 90px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2 style={SECTION_TITLE_STYLE}>Use of the Site</h2>
          <p style={BODY_STYLE}>
            You may use the site for personal, non-commercial purposes. You agree not to misuse the site, attempt to disrupt
            service, or access areas you are not authorized to access.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Accounts & Subscriptions</h2>
          <p style={BODY_STYLE}>
            If you subscribe to newsletters or updates, you are responsible for providing accurate information and keeping it
            up to date. You may unsubscribe at any time.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Content & Intellectual Property</h2>
          <p style={BODY_STYLE}>
            All content on the site, including articles, graphics, and branding, is owned by VibeCircle or its licensors and is
            protected by applicable intellectual property laws. You may not reproduce or distribute content without permission,
            except for personal, non-commercial use with attribution.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>User Submissions</h2>
          <p style={BODY_STYLE}>
            If you submit feedback or ideas, you grant VibeCircle a non-exclusive, worldwide, royalty-free license to use that
            feedback to improve the site or related services.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Third-Party Links</h2>
          <p style={BODY_STYLE}>
            The site may link to third-party websites. We are not responsible for the content or practices of those sites. Access
            them at your own risk.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Disclaimers</h2>
          <p style={BODY_STYLE}>
            The site is provided on an "as is" and "as available" basis. We make no warranties regarding accuracy, completeness,
            or availability of content. Use the site at your own risk.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Limitation of Liability</h2>
          <p style={BODY_STYLE}>
            To the fullest extent permitted by law, VibeCircle will not be liable for any indirect, incidental, or consequential
            damages arising from your use of the site.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Changes</h2>
          <p style={BODY_STYLE}>
            We may update these terms from time to time. When we do, we will revise the effective date above. Continued use of the
            site after changes become effective constitutes acceptance of the updated terms.
          </p>

          <h2 style={SECTION_TITLE_STYLE}>Contact</h2>
          <p style={BODY_STYLE}>
            Questions about these terms can be sent to{" "}
            <a href="mailto:legal@vibecircle.com" style={{ color: C.orange, textDecoration: "none" }}>legal@vibecircle.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
