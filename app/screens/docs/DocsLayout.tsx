import type { ReactNode } from "react";
import { useMatches } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import { type DocPage, getToc, type NavGroup } from "./content";
import DocsBackground from "./scene/DocsBackground.client";
import DocsSearch from "./ui/DocsSearch";
import DocsSidebar from "./ui/DocsSidebar";
import DocsToc from "./ui/DocsToc";

// Persistent docs shell: the 3D background + header + sidebar mount once; the
// active doc (content + TOC) is swapped via <Outlet/> on navigation, so the
// WebGPU background never re-initialises between pages.
export default function DocsLayout({ groups, children }: { groups: NavGroup[]; children: ReactNode }) {
  // The active doc (for the TOC) comes from the matched child route's loader
  // data. The sidebar resolves its own active link via NavLink.
  const matches = useMatches();
  const doc = matches.reduce<DocPage | undefined>((acc, m) => {
    const d = (m.data as { doc?: DocPage } | undefined)?.doc;
    return d ?? acc;
  }, undefined);

  const toc = doc ? getToc(doc) : [];

  return (
    <>
      <ClientOnly fallback={<div className="fixed inset-0 bg-bg" />}>
        {() => <DocsBackground />}
      </ClientOnly>

      <div className="relative z-10 min-h-screen">
        <header className="pt-28 px-6 md:px-16 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
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
            <DocsSearch />
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
