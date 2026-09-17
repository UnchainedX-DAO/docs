import { useLoaderData } from "react-router";
import { seoMeta } from "~/core/services/seo";
import { DocsArticle, getDoc } from "~/screens/docs";
import type { Route } from "./+types/docs-slug";

export function meta({ data }: Route.MetaArgs) {
  const title = data?.doc ? `${data.doc.title} — Docs — UnchainedX DAO` : "Docs — UnchainedX DAO";
  return seoMeta({ title, description: "UnchainedX DAO documentation.", path: "/docs" });
}

export function loader({ params }: Route.LoaderArgs) {
  const doc = getDoc(params.slug ?? "");
  if (!doc) throw new Response("Not Found", { status: 404 });
  return { doc };
}

export default function DocsSlug() {
  const { doc } = useLoaderData<typeof loader>();
  return <DocsArticle doc={doc} />;
}
