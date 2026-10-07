import { type RefObject, useEffect, useRef } from "react";
import { sceneReady } from "~/state/sceneReady";

interface Options {
  /** Rendered frames to wait before signalling readiness (masks shader compile). */
  frames?: number;
}

/**
 * Wiring shared by every scene's post-processing render loop.
 *
 * 1. Signals {@link sceneReady} after a few real frames, so the LoadingScreen
 *    only dismisses once the scene is actually on screen (fixes the black flash).
 *    NOTE: readiness is driven from inside the existing render loop on purpose —
 *    issuing a *separate* one-off render (e.g. a standalone `renderAsync()`)
 *    concurrently with the per-frame loop puts the WebGPU renderer into a bad
 *    state and freezes the main thread.
 * 2. Forces a render when the tab becomes visible again — the scene renders only
 *    via a manual draw in a prioritised `useFrame`, so without this a tab
 *    backgrounded during load could come back black until the next rAF tick.
 *
 * Returns `onRendered`, which the caller invokes once per frame AFTER its draw.
 */
export function useSceneReady<T extends { render?: () => void; renderAsync?: () => unknown }>(
  pipelineRef: RefObject<T | null>,
  { frames = 5 }: Options = {},
): () => void {
  const countRef = useRef(0);

  useEffect(() => {
    // Fresh count whenever this scene (re)mounts.
    countRef.current = 0;

    const onVisible = () => {
      if (document.hidden) return;
      try {
        const p = pipelineRef.current;
        if (p?.renderAsync) p.renderAsync();
        else p?.render?.();
      } catch {
        // Renderer may be mid-teardown; the next rAF tick will recover.
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pipelineRef]);

  return function onRendered() {
    if (countRef.current < 0) return; // already signalled
    countRef.current += 1;
    if (countRef.current >= frames) {
      countRef.current = -1;
      sceneReady.markReady();
    }
  };
}
