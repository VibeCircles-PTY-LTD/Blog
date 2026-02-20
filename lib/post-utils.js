export function toPlainText(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  return body
    .map((block) => {
      if (block?._type !== "block" || !Array.isArray(block.children)) return "";
      return block.children.map((child) => child?.text || "").join("");
    })
    .join("\n\n");
}

export function calcReadTime(body) {
  const text = toPlainText(body).trim();
  if (!text) return "1 min read";
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

export function normalizePost(p) {
  const body = p.body || "";
  const bodyText = toPlainText(body);
  return {
    id: p._id || p.id,
    slug: p.slug,
    cat: p.category || p.cat,
    catColor: p.categoryColor || p.catColor,
    featured: Boolean(p.featured),
    title: p.title,
    sub: p.sub,
    author: p.authorName || p.author,
    authorRole: p.authorRole,
    avatar: p.authorAvatar,
    authorImageUrl: p.authorImageUrl,
    date: formatDate(p.publishedAt),
    published: p.publishedAt ? String(p.publishedAt).slice(0, 10) : "",
    emoji: p.emoji || "??",
    coverImageUrl: p.coverImageUrl,
    thumbGrad: Array.isArray(p.thumbGrad) && p.thumbGrad.length === 2 ? p.thumbGrad : ["#FF6B00", "#FF2D78"],
    tags: Array.isArray(p.tags) ? p.tags : [],
    body,
    bodyText,
    readTime: calcReadTime(body),
  };
}

export function authorsFromPosts(posts) {
  const map = new Map();
  posts.forEach((p) => {
    if (!p.author) return;
    if (!map.has(p.author)) {
      map.set(p.author, {
        name: p.author,
        role: p.authorRole,
        avatar: p.avatar,
        imageUrl: p.authorImageUrl,
      });
    }
  });
  return [...map.values()];
}
