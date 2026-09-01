import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

interface VolumetricFogProps {
  /** Position in world space */
  position?: [number, number, number];
  /** Size of the fog volume */
  size?: [number, number];
  /** Base color */
  color?: string;
  /** Opacity 0-1 */
  opacity?: number;
  /** Animation speed */
  speed?: number;
  active?: boolean;
}

/**
 * Volumetric fog plane that follows the camera.
 * Uses animated opacity for a breathing effect.
 * No flicker on scroll — pure time-based animation.
 */
export default function VolumetricFog({
  position = [0, 0, 0],
  size = [30, 15],
  color = "#0a0520",
  opacity = 0.15,
  speed = 0.3,
  active = true,
}: VolumetricFogProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) return;
    const t = clock.getElapsedTime();

    // Slow breathing opacity
    const breathe = Math.sin(t * speed) * 0.03 + opacity;
    const mat = meshRef.current.material as { opacity: number };
    mat.opacity = Math.max(0, breathe);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
