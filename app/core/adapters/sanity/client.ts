// Dependency-free Sanity access via the public HTTP Query API. Works in the
// Cloudflare Worker (global fetch) with no @sanity/client dependency. When the
// project has a real Sanity dataset, set VITE_SANITY_PROJECT_ID (and optionally
// VITE_SANITY_DATASET) at build time and listProjects() switches to live data.

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || "";
const DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const API_VERSION = "2024-01-01";

export const isSanityConfigured = (): boolean => PROJECT_ID !== "";

export async function sanityFetch<T>(query: string): Promise<T> {
  // apicdn = edge-cached read endpoint (useCdn: true equivalent)
  const url = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

// Resolve a Sanity image asset _ref (e.g. "image-<id>-800x600-png") to a CDN URL.
export function imageUrlFromRef(ref: string): string | undefined {
  const parts = ref.split("-"); // ["image", id, "800x600", "png"]
  if (parts.length < 4) return undefined;
  const [, id, dimensions, ext] = parts;
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${ext}`;
}
