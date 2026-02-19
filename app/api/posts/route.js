import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { getAllPosts } from "../../../lib/sanity-queries";
import { authorsFromPosts } from "../../../lib/post-utils";

export async function GET() {
  const { isEnabled } = draftMode();
  const posts = await getAllPosts({ draftMode: isEnabled });
  const authors = authorsFromPosts(posts);
  return NextResponse.json({ posts, authors });
}
