import { useEffect, useRef } from "react";

export function useFooterAnimation() {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const ratio = entry.intersectionRatio;
          const el = entry.target as HTMLElement;
          el.style.transform = `translateY(${(1 - ratio) * 30}px)`;
          el.style.opacity = String(Math.min(1, ratio * 2));
          const children = el.querySelectorAll("[data-footer-item]");
          children.forEach((child, i) => {
            const c = child as HTMLElement;
            const delay = i * 0.08;
            const childProgress = Math.max(0, Math.min(1, (ratio - delay) * 2.5));
            c.style.transform = `translateY(${(1 - childProgress) * 40}px)`;
            c.style.opacity = String(childProgress);
          });
        }
      },
      { threshold: Array.from({ length: 20 }, (_, i) => i / 19) },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return footerRef;
}
