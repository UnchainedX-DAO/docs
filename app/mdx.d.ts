// Type surface for MDX modules compiled by @mdx-js/rollup. Each .mdx file
// exports its compiled component as default and its YAML frontmatter (via
// remark-mdx-frontmatter, configured with name: "frontmatter") as `frontmatter`.
declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    category: string;
    order: number;
  };

  const MDXComponent: ComponentType<{
    components?: Record<string, ComponentType<Record<string, unknown>> | keyof JSX.IntrinsicElements>;
  }>;
  export default MDXComponent;
}
