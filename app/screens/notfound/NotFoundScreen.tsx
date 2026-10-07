import { useCallback, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Header from "~/components/dom/layout/Header";
import MenuOverlay from "~/components/dom/layout/MenuOverlay.client";
import Cursor from "~/components/dom/overlays/Cursor.client";
import LoadingScreen from "~/components/dom/overlays/LoadingScreen.client";
import { sceneReady } from "~/state/sceneReady";
import NotFoundScene from "./scene/NotFoundScene.client";

// Rendered by the root ErrorBoundary on 404 — the boundary replaces <App/>, so
// this page carries its own header + menu chrome, plus the loading overlay that
// normally lives in <App/> (otherwise the chrome flashes while the fog scene
// boots).
export default function NotFoundScreen() {
  // Re-arm the loader's readiness gate. On the 404 path the root ErrorBoundary
  // replaces <App/>, so App's pathname effect (which normally calls this on
  // navigation) never runs — leaving a stale ready=true from the previously
  // viewed scene, which would dismiss the loader before the fog scene draws its
  // first frame (black scene). Run in a lazy state initializer so it fires once
  // during render, before the child LoadingScreen/NotFoundScene effects read it.
  useState(() => {
    sceneReady.reset();
    return null;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const toggle = useCallback(() => setMenuOpen((v) => !v), []);
  const close = useCallback(() => setMenuOpen(false), []);
  const handleLoadComplete = useCallback(() => setShowLoading(false), []);

  return (
    <>
      <ClientOnly fallback={null}>{() => <Cursor />}</ClientOnly>
      {/* Static dark cover rendered on the server and during hydration, before
          the client-only LoadingScreen can mount. Uses INLINE styles (not
          Tailwind classes) on purpose: in dev, Vite injects the stylesheet via
          JS, so there is a window where app.css isn't applied yet — a
          class-based cover would itself be unstyled and the raw chrome (header/
          footer) would flash through. Inline styles need no stylesheet, so the
          cover is black from the first painted frame. Matches the LoadingScreen
          root (fixed inset-0 z-100 bg) for a seamless swap to the real loader. */}
      <ClientOnly
        fallback={<div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000" }} />}
      >
        {() => showLoading && <LoadingScreen onComplete={handleLoadComplete} />}
      </ClientOnly>
      <Header isMenuOpen={menuOpen} onMenuToggle={toggle} onMenuClose={close} />
      <ClientOnly fallback={null}>
        {() => <MenuOverlay isOpen={menuOpen} onClose={close} />}
      </ClientOnly>
      <section className="relative min-h-screen overflow-hidden">
        <ClientOnly fallback={<div className="fixed inset-0 bg-bg" />}>
          {() => <NotFoundScene />}
        </ClientOnly>
      </section>
    </>
  );
}
