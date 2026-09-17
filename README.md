# UnchainedX DAO

> A DAO that experimentally researches, architects, and expands worldwide protocols and networks.

Website & docs for **UnchainedX DAO** — https://unchainedxdao.io

## About

UnchainedX DAO experimentally researches, architects, and expands worldwide protocols and networks. A true DAO in the original sense — automation at the center, humans at the edges. Read the [manifesto](https://unchainedxdao.io/docs).

## Projects

See our [Portfolio](https://unchainedxdao.io/portfolio) for current work.

## Architecture

The frontend follows a **modular monolith** pattern with a **minimal hexagonal** boundary around external technology — the project's complexity lives in 3D rendering and content, not domain logic. Docs are authored in MDX and compiled to modules at build time; full-text search is a Pagefind index built from that same content.

```
app/
  routes/        Route entries only (loader / meta / <XxxScreen />)
  screens/       One module per route, each with index.ts public API
                   home/  portfolio/  docs/  contact/  notfound/
                 Per-screen scene/ ui/ are implementation details.
  content/       Docs pages authored in MDX (source of truth for /docs)
  components/
    dom/         Cross-screen React UI (layout, overlays)
    three/       Cross-screen 3D primitives
                   canvas/ environment/ effects/ post/ materials/ tsl/
  core/
    adapters/    External technology wrappers (sanity)
    services/    App-level facilities (seo)
  hooks/         Shared React hooks
  state/         Global mutable runtime state (mouseState, flowmap)
scripts/         Build-time tooling (pagefind search index, mdx toc)
workers/app.ts   Cloudflare Worker entry
```

### Rules

- **Modules expose only `index.ts`.** Cross-screen imports are forbidden; share via `components/`, `hooks/`, `core/`, or `state/`.
- **Routes stay thin.** UI logic lives in `screens/<name>/XxxScreen.tsx` (or the docs shell).
- **External I/O goes through `core/adapters/`.** Routes never touch `@sanity/client` directly — they call `listProjects()` etc.
- **`dom/` and `three/` never import each other.** Keeps SSR-unsafe 3D code out of DOM components.
- **Docs content lives in `app/content/*.mdx`.** The `/docs` routes, sidebar, and TOC consume a stable `DocPage[]` contract — swap the source, keep the contract.

### Vocabulary

- **Screen** — the top-level React component for a route (DOM + 3D bundled)
- **Scene** — the contents of a single `<Canvas>` (R3F root)
- **Doc** — one MDX page under `app/content/`, surfaced at `/docs/<slug>`

## License

Copyright (c) 2025 UnchainedX DAO. All rights reserved. See [LICENSE](./LICENSE).
