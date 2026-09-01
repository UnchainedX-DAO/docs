# UnchainedX DAO

> A DAO that experimentally researches, architects, and expands worldwide protocols and networks.

Website & docs for **UnchainedX DAO** — https://unchainedxdao.io

## Stack

- **React Router 7** (framework mode, SSR) · React 19
- **React Three Fiber / Three.js** (WebGPU renderer, WebGL fallback) — hero only
- **Tailwind CSS 4**
- **Cloudflare Workers** (deploy) · **Vite** · **bun**

## Development

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # client + SSR + Worker bundle
bun run deploy   # build + wrangler deploy
```

## Structure

```
app/
  routes/         Route entries (meta + <Screen/>): home, portfolio, docs
  screens/        One module per route (home = hero, portfolio)
  components/
    dom/          Layout chrome (Header, Footer, MenuOverlay) + overlays (Cursor, LoadingScreen)
    three/        R3F / WebGPU primitives (hero, effects)
  core/services/  seo
  hooks/ · state/
workers/app.ts    Cloudflare Worker entry
```

## License

[MIT](./LICENSE)
