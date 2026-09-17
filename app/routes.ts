import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("portfolio", "routes/portfolio.tsx"),
  route("docs", "routes/docs.tsx", [
    index("routes/docs-index.tsx"),
    route(":slug", "routes/docs-slug.tsx"),
  ]),
  route("contact", "routes/contact.tsx"),
] satisfies RouteConfig;
