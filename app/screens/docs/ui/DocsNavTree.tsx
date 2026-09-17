import { useState } from "react";
import { NavLink } from "react-router";
import type { NavGroup } from "../content";

interface Props {
  groups: NavGroup[];
  // Called on any link activation — used by the mobile drawer to close itself.
  onNavigate?: () => void;
}

// The docs navigation tree (collapsible accordion groups, DFD/Docusaurus-style).
// Presentational only — no visibility/positioning classes — so it can be shared
// by the desktop sidebar (sticky rail) and the mobile drawer. NavLink resolves
// the active page itself.
export default function DocsNavTree({ groups, onNavigate }: Props) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.map((g) => g.title)));

  const toggle = (title: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  return (
    <div className="flex flex-col gap-1.5">
      {groups.map((group) => {
        // Single-page categories render as a standalone top-level link — no
        // accordion, no submenu.
        if (group.items.length === 1) {
          const item = group.items[0];
          return (
            <NavLink
              key={group.title}
              to={item.href}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? "text-neon-cyan neon-glow" : "text-text-muted/70 hover:text-neon-cyan"
                }`
              }
            >
              {group.title}
            </NavLink>
          );
        }

        const isOpen = open.has(group.title);
        return (
          <div key={group.title}>
            <button
              type="button"
              onClick={() => toggle(group.title)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted/70 hover:text-neon-cyan transition-colors duration-300"
            >
              <span>{group.title}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <ul className="overflow-hidden flex flex-col gap-1.5 border-l border-border mt-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.href}
                      end
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `-ml-px block border-l pl-4 py-0.5 transition-colors duration-300 ${
                          isActive
                            ? "border-neon-cyan text-neon-cyan neon-glow"
                            : "border-transparent text-text-muted hover:text-neon-white"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
