import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { sceneReady } from "~/state/sceneReady";

interface Props {
  /** Rendered frames to wait before signalling readiness (masks shader compile). */
  frames?: number;
}

/**
 * Readiness signal for scenes that render via R3F's automatic loop rather than a
 * manual post-processing pipeline (Contact / Docs backgrounds). Those scenes have
 * no `pipeline.renderAsync()` to hook, so {@link useSceneReady} doesn't apply —
 * this just counts real frames and calls {@link sceneReady.markReady} so the
 * LoadingScreen dismisses promptly instead of waiting out its hard cap.
 *
 * Priority 0 (default) so it never takes over the auto-render.
 */
export default function SceneReadySignal({ frames = 5 }: Props) {
  const countRef = useRef(0);
  useFrame(() => {
    if (countRef.current < 0) return; // already signalled
    countRef.current += 1;
    if (countRef.current >= frames) {
      countRef.current = -1;
      sceneReady.markReady();
    }
  });
  return null;
}
