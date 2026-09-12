import { useCallback, useEffect, useRef, useState } from "react";
import { playSwipe } from "~/core/adapters/audio";

interface CarouselNav {
  currentIndex: number;
  goTo: (idx: number) => void;
  goPrev: () => void;
  goNext: () => void;
}

interface Options {
  resetDeps?: unknown[];
  enableWheel?: boolean;
}

export function useCarouselNav(length: number, options: Options = {}): CarouselNav {
  const { resetDeps = [], enableWheel = true } = options;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(length - 1, idx));
      if (clamped !== currentIndexRef.current) playSwipe();
      setCurrentIndex(clamped);
      currentIndexRef.current = clamped;
    },
    [length],
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Reset index when external deps change (e.g. filter)
  // biome-ignore lint/correctness/useExhaustiveDependencies: caller-controlled reset triggers
  useEffect(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
  }, resetDeps);

  // Horizontal wheel (opt-in)
  useEffect(() => {
    if (!enableWheel) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
        e.preventDefault();
        if (e.deltaX > 0) goTo(currentIndexRef.current + 1);
        else goTo(currentIndexRef.current - 1);
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goTo, enableWheel]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goTo(currentIndexRef.current + 1);
        else goTo(currentIndexRef.current - 1);
      }
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goTo]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(currentIndexRef.current + 1);
      else if (e.key === "ArrowLeft") goTo(currentIndexRef.current - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo]);

  return { currentIndex, goTo, goPrev, goNext };
}
