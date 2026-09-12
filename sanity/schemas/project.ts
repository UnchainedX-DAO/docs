import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "In Dev", value: "In Dev" },
          { title: "Live", value: "Live" },
          { title: "Archived", value: "Archived" },
        ],
        layout: "radio",
      },
      initialValue: "In Dev",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        {
          type: "string",
          options: {
            list: [
              { title: "AI", value: "AI" },
              { title: "Blockchain", value: "Blockchain" },
              { title: "Creative", value: "Creative" },
              { title: "Infrastructure", value: "Infrastructure" },
              { title: "Design", value: "Design" },
              { title: "Security", value: "Security" },
              { title: "Art", value: "Art" },
            ],
          },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
    }),
    defineField({
      name: "topics",
      title: "Topics",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "status", media: "thumbnail" },
  },
});
