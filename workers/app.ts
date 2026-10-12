import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// Static, request-independent security headers. Applied to every response the
// Worker generates (a `_headers` file would NOT cover SSR document responses).
// CSP is intentionally omitted here — it needs a per-request nonce wired through
// entry.server.tsx and should be rolled out as Report-Only first.
function applySecurityHeaders(headers: Headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  // HSTS: start low. Raise to "max-age=31536000; includeSubDomains" once every
  // subdomain is confirmed HTTPS-only. Add `preload` only much later — it is
  // effectively permanent and slow to reverse.
  headers.set("Strict-Transport-Security", "max-age=86400");
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    // Chrome DevTools workspace probe — silence the 404 noise from React Router
    if (pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
      return new Response(null, { status: 204 });
    }

    const response = await requestHandler(request, {
      cloudflare: { env, ctx },
    });

    // Re-wrap WITHOUT reading response.body so streaming SSR is preserved.
    const headers = new Headers(response.headers);
    applySecurityHeaders(headers);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
