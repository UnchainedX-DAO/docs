import { useTexture } from "@react-three/drei";
import { RepeatWrapping } from "three";

export type PBRSet =
  | "metal_dark"
  | "steel_galvanized"
  | "brass"
  | "oxidized_steel"
  | "speedway_tiles"
  | "cs_concretepaintdarkold";

const BASE_PATH = "/textures/pbr";

/**
 * Load a full PBR texture set from the Neo City materials.
 * Returns props to spread onto a meshStandardMaterial.
 */
export function usePBRTextures(set: PBRSet, repeat: [number, number] = [1, 1]) {
  const path = `${BASE_PATH}/${set}`;
  const textures = useTexture({
    map: `${path}/basecolor.png`,
    metalnessMap: `${path}/metallic.png`,
    roughnessMap: `${path}/roughness.png`,
    normalMap: `${path}/normal.png`,
    aoMap: `${path}/ao.png`,
  });

  // Set repeat/wrapping for all textures
  for (const tex of Object.values(textures)) {
    if (tex && "wrapS" in tex) {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.repeat.set(repeat[0], repeat[1]);
    }
  }

  return textures;
}
