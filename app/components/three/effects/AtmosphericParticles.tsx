import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface AtmosphericParticlesProps {
  count?: number;
  area?: [number, number, number];
  color?: string;
  size?: number;
  speed?: number;
  active?: boolean;
}

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();

export default function AtmosphericParticles({
  count = 100,
  area = [20, 12, 20],
  color = "#00F0FF",
  size = 0.04,
  speed = 0.1,
  active = true,
}: AtmosphericParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * area[0],
        y: Math.random() * area[1] - 2,
        z: (Math.random() - 0.5) * area[2],
        speedY: Math.random() * speed + speed * 0.2,
        phase: Math.random() * Math.PI * 2,
      })),
    [count, area, speed],
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(size * 0.5, 4, 4), [size]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [color],
  );

  // Set initial positions
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      _matrix.setPosition(p.x, p.y, p.z);
      mesh.setMatrixAt(i, _matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [particles]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !active) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let y = p.y + ((t * p.speedY) % area[1]);
      if (y > area[1] - 2) y -= area[1];

      _position.set(
        p.x + Math.sin(t * 0.3 + p.phase) * 0.5,
        y,
        p.z + Math.cos(t * 0.2 + p.phase) * 0.5,
      );
      _matrix.setPosition(_position);
      mesh.setMatrixAt(i, _matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      visible={active}
    />
  );
}
