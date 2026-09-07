import Footer from "~/components/dom/layout/Footer";

const ZK_VAULT = {
  name: "zk-vault",
  tagline: "Post-quantum · self-sovereign data",
  description:
    "Post-quantum hybrid encryption over a custom BFT chain with BTC/ETH anchoring, social recovery, and an endowment economy. Trust mathematics, not companies.",
  status: "Flagship",
  href: "https://github.com/UnchainedX-DAO/zk-vault",
};

export default function PortfolioScreen() {
  return (
    <>
      <div className="min-h-screen pt-28 pb-24 px-6 md:px-10 max-w-4xl mx-auto">
        <header className="mb-14">
          <h1 className="text-4xl md:text-6xl font-bold neon-glow-strong text-neon-cyan">
            Portfolio
          </h1>
          <p className="mt-4 max-w-2xl text-text-muted leading-relaxed">
            Worldwide protocols and networks — researched, architected, and expanded by UnchainedX
            DAO.
          </p>
        </header>

        <a
          href={ZK_VAULT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block rounded-lg border border-border p-8 md:p-10 transition-all duration-500 hover:border-neon-cyan/40"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-neon-white neon-glow group-hover:text-neon-cyan transition-colors duration-500">
              {ZK_VAULT.name}
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
              {ZK_VAULT.status}
            </span>
          </div>
          <p className="mt-3 text-sm md:text-base font-mono uppercase tracking-wider text-neon-cyan/70">
            {ZK_VAULT.tagline}
          </p>
          <p className="mt-6 max-w-2xl text-sm md:text-base text-text-muted leading-relaxed">
            {ZK_VAULT.description}
          </p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-neon-white group-hover:text-neon-cyan transition-colors duration-500">
            View on GitHub
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </span>
        </a>
      </div>

      <Footer />
    </>
  );
}
