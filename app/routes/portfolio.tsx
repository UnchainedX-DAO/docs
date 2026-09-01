import { seoMeta } from "~/core/services/seo";
import { PortfolioScreen } from "~/screens/portfolio";
import type { Route } from "./+types/portfolio";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Portfolio — UnchainedX DAO",
    description:
      "Worldwide protocols and networks researched, architected, and expanded by UnchainedX DAO.",
    path: "/portfolio",
  });
}

export default function Portfolio() {
  return <PortfolioScreen />;
}
