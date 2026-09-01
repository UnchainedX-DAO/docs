const SITE_URL = "https://unchainedxdao.io";
const SITE_NAME = "UnchainedX DAO";
const DEFAULT_OGP = `${SITE_URL}/ogp.png`;

export function seoMeta({
  title,
  description,
  path = "",
  image = DEFAULT_OGP,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}) {
  const url = `${SITE_URL}${path}`;
  return [
    { title },
    { name: "description", content: description },
    // OGP
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    // Canonical
    { tagName: "link" as const, rel: "canonical", href: url },
  ];
}
