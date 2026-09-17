import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";

// Maps compiled-MDX output onto the site's neon design system using the
// existing tokens (no Tailwind `prose`). `##` headings become the section
// headings the TOC points at, so they carry the rehype-slug `id` (passed
// through as a prop) and `scroll-mt-28` for anchored scrolling under the
// fixed header.
export const mdxComponents: MDXComponents = {
  h2: ({ id, children }: ComponentPropsWithoutRef<"h2">) => (
    <h2 id={id} className="scroll-mt-28 mt-6 first:mt-0 text-lg font-semibold text-neon-white">
      {children}
    </h2>
  ),
  h3: ({ id, children }: ComponentPropsWithoutRef<"h3">) => (
    <h3 id={id} className="scroll-mt-28 mt-4 text-base font-semibold text-neon-white/90">
      {children}
    </h3>
  ),
  p: ({ children }: ComponentPropsWithoutRef<"p">) => (
    <p className="text-text-muted leading-relaxed">{children}</p>
  ),
  ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-5 flex flex-col gap-2 text-text-muted marker:text-neon-cyan/50">
      {children}
    </ul>
  ),
  ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-5 flex flex-col gap-2 text-text-muted marker:text-neon-cyan/50">
      {children}
    </ol>
  ),
  li: ({ children }: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      className="text-neon-cyan underline underline-offset-4 decoration-neon-cyan/30 hover:decoration-neon-cyan hover:neon-glow transition-colors duration-300"
    >
      {children}
    </a>
  ),
  strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-neon-white">{children}</strong>
  ),
  em: ({ children }: ComponentPropsWithoutRef<"em">) => (
    <em className="italic text-text-muted/90">{children}</em>
  ),
  code: ({ children }: ComponentPropsWithoutRef<"code">) => (
    <code className="font-mono text-[0.85em] text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/10 rounded px-1.5 py-0.5">
      {children}
    </code>
  ),
  blockquote: ({ children }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-2 border-neon-cyan/40 pl-4 text-text-muted/90 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border" />,
};
