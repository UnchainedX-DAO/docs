import { useLoaderData } from "react-router";
import { seoMeta } from "~/core/services/seo";
import { DocsArticle, getDoc } from "~/screens/docs";
import type { Route } from "./+types/docs-slug";

export function meta({ data }: Route.MetaArgs) {
  const doc = data ? getDoc(data.slug) : undefined;
  const title = doc ? `${doc.title} — Docs — UnchainedX DAO` : "Docs — UnchainedX DAO";
  return seoMeta({ title, description: "UnchainedX DAO documentation.", path: "/docs" });
}

// The loader returns only the serializable slug — never the doc itself, whose
// `Component` is a function that JSON serialization would strip on the client
// (breaking hydration). The doc (with its MDX Component) is resolved from the
// static registry at render time, which is bundled for both server and client.
export function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug ?? "";
  if (!getDoc(slug)) throw new Response("Not Found", { status: 404 });
  return { slug };
}

export default function DocsSlug() {
  const { slug } = useLoaderData<typeof loader>();
  const doc = getDoc(slug);
  if (!doc) return null; // loader already guarded; keeps types happy
  return <DocsArticle doc={doc} />;
}
