import Footer from "~/components/dom/layout/Footer";

interface Protocol {
  name: string;
  tagline: string;
  description: string;
  status: string;
}

// Static for now. Which of these are DAO-side (worldwide protocol/network) vs
// company-side is the deferred Phase 0 classification.
const PROTOCOLS: Protocol[] = [
  {
    name: "zk-vault",
    tagline: "Post-quantum · self-sovereign data",
    description:
      "Post-quantum hybrid encryption over a custom BFT chain with BTC/ETH anchoring, social recovery, and an endowment economy. Trust mathematics, not companies.",
    status: "Flagship",
  },
  {
    name: "meta-agent",
    tagline: "Runtime governance for AI agents",
    description:
      "A unified layer above every AI coding tool — persistent memory, context compilation, and multi-agent consensus. Next-generation organizational infrastructure.",
    status: "Active",
  },
  {
    name: "shinobi",
    tagline: "White-hat security ecosystem",
    description:
      "On-chain proof-of-exploit bounties, an audit DAO, SBT/DID credentials, and a CTF academy — a verifiable security commons.",
    status: "Research",
  },
  {
    name: "double",
    tagline: "Cross-chain interoperability",
    description:
      "Cross-chain messaging and interchain query primitives on Hyperlane — connective tissue for worldwide protocols.",
    status: "Early",
  },
];

export default function PortfolioScreen() {
  return (
    <>
      <div className="min-h-screen pt-28 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
        <header className="mb-14">
          <h1 className="text-4xl md:text-6xl font-bold neon-glow-strong text-neon-cyan">
            Portfolio
          </h1>
          <p className="mt-4 max-w-2xl text-text-muted leading-relaxed">
            Worldwide protocols and networks — researched, architected, and expanded by UnchainedX
            DAO.
          </p>
        </header>

        <ul className="grid gap-6 md:grid-cols-2">
          {PROTOCOLS.map((p) => (
            <li
              key={p.name}
              className="group relative rounded-lg border border-border p-6 transition-all duration-500 hover:border-neon-cyan/40"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl font-bold text-neon-white neon-glow group-hover:text-neon-cyan transition-colors duration-500">
                  {p.name}
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-mono uppercase tracking-wider text-neon-cyan/70">
                {p.tagline}
              </p>
              <p className="mt-4 text-sm text-text-muted leading-relaxed">{p.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <Footer />
    </>
  );
}
