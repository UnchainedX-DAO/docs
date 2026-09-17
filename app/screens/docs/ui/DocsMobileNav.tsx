import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import type { NavGroup } from "../content";
import DocsNavTree from "./DocsNavTree";

interface Props {
  groups: NavGroup[];
}

// Mobile-only docs navigation: a hamburger button (md:hidden) that opens a
// left slide-in drawer containing the same nav tree as the desktop sidebar.
// Closes on backdrop tap, Esc, and any navigation (route change).
export default function DocsMobileNav({ groups }: Props) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const close = () => setOpen(false);

  // Close on navigation (covers nav-tree links, TOC anchors, and back/forward).
  // biome-ignore lint/correctness/useExhaustiveDependencies: react to route changes only
  useEffect(() => {
    setOpen(false);
  }, [location.key, location.hash]);

  // Lock body scroll while the drawer is open; Esc closes it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open docs navigation"
        aria-expanded={open}
        className="md:hidden shrink-0 flex items-center gap-2 rounded-full border border-neon-cyan/15 bg-neon-cyan/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted/80 hover:text-neon-cyan transition-colors duration-300"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        Menu
      </button>

      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close docs navigation"
          onClick={close}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <nav
          aria-label="Docs navigation"
          className={`absolute left-0 top-0 h-full w-72 max-w-[80vw] overflow-y-auto border-r border-border p-6 pt-24 text-sm transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "rgba(8,4,15,0.95)", backdropFilter: "blur(10px)" }}
        >
          <DocsNavTree groups={groups} onNavigate={close} />
        </nav>
      </div>
    </>
  );
}
