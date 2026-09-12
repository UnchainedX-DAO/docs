import { useEffect, useRef } from "react";

interface GenerativeThumbProps {
  title: string;
  categories: string[];
}

export default function GenerativeThumb({ title, categories }: GenerativeThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = 560;
    const ch = 740;
    canvas.width = cw;
    canvas.height = ch;

    // Seed
    let seed = 0;
    for (let i = 0; i < title.length; i++) {
      seed = ((seed << 5) - seed + title.charCodeAt(i)) | 0;
    }
    const sr = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };

    const category = categories[0] || "Web";

    // Pre-generate seed-based data
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 30; i++) {
      nodes.push({
        x: sr() * cw, y: sr() * ch,
        vx: (sr() - 0.5) * 0.5, vy: (sr() - 0.5) * 0.5,
      });
    }

    const draw = (time: number) => {
      const t = time * 0.001;
      ctx.clearRect(0, 0, cw, ch);

      // Animated gradient background — shifts over time
      const hueShift = Math.sin(t * 0.15) * 0.5 + 0.5;
      const gradX = cw * (0.3 + Math.sin(t * 0.2) * 0.2);
      const gradY = ch * (0.3 + Math.cos(t * 0.15) * 0.2);
      const bgGrad = ctx.createRadialGradient(gradX, gradY, 0, cw * 0.5, ch * 0.5, cw * 0.7);
      const r1 = Math.floor(15 + hueShift * 25);
      const g1 = Math.floor(30 + hueShift * 35);
      const b1 = Math.floor(50 + hueShift * 30);
      bgGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.6)`);
      bgGrad.addColorStop(1, `rgba(${Math.floor(r1 * 0.7)}, ${Math.floor(g1 * 0.6)}, ${Math.floor(b1 * 0.7)}, 0.7)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cw, ch);

      if (category === "AI") {
        drawAI(ctx, t, cw, ch, nodes);
      } else if (category === "Blockchain") {
        drawBlockchain(ctx, t, cw, ch, nodes);
      } else if (category === "Security") {
        drawSecurity(ctx, t, cw, ch, nodes);
      } else if (category === "Infrastructure") {
        drawInfra(ctx, t, cw, ch, nodes);
      } else if (category === "Creative") {
        drawCreative(ctx, t, cw, ch, nodes);
      } else if (category === "Design") {
        drawDesign(ctx, t, cw, ch, nodes);
      } else if (category === "Art") {
        drawArt(ctx, t, cw, ch, nodes);
      } else {
        drawCreative(ctx, t, cw, ch, nodes);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // Only animate when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [title, categories]);

  return (
    <canvas ref={canvasRef} style={{ width: "280px", height: "370px" }} />
  );
}

// === AI: Neural network — nodes + connections pulsing ===
function drawAI(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, nodes: { x: number; y: number; vx: number; vy: number }[]) {
  // Move nodes slightly
  for (const n of nodes) {
    n.x += Math.sin(t * 0.5 + n.y * 0.01) * 0.3;
    n.y += Math.cos(t * 0.4 + n.x * 0.01) * 0.3;
  }

  // Connections — draw lines between close nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const pulse = Math.sin(t * 2 + i * 0.5 + j * 0.3) * 0.5 + 0.5;
        const alpha = (1 - dist / 200) * 0.4 * pulse;
        // Glow
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        // Core
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Data packet traveling along connection
        const packetPos = (Math.sin(t * 3 + i + j) * 0.5 + 0.5);
        const px = nodes[i].x + (nodes[j].x - nodes[i].x) * packetPos;
        const py = nodes[i].y + (nodes[j].y - nodes[i].y) * packetPos;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 1.5})`;
        ctx.fill();
      }
    }
  }

  // Nodes
  for (let i = 0; i < nodes.length; i++) {
    const pulse = Math.sin(t * 1.5 + i) * 0.3 + 0.7;
    // Glow
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${0.1 * pulse})`;
    ctx.fill();
    // Core
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${0.6 * pulse})`;
    ctx.fill();
  }
}

// === Blockchain: Falling blocks + chain links ===
function drawBlockchain(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, nodes: { x: number; y: number; vx: number; vy: number }[]) {
  const blockCount = 8;
  const blockW = 60;
  const blockH = 40;

  for (let i = 0; i < blockCount; i++) {
    const x = (i % 3) * (w / 3) + w / 6 - blockW / 2;
    const row = Math.floor(i / 3);
    const yBase = row * (h / 3) + h / 6 - blockH / 2;
    const y = yBase + Math.sin(t * 0.5 + i * 1.2) * 10;

    // Block glow
    ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
    ctx.fillRect(x - 6, y - 6, blockW + 12, blockH + 12);
    // Block outline
    ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, blockW, blockH);

    // Hash lines inside block
    for (let l = 0; l < 3; l++) {
      const lx = x + 8;
      const ly = y + 10 + l * 10;
      const lw = blockW - 16 - Math.sin(t + i + l) * 10;
      ctx.fillStyle = "rgba(0, 240, 255, 0.5)";
      ctx.fillRect(lx, ly, lw, 2);
    }

    // Chain link to next block
    if (i < blockCount - 1) {
      const nextX = ((i + 1) % 3) * (w / 3) + w / 6;
      const nextRow = Math.floor((i + 1) / 3);
      const nextY = nextRow * (h / 3) + h / 6 + Math.sin(t * 0.5 + (i + 1) * 1.2) * 10;

      ctx.beginPath();
      ctx.moveTo(x + blockW, y + blockH / 2);
      ctx.lineTo(nextX - blockW / 2, nextY);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulse dot on chain
      const chainPulse = (t * 0.8 + i * 0.3) % 1;
      const cpx = (x + blockW) + (nextX - blockW / 2 - x - blockW) * chainPulse;
      const cpy = (y + blockH / 2) + (nextY - y - blockH / 2) * chainPulse;
      // Glow
      ctx.beginPath();
      ctx.arc(cpx, cpy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.9)";
      ctx.fill();
    }
  }
}

// === Security: Lock/shield with scanning beams ===
function drawSecurity(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, _nodes: { x: number; y: number; vx: number; vy: number }[]) {
  const cx = w / 2;
  const cy = h / 2;

  // Rotating scan rings
  for (let r = 0; r < 4; r++) {
    const radius = 80 + r * 50;
    const startAngle = t * (0.3 + r * 0.1) + r * 1.5;
    const arcLen = Math.PI * (0.5 + r * 0.15);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + arcLen);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 - r * 0.08})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + arcLen);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 - r * 0.02})`;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  // Central shield shape
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx + 50, cy - 30);
  ctx.lineTo(cx + 50, cy + 20);
  ctx.lineTo(cx, cy + 50);
  ctx.lineTo(cx - 50, cy + 20);
  ctx.lineTo(cx - 50, cy - 30);
  ctx.closePath();
  ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + Math.sin(t) * 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 240, 255, 0.03)";
  ctx.fill();

  // Lock icon in center
  ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 12, Math.PI, 0);
  ctx.stroke();
  ctx.strokeRect(cx - 15, cy, 30, 22);

  // Scan line sweeping
  const scanY = ((t * 80) % (h + 40)) - 20;
  ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
  ctx.fillRect(0, scanY - 10, w, 20);
  ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
  ctx.fillRect(0, scanY - 1, w, 2);
}

// === Art: Paint strokes / brush trails ===
function drawArt(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, _nodes: { x: number; y: number; vx: number; vy: number }[]) {
  const cx = w / 2;
  const cy = h / 2;

  // Flowing brush strokes
  for (let s = 0; s < 6; s++) {
    ctx.beginPath();
    const startX = w * 0.1 + s * w * 0.15;
    const startY = h * 0.2 + Math.sin(s * 1.5) * h * 0.15;

    ctx.moveTo(startX, startY);
    for (let p = 0; p < 40; p++) {
      const px = startX + p * (w * 0.02) + Math.sin(t * 0.4 + p * 0.3 + s) * 20;
      const py = startY + p * (h * 0.018) + Math.cos(t * 0.3 + p * 0.25 + s * 0.7) * 25;
      ctx.lineTo(px, py);
    }

    const colors = [
      `rgba(0, 240, 255, ${0.25 + Math.sin(t * 0.5 + s) * 0.1})`,
      `rgba(230, 25, 160, ${0.2 + Math.sin(t * 0.4 + s) * 0.08})`,
      `rgba(191, 0, 255, ${0.18 + Math.sin(t * 0.6 + s) * 0.07})`,
    ];
    ctx.strokeStyle = colors[s % 3];
    ctx.lineWidth = 2 + Math.sin(t + s) * 1;
    ctx.lineCap = "round";
    ctx.stroke();

    // Glow
    ctx.strokeStyle = colors[s % 3].replace(/[\d.]+\)$/, `${0.08})`);
    ctx.lineWidth = 6 + Math.sin(t + s) * 2;
    ctx.stroke();
  }

  // Paint splatter dots
  for (let i = 0; i < 25; i++) {
    const angle = t * 0.2 + i * 0.8;
    const dist = 60 + i * 8 + Math.sin(t * 0.5 + i * 0.4) * 20;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * 0.7;
    const size = 1.5 + Math.sin(t * 1.2 + i) * 1;

    if (i % 3 === 0) ctx.fillStyle = `rgba(0, 240, 255, ${0.4 + Math.sin(t + i) * 0.2})`;
    else if (i % 3 === 1) ctx.fillStyle = `rgba(230, 25, 160, ${0.3 + Math.sin(t + i) * 0.15})`;
    else ctx.fillStyle = `rgba(191, 0, 255, ${0.25 + Math.sin(t + i) * 0.1})`;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// === Infrastructure: Server rack / data flow ===
function drawInfra(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, _nodes: { x: number; y: number; vx: number; vy: number }[]) {
  const rackCount = 3;
  const rackW = 100;
  const rackH = 200;
  const spacing = w / (rackCount + 1);

  for (let r = 0; r < rackCount; r++) {
    const rx = spacing * (r + 1) - rackW / 2;
    const ry = h / 2 - rackH / 2 + Math.sin(t * 0.3 + r) * 5;

    // Rack outline
    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rackW, rackH);

    // Server units
    const unitCount = 6;
    const unitH = rackH / unitCount - 4;
    for (let u = 0; u < unitCount; u++) {
      const uy = ry + u * (unitH + 4) + 2;
      ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
      ctx.fillRect(rx + 4, uy, rackW - 8, unitH);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.2)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(rx + 4, uy, rackW - 8, unitH);

      // Blinking light
      const blink = Math.sin(t * 3 + r * 2 + u * 1.5) > 0.3;
      ctx.beginPath();
      ctx.arc(rx + 15, uy + unitH / 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = blink ? "rgba(0, 255, 120, 0.7)" : "rgba(0, 255, 120, 0.15)";
      ctx.fill();

      // Activity bar
      const activity = (Math.sin(t * 2 + u * 0.7 + r) * 0.5 + 0.5) * (rackW - 40);
      ctx.fillStyle = "rgba(0, 240, 255, 0.2)";
      ctx.fillRect(rx + 25, uy + unitH / 2 - 1.5, activity, 3);
    }

    // Data flow lines between racks
    if (r < rackCount - 1) {
      const nextRx = spacing * (r + 2) - rackW / 2;
      for (let l = 0; l < 3; l++) {
        const ly = ry + rackH * (0.25 + l * 0.25);
        ctx.beginPath();
        ctx.moveTo(rx + rackW, ly);
        ctx.lineTo(nextRx, ly + Math.sin(t + l) * 10);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Data packet
        const pkt = (t * 0.5 + l * 0.3 + r) % 1;
        const px = rx + rackW + (nextRx - rx - rackW) * pkt;
        const py = ly + (Math.sin(t + l) * 10) * pkt;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 240, 255, 0.6)";
        ctx.fill();
      }
    }
  }
}

// === Creative: Flowing particles / generative swirl ===
function drawCreative(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, nodes: { x: number; y: number; vx: number; vy: number }[]) {
  const cx = w / 2;
  const cy = h / 2;

  // Spiraling particles
  for (let i = 0; i < 80; i++) {
    const angle = t * 0.3 + i * 0.2;
    const radius = 30 + i * 2.5 + Math.sin(t * 0.5 + i * 0.1) * 15;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.8;
    const size = 1 + Math.sin(t + i * 0.3) * 0.8;
    const alpha = 0.15 + Math.sin(t * 1.5 + i * 0.2) * 0.15;

    // Alternate colors
    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
    } else if (i % 3 === 1) {
      ctx.fillStyle = `rgba(230, 25, 160, ${alpha * 0.7})`;
    } else {
      ctx.fillStyle = `rgba(191, 0, 255, ${alpha * 0.5})`;
    }

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    const prevAngle = angle - 0.15;
    const prevRadius = radius - 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx + Math.cos(prevAngle) * prevRadius, cy + Math.sin(prevAngle) * prevRadius * 0.8);
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

// === Design: Grid + golden ratio spiral ===
function drawDesign(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, _nodes: { x: number; y: number; vx: number; vy: number }[]) {
  // Rule of thirds grid
  ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(w * i / 3, 0);
    ctx.lineTo(w * i / 3, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, h * i / 3);
    ctx.lineTo(w, h * i / 3);
    ctx.stroke();
  }

  // Golden spiral
  const phi = 1.618;
  let sx = w * 0.1;
  let sy = h * 0.1;
  let sw = w * 0.8;
  let sh = h * 0.8;

  ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 + Math.sin(t * 0.5) * 0.1})`;
  ctx.lineWidth = 1.2;

  for (let i = 0; i < 8; i++) {
    const quarter = i % 4;
    ctx.beginPath();
    if (quarter === 0) {
      ctx.arc(sx + sw, sy + sh, sw, Math.PI, Math.PI * 1.5);
      sy += sh - sw / phi;
      sh = sw / phi;
    } else if (quarter === 1) {
      ctx.arc(sx, sy + sh, sh, Math.PI * 1.5, 0);
      sw = sh / phi;
    } else if (quarter === 2) {
      ctx.arc(sx, sy, sw, 0, Math.PI * 0.5);
      sx += sw - sh / phi;
      sh = sh;
      sw = sh / phi;
    } else {
      ctx.arc(sx + sw, sy, sh, Math.PI * 0.5, Math.PI);
      sh = sw / phi;
    }
    ctx.stroke();

    // Pulse on spiral
    const pulsePos = (t * 0.2 + i * 0.1) % 1;
    if (Math.abs(pulsePos - 0.5) < 0.1) {
      ctx.beginPath();
      ctx.arc(sx + sw * 0.5, sy + sh * 0.5, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.5)";
      ctx.fill();
    }
  }

  // Floating measurement marks
  for (let i = 0; i < 5; i++) {
    const mx = w * 0.15 + i * w * 0.17;
    const my = h * 0.3 + Math.sin(t * 0.4 + i) * 20;
    const mh = 40 + Math.sin(t * 0.3 + i * 0.8) * 15;
    ctx.strokeStyle = "rgba(230, 25, 160, 0.15)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, my + mh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - 5, my);
    ctx.lineTo(mx + 5, my);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - 5, my + mh);
    ctx.lineTo(mx + 5, my + mh);
    ctx.stroke();
  }
}
