import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  color,
  dot,
  emissive,
  float,
  Fn,
  fract,
  mix,
  mrt,
  output,
  pass,
  positionLocal,
  sin,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import AtmosphericParticles from "~/components/three/effects/AtmosphericParticles";
import GlitchText from "~/components/three/effects/GlitchText";
import NetworkLattice from "~/components/three/effects/NetworkLattice";
import { bloom } from "~/components/three/tsl/BloomNode.js";

export default function HeroScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <WebGPUCanvas className="!absolute inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <fog attach="fog" args={["#0f0825", 15, 50]} />

      {/* Lighting (same palette as the unchainedx.io hero) */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 8, 2]} intensity={4} color="#00F0FF" distance={40} decay={2} />
      <pointLight position={[-8, 4, 4]} intensity={3} color="#BF00FF" distance={30} decay={2} />
      <pointLight position={[5, -1, 3]} intensity={2.5} color="#BF00FF" distance={20} decay={2} />
      <pointLight position={[0, 0, 6]} intensity={1.2} color="#E0E0FF" distance={20} decay={2} />

      {/* Background shimmer — same TSL FBM fog as unchainedx.io */}
      <HeroFog />

      {/* Main object: rotating lattice globe. 1 anchor pole stays; the other 2
          brand poles fade in/out and relocate. */}
      <NetworkLattice position={[0, 0, -1.4]} radius={2.3} spin={0.07} persistentCount={1} />

      {/* Drifting particles */}
      <AtmosphericParticles
        count={150}
        color="#00F0FF"
        size={0.015}
        speed={0.08}
        area={[25, 15, 30]}
      />
      <AtmosphericParticles
        count={80}
        color="#BF00FF"
        size={0.012}
        speed={0.06}
        area={[20, 12, 25]}
      />

      {/* 3D text — same positions as the unchainedx.io hero (title / tagline) */}
      <GlitchText position={[0, 0.3, 0.5]} size={0.3} depth={0.06} emissiveIntensity={1.5}>
        UnchainedX DAO
      </GlitchText>
      <GlitchText
        position={[0, -0.4, 0.5]}
        size={0.07}
        depth={0.008}
        emissiveIntensity={1.0}
        glitchIntensity={0.2}
      >
        A DAO that experimentally researches, architects, and expands worldwide protocols and networks
      </GlitchText>

      {/* Selective bloom on emissive (the neon glow) — same technique as uxio */}
      <HeroPostProcessing />
    </WebGPUCanvas>
  );
}

// Emissive-only bloom via a native WebGPU RenderPipeline (ported from the
// unchainedx.io hero post-processing, minus the scroll-transition logic).
function HeroPostProcessing({ strength = 1.2, radius = 0.4, exposure = 1.0 }) {
  const { gl, scene, camera, size } = useThree();
  const pipelineRef = useRef<THREE.RenderPipeline | null>(null);

  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;

    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    const emissiveTex = scenePass.getTexture("emissive");
    emissiveTex.type = THREE.UnsignedByteType;
    const outputNode = scenePass.getTextureNode();
    const emissiveNode = scenePass.getTextureNode("emissive");
    const bloomNode = bloom(emissiveNode, strength, radius);

    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = outputNode.add(bloomNode);
    pipelineRef.current = pipeline;

    return () => {
      pipelineRef.current = null;
    };
  }, [gl, scene, camera, size, strength, radius, exposure]);

  // Priority > 0 takes over rendering from R3F's auto-render.
  useFrame(() => {
    pipelineRef.current?.renderAsync();
  }, 1);

  return null;
}

// FBM noise fog sphere — ported verbatim from the unchainedx.io hero background.
function HeroFog() {
  const uTime = useMemo(() => uniform(0.0), []);

  const hash = Fn(([p]: [any]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
  });

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

    return baseColor.add(cyanWisp).add(purpleWisp).add(amberWisp).add(whiteHaze);
  }, [uTime, hash, noise, fbm]);

  useFrame(({ clock }) => {
    uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <sphereGeometry args={[30, 12, 12]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}
