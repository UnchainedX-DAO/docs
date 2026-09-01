import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import { cos, normalLocal, positionLocal, sin, uniform, vec3 } from "three/tsl";

interface DistortedGridProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  segments?: [number, number];
  color?: string;
  emissiveIntensity?: number;
  distortionAmount?: number;
  distortionSpeed?: number;
}

/**
 * A wireframe grid plane with TSL noise displacement.
 * Vertices warp organically over time.
 */
export default function DistortedGrid({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [20, 20],
  segments = [40, 40],
  color = "#00F0FF",
  emissiveIntensity = 0.2,
  distortionAmount = 0.8,
  distortionSpeed = 1.0,
}: DistortedGridProps) {
  const meshRef = useRef<Mesh>(null);

  const { positionNode, uniforms } = useMemo(() => {
    const uTime = uniform(0.0);
    const uAmount = uniform(distortionAmount);

    const p = positionLocal;
    const t = uTime.mul(distortionSpeed);

    // Layered sine noise displacement along normal
    const noise1 = sin(p.x.mul(2.0).add(t.mul(0.8)))
      .mul(cos(p.y.mul(1.5).add(t.mul(0.6))))
      .mul(uAmount);

    const noise2 = sin(p.x.mul(4.0).add(t.mul(1.2)))
      .mul(cos(p.y.mul(3.0).add(t.mul(0.9))))
      .mul(uAmount.mul(0.3));

    const noise3 = cos(p.x.mul(1.0).add(p.y.mul(1.0)).add(t.mul(0.5))).mul(uAmount.mul(0.5));

    const displacement = noise1.add(noise2).add(noise3);

    const displacedPosition = vec3(
      positionLocal.x,
      positionLocal.y,
      positionLocal.z.add(normalLocal.z.mul(displacement)),
    );

    return {
      positionNode: displacedPosition,
      uniforms: { uTime, uAmount },
    };
  }, [distortionAmount, distortionSpeed]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
      <meshStandardNodeMaterial
        colorNode={vec3(0, 0, 0)}
        positionNode={positionNode}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}
