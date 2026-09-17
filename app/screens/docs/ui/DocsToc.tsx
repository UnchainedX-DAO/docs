import type { TocItem } from "../content";

interface Props {
  items: TocItem[];
}

// Right "On this page" table of contents (B1). Static anchors for now.
export default function DocsToc({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <aside className="hidden lg:block text-sm" aria-label="On this page">
      <div className="sticky top-28 flex flex-col gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted/60 mb-1">
          On this page
        </p>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="text-text-muted hover:text-neon-cyan transition-colors duration-300 leading-snug"
          >
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
