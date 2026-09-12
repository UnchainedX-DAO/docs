import { useState } from "react";
import { useLoaderData } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import type { ProjectStatus } from "~/core/adapters/sanity";
import { useCarouselNav } from "~/hooks/useCarouselNav";
import { useFooterAnimation } from "~/hooks/useFooterAnimation";
import type { loader } from "~/routes/portfolio";
import PortfolioScene from "./scene/PortfolioScene.client";
import PortfolioHeader from "./ui/PortfolioHeader";
import PortfolioNav from "./ui/PortfolioNav";
import PortfolioPagination from "./ui/PortfolioPagination";

export default function PortfolioScreen() {
  const { projects } = useLoaderData<typeof loader>();
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const footerRef = useFooterAnimation();

  const filtered = projects.filter((p) => {
    const statusMatch = activeStatus === "All" || p.status === activeStatus;
    const q = searchQuery.toLowerCase();
    const searchMatch =
      q === "" ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.topics.some((t) => t.toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const { currentIndex, goTo, goPrev, goNext } = useCarouselNav(filtered.length, {
    resetDeps: [activeStatus, searchQuery],
  });

  return (
    <>
      <ClientOnly fallback={null}>
        {() => (
          <PortfolioScene
            projects={filtered}
            currentIndex={currentIndex}
            activeStatus={activeStatus}
          />
        )}
      </ClientOnly>

      <PortfolioHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
      />

      <PortfolioNav
        currentIndex={currentIndex}
        total={filtered.length}
        onPrev={goPrev}
        onNext={goNext}
      />

      <PortfolioPagination projects={filtered} currentIndex={currentIndex} onSelect={goTo} />

      <div ref={footerRef} className="relative z-35 mt-[100vh] pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
