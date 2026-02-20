import { NextResponse } from "next/server";
import { getWriteClient } from "../../../../lib/sanity-write-client";

export const runtime = "nodejs";

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toBlocks(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const paras = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paras.map((p) => ({
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text: p, marks: [] }],
  }));
}

async function uploadImage(client, file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  return client.assets.upload("image", buffer, { filename: file.name, contentType: file.type });
}

async function ensureAuthor(client, { name, role, avatarEmoji, bio, photoAsset }) {
  const slug = slugify(name);
  const existing = await client.fetch(
    `*[_type=="author" && (slug.current==$slug || name==$name)][0]{_id}`,
    { slug, name }
  );
  if (existing?._id) {
    let patch = client.patch(existing._id);
    if (role) patch = patch.set({ role });
    if (avatarEmoji) patch = patch.set({ avatarEmoji });
    if (bio) patch = patch.set({ bio });
    if (photoAsset?._id) {
      patch = patch.set({
        photo: { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } },
      });
    }
    await patch.commit();
    return existing._id;
  }

  const doc = {
    _type: "author",
    name,
    slug: { _type: "slug", current: slug || slugify(name) },
    role: role || "Contributor",
    avatarEmoji: avatarEmoji || "✍️",
    bio: bio || "",
  };
  if (photoAsset?._id) {
    doc.photo = { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } };
  }
  const created = await client.create(doc);
  return created._id;
}

async function ensureCategory(client, { title, color }) {
  const slug = slugify(title);
  const existing = await client.fetch(
    `*[_type=="category" && (slug.current==$slug || title==$title)][0]{_id}`,
    { slug, title }
  );
  if (existing?._id) {
    if (color) {
      await client.patch(existing._id).set({ color }).commit();
    }
    return existing._id;
  }

  const created = await client.create({
    _type: "category",
    title,
    slug: { _type: "slug", current: slug || slugify(title) },
    color: color || "#FF6B00",
  });
  return created._id;
}

export async function POST(req) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!process.env.ADMIN_API_SECRET || secret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = getWriteClient();
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const subtitle = String(form.get("subtitle") || "").trim();
    const bodyText = String(form.get("body") || "");
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const authorName = String(form.get("authorName") || "").trim();
    const authorRole = String(form.get("authorRole") || "").trim();
    const authorAvatar = String(form.get("authorAvatar") || "").trim();
    const authorBio = String(form.get("authorBio") || "").trim();

    const categoryTitle = String(form.get("category") || "").trim();
    const categoryColor = String(form.get("categoryColor") || "").trim();

    const emoji = String(form.get("emoji") || "").trim() || "📝";
    const featured = String(form.get("featured") || "") === "true";
    const thumbGradStart = String(form.get("thumbGradStart") || "").trim() || "#FF6B00";
    const thumbGradEnd = String(form.get("thumbGradEnd") || "").trim() || "#FF2D78";
    const publishedAt = String(form.get("publishedAt") || "").trim();

    if (!title || !subtitle || !authorName || !categoryTitle) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const authorPhotoFile = form.get("authorPhoto");
    const authorPhotoAsset = await uploadImage(client, authorPhotoFile);
    const authorId = await ensureAuthor(client, {
      name: authorName,
      role: authorRole,
      avatarEmoji: authorAvatar,
      bio: authorBio,
      photoAsset: authorPhotoAsset,
    });

    const categoryId = await ensureCategory(client, { title: categoryTitle, color: categoryColor });

    const coverFile = form.get("coverImage");
    const coverAsset = await uploadImage(client, coverFile);

    const bodyImages = form.getAll("bodyImages") || [];
    const bodyImageAssets = [];
    for (const f of bodyImages) {
      const asset = await uploadImage(client, f);
      if (asset?._id) bodyImageAssets.push(asset);
    }

    const blocks = toBlocks(bodyText);
    const imageBlocks = bodyImageAssets.map((asset) => ({
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: asset.originalFilename || "image",
    }));

    const doc = {
      _type: "post",
      title,
      subtitle,
      slug: { _type: "slug", current: slugify(title) || undefined },
      author: { _type: "reference", _ref: authorId },
      category: { _type: "reference", _ref: categoryId },
      tags,
      publishedAt: publishedAt || new Date().toISOString(),
      featured,
      emoji,
      thumbGradStart,
      thumbGradEnd,
      body: [...blocks, ...imageBlocks],
    };

    if (coverAsset?._id) {
      doc.coverImage = {
        _type: "image",
        asset: { _type: "reference", _ref: coverAsset._id },
        alt: title,
      };
    }

    const created = await client.create(doc);
    return NextResponse.json({ id: created._id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create post." }, { status: 500 });
  }
}
