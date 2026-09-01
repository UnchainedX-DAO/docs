import { useCallback, useEffect, useRef } from "react";
import { useIsTouchDevice } from "~/hooks/useDevice";
import { mouseState } from "~/state";

interface Point {
  x: number;
  y: number;
}

const LERP_SPEED = 0.1;
const MAGNETIC_RADIUS = 80;
const ORB_RADIUS = 14;
const HOVER_ORB_RADIUS = 28;
const PARTICLE_COUNT = 20;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number; // 0 = cyan, 1 = purple
}

export default function Cursor() {
  const isTouch = useIsTouchDevice();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawPos = useRef<Point>({ x: -100, y: -100 });
  const smoothPos = useRef<Point>({ x: -100, y: -100 });
  const prevPos = useRef<Point>({ x: -100, y: -100 });
  const magnetTarget = useRef<Point | null>(null);
  const isHovering = useRef(false);
  const clickFlash = useRef(0);
  const particles = useRef<Particle[]>([]);
  const clickRipples = useRef<{ x: number; y: number; radius: number; opacity: number }[]>([]);
  const raf = useRef<number>(0);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    rawPos.current = { x: cx, y: cy };

    mouseState.prevX = mouseState.x;
    mouseState.prevY = mouseState.y;
    mouseState.x = cx / window.innerWidth;
    mouseState.y = cy / window.innerHeight;
    mouseState.vx = mouseState.x - mouseState.prevX;
    mouseState.vy = mouseState.y - mouseState.prevY;
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point =
        "touches" in e
          ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
          : { x: e.clientX, y: e.clientY };

      clickRipples.current.push({ ...point, radius: 0, opacity: 0.8 });
      clickFlash.current = 1.0;

      // Burst particles on click
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
        const speed = 2 + Math.random() * 3;
        particles.current.push({
          x: point.x,
          y: point.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 1.0,
          size: 2 + Math.random() * 2,
          hue: Math.random() > 0.5 ? 1 : 0,
        });
      }
    },
    [],
  );

  // Hover detection + magnetic snap
  useEffect(() => {
    const checkHover = () => {
      const el = document.elementFromPoint(rawPos.current.x, rawPos.current.y);
      if (el) {
        const tag = el.tagName.toLowerCase();
        const interactive =
          tag === "a" || tag === "button" ||
          el.closest("a") !== null || el.closest("button") !== null ||
          el.getAttribute("role") === "button";
        isHovering.current = interactive;

        if (interactive) {
          const target = el.closest("a") || el.closest("button") || el;
          const rect = target.getBoundingClientRect();
          magnetTarget.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        } else {
          magnetTarget.current = null;
        }
      }
    };
    const id = setInterval(checkHover, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isTouch) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("click", handleClick);
    }
    window.addEventListener("touchstart", handleClick);
    window.addEventListener("touchmove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleClick);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [isTouch, handleMove, handleClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isTouch) {
        // --- Lerp with magnetic snap ---
        let targetX = rawPos.current.x;
        let targetY = rawPos.current.y;

        if (magnetTarget.current && isHovering.current) {
          const dx = magnetTarget.current.x - rawPos.current.x;
          const dy = magnetTarget.current.y - rawPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAGNETIC_RADIUS) {
            const pull = 1 - dist / MAGNETIC_RADIUS;
            targetX = rawPos.current.x + dx * pull * 0.5;
            targetY = rawPos.current.y + dy * pull * 0.5;
          }
        }

        smoothPos.current.x += (targetX - smoothPos.current.x) * LERP_SPEED;
        smoothPos.current.y += (targetY - smoothPos.current.y) * LERP_SPEED;

        const cx = smoothPos.current.x;
        const cy = smoothPos.current.y;
        const t = performance.now() * 0.001;

        // --- Velocity for particle shedding ---
        const vx = cx - prevPos.current.x;
        const vy = cy - prevPos.current.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        prevPos.current = { x: cx, y: cy };

        // --- Shed particles when moving ---
        if (speed > 1.5 && particles.current.length < PARTICLE_COUNT) {
          const angle = Math.atan2(vy, vx) + Math.PI + (Math.random() - 0.5) * 1.2;
          const spd = 0.5 + Math.random() * 1.5;
          particles.current.push({
            x: cx + (Math.random() - 0.5) * 8,
            y: cy + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 0.6 + Math.random() * 0.4,
            size: 1.5 + Math.random() * 2,
            hue: Math.random() > 0.5 ? 1 : 0,
          });
        }

        // --- Update & draw particles ---
        for (let i = particles.current.length - 1; i >= 0; i--) {
          const p = particles.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.life -= 0.02;

          if (p.life <= 0) {
            particles.current.splice(i, 1);
            continue;
          }

          const alpha = p.life / p.maxLife;
          const r = p.hue === 0 ? 0 : 191;
          const g = p.hue === 0 ? 240 : 0;
          const b = 255;

          // Glow
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.9})`;
          ctx.fill();
        }

        // --- Plasma orb ---
        const orbRadius = isHovering.current ? HOVER_ORB_RADIUS : ORB_RADIUS;
        const clickScale = 1 - clickFlash.current * 0.4;
        const r = orbRadius * clickScale;

        // Outer glow (large, soft white)
        const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3.5);
        outerGlow.addColorStop(0, `rgba(220, 245, 255, ${isHovering.current ? 0.25 : 0.15})`);
        outerGlow.addColorStop(0.3, `rgba(180, 220, 255, ${isHovering.current ? 0.08 : 0.04})`);
        outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Mid glow (subtle center bleed)
        const midGlow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.8);
        midGlow.addColorStop(0, `rgba(230, 248, 255, ${isHovering.current ? 0.3 : 0.18})`);
        midGlow.addColorStop(0.5, `rgba(200, 240, 255, 0.06)`);
        midGlow.addColorStop(1, "rgba(180, 230, 255, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = midGlow;
        ctx.fill();

        // Orb interior: only when NOT hovering
        if (!isHovering.current) {
          // Layer 1: subtle cyan wash
          const plasma1 = ctx.createRadialGradient(
            cx + Math.sin(t * 2) * r * 0.2,
            cy + Math.cos(t * 1.7) * r * 0.2,
            0,
            cx, cy, r,
          );
          plasma1.addColorStop(0, `rgba(200, 245, 255, ${0.15 + Math.sin(t * 3) * 0.05})`);
          plasma1.addColorStop(0.5, `rgba(150, 230, 250, 0.06)`);
          plasma1.addColorStop(1, "rgba(100, 210, 240, 0)");
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = plasma1;
          ctx.fill();

          // Layer 2: subtle purple accent
          const plasma2 = ctx.createRadialGradient(
            cx + Math.cos(t * 1.5) * r * 0.35,
            cy + Math.sin(t * 2.1) * r * 0.35,
            0,
            cx, cy, r,
          );
          plasma2.addColorStop(0, `rgba(191, 0, 255, ${0.12 + Math.cos(t * 2.5) * 0.05})`);
          plasma2.addColorStop(0.4, "rgba(160, 0, 220, 0.04)");
          plasma2.addColorStop(1, "rgba(191, 0, 255, 0)");
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = plasma2;
          ctx.fill();

          // Layer 3: small bright core dot
          const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.25);
          core.addColorStop(0, `rgba(255, 255, 255, ${0.9 + Math.sin(t * 4) * 0.1})`);
          core.addColorStop(0.5, "rgba(220, 248, 255, 0.4)");
          core.addColorStop(1, "rgba(180, 240, 255, 0)");
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = core;
          ctx.fill();
        }

        // Rim (bright white ring)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 250, 255, ${isHovering.current ? 0.9 : 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Second rim glow (wider, softer)
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 240, 255, ${isHovering.current ? 0.25 : 0.12})`;
        ctx.lineWidth = 5;
        ctx.stroke();

        // --- Click flash ---
        if (clickFlash.current > 0) {
          // Shockwave ring
          const shockRadius = (1 - clickFlash.current) * 60 + r;
          ctx.beginPath();
          ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${clickFlash.current * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          clickFlash.current *= 0.88;
          if (clickFlash.current < 0.01) clickFlash.current = 0;
        }
      }

      // --- Click ripples ---
      for (let i = clickRipples.current.length - 1; i >= 0; i--) {
        const rip = clickRipples.current[i];
        rip.radius += 3;
        rip.opacity -= 0.02;
        if (rip.opacity <= 0) {
          clickRipples.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${rip.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, [isTouch]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
