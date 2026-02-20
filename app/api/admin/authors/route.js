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

async function uploadImage(client, file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  return client.assets.upload("image", buffer, { filename: file.name, contentType: file.type });
}

export async function POST(req) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!process.env.ADMIN_API_SECRET || secret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = getWriteClient();
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const role = String(form.get("role") || "").trim() || "Contributor";
    const avatarEmoji = String(form.get("avatarEmoji") || "").trim() || "✍️";
    const bio = String(form.get("bio") || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Author name is required." }, { status: 400 });
    }

    const slug = slugify(name);
    const existing = await client.fetch(
      `*[_type=="author" && (slug.current==$slug || name==$name)][0]{_id}`,
      { slug, name }
    );

    const photoFile = form.get("photo");
    const photoAsset = await uploadImage(client, photoFile);

    if (existing?._id) {
      let patch = client.patch(existing._id).set({
        name,
        slug: { _type: "slug", current: slug },
        role,
        avatarEmoji,
        bio,
      });
      if (photoAsset?._id) {
        patch = patch.set({ photo: { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } } });
      }
      await patch.commit();
      return NextResponse.json({ id: existing._id, updated: true });
    }

    const doc = {
      _type: "author",
      name,
      slug: { _type: "slug", current: slug },
      role,
      avatarEmoji,
      bio,
    };
    if (photoAsset?._id) {
      doc.photo = { _type: "image", asset: { _type: "reference", _ref: photoAsset._id } };
    }
    const created = await client.create(doc);
    return NextResponse.json({ id: created._id, created: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to save author." }, { status: 500 });
  }
}
