import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

// Hero background "main object": a slowly rotating lattice globe whose surface
// is crawled by dendritic tendrils growing out of three BRAND POLES that fade
// in, grow, then fade out and re-appear elsewhere (cyan / magenta / electric-
// blue = the three glowing circles of the UXD mark). Light packets travel the
// great-circle arcs between live poles. Derived from the "H6 Synthesis" study.
//
// Emissive MeshStandardMaterials feed the scene's existing selective-bloom MRT
// pass, so the poles/packets glow for free. The tendril LineSegments use
// additive blending (they don't need bloom to read as thin neon threads).

interface NetworkLatticeProps {
  position?: [number, number, number];
  /** World radius of the globe. */
  radius?: number;
  /** Rotation speed (radians/sec). */
  spin?: number;
  /** How many of the 3 brand poles are "anchors" that stay instead of fading out. */
  persistentCount?: number;
  active?: boolean;
}

type V3 = { x: number; y: number; z: number };

const BRAND = [
  new THREE.Color("#00F0FF"), // cyan
  new THREE.Color("#FF00F5"), // magenta
  new THREE.Color("#3B5BFF"), // electric blue
];

const MAX_EDGES = 2600;
const GROW_STEP = 0.048; // seconds between growth ticks (lower = faster/denser)
const EDGE_DECAY = 0.1; // life units/sec  (~10s lifetime)
const GEO_STEP = 0.13; // geodesic step angle per growth tick
const BG_POINTS = 58;
const RESEED = 1.4; // seconds between fresh tendril bursts from a live pole

const norm = (v: V3): V3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
function randDir(): V3 {
  const u = rand(-1, 1);
  const th = rand(0, Math.PI * 2);
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(th), y: u, z: s * Math.sin(th) };
}
function slerp(a: V3, b: V3, t: number): V3 {
  const d = Math.max(-1, Math.min(1, dot(a, b)));
  const o = Math.acos(d);
  if (o < 1e-4) return { ...a };
  const s = Math.sin(o);
  const w1 = Math.sin((1 - t) * o) / s;
  const w2 = Math.sin(t * o) / s;
  return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
}

// --- "Front Shell" depth occlusion ---------------------------------------
// The group is tilted by GROUP_TILT on X, then spun on Y. We replicate THREE's
// Euler 'XYZ' transform to get each point's camera-facing z, so we can dim the
// far hemisphere every frame (camera looks down -Z, so larger z = nearer).
const GROUP_TILT = 0.42;
const TILT_S = Math.sin(GROUP_TILT);
const TILT_C = Math.cos(GROUP_TILT);
// depth: 0 = far side, 1 = near side, for a unit-sphere point at spin (ca,sa).
function depthOf(lx: number, ly: number, lz: number, ca: number, sa: number) {
  const worldZ = TILT_S * ly + TILT_C * (ca * lz - sa * lx);
  return (worldZ + 1) / 2;
}
// "Hue Depth" (D2): depth is carried by COLOUR, not occlusion. The near side
// reads cyan, the far side sinks to a dim magenta/purple, and everything stays
// faintly visible on the back (no hard shell). Brightness still rises to front.
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const HUE_NEAR = [0.0, 0.94, 1.0]; // cyan (front)
const HUE_FAR = [0.75, 0.03, 0.75]; // dim magenta/purple (back)
// solid emissive bodies (poles / dots / packets): dim toward the back but keep
// them present rather than hiding them.
const bodyFade = (d: number) => 0.35 + 0.65 * d;

type Pole = {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  color: THREE.Color;
  dir: V3;
  phase: "in" | "live" | "out" | "gone";
  timer: number;
  intensity: number;
  persistent: boolean; // anchor poles never fade out — they stay & keep growing
  reseed: number; // countdown to the next tendril burst while live
};

type Branch = { p: V3; t: V3; pole: number; gen: number; alive: boolean };

type Packet = {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  active: boolean;
  a: V3;
  b: V3;
  t: number;
};

function buildSystem(radius: number, persistentCount: number, spin: number) {
  const group = new THREE.Group();
  group.rotation.x = GROUP_TILT; // fixed tilt so we view the globe slightly from above
  const disposables: { dispose: () => void }[] = [];
  let elapsed = 0;
  let ang = 0; // current Y-spin — owned here so depth math stays in sync

  // --- faint background globe (fibonacci sphere + near-neighbour links) ---
  const bg: V3[] = [];
  for (let i = 0; i < BG_POINTS; i++) {
    const y = 1 - (i / (BG_POINTS - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    bg.push({ x: Math.cos(th) * rr, y, z: Math.sin(th) * rr });
  }
  const bgSeg: number[] = [];
  const bgUnit: number[] = []; // parallel unit coords, for per-frame depth
  for (let i = 0; i < BG_POINTS; i++) {
    for (let j = i + 1; j < BG_POINTS; j++) {
      const dx = bg[i].x - bg[j].x;
      const dy = bg[i].y - bg[j].y;
      const dz = bg[i].z - bg[j].z;
      if (dx * dx + dy * dy + dz * dz < 0.16) {
        bgSeg.push(bg[i].x * radius, bg[i].y * radius, bg[i].z * radius);
        bgSeg.push(bg[j].x * radius, bg[j].y * radius, bg[j].z * radius);
        bgUnit.push(bg[i].x, bg[i].y, bg[i].z, bg[j].x, bg[j].y, bg[j].z);
      }
    }
  }
  const bgVerts = bgUnit.length / 3;
  const bgColors = new Float32Array(bgVerts * 3);
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute("position", new THREE.Float32BufferAttribute(bgSeg, 3));
  const bgColAttr = new THREE.BufferAttribute(bgColors, 3);
  bgColAttr.setUsage(THREE.DynamicDrawUsage);
  bgGeo.setAttribute("color", bgColAttr);
  const bgMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  group.add(new THREE.LineSegments(bgGeo, bgMat));
  disposables.push(bgGeo, bgMat);

  // faint interior core — a single additive sprite at the centre. Deliberately
  // weak: it only seats the sphere in space, it is not a focal glow.
  const coreCanvas = document.createElement("canvas");
  coreCanvas.width = coreCanvas.height = 128;
  const cctx = coreCanvas.getContext("2d");
  if (cctx) {
    const cg = cctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    cg.addColorStop(0, "rgba(150,210,255,1)");
    cg.addColorStop(0.5, "rgba(150,60,255,0.32)");
    cg.addColorStop(1, "rgba(0,0,0,0)");
    cctx.fillStyle = cg;
    cctx.fillRect(0, 0, 128, 128);
  }
  const coreTex = new THREE.CanvasTexture(coreCanvas);
  const coreMat = new THREE.SpriteMaterial({
    map: coreTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    toneMapped: false,
  });
  const core = new THREE.Sprite(coreMat);
  core.scale.setScalar(radius * 1.9);
  group.add(core);
  disposables.push(coreTex, coreMat);

  // dim node dots on the background globe
  const dotGeo = new THREE.SphereGeometry(radius * 0.008, 5, 5);
  const dotMat = new THREE.MeshStandardMaterial({
    color: "#6a6ab0",
    emissive: "#4a4a90",
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    toneMapped: false,
  });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, BG_POINTS);
  const m = new THREE.Matrix4();
  for (let i = 0; i < BG_POINTS; i++) {
    m.setPosition(bg[i].x * radius, bg[i].y * radius, bg[i].z * radius);
    dots.setMatrixAt(i, m);
  }
  dots.instanceMatrix.needsUpdate = true;
  dots.frustumCulled = false;
  group.add(dots);
  disposables.push(dotGeo, dotMat);

  // --- growing tendrils (dynamic additive LineSegments, ring buffer) ---
  const positions = new Float32Array(MAX_EDGES * 2 * 3);
  const colors = new Float32Array(MAX_EDGES * 2 * 3);
  const edgeLife = new Float32Array(MAX_EDGES); // 0 = free
  const edgeBase = new Float32Array(MAX_EDGES * 3); // base rgb
  const edgeDir = new Float32Array(MAX_EDGES * 6); // unit endpoints, for depth
  let writeHead = 0;
  const tendrilGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const colAttr = new THREE.BufferAttribute(colors, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  colAttr.setUsage(THREE.DynamicDrawUsage);
  tendrilGeo.setAttribute("position", posAttr);
  tendrilGeo.setAttribute("color", colAttr);
  const tendrilMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  group.add(new THREE.LineSegments(tendrilGeo, tendrilMat));
  disposables.push(tendrilGeo, tendrilMat);

  function addEdge(p1: V3, p2: V3, c: THREE.Color) {
    const e = writeHead;
    const o = e * 6;
    positions[o] = p1.x * radius;
    positions[o + 1] = p1.y * radius;
    positions[o + 2] = p1.z * radius;
    positions[o + 3] = p2.x * radius;
    positions[o + 4] = p2.y * radius;
    positions[o + 5] = p2.z * radius;
    edgeBase[e * 3] = c.r;
    edgeBase[e * 3 + 1] = c.g;
    edgeBase[e * 3 + 2] = c.b;
    const eo = e * 6;
    edgeDir[eo] = p1.x;
    edgeDir[eo + 1] = p1.y;
    edgeDir[eo + 2] = p1.z;
    edgeDir[eo + 3] = p2.x;
    edgeDir[eo + 4] = p2.y;
    edgeDir[eo + 5] = p2.z;
    edgeLife[e] = 1;
    writeHead = (writeHead + 1) % MAX_EDGES;
    posAttr.needsUpdate = true;
  }

  // --- three brand poles ---
  const poleGeo = new THREE.SphereGeometry(radius * 0.03, 12, 12);
  disposables.push(poleGeo);
  const poles: Pole[] = BRAND.map((color, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 3,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(poleGeo, mat);
    mesh.frustumCulled = false;
    group.add(mesh);
    disposables.push(mat);
    const persistent = i < persistentCount;
    // stagger the initial lifecycle so ephemeral poles don't blink in unison
    const starts: Pole["phase"][] = ["live", "in", "gone"];
    return {
      mesh,
      mat,
      color,
      dir: randDir(),
      phase: persistent ? ("live" as const) : starts[i],
      timer: persistent ? Infinity : [rand(2, 4), 0.8, rand(0.6, 1.8)][i],
      intensity: persistent ? 1 : 0,
      persistent,
      reseed: rand(0, RESEED),
    };
  });

  const branches: Branch[] = [];
  function spawnBranches(poleIdx: number, dir: V3, n = 3) {
    for (let k = 0; k < n; k++) {
      const t = norm(cross(dir, randDir()));
      branches.push({ p: { ...dir }, t, pole: poleIdx, gen: 0, alive: true });
    }
  }

  // --- packets ---
  const packetGeo = new THREE.SphereGeometry(radius * 0.02, 8, 8);
  disposables.push(packetGeo);
  const packets: Packet[] = Array.from({ length: 5 }, () => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 4,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(packetGeo, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    group.add(mesh);
    disposables.push(mat);
    return { mesh, mat, active: false, a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: 0, z: 0 }, t: 0 };
  });

  let growAcc = 0;
  let packetAcc = 0;

  function update(dt: number) {
    // clamp dt (tab refocus etc.)
    if (dt > 0.06) dt = 0.06;
    elapsed += dt;

    // spin the globe (owned here so the depth math below stays in sync)
    ang += dt * spin;
    group.rotation.y = ang;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);

    // --- depth-shade the background wireframe (front shell) ---
    for (let v = 0; v < bgVerts; v++) {
      const u = v * 3;
      const d = depthOf(bgUnit[u], bgUnit[u + 1], bgUnit[u + 2], ca, sa);
      const b = 0.05 + d * 0.12; // dim wireframe, a touch brighter toward front
      bgColors[u] = lerp(HUE_FAR[0], HUE_NEAR[0], d) * b; // magenta(far)→cyan(near)
      bgColors[u + 1] = lerp(HUE_FAR[1], HUE_NEAR[1], d) * b;
      bgColors[u + 2] = lerp(HUE_FAR[2], HUE_NEAR[2], d) * b;
    }
    bgColAttr.needsUpdate = true;

    // --- depth-scale the background dots (hide far ones) ---
    for (let i = 0; i < BG_POINTS; i++) {
      const d = depthOf(bg[i].x, bg[i].y, bg[i].z, ca, sa);
      const s = bodyFade(d);
      m.makeScale(s, s, s);
      m.setPosition(bg[i].x * radius, bg[i].y * radius, bg[i].z * radius);
      dots.setMatrixAt(i, m);
    }
    dots.instanceMatrix.needsUpdate = true;

    // --- pole lifecycles ---
    for (let pi = 0; pi < poles.length; pi++) {
      const pole = poles[pi];

      if (pole.persistent) {
        // anchor pole: stays live, gentle breathing pulse, keeps growing
        pole.phase = "live";
        pole.intensity = 0.82 + 0.18 * Math.sin(elapsed * 1.6 + pi);
      } else {
        pole.timer -= dt;
        if (pole.timer <= 0) {
          if (pole.phase === "gone") {
            pole.dir = randDir();
            pole.phase = "in";
            pole.timer = 0.6;
            pole.reseed = 0;
          } else if (pole.phase === "in") {
            pole.phase = "live";
            pole.timer = rand(2.2, 4);
          } else if (pole.phase === "live") {
            pole.phase = "out";
            pole.timer = 0.8;
            for (const b of branches) if (b.pole === pi) b.alive = false;
          } else {
            pole.phase = "gone";
            pole.timer = rand(0.9, 2.2);
          }
        }
        // intensity envelope
        if (pole.phase === "in") pole.intensity = 1 - pole.timer / 0.6;
        else if (pole.phase === "live") pole.intensity = 1;
        else if (pole.phase === "out") pole.intensity = pole.timer / 0.8;
        else pole.intensity = 0;
      }

      // continuous tendril bursts while a pole is (nearly) live
      if (pole.intensity > 0.6) {
        pole.reseed -= dt;
        if (pole.reseed <= 0) {
          pole.reseed = rand(RESEED * 0.7, RESEED * 1.3);
          spawnBranches(pi, pole.dir, pole.persistent ? 2 : 3);
        }
      }

      const it = Math.max(0, Math.min(1, pole.intensity));
      // hue-depth: dim (not hide) poles on the far hemisphere
      const pd = depthOf(pole.dir.x, pole.dir.y, pole.dir.z, ca, sa);
      const vis = it * bodyFade(pd);
      pole.mesh.visible = vis > 0.02;
      if (pole.mesh.visible) {
        pole.mesh.position.set(pole.dir.x * radius, pole.dir.y * radius, pole.dir.z * radius);
        pole.mesh.scale.setScalar(0.5 + it * 0.9);
        pole.mat.emissiveIntensity = 3 * vis;
        pole.mat.opacity = vis;
      }
    }

    // --- grow tendrils ---
    growAcc += dt;
    while (growAcc >= GROW_STEP) {
      growAcc -= GROW_STEP;
      const next: Branch[] = [];
      for (const br of branches) {
        if (!br.alive) continue;
        const da = GEO_STEP;
        const np = norm({
          x: br.p.x * Math.cos(da) + br.t.x * Math.sin(da),
          y: br.p.y * Math.cos(da) + br.t.y * Math.sin(da),
          z: br.p.z * Math.cos(da) + br.t.z * Math.sin(da),
        });
        let nt = norm({
          x: br.t.x * Math.cos(da) - br.p.x * Math.sin(da),
          y: br.t.y * Math.cos(da) - br.p.y * Math.sin(da),
          z: br.t.z * Math.cos(da) - br.p.z * Math.sin(da),
        });
        const bn = norm(cross(np, nt));
        const e = rand(-0.3, 0.3);
        nt = norm({
          x: nt.x * Math.cos(e) + bn.x * Math.sin(e),
          y: nt.y * Math.cos(e) + bn.y * Math.sin(e),
          z: nt.z * Math.cos(e) + bn.z * Math.sin(e),
        });
        addEdge(br.p, np, poles[br.pole].color);
        if (br.gen < 24) next.push({ p: np, t: nt, pole: br.pole, gen: br.gen + 1, alive: true });
        if (Math.random() < 0.11 && next.length < 60) {
          const bn2 = norm(cross(np, nt));
          next.push({ p: np, t: bn2, pole: br.pole, gen: br.gen + 1, alive: true });
        }
      }
      // keep dead branches out; cap total
      branches.length = 0;
      for (const b of next) branches.push(b);
      if (branches.length > 150) branches.splice(0, branches.length - 150);
    }

    // --- decay + recolor edges ---
    for (let e = 0; e < MAX_EDGES; e++) {
      let life = edgeLife[e];
      if (life <= 0) continue;
      life -= dt * EDGE_DECAY;
      if (life < 0) life = 0;
      edgeLife[e] = life;
      const o = e * 6;
      // hue-depth: colour = cyan(near)→magenta(far), brightness rises to front.
      const d1 = depthOf(edgeDir[o], edgeDir[o + 1], edgeDir[o + 2], ca, sa);
      const d2 = depthOf(edgeDir[o + 3], edgeDir[o + 4], edgeDir[o + 5], ca, sa);
      const b1 = life * (0.05 + d1 * 0.5);
      const b2 = life * (0.05 + d2 * 0.5);
      colors[o] = lerp(HUE_FAR[0], HUE_NEAR[0], d1) * b1;
      colors[o + 1] = lerp(HUE_FAR[1], HUE_NEAR[1], d1) * b1;
      colors[o + 2] = lerp(HUE_FAR[2], HUE_NEAR[2], d1) * b1;
      colors[o + 3] = lerp(HUE_FAR[0], HUE_NEAR[0], d2) * b2;
      colors[o + 4] = lerp(HUE_FAR[1], HUE_NEAR[1], d2) * b2;
      colors[o + 5] = lerp(HUE_FAR[2], HUE_NEAR[2], d2) * b2;
    }
    colAttr.needsUpdate = true;

    // --- packets between live poles ---
    packetAcc += dt;
    const livePoles = poles.filter((p) => p.phase === "live" || p.phase === "in");
    if (packetAcc > 1.0 && livePoles.length >= 2) {
      packetAcc = 0;
      const free = packets.find((p) => !p.active);
      if (free) {
        const a = livePoles[(Math.random() * livePoles.length) | 0];
        let b = livePoles[(Math.random() * livePoles.length) | 0];
        if (b === a) b = livePoles[(livePoles.indexOf(a) + 1) % livePoles.length];
        free.active = true;
        free.a = { ...a.dir };
        free.b = { ...b.dir };
        free.t = 0;
        free.mat.color.copy(a.color);
        free.mat.emissive.copy(a.color);
        free.mesh.visible = true;
      }
    }
    for (const pk of packets) {
      if (!pk.active) continue;
      pk.t += dt * 0.8;
      if (pk.t >= 1) {
        pk.active = false;
        pk.mesh.visible = false;
        continue;
      }
      const s = slerp(pk.a, pk.b, pk.t);
      pk.mesh.position.set(s.x * radius, s.y * radius, s.z * radius);
      const shell = bodyFade(depthOf(s.x, s.y, s.z, ca, sa));
      const fade = Math.sin(pk.t * Math.PI) * shell;
      pk.mesh.visible = fade > 0.02;
      pk.mat.opacity = fade;
      pk.mat.emissiveIntensity = 4 * fade;
    }
  }

  return { group, update, dispose: () => disposables.forEach((d) => d.dispose()) };
}

export default function NetworkLattice({
  position = [0, 0, 0],
  radius = 2,
  spin = 0.08,
  persistentCount = 1,
  active = true,
}: NetworkLatticeProps) {
  const system = useMemo(
    () => buildSystem(radius, persistentCount, spin),
    [radius, persistentCount, spin],
  );

  useEffect(() => () => system.dispose(), [system]);

  useFrame((_, delta) => {
    if (!active) return;
    system.update(delta); // rotation is applied inside update()
  });

  return <primitive object={system.group} position={position} />;
}
