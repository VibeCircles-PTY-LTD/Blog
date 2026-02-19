"use client";

import { C, CAT_COLORS } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";
import { Orb, Reveal, Tag } from "./blog-ui";

export default function AuthorsPage({ authors = [] }) {
  const { navigate } = useAppNav();

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ paddingTop: "110px", padding: "110px clamp(20px,4vw,56px) 60px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <Orb top="-10%" right="-5%" size={500} opacity={0.1} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ animation: "fadeUp .45s ease forwards", opacity: 0, marginBottom: "20px" }}><Tag>Contributors</Tag></div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(44px,7vw,90px)", lineHeight: .9, color: C.white, letterSpacing: "-1px", animation: "fadeUp .5s .07s ease forwards", opacity: 0 }}>
            The<br /><span style={{ color: C.orange }}>Authors.</span>
          </h1>
        </div>
      </section>
      <section style={{ padding: "56px clamp(20px,4vw,56px)", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          {authors.map((a, i) => {
            const color = a.latestCategoryColor || (a.latestCategory ? (CAT_COLORS[a.latestCategory] || C.orange) : C.orange);
            const count = a.postCount || 0;
            return (
              <Reveal key={a.name} delay={i * .08}>
                <div onClick={() => navigate(routes.author(a.name))} style={{ padding: "32px 28px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", cursor: "pointer", transition: "all .3s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = ""; }}
                >
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}40`, marginBottom: "16px" }} />
                  ) : (
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `${color}20`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" }}>{a.avatar}</div>
                  )}
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.white, marginBottom: "4px" }}>{a.name}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color, marginBottom: "12px" }}>{a.role}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{count} article{count !== 1 ? "s" : ""}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}


