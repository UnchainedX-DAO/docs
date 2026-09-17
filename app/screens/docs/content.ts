// Docs content layer. Static registry for now — deliberately shaped so a
// Velite/MDX loader can later produce the same DocPage[] with zero changes to
// the routes, sidebar, or TOC. Swap the source, keep the contract.
//
// Copy here is PROVISIONAL. It states the things a DAO should declare from the
// start (what we are, what "DAO" means to us, roles, how contribution works);
// things better decided later (tokenomics, exact joining mechanics, treasury)
// are deliberately left out until they're real.

export interface DocSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface DocPage {
  slug: string; // → /docs/<slug>
  title: string; // sidebar label + page heading
  category: string;
  order: number;
  sections: DocSection[];
}

export interface NavItem {
  label: string;
  href: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}
export interface TocItem {
  id: string;
  label: string;
}

// Sidebar category order.
const CATEGORY_ORDER = ["Introduction", "Organization", "Governance", "How to join"];

const DOCS: DocPage[] = [
  // ---------------- Introduction ----------------
  {
    slug: "intro",
    title: "Overview",
    category: "Introduction",
    order: 0,
    sections: [
      {
        id: "what-we-are",
        heading: "What we are",
        paragraphs: [
          "UnchainedX DAO experimentally researches, architects, and expands worldwide protocols and networks.",
          "Protocols and products are the means, not the end. What we optimize for is the frontier itself — and an organization that can keep reaching it.",
        ],
      },
      {
        id: "thesis",
        heading: "Thesis",
        paragraphs: [
          "No single point of failure. Permissionless, verifiable, self-sovereign.",
          "Our moat is a combination lock: we undertake extraordinary complexity fundamentally and structurally, so what we build is hard to imitate — not merely hard to build.",
        ],
      },
    ],
  },
  {
    slug: "what-we-mean-by-dao",
    title: "What we mean by DAO",
    category: "Introduction",
    order: 1,
    sections: [
      {
        id: "true-dao",
        heading: "A true DAO",
        paragraphs: [
          "We follow the original meaning: automation at the center, humans at the edges.",
          "Most organizations that call themselves DAOs are service communities with an owner behind them taking the profit — community-led growth, not a DAO. We are not that.",
        ],
      },
      {
        id: "principles",
        heading: "Principles",
        paragraphs: [
          "On-chain identity, data, and activity wherever it should be; chain-agnostic where it shouldn't.",
          "Permissionless and transparent about the things that should be. Meritocracy, but fair — no illogical discrimination. Autonomous yet collaborative, and comfortable working asynchronously.",
        ],
      },
    ],
  },

  // ---------------- Organization ----------------
  {
    slug: "member-roles",
    title: "Member Roles",
    category: "Organization",
    order: 0,
    sections: [
      {
        id: "roles",
        heading: "Roles",
        paragraphs: [
          "There are clear roles. Members may hold more than one, within the limits of their skill, time, and motivation — subDAOs are not one-person projects, and communicating well matters. As we grow we might have more roles.",
        ],
      },
      {
        id: "governor",
        heading: "Governor",
        paragraphs: [
          "Responsible for the DAO's overall direction and decisions.",
        ],
      },
      {
        id: "researcher",
        heading: "Researcher",
        paragraphs: [
          "The frontier-research role — and the DAO's lead role. We are research-first: research comes before it is architected and expanded.",
        ],
      },
      {
        id: "builder-roles",
        heading: "Hacker · Hipster · Hustler",
        paragraphs: [
          "subDAO roles. The Hacker builds the protocol, the Hipster designs its interface and experience, the Hustler drives its business development.",
        ],
      },
    ],
  },
  {
    slug: "subdaos",
    title: "subDAOs",
    category: "Organization",
    order: 1,
    sections: [
      {
        id: "model",
        heading: "The model",
        paragraphs: [
          "subDAOs bootstrap and operate the DAO's protocols. Each is small — one to five contributors — because a few professionals are often enough.",
          "The DAO is meant to be sustainable; subDAOs are created and retired as the work demands.",
        ],
      },
    ],
  },
  {
    slug: "scope",
    title: "Scope",
    category: "Organization",
    order: 2,
    sections: [
      {
        id: "domain",
        heading: "Domain",
        paragraphs: [
          "The DAO's domain is worldwide protocols and networks — and the components that can become part of them, which are solving complex problems.",
          "Work that is local or better left to other actors falls outside our scope.",
        ],
      },
    ],
  },

  // ---------------- Governance ----------------
  // Intentionally a single TBD entry (no sub-sections): the real governance
  // mechanics — proposals, treasury, voting, a proper Moloch-style ragequit —
  // depend on decisions deliberately deferred, so we only reserve the page.
  {
    slug: "governance",
    title: "Governance",
    category: "Governance",
    order: 0,
    sections: [],
  },

  // ---------------- How to join ----------------
  {
    slug: "why-join",
    title: "Why join",
    category: "How to join",
    order: 0,
    sections: [
      {
        id: "who-fits",
        heading: "Who fits",
        paragraphs: [
          "For builders who would rather work with cooperative, professional peers than manage what they don't care about — and who want contribution evaluated fairly.",
          "If the DAOs you have seen felt like rehashed agencies or marketing communities, this is the opposite. We prefer long-time contributors and big, meaningful impact.",
        ],
      },
    ],
  },
  {
    slug: "joining",
    title: "Joining process",
    category: "How to join",
    order: 1,
    sections: [
      {
        id: "how-it-works",
        heading: "How it works",
        paragraphs: [
          "Membership is judged, not open — think of the DAO as many startups under one roof. You apply, the Governors review, and members receive an on-chain membership credential before onboarding.",
          "The exact mechanics — application, review, and credential issuance — are being finalized.",
        ],
      },
    ],
  },
];

export function getDoc(slug: string): DocPage | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function getDocGroups(): NavGroup[] {
  return CATEGORY_ORDER.map((cat) => ({
    title: cat,
    items: DOCS.filter((d) => d.category === cat)
      .sort((a, b) => a.order - b.order)
      .map((d) => ({ label: d.title, href: `/docs/${d.slug}` })),
  })).filter((g) => g.items.length > 0);
}

export function getDefaultSlug(): string {
  const first = getDocGroups()[0]?.items[0]?.href;
  return first ? first.replace("/docs/", "") : "intro";
}

export function getToc(doc: DocPage): TocItem[] {
  return doc.sections.map((s) => ({ id: s.id, label: s.heading }));
}

export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  sectionId?: string;
  heading?: string;
  snippet: string;
}

// Client-side full-text search over the registry. Future-proof: when content
// moves to Velite/MDX, this can index that same DocPage[] unchanged.
export function searchDocs(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const d of DOCS) {
    if (d.title.toLowerCase().includes(q)) {
      results.push({ slug: d.slug, title: d.title, category: d.category, snippet: d.category });
    }
    for (const s of d.sections) {
      const inHeading = s.heading.toLowerCase().includes(q);
      const para = s.paragraphs.find((p) => p.toLowerCase().includes(q));
      if (inHeading || para) {
        results.push({
          slug: d.slug,
          title: d.title,
          category: d.category,
          sectionId: s.id,
          heading: s.heading,
          snippet: para ?? s.heading,
        });
      }
    }
  }
  return results.slice(0, 8);
}
