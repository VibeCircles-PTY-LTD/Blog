"use client";

import { C, CAT_COLORS } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";

export default function Footer() {
  const { navigate } = useAppNav();
  const cats = Object.keys(CAT_COLORS || {});
  const year = new Date().getFullYear();
  const socials = [
    { label: "X", href: "https://x.com/vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M18.9 3H21l-6.1 7 7.2 11H16l-4.8-7.2L5 21H3l6.6-7.5L2.6 3H8.8l4.4 6.6L18.9 3zm-2.1 16h1.9L7.4 5H5.4l11.4 14z" />
      </svg>
    ) },
    { label: "Facebook", href: "https://facebook.com/vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M13.5 9H16V6h-2.5c-2 0-3.5 1.5-3.5 3.6V12H7v3h2.5v6H12v-6h3l.5-3H12V9.7c0-.4.3-.7.7-.7z" />
      </svg>
    ) },
    { label: "Instagram", href: "https://instagram.com/vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 8.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 10.5zm5.25-4.25a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
      </svg>
    ) },
    { label: "TikTok", href: "https://tiktok.com/@vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M15 3c.3 2.2 1.8 4 4 4.3V10c-1.6-.1-3.1-.6-4.3-1.5V15a6 6 0 1 1-6-6c.5 0 1 .1 1.5.2v2.9a3 3 0 1 0 2.5 3V3h2.3z" />
      </svg>
    ) },
    { label: "YouTube", href: "https://youtube.com/@vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M22 12c0-2.2-.2-3.5-.5-4.1-.3-.7-1-1.2-1.8-1.3C17.7 6 12 6 12 6s-5.7 0-7.7.6c-.8.1-1.5.6-1.8 1.3C2.2 8.5 2 9.8 2 12s.2 3.5.5 4.1c.3.7 1 1.2 1.8 1.3 2 .6 7.7.6 7.7.6s5.7 0 7.7-.6c.8-.1 1.5-.6 1.8-1.3.3-.6.5-1.9.5-4.1zm-12 3.5v-7l6 3.5-6 3.5z" />
      </svg>
    ) },
    { label: "LinkedIn", href: "https://linkedin.com/company/vibecircle", icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M6.94 8.5H4V20h2.94V8.5zM5.47 4a1.72 1.72 0 1 0 0 3.44A1.72 1.72 0 0 0 5.47 4zM20 20h-2.94v-5.7c0-1.36-.03-3.11-1.9-3.11-1.9 0-2.19 1.48-2.19 3v5.81H10V8.5h2.82v1.57h.04c.39-.74 1.35-1.52 2.78-1.52 2.97 0 3.52 1.96 3.52 4.5V20z" />
      </svg>
    ) },
  ];

  return (
    <footer style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, marginTop: "90px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px clamp(20px,4vw,56px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "36px" }} className="three-grid">
          <div>
            <button onClick={() => navigate(routes.home())} style={{ display: "flex", alignItems: "center", gap: "10px", background: "transparent", border: "none", cursor: "pointer" }}>
              <div style={{ width: "30px", height: "30px", background: C.orange, borderRadius: "2px", display: "grid", placeItems: "center", color: C.bg, fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px" }}>V</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: C.white, letterSpacing: "1px" }}>VibeCircle</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: C.dimmer, letterSpacing: "2px" }}>The Journal</div>
              </div>
            </button>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.7, maxWidth: "320px", marginTop: "12px" }}>
              City culture, creator strategies, and geo-social playbooks. Making energy visible in every neighborhood.
            </p>
          </div>

          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Categories</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cats.map((cat) => (
                <button key={cat} onClick={() => navigate(routes.category(cat))} style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "12px",
                  color: C.dim,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  transition: "color .2s",
                }}
                  onMouseEnter={(e) => { e.target.style.color = C.white; }}
                  onMouseLeave={(e) => { e.target.style.color = C.dim; }}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Explore</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={() => navigate(routes.home())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Blog Home</button>
              <button onClick={() => navigate(routes.authors())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Authors</button>
              <button onClick={() => navigate(routes.privacy?.() || routes.home())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Privacy</button>
              <button onClick={() => navigate(routes.terms?.() || routes.home())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Terms</button>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Company</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>About</a>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>Company</a>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>Contact</a>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>Careers</a>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>VibeCircle</a>
              <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "none" }}>Help Center</a>
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "20px", marginTop: "28px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>(c) {year} VibeCircle - Making energy visible.</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => navigate(routes.authors())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)", background: "none", border: "none", cursor: "pointer", transition: "color .2s" }}
              onMouseEnter={(e) => { e.target.style.color = C.orange; }}
              onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.18)"; }}
            >Team</button>
            <button onClick={() => navigate(routes.home())} style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "11px",
              color: "rgba(255,255,255,0.32)",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "2px",
              padding: "6px 10px",
              cursor: "pointer",
              transition: "color .2s, border-color .2s, background .2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.32)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            >Read Latest</button>
            <div style={{ display: "flex", gap: "8px", marginLeft: "6px" }}>
              {socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noreferrer" style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(255,255,255,0.32)",
                  transition: "color .2s, border-color .2s, background .2s",
                  background: "rgba(255,255,255,0.02)",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.32)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >{s.icon}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
