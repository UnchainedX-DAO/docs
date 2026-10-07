import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber";
import { type FC, type PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three/webgpu";
import { sceneReady } from "~/state/sceneReady";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as unknown as Record<string, unknown>);

type Props = PropsWithChildren<{
  className?: string;
  dpr?: number | [number, number];
  frameloop?: "always" | "demand" | "never";
  fov?: number;
}>;

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const WebGPUCanvas: FC<Props> = ({ children, className, dpr, frameloop = "always", fov }) => {
  const cameraFov = fov ?? (isMobile ? 65 : 50);
  // Bumping this key remounts the <Canvas>, rebuilding the renderer from scratch
  // after a GPU device loss (otherwise the scene stays frozen/black forever).
  const [renderKey, setRenderKey] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleDeviceLost = useCallback((renderer: THREE.WebGPURenderer) => {
    type DeviceLostInfo = { reason: string; message: string };
    const device = (renderer.backend as { device?: { lost?: Promise<DeviceLostInfo> } } | undefined)
      ?.device;
    device?.lost?.then((info) => {
      // "destroyed" is the normal result of disposing the renderer (unmount /
      // intentional remount) — only react to genuine, unexpected losses.
      if (!mountedRef.current || info.reason === "destroyed") return;
      console.warn("[WebGPU] device lost, remounting canvas:", info.message);
      sceneReady.reset();
      setRenderKey((k) => k + 1);
    });
  }, []);

  return (
    <Canvas
      key={renderKey}
      className={className}
      dpr={dpr ?? [1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 5], fov: cameraFov }}
      gl={async (props) => {
        // The render path uses WebGPU-only node RenderPipelines, so a plain
        // WebGLRenderer can't drive it. On WebGPU init failure, fall back to
        // WebGPURenderer's own WebGL backend (forceWebGL) which still supports them.
        const base = { ...(props as WebGPURendererParameters), antialias: true };
        try {
          const renderer = new THREE.WebGPURenderer(base);
          await renderer.init();
          renderer.localClippingEnabled = true;
          handleDeviceLost(renderer);
          return renderer;
        } catch (e) {
          console.warn("[WebGPU] init failed, retrying with WebGL backend:", e);
          const renderer = new THREE.WebGPURenderer({ ...base, forceWebGL: true });
          await renderer.init();
          renderer.localClippingEnabled = true;
          return renderer;
        }
      }}
    >
      {children}
    </Canvas>
  );
};

export default WebGPUCanvas;
