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
  smoothstep,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import AtmosphericParticles from "~/components/three/effects/AtmosphericParticles";

// Fixed full-viewport background for /docs: the unchainedx HeroFog shimmer with
// an added "Aurora Veil" (drifting cyan↔magenta sheets = study concept A6).
// The title is 2D (in DocsScreen, matching the portfolio/lower-page header);
// this scene is purely the atmospheric backdrop.
export default function DocsBackground() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      <ambientLight intensity={0.1} />
      <pointLight position={[0, 8, 2]} intensity={3} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[-8, 4, 4]} intensity={2.4} color="#BF00FF" distance={30} decay={2} />
      <pointLight position={[0, 0, 6]} intensity={1} color="#E0E0FF" distance={20} decay={2} />

      <AuroraFog />

      <AtmosphericParticles count={80} color="#00F0FF" size={0.014} speed={0.05} area={[25, 15, 30]} />
      <AtmosphericParticles count={44} color="#BF00FF" size={0.012} speed={0.045} area={[20, 12, 25]} />
    </WebGPUCanvas>
  );
}

// HeroFog + Aurora Veil (A6): same fbm / domain warp / palette as the hero,
// with extra drifting cyan↔magenta sheets.
function AuroraFog() {
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

    const deepColor = color("#120a1e");
    const midColor = color("#1a1230");
    const highColor = color("#221840");

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
    const warped = fbm(noiseInput2.add(vec2(n1.mul(1.8), n1.mul(1.4))));

    const fog = n1.mul(0.35).add(warped.mul(0.65));

    const baseColor = mix(deepColor, mix(midColor, highColor, heightMix), fog);

    const cyanWisp = vec3(float(0.0), float(0.6), float(0.7)).mul(fog).mul(0.13);
    const purpleWisp = vec3(float(0.4), float(0.0), float(0.5)).mul(n2).mul(0.1);
    const amberWisp = vec3(float(0.6), float(0.3), float(0.0)).mul(warped.sub(0.4).max(0)).mul(0.13);
    const whiteHaze = vec3(float(0.7), float(0.65), float(0.75)).mul(fog.sub(0.4).max(0)).mul(0.15);

    // --- Aurora Veil (A6): drifting cyan↔magenta sheets with vertical falloff ---
    const vfall = smoothstep(float(0.75), float(0.15), heightMix);
    const auroraField = fbm(vec2(p.x.mul(0.06).add(t.mul(0.1)), p.y.mul(0.12).sub(t.mul(0.05))));
    const sheet = smoothstep(float(0.35), float(0.65), auroraField).mul(vfall);
    const auroraColor = mix(
      vec3(float(0.0), float(0.85), float(1.0)),
      vec3(float(1.0), float(0.0), float(0.9)),
      auroraField,
    );
    const aurora = auroraColor.mul(sheet).mul(0.16);

    const auroraField2 = fbm(vec2(p.x.mul(0.045).sub(t.mul(0.08)), p.y.mul(0.09).add(5.0)));
    const aurora2 = vec3(float(0.5), float(0.2), float(0.9))
      .mul(smoothstep(float(0.5), float(0.8), auroraField2))
      .mul(smoothstep(float(0.9), float(0.3), heightMix))
      .mul(0.1);

    return baseColor
      .add(cyanWisp)
      .add(purpleWisp)
      .add(amberWisp)
      .add(whiteHaze)
      .add(aurora)
      .add(aurora2);
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
