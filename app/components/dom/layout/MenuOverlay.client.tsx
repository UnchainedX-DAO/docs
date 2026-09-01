import gsap from "gsap";
import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: "Portfolio", to: "/portfolio" },
  { label: "Docs", to: "/docs" },
] as const;

export default function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLAnchorElement[]>([]);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const startParticles = useCallback(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.05,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.fill();
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const stopParticles = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    const canvas = particleCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        onStart: () => {
          if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto";
          startParticles();
        },
      });

      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        const glitchX = (Math.random() - 0.5) * 80;
        gsap.fromTo(
          item,
          {
            x: glitchX,
            y: 20,
            opacity: 0,
            skewX: (Math.random() - 0.5) * 10,
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            skewX: 0,
            duration: 0.35,
            delay: 0.08 + i * 0.05,
            ease: "power3.out",
          },
        );
      });
    } else {
      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        const dir = i % 2 === 0 ? 1 : -1;
        gsap.to(item, {
          x: dir * (50 + Math.random() * 40),
          opacity: 0,
          skewX: dir * (5 + Math.random() * 8),
          duration: 0.2,
          delay: i * 0.02,
          ease: "power2.in",
        });
      });

      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        delay: 0.2,
        ease: "power2.in",
        onComplete: () => {
          if (overlayRef.current) overlayRef.current.style.pointerEvents = "none";
          stopParticles();
        },
      });
    }
  }, [isOpen, startParticles, stopParticles]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 flex items-center justify-center opacity-0 pointer-events-none"
      style={{
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Particle canvas */}
      <canvas ref={particleCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Vertical neon lines decoration */}
      <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-purple/10 to-transparent" />

      <nav className="flex flex-col items-center gap-10 md:gap-14">
        {MENU_ITEMS.map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            ref={(el) => {
              if (el) itemsRef.current[i] = el;
            }}
            onClick={() => onClose()}
            className="group relative text-3xl md:text-7xl font-bold uppercase tracking-wider text-text-muted neon-glow hover:text-neon-cyan hover:neon-glow-strong hover:tracking-[0.08em] hover:scale-[1.02] transition-all duration-300 opacity-0"
          >
            <span className="relative z-10">{item.label}</span>
            {/* Underline sweep */}
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-neon-cyan group-hover:w-full transition-all duration-400 ease-out shadow-[0_0_8px_#00F0FF]" />
            {/* Left accent dash */}
            <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-0 h-[2px] bg-neon-cyan group-hover:w-4 transition-all duration-200 shadow-[0_0_6px_#00F0FF]" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
