import type { NavGroup } from "../content";
import DocsNavTree from "./DocsNavTree";

interface Props {
  groups: NavGroup[];
}

// Desktop left navigation rail (B1). Sticky, hidden on mobile — the mobile
// drawer (DocsMobileNav) renders the same tree via DocsNavTree.
export default function DocsSidebar({ groups }: Props) {
  return (
    <nav className="hidden md:block text-sm" aria-label="Docs navigation">
      <div className="sticky top-28">
        <DocsNavTree groups={groups} />
      </div>
    </nav>
  );
}
