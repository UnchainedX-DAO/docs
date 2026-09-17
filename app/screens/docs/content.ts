// Docs content layer. The source of truth is now MDX under app/content/*.mdx,
// compiled to real JS modules at build time by @mdx-js/rollup (import, not
// runtime eval — safe on Cloudflare Workers). This module assembles those
// modules into the same DocPage[] contract the routes, sidebar, and TOC
// already consume: getDoc / getDocGroups / getDefaultSlug / getToc are
// unchanged in shape, only their source moved.
import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";

// A compiled MDX page component. It accepts a `components` map so we can style
// its output with our neon element set (see ui/mdxComponents).
export type DocComponent = ComponentType<{ components?: MDXComponents }>;

export interface DocPage {
  slug: string; // → /docs/<slug>
  title: string; // sidebar label + page heading
  category: string;
  order: number;
  Component: DocComponent; // compiled MDX body
  toc: TocItem[]; // section headings (## in the MDX), for the right rail
}

export interface NavItem {
  label: string;
  href: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}
export interface TocItem {
  id: string;
  label: string;
}

// Sidebar category order.
const CATEGORY_ORDER = ["Introduction", "Organization", "Governance", "How to join"];

interface MdxModule {
  default: DocComponent;
  frontmatter: { title: string; category: string; order: number };
  // Injected by scripts/remark-doc-toc.mjs — the ## headings as { id, label }.
  tableOfContents?: TocItem[];
}

// Eager glob of the compiled MDX modules (component + frontmatter + TOC export).
// Keys look like "../../content/intro.mdx"; the slug is the basename.
const MODULES = import.meta.glob<MdxModule>("../../content/*.mdx", { eager: true });

function slugFromPath(path: string): string {
  return (
    path
      .split("/")
      .pop()
      ?.replace(/\.mdx$/, "") ?? path
  );
}

const DOCS: DocPage[] = Object.entries(MODULES)
  .map(([path, mod]) => {
    return {
      slug: slugFromPath(path),
      title: mod.frontmatter.title,
      category: mod.frontmatter.category,
      order: mod.frontmatter.order,
      Component: mod.default,
      toc: mod.tableOfContents ?? [],
    } satisfies DocPage;
  })
  .sort((a, b) => a.order - b.order);

export function getDoc(slug: string): DocPage | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function getDocGroups(): NavGroup[] {
  return CATEGORY_ORDER.map((cat) => ({
    title: cat,
    items: DOCS.filter((d) => d.category === cat)
      .sort((a, b) => a.order - b.order)
      .map((d) => ({ label: d.title, href: `/docs/${d.slug}` })),
  })).filter((g) => g.items.length > 0);
}

export function getDefaultSlug(): string {
  const first = getDocGroups()[0]?.items[0]?.href;
  return first ? first.replace("/docs/", "") : "intro";
}

export function getToc(doc: DocPage): TocItem[] {
  return doc.toc;
}

export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  sectionId?: string;
  heading?: string;
  snippet: string;
}

// In-memory search fallback over page titles and section headings. Used only
// when the Pagefind client index is unavailable (e.g. dev before
// `bun run search-index`). Pagefind provides full-text search as the primary
// path in DocsSearch.
export function searchDocs(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const d of DOCS) {
    if (d.title.toLowerCase().includes(q)) {
      results.push({ slug: d.slug, title: d.title, category: d.category, snippet: d.category });
    }
    for (const item of d.toc) {
      if (item.label.toLowerCase().includes(q)) {
        results.push({
          slug: d.slug,
          title: d.title,
          category: d.category,
          sectionId: item.id,
          heading: item.label,
          snippet: item.label,
        });
      }
    }
  }
  return results.slice(0, 8);
}
