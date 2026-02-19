"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { C } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav, useWindowWidth } from "./hooks";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const w = useWindowWidth();
  const { navigate } = useAppNav();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { label: "Blog", href: routes.home(), isActive: pathname === "/" || pathname.startsWith("/category") },
    { label: "Authors", href: routes.authors(), isActive: pathname.startsWith("/author") || pathname === routes.authors() },
  ];

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: scrolled ? "rgba(5,5,10,0.9)" : "rgba(5,5,10,0.65)",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      backdropFilter: "blur(10px)",
      transition: "all .25s",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px clamp(20px,4vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate(routes.home())} style={{ display: "flex", alignItems: "center", gap: "10px", background: "transparent", border: "none", cursor: "pointer" }}>
          <div style={{ width: "30px", height: "30px", background: C.orange, borderRadius: "2px", display: "grid", placeItems: "center", color: C.bg, fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px" }}>V</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: C.white, letterSpacing: "1px" }}>VibeCircle</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: C.dimmer, letterSpacing: "2px" }}>The Journal</div>
          </div>
        </button>

        {w > 760 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {links.map((l) => (
              <button key={l.label} onClick={() => navigate(l.href)} style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "13px",
                letterSpacing: "3px",
                color: l.isActive ? C.orange : C.dimmer,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "color .2s",
              }}
                onMouseEnter={(e) => { e.target.style.color = C.white; }}
                onMouseLeave={(e) => { e.target.style.color = l.isActive ? C.orange : C.dimmer; }}
              >{l.label}</button>
            ))}
            <button onClick={() => navigate(routes.home())} style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "12px",
              letterSpacing: "2px",
              padding: "10px 16px",
              background: C.orange,
              color: C.bg,
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
              boxShadow: `0 10px 30px ${C.orange}35`,
            }}>Read Latest</button>
          </div>
        ) : (
          <button onClick={() => setMenuOpen((o) => !o)} style={{ background: "transparent", border: "none", color: C.white, cursor: "pointer", fontSize: "20px" }}>☰</button>
        )}
      </div>

      {w <= 760 && menuOpen && (
        <div style={{ padding: "0 24px 18px", animation: "slideDown .2s ease" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {links.map((l) => (
              <button key={l.label} onClick={() => navigate(l.href)} style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "13px",
                letterSpacing: "3px",
                color: l.isActive ? C.orange : C.dimmer,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "10px 12px",
                borderRadius: "2px",
                cursor: "pointer",
              }}>{l.label}</button>
            ))}
            <button onClick={() => navigate(routes.home())} style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "12px",
              letterSpacing: "2px",
              padding: "10px 16px",
              background: C.orange,
              color: C.bg,
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}>Read Latest</button>
          </div>
        </div>
      )}
    </nav>
  );
}


