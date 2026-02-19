import { defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export const post = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  icon: DocumentTextIcon,

  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "SEO & Meta" },
    { name: "settings", title: "Settings" },
  ],

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().max(120),
    }),

    defineField({
      name: "subtitle",
      title: "Subtitle / Deck",
      type: "text",
      rows: 2,
      group: "content",
      description: "Short teaser shown on cards and below the title in the article.",
      validation: (Rule) => Rule.required().max(260),
    }),

    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      group: "content",
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "meta",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "meta",
    }),

    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      group: "meta",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 2,
      group: "meta",
      description: "Falls back to subtitle if empty.",
      validation: (Rule) => Rule.max(160),
    }),

    defineField({
      name: "featured",
      title: "Featured Post",
      type: "boolean",
      group: "settings",
      description: "Only one post should be featured at a time.",
      initialValue: false,
    }),

    defineField({
      name: "emoji",
      title: "Cover Emoji",
      type: "string",
      group: "settings",
      description: "Single emoji used as visual identity for the post",
      validation: (Rule) => Rule.required().max(4),
    }),

    defineField({
      name: "thumbGradStart",
      title: "Thumbnail Gradient - Start Color",
      type: "string",
      group: "settings",
      description: "Hex color for the card thumbnail gradient start (e.g. #FF6B00)",
      initialValue: "#FF6B00",
    }),

    defineField({
      name: "thumbGradEnd",
      title: "Thumbnail Gradient - End Color",
      type: "string",
      group: "settings",
      description: "Hex color for the card thumbnail gradient end (e.g. #FF2D78)",
      initialValue: "#FF2D78",
    }),
  ],

  orderings: [
    {
      title: "Published Date, Newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Published Date, Oldest",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
    },
  ],

  preview: {
    select: {
      title: "title",
      author: "author.name",
      category: "category.title",
      publishedAt: "publishedAt",
      emoji: "emoji",
      featured: "featured",
    },
    prepare({ title, author, category, publishedAt, emoji, featured }) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Unpublished";
      return {
        title: `${featured ? "* " : ""}${emoji ?? ""} ${title}`,
        subtitle: `${author} - ${category} - ${date}`,
      };
    },
  },
});