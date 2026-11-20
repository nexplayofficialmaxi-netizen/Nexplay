export const TARGET_RAM_BUDGET_MB = 600;
export const TARGET_RAM_BUDGET_BYTES = TARGET_RAM_BUDGET_MB * 1024 * 1024;

export const MAX_PIXEL_RATIO_RACE = 1.35;
export const MAX_PIXEL_RATIO_SHOWROOM = 1.5;
export const RACE_SHADOW_MAP_SIZE = 1024;
export const SHOWROOM_SHADOW_MAP_SIZE = 512;
export const MAX_REPLAY_FRAMES = 3600;

interface PerfMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function getJsHeapBytes(): number {
  const perf = performance as Performance & { memory?: PerfMemory };
  return perf.memory?.usedJSHeapSize ?? 0;
}

export function getClampedPixelRatio(
  maxRatio: number,
  isSoftwareGl: boolean
): number {
  if (isSoftwareGl) return 1;
  const usedBytes = getJsHeapBytes();
  // Automatically step down to 1.0x if JS heap passes 65% of the 600 MB ceiling
  if (usedBytes > TARGET_RAM_BUDGET_BYTES * 0.65) {
    return 1;
  }
  return Math.min(window.devicePixelRatio || 1, maxRatio);
}
