import {
  abs,
  float,
  fract,
  max,
  min,
  mix,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { fbmLight } from "~/components/three/tsl/noise";

/**
 * Chain-link dissolve transition shader.
 *
 * outgoingTex: THREE.Texture (snapshot RT, can be sampled with custom UVs)
 * incomingNode: TSL node (live scene + bloom, evaluated at default UVs)
 */
export function buildChainTransition(
  outgoingTex: any,
  incomingNode: any,
  uProgress: any,
  uTime: any,
) {
  const uvCoord = uv();

  // --- Diagonal sweep ---
  const slope = float(0.6);
  const diagonal = uvCoord.x.mul(slope).add(uvCoord.y);
  const diagonalMax = slope.add(1.0);
  const diagNorm = diagonal.div(diagonalMax);

  // --- Chain link SDF ---
  const tileScale = float(10.0);
  const tiledUV = uvCoord.mul(tileScale);
  const row = tiledUV.y.floor();
  const isOddRow = fract(row.mul(0.5)).mul(2.0);
  const offsetX = isOddRow.mul(0.5);
  const cellUV = vec2(fract(tiledUV.x.add(offsetX)), fract(tiledUV.y));
  const p = cellUV.sub(0.5);

  const outerSize = vec2(float(0.35), float(0.2));
  const outerRound = float(0.08);
  const dOuter = vec2(abs(p.x).sub(outerSize.x), abs(p.y).sub(outerSize.y));
  const outerSDF = min(max(dOuter.x, dOuter.y), float(0.0))
    .add(vec2(max(dOuter.x, float(0.0)), max(dOuter.y, float(0.0))).length())
    .sub(outerRound);

  const innerSize = vec2(float(0.2), float(0.08));
  const innerRound = float(0.04);
  const dInner = vec2(abs(p.x).sub(innerSize.x), abs(p.y).sub(innerSize.y));
  const innerSDF = min(max(dInner.x, dInner.y), float(0.0))
    .add(vec2(max(dInner.x, float(0.0)), max(dInner.y, float(0.0))).length())
    .sub(innerRound);

  const chainSDF = max(outerSDF, innerSDF.negate());

  // --- Dissolve ---
  const dissolveNoise = fbmLight(uvCoord.mul(4.0).add(vec2(uTime.mul(0.2), uTime.mul(0.15))));
  const dissolveVal = diagNorm.mul(0.6).add(chainSDF.mul(1.5)).add(dissolveNoise.mul(0.3));
  const threshold = float(1.0).sub(uProgress.mul(1.8));
  const dissolveMask = smoothstep(threshold.sub(0.03), threshold.add(0.03), dissolveVal);

  // --- Edge glow ---
  const edgeDist = abs(dissolveVal.sub(threshold));
  const edgeMask = smoothstep(float(0.06), float(0.0), edgeDist);
  const glowStr = edgeMask.mul(edgeMask).mul(1.2);
  const cyanGlow = vec3(float(0.0), float(0.94), float(1.0)).mul(glowStr).mul(float(1.0).sub(dissolveMask));
  const purpleGlow = vec3(float(0.75), float(0.0), float(1.0)).mul(glowStr).mul(dissolveMask);
  const chainGlow = cyanGlow.add(purpleGlow);

  // --- Composite ---
  const outScene = texture(outgoingTex, uvCoord).rgb;
  const inScene = incomingNode.rgb;
  const composited = mix(outScene, inScene, dissolveMask);

  return vec4(composited.add(chainGlow), float(1.0));
}
