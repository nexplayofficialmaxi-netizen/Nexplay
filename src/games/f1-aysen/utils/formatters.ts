import { CircuitDefinition } from '../types/game';

export function formatLapTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms <= 0 || !Number.isFinite(ms)) {
    return '--:--.---';
  }
  const totalSec = ms / 1000;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const millis = Math.floor(ms % 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis
    .toString()
    .padStart(3, '0')}`;
}

export function getTrackSvgGeometry(
  circuit: CircuitDefinition,
  width = 200,
  height = 140,
  padding = 16
): {
  pathData: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; scale: number; offsetX: number; offsetY: number };
} {
  const pts = circuit.controlPoints;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, , z] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const scale = Math.min(
    (width - padding * 2) / spanX,
    (height - padding * 2) / spanZ
  );
  const offsetX = (width - spanX * scale) * 0.5 - minX * scale;
  const offsetY = (height - spanZ * scale) * 0.5 - minZ * scale;

  const project = (x: number, z: number) => [
    x * scale + offsetX,
    z * scale + offsetY,
  ];

  // Catmull-Rom smooth polyline approximation for SVG
  const steps = 96;
  const n = pts.length;
  const dParts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * n;
    const idx = Math.floor(u) % n;
    const t = u - Math.floor(u);
    const p0 = pts[(idx - 1 + n) % n];
    const p1 = pts[idx];
    const p2 = pts[(idx + 1) % n];
    const p3 = pts[(idx + 2) % n];

    const t2 = t * t;
    const t3 = t2 * t;
    const x =
      0.5 *
      (2 * p1[0] +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
    const z =
      0.5 *
      (2 * p1[2] +
        (-p0[2] + p2[2]) * t +
        (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
        (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3);

    const [sx, sy] = project(x, z);
    dParts.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }
  dParts.push('Z');

  return {
    pathData: dParts.join(' '),
    bounds: { minX, maxX, minZ, maxZ, scale, offsetX, offsetY },
  };
}
