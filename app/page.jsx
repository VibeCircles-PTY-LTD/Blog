"use client"

import { useState, useEffect, useRef, useCallback } from "react";

// --- SANITY INTEGRATION -----------------------------------------------------
// Set VITE_SANITY_PROJECT_ID in your .env to enable live Sanity data.
// When not set (or when running as a standalone artifact), falls back to the
// hardcoded static posts below -- the blog works fully either way.
//
// npm install @sanity/client
//
const SANITY_PROJECT_ID =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SANITY_PROJECT_ID) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_PROJECT_ID) ||
  null;
const SANITY_DATASET =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SANITY_DATASET) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_DATASET) ||
  "production";
const SANITY_VERSION =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SANITY_API_VERSION) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_API_VERSION) ||
  "2024-01-01";

// Minimal inline Sanity fetch (no SDK needed -- uses the CDN HTTP API directly)
async function sanityFetch(query, params = {}) {
  if (!SANITY_PROJECT_ID) return null;
  const encodedQuery = encodeURIComponent(query);
  const paramStr = Object.entries(params).map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`).join("");
  const url = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}${paramStr}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sanity ${res.status}`);
    const json = await res.json();
    return json.result ?? null;
  } catch (e) {
    console.warn("[VibeCircle Blog] Sanity fetch failed, using static data.", e.message);
    return null;
  }
}

//  GROQ QUERIES 
const CARD_FRAGMENT = `
  _id, title, "slug": slug.current, subtitle, publishedAt, featured,
  thumbGradStart, thumbGradEnd, tags,
  "coverImageUrl": coverImage.asset->url, "coverImageAlt": coverImage.alt,
  "readTime": round(length(pt::text(body)) / 5 / 200),
  "author": author->{ name, "slug": slug.current, role, avatarEmoji, "imageUrl": coalesce(photo.asset->url, image.asset->url) },
  "category": category->{ title, "slug": slug.current, color }
`;

const QUERIES = {
  allPosts:  `*[_type=="post"] | order(publishedAt desc) { ${CARD_FRAGMENT} }`,
  allCats:   `*[_type=="category"] | order(title asc) { title, "slug": slug.current, color, "count": count(*[_type=="post" && references(^._id)]) }`,
  allAuthors:`*[_type=="author"] | order(name asc) { name, "slug": slug.current, role, avatarEmoji, "imageUrl": coalesce(photo.asset->url, image.asset->url), bio, "count": count(*[_type=="post" && references(^._id)]) }`,
  bySlug:    `*[_type=="post" && slug.current==$slug][0] { ${CARD_FRAGMENT}, body[]{ ..., asset-> }, seoDescription }`,
  byCat:     `*[_type=="post" && category->slug.current==$slug] | order(publishedAt desc) { ${CARD_FRAGMENT} }`,
  byAuthor:  `*[_type=="post" && (author->slug.current==$slug || author->name==$slug || author==$slug)] | order(publishedAt desc) { ${CARD_FRAGMENT} }`,
  related:   `*[_type=="post" && category._ref==$catRef && _id!=$id] | order(publishedAt desc)[0...4] { ${CARD_FRAGMENT} }`,
};

//  SANITY  V2 NORMALIZER 
// Converts a Sanity document to the exact same shape the v2 static posts use,
// so every component works identically with both sources.
function normalizeSanityPost(s) {
  if (!s) return null;
  const dateStr = s.publishedAt
    ? new Date(s.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return {
    _sanity: true,                          // flag so body renderer knows to use PT
    id: s._id,
    slug: s.slug,
    cat: s.category?.title ?? "",
    catSlug: s.category?.slug ?? "",
    catColor: s.category?.color ?? null,
    featured: s.featured ?? false,
    title: s.title,
    sub: s.subtitle,
    author: s.author?.name ?? "",
    authorSlug: s.author?.slug ?? "",
    authorRole: s.author?.role ?? "",
    avatar: s.author?.avatarEmoji ?? "",
    authorImageUrl: s.author?.imageUrl ?? s.author?.photo?.asset?.url ?? s.author?.image?.asset?.url ?? "",
    date: dateStr,
    thumbGrad: [s.thumbGradStart ?? "#FF6B00", s.thumbGradEnd ?? "#FF6B00"],
    coverImageUrl: s.coverImageUrl ?? "",
    coverImageAlt: s.coverImageAlt ?? "",
    tags: s.tags ?? [],
    readTime: s.readTime != null ? `${s.readTime} min read` : "...",
    body: s.body ?? [],    // Portable Text array (or string for static posts)
  };
}

function normalizeSanityAuthor(a) {
  return { name: a.name, slug: a.slug, role: a.role, avatar: a.avatarEmoji, imageUrl: a.imageUrl, bio: a.bio, count: a.count ?? 0 };
}

//  SHARED DATA HOOK 
// Fetches from Sanity; returns null on failure so caller can use static fallback.
function useSanityQuery(query, params, deps) {
  const [data, setData] = useState(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setDone(false);
    sanityFetch(query, params).then(res => {
      if (!cancelled) { setData(res); setDone(true); }
    });
    return () => { cancelled = true; };
  }, deps); // eslint-disable-line
  return { data, done };
}

//  PORTABLE TEXT  JSX 
// Lightweight inline renderer for Sanity Portable Text bodies.
// When using @portabletext/react instead, replace with:
//   import { PortableText } from "@portabletext/react"
function PortableTextRenderer({ blocks = [], catColor }) {
  const renderSpans = (children = []) => children.map((span, i) => {
    let node = <span key={i}>{span.text}</span>;
    if (span.marks?.includes("strong")) node = <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{span.text}</strong>;
    if (span.marks?.includes("em"))     node = <em key={i} style={{ fontStyle: "italic" }}>{span.text}</em>;
    if (span.marks?.includes("code"))   node = <code key={i} style={{ fontFamily: "monospace", fontSize: "0.88em", background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.2)", borderRadius: "3px", padding: "2px 6px", color: "#FF6B00" }}>{span.text}</code>;
    return node;
  });

  const nodes = []; let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (!b) { i++; continue; }

    // Custom types
    if (b._type === "image" && b.asset?.url) {
      nodes.push(<figure key={b._key || i} style={{ margin: "28px 0" }}><img src={b.asset.url} alt={b.alt || ""} style={{ width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }} />{b.caption && <figcaption style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "8px", textAlign: "center" }}>{b.caption}</figcaption>}</figure>);
      i++; continue;
    }
    if (b._type === "callout") {
      const cc = { info: "#FF6B00", warning: "#FF6B00", tip: "#FF6B00", stat: "#FF6B00" }[b.type] || catColor;
      nodes.push(<div key={b._key || i} style={{ margin: "24px 0", padding: "18px 22px", background: `${cc}0D`, border: `1px solid ${cc}40`, borderLeft: `4px solid ${cc}`, borderRadius: "0 4px 4px 0" }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: cc, marginBottom: "5px" }}>{(b.type || "tip").toUpperCase()}</div><p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{b.text}</p></div>);
      i++; continue;
    }

    // Lists  group consecutive list items
    if (b._type === "block" && b.listItem) {
      const listType = b.listItem;
      const items = [];
      while (i < blocks.length && blocks[i]?._type === "block" && blocks[i].listItem === listType) {
        items.push(<li key={blocks[i]._key || i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(15px,1.4vw,17px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.75 }}>{renderSpans(blocks[i].children)}</li>);
        i++;
      }
      nodes.push(listType === "number"
        ? <ol key={`list-${i}`} style={{ margin: "14px 0", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "6px" }}>{items}</ol>
        : <ul key={`list-${i}`} style={{ margin: "14px 0", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "6px" }}>{items}</ul>
      );
      continue;
    }

    // Standard blocks
    if (b._type === "block") {
      const children = renderSpans(b.children);
      if (b.style === "h2")         nodes.push(<h2 key={b._key || i} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(24px,2.8vw,36px)", color: catColor, letterSpacing: ".3px", margin: "40px 0 10px", lineHeight: 1 }}>{children}</h2>);
      else if (b.style === "h3")    nodes.push(<h3 key={b._key || i} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(20px,2.2vw,28px)", color: catColor, letterSpacing: ".3px", margin: "32px 0 8px", lineHeight: 1 }}>{children}</h3>);
      else if (b.style === "h4")    nodes.push(<h4 key={b._key || i} style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "clamp(15px,1.4vw,17px)", color: "#fff", margin: "22px 0 6px" }}>{children}</h4>);
      else if (b.style === "blockquote") nodes.push(<blockquote key={b._key || i} style={{ borderLeft: `3px solid ${catColor}`, paddingLeft: "20px", margin: "24px 0", fontFamily: "'DM Sans',sans-serif", fontStyle: "italic", fontSize: "clamp(16px,1.5vw,20px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.75 }}>{children}</blockquote>);
      else nodes.push(<p key={b._key || i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(15px,1.4vw,18px)", color: "rgba(255,255,255,0.74)", lineHeight: 1.9, marginBottom: "4px" }}>{children}</p>);
    }
    i++;
  }
  return <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{nodes}</div>;
}

//  GLOBAL CSS 
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #05050A; overflow-x: hidden; }
  ::selection { background: rgba(255,107,0,0.35); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #05050A; }
  ::-webkit-scrollbar-thumb { background: #FF6B00; border-radius: 2px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn    { from{opacity:0;} to{opacity:1;} }
  @keyframes orbFloat  { 0%,100%{transform:scale(1) translateY(0);opacity:.55;} 50%{transform:scale(1.1) translateY(-10px);opacity:1;} }
  @keyframes marquee   { from{transform:translateX(0);} to{transform:translateX(-50%);} }
  @keyframes lineGrow  { from{transform:scaleX(0);} to{transform:scaleX(1);} }
  @keyframes shimmer   { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  @keyframes dotBlink  { 0%,100%{opacity:1;} 50%{opacity:.3;} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
  @keyframes toastIn   { from{opacity:0;transform:translateY(12px) scale(.96);} to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes toastOut  { from{opacity:1;transform:translateY(0) scale(1);} to{opacity:0;transform:translateY(12px) scale(.96);} }

  @media (max-width:960px) {
    .sidebar-layout { grid-template-columns: 1fr !important; }
    .hero-inner     { grid-template-columns: 1fr !important; }
  }
  @media (max-width:760px) {
    .two-grid   { grid-template-columns: 1fr !important; }
    .three-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width:520px) {
    .three-grid { grid-template-columns: 1fr !important; }
  }
`;

const C = {
  bg:"#111216", bg2:"#1A1B21", bg3:"#22242B",
  orange:"#FF6B00", pink:"#FF6B00",
  blue:"#FF6B00", purple:"#FF6B00", gold:"#FF6B00",
  white:"#F5F6F8", dim:"rgba(245,246,248,.6)",
  dimmer:"rgba(245,246,248,.35)", border:"rgba(255,107,0,.16)",
};

const CAT_COLORS = {
  "incaseyoumissedit": C.orange,
  "City Enegy": C.orange,
  "Vibe Theory": C.orange,
  "trend lab": C.orange,
  "Digital Anthropology": C.orange,
};

// Resolves cat color from static map OR from Sanity post
function getCatColor(post) {
  return post?.catColor || CAT_COLORS[post?.cat] || C.orange;
}

//  READING TIME 
function calcReadTime(body) {
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

//  POSTS 
const RAW_POSTS = [
  {
    id:1, slug:"social-gravity", cat:"City Culture", featured:true,
    title:"Social Media Is Dead. Social Gravity Is What's Next.",
    sub:"The era of passive scrolling is over. The platforms that win from here will be the ones that pull people out of their phones and into the streets.",
    author:"Marcus Webb", authorRole:"CEO & Co-Founder", avatar:"",
    date:"Feb 12, 2026", published:"2026-02-12",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Future of Social","City Discovery","VibeCircle Vision"],
    body:`For the past decade, social media has optimized for one thing: keeping you on the app. More scroll. More dopamine. More time stolen from the world happening right outside your window.

We built VibeCircle from a different premise entirely. What if a social platform made you want to close it?

**The Problem with Feeds**

Traditional social feeds are built on engagement at any cost. The algorithm doesn't care if you actually did anything meaningful  it just cares that you didn't leave. This is why you can spend an hour on TikTok and feel exactly like you did before you opened it. Entertainment without gravity.

The irony is devastating: a generation of the most connected humans in history has never felt more disconnected from the physical world around them.

**Gravity vs. Friction**

Social gravity is the opposite of social friction. Where friction traps you in the app, gravity pulls you toward something in the real world  a venue, a creator event, a neighborhood you've never explored, a brand experience happening two blocks from where you're sitting.

This is what we mean when we say VibeCircle is a discovery engine, not a content engine.

We're not asking "what do you want to watch?" We're asking "what's alive near you right now?"

**The Map Is the Product**

The VibeCircle city map isn't a feature. It's the whole philosophy. When a creator posts from a rooftop in Atlanta, that pin appears on the live city map  and suddenly Atlanta has a heartbeat. When a restaurant goes live during their Friday dinner rush, that location pulses for everyone nearby.

Culture becomes visible. Discovery becomes spatial. And the city becomes the algorithm.

**What Comes Next**

We believe the platforms that will matter in 2030 aren't the ones with the most users. They're the ones with the most gravity  the ones that consistently pull people off their couches and into meaningful, spontaneous, real-world experiences.

VibeCircle is built to be that platform. This is just the beginning.`,
  },
  {
    id:2, slug:"micro-creators-win", cat:"Creator Economy",
    title:"Why Micro-Creators Are Winning the Brand Deal Game",
    sub:"Forget follower counts. Brands are waking up to the reality that 1,000 authentic local fans beats 100,000 passive scrollers every single time.",
    author:"Amara Osei", authorRole:"Head of Creator Partnerships", avatar:"",
    date:"Feb 8, 2026", published:"2026-02-08",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Creator Economy","Brand Deals","Micro-Influencer"],
    body:`When VibeCircle first launched our Brand Marketplace, we expected established creators  people with 50K, 100K, 200K followers  to dominate the deal flow.

We were wrong.

**The Numbers Don't Lie**

In our first six months of marketplace data, creators with under 5,000 followers landed 34% of all completed brand deals. That number stunned us. But when we looked closer, it made complete sense.

Micro-creators  the ones who post from their actual neighborhood, who know their followers by name, who go live at the same local coffee shop every Tuesday  have something that mega-influencers can't fake: genuine local authority.

**Trust Is the New Follower Count**

A restaurant in Atlanta doesn't need a creator with 500K followers in Los Angeles. They need a creator with 3,000 followers who all eat brunch in Midtown Atlanta. The conversion rate isn't even close.

Amara Johnson, a food creator with 2,200 followers who posts exclusively from Chicago's South Side, landed a $1,800 deal with Urban Eats Collective in her first week on VibeCircle. The brand got 14 in-store visits traceable to her post. For a local restaurant, that's transformational.

**What Brands Are Finally Learning**

The brands killing it on VibeCircle have figured out that creator marketing isn't about reach. It's about resonance. A micro-creator talking about your product in the authentic context of their city life carries ten times the weight of a celebrity product mention.

The data backs this up across every category on our platform: food, fashion, wellness, entertainment. City-embedded creators convert at a higher rate, generate more trackable foot traffic, and retain brand relationships longer.

**The Creator Economy's Next Chapter**

We built VibeCircle's marketplace with no follower minimum because we believed this from day one. Authenticity can't be faked. City presence can't be manufactured. The creators who are truly embedded in their local culture  those are the voices that move people.

And brands are finally starting to listen.`,
  },
  {
    id:3, slug:"geo-ads-future", cat:"Brand Strategy",
    title:"Geo-Advertising in 2026: The End of Wasted Impressions",
    sub:"Blanket digital advertising is dying. Location-aware, moment-specific campaign tools are reshaping how smart brands reach people.",
    author:"Sofia Reyes", authorRole:"Head of Business Dev", avatar:"",
    date:"Feb 5, 2026", published:"2026-02-05",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Geo-Targeting","Advertising","Brand Strategy"],
    body:`For years, digital advertising has operated on a wasteful premise: show the ad to as many people as possible and hope the right ones see it. The result is a world drowning in irrelevant promotions that nobody asked for, nobody wants, and almost nobody acts on.

VibeCircle's advertising model is built on a radically different assumption: the best impression is a relevant one.

**The Geography of Intent**

When someone is physically near your location, their intent is fundamentally different than when they're browsing randomly at home. Proximity signals interest. It signals that this person is already in your world  they're in your neighborhood, your area, your potential customer zone.

Traditional digital ads ignore this entirely. VibeCircle puts geography at the center of every campaign.

**How It Changes ROI**

A local gym running a traditional Instagram ad campaign reported average CPAs of $48 per new member sign-up. Running a VibeCircle geo-targeted campaign at their campus location, that same gym hit $11 CPA in the first month.

The difference isn't the creative. It's the context. An ad for a gym hits differently when you're literally walking past it than when you're scrolling at midnight.

**Layering Creator Moments**

The real magic happens when geo-targeting combines with creator content. When a fitness creator posts a "just finished my workout here" video tagged to your gym location, and that post appears in the map feed of every user within a half-mile radius  that's not advertising. That's culture.

This is the VibeCircle model: advertising that's so contextually relevant it doesn't feel like advertising at all.

**The Brands That Will Win**

We're entering an era where local businesses have an unfair advantage if they use the right tools. A restaurant that understands real-time geo-promotion can beat a chain with ten times the budget. A boutique venue that knows how to use creator moments can out-market an arena.

The future of advertising isn't louder. It's more precise, more human, and more embedded in the real city experience that people are actually living.`,
  },
  {
    id:4, slug:"campus-strategy", cat:"Campus Life",
    title:"How VibeCircle Conquered 50 Campuses in One Semester",
    sub:"A grassroots ambassador strategy, zero traditional advertising, and an obsessive focus on authentic city energy. Here's exactly how we did it.",
    author:"Rishi Kapoor", authorRole:"Head of Growth", avatar:"",
    date:"Jan 29, 2026", published:"2026-01-29",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Growth","Campus","Ambassador Program"],
    body:`When we decided to go hard on campus growth, the conventional playbook looked like this: buy targeted social ads, partner with student government, throw a launch event, repeat.

We threw out the playbook.

**The Ambassador-First Strategy**

Our hypothesis: the best way to grow a platform built on authentic city culture is to find the people who already embody that culture  and give them tools, not scripts.

We identified what we called "cultural connectors" on each campus. Not necessarily the people with the most followers. The people who everyone in their circle turns to when they want to know what's happening. The tastemakers. The scene-setters.

We recruited 24 ambassadors per campus, gave them Orbit-tier creator accounts, and set one expectation: be authentically you, use the platform the way you'd actually want to use it.

**What We Didn't Do**

We didn't give ambassadors talking points. We didn't run any campus ad campaigns. We didn't hand out branded merchandise or throw events with VibeCircle banners everywhere.

Authenticity can smell a corporate play from a mile away. Gen Z especially. The moment a campus ambassador sounds like they're reading from a script, you've lost the whole thing.

**The Viral Mechanics**

Campus social culture has a specific topology: everyone sees what the connectors are doing, and those connectors are deeply tied to specific locations  the library, the gym, the late-night spot, the spot outside the main building where everyone smokes.

When VibeCircle ambassadors started using the live map to broadcast from those exact locations, something clicked. Students started tagging those spots. Those spots became discovery hubs. Discovery hubs attracted more creators. More creators attracted brands.

In eight weeks, 50 campuses went from zero VibeCircle presence to active, self-sustaining ecosystems. No advertising. Just gravity.

**The Lesson**

You can't manufacture culture. But you can find where it already lives  and build the infrastructure that lets it spread.`,
  },
  {
    id:5, slug:"city-map-deep-dive", cat:"Tech & Maps",
    title:"Inside the VibeCircle City Map: How We Built a Living Layer on Top of Cities",
    sub:"Real-time geo-social technology is harder than it sounds. Here's what it took to build a map that actually pulses.",
    author:"Layla Chen", authorRole:"CTO & Co-Founder", avatar:"",
    date:"Jan 22, 2026", published:"2026-01-22",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Technology","Engineering","Maps"],
    body:`The most common question I get about VibeCircle's tech stack is: "Is the live map actually live?"

Yes. And getting there was significantly harder than we expected.

**The Core Technical Problem**

Building a social map isn't just adding location metadata to posts. The challenge is making a map that feels alive  that updates in seconds, renders smoothly across devices, handles massive concurrent loads during peak events, and personalizes what each user sees based on their location, interests, and social graph.

Traditional mapping solutions like Google Maps or Mapbox give you the geographic layer. The social layer on top is what we built from scratch.

**The Architecture**

Our real-time layer runs on a WebSocket-based event system. Every location-tagged post, live stream, event RSVP, and business promotion creates an "energy event" that propagates through the system and updates the map within 24 seconds globally.

The challenge was density management. During major events  festival weekends, game days, concert nights  a single city block might have hundreds of active pins simultaneously. We built a custom clustering algorithm that groups nearby events by category while preserving individual pin accessibility, so the map never becomes an unusable blob of overlapping icons.

**Personalization at Scale**

The map each user sees is personalized in real time based on: their location, who they follow, categories they engage with, time of day, and behavioral signals from their past sessions. This happens in milliseconds through a lightweight ML inference layer that sits between the event stream and the rendering engine.

The goal is that when you open VibeCircle at 11pm on a Friday, the map shows you the exact right things  the live sets happening nearby, the friend group at a bar three blocks away, the pop-up market you'd never have known about.

**What Comes Next**

We're currently building predictive map features  using historical patterns and real-time signals to show energy that's about to happen, not just energy that's happening right now. The city map of the future should be as much a forecast as a feed.`,
  },
  {
    id:6, slug:"festival-2026", cat:"Music & Events",
    title:"Festival Season 2026: How VibeCircle Is Changing Live Music Forever",
    sub:"From creator coverage to real-time geo-promotion, here's how VibeCircle is embedding itself into the live event ecosystem.",
    author:"Devon Price", authorRole:"Head of Design", avatar:"",
    date:"Jan 15, 2026", published:"2026-01-15",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Music","Festivals","Live Events"],
    body:`Festival season used to mean a choice between experiencing the moment and capturing it for your audience. VibeCircle is eliminating that tradeoff.

**The Creator Coverage Model**

This past year, we partnered with 8 major music festivals to embed VibeCircle creator coverage into the festival experience itself. Selected creators received full access passes, dedicated backstage zones, and direct lines to PR contacts.

The results redefined what "festival content" looks like. Instead of polished recap videos posted days later, audiences got live map coverage  pulsing pins showing which stage was jumping at any given moment, creator streams from inside the crowd, geo-tagged food recommendations from people eating there in real time.

Solstice Festival in Austin saw a 3.2x increase in social discovery compared to the previous year, driven almost entirely by VibeCircle creator activity.

**The Map as Festival Program**

Working with festival organizers, we've been developing a feature called "Event Layers"  a curated map view that works like a live festival program. Each stage, food vendor, and activity zone has its own VibeCircle presence. Creator content tags to specific zones. Attendees get real-time updates on crowd density, artist set times, and nearby creator activity.

The festival map becomes a living guide, updated by thousands of creators simultaneously.

**The Future of Live Events**

The next frontier is pre-event energy. VibeCircle's map starts building momentum before the festival gates open  showing hotel check-ins, travel content, artist arrival clips, and the growing pulse of a city about to erupt.

We believe the best live event experience combines the visceral intensity of being there with the collective energy of everyone else experiencing it simultaneously.

Festival season 2026 is going to feel different. Come find us on the map.`,
  },
  {
    id:7, slug:"creator-fund-breakdown", cat:"Creator Economy",
    title:"Breaking Down VibeCircle's Creator Fund: How We Decide Who Gets Paid",
    sub:"No black boxes. No mystery metrics. Here's the exact formula behind the Creator Fund and how you can maximize your earnings.",
    author:"Amara Osei", authorRole:"Head of Creator Partnerships", avatar:"",
    date:"Jan 10, 2026", published:"2026-01-10",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Creator Fund","Earnings","Creator Economy"],
    body:`One of the most common questions we get from Orbit creators is: "How exactly does the Creator Fund work?"

We built the fund specifically to be transparent  no algorithmic black box, no arbitrary gates. Here's exactly how payouts are calculated.

**The Four Pillars of Creator Fund Earnings**

Creator Fund payouts are based on four weighted signals: verified map impressions (40%), discovery reach  how many new users found you through the map rather than following you directly (30%), genuine engagement quality (20%), and consistency  posting frequency and streak bonuses (10%).

Each signal is verified independently to prevent gaming. Map impressions are cross-referenced with real device location data. Discovery reach is measured only for users who had zero prior exposure to your content.

**Why We Weight Discovery So Heavily**

Discovery reach is the metric that actually matters for the VibeCircle ecosystem. A creator who brings genuinely new people into the platform  people who found them because of where they were, not because an algorithm pushed them  creates compounding value for the whole network.

That's why a creator with 2,000 followers but exceptional city map presence can out-earn a creator with 20,000 followers who mostly posts without location context.

**The Consistency Multiplier**

Creators who post at least 5 days per week for 4 consecutive weeks unlock a 1.3x consistency multiplier on their base fund calculation. Maintain a 90-day streak and that multiplier rises to 1.5x. This rewards creators who treat VibeCircle as a primary platform, not an afterthought.

**What Doesn't Count**

Views from creators' own devices, engagement from accounts less than 30 days old, and any signals that trigger our anomaly detection system are all excluded. We'd rather pay 10,000 creators accurately than 100,000 creators with inflated numbers.

**Payout Schedule**

Fund payouts are processed on the 15th of each month for the previous month's activity. Minimum payout threshold is $25. Below that, earnings roll over to the following month.

The goal is simple: if you're genuinely building city presence and bringing real people into real experiences, the fund rewards you for it. That's it.`,
  },
  {
    id:8, slug:"city-spotlight-atlanta", cat:"City Culture",
    title:"City Spotlight: How Atlanta Became VibeCircle's Most Energetic City",
    sub:"In 12 months, Atlanta went from pilot city to our single highest-activity market. We dug into what made it explode.",
    author:"Marcus Webb", authorRole:"CEO & Co-Founder", avatar:"",
    date:"Jan 6, 2026", published:"2026-01-06",
    emoji:"", thumbGrad:["#FF6B00","#FF6B00"],
    tags:["Atlanta","City Culture","Case Study"],
    body:`We launched VibeCircle in five cities simultaneously. Atlanta wasn't supposed to be our breakout market.

New York had the density. Los Angeles had the creator ecosystem. Chicago had the culture infrastructure. On paper, Atlanta was our wildcard.

Twelve months later, Atlanta consistently posts the highest creator activity, the most brand deals per capita, and the strongest week-over-week growth of any city on the platform. We had to understand why.

**The Cultural Connector Effect**

Atlanta has an unusually dense network of what we call cultural connectors  people who exist at the intersection of music, food, fashion, and community in ways that are genuinely intertwined rather than siloed. A person who's a DJ might also be a restaurant regular who's connected to a streetwear brand that sponsors local artists. These connections are deep and real.

When VibeCircle gave those connectors a map to broadcast from, the network effects were explosive. One creator bringing their audience into a neighborhood didn't just grow that creator's profile  it lit up every other creator and business in that zone.

**The Business Community's Early Adoption**

Atlanta's independent business community adopted VibeCircle faster than any other city. Particularly in the food and beverage sector, business owners who had built followings through word-of-mouth for years immediately understood what a living map could do for them.

Ponce City Market alone has 34 verified VibeCircle business profiles. On a busy Saturday, the market generates hundreds of geo-tagged posts that create a self-reinforcing discovery loop: creators bring audiences, audiences discover new businesses, new businesses join the platform to reach those audiences.

**What Atlanta Taught Us**

The cities that thrive on VibeCircle aren't necessarily the biggest. They're the ones where culture is already moving fast, where the gap between digital presence and physical reality is already small, and where people are already disposed to discover through trust networks rather than broadcast media.

Atlanta had all three. We just gave it a map.`,
  },
];

// Compute read times from actual word counts
const POSTS = RAW_POSTS.map(p => ({ ...p, readTime: calcReadTime(p.body) }));

const POSTS_PER_PAGE = 6;

// Unique authors
const AUTHORS = [...new Map(POSTS.map(p => [p.author, { name: p.author, role: p.authorRole, avatar: p.avatar }])).values()];

//  HOOKS 
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, v];
}

function useWindowWidth() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    setW(window.innerWidth);
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

//  HASH ROUTING 
function useRouter() {
  const [route, setRoute] = useState("#/");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRoute(window.location.hash || "#/");
    const h = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const navigate = useCallback((path) => {
    if (typeof window === "undefined") return;
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else navigate("#/");
  }, [navigate]);

  return { route, navigate, goBack };
}

//  TOAST 
function Toast({ message, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
      background: C.orange, color: C.bg, fontFamily: "'Bebas Neue',sans-serif",
      fontSize: "13px", letterSpacing: "2px", padding: "12px 28px",
      borderRadius: "2px", zIndex: 9999, boxShadow: `0 16px 40px ${C.orange}50`,
      animation: "toastIn .3s ease forwards",
    }}>{message}</div>
  );
}

//  THUMBNAIL 
function Thumbnail({ post, height = "180px", fontSize = "44px" }) {
  const [a, b] = post.thumbGrad;
  const hasCover = Boolean(post.coverImageUrl);
  return (
    <div style={{
      width: "100%", height, borderRadius: "3px",
      background: `linear-gradient(135deg, ${a}22 0%, ${b}22 100%)`,
      border: `1px solid ${a}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      flexShrink: 0,
    }}>
      {hasCover && (
        <img
          src={post.coverImageUrl}
          alt={post.coverImageAlt || post.title || ""}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      )}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${a}08 1px,transparent 1px),linear-gradient(90deg,${a}08 1px,transparent 1px)`,
        backgroundSize: "24px 24px",
        opacity: hasCover ? 0.6 : 1,
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute", borderRadius: "50%", width: "120px", height: "120px",
        top: "-20px", right: "-20px",
        background: `radial-gradient(circle,${a}30 0%,transparent 70%)`,
        zIndex: 2,
      }} />
    </div>
  );
}

//  SHARED COMPONENTS 
function Reveal({ children, delay = 0, style = {} }) {
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

function Orb({ top, left, right, bottom, size = 500, color = C.orange, opacity = 0.12, delay = "0s" }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%", width: size, height: size,
      top, left, right, bottom, pointerEvents: "none",
      background: `radial-gradient(circle,${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 0%,transparent 70%)`,
      animation: `orbFloat 9s ease-in-out ${delay} infinite`,
    }} />
  );
}

function Tag({ children, color = C.orange }) {
  return (
    <span style={{
      fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "4px",
      color, border: `1px solid ${color}40`, padding: "5px 12px",
      borderRadius: "2px", display: "inline-block", textTransform: "uppercase",
    }}>{children}</span>
  );
}

function CatBadge({ cat, size = "sm", onClick }) {
  const color = CAT_COLORS[cat] || C.orange;
  const fs = size === "lg" ? "13px" : "10px";
  const pad = size === "lg" ? "5px 14px" : "3px 9px";
  return (
    <span onClick={onClick} style={{
      fontFamily: "'Bebas Neue',sans-serif", fontSize: fs, letterSpacing: "2px",
      color, padding: pad, background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: "2px", textTransform: "uppercase", display: "inline-block",
      cursor: onClick ? "pointer" : "default",
      transition: onClick ? "all .2s" : undefined,
    }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.background = `${color}30`; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.background = `${color}15`; } : undefined}
    >{cat}</span>
  );
}

function ReadTime({ t }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: C.dimmer, letterSpacing: ".5px" }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", border: `1px solid ${C.orange}60`, display: "inline-block", animation: "dotBlink 2s ease-in-out infinite" }} />
      {t}
    </span>
  );
}

function AuthorChip({ author, role, avatar, avatarUrl, color = C.orange, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: onClick ? "pointer" : "default" }}
      title={onClick ? `See all posts by ${author}` : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={author}
          style={{
            width: "32px", height: "32px", borderRadius: "50%",
            objectFit: "cover", border: `1px solid ${color}40`,
            flexShrink: 0, transition: onClick ? "box-shadow .2s" : undefined,
          }}
          onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = `0 0 0 2px ${color}60` : undefined}
          onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = "" : undefined}
        />
      ) : (
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: `${color}20`, border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", flexShrink: 0,
          transition: onClick ? "box-shadow .2s" : undefined,
        }}
          onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = `0 0 0 2px ${color}60` : undefined}
          onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = "" : undefined}
        >{avatar}</div>
      )}
      <div>
        <div style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: "13px", fontWeight: 600,
          color: onClick ? color : C.white, lineHeight: 1.2,
          transition: "color .2s",
          textDecoration: onClick ? "underline" : "none",
          textDecorationColor: `${color}40`,
        }}>{author}</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: C.dimmer, marginTop: "1px" }}>{role}</div>
      </div>
    </div>
  );
}

//  NAV 
function Nav({ navigate, route }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 700;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [route]);

  const { data: sanityAllCats, done: sanityAllCatsDone } = useSanityQuery(QUERIES.allCats, {}, []);
  const sanityCatMap = sanityAllCatsDone && Array.isArray(sanityAllCats)
    ? new Map(sanityAllCats.map((c) => [c.title, c]))
    : new Map();
  const navCats = Object.entries(CAT_COLORS).map(([label, color]) => {
    const s = sanityCatMap.get(label);
    return {
      label,
      slug: s?.slug || label,
      color: s?.color || color || C.orange,
      count: s?.count ?? POSTS.filter((p) => p.cat === label).length,
    };
  });
  const totalPosts = navCats.reduce((sum, c) => sum + (c.count || 0), 0);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px,4vw,56px)", height: "68px",
        background: scrolled || menuOpen ? "rgba(5,5,10,0.97)" : "rgba(5,5,10,0.5)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "all .3s ease",
      }}>
        {/* LOGO */}
        <button onClick={() => navigate("#/")} style={{
          fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", letterSpacing: "3px",
          color: C.orange, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
        }}>VIBECIRCLE</button>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button onClick={() => navigate("#/")} style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: "12px", letterSpacing: "1px",
              textTransform: "uppercase", color: route === "#/" ? C.orange : C.dim,
              background: route === "#/" ? `${C.orange}10` : "transparent",
              border: `1px solid ${route === "#/" ? C.orange + "40" : "transparent"}`,
              borderRadius: "2px", padding: "7px 14px", cursor: "pointer", transition: "all .2s",
            }}>All Posts</button>
            {navCats.map(c => {
              const catRoute = `#/cat/${encodeURIComponent(c.slug)}`;
              const active = route === catRoute;
              const color = c.color;
              return (
                <button key={c.label} onClick={() => navigate(catRoute)} style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: "12px", letterSpacing: "1px",
                  textTransform: "uppercase", color: active ? color : C.dimmer,
                  background: active ? `${color}12` : "transparent",
                  border: `1px solid ${active ? color + "40" : "transparent"}`,
                  borderRadius: "2px", padding: "7px 12px", cursor: "pointer", transition: "all .2s",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.white; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.dimmer; } }}
                >{c.label}</button>
              );
            })}
          </div>
        )}

        {!isMobile && (
          <button onClick={() => navigate("#/")} style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px",
            padding: "8px 18px", background: "transparent", color: C.dim,
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "2px", cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = C.dim; }}
          >BLOG</button>
        )}

        {isMobile && (
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", width: "22px", height: "2px", borderRadius: "1px",
                background: menuOpen ? C.orange : C.white, transition: "all .3s",
                transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none") : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", top: "68px", left: 0, right: 0, bottom: 0, zIndex: 199,
          background: "rgba(5,5,10,0.99)", backdropFilter: "blur(20px)",
          padding: "32px 28px", overflowY: "auto", animation: "slideDown .25s ease",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {[{ label: "All Posts", path: "#/" }, ...navCats.map(c => ({ label: c.label, path: `#/cat/${encodeURIComponent(c.slug)}`, color: c.color }))].map((item, i) => (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(22px,5vw,34px)",
                letterSpacing: "1px", textAlign: "left", color: item.color || C.white,
                background: "none", border: "none", cursor: "pointer",
                padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                animation: `fadeUp .3s ease ${i * 0.04}s both`,
              }}>{item.label}</button>
            ))}
            <button onClick={() => navigate("#/authors")} style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(22px,5vw,34px)",
              letterSpacing: "1px", textAlign: "left", color: C.dim,
              background: "none", border: "none", cursor: "pointer",
              padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              animation: `fadeUp .3s ease ${(navCats.length + 1) * 0.04}s both`,
            }}>Authors</button>
          </div>
        </div>
      )}
    </>
  );
}

//  FOOTER 
function NewsletterForm({ color = C.orange }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "15px", color, padding: "8px 0" }}>You're in. </div>;
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        placeholder="your@email.com" value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && email.includes("@") && setSent(true)}
        style={{
          flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "2px", padding: "10px 12px", fontFamily: "'DM Sans',sans-serif",
          fontSize: "13px", color: C.white, outline: "none", minWidth: 0, transition: "border-color .2s",
        }}
        onFocus={e => e.target.style.borderColor = color}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
      <button onClick={() => email.includes("@") && setSent(true)} style={{
        fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "2px",
        padding: "10px 14px", background: color, color: C.bg,
        border: "none", borderRadius: "2px", cursor: "pointer", flexShrink: 0,
      }}>Join</button>
    </div>
  );
}

//  CARD COMPONENTS 
function FeaturedCard({ post, navigate }) {
  const [h, setH] = useState(false);
  const catColor = getCatColor(post);
  const catNav = post.catSlug ? `#/cat/${post.catSlug}` : `#/cat/${encodeURIComponent(post.cat)}`;
  const authorNav = post.authorSlug ? `#/author/${post.authorSlug}` : `#/author/${encodeURIComponent(post.author)}`;
  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => navigate(`#/post/${post.slug}`)}
      style={{
        background: h ? `${catColor}09` : "rgba(255,255,255,0.02)",
        border: `1px solid ${h ? catColor + "55" : C.border}`,
        borderRadius: "4px", overflow: "hidden", cursor: "pointer",
        transition: "all .35s ease", transform: h ? "translateY(-4px)" : "none",
        boxShadow: h ? `0 28px 64px rgba(0,0,0,.6)` : "",
      }}
    >
      <div style={{ height: "3px", background: `linear-gradient(90deg,${catColor},${C.orange})`, transformOrigin: "left", animation: h ? "lineGrow .4s ease forwards" : "none" }} />
      <div style={{ padding: "clamp(28px,3vw,44px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <CatBadge cat={post.cat} size="lg" onClick={e => { e.stopPropagation(); navigate(catNav); }} />
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
                author={post.author} role={post.authorRole} avatar={post.avatar} avatarUrl={post.authorImageUrl} color={catColor}
                onClick={e => { e.stopPropagation(); navigate(authorNav); }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{post.date}</span>
                <span style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "2px",
                  padding: "8px 20px", background: catColor, color: C.bg, borderRadius: "2px",
                  boxShadow: h ? `0 8px 24px ${catColor}50` : "", transition: "box-shadow .3s",
                }}>Read </span>
              </div>
            </div>
          </div>
          <Thumbnail post={post} height="140px" fontSize="52px" />
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, navigate, variant = "default" }) {
  const [h, setH] = useState(false);
  const catColor = getCatColor(post);
  const catNav = post.catSlug ? `#/cat/${post.catSlug}` : `#/cat/${encodeURIComponent(post.cat)}`;
  const authorNav = post.authorSlug ? `#/author/${post.authorSlug}` : `#/author/${encodeURIComponent(post.author)}`;

  if (variant === "compact") {
    return (
      <div
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        onClick={() => navigate(`#/post/${post.slug}`)}
        style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
      >
        <div style={{ width: "44px", height: "44px", flexShrink: 0 }}>
          <Thumbnail post={post} height="44px" fontSize="20px" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
            <CatBadge cat={post.cat} onClick={e => { e.stopPropagation(); navigate(catNav); }} />
            <ReadTime t={post.readTime} />
          </div>
          <h4 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(14px,1.6vw,18px)", color: h ? catColor : C.white, lineHeight: 1.05, marginBottom: "4px", transition: "color .2s", letterSpacing: "-.2px" }}>{post.title}</h4>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.sub}</p>
        </div>
        <div style={{ color: h ? catColor : "rgba(255,255,255,0.15)", fontSize: "14px", flexShrink: 0, marginTop: "14px", transition: "color .2s, transform .2s", transform: h ? "translateX(3px)" : "none" }}></div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => navigate(`#/post/${post.slug}`)}
      style={{
        background: h ? `${catColor}08` : "rgba(255,255,255,0.02)",
        border: `1px solid ${h ? catColor + "45" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "4px", cursor: "pointer", overflow: "hidden",
        display: "flex", flexDirection: "column", height: "100%",
        transition: "all .3s ease", transform: h ? "translateY(-4px)" : "none",
        boxShadow: h ? `0 20px 52px rgba(0,0,0,.5)` : "",
      }}
    >
      <Thumbnail post={post} height="160px" fontSize="40px" />
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
          <CatBadge cat={post.cat} onClick={e => { e.stopPropagation(); navigate(catNav); }} />
          <ReadTime t={post.readTime} />
        </div>
        <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(18px,1.8vw,24px)", lineHeight: 1.0, color: h ? catColor : C.white, marginBottom: "10px", flex: 1, transition: "color .3s", letterSpacing: "-.2px" }}>{post.title}</h3>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dim, lineHeight: 1.65, marginBottom: "18px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.sub}</p>
        <div style={{ borderTop: `1px solid ${h ? catColor + "30" : "rgba(255,255,255,0.06)"}`, paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", transition: "border-color .3s", flexWrap: "wrap" }}>
          <AuthorChip
            author={post.author} role={post.authorRole} avatar={post.avatar} avatarUrl={post.authorImageUrl} color={catColor}
            onClick={e => { e.stopPropagation(); navigate(authorNav); }}
          />
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: C.dimmer }}>{post.date}</span>
        </div>
      </div>
    </div>
  );
}

//  SHARE BUTTONS 
function ShareButtons({ post, onToast }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(`${window.location.origin}${window.location.pathname}#/post/${post.slug}`);
  }, [post.slug]);

  const copyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => onToast("Link Copied!"));
  };

  const shareX = () => {
    if (!url) return;
    const text = encodeURIComponent(`"${post.title}"  VibeCircle Blog`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const btns = [
    { label: "Copy Link", icon: "", action: copyLink },
    { label: "Share on X", icon: "", action: shareX },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: C.dimmer, alignSelf: "center" }}>Share</span>
      {btns.map(b => (
        <button key={b.label} onClick={b.action} title={b.label} style={{
          display: "flex", alignItems: "center", gap: "7px",
          fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "2px", padding: "7px 14px", cursor: "pointer", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.white; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = C.dim; }}
        >
          <span style={{ fontSize: "13px" }}>{b.icon}</span> {b.label}
        </button>
      ))}
    </div>
  );
}

//  BODY RENDERER 
function RenderBody({ text, catColor }) {
  const paras = text.trim().split("\n\n").filter(Boolean);
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

// 
// ARTICLE VIEW
// 
function ArticleView({ slug, navigate }) {
  //  DATA: try Sanity first, fall back to static POSTS 
  const { data: sanityData, done: sanityDone } = useSanityQuery(QUERIES.bySlug, { slug }, [slug]);
  const { data: sanityAll } = useSanityQuery(QUERIES.allPosts, {}, []);
  const staticPost = POSTS.find(p => p.slug === slug);
  const post = sanityDone
    ? (sanityData ? normalizeSanityPost(sanityData) : staticPost)
    : staticPost; // show static immediately while Sanity loads

  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const articleRef = useRef(null);
  const catColor = getCatColor(post);

  useEffect(() => {
    if (!post) return;
    const h = () => {
      if (!articleRef.current) return;
      const el = articleRef.current;
      const scrolled = Math.max(0, -el.getBoundingClientRect().top);
      const total = el.offsetHeight;
      setProgress(Math.min(100, Math.round((scrolled / total) * 100)));
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, [post]);

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, flexDirection: "column", gap: "16px", padding: "120px 24px" }}>
        <div style={{ fontSize: "48px", opacity: .3 }}></div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: C.white }}>Post Not Found</h2>
        <button onClick={() => navigate("#/")} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", padding: "12px 28px", background: C.orange, color: C.bg, border: "none", borderRadius: "2px", cursor: "pointer" }}>Back to Blog</button>
      </div>
    );
  }

  // Navigation: use Sanity all-posts order when available, otherwise static
  const allForNav = sanityAll ? sanityAll.map(normalizeSanityPost) : POSTS;
  const idx = allForNav.findIndex(p => p.slug === slug);
  const prevPost = allForNav[idx + 1] || null;
  const nextPost = allForNav[idx - 1] || null;
  const related = allForNav.filter(p => p.slug !== post.slug).slice(0, 4);

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* READING PROGRESS */}
      <div style={{ position: "fixed", top: "68px", left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 100 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${catColor},${C.orange})`, transition: "width .1s linear" }} />
      </div>

      {/* HERO */}
      <section style={{ paddingTop: "110px", padding: "110px clamp(20px,4vw,56px) 60px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <Orb top="-15%" right="-5%" size={600} color={catColor} opacity={0.09} />
        <Orb bottom="-30%" left="15%" size={440} color={C.orange} opacity={0.06} delay="3s" />
        <div style={{ maxWidth: "820px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* BREADCRUMB */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", animation: "fadeUp .45s ease forwards", opacity: 0 }}>
            <button onClick={() => navigate("#/")} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", transition: "color .2s", padding: 0 }}
              onMouseEnter={e => e.target.style.color = C.white} onMouseLeave={e => e.target.style.color = C.dimmer}
            >Blog</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}></span>
            <CatBadge cat={post.cat} onClick={() => navigate(post.catSlug ? `#/cat/${post.catSlug}` : `#/cat/${encodeURIComponent(post.cat)}`)} />
          </div>

          {/* THUMBNAIL */}
          <div style={{ marginBottom: "28px", animation: "fadeUp .45s .05s ease forwards", opacity: 0 }}>
            <Thumbnail post={post} height="220px" fontSize="72px" />
          </div>

          {/* TITLE */}
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(34px,5.5vw,70px)", lineHeight: .93, color: C.white, marginBottom: "20px", letterSpacing: "-1px", animation: "fadeUp .5s .1s ease forwards", opacity: 0 }}>
            {post.title}
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(15px,1.6vw,20px)", fontStyle: "italic", color: C.dim, lineHeight: 1.7, marginBottom: "32px", animation: "fadeUp .5s .15s ease forwards", opacity: 0 }}>{post.sub}</p>

          {/* META */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingTop: "22px", borderTop: `1px solid ${C.border}`, animation: "fadeUp .5s .2s ease forwards", opacity: 0 }}>
            <AuthorChip
              author={post.author} role={post.authorRole} avatar={post.avatar} avatarUrl={post.authorImageUrl} color={catColor}
              onClick={() => navigate(post.authorSlug ? `#/author/${post.authorSlug}` : `#/author/${encodeURIComponent(post.author)}`)}
            />
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{post.date}</span>
              <ReadTime t={post.readTime} />
            </div>
          </div>
        </div>
      </section>

      {/* BODY + SIDEBAR */}
      <section style={{ padding: `60px clamp(20px,4vw,56px)`, maxWidth: "1200px", margin: "0 auto" }}>
        <div className="sidebar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "60px", alignItems: "flex-start" }}>

          {/* ARTICLE */}
          <article ref={articleRef}>
            <div style={{ height: "3px", background: `linear-gradient(90deg,${catColor},${C.orange},transparent)`, borderRadius: "2px", marginBottom: "44px", transformOrigin: "left", animation: "lineGrow .6s .25s ease both" }} />
            {post._sanity
              ? <PortableTextRenderer blocks={post.body} catColor={catColor} />
              : <RenderBody text={post.body} catColor={catColor} />
            }

            {/* TAGS */}
            <div style={{ marginTop: "52px", paddingTop: "28px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: C.dimmer, marginBottom: "12px" }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.45)", padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", cursor: "default", transition: "all .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.color = C.white; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                  >#{tag}</span>
                ))}
              </div>
            </div>

            {/* SHARE */}
            <div style={{ marginTop: "32px" }}>
              <ShareButtons post={post} onToast={setToast} />
            </div>

            {/* AUTHOR CARD */}
            <div style={{ marginTop: "40px", padding: "28px", background: "rgba(255,255,255,0.02)", border: `1px solid ${catColor}30`, borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                {post.authorImageUrl ? (
                  <img src={post.authorImageUrl} alt={post.author} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${catColor}50` }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `${catColor}20`, border: `2px solid ${catColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{post.avatar}</div>
                )}
                <div>
                  <button onClick={() => navigate(post.authorSlug ? `#/author/${post.authorSlug}` : `#/author/${encodeURIComponent(post.author)}`)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: catColor, letterSpacing: ".5px", background: "none", border: "none", cursor: "pointer", padding: 0, display: "block", transition: "opacity .2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >{post.author}</button>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{post.authorRole}  VibeCircle</div>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dim, lineHeight: 1.65, marginBottom: "12px" }}>
                Building the infrastructure for city culture. See more from this author on the VibeCircle Blog.
              </p>
              <button onClick={() => navigate(post.authorSlug ? `#/author/${post.authorSlug}` : `#/author/${encodeURIComponent(post.author)}`)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "2px", padding: "7px 16px", background: "transparent", color: catColor, border: `1px solid ${catColor}40`, borderRadius: "2px", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${catColor}15`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >All Posts by {post.author.split(" ")[0]} </button>
            </div>

            {/* PREV / NEXT NAV */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "48px" }}>
              {prevPost ? (
                <div onClick={() => navigate(`#/post/${prevPost.slug}`)} style={{ padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", cursor: "pointer", transition: "all .25s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.background = "rgba(255,107,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "10px", letterSpacing: "3px", color: C.dimmer, marginBottom: "6px" }}> Older</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(13px,1.4vw,16px)", color: C.white, lineHeight: 1.1 }}>{prevPost.title}</div>
                </div>
              ) : <div />}
              {nextPost ? (
                <div onClick={() => navigate(`#/post/${nextPost.slug}`)} style={{ padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", cursor: "pointer", textAlign: "right", transition: "all .25s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.background = "rgba(255,107,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "10px", letterSpacing: "3px", color: C.dimmer, marginBottom: "6px" }}>Newer </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(13px,1.4vw,16px)", color: C.white, lineHeight: 1.1 }}>{nextPost.title}</div>
                </div>
              ) : <div />}
            </div>
          </article>

          {/* SIDEBAR */}
          <aside style={{ position: "sticky", top: "88px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", color: C.orange, marginBottom: "16px" }}>More From the Blog</div>
            <div>
              {related.map((rp, i) => (
                <Reveal key={rp.id || rp.slug} delay={i * .07}>
                  <PostCard post={rp} navigate={navigate} variant="compact" />
                </Reveal>
              ))}
            </div>
            <Reveal delay={.3}>
              <div style={{ marginTop: "28px", padding: "24px", background: `${C.orange}0C`, border: `1px solid ${C.orange}30`, borderRadius: "4px" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: C.white, lineHeight: 1.1, marginBottom: "8px" }}>The Pulse Newsletter</div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.6, marginBottom: "14px" }}>City culture, creator news, and platform drops  every Tuesday.</p>
                <NewsletterForm />
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* RELATED FULL CARDS */}
      <section style={{ padding: `52px clamp(20px,4vw,56px)`, background: C.bg2, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", color: C.orange }}>Continue Reading</span>
              <div style={{ flex: 1, height: "1px", background: C.border }} />
            </div>
          </Reveal>
          <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {related.slice(0, 3).map((rp, i) => (
              <Reveal key={rp.id || rp.slug} delay={i * .09}><PostCard post={rp} navigate={navigate} /></Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// 
// BLOG INDEX
// 
function BlogIndex({ navigate, filterCat = null }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); setSearch(""); }, [filterCat]);

  //  DATA: try Sanity, fall back to static 
  const query  = filterCat ? QUERIES.byCat : QUERIES.allPosts;
  const params = filterCat ? { slug: filterCat } : {};
  const { data: sanityPosts, done: sanityDone } = useSanityQuery(query, params, [filterCat]);
  const { data: sanityAllPosts, done: sanityAllPostsDone } = useSanityQuery(QUERIES.allPosts, {}, []);
  const { data: sanityAllAuthors, done: sanityAllAuthorsDone } = useSanityQuery(QUERIES.allAuthors, {}, []);
  const { data: sanityAllCats, done: sanityAllCatsDone } = useSanityQuery(QUERIES.allCats, {}, []);

  if (SANITY_PROJECT_ID && !(sanityDone && sanityAllPostsDone && sanityAllAuthorsDone && sanityAllCatsDone)) {
    const Skel = ({ w = "100%", h = "14px", r = "2px" }) => (
      <div style={{
        width: w, height: h, borderRadius: r,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
        backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite",
      }} />
    );
    return (
      <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
        <section style={{ paddingTop: "120px", padding: "120px clamp(20px,4vw,56px) 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ width: "160px", marginBottom: "18px" }}><Skel h="18px" /></div>
            <div style={{ width: "420px", marginBottom: "10px" }}><Skel h="54px" /></div>
            <div style={{ width: "360px", marginBottom: "20px" }}><Skel h="44px" /></div>
            <div style={{ width: "520px", marginBottom: "28px" }}><Skel h="14px" /></div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: "140px" }}>
                  <Skel h="28px" />
                  <div style={{ marginTop: "6px" }}><Skel h="10px" /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section style={{ padding: "0 clamp(20px,4vw,56px) 80px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="sidebar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "60px", alignItems: "flex-start" }}>
              <div>
                <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{ padding: "18px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", background: "rgba(255,255,255,0.02)" }}>
                      <Skel h="140px" r="4px" />
                      <div style={{ marginTop: "14px" }}><Skel h="18px" /></div>
                      <div style={{ marginTop: "10px" }}><Skel h="12px" /></div>
                      <div style={{ marginTop: "8px" }}><Skel h="12px" /></div>
                    </div>
                  ))}
                </div>
              </div>
              <aside style={{ position: "sticky", top: "88px" }}>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                  <div style={{ width: "140px", marginBottom: "10px" }}><Skel h="12px" /></div>
                  <div style={{ width: "180px", marginBottom: "10px" }}><Skel h="20px" /></div>
                  <div style={{ width: "220px", marginBottom: "14px" }}><Skel h="12px" /></div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}><Skel h="34px" r="2px" /></div>
                    <div style={{ width: "60px" }}><Skel h="34px" r="2px" /></div>
                  </div>
                </div>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                  <div style={{ width: "160px", marginBottom: "12px" }}><Skel h="12px" /></div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                      <Skel w="120px" h="12px" />
                      <Skel w="22px" h="16px" />
                    </div>
                  ))}
                </div>
                <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px" }}>
                  <div style={{ width: "100px", marginBottom: "10px" }}><Skel h="12px" /></div>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
                      <Skel w="28px" h="28px" r="50%" />
                      <div style={{ flex: 1 }}>
                        <Skel h="12px" />
                        <div style={{ marginTop: "6px" }}><Skel h="10px" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const postsToUse = sanityDone && sanityPosts
    ? sanityPosts.map(normalizeSanityPost)
    : (filterCat ? POSTS.filter(p => p.cat === filterCat || p.catSlug === filterCat) : POSTS);

  const featured = !filterCat
    ? (sanityAllPosts ? sanityAllPosts.map(normalizeSanityPost).find(p => p.featured) : POSTS.find(p => p.featured))
    : null;
  const rest = postsToUse.filter(p => !p.featured || filterCat);

  const filtered = rest
    .filter(p => !filterCat || p.cat === filterCat)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.sub.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const showFeatured = !filterCat && !search && page === 1;

  const stats = {
    postsCount: sanityAllPostsDone && Array.isArray(sanityAllPosts) ? sanityAllPosts.length : POSTS.length,
    authorsCount: sanityAllAuthorsDone && Array.isArray(sanityAllAuthors) ? sanityAllAuthors.length : AUTHORS.length,
    catsCount: sanityAllCatsDone && Array.isArray(sanityAllCats) ? sanityAllCats.length : Object.keys(CAT_COLORS).length,
  };

  const sidebarCats = sanityAllCatsDone && Array.isArray(sanityAllCats)
    ? sanityAllCats.map(c => ({
        label: c.title,
        slug: c.slug || c.title,
        color: c.color || CAT_COLORS[c.title] || C.orange,
        count: c.count || 0,
      }))
    : Object.entries(CAT_COLORS).map(([cat, color]) => ({
        label: cat,
        slug: cat,
        color,
        count: POSTS.filter(p => p.cat === cat).length,
      }));

  const sidebarAuthors = sanityAllAuthorsDone && Array.isArray(sanityAllAuthors)
    ? sanityAllAuthors.map(normalizeSanityAuthor)
    : AUTHORS.map(a => ({ ...a, slug: a.name }));

  const categoryTabs = [
    { label: "All", path: "#/" },
    ...(sanityAllCatsDone && Array.isArray(sanityAllCats)
      ? sanityAllCats.map(c => ({
          label: c.title,
          path: `#/cat/${encodeURIComponent(c.slug || c.title)}`,
          color: c.color || CAT_COLORS[c.title],
        }))
      : Object.entries(CAT_COLORS).map(([c, col]) => ({
          label: c,
          path: `#/cat/${encodeURIComponent(c)}`,
          color: col,
        }))),
  ];

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>

      {/* MASTHEAD */}
      <section style={{ paddingTop: "120px", padding: "120px clamp(20px,4vw,56px) 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.orange}05 1px,transparent 1px),linear-gradient(90deg,${C.orange}05 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
        <Orb top="-15%" right="-5%" size={640} opacity={0.11} />
        <Orb bottom="-30%" left="20%" size={480} color={C.orange} opacity={0.07} delay="4s" />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {filterCat ? (
            <Reveal>
              <div style={{ marginBottom: "12px" }}><Tag>{filterCat}</Tag></div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(44px,7vw,90px)", lineHeight: .92, color: C.white, letterSpacing: "-1px", marginBottom: "12px" }}>
                {filterCat}<br /><span style={{ color: C.orange, WebkitTextStroke: "0" }}>Articles.</span>
              </h1>
              <button onClick={() => navigate("#/")} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", transition: "color .2s", padding: 0 }}
                onMouseEnter={e => e.target.style.color = C.white} onMouseLeave={e => e.target.style.color = C.dimmer}
              > All posts</button>
            </Reveal>
          ) : (
            <div>
              <div style={{ animation: "fadeUp .5s ease forwards", opacity: 0, marginBottom: "18px" }}><Tag>VibeCircle Journal</Tag></div>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(56px,9vw,110px)", lineHeight: .88, color: C.white, animation: "fadeUp .52s .07s ease forwards", opacity: 0, marginBottom: "14px", letterSpacing: "-2px" }}>
                THE<br /><span style={{ WebkitTextStroke: "2px #FF6B00", color: "transparent", letterSpacing: "2px" }}>PULSE<span style={{ marginLeft: "6px" }}>.</span></span>
              </h1>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(14px,1.6vw,18px)", color: C.dim, maxWidth: "480px", lineHeight: 1.75, animation: "fadeUp .52s .14s ease forwards", opacity: 0 }}>
                Insights on city culture, the creator economy, and the technology making it all move.
              </p>
              <div style={{ display: "flex", gap: "clamp(20px,4vw,48px)", marginTop: "36px", animation: "fadeUp .52s .21s ease forwards", opacity: 0, flexWrap: "wrap" }}>
                {[
                  [`${stats.postsCount}`, "Articles"],
                  [stats.authorsCount, "Authors"],
                  [stats.catsCount, "Categories"],
                  ["Weekly", "New Content"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(22px,3vw,36px)", color: C.orange, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", letterSpacing: "1.5px", color: C.dimmer, marginTop: "3px", textTransform: "uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORY + SEARCH BAR */}
      <div style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: "68px", zIndex: 99 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", minHeight: "52px" }}>
          <div style={{ display: "flex", gap: "0", overflowX: "auto", flex: 1 }}>
            {categoryTabs.map(item => {
              const active = filterCat ? item.label === filterCat : item.label === "All";
              return (
                <button key={item.label} onClick={() => { navigate(item.path); }} style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "2px",
                  padding: "16px 14px", background: "none", border: "none",
                  borderBottom: `2px solid ${active ? item.color || C.orange : "transparent"}`,
                  color: active ? item.color || C.orange : C.dimmer,
                  cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.dim; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.dimmer; }}
                >{item.label}</button>
              );
            })}
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: "12px", pointerEvents: "none" }}></span>
            <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", padding: "7px 12px 7px 28px", fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.white, outline: "none", width: "160px", transition: "border-color .2s, width .3s" }}
              onFocus={e => { e.target.style.borderColor = C.orange; e.target.style.width = "200px"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.width = "160px"; }}
            />
          </div>
        </div>
      </div>

      {/* FEATURED */}
      {showFeatured && featured && (
        <section style={{ padding: "48px clamp(20px,4vw,56px) 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Reveal style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.orange, animation: "dotBlink 2s infinite" }} />
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "4px", color: C.orange }}>Featured Story</span>
                <div style={{ flex: 1, height: "1px", background: C.border }} />
              </div>
            </Reveal>
            <Reveal><FeaturedCard post={featured} navigate={navigate} /></Reveal>
          </div>
        </section>
      )}

      {/* MAIN GRID */}
      <section style={{ padding: "48px clamp(20px,4vw,56px) 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Reveal style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "11px", letterSpacing: "3px", color: C.dimmer }}>
                {search ? `"${search}"  ` : ""}{filtered.length} Article{filtered.length !== 1 ? "s" : ""}{filterCat ? ` in ${filterCat}` : ""}
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
            </div>
          </Reveal>

          {/* LAYOUT: index = sidebar; filtered/search = full grid */}
          {!search && !filterCat && page === 1 ? (
            <div className="sidebar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "48px", alignItems: "flex-start" }}>
              {/* MAIN */}
              <div>
                <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  {paginated.slice(0, 2).map((p, i) => <Reveal key={p.id} delay={i * .08}><PostCard post={p} navigate={navigate} /></Reveal>)}
                </div>
                {paginated.slice(2).map((p, i) => (
                  <Reveal key={p.id} delay={i * .06}><PostCard post={p} navigate={navigate} variant="compact" /></Reveal>
                ))}
              </div>
              {/* SIDEBAR */}
              <aside>
                <Reveal>
                  <div style={{ padding: "28px 24px", background: `${C.orange}0C`, border: `1px solid ${C.orange}25`, borderRadius: "4px", marginBottom: "24px" }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.orange, marginBottom: "8px" }}>The Pulse Newsletter</div>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.white, lineHeight: 1.05, marginBottom: "8px" }}>City intel.<br />Weekly drops.</h3>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dim, lineHeight: 1.55, marginBottom: "14px" }}>The VibeCircle Journal straight to your inbox every Tuesday. No spam. Just signal.</p>
                    <NewsletterForm />
                  </div>
                </Reveal>
                  <Reveal delay={.1}>
                    <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "14px" }}>Browse by Category</div>
                      {sidebarCats.map(cat => (
                        <button key={cat.label} onClick={() => navigate(`#/cat/${encodeURIComponent(cat.slug)}`)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "9px 10px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "2px", transition: "background .2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: C.dim }}>{cat.label}</span>
                          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "16px", color: cat.color }}>{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  </Reveal>
                  <Reveal delay={.15}>
                    <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "16px" }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "12px", letterSpacing: "3px", color: C.dimmer, marginBottom: "4px" }}>Authors</div>
                      {sidebarAuthors.map(a => (
                        <button key={a.name} onClick={() => navigate(`#/author/${encodeURIComponent(a.slug || a.name)}`)} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "2px", transition: "background .2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
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
            // FILTERED / SEARCH / PAGINATED GRID
            paginated.length > 0 ? (
              <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                {paginated.map((p, i) => <Reveal key={p.id} delay={i * .07}><PostCard post={p} navigate={navigate} /></Reveal>)}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "14px", opacity: .3 }}></div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px", color: C.white, marginBottom: "8px" }}>Nothing found</div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: C.dimmer }}>Try a different search or category.</p>
              </div>
            )
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <Reveal style={{ marginTop: "52px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page === 1} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "2px", padding: "10px 20px", background: "transparent", color: page === 1 ? "rgba(255,255,255,0.2)" : C.dim, border: `1px solid ${page === 1 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}`, borderRadius: "2px", cursor: page === 1 ? "not-allowed" : "pointer", transition: "all .2s" }}> Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "14px", width: "36px", height: "36px", background: page === n ? C.orange : "transparent", color: page === n ? C.bg : C.dim, border: `1px solid ${page === n ? C.orange : "rgba(255,255,255,0.12)"}`, borderRadius: "2px", cursor: "pointer", transition: "all .2s" }}>{n}</button>
                ))}
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page === totalPages} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "2px", padding: "10px 20px", background: "transparent", color: page === totalPages ? "rgba(255,255,255,0.2)" : C.dim, border: `1px solid ${page === totalPages ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}`, borderRadius: "2px", cursor: page === totalPages ? "not-allowed" : "pointer", transition: "all .2s" }}>Next </button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: C.orange, padding: "18px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "marquee 20s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(4)].map((_, x) =>
            ["City Culture", "", "Creator Economy", "", "Brand Strategy", "", "Music & Events", "", "Tech & Maps", "", "Campus Life", ""].map((wd, i) => (
              <span key={`${x}-${i}`} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", color: "rgba(5,5,10,0.6)", marginRight: "28px" }}>{wd}</span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 
// AUTHOR PAGE
// 
function AuthorPage({ name, navigate }) {
  const decoded = decodeURIComponent(name);
  // Try Sanity by author slug or name, fall back to matching static posts by name
  const { data: sanityPosts, done } = useSanityQuery(QUERIES.byAuthor, { slug: decoded }, [decoded]);
  const staticPosts = POSTS.filter(p => p.author === decoded || p.authorSlug === name);
  const posts = done && sanityPosts
    ? sanityPosts.map(normalizeSanityPost)
    : staticPosts;
  const firstPost = posts[0];
  const author = firstPost
    ? { name: firstPost.author, avatar: firstPost.avatar, role: firstPost.authorRole, imageUrl: firstPost.authorImageUrl }
    : AUTHORS.find(a => a.name === decoded);
  const color = firstPost ? getCatColor(firstPost) : C.orange;

  if (!author) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, flexDirection: "column", gap: "16px", padding: "120px 24px" }}>
      <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "36px", color: C.white }}>Author not found</h2>
      <button onClick={() => navigate("#/")} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "13px", letterSpacing: "3px", padding: "12px 28px", background: C.orange, color: C.bg, border: "none", borderRadius: "2px", cursor: "pointer" }}>Back to Blog</button>
    </div>
  );

  return (
    <div style={{ background: C.bg, color: C.white, minHeight: "100vh" }}>
      <section style={{ paddingTop: "110px", padding: "110px clamp(20px,4vw,56px) 60px", position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <Orb top="-10%" right="-5%" size={500} color={color} opacity={0.1} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ animation: "fadeUp .45s ease forwards", opacity: 0, marginBottom: "28px" }}>
            <button onClick={() => navigate("#/")} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color .2s" }} onMouseEnter={e => e.target.style.color = C.white} onMouseLeave={e => e.target.style.color = C.dimmer}> All Posts</button>
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
          {posts.map((p, i) => <Reveal key={p.id || p.slug} delay={i * .09}><PostCard post={p} navigate={navigate} /></Reveal>)}
        </div>
      </section>
    </div>
  );
}

// 
// AUTHORS LIST PAGE
// 
function AuthorsPage({ navigate }) {
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
        <AuthorsList navigate={navigate} />
      </section>
    </div>
  );
}

function AuthorsList({ navigate }) {
  const { data: sanityAuthors, done: authorsDone } = useSanityQuery(QUERIES.allAuthors, {}, []);
  const { data: sanityPosts, done: postsDone } = useSanityQuery(QUERIES.allPosts, {}, []);

  let authorsToShow = [];
  if (authorsDone && Array.isArray(sanityAuthors) && sanityAuthors.length > 0) {
    authorsToShow = sanityAuthors.map(normalizeSanityAuthor);
  } else if (postsDone && Array.isArray(sanityPosts) && sanityPosts.length > 0) {
      const normalized = sanityPosts.map(normalizeSanityPost);
      const map = new Map();
      normalized.forEach((p) => {
        if (!p.author) return;
        const key = p.authorSlug || p.author;
        const existing = map.get(key) || {
          name: p.author,
          slug: p.authorSlug || encodeURIComponent(p.author),
          role: p.authorRole,
          avatar: p.avatar,
          imageUrl: p.authorImageUrl,
          count: 0,
        };
        existing.count += 1;
        map.set(key, existing);
      });
    authorsToShow = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  } else {
    authorsToShow = AUTHORS.map(a => ({
      name: a.name,
      slug: encodeURIComponent(a.name),
      avatar: a.avatar,
      role: a.role,
      count: POSTS.filter(p => p.author === a.name).length,
    }));
  }

  return (
    <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
      {authorsToShow.map((a, i) => {
        const color = C.orange;
        const navSlug = a.slug || encodeURIComponent(a.name);
        return (
          <Reveal key={a.name} delay={i * .08}>
            <div onClick={() => navigate(`#/author/${navSlug}`)} style={{ padding: "32px 28px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", cursor: "pointer", transition: "all .3s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = ""; }}
            >
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.name} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}40`, marginBottom: "16px" }} />
              ) : (
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `${color}20`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" }}>{a.avatar}</div>
              )}
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: C.white, marginBottom: "4px" }}>{a.name}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color, marginBottom: "12px" }}>{a.role}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: C.dimmer }}>{a.count} article{a.count !== 1 ? "s" : ""}</div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

// 
// ROOT APP
// 
export default function App() {
  const { route, navigate } = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Parse route
  let view = "index";
  let param = null;

  if (route.startsWith("#/post/")) {
    view = "article";
    param = route.replace("#/post/", "");
  } else if (route.startsWith("#/cat/")) {
    view = "index";
    param = decodeURIComponent(route.replace("#/cat/", ""));
  } else if (route.startsWith("#/author/") && route !== "#/authors") {
    view = "author";
    param = route.replace("#/author/", "");
  } else if (route === "#/authors") {
    view = "authors";
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} suppressHydrationWarning />
      <Nav navigate={navigate} route={route} />
      <main>
        {view === "article" && <ArticleView slug={param} navigate={navigate} />}
        {view === "author" && <AuthorPage name={param} navigate={navigate} />}
        {view === "authors" && <AuthorsPage navigate={navigate} />}
        {view === "index" && <BlogIndex navigate={navigate} filterCat={param} />}
      </main>
    </>
  );
}

