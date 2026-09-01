import { Environment as DreiEnvironment } from "@react-three/drei";

/**
 * Scene environment: Shanghai Bund HDRI — neon city night.
 * Used as both environment map (reflections) AND visible background.
 */
export default function Environment() {
  return (
    <DreiEnvironment
      files="/textures/hdri_shanghai.hdr"
      background={false}
      environmentIntensity={0.5}
    />
  );
}
