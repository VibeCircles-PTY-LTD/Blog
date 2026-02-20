"use client";

import { useEffect, useMemo, useState } from "react";
import { C, CAT_COLORS } from "../lib/blog-data";
import { routes } from "../lib/routes";
import { useAppNav } from "./hooks";
import { FeaturedCard, NewsletterForm, Orb, PostCard, Reveal, Tag } from "./blog-ui";

const POSTS_PER_PAGE = 6;

export default function BlogIndex({ posts = [], authors = [], filterCat = null }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { navigate } = useAppNav();

  useEffect(() => {
    setPage(1);
  }, [filterCat, search]);

  const categories = useMemo(() => {
  const map = new Map();
  Object.keys(CAT_COLORS || {}).forEach((cat) => {
    map.set(cat, { title: cat, color: CAT_COLORS[cat] || C.orange });
  });
  posts.forEach((p) => {
    if (!p.cat) return;
    if (!map.has(p.cat)) {
      map.set(p.cat, {
        title: p.cat,
        color: p.catColor || CAT_COLORS[p.cat] || C.orange,
      });
    }
  });
  return [...map.values()];
}, [posts]);

  if (posts.length === 0) {
    return (
      <div style={{ background: C.bg, color: C.white, minHeight: "100vh", padding: "140px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "42px", opacity: 0.3, marginBottom: "10px" }}>??</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", marginBottom: "8px" }}>No posts yet</div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: C.dimmer }}>Publish your first post in the Studio.</p>
      </div>
    );
  }

  const featured = posts.find((p) => p.featured) || posts[0];
  const accentColor = filterCat
    ? categories.find((c) => c.title === filterCat)?.color || C.orange
    : C.orange;

  const filtered = useMemo(() => {
    let items = posts.slice();
    if (filterCat) items = items.filter((p) => p.cat === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => {
        const title = (p.title || "").toLowerCase();
        const sub = (p.sub || "").toLowerCase();
        const body = (p.bodyText || "").toLowerCase();
        const author = (p.author || "").toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags : [];
        return (
          title.includes(q)
          || sub.includes(q)
          || body.includes(q)
          || author.includes(q)
          || tags.some((t) => String(t || "").toLowerCase().includes(q))
        );
      });
    }
    return items;
  }, [filterCat, search, posts]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const showFeatured = !filterCat && !search && page === 1;

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ paddingTop: "120px", padding: "120px clamp(20px,4vw,56px) 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.orange}05 1px,transparent 1px),linear-gradient(90deg,${C.orange}05 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
        <Orb top="-15%" right="-5%" size={640} opacity={0.1} />
        <Orb bottom="-30%" left="20%" size={480} color={C.pink} opacity={0.07} delay="4s" />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {filterCat ? (
            <Reveal>
              <div style={{ marginBottom: "12px" }}><Tag color={accentColor}>{filterCat}</Tag></div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(44px,7vw,90px)", lineHeight: 0.92, color: C.white, letterSpacing: "-1px", marginBottom: "12px" }}>
                {filterCat}<br /><span style={{ color: accentColor }}>Articles.</span>
              </h1>
              <button
                onClick={() => navigate(routes.home())}
                style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={(e) => { e.target.style.color = C.white; }}
                onMouseLeave={(e) => { e.target.style.color = C.dimmer; }}
              >
                ? All posts
              </button>
            </Reveal>
          ) : (
            <div>
              <div style={{ animation: "fadeUp .5s ease forwards", opacity: 0, marginBottom: "16px" }}><Tag>VibeCircle Journal</Tag></div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(56px,9vw,110px)", lineHeight: 0.88, color: C.white, animation: "fadeUp .52s .07s ease forwards", opacity: 0, marginBottom: "12px", letterSpacing: "-2px" }}>
                THE<br /><span style={{ WebkitTextStroke: "2px #FF6B00", color: "transparent", letterSpacing: "2px" }}>PULSE<span style={{ marginLeft: "6px" }}>.</span></span>
              </h1>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(14px,1.6vw,18px)", color: C.dim, maxWidth: "480px", lineHeight: 1.75, animation: "fadeUp .52s .14s ease forwards", opacity: 0 }}>
                Insights on city culture, the creator economy, and the technology making it all move.
              </p>
            </div>
          )}
        </div>
      </section>

      <div style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: "68px", zIndex: 99 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "52px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", overflowX: "auto", flex: 1 }}>
            {[{ title: "All", color: C.orange }, ...categories].map((cat) => {
              const active = cat.title === "All" ? !filterCat : filterCat === cat.title;
              return (
                <button
                  key={cat.title}
                  onClick={() => navigate(cat.title === "All" ? routes.home() : routes.category(cat.title))}
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "11px",
                    letterSpacing: "2px",
                    padding: "16px 13px",
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${active ? cat.color : "transparent"}`,
                    color: active ? cat.color : C.dimmer,
                    cursor: "pointer",
                    transition: "all .2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", padding: "7px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.white, outline: "none", width: "160px", flexShrink: 0, transition: "border-color .2s" }}
            onFocus={(e) => { e.target.style.borderColor = C.orange; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
        </div>
      </div>

      {showFeatured && (
        <section style={{ padding: "48px clamp(20px,4vw,56px) 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Reveal style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.orange, animation: "dotBlink 2s infinite" }} />
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "4px", color: C.orange }}>Featured Story</span>
                <div style={{ flex: 1, height: "1px", background: C.border }} />
              </div>
            </Reveal>
            <Reveal>
              <FeaturedCard post={featured} navigate={navigate} />
            </Reveal>
          </div>
        </section>
      )}

      <section style={{ padding: "32px clamp(20px,4vw,56px)", maxWidth: "1200px", margin: "0 auto" }}>
        <Reveal style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: C.dimmer }}>
              {search ? `"${search}" — ` : ""}{filtered.length} Article{filtered.length !== 1 ? "s" : ""}{filterCat ? ` in ${filterCat}` : ""}
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
          </div>
        </Reveal>

        {!search && !filterCat && page === 1 ? (
          <div className="sidebar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "48px", alignItems: "flex-start" }}>
            <div>
              <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {paginated.slice(0, 2).map((p, i) => <Reveal key={p.id} delay={i * 0.08}><PostCard post={p} navigate={navigate} /></Reveal>)}
              </div>
              {paginated.slice(2).map((p, i) => (
                <Reveal key={p.id} delay={i * 0.06}><PostCard post={p} navigate={navigate} variant="compact" /></Reveal>
              ))}
            </div>
            <aside>
              <Reveal>
                <div style={{ padding: "28px 24px", background: `${C.orange}0C`, border: `1px solid ${C.orange}25`, borderRadius: "4px", marginBottom: "24px" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.orange, marginBottom: "8px" }}>The Pulse Newsletter</div>
                  <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.white, lineHeight: 1.05, marginBottom: "8px" }}>City intel.<br />Weekly drops.</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.55, marginBottom: "14px" }}>The VibeCircle Journal straight to your inbox every Tuesday. No spam. Just signal.</p>
                  <NewsletterForm />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "14px" }}>Browse by Category</div>
                  {categories.map((cat) => {
                    const count = posts.filter((p) => p.cat === cat.title).length;
                    return (
                      <button key={cat.title} onClick={() => navigate(routes.category(cat.title))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "9px 10px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "2px", transition: "background .2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dim }}>{cat.title}</span>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: cat.color }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "4px" }}>Authors</div>
                  {authors.map((a) => (
                    <button key={a.name} onClick={() => navigate(routes.author(a.name))} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "2px", transition: "background .2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,107,0,0.3)", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>{a.avatar}</div>
                      )}
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.white }}>{a.name}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: C.dimmer }}>{a.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Reveal>
            </aside>
          </div>
        ) : (
          <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {paginated.map((p, i) => <Reveal key={p.id} delay={i * 0.08}><PostCard post={p} navigate={navigate} /></Reveal>)}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "28px" }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "12px",
                letterSpacing: "2px",
                padding: "8px 12px",
                background: page === i + 1 ? C.orange : "transparent",
                color: page === i + 1 ? C.bg : C.dimmer,
                border: `1px solid ${page === i + 1 ? C.orange : "rgba(255,255,255,0.1)"}`,
                borderRadius: "2px",
                cursor: "pointer",
              }}>{i + 1}</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



