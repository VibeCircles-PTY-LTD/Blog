"use client";

import { useRef, useState } from "react";
import { C, CAT_COLORS } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";
import {
  AuthorChip,
  CatBadge,
  NewsletterForm,
  Orb,
  ReadingProgress,
  RenderBody,
  Reveal,
  ShareButtons,
  Tag,
  Thumbnail,
  Toast,
  PostCard,
} from "./blog-ui";

export default function ArticleView({ slug, posts = [] }) {
  const post = posts.find((p) => p.slug === slug);
  const [toast, setToast] = useState(null);
  const articleRef = useRef(null);
  const { navigate, goBack } = useAppNav();
  const catColor = post ? (post.catColor || CAT_COLORS[post.cat] || C.orange) : C.orange;

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, flexDirection: "column", gap: "16px", padding: "120px 24px" }}>
        <div style={{ fontSize: "48px", opacity: .3 }}>?Y"?</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: C.white }}>Post Not Found</h2>
        <button onClick={() => navigate(routes.home())} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", padding: "12px 28px", background: C.orange, color: C.bg, border: "none", borderRadius: "2px", cursor: "pointer" }}>Back to Blog</button>
      </div>
    );
  }

  const idx = posts.findIndex((p) => p.slug === slug);
  const prevPost = posts[idx + 1] || null;
  const nextPost = posts[idx - 1] || null;
  const related = posts.filter((p) => p.id !== post.id).slice(0, 4);

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <ReadingProgress articleRef={articleRef} post={post} />

      <section style={{ paddingTop: "110px", padding: "110px clamp(20px,4vw,56px) 60px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <Orb top="-15%" right="-5%" size={600} color={catColor} opacity={0.09} />
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ animation: "fadeUp .45s ease forwards", opacity: 0, marginBottom: "20px" }}>
            <button onClick={goBack} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color .2s" }} onMouseEnter={(e) => { e.target.style.color = C.white; }} onMouseLeave={(e) => { e.target.style.color = C.dimmer; }}>? Back</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px", flexWrap: "wrap", animation: "fadeUp .5s .05s ease forwards", opacity: 0 }}>
            <CatBadge cat={post.cat} size="lg" color={catColor} onClick={() => navigate(routes.category(post.cat))} />
            <Tag color={catColor}>{post.readTime}</Tag>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{post.date}</span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px,5vw,72px)", lineHeight: .95, color: C.white, letterSpacing: "-1px", marginBottom: "20px", animation: "fadeUp .55s .08s ease forwards", opacity: 0 }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(15px,1.6vw,20px)", color: C.dim, lineHeight: 1.8, marginBottom: "28px", animation: "fadeUp .6s .1s ease forwards", opacity: 0 }}>
            {post.sub}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", animation: "fadeUp .6s .12s ease forwards", opacity: 0 }}>
            <AuthorChip author={post.author} role={post.authorRole} avatar={post.avatar} avatarUrl={post.authorImageUrl} color={catColor} onClick={() => navigate(routes.author(post.author))} />
            <ShareButtons post={post} onToast={setToast} />
          </div>
        </div>
      </section>

      <section ref={articleRef} style={{ padding: "56px clamp(20px,4vw,56px)", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "26px" }}>
          <Thumbnail post={post} height="280px" fontSize="80px" />
        </div>
        <RenderBody text={post.body} catColor={catColor} />
      </section>

      <section style={{ padding: "40px clamp(20px,4vw,56px) 10px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ padding: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "10px" }}>Stay in the Pulse</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.white, lineHeight: 1.05, marginBottom: "6px" }}>Weekly drops from the VibeCircle Journal.</h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.6 }}>City intel, creator strategies, and geo-social playbooks ? straight to your inbox.</p>
            </div>
            <div style={{ width: "260px" }}>
              <NewsletterForm color={catColor} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "56px clamp(20px,4vw,56px)", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer }}>Related Articles</div>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          {related.map((p, i) => <Reveal key={p.id} delay={i * .08}><PostCard post={p} navigate={navigate} /></Reveal>)}
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px,4vw,56px) 80px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }} className="two-grid">
          {[prevPost, nextPost].map((p, i) => p ? (
            <Reveal key={p.id} delay={i * .06}>
              <div onClick={() => navigate(routes.post(p.slug))} style={{
                padding: "20px 22px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all .3s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.background = `${catColor}08`; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "2px", color: C.dimmer, marginBottom: "6px" }}>{i === 0 ? "Previous" : "Next"}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "20px", color: C.white, marginBottom: "6px" }}>{p.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim }}>{p.sub}</div>
              </div>
            </Reveal>
          ) : (
            <div key={`empty-${i}`} />
          ))}
        </div>
      </section>
    </div>
  );
}




