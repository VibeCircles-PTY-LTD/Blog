import { defineArrayMember, defineType } from "sanity";

export const blockContent = defineType({
  title: "Block Content",
  name: "blockContent",
  type: "array",
  of: [
    defineArrayMember({
      title: "Block",
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
          { title: "Underline", value: "underline" },
        ],
        annotations: [
          {
            title: "URL",
            name: "link",
            type: "object",
            fields: [
              {
                title: "URL",
                name: "href",
                type: "url",
                validation: (Rule) => Rule.uri({ scheme: ["http", "https", "mailto"] }),
              },
              {
                title: "Open in new tab",
                name: "blank",
                type: "boolean",
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),

    defineArrayMember({
      type: "image",
      title: "Image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Important for accessibility and SEO.",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "caption",
          type: "string",
          title: "Caption",
        },
      ],
    }),

    defineArrayMember({
      type: "object",
      name: "callout",
      title: "Callout",
      fields: [
        {
          name: "text",
          type: "text",
          title: "Text",
        },
        {
          name: "type",
          type: "string",
          title: "Type",
          options: {
            list: ["info", "warning", "tip", "stat"],
            layout: "radio",
          },
          initialValue: "tip",
        },
      ],
      preview: {
        select: { title: "text", subtitle: "type" },
      },
    }),
  ],
});