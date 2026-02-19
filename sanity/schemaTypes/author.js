import { defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: UserIcon,

  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "role",
      title: "Role / Title",
      type: "string",
      description: "e.g. CEO & Co-Founder",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "avatarEmoji",
      title: "Avatar Emoji",
      type: "string",
      description: "Single emoji used as the avatar on cards",
      validation: (Rule) => Rule.required().max(4),
    }),

    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      description: "Optional. Used when a real photo is available.",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", title: "Alt Text" }),
      ],
    }),

    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
      rows: 3,
      description: "Short bio shown on author page and article byline.",
    }),

    defineField({
      name: "twitter",
      title: "Twitter / X handle",
      type: "string",
      description: "Without @",
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "photo",
    },
    prepare({ title, subtitle, media }) {
      return { title, subtitle, media };
    },
  },
});