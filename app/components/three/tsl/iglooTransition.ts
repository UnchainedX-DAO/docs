import {
  abs,
  float,
  mix,
  normalize,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { fbmLight } from "~/components/three/tsl/noise";

/**
 * igloo.inc-style diagonal wipe transition shader.
 *
 * outgoingTex: THREE.Texture (snapshot RT, can be sampled with custom UVs)
 * incomingNode: TSL node (live scene + bloom, evaluated at default UVs)
 */
export function buildIglooTransition(
  outgoingTex: any,
  incomingNode: any,
  uProgress: any,
  uTime: any,
) {
  const uvCoord = uv();
  const slope = float(0.5);

  // --- Diagonal cut line ---
  const diagonal = uvCoord.x.mul(slope).add(uvCoord.y);
  const diagonalMax = slope.add(1.0);
  const edgeWidth = float(0.12);
  const cutLine = uProgress.mul(diagonalMax.add(edgeWidth.mul(2.0))).sub(edgeWidth);

  const edgeDist = diagonal.sub(cutLine);

  // Wipe mask: 0 = outgoing, 1 = incoming
  const wipeMask = smoothstep(float(0.01), float(-0.01), edgeDist);

  // Edge proximity
  const edgeMask = smoothstep(edgeWidth, float(0.0), abs(edgeDist));

  // --- Parallax Y offset (outgoing only, since incoming is a node not a texture) ---
  const parallaxAmount = float(0.06);
  const outgoingParallax = uProgress.mul(parallaxAmount);
  const outgoingUV = uvCoord.add(vec2(float(0.0), outgoingParallax));

  // --- Noise displacement near edge (outgoing only) ---
  const noiseInput = uvCoord.mul(6.0).add(vec2(uTime.mul(0.3), uTime.mul(0.2)));
  const noiseVal = fbmLight(noiseInput).sub(0.5);
  const displacement = edgeMask.mul(noiseVal).mul(0.025);
  const outgoingUVFinal = outgoingUV.add(vec2(displacement, displacement.mul(0.6)));

  // --- Chromatic aberration (outgoing side only) ---
  const perpDir = normalize(vec2(float(1.0), slope));
  const aberration = edgeMask.mul(0.012);

  const outR = texture(outgoingTex, outgoingUVFinal.add(perpDir.mul(aberration))).x;
  const outG = texture(outgoingTex, outgoingUVFinal).y;
  const outB = texture(outgoingTex, outgoingUVFinal.sub(perpDir.mul(aberration))).z;
  const outScene = vec3(outR, outG, outB);

  // Incoming: use as-is (TSL node, already at default UVs)
  const inScene = incomingNode.rgb;

  // --- Composite ---
  const composited = mix(outScene, inScene, wipeMask);

  // --- Edge glow ---
  const glowStr = edgeMask.mul(edgeMask).mul(0.8);
  const cyanGlow = vec3(float(0.0), float(0.94), float(1.0)).mul(glowStr).mul(float(1.0).sub(wipeMask));
  const purpleGlow = vec3(float(0.75), float(0.0), float(1.0)).mul(glowStr).mul(wipeMask);
  const edgeGlow = cyanGlow.add(purpleGlow);

  return vec4(composited.add(edgeGlow), float(1.0));
}
