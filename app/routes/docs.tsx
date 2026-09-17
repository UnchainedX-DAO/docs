import { Outlet, useLoaderData } from "react-router";
import { seoMeta } from "~/core/services/seo";
import { DocsLayout, getDocGroups } from "~/screens/docs";
import type { Route } from "./+types/docs";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Docs — UnchainedX DAO",
    description:
      "Manifesto, governance, frontier research, and protocol documentation for UnchainedX DAO.",
    path: "/docs",
  });
}

export function loader() {
  return { groups: getDocGroups() };
}

export default function Docs() {
  const { groups } = useLoaderData<typeof loader>();
  return (
    <DocsLayout groups={groups}>
      <Outlet />
    </DocsLayout>
  );
}
