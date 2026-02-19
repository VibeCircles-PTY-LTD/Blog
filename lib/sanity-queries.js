import { groq } from "next-sanity";
import { getClient } from "./sanity.client";
import { normalizePost } from "./post-utils";

const postFields = `{
  _id,
  title,
  "slug": slug.current,
  "sub": coalesce(subtitle, sub),
  "coverImageUrl": coverImage.asset->url,
  body,
  publishedAt,
  featured,
  emoji,
  "thumbGrad": coalesce(thumbGrad, [thumbGradStart, thumbGradEnd]),
  tags,
  "category": coalesce(category->title, category),
  "categoryColor": category->color,
  "authorName": coalesce(author->name, author),
  "authorRole": author->role,
  "authorAvatar": coalesce(author->avatarEmoji, author->avatar),
  "authorImageUrl": coalesce(author->photo.asset->url, author->image.asset->url)
}`;

export async function getAllPosts({ draftMode = false } = {}) {
  const client = getClient({ draftMode });
  const data = await client.fetch(groq`*[_type == "post"] | order(publishedAt desc) ${postFields}`);
  return data.map(normalizePost);
}

export async function getPostBySlug(slug, { draftMode = false } = {}) {
  const client = getClient({ draftMode });
  const data = await client.fetch(groq`*[_type == "post" && slug.current == $slug][0] ${postFields}`, { slug });
  return data ? normalizePost(data) : null;
}

export async function getPostsByCategory(category, { draftMode = false } = {}) {
  const client = getClient({ draftMode });
  const data = await client.fetch(
    groq`*[_type == "post" && (category == $category || category->title == $category)] | order(publishedAt desc) ${postFields}`,
    { category }
  );
  return data.map(normalizePost);
}

export async function getPostsByAuthor(name, { draftMode = false } = {}) {
  const client = getClient({ draftMode });
  const data = await client.fetch(
    groq`*[_type == "post" && (author->name == $name || author == $name)] | order(publishedAt desc) ${postFields}`,
    { name }
  );
  return data.map(normalizePost);
}

export async function getAuthorByName(name, { draftMode = false } = {}) {
  const client = getClient({ draftMode });
  return client.fetch(
    groq`*[_type == "author" && name == $name][0]{
      name,
      role,
      "avatar": coalesce(avatarEmoji, avatar),
      "imageUrl": coalesce(photo.asset->url, image.asset->url)
    }`,
    { name }
  );
}

export async function getAuthorsWithCounts({ draftMode = false } = {}) {
  const client = getClient({ draftMode });
  return client.fetch(groq`*[_type == "author"] | order(name asc){
    name,
    role,
    "avatar": coalesce(avatarEmoji, avatar),
    "imageUrl": coalesce(photo.asset->url, image.asset->url),
    "postCount": count(*[_type == "post" && references(^._id)]),
    "latestCategory": coalesce(
      *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].category->title,
      *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].category
    ),
    "latestCategoryColor": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].category->color
  }`);
}