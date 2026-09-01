import { seoMeta } from "~/core/services/seo";
import type { Route } from "./+types/docs";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Docs — UnchainedX DAO",
    description:
      "Manifesto, governance, frontier research, and protocol documentation for UnchainedX DAO.",
    path: "/docs",
  });
}

export default function Docs() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6 md:px-10 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold neon-glow-strong text-neon-cyan mb-6">Docs</h1>
      <p className="text-text-muted leading-relaxed">
        Coming soon — manifesto, governance, frontier research, and protocol documentation.
      </p>
    </div>
  );
}
