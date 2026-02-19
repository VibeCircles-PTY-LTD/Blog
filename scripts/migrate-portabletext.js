/* eslint-disable no-console */
const { createClient } = require("@sanity/client");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !apiVersion) {
  console.error("Missing NEXT_PUBLIC_SANITY_* env vars. Check .env.local.");
  process.exit(1);
}

if (!token) {
  console.error("Missing SANITY_WRITE_TOKEN in .env.local.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

function key() {
  return Math.random().toString(36).slice(2, 10);
}

function parseStrong(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ _type: "span", text: text.slice(last, m.index), marks: [] });
    }
    parts.push({ _type: "span", text: m[1], marks: ["strong"] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push({ _type: "span", text: text.slice(last), marks: [] });
  }
  if (parts.length === 0) {
    parts.push({ _type: "span", text, marks: [] });
  }
  return parts;
}

function textToBlocks(text) {
  const paras = String(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paras.map((para) => {
    const isHeading = para.startsWith("**") && para.endsWith("**") && para.length > 4;
    const content = isHeading ? para.replace(/^\*\*/, "").replace(/\*\*$/, "").trim() : para;
    return {
      _type: "block",
      _key: key(),
      style: isHeading ? "h3" : "normal",
      markDefs: [],
      children: parseStrong(content).map((c) => ({ ...c, _key: key() })),
    };
  });
}

async function migrate() {
  const categories = await client.fetch(`*[_type=="category"]{_id,title,slug}`);
  const authors = await client.fetch(`*[_type=="author"]{_id,name,slug}`);
  const catByTitle = new Map(categories.map((c) => [c.title, c]));
  const authorByName = new Map(authors.map((a) => [a.name, a]));

  const posts = await client.fetch(`*[_type=="post"]{
    _id,
    title,
    body,
    subtitle,
    sub,
    category,
    author,
    thumbGrad,
    thumbGradStart,
    thumbGradEnd,
    emoji
  }`);

  console.log(`Found ${posts.length} posts.`);
  let updated = 0;

  for (const p of posts) {
    let patch = client.patch(p._id);
    let needs = false;

    if (typeof p.body === "string") {
      const blocks = textToBlocks(p.body);
      patch = patch.set({ body: blocks });
      needs = true;
    }

    if (!p.subtitle && p.sub) {
      patch = patch.set({ subtitle: p.sub });
      needs = true;
    }

    if (Array.isArray(p.thumbGrad) && p.thumbGrad.length === 2) {
      if (!p.thumbGradStart) {
        patch = patch.set({ thumbGradStart: p.thumbGrad[0] });
        needs = true;
      }
      if (!p.thumbGradEnd) {
        patch = patch.set({ thumbGradEnd: p.thumbGrad[1] });
        needs = true;
      }
    }

    if (!p.emoji) {
      patch = patch.set({ emoji: "??" });
      needs = true;
    }

    if (typeof p.category === "string") {
      const cat = catByTitle.get(p.category);
      if (cat) {
        patch = patch.set({ category: { _type: "reference", _ref: cat._id } });
        needs = true;
      } else {
        console.warn(`No category found for "${p.category}" in post ${p._id}`);
      }
    }

    if (typeof p.author === "string") {
      const author = authorByName.get(p.author);
      if (author) {
        patch = patch.set({ author: { _type: "reference", _ref: author._id } });
        needs = true;
      } else {
        console.warn(`No author found for "${p.author}" in post ${p._id}`);
      }
    }

    if (needs) {
      await patch.commit({ autoGenerateArrayKeys: true });
      updated += 1;
    }
  }

  console.log(`Migration complete. Updated ${updated} posts.`);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});