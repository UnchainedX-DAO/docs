import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { bloom } from "~/components/three/tsl/BloomNode.js";
import { emissive, mrt, output, pass, vec4 } from "three/tsl";

interface ScenePostProcessingProps {
  bloomStrength?: number;
  bloomRadius?: number;
}

export default function ScenePostProcessing({
  bloomStrength = 1.0,
  bloomRadius = 0.3,
}: ScenePostProcessingProps) {
  const { gl, scene, camera } = useThree();
  const pipelineRef = useRef<THREE.RenderPipeline | null>(null);

  useEffect(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    const emTex = scenePass.getTexture("emissive");
    emTex.type = THREE.UnsignedByteType;

    const outputPass = scenePass.getTextureNode();
    const emissivePass = scenePass.getTextureNode("emissive");
    const bloomNode = bloom(emissivePass, bloomStrength, bloomRadius);

    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = outputPass.add(bloomNode);
    pipelineRef.current = pipeline;

    return () => { pipelineRef.current = null; };
  }, [gl, scene, camera, bloomStrength, bloomRadius]);

  useFrame(() => {
    pipelineRef.current?.renderAsync();
  }, 1);

  return null;
}
