import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug") || "/";
  const disable = searchParams.get("disable") === "1";

  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new NextResponse("Invalid secret", { status: 401 });
  }

  if (disable) {
    draftMode().disable();
    return NextResponse.redirect(new URL(slug, req.url));
  }

  draftMode().enable();
  return NextResponse.redirect(new URL(slug, req.url));
}
