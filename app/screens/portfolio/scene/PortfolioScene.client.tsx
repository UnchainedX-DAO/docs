import { Html } from "@react-three/drei";
import GlitchText from "~/components/three/effects/GlitchText";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three/webgpu";
import { bloom } from "~/components/three/tsl/BloomNode.js";
import {
  color,
  cos,
  dot,
  emissive,
  float,
  Fn,
  fract,
  max,
  min,
  mix,
  mrt,
  smoothstep,
  output,
  pass,
  positionLocal,
  sin,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import AtmosphericParticles from "~/components/three/effects/AtmosphericParticles";
import Environment from "~/components/three/environment/Environment";
import ScenePostProcessing from "~/components/three/post/ScenePostProcessing";
import WebGPUCanvas from "~/components/three/canvas/WebGPUCanvas.client";
import type { Project } from "~/core/adapters/sanity";
import GenerativeThumb from "~/screens/portfolio/scene/GenerativeThumb";


// --- Shared noise (from common module) ---
import { hash as hashFn, noise2d as noiseFn, fbm as fbmFn } from "~/components/three/tsl/noise";

// --- Nebula background ---
function NebulaBackground() {
  const uTime = useMemo(() => uniform(0.0), []);

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;
    const voidColor = color("#020112");
    const deepColor = color("#06031a");
    const heightMix = p.y.div(30).add(0.5);

    const ni1 = vec2(p.x.mul(0.25).add(t.mul(0.1)), p.z.mul(0.25).add(p.y.mul(0.12)).add(t.mul(0.08)));
    const ni2 = vec2(p.z.mul(0.2).sub(t.mul(0.07)), p.y.mul(0.2).add(p.x.mul(0.15)).sub(t.mul(0.09)));
    const n1 = fbmFn(ni1);
    const n2 = fbmFn(ni2);
    const warped = fbmFn(ni2.add(vec2(n1.mul(2.0), n1.mul(1.5))));
    const n3 = fbmFn(vec2(p.x.mul(0.15).add(t.mul(0.05)), p.y.mul(0.12).sub(t.mul(0.06))).add(vec2(warped.mul(1.2), n2.mul(0.8))));
    const fog = n1.mul(0.3).add(warped.mul(0.5)).add(n3.mul(0.2));
    const baseColor = mix(voidColor, deepColor, heightMix);
    const cyanCloud = vec3(float(0.0), float(0.6), float(0.8)).mul(warped.sub(0.3).max(0).mul(3.0).min(1)).mul(0.12);
    const purpleCloud = vec3(float(0.5), float(0.0), float(0.7)).mul(n2.sub(0.25).max(0).mul(3.0).min(1)).mul(0.1);
    const magentaCloud = vec3(float(0.7), float(0.0), float(0.5)).mul(n3.sub(0.35).max(0).mul(4.0).min(1)).mul(0.06);
    const coreBright = vec3(float(0.3), float(0.5), float(0.8)).mul(fog.sub(0.45).max(0).mul(5.0).min(1)).mul(0.08);
    const sparkle = noiseFn(vec2(p.x.mul(3.0).add(t.mul(0.2)), p.z.mul(3.0).sub(t.mul(0.15)))).sub(0.92).max(0).mul(12.0);
    const sparkleColor = vec3(float(0.8), float(0.9), float(1.0)).mul(sparkle).mul(0.15);
    return baseColor.add(cyanCloud).add(purpleCloud).add(magentaCloud).add(coreBright).add(sparkleColor);
  }, [uTime]);

  useFrame(({ clock }) => { uTime.value = clock.getElapsedTime(); });

  return (
    <mesh>
      <sphereGeometry args={[30, 12, 12]} />
      <meshBasicNodeMaterial colorNode={colorNode} side={1} />
    </mesh>
  );
}

// --- Washi card mesh ---
const STATUS_COLORS: Record<string, string> = {
  "In Dev": "#00F0FF",
  Live: "#00FF78",
  Archived: "rgba(255,255,255,0.4)",
};

function useViewport() {
  const { size, viewport } = useThree();
  const w = size.width;   // CSS pixels
  const h = size.height;
  const aspect = w / h;
  const isPortrait = aspect < 1;
  const vw = viewport.width;   // 3D world units visible at z=0
  const vh = viewport.height;
  return { w, h, aspect, isPortrait, vw, vh };
}

function WashiCardMesh({ project, cardIndex }: { project: Project; cardIndex: number }) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const uTime = useMemo(() => uniform(0.0), []);
  const uHover = useMemo(() => uniform(0.0), []);
  const hoverTarget = useRef(0);
  const idx = cardIndex;

  // Vertex displacement — water undulation + edge warping
  const positionNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Water surface waves — intensify on hover
    const waveAmp = float(1.0).add(uHover.mul(0.3)); // subtle 1.3x on hover
    const wave1 = sin(p.x.mul(2.0).add(t.mul(0.8)).add(float(idx * 1.7))).mul(0.1).mul(waveAmp);
    const wave2 = cos(p.y.mul(1.5).add(t.mul(0.6)).add(float(idx * 2.3))).mul(0.08).mul(waveAmp);
    const wave3 = sin(p.x.mul(3.5).add(p.y.mul(2.5)).add(t.mul(1.0))).mul(0.03).mul(waveAmp);
    const noiseDisp = fbmFn(vec2(p.x.mul(1.5).add(t.mul(0.3)), p.y.mul(1.5).add(t.mul(0.25)).add(float(idx)))).sub(0.5).mul(0.12).mul(waveAmp);

    // Edge warping — vertices near edges get extra XY displacement
    const halfW = float(2.75); // half width of plane (5.5/2)
    const halfH = float(1.5); // half height (3.0/2)
    const edgeDistX = halfW.sub(p.x.abs()).div(halfW); // 0 at edge, 1 at center
    const edgeDistY = halfH.sub(p.y.abs()).div(halfH);
    const edgeProximity = float(1.0).sub(edgeDistX.mul(edgeDistY)); // high at edges

    // FBM-based edge warp — stronger organic edge movement
    const edgeNoiseX = fbmFn(vec2(p.y.mul(2.5).add(t.mul(0.4)), t.mul(0.25).add(float(idx)))).sub(0.5).mul(0.15).mul(edgeProximity);
    const edgeNoiseY = fbmFn(vec2(p.x.mul(2.5).add(t.mul(0.35)), t.mul(0.2).add(float(idx + 10)))).sub(0.5).mul(0.15).mul(edgeProximity);

    const zDisp = wave1.add(wave2).add(wave3).add(noiseDisp);

    return vec3(p.x.add(edgeNoiseX), p.y.add(edgeNoiseY), p.z.add(zDisp));
  }, [uTime, idx]);

  // Paper fiber texture + organic edge alpha
  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    // Paper fiber
    const paperDark = color("#8085a0");
    const paperLight = color("#b0b5cc");
    const ni = vec2(p.x.mul(3.0).add(float(idx * 2.0)), p.y.mul(4.0));
    const wX = fbmFn(ni.add(vec2(t.mul(0.2), t.mul(0.15)))).mul(1.5);
    const wY = fbmFn(ni.add(vec2(t.mul(-0.15), t.mul(0.18)))).mul(1.5);
    const fiber = fbmFn(ni.add(vec2(wX, wY)));
    const base = mix(paperDark, paperLight, fiber);
    // Brighter cyan highlights along fibers
    const cyan = vec3(float(0.0), float(0.7), float(0.9)).mul(fiber.sub(0.25).max(0).mul(3.0)).mul(0.15);
    // Purple in thinner areas
    const purple = vec3(float(0.5), float(0.0), float(0.7)).mul(float(1.0).sub(fiber).sub(0.35).max(0).mul(3.0)).mul(0.08);
    // White-ish light peaks where fiber density is highest
    const lightPeak = vec3(float(0.8), float(0.85), float(1.0)).mul(fiber.sub(0.5).max(0).mul(4.0)).mul(0.12);
    // === COMBINED HOVER: C (color temperature shift) + D (neon frame) + E (noise acceleration) ===

    // --- E: Noise acceleration — fiber flow speeds up on hover ---
    const speedBoost = float(1.0).add(uHover.mul(8.0)); // 9x speed on full hover
    const fastNi = vec2(p.x.mul(3.0).add(float(idx * 2.0)), p.y.mul(4.0));
    const fastWX = fbmFn(fastNi.add(vec2(t.mul(0.2).mul(speedBoost), t.mul(0.15).mul(speedBoost)))).mul(1.5);
    const fastWY = fbmFn(fastNi.add(vec2(t.mul(-0.15).mul(speedBoost), t.mul(0.18).mul(speedBoost)))).mul(1.5);
    const fastFiber = fbmFn(fastNi.add(vec2(fastWX, fastWY)));
    const blendedFiber = mix(fiber, fastFiber, uHover);

    // --- C: Color temperature shift — cool paper → warm neon tones on hover ---
    // Normal: cool grey-blue paper with subtle cyan/purple
    const normalBase = mix(paperDark, paperLight, blendedFiber);
    const normalCyan = vec3(float(0.0), float(0.7), float(0.9)).mul(blendedFiber.sub(0.25).max(0).mul(3.0)).mul(0.15);
    const normalPurple = vec3(float(0.5), float(0.0), float(0.7)).mul(float(1.0).sub(blendedFiber).sub(0.35).max(0).mul(3.0)).mul(0.08);
    const normalLight = vec3(float(0.8), float(0.85), float(1.0)).mul(blendedFiber.sub(0.5).max(0).mul(4.0)).mul(0.12);
    const normalColor = normalBase.add(normalCyan).add(normalPurple).add(normalLight);

    // Hover: shift base darker, fibers become vivid magenta/electric blue
    const hoverBase = mix(normalBase, color("#0e0825"), float(0.5));
    const hoverMagenta = vec3(float(0.9), float(0.1), float(0.6)).mul(blendedFiber.sub(0.2).max(0).mul(3.5)).mul(0.25);
    const hoverElectric = vec3(float(0.1), float(0.4), float(1.0)).mul(float(1.0).sub(blendedFiber).sub(0.25).max(0).mul(3.5)).mul(0.2);
    const hoverLight = vec3(float(1.0), float(0.8), float(0.95)).mul(blendedFiber.sub(0.45).max(0).mul(5.0)).mul(0.2);
    const hoverColor = hoverBase.add(hoverMagenta).add(hoverElectric).add(hoverLight);

    const shiftedColor = mix(normalColor, hoverColor, uHover);

    // --- D: Glowing neon frame at edges ---
    const edgeDistX_d = float(2.75).sub(p.x.abs());
    const edgeDistY_d = float(1.5).sub(p.y.abs());
    const edgeDist_d = min(edgeDistX_d, edgeDistY_d);
    const frameWidth_d = float(0.08);
    const frameIntensity_d = smoothstep(frameWidth_d, float(0.0), edgeDist_d).mul(uHover);
    const frameMix_d = sin(p.x.mul(3.0).add(p.y.mul(2.0)).add(t.mul(1.5))).mul(0.5).add(0.5);
    const frameCyan_d = vec3(float(0.0), float(0.9), float(1.0)).mul(float(1.0).sub(frameMix_d));
    const framePurple_d = vec3(float(0.8), float(0.0), float(1.0)).mul(frameMix_d);
    const frameColor_d = frameCyan_d.add(framePurple_d).mul(frameIntensity_d).mul(0.5);
    const innerGlow_d = smoothstep(float(0.4), float(0.0), edgeDist_d).mul(uHover).mul(0.08);
    const glowColor_d = vec3(float(0.0), float(0.5), float(0.7)).mul(innerGlow_d);

    // --- Neumorphic light/shadow — top-left highlight, bottom-right shadow ---
    // Normalized position: -1..1 across card
    const nx = p.x.div(2.75);
    const ny = p.y.div(1.5);
    // Light direction: top-left = bright, bottom-right = dark
    const lightDir = nx.mul(-1.0).add(ny).mul(0.5); // -1 (top-left) to +1 (bottom-right)
    const highlight = lightDir.negate().max(0.0).mul(0.12); // top-left gets brighter
    const shadow = lightDir.max(0.0).mul(0.15); // bottom-right gets darker
    const neumorph = vec3(highlight, highlight, highlight.mul(1.2)).sub(vec3(shadow, shadow, shadow));

    return shiftedColor.add(frameColor_d).add(glowColor_d).add(neumorph);
  }, [uTime, uHover, idx]);

  // Organic edge alpha with hover bleed (にじみ)
  const opacityNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;
    const halfW = float(2.75);
    const halfH = float(1.5);

    // Edge fade zone widens dramatically on hover — ink bleeding outward
    const fadeWidth = float(0.15).add(uHover.mul(0.5));
    // Extend card bounds on hover (bleed beyond original edges)
    const extendedW = halfW.add(uHover.mul(0.3));
    const extendedH = halfH.add(uHover.mul(0.2));
    const dx = extendedW.sub(p.x.abs()).div(fadeWidth).min(1.0).max(0.0);
    const dy = extendedH.sub(p.y.abs()).div(fadeWidth).min(1.0).max(0.0);
    const edgeFade = dx.mul(dy);

    // Noise gets much coarser on hover = soft, diffuse, ink-in-water edge
    const noiseScale = float(5.0).sub(uHover.mul(3.0));
    const edgeNoise = fbmFn(vec2(
      p.x.mul(noiseScale).add(p.y.mul(3.0)).add(t.mul(0.1)),
      p.y.mul(noiseScale).sub(p.x.mul(2.0)).add(t.mul(0.08)).add(float(idx)),
    ));
    const noiseBlend = float(0.3).add(uHover.mul(0.3));
    // Center becomes more opaque on hover, edges dissolve further
    const centerDist = p.x.abs().div(halfW).add(p.y.abs().div(halfH)).mul(0.5);
    const centerBoost = float(1.0).sub(centerDist).max(0.0).mul(uHover).mul(0.2);
    const alpha = edgeFade.add(edgeNoise.mul(noiseBlend)).sub(0.15).mul(2.5).add(centerBoost).min(0.6).max(0.0);

    return alpha;
  }, [uTime, uHover, idx]);

  useFrame(({ clock }) => {
    uTime.value = clock.getElapsedTime();
    uHover.value += (hoverTarget.current - uHover.value) * 0.15;
  });

  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.Archived;
  const vp = useViewport();

  // Card dimensions
  const showThumb = !vp.isPortrait;
  // Portrait: washi = 90% of 3D viewport width, aspect 1:1.4
  const planeW = vp.isPortrait ? vp.vw * 0.9 : 5.5;
  const planeH = vp.isPortrait ? planeW * 1.4 : 3.0;
  // distanceFactor and htmlWidth stay fixed — only plane scales
  const dFactor = 5.2;
  const htmlWidth = vp.isPortrait ? 340 : 680;
  const htmlHeight = vp.isPortrait ? 440 : 370;

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => { hoverTarget.current = 1; }}
      onPointerLeave={() => { hoverTarget.current = 0; }}
    >
      <mesh ref={meshRef}>
        <planeGeometry args={[planeW, planeH, vp.isPortrait ? 20 : 30, vp.isPortrait ? 30 : 20]} />
        <meshBasicNodeMaterial
          positionNode={positionNode}
          colorNode={colorNode}
          opacityNode={opacityNode}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Card content */}
      <Html center distanceFactor={dFactor} style={{ pointerEvents: "none", width: `${htmlWidth}px` }}>
        <div className={vp.isPortrait ? `flex flex-col p-4` : "flex h-[370px] gap-10 p-3"} style={vp.isPortrait ? { height: `${htmlHeight}px` } : undefined}>
          {/* Thumbnail — landscape only */}
          {showThumb && (
            <div className="w-[280px] h-full flex-shrink-0 rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(0,240,255,0.03)", border: "1px solid rgba(0,240,255,0.06)" }}>
              {project.thumbnail ? (
                <img
                  src={typeof project.thumbnail === "string" ? project.thumbnail : ""}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GenerativeThumb title={project.title} categories={project.categories || []} />
              )}
            </div>
          )}

          {/* Right: text */}
          <div className="flex flex-col flex-1 min-w-0 py-2">
            {/* Status */}
            <div className="mb-3">
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-mono px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  color: "#fff",
                  backgroundColor: `${statusColor}30`,
                  textShadow: `0 0 8px ${statusColor}`,
                  border: `1px solid ${statusColor}40`,
                }}
              >
                {project.status}
              </span>
            </div>

            {/* Title */}
            <h3
              className="text-2xl font-bold tracking-wide mb-1.5 neon-glow-strong"
              style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF", textShadow: "0 0 10px rgba(0,240,255,0.6), 0 0 20px rgba(0,240,255,0.25), 0 0 40px rgba(0,240,255,0.1)" }}
            >
              {project.title}
            </h3>

            {/* Categories */}
            {project.categories?.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                {project.categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] uppercase tracking-[0.15em] font-mono px-2 py-0.5 rounded-full"
                    style={{
                      color: "#BF00FF",
                      backgroundColor: "rgba(191,0,255,0.12)",
                      textShadow: "0 0 6px rgba(191,0,255,0.4)",
                      border: "1px solid rgba(191,0,255,0.2)",
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <p
              className="text-xs leading-relaxed flex-1 overflow-hidden"
              style={{
                color: "#120e28",
                textShadow: "0 0 8px rgba(0,240,255,0.15)",
                filter: "blur(0.3px)",
                fontWeight: 600,
              }}
            >
              {project.description}
            </p>

            {/* Tags + Link */}
            <div className="flex items-end justify-between gap-3 mt-3">
              {project.topics?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.topics.map((tech) => (
                    <span
                      key={tech}
                      className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-mono"
                      style={{
                        color: "#00F0FF",
                        backgroundColor: "rgba(0,240,255,0.08)",
                        textShadow: "0 0 4px rgba(0,240,255,0.4)",
                        border: "1px solid rgba(0,240,255,0.15)",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-[0.2em] font-mono font-bold flex-shrink-0 px-5 py-2 rounded-full pointer-events-auto"
                  style={{
                    color: "#E619A0",
                    border: "1.5px solid rgba(230,25,150,0.5)",
                    textShadow: "0 0 8px rgba(230,25,150,0.5), 0 0 16px rgba(230,25,150,0.2)",
                    boxShadow: "0 0 6px rgba(230,25,150,0.2), 0 0 15px rgba(230,25,150,0.08)",
                    backgroundColor: "transparent",
                    position: "relative" as const,
                    overflow: "hidden",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.color = "#fff";
                    el.style.textShadow = "0 0 8px rgba(230,25,150,0.8), 0 0 16px rgba(230,25,150,0.4), 0 0 30px rgba(230,25,150,0.2)";
                    el.style.backgroundColor = "transparent";
                    // Spinning border glow
                    el.style.borderColor = "transparent";
                    el.animate([
                      { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                      { boxShadow: "inset 0 0 0 1.5px #8B00FF, 0 0 12px rgba(139,0,255,0.4), 0 0 30px rgba(230,25,150,0.2)" },
                      { boxShadow: "inset 0 0 0 1.5px #00F0FF, 0 0 12px rgba(0,240,255,0.4), 0 0 30px rgba(139,0,255,0.15)" },
                      { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 12px rgba(230,25,150,0.4), 0 0 30px rgba(0,240,255,0.1)" },
                      { boxShadow: "inset 0 0 0 1.5px #E619A0, 0 0 6px rgba(230,25,150,0.3)" },
                    ], { duration: 1800, iterations: Infinity, easing: "linear" });
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.getAnimations().forEach(a => a.cancel());
                    el.style.backgroundColor = "transparent";
                    el.style.boxShadow = "0 0 6px rgba(230,25,150,0.2), 0 0 15px rgba(230,25,150,0.08)";
                    el.style.color = "#E619A0";
                    el.style.borderColor = "rgba(230,25,150,0.5)";
                    el.style.textShadow = "0 0 8px rgba(230,25,150,0.5), 0 0 16px rgba(230,25,150,0.2)";
                  }}
                >
                  Visit →
                </a>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// --- Empty state card ---
const EMPTY_MESSAGES: Record<string, { title: string; sub: string }> = {
  All: { title: "No projects yet", sub: "Stay tuned" },
  "In Dev": { title: "Nothing in development", sub: "Stay tuned" },
  Live: { title: "Nothing live yet", sub: "Stay tuned" },
  Archived: { title: "No archived projects", sub: "Nothing retired yet" },
};

function EmptyCard({ activeStatus = "All" }: { activeStatus?: string }) {
  const vp = useViewport();
  const uTime = useMemo(() => uniform(0.0), []);

  // Same vertex displacement as WashiCardMesh
  const positionNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;

    const wave1 = sin(p.x.mul(2.0).add(t.mul(0.8))).mul(0.1);
    const wave2 = cos(p.y.mul(1.5).add(t.mul(0.6))).mul(0.08);
    const wave3 = sin(p.x.mul(3.5).add(p.y.mul(2.5)).add(t.mul(1.0))).mul(0.03);
    const noiseDisp = fbmFn(vec2(p.x.mul(1.5).add(t.mul(0.3)), p.y.mul(1.5).add(t.mul(0.25)))).sub(0.5).mul(0.12);

    const halfW = float(2.75);
    const halfH = float(1.5);
    const edgeDistX = halfW.sub(p.x.abs()).div(halfW);
    const edgeDistY = halfH.sub(p.y.abs()).div(halfH);
    const edgeProximity = float(1.0).sub(edgeDistX.mul(edgeDistY));

    const edgeNoiseX = fbmFn(vec2(p.y.mul(2.5).add(t.mul(0.4)), t.mul(0.25))).sub(0.5).mul(0.15).mul(edgeProximity);
    const edgeNoiseY = fbmFn(vec2(p.x.mul(2.5).add(t.mul(0.35)), t.mul(0.2))).sub(0.5).mul(0.15).mul(edgeProximity);

    const zDisp = wave1.add(wave2).add(wave3).add(noiseDisp);
    return vec3(p.x.add(edgeNoiseX), p.y.add(edgeNoiseY), p.z.add(zDisp));
  }, [uTime]);

  const colorNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;
    const paperDark = color("#8085a0");
    const paperLight = color("#b0b5cc");
    const ni = vec2(p.x.mul(3.0), p.y.mul(4.0));
    const wX = fbmFn(ni.add(vec2(t.mul(0.15), t.mul(0.1)))).mul(1.5);
    const wY = fbmFn(ni.add(vec2(t.mul(-0.1), t.mul(0.12)))).mul(1.5);
    const fiber = fbmFn(ni.add(vec2(wX, wY)));
    return mix(paperDark, paperLight, fiber);
  }, [uTime]);

  const opacityNode = useMemo(() => {
    const p = positionLocal;
    const t = uTime;
    const halfW = float(2.75);
    const halfH = float(1.5);
    const dx = halfW.sub(p.x.abs()).div(0.15).min(1.0).max(0.0);
    const dy = halfH.sub(p.y.abs()).div(0.15).min(1.0).max(0.0);
    const edgeFade = dx.mul(dy);
    const edgeNoise = fbmFn(vec2(
      p.x.mul(5.0).add(p.y.mul(3.0)).add(t.mul(0.1)),
      p.y.mul(5.0).sub(p.x.mul(2.0)).add(t.mul(0.08)),
    ));
    return edgeFade.add(edgeNoise.mul(0.3)).sub(0.15).mul(2.5).min(0.35).max(0.0);
  }, [uTime]);

  useFrame(({ clock }) => { uTime.value = clock.getElapsedTime(); });

  return (
    <group>
      <mesh>
        <planeGeometry args={vp.isPortrait ? [vp.vw * 0.9, vp.vw * 0.9 * 1.5, 20, 30] : [5.5, 3.0, 30, 20]} />
        <meshBasicNodeMaterial
          positionNode={positionNode}
          colorNode={colorNode}
          opacityNode={opacityNode}
          transparent
          depthWrite={false}
        />
      </mesh>
      <Html center distanceFactor={5.2} style={{ pointerEvents: "none", width: "680px" }}>
        <div className="flex items-center justify-center h-[370px]">
          <div className="text-center">
            <p
              className="text-xl font-mono tracking-[0.3em] uppercase mb-3"
              style={{
                color: "#00F0FF",
                textShadow: "0 0 10px rgba(0,240,255,0.4), 0 0 20px rgba(0,240,255,0.15)",
              }}
            >
              {(EMPTY_MESSAGES[activeStatus] || EMPTY_MESSAGES.All).title}
            </p>
            <p
              className="text-xs font-mono tracking-[0.2em] uppercase"
              style={{
                color: "rgba(224,224,255,0.4)",
                textShadow: "0 0 6px rgba(224,224,255,0.1)",
              }}
            >
              {(EMPTY_MESSAGES[activeStatus] || EMPTY_MESSAGES.All).sub}
            </p>
          </div>
        </div>
      </Html>
    </group>
  );
}

// --- Carousel gallery ---
function CardCarousel({ projects, currentIndex, activeStatus }: { projects: Project[]; currentIndex: number; activeStatus: string }) {
  const groupRef = useRef<Group>(null);
  const targetX = useRef(0);
  const vp = useViewport();
  const spacing = vp.isPortrait ? vp.w / 80 : 6.5;

  useFrame(() => {
    if (!groupRef.current) return;
    targetX.current = -currentIndex * spacing;
    groupRef.current.position.x += (targetX.current - groupRef.current.position.x) * 0.08;
  });

  if (projects.length === 0) {
    return (
      <group position={[0, vp.isPortrait ? -1.0 : -0.3, 0]}>
        <EmptyCard activeStatus={activeStatus} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {projects.map((project, i) => {
        // Only render current ± 1 cards for performance
        if (Math.abs(i - currentIndex) > 1) return null;
        return (
          <group key={project._id} position={[i * spacing, vp.isPortrait ? -1.0 : -0.3, 0]}>
            <WashiCardMesh project={project} cardIndex={i} />
          </group>
        );
      })}
    </group>
  );
}

// --- Main scene ---
interface PortfolioSceneProps {
  projects: Project[];
  currentIndex: number;
  activeStatus: string;
}


export default function PortfolioScene({ projects, currentIndex, activeStatus }: PortfolioSceneProps) {
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <WebGPUCanvas className="!fixed inset-0 z-0" dpr={isNarrow ? [1, 1] : [1, 1.5]}>
      <Environment />
      <fog attach="fog" args={["#020112", 20, 50]} />
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 3, 4]} intensity={2.5} color="#00F0FF" distance={30} decay={2} />
      <pointLight position={[-4, 2, 2]} intensity={1.5} color="#BF00FF" distance={20} decay={2} />
      <pointLight position={[4, -1, 3]} intensity={1} color="#E0E0FF" distance={15} decay={2} />

      <NebulaBackground />

      <CardCarousel projects={projects} currentIndex={currentIndex} activeStatus={activeStatus} />

      <ScenePostProcessing />
    </WebGPUCanvas>
  );
}
