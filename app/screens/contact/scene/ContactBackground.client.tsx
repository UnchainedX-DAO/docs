import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  color,
  dot,
  float,
  Fn,
  fract,
  mix,
  positionLocal,
  sin,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import AtmosphericParticles from "~/components/three/effects/AtmosphericParticles";

// Fixed full-viewport background for /contact: the same fbm domain-warp shimmer
// as the rest of the site, but a calmer, company-leaning palette — "Graphite &
// Steel" (study C2). Fog only (no aurora / no bloom), stronger warp so the
// shimmer still reads.
export default function ContactBackground() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <fog attach="fog" args={["#0d0f14", 15, 50]} />
      <SteelFog />
      <AtmosphericParticles count={40} color="#5a8a96" size={0.012} speed={0.04} area={[24, 14, 28]} />
    </WebGPUCanvas>
  );
}

function SteelFog() {
  const uTime = useMemo(() => uniform(0.0), []);

  const hash = Fn(([p]: [any]) => fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453)));
  const noise = Fn(([p]: [any]) => {
    const i = vec2(p.x.floor(), p.y.floor());
    const f = vec2(fract(p.x), fract(p.y));
    const u = f.mul(f).mul(float(3).sub(f.mul(2)));
    const a = hash(i);
    const b = hash(i.add(vec2(1, 0)));
    const c = hash(i.add(vec2(0, 1)));
    const d = hash(i.add(vec2(1, 1)));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  });
  const fbm = Fn(([p]: [any]) => {
    const o1 = noise(p).mul(0.5);
    const o2 = noise(p.mul(2.0).add(3.7)).mul(0.25);
    const o3 = noise(p.mul(4.0).add(7.3)).mul(0.125);
    const o4 = noise(p.mul(8.0).add(13.1)).mul(0.0625);
    return o1.add(o2).add(o3).add(o4);
  });

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // C2 — Graphite & Steel
    const deepColor = color("#0d0f14");
    const midColor = color("#141922");
    const highColor = color("#1c232e");

    const heightMix = p.y.div(30).add(0.5);

    const noiseInput1 = vec2(
      p.x.mul(0.25).add(t.mul(0.15)),
      p.z.mul(0.25).add(p.y.mul(0.1)).add(t.mul(0.12)),
    );
    const noiseInput2 = vec2(
      p.z.mul(0.2).sub(t.mul(0.1)),
      p.y.mul(0.2).add(p.x.mul(0.15)).sub(t.mul(0.13)),
    );

    const n1 = fbm(noiseInput1);
    const n2 = fbm(noiseInput2);
    // stronger domain warp so the shimmer reads even with the calm palette
    const warped = fbm(noiseInput2.add(vec2(n1.mul(2.0), n1.mul(1.6))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));

    const baseColor = mix(deepColor, mix(midColor, highColor, heightMix), fog);

    const steelWisp = vec3(float(0.2), float(0.45), float(0.5)).mul(fog).mul(0.1);
    const steelWisp2 = vec3(float(0.3), float(0.4), float(0.45)).mul(n2).mul(0.05);
    const haze = vec3(float(0.8), float(0.82), float(0.85)).mul(fog.sub(0.5).max(0)).mul(0.1);

    return baseColor.add(steelWisp).add(steelWisp2).add(haze);
  }, [uTime, hash, noise, fbm]);

  useFrame(({ clock }) => {
    uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <sphereGeometry args={[30, 16, 16]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}
