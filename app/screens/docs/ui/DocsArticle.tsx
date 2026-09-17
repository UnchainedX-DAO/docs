import type { DocPage } from "../content";
import { mdxComponents } from "./mdxComponents";

// Renders one doc page (the middle column / route Outlet). The body is a
// compiled MDX component, styled via mdxComponents. Pages with no section
// headings (e.g. Governance, intentionally TBD) show a placeholder.
export default function DocsArticle({ doc }: { doc: DocPage }) {
  const { Component } = doc;
  const empty = doc.toc.length === 0;
  return (
    <article className="min-w-0 max-w-2xl flex flex-col gap-4">
      <h2 className="mb-2 text-2xl md:text-3xl font-bold text-neon-cyan neon-glow-strong">
        {doc.title}
      </h2>
      {empty ? (
        <p className="text-text-muted/70 italic">To be defined.</p>
      ) : (
        <Component components={mdxComponents} />
      )}
    </article>
  );
}
