import type { ReactNode } from "react";
import { useMatches } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { getDoc, getToc, type NavGroup } from "./content";
import DocsBackground from "./scene/DocsBackground.client";
import DocsMobileNav from "./ui/DocsMobileNav";
import DocsSearch from "./ui/DocsSearch";
import DocsSidebar from "./ui/DocsSidebar";
import DocsToc from "./ui/DocsToc";

// Persistent docs shell: the 3D background + header + sidebar mount once; the
// active doc (content + TOC) is swapped via <Outlet/> on navigation, so the
// WebGPU background never re-initialises between pages.
export default function DocsLayout({
  groups,
  children,
}: {
  groups: NavGroup[];
  children: ReactNode;
}) {
  // The active doc (for the TOC) is resolved from the child route's serializable
  // `slug` (never the doc itself — its Component is a function that would be
  // stripped from loader data on the client). The sidebar resolves its own
  // active link via NavLink.
  const matches = useMatches();
  const slug = matches.reduce<string | undefined>((acc, m) => {
    const s = (m.data as { slug?: string } | undefined)?.slug;
    return s ?? acc;
  }, undefined);

  const doc = slug ? getDoc(slug) : undefined;
  const toc = doc ? getToc(doc) : [];

  return (
    <>
      <ClientOnly fallback={<div className="fixed inset-0 bg-bg" />}>
        {() => <DocsBackground />}
      </ClientOnly>

      <div className="relative z-10 min-h-screen">
        <header className="pt-28 px-6 md:px-16 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1
                className="text-3xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
                style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
              >
                Docs
              </h1>
              <p
                className="text-sm max-w-xl leading-relaxed neon-glow"
                style={{ color: "rgba(0,240,255,0.6)" }}
              >
                The manifesto behind UnchainedX DAO.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <DocsMobileNav groups={groups} />
              <DocsSearch />
            </div>
          </div>
        </header>

        <div className="px-6 md:px-16 pb-24 mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_200px] gap-10 lg:gap-14">
          <DocsSidebar groups={groups} />
          {children}
          <DocsToc items={toc} />
        </div>
      </div>
    </>
  );
}
