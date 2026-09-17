// Builds the Pagefind full-text search index from the docs MDX source, using
// the Pagefind Node API (no HTML crawl / prerender needed). One record per
// `##` section so results link to the exact anchor — the section ids are slugged
// with github-slugger, matching rehype-slug (rendered heading ids) and the TOC
// in app/screens/docs/content.ts. Output goes to public/pagefind/, which Vite
// copies into build/client/ and Cloudflare serves as static assets.
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import * as pagefind from "pagefind";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "..", "app", "content");
const outputPath = join(here, "..", "public", "pagefind");

// Lightly reduce markdown to plain, searchable text.
function toText(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/[*_>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const files = (await readdir(contentDir)).filter((f) => f.endsWith(".mdx"));
const { index } = await pagefind.createIndex();
let records = 0;

for (const file of files) {
  const slug = basename(file, ".mdx");
  const raw = await readFile(join(contentDir, file), "utf8");
  const { data, content } = matter(raw);
  const title = data.title ?? slug;
  const category = data.category ?? "";

  const slugger = new GithubSlugger();
  const sections = [];
  let current = null;
  for (const line of content.split("\n")) {
    const m = /^##[ \t]+(.+?)[ \t]*$/.exec(line);
    if (m) {
      const heading = m[1].trim();
      current = { heading, id: slugger.slug(heading), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }

  if (sections.length === 0) {
    // No sections (e.g. Governance, intentionally TBD) — index the title only
    // so the page is still findable by name.
    await index.addCustomRecord({
      url: `/docs/${slug}`,
      content: title,
      language: "en",
      meta: { title, category },
    });
    records += 1;
    continue;
  }

  for (const s of sections) {
    const text = toText(s.body.join("\n"));
    await index.addCustomRecord({
      url: `/docs/${slug}#${s.id}`,
      content: text ? `${s.heading}. ${text}` : s.heading,
      language: "en",
      meta: { title, category, heading: s.heading },
    });
    records += 1;
  }
}

await index.writeFiles({ outputPath });
await pagefind.close();
console.log(`Pagefind index written to ${outputPath} (${records} records from ${files.length} pages)`);
