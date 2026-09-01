import { useCallback, useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import ParticleBurst from "~/components/three/effects/ParticleBurst";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";

interface LoadingScreenProps {
  onComplete: () => void;
  statusLabel?: string;
}

const BURST_ORIGINS: [number, number, number][] = [
  [0, 0, 0],
  [-0.5, 0.2, 0],
  [0.5, -0.2, 0],
  [0, 0.3, 0],
  [0, -0.3, 0],
];

const LOGO_TEXT = "UnchainedX DAO";

export default function LoadingScreen({ onComplete, statusLabel = "Loading" }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [bursting, setBursting] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const startTime = useRef<number | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Background grid animation
  const startBgAnim = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Code rain columns
    const fontSize = 12;
    const columnSpacing = fontSize * 2;
    const columns = Math.floor(canvas.width / columnSpacing);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -50);
    const chars = "0123456789abcdef";

    const animate = () => {
      const t = performance.now() * 0.001;

      // Semi-transparent black to create trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Code rain
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        // Generate hex-like chunks: "0x", "a7", "f3" etc.
        const char =
          Math.random() > 0.9
            ? "0x"
            : chars[Math.floor(Math.random() * chars.length)] +
              chars[Math.floor(Math.random() * chars.length)];
        const x = i * columnSpacing;
        const y = drops[i] * fontSize;

        // Lead character — subtle
        ctx.fillStyle = `rgba(0, 240, 255, ${0.2 + Math.random() * 0.15})`;
        ctx.fillText(char, x, y);

        // Trail character — dimmer
        if (drops[i] > 1) {
          const trailChar =
            chars[Math.floor(Math.random() * chars.length)] +
            chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
          ctx.fillText(trailChar, x, y - fontSize);
        }

        // Reset or advance
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      // Scan lines overlay
      ctx.fillStyle = "rgba(0, 240, 255, 0.01)";
      for (let y = 0; y < canvas.height; y += 3) {
        if ((y + Math.floor(t * 50)) % 6 < 3) {
          ctx.fillRect(0, y, canvas.width, 1);
        }
      }

      // Horizontal glitch line
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

  // Progress + character reveal
  useEffect(() => {
    startTime.current = performance.now();

    const interval = setInterval(() => {
      if (!startTime.current) return;
      const elapsed = (performance.now() - startTime.current) / 1000;
      const p = Math.min(1, 1 - Math.exp(-elapsed / 2));
      setProgress(p);

      // Reveal characters progressively
      const chars = Math.floor(p * LOGO_TEXT.length * 1.5);
      setRevealedChars(Math.min(LOGO_TEXT.length, chars));

      if (p >= 0.99) {
        setProgress(1);
        setRevealedChars(LOGO_TEXT.length);
        clearInterval(interval);
        setBursting(true);
      }
    }, 50);

    const timeout = setTimeout(() => {
      setProgress(1);
      setRevealedChars(LOGO_TEXT.length);
      clearInterval(interval);
      setBursting(true);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleScattered = () => {
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Background animation canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Particle burst — only when complete */}
      {bursting && (
        <ClientOnly fallback={null}>
          {() => (
            <WebGPUCanvas className="!absolute inset-0" dpr={[1, 1]}>
              <ambientLight intensity={0.3} />
              <ParticleBurst origins={BURST_ORIGINS} active onScattered={handleScattered} />
            </WebGPUCanvas>
          )}
        </ClientOnly>
      )}

      {/* Logo + progress — hide when bursting */}
      {!bursting && (
        <>
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
                style={{
                  transitionDelay: `${i * 30}ms`,
                  // Glitch offset on recently revealed chars
                  transform:
                    i === revealedChars - 1 && revealedChars < LOGO_TEXT.length
                      ? `translateX(${Math.sin(Date.now() * 0.01) * 3}px)`
                      : undefined,
                }}
              >
                {char}
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
            {/* Percentage with pulse */}
            <p
              className="text-center text-xs text-text-muted mt-3 uppercase tracking-widest neon-glow"
              style={{ opacity: 0.5 + Math.sin(Date.now() * 0.003) * 0.3 }}
            >
              {Math.round(progress * 100)}%
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-text-muted/30 mt-8 uppercase tracking-[0.3em]">{statusLabel}</p>
        </>
      )}
    </div>
  );
}
