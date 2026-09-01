import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import {
  abs,
  Break,
  cos,
  dot,
  Fn,
  float,
  If,
  Loop,
  length,
  max,
  min,
  mix,
  normalize,
  pow,
  reflect,
  sin,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";

export default function RaymarchScene() {
  const meshRef = useRef<Mesh>(null);
  const { size } = useThree();

  const { colorNode, uniforms } = useMemo(() => {
    const uTime = uniform(0.0);
    const uAspect = uniform(size.width / size.height);

    const cCyan = vec3(0.0, 0.94, 1.0);
    const cPurple = vec3(0.75, 0.0, 1.0);
    const cTeal = vec3(0.0, 0.3, 0.35);
    const cMagenta = vec3(0.24, 0.0, 0.32);

    const sdSphere = Fn(([p, center, r]: [any, any, any]) => {
      return length(p.sub(center)).sub(r);
    });

    const smin = Fn(([a, b, k]: [any, any, any]) => {
      const h = max(k.sub(abs(a.sub(b))), float(0)).div(k);
      return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
    });

    // Scene — fluid, network-like movement
    // Entities chase each other, stretch toward each other, merge and split rapidly
    const sceneSDF = Fn(([p]: [any]) => {
      const t = uTime.mul(0.6);

      // Three main nodes — spread apart, visible as separate entities
      const e1 = vec3(
        sin(t.mul(0.7).add(sin(t.mul(0.3)).mul(0.5))).mul(1.3),
        sin(t.mul(0.9))
          .mul(cos(t.mul(0.5)))
          .mul(0.6),
        cos(t.mul(0.5).add(cos(t.mul(0.25)).mul(0.4))).mul(0.8),
      );

      const e2 = vec3(
        cos(t.mul(0.6).add(sin(t.mul(0.4).add(1.5)).mul(0.5))).mul(1.2),
        cos(t.mul(0.7).add(2.0))
          .mul(sin(t.mul(0.45)))
          .mul(0.7),
        sin(t.mul(0.65).add(sin(t.mul(0.3)).mul(0.4))).mul(0.9),
      );

      const e3 = vec3(
        sin(t.mul(0.8).add(cos(t.mul(0.35)).mul(0.6))).mul(1.1),
        sin(t.mul(0.55).add(3.0)).mul(0.8),
        cos(t.mul(0.7).add(sin(t.mul(0.4).add(2.0)).mul(0.5))).mul(0.7),
      );

      // Dynamic size
      const r1 = float(0.35).add(sin(t.mul(1.5)).mul(0.05));
      const r2 = float(0.32).add(cos(t.mul(1.3).add(1.0)).mul(0.04));
      const r3 = float(0.33).add(sin(t.mul(1.1).add(2.0)).mul(0.05));

      // 3 bridge nodes — one per edge
      const b1 = mix(e1, e2, sin(t.mul(0.5)).mul(0.5).add(0.5));
      const b2 = mix(e2, e3, cos(t.mul(0.4).add(1.0)).mul(0.5).add(0.5));
      const b3 = mix(e3, e1, sin(t.mul(0.45).add(2.0)).mul(0.5).add(0.5));

      const distort = sin(p.x.mul(3.0).add(t))
        .mul(cos(p.y.mul(2.5).add(t.mul(0.7))))
        .mul(0.03);

      const d1 = sdSphere(p, e1, r1).add(distort);
      const d2 = sdSphere(p, e2, r2).add(distort);
      const d3 = sdSphere(p, e3, r3).add(distort);
      const db1 = sdSphere(p, b1, float(0.15));
      const db2 = sdSphere(p, b2, float(0.14));
      const db3 = sdSphere(p, b3, float(0.13));

      const k = float(0.4);
      const mainBlobs = smin(smin(d1, d2, k), d3, k);
      const bridges = smin(smin(db1, db2, float(0.3)), db3, float(0.3));

      return smin(mainBlobs, bridges, float(0.35));
    });

    const calcNormal = Fn(([p]: [any]) => {
      const e = float(0.002);
      return normalize(
        vec3(
          sceneSDF(p.add(vec3(e, 0, 0))).sub(sceneSDF(p.sub(vec3(e, 0, 0)))),
          sceneSDF(p.add(vec3(0, e, 0))).sub(sceneSDF(p.sub(vec3(0, e, 0)))),
          sceneSDF(p.add(vec3(0, 0, e))).sub(sceneSDF(p.sub(vec3(0, 0, e)))),
        ),
      );
    });

    const raymarch = Fn(() => {
      const uvCoord = uv().sub(0.5);
      const ro = vec3(0, 0, 3.5);
      const rd = normalize(vec3(uvCoord.x.mul(uAspect).mul(2.0), uvCoord.y.mul(2.0), float(-1.5)));

      // Match IdentityWorld water background color for proper transparency blend
      const bg = vec3(0.1, 0.38, 0.5);

      const resultColor = vec3(bg).toVar();
      const t = float(0).toVar();
      const hitFlag = float(0).toVar();

      Loop(20, () => {
        const p = ro.add(rd.mul(t));
        const d = sceneSDF(p);

        If(d.lessThan(0.002), () => {
          hitFlag.assign(1);
          const n = calcNormal(p);
          const lDir = normalize(vec3(2, 3, 2));

          // Real bubble shading — matching Bubbles component style
          // Very subtle diffuse
          const diff = max(dot(n, lDir), float(0)).mul(0.06);

          // Sharp tiny specular
          const hDir = normalize(lDir.sub(rd));
          const spec = pow(max(dot(n, hDir), float(0)), float(200)).mul(0.6);

          // Natural fresnel
          const ndotv = max(dot(n, rd.negate()), float(0));
          const fresnel = pow(float(1).sub(ndotv), float(3));

          // Pale edge — like light bending through glass
          const edge = vec3(0.85, 0.92, 0.95).mul(fresnel).mul(0.2);

          // Combine — bg shows through, only edges + specular visible
          const blobContrib = bg
            .mul(diff)
            .add(edge)
            .add(vec3(1, 1, 1).mul(spec));
          resultColor.assign(bg.add(blobContrib.mul(float(0.15).add(fresnel.mul(0.4)))));
          Break();
        });

        If(t.greaterThan(10), () => {
          Break();
        });
        t.addAssign(d);
      });

      // Soft halo — no extra SDF loop
      const halo = smoothstep(float(0.4), float(0.0), length(uvCoord))
        .mul(float(1).sub(hitFlag))
        .mul(0.03);
      const haloC = mix(cCyan, cPurple, sin(uTime.mul(0.2)).mul(0.5).add(0.5));
      resultColor.assign(resultColor.add(haloC.mul(halo)));

      // Alpha: transparent where no blob hit, visible where blob exists
      const alpha = max(hitFlag, halo.mul(10.0).min(float(1)));
      return vec4(resultColor, alpha);
    });

    return { colorNode: raymarch(), uniforms: { uTime, uAspect } };
  }, [size.width, size.height]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uAspect.value = size.width / size.height;
    if (meshRef.current) meshRef.current.frustumCulled = false;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[30, 18]} />
      <meshBasicNodeMaterial colorNode={colorNode} transparent depthWrite={false} />
    </mesh>
  );
}
