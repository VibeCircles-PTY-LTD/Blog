"use client";

import { useEffect, useState } from "react";
import { C, CAT_COLORS } from "../lib/blog-data";
import { useInView } from "./hooks";
import { routes } from "../lib/routes";
import { VibeCirclePortableText } from "./PortableText";

export function Toast({ message, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed",
      bottom: "32px",
      left: "50%",
      transform: "translateX(-50%)",
      background: C.orange,
      color: C.bg,
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: "13px",
      letterSpacing: "2px",
      padding: "12px 28px",
      borderRadius: "2px",
      zIndex: 9999,
      boxShadow: `0 16px 40px ${C.orange}50`,
      animation: "toastIn .3s ease forwards",
    }}>{message}</div>
  );
}

export function Thumbnail({ post, height = "180px", fontSize = "44px" }) {
  const [a, b] = post.thumbGrad;
  return (
    <div style={{
      width: "100%",
      height,
      borderRadius: "3px",
      background: `linear-gradient(135deg, ${a}22 0%, ${b}22 100%)`,
      border: `1px solid ${a}30`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${a}08 1px,transparent 1px),linear-gradient(90deg,${a}08 1px,transparent 1px)`,
        backgroundSize: "24px 24px",
      }} />
      <div style={{
        position: "absolute",
        borderRadius: "50%",
        width: "120px",
        height: "120px",
        top: "-20px",
        right: "-20px",
        background: `radial-gradient(circle,${a}30 0%,transparent 70%)`,
      }} />
      {post.coverImageUrl ? (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ fontSize, position: "relative", zIndex: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.5))" }}>
          {post.emoji}
        </div>
      )}
    </div>
  );
}

export function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(24px)",
      transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

export function Orb({ top, left, right, bottom, size = 500, color = C.orange, opacity = 0.12, delay = "0s" }) {
  return (
    <div style={{
      position: "absolute",
      borderRadius: "50%",
      width: size,
      height: size,
      top,
      left,
      right,
      bottom,
      pointerEvents: "none",
      background: `radial-gradient(circle,${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 0%,transparent 70%)`,
      animation: `orbFloat 9s ease-in-out ${delay} infinite`,
    }} />
  );
}

export function Tag({ children, color = C.orange }) {
  return (
    <span style={{
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: "11px",
      letterSpacing: "4px",
      color,
      border: `1px solid ${color}40`,
      padding: "5px 12px",
      borderRadius: "2px",
      display: "inline-block",
      textTransform: "uppercase",
    }}>{children}</span>
  );
}

export function CatBadge({ cat, size = "sm", color, onClick }) {
  const resolved = color || CAT_COLORS[cat] || C.orange;
  const fs = size === "lg" ? "13px" : "10px";
  const pad = size === "lg" ? "5px 14px" : "3px 9px";
  return (
    <span onClick={onClick} style={{
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: fs,
      letterSpacing: "2px",
      color: resolved,
      padding: pad,
      background: `${resolved}15`,
      border: `1px solid ${resolved}40`,
      borderRadius: "2px",
      textTransform: "uppercase",
      display: "inline-block",
      cursor: onClick ? "pointer" : "default",
      transition: onClick ? "all .2s" : undefined,
    }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.background = `${resolved}30`; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.background = `${resolved}15`; } : undefined}
    >{cat}</span>
  );
}

export function ReadTime({ t }) {
  return (
    <span style={{
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: "10px",
      letterSpacing: "2px",
      color: C.dimmer,
    }}>{t}</span>
  );
}

export function AuthorChip({ author, role, avatar, avatarUrl, color = C.orange, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: onClick ? "pointer" : "default" }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={author} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: `1px solid ${color}40` }} />
      ) : (
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>{avatar}</div>
      )}
      <div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.white }}>{author}</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: C.dimmer }}>{role}</div>
      </div>
    </div>
  );
}

export function NewsletterForm({ color = C.orange }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "15px", color, padding: "8px 0" }}>You're in. âœ“</div>;
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && email.includes("@") && setSent(true)}
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "2px",
          padding: "10px 12px",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: "13px",
          color: C.white,
          outline: "none",
          minWidth: 0,
          transition: "border-color .2s",
        }}
        onFocus={(e) => { e.target.style.borderColor = color; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
      <button onClick={() => email.includes("@") && setSent(true)} style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: "12px",
        letterSpacing: "2px",
        padding: "10px 14px",
        background: color,
        color: C.bg,
        border: "none",
        borderRadius: "2px",
        cursor: "pointer",
        flexShrink: 0,
      }}>Join</button>
    </div>
  );
}

export function FeaturedCard({ post, navigate }) {
  const [h, setH] = useState(false);
  const catColor = post.catColor || CAT_COLORS[post.cat] || C.orange;
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={() => navigate(routes.post(post.slug))}
      style={{
        background: h ? `${catColor}09` : "rgba(255,255,255,0.02)",
        border: `1px solid ${h ? catColor + "55" : C.border}`,
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .35s ease",
        transform: h ? "translateY(-4px)" : "none",
        boxShadow: h ? `0 28px 64px rgba(0,0,0,.6)` : "",
      }}
    >
      <div style={{ height: "3px", background: `linear-gradient(90deg,${catColor},${C.pink})`, transformOrigin: "left", animation: h ? "lineGrow .4s ease forwards" : "none" }} />
      <div style={{ padding: "clamp(28px,3vw,44px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <CatBadge cat={post.cat} size="lg" color={catColor} onClick={(e) => { e.stopPropagation(); navigate(routes.category(post.cat)); }} />
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: "rgba(255,255,255,0.15)" }}>FEATURED</span>
          <ReadTime t={post.readTime} />
        </div>
        <div className="hero-inner" style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "32px", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(28px,4vw,60px)", lineHeight: .95, color: C.white, marginBottom: "16px", letterSpacing: "-.5px" }}>
              {post.title}
            </h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(14px,1.5vw,17px)", color: C.dim, lineHeight: 1.75, marginBottom: "28px", maxWidth: "640px" }}>{post.sub}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <AuthorChip
                author={post.author}
                role={post.authorRole}
                avatar={post.avatar}
                avatarUrl={post.authorImageUrl}
                color={catColor}
                onClick={(e) => { e.stopPropagation(); navigate(routes.author(post.author)); }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{post.date}</span>
                <span style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "13px",
                  letterSpacing: "2px",
                  padding: "8px 20px",
                  background: catColor,
                  color: C.bg,
                  borderRadius: "2px",
                  boxShadow: h ? `0 8px 24px ${catColor}50` : "",
                  transition: "box-shadow .3s",
                }}>Read â†’</span>
              </div>
            </div>
          </div>
          <Thumbnail post={post} height="140px" fontSize="52px" />
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post, navigate, variant = "default" }) {
  const [h, setH] = useState(false);
  const catColor = post.catColor || CAT_COLORS[post.cat] || C.orange;

  if (variant === "compact") {
    return (
      <div
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        onClick={() => navigate(routes.post(post.slug))}
        style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
      >
        <div style={{ width: "44px", height: "44px", flexShrink: 0 }}>
          <Thumbnail post={post} height="44px" fontSize="20px" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
            <CatBadge cat={post.cat} color={catColor} onClick={(e) => { e.stopPropagation(); navigate(routes.category(post.cat)); }} />
            <ReadTime t={post.readTime} />
          </div>
          <h4 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(14px,1.6vw,18px)", color: h ? catColor : C.white, lineHeight: 1.05, marginBottom: "4px", transition: "color .2s", letterSpacing: "-.2px" }}>{post.title}</h4>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.sub}</p>
        </div>
        <div style={{ color: h ? catColor : "rgba(255,255,255,0.15)", fontSize: "14px", flexShrink: 0, marginTop: "14px", transition: "color .2s, transform .2s", transform: h ? "translateX(3px)" : "none" }}>â†’</div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={() => navigate(routes.post(post.slug))}
      style={{
        background: h ? `${catColor}08` : "rgba(255,255,255,0.02)",
        border: `1px solid ${h ? catColor + "45" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "4px",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all .3s ease",
        transform: h ? "translateY(-4px)" : "none",
        boxShadow: h ? `0 20px 52px rgba(0,0,0,.5)` : "",
      }}
    >
      <Thumbnail post={post} height="160px" fontSize="40px" />
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
          <CatBadge cat={post.cat} color={catColor} onClick={(e) => { e.stopPropagation(); navigate(routes.category(post.cat)); }} />
          <ReadTime t={post.readTime} />
        </div>
        <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(18px,1.8vw,24px)", lineHeight: 1.0, color: h ? catColor : C.white, marginBottom: "10px", flex: 1, transition: "color .3s", letterSpacing: "-.2px" }}>{post.title}</h3>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dim, lineHeight: 1.65, marginBottom: "18px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.sub}</p>
        <div style={{ borderTop: `1px solid ${h ? catColor + "30" : "rgba(255,255,255,0.06)"}`, paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", transition: "border-color .3s", flexWrap: "wrap" }}>
          <AuthorChip
            author={post.author}
            role={post.authorRole}
            avatar={post.avatar}
            avatarUrl={post.authorImageUrl}
            color={catColor}
            onClick={(e) => { e.stopPropagation(); navigate(routes.author(post.author)); }}
          />
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: C.dimmer }}>{post.date}</span>
        </div>
      </div>
    </div>
  );
}

export function ShareButtons({ post, onToast }) {
  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => onToast("Link Copied!"));
  };

  const shareX = () => {
    const text = encodeURIComponent(`"${post.title}" â€” VibeCircle Blog`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const btns = [
    { label: "Copy Link", icon: "ðŸ”—", action: copyLink },
    { label: "Share on X", icon: "ð•", action: shareX },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: C.dimmer, alignSelf: "center" }}>Share</span>
      {btns.map((b) => (
        <button key={b.label} onClick={b.action} title={b.label} style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: "12px",
          color: C.dim,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "2px",
          padding: "7px 14px",
          cursor: "pointer",
          transition: "all .2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.white; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = C.dim; }}
        >
          <span style={{ fontSize: "13px" }}>{b.icon}</span> {b.label}
        </button>
      ))}
    </div>
  );
}

export function RenderBody({ text, catColor }) {
  if (Array.isArray(text)) {
    return <VibeCirclePortableText value={text} catColor={catColor} />;
  }
  const safeText = typeof text === "string" ? text : "";
  const paras = safeText.trim().split("\n\n").filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {paras.map((para, i) => {
        if (para.startsWith("**") && para.endsWith("**")) {
          return (
            <h3 key={i} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(20px,2.2vw,28px)", color: catColor, letterSpacing: ".3px", margin: "32px 0 8px" }}>
              {para.replace(/\*\*/g, "")}
            </h3>
          );
        }
        const parts = para.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(15px,1.4vw,18px)", color: "rgba(255,255,255,0.74)", lineHeight: 1.9, marginBottom: "4px" }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.white, fontWeight: 700 }}>{p}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

export function ProgressBar({ progress, catColor }) {
  return (
    <div style={{ position: "fixed", top: "68px", left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 100 }}>
      <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${catColor},${C.pink})`, transition: "width .1s linear" }} />
    </div>
  );
}

export function ReadingProgress({ articleRef, post }) {
  const [progress, setProgress] = useState(0);
  const catColor = post.catColor || CAT_COLORS[post.cat] || C.orange;

  useEffect(() => {
    const h = () => {
      if (!articleRef.current) return;
      const el = articleRef.current;
      const scrolled = Math.max(0, -el.getBoundingClientRect().top);
      const total = el.offsetHeight;
      setProgress(Math.min(100, Math.round((scrolled / total) * 100)));
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [articleRef]);

  return <ProgressBar progress={progress} catColor={catColor} />;
}


