import { imageUrlFromRef, isSanityConfigured, sanityFetch } from "./client";
import { PROJECTS_QUERY } from "./queries";
import type { Project } from "./types";

// Static fallback, used until a Sanity dataset is wired up (env unset).
// NOTE: categories/topics/status here are placeholders — replace with real
// values, or let Sanity supply them once configured.
const FALLBACK: Project[] = [
  {
    _id: "zk-vault",
    title: "zk-vault",
    slug: { current: "zk-vault" },
    description:
      "Post-quantum hybrid encryption over a custom BFT chain with BTC/ETH anchoring, social recovery, and an endowment economy. Trust mathematics, not companies.",
    // GenerativeThumb only themes known categories (AI / Blockchain / Security /
    // Infrastructure / Creative / Design / Art); "Security" → the encryption motif.
    status: "In Dev",
    categories: ["Security", "Blockchain"],
    topics: ["post-quantum", "bft-chain", "btc-anchor", "social-recovery", "endowment"],
    url: "https://github.com/UnchainedX-DAO/zk-vault",
    order: 0,
  },
];

// Raw shape as returned by Sanity (thumbnail is an asset reference object).
interface RawProject extends Omit<Project, "thumbnail"> {
  thumbnail?: { asset?: { _ref?: string } };
}

export async function listProjects(): Promise<Project[]> {
  if (!isSanityConfigured()) {
    return [...FALLBACK].sort((a, b) => a.order - b.order);
  }
  const raw = await sanityFetch<RawProject[]>(PROJECTS_QUERY);
  return raw.map((p) => {
    const ref = p.thumbnail?.asset?._ref;
    return { ...p, thumbnail: ref ? imageUrlFromRef(ref) : undefined };
  });
}
