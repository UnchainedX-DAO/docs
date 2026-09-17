// Docs content layer. The source of truth is now MDX under app/content/*.mdx,
// compiled to real JS modules at build time by @mdx-js/rollup (import, not
// runtime eval — safe on Cloudflare Workers). This module assembles those
// modules into the same DocPage[] contract the routes, sidebar, and TOC
// already consume: getDoc / getDocGroups / getDefaultSlug / getToc are
// unchanged in shape, only their source moved.
import GithubSlugger from "github-slugger";
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
}

// Eager glob: both the compiled modules (component + frontmatter) and the raw
// source (for TOC + the dev search fallback). Keys look like
// "../../content/intro.mdx"; the slug is the basename without extension.
const MODULES = import.meta.glob<MdxModule>("../../content/*.mdx", { eager: true });
const RAW = import.meta.glob<string>("../../content/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

function slugFromPath(path: string): string {
  return (
    path
      .split("/")
      .pop()
      ?.replace(/\.mdx$/, "") ?? path
  );
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

// Extract the ## section headings and slug them exactly as rehype-slug does
// (both use github-slugger, fresh per document), so TOC anchors, rendered
// heading ids, and the search index all agree.
function extractToc(raw: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  for (const line of stripFrontmatter(raw).split("\n")) {
    const m = /^##[ \t]+(.+?)[ \t]*$/.exec(line);
    if (m) {
      const label = m[1].trim();
      items.push({ id: slugger.slug(label), label });
    }
  }
  return items;
}

// Plain-text body per doc, kept only for the in-memory search fallback used in
// dev before the Pagefind index has been generated.
function toPlainText(raw: string): string {
  return stripFrontmatter(raw)
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DOCS: DocPage[] = Object.entries(MODULES)
  .map(([path, mod]) => {
    const raw = RAW[path] ?? "";
    return {
      slug: slugFromPath(path),
      title: mod.frontmatter.title,
      category: mod.frontmatter.category,
      order: mod.frontmatter.order,
      Component: mod.default,
      toc: extractToc(raw),
    } satisfies DocPage;
  })
  .sort((a, b) => a.order - b.order);

const PLAINTEXT: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([path, raw]) => [slugFromPath(path), toPlainText(raw)]),
);

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

// In-memory search fallback over title / section headings / body text. Used
// only when the Pagefind client index is unavailable (e.g. dev before
// `bun run search-index`). Pagefind is the primary path in DocsSearch.
export function searchDocs(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const d of DOCS) {
    const body = PLAINTEXT[d.slug] ?? "";
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
    const idx = body.toLowerCase().indexOf(q);
    if (idx !== -1 && !d.title.toLowerCase().includes(q)) {
      const start = Math.max(0, idx - 30);
      results.push({
        slug: d.slug,
        title: d.title,
        category: d.category,
        snippet: `${start > 0 ? "…" : ""}${body.slice(start, idx + 60)}…`,
      });
    }
  }
  return results.slice(0, 8);
}
