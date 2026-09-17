import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { searchDocs } from "../content";

// Docs search. Primary path is Pagefind (full-text, lazy-loaded from the static
// /pagefind bundle produced by scripts/build-search-index.mjs). If that bundle
// is unavailable (e.g. dev before `bun run search-index`), it silently falls
// back to the in-memory searchDocs over the registry. Both are normalised to
// one Hit shape so the dropdown renders uniformly.
interface Hit {
  key: string;
  href: string;
  primary: string; // section heading (or page title)
  tag: string; // page title
  snippet: string;
}

interface PagefindResult {
  data: () => Promise<{
    url: string;
    plain_excerpt?: string;
    meta?: { title?: string; category?: string; heading?: string };
  }>;
}
interface PagefindModule {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
  options?: (opts: Record<string, unknown>) => Promise<void>;
}

function fallbackHits(query: string): Hit[] {
  return searchDocs(query).map((r) => ({
    key: `${r.slug}-${r.sectionId ?? "page"}`,
    href: `/docs/${r.slug}${r.sectionId ? `#${r.sectionId}` : ""}`,
    primary: r.heading ?? r.title,
    tag: r.title,
    snippet: r.snippet,
  }));
}

export default function DocsSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lazy Pagefind loader, deduped. Resolves to null if the bundle is absent.
  const pagefindRef = useRef<Promise<PagefindModule | null> | null>(null);

  const loadPagefind = useCallback((): Promise<PagefindModule | null> => {
    if (!pagefindRef.current) {
      // Pagefind's bundle lives in /public (served at /pagefind, not part of the
      // Vite graph). A runtime-computed absolute URL keeps Vite from statically
      // resolving it — otherwise dev refuses to import a /public file — so it
      // stays a genuine runtime import that both dev and Cloudflare serve.
      const src = `${window.location.origin}/pagefind/pagefind.js`;
      pagefindRef.current = import(/* @vite-ignore */ src)
        .then(async (mod: PagefindModule) => {
          await mod.options?.({ excerptLength: 20 });
          return mod;
        })
        .catch(() => null);
    }
    return pagefindRef.current;
  }, []);

  // Debounced search on query change, cancelling stale runs.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const pf = await loadPagefind();
      if (cancelled) return;
      if (!pf) {
        setHits(fallbackHits(q));
        return;
      }
      try {
        const search = await pf.search(q);
        if (cancelled) return;
        const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
        if (cancelled) return;
        setHits(
          data.map((d, i) => ({
            key: `${d.url}-${i}`,
            href: d.url,
            primary: d.meta?.heading ?? d.meta?.title ?? "Result",
            tag: d.meta?.title ?? "",
            snippet: d.plain_excerpt ?? "",
          })),
        );
      } catch {
        if (!cancelled) setHits(fallbackHits(q));
      }
    }, 130);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, loadPagefind]);

  const open = focused && query.trim().length > 0;

  const close = () => {
    setQuery("");
    setFocused(false);
    setHits([]);
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
          loadPagefind(); // warm the index on focus
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
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-xs font-mono text-text-muted">No results</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((r) => (
                <li key={r.key}>
                  <Link
                    to={r.href}
                    onClick={close}
                    className="block px-4 py-2.5 hover:bg-neon-cyan/10 transition-colors duration-150"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-neon-white">{r.primary}</span>
                      {r.tag && (
                        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-neon-cyan/60 shrink-0">
                          {r.tag}
                        </span>
                      )}
                    </div>
                    {r.snippet && (
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{r.snippet}</p>
                    )}
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
