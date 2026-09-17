import { redirect } from "react-router";
import { getDefaultSlug } from "~/screens/docs";

// /docs → canonical first doc, so the sidebar/URL stay in sync.
export function loader() {
  return redirect(`/docs/${getDefaultSlug()}`);
}

export default function DocsIndex() {
  return null;
}
