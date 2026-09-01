import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber";
import type { FC, PropsWithChildren } from "react";
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three/webgpu";

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
  return (
    <Canvas
      className={className}
      dpr={dpr ?? [1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 5], fov: cameraFov }}
      gl={async (props) => {
        try {
          const renderer = new THREE.WebGPURenderer({
            ...(props as WebGPURendererParameters),
            antialias: true,
          });
          await renderer.init();
          renderer.localClippingEnabled = true;
          return renderer;
        } catch (e) {
          console.warn("[WebGPU] Failed to init, falling back to WebGL:", e);
          return new THREE.WebGLRenderer({
            canvas: props.canvas as HTMLCanvasElement,
            antialias: true,
            alpha: true,
          });
        }
      }}
    >
      {children}
    </Canvas>
  );
};

export default WebGPUCanvas;
