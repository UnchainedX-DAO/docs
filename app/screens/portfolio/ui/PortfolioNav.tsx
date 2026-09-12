import { playClick, playHover } from "~/core/adapters/audio";

interface Props {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

const HOVER_ANIM = [
  { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
  { boxShadow: "0 0 18px rgba(230,25,150,0.4), 0 0 40px rgba(230,25,150,0.15)" },
  { boxShadow: "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1)" },
];

function applyHoverActive(el: HTMLButtonElement) {
  el.style.borderColor = "#E619A0";
  el.style.backgroundColor = "rgba(230,25,150,0.08)";
  el.style.boxShadow = "0 0 12px rgba(230,25,150,0.3), 0 0 30px rgba(230,25,150,0.1), inset 0 0 10px rgba(230,25,150,0.05)";
  el.style.color = "#E619A0";
  el.animate(HOVER_ANIM, { duration: 1200, iterations: Infinity, easing: "ease-in-out" });
}

function applyHoverReset(el: HTMLButtonElement) {
  el.getAnimations().forEach((a) => a.cancel());
  el.style.borderColor = "rgba(0,240,255,0.25)";
  el.style.backgroundColor = "rgba(0,240,255,0.06)";
  el.style.boxShadow = "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)";
  el.style.color = "#00F0FF";
}

function arrowStyle(disabled: boolean): React.CSSProperties {
  return {
    backgroundColor: disabled ? "rgba(255,255,255,0.02)" : "rgba(0,240,255,0.06)",
    border: `1.5px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(0,240,255,0.25)"}`,
    color: disabled ? "rgba(255,255,255,0.15)" : "#00F0FF",
    boxShadow: disabled ? "none" : "0 0 12px rgba(0,240,255,0.15), 0 0 25px rgba(0,240,255,0.06), inset 0 0 8px rgba(0,240,255,0.04)",
    backdropFilter: "blur(6px)",
  };
}

export default function PortfolioNav({ currentIndex, total, onPrev, onNext }: Props) {
  const prevDisabled = currentIndex === 0;
  const nextDisabled = currentIndex >= total - 1;

  return (
    <div className="hidden md:flex fixed z-20 top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-4 md:px-8 pointer-events-none">
      <button
        type="button"
        onClick={() => {
          playClick();
          onPrev();
        }}
        disabled={prevDisabled}
        className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={arrowStyle(prevDisabled)}
        onMouseEnter={(e) => {
          playHover();
          if (!prevDisabled) applyHoverActive(e.currentTarget);
        }}
        onMouseLeave={(e) => {
          if (!prevDisabled) applyHoverReset(e.currentTarget);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px currentColor)" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          playClick();
          onNext();
        }}
        disabled={nextDisabled}
        className="group pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={arrowStyle(nextDisabled)}
        onMouseEnter={(e) => {
          playHover();
          if (!nextDisabled) applyHoverActive(e.currentTarget);
        }}
        onMouseLeave={(e) => {
          if (!nextDisabled) applyHoverReset(e.currentTarget);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px currentColor)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
