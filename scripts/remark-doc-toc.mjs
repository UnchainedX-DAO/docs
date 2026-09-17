import { valueToEstree } from "estree-util-value-to-estree";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

// Remark plugin: collects the `##` (depth-2) headings of an MDX document and
// injects `export const tableOfContents = [{ id, label }]`. The ids are slugged
// with github-slugger, exactly as rehype-slug does for the rendered heading
// ids — so TOC anchors line up with the elements they point at. This exports
// the TOC as a real module binding, avoiding any `?raw` re-read of the source
// (which the MDX plugin intercepts in dev).
export function remarkDocToc() {
  return (tree) => {
    const slugger = new GithubSlugger();
    const toc = [];
    visit(tree, "heading", (node) => {
      if (node.depth === 2) {
        const label = toString(node);
        toc.push({ id: slugger.slug(label), label });
      }
    });

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "tableOfContents" },
                    init: valueToEstree(toc),
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}
