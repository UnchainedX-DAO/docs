import { useRef, useState } from "react";
import { Link } from "react-router";
import { searchDocs } from "../content";

// Working client-side search over the docs registry. Results link to the page
// (and section anchor). Pagefind can replace this later for full MDX text.
export default function DocsSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = query.trim() ? searchDocs(query) : [];
  const open = focused && query.trim().length > 0;

  const close = () => {
    setQuery("");
    setFocused(false);
  };

  return (
    <div className="relative shrink-0 w-40 md:w-56">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          // delay so a result click registers before the dropdown closes
          blurTimer.current = setTimeout(() => setFocused(false), 150);
        }}
        placeholder="Search docs…"
        className="w-full text-xs font-mono px-4 py-2 rounded-full outline-none transition-all duration-300"
        style={{
          backgroundColor: "rgba(0,240,255,0.05)",
          color: "#E0E0FF",
          border: "1px solid rgba(0,240,255,0.1)",
          caretColor: "#00F0FF",
        }}
        aria-label="Search docs"
      />

      {open && (
        <div
          className="absolute z-30 mt-2 w-72 right-0 rounded-lg overflow-hidden border border-border"
          style={{ background: "rgba(8,4,15,0.92)", backdropFilter: "blur(10px)" }}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs font-mono text-text-muted">No results</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={`${r.slug}-${r.sectionId ?? "page"}`}>
                  <Link
                    to={`/docs/${r.slug}${r.sectionId ? `#${r.sectionId}` : ""}`}
                    onClick={close}
                    className="block px-4 py-2.5 hover:bg-neon-cyan/10 transition-colors duration-150"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-neon-white">{r.heading ?? r.title}</span>
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-neon-cyan/60 shrink-0">
                        {r.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{r.snippet}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
