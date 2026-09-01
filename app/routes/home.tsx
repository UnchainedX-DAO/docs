import { seoMeta } from "~/core/services/seo";
import { HomeScreen } from "~/screens/home";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "UnchainedX DAO",
    description:
      "A DAO that experimentally researches, architects, and expands worldwide protocols and networks.",
    path: "/",
  });
}

export default function Home() {
  return <HomeScreen />;
}
