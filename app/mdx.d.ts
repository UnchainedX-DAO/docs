// Type surface for MDX modules compiled by @mdx-js/rollup. Each .mdx file
// exports its compiled component as default and its YAML frontmatter (via
// remark-mdx-frontmatter, configured with name: "frontmatter") as `frontmatter`.
declare module "*.mdx" {
  import type { MDXComponents } from "mdx/types";
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    category: string;
    order: number;
  };

  // Injected by scripts/remark-doc-toc.mjs.
  export const tableOfContents: { id: string; label: string }[];

  const MDXComponent: ComponentType<{ components?: MDXComponents }>;
  export default MDXComponent;
}
