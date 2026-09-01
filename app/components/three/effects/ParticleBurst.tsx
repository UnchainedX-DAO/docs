import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

interface ParticleBurstProps {
  /** Chain link positions to explode from */
  origins: [number, number, number][];
  /** Whether the burst is active */
  active: boolean;
  /** Called when particles have fully scattered */
  onScattered?: () => void;
}

const PARTICLES_PER_LINK = 200;
const SCATTER_DURATION = 2.0;

export default function ParticleBurst({ origins, active, onScattered }: ParticleBurstProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef<number | null>(null);
  const hasScattered = useRef(false);

  const { positions, velocities, count } = useMemo(() => {
    const count = origins.length * PARTICLES_PER_LINK;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let linkIdx = 0; linkIdx < origins.length; linkIdx++) {
      const [ox, oy, oz] = origins[linkIdx];
      for (let i = 0; i < PARTICLES_PER_LINK; i++) {
        const idx = (linkIdx * PARTICLES_PER_LINK + i) * 3;
        // Start at chain link position
        positions[idx] = ox;
        positions[idx + 1] = oy;
        positions[idx + 2] = oz;

        // Random velocity — explosive outward
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 3;
        velocities[idx] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[idx + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[idx + 2] = Math.cos(phi) * speed;
      }
    }

    return { positions, velocities, count };
  }, [origins]);

  useFrame(({ clock }) => {
    if (!active || !pointsRef.current) return;

    if (startTime.current === null) {
      startTime.current = clock.getElapsedTime();
    }

    const elapsed = clock.getElapsedTime() - startTime.current;
    const progress = Math.min(1, elapsed / SCATTER_DURATION);
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute("position");

    // Ease out cubic
    const ease = 1 - (1 - progress) * (1 - progress) * (1 - progress);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const baseX = positions[idx];
      const baseY = positions[idx + 1];
      const baseZ = positions[idx + 2];

      // Apply velocity with easing + slight gravity
      posAttr.setXYZ(
        i,
        baseX + velocities[idx] * ease,
        baseY + velocities[idx + 1] * ease - ease * ease * 0.5,
        baseZ + velocities[idx + 2] * ease,
      );
    }
    posAttr.needsUpdate = true;

    // Update opacity — fade slightly at end
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = progress < 0.7 ? 1.0 : 1.0 - (progress - 0.7) / 0.3;

    if (progress >= 1 && !hasScattered.current) {
      hasScattered.current = true;
      onScattered?.();
    }
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#00F0FF" size={0.04} transparent opacity={1} sizeAttenuation />
    </points>
  );
}
