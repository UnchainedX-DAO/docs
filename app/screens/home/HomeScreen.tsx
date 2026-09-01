import Footer from "~/components/dom/layout/Footer";

// Hero-only landing. No scroll-driven sections (deliberately, so there is no
// scroll-jacking logic). The 3D/WebGPU hero visual is layered in next.
export default function HomeScreen() {
  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Vertical neon accent lines — sibling to menu/footer */}
        <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent" />
        <div className="absolute right-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-purple/10 to-transparent" />

        <h1 className="relative z-10 text-4xl md:text-7xl font-bold tracking-tight text-neon-white neon-glow-strong">
          UnchainedX&nbsp;DAO
        </h1>
        <p className="relative z-10 mt-8 max-w-2xl text-base md:text-xl text-text-muted leading-relaxed">
          A DAO that experimentally researches, architects, and expands worldwide protocols and
          networks.
        </p>
      </section>

      <Footer />
    </>
  );
}
