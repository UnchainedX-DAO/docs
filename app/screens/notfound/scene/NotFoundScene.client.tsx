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
import GlitchText from "~/components/three/effects/GlitchText";
import { bloom } from "~/components/three/tsl/BloomNode.js";

// 404 scene: the same top-page fog shimmer with a quiet 3D "404 · not found".
export default function NotFoundScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <fog attach="fog" args={["#0f0825", 15, 50]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 4, 3]} intensity={2} color="#00F0FF" distance={30} decay={2} />
      <Fog />
      <GlitchText position={[0, 0, 0.5]} size={0.16} depth={0.03} emissiveIntensity={0.9} glitchIntensity={0.2}>
        404 not found
      </GlitchText>
      <Post />
    </WebGPUCanvas>
  );
}

function Post({ strength = 1.0, radius = 0.4 }) {
  const { gl, scene, camera, size } = useThree();
  const ref = useRef<THREE.RenderPipeline | null>(null);
  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    scenePass.getTexture("emissive").type = THREE.UnsignedByteType;
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = scenePass.getTextureNode().add(bloom(scenePass.getTextureNode("emissive"), strength, radius));
    ref.current = pipeline;
    return () => {
      ref.current = null;
    };
  }, [gl, scene, camera, size, strength, radius]);
  useFrame(() => {
    ref.current?.renderAsync();
  }, 1);
  return null;
}

function Fog() {
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
  const fbm = Fn(([p]: [any]) =>
    noise(p)
      .mul(0.5)
      .add(noise(p.mul(2.0).add(3.7)).mul(0.25))
      .add(noise(p.mul(4.0).add(7.3)).mul(0.125))
      .add(noise(p.mul(8.0).add(13.1)).mul(0.0625)),
  );
  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;
    const heightMix = p.y.div(30).add(0.5);
    const in1 = vec2(p.x.mul(0.25).add(t.mul(0.15)), p.z.mul(0.25).add(p.y.mul(0.1)).add(t.mul(0.12)));
    const in2 = vec2(p.z.mul(0.2).sub(t.mul(0.1)), p.y.mul(0.2).add(p.x.mul(0.15)).sub(t.mul(0.13)));
    const n1 = fbm(in1);
    const n2 = fbm(in2);
    const warped = fbm(in2.add(vec2(n1.mul(1.8), n1.mul(1.4))));
    const fog = n1.mul(0.35).add(warped.mul(0.65));
    const base = mix(color("#120a1e"), mix(color("#1a1230"), color("#221840"), heightMix), fog);
    const cyan = vec3(float(0.0), float(0.6), float(0.7)).mul(fog).mul(0.13);
    const purple = vec3(float(0.4), float(0.0), float(0.5)).mul(n2).mul(0.1);
    return base.add(cyan).add(purple);
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
