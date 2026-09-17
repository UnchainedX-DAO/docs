import { seoMeta } from "~/core/services/seo";
import { ContactScreen } from "~/screens/contact";
import type { Route } from "./+types/contact";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Contact — UnchainedX DAO",
    description: "Get in touch with UnchainedX DAO.",
    path: "/contact",
  });
}

export default function Contact() {
  return <ContactScreen />;
}
