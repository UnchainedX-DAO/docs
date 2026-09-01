import { Center, Text3D } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

interface GlitchTextProps {
  children: string;
  position?: [number, number, number];
  size?: number;
  /** 0 = no glitch, 1 = full glitch */
  glitchIntensity?: number;
  depth?: number;
  centered?: boolean;
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
  centered = true,
  emissiveColor = "#00F0FF",
  emissiveIntensity = 0.8,
  active = true,
}: GlitchTextProps) {
  const { size: viewport } = useThree();
  // Large text scales down more on mobile, small text stays readable
  const baseScale = viewport.width < 600 ? 0.65 : viewport.width < 900 ? 0.8 : 1;
  const mobileScale = size > 0.2 ? baseScale : baseScale + (1 - baseScale) * 0.6;
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || glitchIntensity <= 0 || !active) return;
    const t = clock.getElapsedTime();

    // Glitch: random horizontal displacement slices
    const trigger = Math.sin(t * 11 + Math.sin(t * 31.7) * 4375.5) > 0.92 ? 1 : 0;
    const trigger2 = Math.cos(t * 17 + Math.cos(t * 47.3) * 2917.1) > 0.96 ? 1 : 0;

    // Horizontal slice jitter
    const sliceX = trigger * Math.sin(t * 60) * 0.04 * glitchIntensity;
    const sliceX2 = trigger2 * Math.cos(t * 45) * 0.02 * glitchIntensity;

    // Vertical jitter
    const jitterY = trigger2 * Math.sin(t * 80) * 0.01 * glitchIntensity;

    groupRef.current.position.x = position[0] + sliceX + sliceX2;
    groupRef.current.position.y = position[1] + jitterY;
    groupRef.current.position.z = position[2];

    // Scale flicker on glitch frames + mobile scaling
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

  const textElement = (
    <Text3D
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
  );

  if (centered) {
    return (
      <group ref={groupRef} position={position}>
        <Center>{textElement}</Center>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      {textElement}
    </group>
  );
}
