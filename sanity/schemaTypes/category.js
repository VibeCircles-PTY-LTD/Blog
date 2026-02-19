import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "color",
      title: "Accent Color (hex)",
      type: "string",
      description: "Hex color used for badges and accents, e.g. #FF6B00",
      validation: (Rule) =>
        Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          name: "hex color",
          invert: false,
        }),
      initialValue: "#FF6B00",
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],

  preview: {
    select: { title: "title", subtitle: "color" },
  },
});