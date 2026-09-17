import type { DocPage } from "../content";

// Renders one doc page's content (the middle column / route Outlet).
export default function DocsArticle({ doc }: { doc: DocPage }) {
  return (
    <article className="min-w-0 max-w-2xl flex flex-col gap-10">
      <h2 className="text-2xl md:text-3xl font-bold text-neon-cyan neon-glow-strong">{doc.title}</h2>
      {doc.sections.length === 0 && (
        <p className="text-text-muted/70 italic">To be defined.</p>
      )}
      {doc.sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-neon-white">{s.heading}</h3>
          {s.paragraphs.map((p) => (
            <p key={p} className="text-text-muted leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
