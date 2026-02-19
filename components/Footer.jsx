"use client";

import { C } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";

export default function Footer() {
  const { navigate } = useAppNav();
  const cats = ["City Culture", "Creator Economy", "Brand Strategy", "Music & Events", "Tech & Maps", "Campus Life"];

  return (
    <footer style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, marginTop: "90px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "56px clamp(20px,4vw,56px) 32px" }}>
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "30px", height: "30px", background: C.orange, borderRadius: "2px", display: "grid", placeItems: "center", color: C.bg, fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px" }}>V</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: C.white, letterSpacing: "1px" }}>VibeCircle</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: C.dimmer, letterSpacing: "2px" }}>The Journal</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.7, maxWidth: "320px" }}>
              Stories, signals, and strategies from the front lines of city culture, creator economy, and geo-social innovation.
            </p>
          </div>
          <div style={{ minWidth: "180px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Categories</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cats.map((c) => (
                <button key={c} onClick={() => navigate(routes.category(c))} style={{
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
                >{c}</button>
              ))}
            </div>
          </div>
          <div style={{ minWidth: "180px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Explore</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button onClick={() => navigate(routes.home())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Blog Home</button>
              <button onClick={() => navigate(routes.authors())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>Authors</button>
            </div>
          </div>
        </div>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "20px", marginTop: "28px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>© 2026 VibeCircle — Making energy visible.</p>
          <button onClick={() => navigate(routes.authors())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)", background: "none", border: "none", cursor: "pointer", transition: "color .2s" }}
            onMouseEnter={(e) => { e.target.style.color = C.orange; }}
            onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.18)"; }}
          >Meet the Authors →</button>
        </div>
      </div>
    </footer>
  );
}


