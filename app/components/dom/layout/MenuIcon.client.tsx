import { useEffect, useRef } from "react";

interface MenuIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function MenuIcon({ isOpen, onClick }: MenuIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animProgress = useRef(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 32;
    canvas.width = size;
    canvas.height = size;

    const animate = () => {
      const target = isOpen ? 1 : 0;
      animProgress.current += (target - animProgress.current) * 0.12;

      ctx.clearRect(0, 0, size, size);
      const p = animProgress.current;

      const cx = size / 2;
      const cy = size / 2;

      // 3 nodes connected by chain links
      const nodeRadius = 2.5;
      const spread = 5 + p * 3;

      // Node positions: triangle formation when closed, X-like when open
      const nodes = [
        { x: cx, y: cy - spread * 1.2 },
        { x: cx - spread, y: cy + spread * 0.8 },
        { x: cx + spread, y: cy + spread * 0.8 },
      ];

      // Chain links between nodes
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + p * 0.4})`;
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        const next = nodes[(i + 1) % nodes.length];
        const curr = nodes[i];

        ctx.beginPath();
        ctx.moveTo(curr.x, curr.y);

        // Slight curve for chain-like feel
        const mx = (curr.x + next.x) / 2 + Math.sin(p * Math.PI) * (i === 0 ? 3 : -3);
        const my = (curr.y + next.y) / 2 + Math.cos(p * Math.PI) * 2;
        ctx.quadraticCurveTo(mx, my, next.x, next.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.7 + p * 0.3})`;
        ctx.fill();
      }

      // Glow when open
      if (p > 0.1) {
        ctx.beginPath();
        ctx.arc(cx, cy, spread * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${p * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [isOpen]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-8 h-8 flex items-center justify-center hover:scale-110 transition-all duration-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <canvas ref={canvasRef} className="w-8 h-8" />
    </button>
  );
}
