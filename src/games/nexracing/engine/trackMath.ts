import * as THREE from 'three';
import { CircuitSpec } from '../types/game';

export interface TrackSample {
  index: number;
  sNorm: number; // 0 .. 1
  distance: number; // meters from start
  position: THREE.Vector3;
  tangent: THREE.Vector3; // horizontal forward unit vector
  right: THREE.Vector3; // lateral unit vector pointing right (outer edge on CCW oval)
  surfaceRight: THREE.Vector3; // tilted by banking
  surfaceNormal: THREE.Vector3; // tilted surface up normal
  bank: number; // radians
  curvature: number; // signed curvature (positive = turning left)
  width: number;
}

export interface CompiledTrack {
  spec: CircuitSpec;
  samples: TrackSample[];
  totalLength: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  minimapPoints: Array<{ x: number; y: number }>;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function compileTrack(spec: CircuitSpec, sampleCount = 320): CompiledTrack {
  const pts = spec.waypoints.map((w) => new THREE.Vector3(w.x, w.y, w.z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

  const n = spec.waypoints.length;
  const rawPositions: THREE.Vector3[] = [];
  const rawBanks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleCount;
    const pos = curve.getPointAt(t);
    // Interpolate banking smoothly from waypoint array
    const wf = t * n;
    const i0 = Math.floor(wf) % n;
    const i1 = (i0 + 1) % n;
    const iPrev = (i0 - 1 + n) % n;
    const i2 = (i1 + 1) % n;
    const frac = wf - Math.floor(wf);

    // Smooth cubic Hermite / Catmull-Rom scalar interpolation for banking
    const b0 = spec.waypoints[iPrev].bank;
    const b1 = spec.waypoints[i0].bank;
    const b2 = spec.waypoints[i1].bank;
    const b3 = spec.waypoints[i2].bank;
    const f2 = frac * frac;
    const f3 = f2 * frac;
    const rawBank =
      0.5 *
      (2 * b1 +
        (-b0 + b2) * frac +
        (2 * b0 - 5 * b1 + 4 * b2 - b3) * f2 +
        (-b0 + 3 * b1 - 3 * b2 + b3) * f3);
    const bank = Math.max(0, rawBank);

    // Elevate centerline based on tan(bank) so inner apron stays cleanly at y >= 0.05
    const halfW = spec.trackWidth * 0.5;
    pos.y = halfW * Math.tan(Math.abs(bank)) + 0.05;

    rawPositions.push(pos);
    rawBanks.push(bank);
  }

  let totalLength = 0;
  const distances: number[] = [0];
  for (let i = 1; i < sampleCount; i++) {
    totalLength += rawPositions[i].distanceTo(rawPositions[i - 1]);
    distances.push(totalLength);
  }
  totalLength += rawPositions[0].distanceTo(rawPositions[sampleCount - 1]);

  const samples: TrackSample[] = [];
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < sampleCount; i++) {
    const prev = rawPositions[(i - 1 + sampleCount) % sampleCount];
    const curr = rawPositions[i];
    const next = rawPositions[(i + 1) % sampleCount];

    const tangent = new THREE.Vector3().subVectors(next, prev);
    tangent.y = 0;
    tangent.normalize();

    const right = new THREE.Vector3().crossVectors(tangent, WORLD_UP).normalize();
    const bank = rawBanks[i];

    // Rotate right & up around tangent by bank angle
    const cosB = Math.cos(bank);
    const sinB = Math.sin(bank);
    const surfaceRight = right.clone().multiplyScalar(cosB).addScaledVector(WORLD_UP, sinB).normalize();
    const surfaceNormal = WORLD_UP.clone().multiplyScalar(cosB).addScaledVector(right, -sinB).normalize();

    // Curvature estimate
    const v1 = new THREE.Vector3().subVectors(curr, prev);
    v1.y = 0;
    const v2 = new THREE.Vector3().subVectors(next, curr);
    v2.y = 0;
    const len = Math.max(0.01, (v1.length() + v2.length()) * 0.5);
    v1.normalize();
    v2.normalize();
    // Cross y positive means turning left (CCW)
    const crossY = v2.x * v1.z - v2.z * v1.x;
    const curvature = crossY / len;

    if (curr.x < minX) minX = curr.x;
    if (curr.x > maxX) maxX = curr.x;
    if (curr.z < minZ) minZ = curr.z;
    if (curr.z > maxZ) maxZ = curr.z;

    samples.push({
      index: i,
      sNorm: distances[i] / totalLength,
      distance: distances[i],
      position: curr,
      tangent,
      right,
      surfaceRight,
      surfaceNormal,
      bank,
      curvature,
      width: spec.trackWidth,
    });
  }

  // Normalized minimap points (0..100 SVG box)
  const pad = 12;
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const scale = (100 - pad * 2) / Math.max(spanX, spanZ);
  const offsetX = (100 - spanX * scale) * 0.5;
  const offsetZ = (100 - spanZ * scale) * 0.5;

  const minimapPoints: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < sampleCount; i += 4) {
    const p = samples[i].position;
    minimapPoints.push({
      x: offsetX + (p.x - minX) * scale,
      y: offsetZ + (p.z - minZ) * scale,
    });
  }

  return {
    spec,
    samples,
    totalLength,
    bounds: { minX, maxX, minZ, maxZ },
    minimapPoints,
  };
}

export interface ClosestTrackResult {
  sampleIndex: number;
  sNorm: number;
  lateralOffset: number; // positive = toward outer right wall
  surfaceY: number;
  bank: number;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  surfaceNormal: THREE.Vector3;
  curvature: number;
  trackPoint: THREE.Vector3;
}

export function findClosestTrackPoint(
  track: CompiledTrack,
  x: number,
  z: number,
  hintIndex?: number,
): ClosestTrackResult {
  const samples = track.samples;
  const count = samples.length;

  let bestIdx = 0;
  let bestDistSq = Infinity;

  if (hintIndex !== undefined && hintIndex >= 0 && hintIndex < count) {
    // Search local window +- 28 samples first
    const window = 28;
    for (let offset = -window; offset <= window; offset++) {
      const idx = (hintIndex + offset + count) % count;
      const p = samples[idx].position;
      const dx = x - p.x;
      const dz = z - p.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = idx;
      }
    }
    // Fallback full scan if too far away
    if (bestDistSq > 1600) {
      for (let i = 0; i < count; i++) {
        const p = samples[i].position;
        const dx = x - p.x;
        const dz = z - p.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = i;
        }
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      const p = samples[i].position;
      const dx = x - p.x;
      const dz = z - p.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
  }

  const s0 = samples[bestIdx];
  const sNext = samples[(bestIdx + 1) % count];
  const dx = x - s0.position.x;
  const dz = z - s0.position.z;

  // Project onto segment tangent
  const segLen = Math.max(0.1, s0.position.distanceTo(sNext.position));
  const along = dx * s0.tangent.x + dz * s0.tangent.z;
  const frac = THREE.MathUtils.clamp(along / segLen, -0.5, 1.0);

  const sNorm = ((s0.sNorm + (frac * segLen) / track.totalLength) % 1 + 1) % 1;
  const lateralOffset = dx * s0.right.x + dz * s0.right.z;

  // Compute exact surface Y at this lateral offset using tan(bank) matching horizontal road edges
  const bank = THREE.MathUtils.lerp(s0.bank, sNext.bank, Math.max(0, frac));
  const baseY = THREE.MathUtils.lerp(s0.position.y, sNext.position.y, Math.max(0, frac));
  const surfaceY = baseY + lateralOffset * Math.tan(bank);

  return {
    sampleIndex: bestIdx,
    sNorm,
    lateralOffset,
    surfaceY,
    bank,
    tangent: s0.tangent,
    right: s0.right,
    surfaceNormal: s0.surfaceNormal,
    curvature: s0.curvature,
    trackPoint: s0.position,
  };
}

export function getSampleAtNorm(track: CompiledTrack, sNorm: number): TrackSample {
  const norm = ((sNorm % 1) + 1) % 1;
  const idx = Math.floor(norm * track.samples.length) % track.samples.length;
  return track.samples[idx];
}
