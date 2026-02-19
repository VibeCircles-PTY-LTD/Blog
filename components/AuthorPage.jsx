"use client";

import { C, CAT_COLORS } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";
import { Orb, PostCard, Reveal } from "./blog-ui";

export default function AuthorPage({ author, posts = [] }) {
  const color = posts.length ? (posts[0].catColor || CAT_COLORS[posts[0].cat] || C.orange) : C.orange;
  const { navigate } = useAppNav();

  if (!author) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, flexDirection: "column", gap: "16px", padding: "120px 24px" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: C.white }}>Author not found</h2>
        <button onClick={() => navigate(routes.home())} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", padding: "12px 28px", background: C.orange, color: C.bg, border: "none", borderRadius: "2px", cursor: "pointer" }}>Back to Blog</button>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ paddingTop: "110px", padding: "110px clamp(20px,4vw,56px) 60px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <Orb top="-10%" right="-5%" size={500} color={color} opacity={0.1} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ animation: "fadeUp .45s ease forwards", opacity: 0, marginBottom: "28px" }}>
            <button onClick={() => navigate(routes.home())} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color .2s" }} onMouseEnter={(e) => { e.target.style.color = C.white; }} onMouseLeave={(e) => { e.target.style.color = C.dimmer; }}>← All Posts</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", animation: "fadeUp .5s .05s ease forwards", opacity: 0, marginBottom: "24px" }}>
            {author.imageUrl ? (
              <img src={author.imageUrl} alt={author.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}50`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `${color}20`, border: `3px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>{author.avatar}</div>
            )}
            <div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px,5vw,64px)", color: C.white, lineHeight: .95, letterSpacing: "-.5px" }}>{author.name}</h1>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "15px", color, marginTop: "6px" }}>{author.role}</div>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "16px", color: C.dim, maxWidth: "520px", lineHeight: 1.7, animation: "fadeUp .5s .1s ease forwards", opacity: 0 }}>
            {posts.length} article{posts.length !== 1 ? "s" : ""} published on the VibeCircle Blog.
          </p>
        </div>
      </section>
      <section style={{ padding: "56px clamp(20px,4vw,56px)", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          {posts.map((p, i) => <Reveal key={p.id} delay={i * .09}><PostCard post={p} navigate={navigate} /></Reveal>)}
        </div>
      </section>
    </div>
  );
}


