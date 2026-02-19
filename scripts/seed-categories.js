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

const categories = [
  { title: "City Culture", slug: "city-culture", color: "#FF6B00" },
  { title: "Creator Economy", slug: "creator-economy", color: "#FF2D78" },
  { title: "Brand Strategy", slug: "brand-strategy", color: "#00D4FF" },
  { title: "Music & Events", slug: "music-events", color: "#9B59FF" },
  { title: "Tech & Maps", slug: "tech-maps", color: "#FFD700" },
  { title: "Campus Life", slug: "campus-life", color: "#FF6B00" },
];

async function seed() {
  console.log("Seeding categories...");
  for (const c of categories) {
    const doc = {
      _id: `category-${c.slug}`,
      _type: "category",
      title: c.title,
      slug: { current: c.slug },
      color: c.color,
    };
    await client.createIfNotExists(doc);
  }
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});