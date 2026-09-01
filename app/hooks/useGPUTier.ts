import { useEffect, useState } from "react";

export type GPUTier = "low" | "high";

export function detectGPUTier(): GPUTier {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const cores = navigator.hardwareConcurrency || 2;
  const dpr = window.devicePixelRatio || 1;
  const hasWebGPU = "gpu" in navigator;

  // Mobile or low-spec: reduce quality
  if (isTouch || cores <= 4 || (!hasWebGPU && dpr < 2)) return "low";
  return "high";
}

export function useGPUTier() {
  const [tier, setTier] = useState<GPUTier>("low");

  useEffect(() => {
    setTier(detectGPUTier());
  }, []);

  return tier;
}
