import { useEffect, useRef, useState } from "react";

/**
 * Lightweight navigation loading overlay.
 * Matches LoadingScreen aesthetic but without heavy Canvas/WebGPU animations.
 * CSS-only effects for zero GPU competition with the initializing scene.
 */
export default function NavigationLoader({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [revealedChars, setRevealedChars] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoText = "UnchainedX";

  useEffect(() => {
    if (show) {
      setVisible(true);
      setProgress(0);
      setRevealedChars(0);

      const start = performance.now();
      intervalRef.current = setInterval(() => {
        const elapsed = (performance.now() - start) / 1000;
        const p = Math.min(0.95, 1 - Math.exp(-elapsed / 1.5));
        setProgress(p);
        setRevealedChars(Math.min(logoText.length, Math.floor(p * logoText.length * 1.5)));
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (visible) {
        setProgress(1);
        setRevealedChars(logoText.length);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 400);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [show, visible]);

  if (!visible) return null;

  const fadeClass = !show ? "opacity-0" : "opacity-100";

  return (
    <div
      className={`fixed inset-0 z-[9990] flex items-center justify-center pointer-events-auto transition-opacity duration-400 ${fadeClass}`}
      style={{ backgroundColor: "#050311" }}
    >
      {/* Scanlines (CSS only, no canvas) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.02) 2px, rgba(0,240,255,0.02) 4px)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="flex flex-col items-center gap-6">
        {/* Logo — character reveal matching LoadingScreen */}
        <div
          className="text-4xl font-bold tracking-[0.3em]"
          style={{ fontFamily: "Rubik, sans-serif" }}
        >
          {logoText.split("").map((char, i) => {
            const isRevealed = i < revealedChars;
            const isRevealing = i === revealedChars;
            return (
              <span
                key={`${char}-${i}`}
                style={{
                  color: isRevealed ? "#00F0FF" : isRevealing ? "#BF00FF" : "rgba(255,255,255,0.08)",
                  textShadow: isRevealed
                    ? "0 0 10px rgba(0,240,255,0.5), 0 0 30px rgba(0,240,255,0.2)"
                    : isRevealing
                      ? "0 0 15px rgba(191,0,255,0.8)"
                      : "none",
                  transition: "color 0.15s, text-shadow 0.15s",
                  display: "inline-block",
                  transform: isRevealing ? `translateX(${Math.random() * 4 - 2}px)` : "none",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Progress bar matching LoadingScreen style */}
        <div className="w-64 h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #00F0FF, #BF00FF)",
              boxShadow: "0 0 12px rgba(0,240,255,0.6), 0 0 4px rgba(191,0,255,0.4)",
              transition: "width 0.1s",
            }}
          />
        </div>

        {/* Percentage */}
        <div
          className="text-xs tracking-[0.5em] font-mono"
          style={{
            color: "rgba(0, 240, 255, 0.5)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          {Math.floor(progress * 100)}%
        </div>
      </div>
    </div>
  );
}
