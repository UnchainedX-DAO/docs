import { useCallback, useEffect, useRef, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
  statusLabel?: string;
}

const LOGO_TEXT = "UnchainedX DAO";

// Pure 2D loading screen — deliberately no three.js / WebGPU so that the 3D
// bundle stays out of the shared root chunk (docs & other 2D pages stay light).
export default function LoadingScreen({ onComplete, statusLabel = "Loading" }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const startTime = useRef<number | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Background code-rain animation (2D canvas)
  const startBgAnim = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 12;
    const columnSpacing = fontSize * 2;
    const columns = Math.floor(canvas.width / columnSpacing);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);
    const chars = "0123456789abcdef";

    const animate = () => {
      const t = performance.now() * 0.001;

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        const char =
          Math.random() > 0.9
            ? "0x"
            : chars[Math.floor(Math.random() * chars.length)] +
              chars[Math.floor(Math.random() * chars.length)];
        const x = i * columnSpacing;
        const y = drops[i] * fontSize;

        ctx.fillStyle = `rgba(0, 240, 255, ${0.2 + Math.random() * 0.15})`;
        ctx.fillText(char, x, y);

        if (drops[i] > 1) {
          const trailChar =
            chars[Math.floor(Math.random() * chars.length)] +
            chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
          ctx.fillText(trailChar, x, y - fontSize);
        }

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      ctx.fillStyle = "rgba(0, 240, 255, 0.01)";
      for (let y = 0; y < canvas.height; y += 3) {
        if ((y + Math.floor(t * 50)) % 6 < 3) {
          ctx.fillRect(0, y, canvas.width, 1);
        }
      }

      if (Math.random() > 0.97) {
        const glitchY = Math.random() * canvas.height;
        ctx.fillStyle = "rgba(0, 240, 255, 0.1)";
        ctx.fillRect(0, glitchY, canvas.width, 1 + Math.random() * 2);
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  useEffect(() => {
    startBgAnim();
    return () => cancelAnimationFrame(animRef.current);
  }, [startBgAnim]);

  // Progress + character reveal, then fade out (no 3D burst)
  useEffect(() => {
    startTime.current = performance.now();

    const finish = () => {
      setProgress(1);
      setRevealedChars(LOGO_TEXT.length);
      setFadingOut(true);
      window.setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 600);
    };

    const interval = setInterval(() => {
      if (!startTime.current) return;
      const elapsed = (performance.now() - startTime.current) / 1000;
      const p = Math.min(1, 1 - Math.exp(-elapsed / 2));
      setProgress(p);
      setRevealedChars(Math.min(LOGO_TEXT.length, Math.floor(p * LOGO_TEXT.length * 1.5)));

      if (p >= 0.99) {
        clearInterval(interval);
        finish();
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      finish();
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background animation canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Character-by-character reveal with glitch */}
      <h1 className="text-3xl md:text-5xl font-bold tracking-widest mb-12 relative">
        {LOGO_TEXT.split("").map((char, i) => (
          <span
            key={`char-${char}-${i.toString()}`}
            className={`inline-block transition-all duration-300 ${
              i < revealedChars
                ? "text-neon-cyan neon-glow-strong opacity-100 translate-y-0"
                : "text-transparent opacity-0 translate-y-2"
            }`}
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </h1>

      {/* Progress bar with glow */}
      <div className="w-48 relative">
        <div className="h-[1px] bg-border w-full overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-all duration-200"
            style={{
              width: `${progress * 100}%`,
              boxShadow: `0 0 8px #00F0FF, 0 0 20px rgba(0,240,255,${progress * 0.5})`,
            }}
          />
        </div>
        <p className="text-center text-xs text-text-muted mt-3 uppercase tracking-widest neon-glow">
          {Math.round(progress * 100)}%
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-text-muted/30 mt-8 uppercase tracking-[0.3em]">{statusLabel}</p>
    </div>
  );
}
