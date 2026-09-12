import { Text3D } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Group, Mesh } from "three";

interface GlitchTextProps {
  children: string;
  position?: [number, number, number];
  size?: number;
  /** 0 = no glitch, 1 = full glitch */
  glitchIntensity?: number;
  depth?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  active?: boolean;
}

export default function GlitchText({
  children,
  position = [0, 0, 0],
  size = 0.5,
  glitchIntensity = 0.8,
  depth = 0.05,
  emissiveColor = "#00F0FF",
  emissiveIntensity = 0.8,
  active = true,
}: GlitchTextProps) {
  const { size: viewport } = useThree();
  // Large text scales down more on mobile, small text stays readable
  const baseScale = viewport.width < 600 ? 0.65 : viewport.width < 900 ? 0.8 : 1;
  const mobileScale = size > 0.2 ? baseScale : baseScale + (1 - baseScale) * 0.6;
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);

  // Reliable centering: center the text geometry around the group origin.
  // (drei's <Center> mis-measures async-loaded Text3D geometry.)
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh?.geometry) {
      mesh.geometry.center();
    }
  }, [children, size, depth]);

  useFrame(({ clock }) => {
    if (!groupRef.current || glitchIntensity <= 0 || !active) return;
    const t = clock.getElapsedTime();

    const trigger = Math.sin(t * 11 + Math.sin(t * 31.7) * 4375.5) > 0.92 ? 1 : 0;
    const trigger2 = Math.cos(t * 17 + Math.cos(t * 47.3) * 2917.1) > 0.96 ? 1 : 0;

    const sliceX = trigger * Math.sin(t * 60) * 0.04 * glitchIntensity;
    const sliceX2 = trigger2 * Math.cos(t * 45) * 0.02 * glitchIntensity;
    const jitterY = trigger2 * Math.sin(t * 80) * 0.01 * glitchIntensity;

    groupRef.current.position.x = position[0] + sliceX + sliceX2;
    groupRef.current.position.y = position[1] + jitterY;
    groupRef.current.position.z = position[2];

    if (trigger) {
      groupRef.current.scale.set(
        mobileScale * (1 + Math.random() * 0.02 * glitchIntensity),
        mobileScale,
        mobileScale,
      );
    } else {
      groupRef.current.scale.set(mobileScale, mobileScale, mobileScale);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={mobileScale}>
      <Text3D
        ref={meshRef}
        font="/fonts/Rubik_Regular.json"
        size={size}
        height={depth}
        curveSegments={8}
        bevelEnabled={false}
      >
        {children}
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.3}
          transparent
          toneMapped={false}
        />
      </Text3D>
    </group>
  );
}
