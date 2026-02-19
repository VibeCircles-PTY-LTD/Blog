/* eslint-disable no-new-func */
const fs = require("fs");
const path = require("path");
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

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 96);
}

function extractRawPosts() {
  const filePath = path.join(__dirname, "..", "VibeCircle_Blog_v2.jsx");
  const content = fs.readFileSync(filePath, "utf8");
  const start = content.indexOf("const RAW_POSTS = [");
  const end = content.indexOf("];", start);
  if (start === -1 || end === -1) {
    throw new Error("RAW_POSTS block not found in VibeCircle_Blog_v2.jsx");
  }
  const block = content.slice(start, end + 2);
  const fn = new Function(`${block}; return RAW_POSTS;`);
  return fn();
}

async function migrate() {
  const rawPosts = extractRawPosts();
  const authorsMap = new Map();

  rawPosts.forEach((p) => {
    if (!authorsMap.has(p.author)) {
      authorsMap.set(p.author, {
        _id: `author-${slugify(p.author)}`,
        _type: "author",
        name: p.author,
        role: p.authorRole,
        avatar: p.avatar,
      });
    }
  });

  const authors = Array.from(authorsMap.values());

  console.log(`Creating ${authors.length} authors...`);
  for (const a of authors) {
    await client.createIfNotExists(a);
  }

  console.log(`Creating ${rawPosts.length} posts...`);
  for (const p of rawPosts) {
    const authorId = `author-${slugify(p.author)}`;
    const doc = {
      _id: `post-${p.slug}`,
      _type: "post",
      title: p.title,
      slug: { current: p.slug },
      sub: p.sub,
      body: p.body,
      publishedAt: p.published || null,
      featured: Boolean(p.featured),
      emoji: p.emoji,
      thumbGrad: p.thumbGrad,
      tags: p.tags,
      category: p.cat,
      author: { _type: "reference", _ref: authorId },
    };

    await client.createIfNotExists(doc);
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
