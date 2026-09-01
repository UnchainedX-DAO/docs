import * as THREE from "three";

const SIZE = 256;
const DECAY = 0.97;
const SPLAT_RADIUS_MIN = 8;
const SPLAT_RADIUS_MAX = 40;

export class Flowmap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    this.ctx = this.canvas.getContext("2d")!;
    // Fill black initially
    this.ctx.fillStyle = "#808000";
    this.ctx.fillRect(0, 0, SIZE, SIZE);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  update(mx: number, my: number, vx: number, vy: number) {
    const ctx = this.ctx;

    // Decay previous frame
    ctx.globalAlpha = DECAY;
    ctx.drawImage(this.canvas, 0, 0);

    // Reset to neutral (0.5, 0.5) where no velocity
    ctx.globalAlpha = 1 - DECAY;
    ctx.fillStyle = "#808000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = 1;

    // Splat at mouse position
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.0001) {
      this.texture.needsUpdate = true;
      return;
    }

    const px = mx * SIZE;
    const py = (1 - my) * SIZE; // Flip Y — screen Y is top-down, texture Y is bottom-up
    const radius = Math.min(SPLAT_RADIUS_MAX, SPLAT_RADIUS_MIN + speed * 3000);

    // Velocity mapped to color: 0.5 = no velocity, 0 = negative, 1 = positive
    const r = Math.floor(Math.max(0, Math.min(255, (vx * 80 + 0.5) * 255)));
    const g = Math.floor(Math.max(0, Math.min(255, (vy * 80 + 0.5) * 255)));

    const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
    grad.addColorStop(0, `rgba(${r},${g},0,1)`);
    grad.addColorStop(1, `rgba(${r},${g},0,0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
