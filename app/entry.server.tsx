import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  // Per-request CSP nonce. Propagated to React Router's injected inline scripts
  // via <ServerRouter nonce> (reaches <Scripts>/<ScrollRestoration> through
  // context) and the renderToReadableStream `nonce` option. styled-components'
  // inline <style> is covered by style-src 'unsafe-inline' instead of a nonce,
  // which keeps script-src strict without touching the style pipeline.
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
    {
      nonce,
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  // Enforced CSP. Verified across every route (incl. the three.js/drei scenes)
  // with a headless crawl before enabling; the external origins allowed below
  // (gstatic Draco decoder, drei <Cloud> texture) were found that way.
  responseHeaders.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // 'wasm-unsafe-eval': three.js/drei Draco decoder compiles WebAssembly.
      `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // blob: + gstatic: drei useGLTF fetches the Draco decoder from the gstatic
      // CDN and streams decoded data via blob: URLs. sanity.io: @sanity/client.
      "connect-src 'self' blob: https://*.sanity.io https://www.gstatic.com",
      // drei <Cloud> texture: rawcdn.githack.com 301-redirects to
      // raw.githubusercontent.com, and CSP checks the redirect target host too.
      // data:/blob: cover generated/canvas textures.
      "img-src 'self' data: blob: https://rawcdn.githack.com https://raw.githubusercontent.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  );
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
