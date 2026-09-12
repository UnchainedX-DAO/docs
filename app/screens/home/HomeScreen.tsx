import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import HeroScene from "./scene/HeroScene.client";

// Hero-only landing: a 3D-text hero (title + tagline) over the unchainedx.io
// FBM fog, with selective bloom. No scroll-driven sections.
export default function HomeScreen() {
  return (
    <>
      <section className="relative min-h-screen overflow-hidden">
        <ClientOnly fallback={<div className="absolute inset-0 bg-bg" />}>
          {() => <HeroScene />}
        </ClientOnly>
      </section>

      <Footer />
    </>
  );
}
