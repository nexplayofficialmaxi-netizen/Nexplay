import * as THREE from 'three';
import { CompiledTrack, findClosestTrackPoint, getSampleAtNorm } from './trackMath';
import { StockCarSpec } from '../types/game';

export interface CarInput {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

export interface RaceCarState {
  id: string;
  name: string;
  number: string;
  color: string;
  isPlayer: boolean;
  isRemote: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  heading: number;
  angularVel: number;
  steerAngle: number;
  speed: number;
  rpm: number;
  gear: number;
  slipAmount: number;
  drafting: boolean;
  wrongWay: boolean;
  bankAngle: number;
  bodyRoll: number;
  bodyPitch: number;

  // Fuel, Tires, Damage & Pits
  fuel: number;
  tireWear: number;
  damage: number;
  inPitLane: boolean;
  pitProgress: number;
  aiStunTimer: number;

  // Stunts & Fuel-Saving 3s Boost
  isPlayer2?: boolean;
  airHeight: number;
  vy: number;
  stuntPitch: number;
  stuntPitchVel: number;
  stuntRoll: number;
  stuntRollVel: number;
  rolloverTimer: number;
  cruzFlipTimer: number;
  cruzFlipDuration: number;
  lastWallSign: 1 | -1;
  teleportCooldown: number;
  wallStuntTimer: number;
  fuelBoostCharge: number;
  boostTimer: number;
  boostStrength: number;

  // Progress & timing
  sampleHint: number;
  prevSNorm: number;
  sNorm: number;
  lateralOffset: number;
  totalProgress: number;
  lap: number;
  lapStartMs: number;
  lastLapMs: number | null;
  bestLapMs: number | null;
  totalTimeMs: number;
  finished: boolean;
  finishOrder: number;

  // Performance tuning
  maxSpeedMs: number;
  accelForce: number;
  handlingFactor: number;
  brakeForce: number;

  // AI parameters
  aiTargetLane: number;
  aiLaneTimer: number;
  aiSkill: number;
  aiWantsPit: boolean;
  aiPitStopS: number;
  aiPitCooldown: number;
}

export function createCarStateFromSpec(
  params: {
    id: string;
    name: string;
    number: string;
    color: string;
    isPlayer: boolean;
    isPlayer2?: boolean;
    isRemote?: boolean;
    spec: StockCarSpec;
    aiSkill?: number;
  },
  track: CompiledTrack,
  gridIndex: number,
): RaceCarState {
  const row = Math.floor(gridIndex / 2);
  const col = gridIndex % 2;
  const distBehind = 8 + row * 9.5;
  const sNormStart = (((-distBehind / track.totalLength) % 1) + 1) % 1;
  const smp = getSampleAtNorm(track, sNormStart);

  const laneOffset = col === 0 ? -track.spec.trackWidth * 0.19 : track.spec.trackWidth * 0.19;
  const worldPos = smp.position.clone().addScaledVector(smp.surfaceRight, laneOffset);
  const heading = Math.atan2(smp.tangent.x, smp.tangent.z);

  const stats = params.spec.stats;
  const maxSpeedMs = 124 + (stats.topSpeed / 100) * 16.5; // ~500 km/h top speed
  const accelForce = 42 + (stats.acceleration / 100) * 14;
  const handlingFactor = 0.88 + (stats.handling / 100) * 0.36;
  const brakeForce = 56 + (stats.braking / 100) * 20;

  return {
    id: params.id,
    name: params.name,
    number: params.number,
    color: params.color,
    isPlayer: params.isPlayer,
    isPlayer2: Boolean(params.isPlayer2),
    isRemote: Boolean(params.isRemote),
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    vx: 0,
    vz: 0,
    heading,
    angularVel: 0,
    steerAngle: 0,
    speed: 0,
    rpm: 1400,
    gear: 1,
    slipAmount: 0,
    drafting: false,
    wrongWay: false,
    bankAngle: smp.bank,
    bodyRoll: 0,
    bodyPitch: 0,
    fuel: params.isPlayer || params.isPlayer2 ? 100 : 58 + (gridIndex % 5) * 9,
    tireWear: params.isPlayer || params.isPlayer2 ? 100 : 62 + (gridIndex % 4) * 9,
    damage: 0,
    inPitLane: false,
    pitProgress: 0,
    aiStunTimer: 0,
    airHeight: 0,
    vy: 0,
    stuntPitch: 0,
    stuntPitchVel: 0,
    stuntRoll: 0,
    stuntRollVel: 0,
    rolloverTimer: 0,
    cruzFlipTimer: 0,
    cruzFlipDuration: 1.65,
    lastWallSign: 1,
    teleportCooldown: 0,
    wallStuntTimer: 0,
    fuelBoostCharge: 45,
    boostTimer: 0,
    boostStrength: 0.7,
    sampleHint: smp.index,
    prevSNorm: sNormStart,
    sNorm: sNormStart,
    lateralOffset: laneOffset,
    totalProgress: -distBehind / track.totalLength,
    lap: 1,
    lapStartMs: 0,
    lastLapMs: null,
    bestLapMs: null,
    totalTimeMs: 0,
    finished: false,
    finishOrder: 0,
    maxSpeedMs,
    accelForce,
    handlingFactor,
    brakeForce,
    aiTargetLane: col === 0 ? -0.25 : 0.25,
    aiLaneTimer: 1.5 + Math.random() * 2.5,
    aiSkill: params.aiSkill ?? 0.94,
    aiWantsPit: false,
    aiPitStopS: [0.92, 0.95, 0.98, 0.03, 0.06, 0.09][gridIndex % 6],
    aiPitCooldown: 6 + (gridIndex % 4) * 4,
  };
}

export function triggerWallStunt(
  car: RaceCarState,
  kind: 'fly' | 'spin' | 'flip' | 'rollover' | 'cruzflip',
) {
  if (kind === 'fly') {
    car.rolloverTimer = 0;
    car.cruzFlipTimer = 0;
    car.vy = 26;
    car.airHeight = Math.max(0.25, car.airHeight);
    car.stuntPitchVel = 3.8;
    car.stuntRollVel = 2.6;
    const fwdX = Math.sin(car.heading);
    const fwdZ = Math.cos(car.heading);
    car.vx += fwdX * 16;
    car.vz += fwdZ * 16;
    car.damage = Math.min(100, car.damage + 12);
  } else if (kind === 'flip') {
    car.rolloverTimer = 0;
    car.cruzFlipTimer = 0;
    car.vy = 16.5;
    car.airHeight = Math.max(0.2, car.airHeight);
    car.stuntRollVel = 14.5;
    car.stuntPitchVel = 1.4;
    car.damage = Math.min(100, car.damage + 10);
  } else if (kind === 'rollover') {
    // [4] Volcar el auto: pops and rolls upside down onto its roof, sliding with sparks
    car.cruzFlipTimer = 0;
    car.rolloverTimer = 3.2;
    car.vy = 9.5;
    car.airHeight = Math.max(0.22, car.airHeight);
    car.stuntRollVel = (car.lastWallSign === 1 ? -1 : 1) * 9.5;
    car.stuntPitchVel = 1.1;
    car.damage = Math.min(100, car.damage + 10);
  } else if (kind === 'cruzflip') {
    // [5] ¡Vuelta a Lado Voltereta!: leap inward off the barrier and do a full sideways barrel flip (a lado, not forward)
    car.rolloverTimer = 0;
    car.cruzFlipDuration = 1.55;
    car.cruzFlipTimer = 1.55;
    car.vy = 21.0;
    car.airHeight = Math.max(0.4, car.airHeight);
    car.stuntPitch = 0;
    car.stuntPitchVel = 0;
    car.stuntRoll = 0;
    car.stuntRollVel = 0;
    const fwdX = Math.sin(car.heading);
    const fwdZ = Math.cos(car.heading);
    const rightX = -Math.cos(car.heading);
    const rightZ = Math.sin(car.heading);
    // Propel forward and sideways inward away from the barrier
    car.vx += fwdX * 16 - rightX * car.lastWallSign * 13.5;
    car.vz += fwdZ * 16 - rightZ * car.lastWallSign * 13.5;
    car.speed = Math.max(car.speed, 42) + 16;
    car.boostTimer = Math.max(car.boostTimer, 1.8);
    car.boostStrength = Math.max(car.boostStrength, 0.8);
    car.damage = Math.min(100, car.damage + 6);
  } else {
    // 'spin' - hilarious tornado spin wreck
    car.rolloverTimer = 0;
    car.cruzFlipTimer = 0;
    car.vy = 7.5;
    car.airHeight = Math.max(0.1, car.airHeight);
    car.angularVel = (Math.random() < 0.5 ? 1 : -1) * 18;
    car.stuntRollVel = 2.5;
    car.damage = Math.min(100, car.damage + 8);
  }
}

export function activateFuelBoost(car: RaceCarState): boolean {
  if (car.boostTimer > 0 || car.fuelBoostCharge < 20) return false;
  const savedFactor = (car.fuelBoostCharge / 100) * 0.65 + (car.fuel / 100) * 0.35;
  car.boostStrength = THREE.MathUtils.clamp(savedFactor, 0.35, 1.0);
  car.boostTimer = 3.0;
  car.fuelBoostCharge = 0;
  const kick = 9 * car.boostStrength;
  car.vx += Math.sin(car.heading) * kick;
  car.vz += Math.cos(car.heading) * kick;
  car.speed += kick;
  return true;
}

export function resetCarToTrack(car: RaceCarState, track: CompiledTrack) {
  const smp = getSampleAtNorm(track, car.sNorm);
  car.x = smp.position.x;
  car.y = smp.position.y + 0.04;
  car.z = smp.position.z;
  car.vx = 0;
  car.vz = 0;
  car.speed = 0;
  car.angularVel = 0;
  car.airHeight = 0;
  car.vy = 0;
  car.stuntPitch = 0;
  car.stuntPitchVel = 0;
  car.stuntRoll = 0;
  car.stuntRollVel = 0;
  car.rolloverTimer = 0;
  car.cruzFlipTimer = 0;
  car.teleportCooldown = 0;
  car.heading = Math.atan2(smp.tangent.x, smp.tangent.z);
  car.bankAngle = smp.bank;
  car.wrongWay = false;
  car.damage = Math.min(car.damage, 35);
}

export function computeAiInput(
  car: RaceCarState,
  allCars: RaceCarState[],
  track: CompiledTrack,
  dt: number,
): CarInput {
  if (car.aiStunTimer > 0) {
    car.aiStunTimer = Math.max(0, car.aiStunTimer - dt);
    return {
      throttle: false,
      brake: true,
      left: false,
      right: false,
      handbrake: false,
    };
  }

  car.aiLaneTimer -= dt;
  if (car.aiLaneTimer <= 0) {
    car.aiLaneTimer = 2.0 + Math.random() * 3.0;
    car.aiTargetLane = (Math.random() - 0.5) * 0.65;
  }

  if (car.aiPitCooldown > 0) {
    car.aiPitCooldown = Math.max(0, car.aiPitCooldown - dt);
  }
  if (!car.aiWantsPit && car.aiPitCooldown <= 0 && (car.fuel < 42 || car.tireWear < 48 || car.damage > 55)) {
    car.aiWantsPit = true;
  }

  const lookAheadDist = THREE.MathUtils.clamp(16 + Math.abs(car.speed) * 0.48, 16, 52);
  const lookSNorm = (car.sNorm + lookAheadDist / track.totalLength) % 1;
  const aheadSample = getSampleAtNorm(track, lookSNorm);

  const farAheadDist = THREE.MathUtils.clamp(35 + Math.abs(car.speed) * 0.75, 35, 85);
  const farSample = getSampleAtNorm(track, (car.sNorm + farAheadDist / track.totalLength) % 1);

  const trackHalfW = track.spec.trackWidth * 0.5;
  const halfW = trackHalfW - 2.6;

  // AI Pit Stop Routing (approach apron -> enter Pit Road -> stop at stall -> merge back on track)
  const inPitApproach = car.sNorm >= 0.70 && car.sNorm < 0.80;
  const inPitCorridor = car.sNorm >= 0.80 || car.sNorm <= 0.18;
  let desiredLateralMeters: number | null = null;
  let pitSpeedCap: number | null = null;

  if (car.aiWantsPit && inPitApproach) {
    desiredLateralMeters = -trackHalfW + 2.5;
    pitSpeedCap = Math.min(car.maxSpeedMs * 0.72, 68);
  } else if (car.aiWantsPit && inPitCorridor) {
    desiredLateralMeters = -trackHalfW - 6.4;
    // Distance ahead along loop to assigned pit stall
    let dsToStall = car.aiPitStopS - car.sNorm;
    if (dsToStall < -0.5) dsToStall += 1;
    if (car.pitProgress > 0 || (car.inPitLane && Math.abs(dsToStall) < 0.018)) {
      // Hold stopped inside pit stall while crew changes tires & refuels!
      return {
        throttle: false,
        brake: true,
        left: false,
        right: false,
        handbrake: false,
      };
    }
    pitSpeedCap = dsToStall > 0 && dsToStall < 0.06 ? 13.5 : 24;
  } else if (!car.aiWantsPit && car.inPitLane) {
    // Finished pit stop: accelerate and merge smoothly back onto racing asphalt before sNorm 0.20
    desiredLateralMeters = car.sNorm > 0.13 && car.sNorm < 0.25 ? -trackHalfW + 4.5 : -trackHalfW - 3.5;
    pitSpeedCap = 36;
  }

  let targetLaneFrac = car.aiTargetLane;
  if (desiredLateralMeters === null) {
    for (const other of allCars) {
      if (other.id === car.id) continue;
      let ds = other.sNorm - car.sNorm;
      if (ds < 0) ds += 1;
      if (ds > 0 && ds < 0.045) {
        const latDiff = Math.abs(other.lateralOffset - car.lateralOffset);
        if (latDiff < 3.6) {
          targetLaneFrac = other.lateralOffset > 0 ? -0.42 : 0.42;
          break;
        }
      }
    }
  }

  const lateralTarget = desiredLateralMeters !== null ? desiredLateralMeters : targetLaneFrac * halfW;
  const targetPoint = aheadSample.position.clone().addScaledVector(aheadSample.right, lateralTarget);

  const toTargetX = targetPoint.x - car.x;
  const toTargetZ = targetPoint.z - car.z;
  const desiredHeading = Math.atan2(toTargetX, toTargetZ);

  let angleDiff = desiredHeading - car.heading;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const left = angleDiff > 0.045;
  const right = angleDiff < -0.045;

  const absCurv = Math.max(Math.abs(aheadSample.curvature), Math.abs(farSample.curvature));
  const bankBonus = 1 + Math.abs(farSample.bank) * 1.25;
  let safeSpeed = car.maxSpeedMs * car.aiSkill;
  if (absCurv > 0.008) {
    safeSpeed = Math.min(safeSpeed, (36 / Math.sqrt(absCurv * 14)) * bankBonus * car.aiSkill);
  }
  if (pitSpeedCap !== null) {
    safeSpeed = Math.min(safeSpeed, pitSpeedCap);
  }
  safeSpeed = Math.max(12, safeSpeed);

  return {
    throttle: car.speed < safeSpeed,
    brake: car.speed > safeSpeed + (pitSpeedCap !== null ? 3.5 : 9),
    left,
    right,
    handbrake: false,
  };
}

export interface StepCarEvents {
  wallHitStrength: number;
  completedLap: boolean;
  justFinished: boolean;
  pitServiced: boolean;
  teleported: boolean;
  scrapingRoof: boolean;
}

export function stepCarPhysics(
  car: RaceCarState,
  input: CarInput,
  track: CompiledTrack,
  dt: number,
  raceElapsedMs: number,
  totalLaps: number,
  raceLive: boolean,
): StepCarEvents {
  const events: StepCarEvents = {
    wallHitStrength: 0,
    completedLap: false,
    justFinished: false,
    pitServiced: false,
    teleported: false,
    scrapingRoof: false,
  };

  if (car.isRemote) {
    return events;
  }

  if (!raceLive) {
    const targetRpm = input.throttle ? 6400 + Math.sin(raceElapsedMs * 0.03) * 400 : 1450;
    car.rpm = THREE.MathUtils.lerp(car.rpm, targetRpm, Math.min(1, dt * 10));
    car.speed = 0;
    return events;
  }

  if (car.wallStuntTimer > 0) {
    car.wallStuntTimer = Math.max(0, car.wallStuntTimer - dt);
  }
  if (car.teleportCooldown > 0) {
    car.teleportCooldown = Math.max(0, car.teleportCooldown - dt);
  }

  if (car.isPlayer || car.isPlayer2) {
    const burnRate = input.throttle ? 0.36 : 0.08;
    car.fuel = Math.max(0, car.fuel - burnRate * dt);

    if (car.boostTimer > 0) {
      car.boostTimer = Math.max(0, car.boostTimer - dt);
    } else {
      // Saving gas charges the 3s Enter boost! Coasting/lifting off throttle charges faster.
      const saveRate = (!input.throttle ? 22 : 0) + (car.fuel / 100) * 6.5;
      car.fuelBoostCharge = Math.min(100, car.fuelBoostCharge + saveRate * dt);
    }
  } else {
    // AI bots also consume fuel & wear tires so they periodically enter Pit Road!
    const aiBurn = input.throttle ? 0.85 : 0.15;
    car.fuel = Math.max(8, car.fuel - aiBurn * dt);
  }

  const prevVelSpeed = Math.hypot(car.vx, car.vz);
  const fwdX = Math.sin(car.heading);
  const fwdZ = Math.cos(car.heading);
  const rightX = -Math.cos(car.heading);
  const rightZ = Math.sin(car.heading);

  let fwdVel = car.vx * fwdX + car.vz * fwdZ;
  let latVel = car.vx * rightX + car.vz * rightZ;
  let slipAngle = 0;
  if (prevVelSpeed > 4.5 && fwdVel > 1.0) {
    let rawDiff = car.heading - Math.atan2(car.vx, car.vz);
    while (rawDiff > Math.PI) rawDiff -= Math.PI * 2;
    while (rawDiff < -Math.PI) rawDiff += Math.PI * 2;
    slipAngle = rawDiff;
  }

  const damageFactor = 1 - (car.damage / 100) * 0.24;
  const fuelCapFactor = car.fuel <= 0.1 ? 0.34 : 1.0;
  const tireGripFactor = 0.65 + (car.tireWear / 100) * 0.35;

  const draftBoost = car.drafting ? 6.5 : 0;
  const activeBoostMax = car.boostTimer > 0 ? 24 * car.boostStrength : 0;
  const activeBoostAccel = car.boostTimer > 0 ? 24 * car.boostStrength : 0;
  const effectiveMaxSpeed =
    car.maxSpeedMs * damageFactor * fuelCapFactor + draftBoost + activeBoostMax;

  if (input.throttle || car.boostTimer > 0) {
    const speedRatio = Math.max(0, fwdVel / effectiveMaxSpeed);
    const torqueCurve = Math.max(0.32, 1 - speedRatio * 0.54);
    fwdVel += (car.accelForce * damageFactor + activeBoostAccel) * torqueCurve * dt;
    car.bodyPitch = THREE.MathUtils.lerp(car.bodyPitch, -0.025 * torqueCurve, Math.min(1, dt * 8));
  } else if (input.brake) {
    if (fwdVel > 1.5) {
      fwdVel -= car.brakeForce * dt;
      car.bodyPitch = THREE.MathUtils.lerp(car.bodyPitch, 0.038, Math.min(1, dt * 10));
    } else {
      fwdVel = Math.max(-22, fwdVel - car.accelForce * 0.55 * dt);
      car.bodyPitch = THREE.MathUtils.lerp(car.bodyPitch, 0.02, Math.min(1, dt * 8));
    }
  } else {
    car.bodyPitch = THREE.MathUtils.lerp(car.bodyPitch, 0, Math.min(1, dt * 6));
  }

  const drag = 0.00055 * fwdVel * Math.abs(fwdVel) + 0.052 * fwdVel;
  fwdVel -= drag * dt;
  fwdVel = THREE.MathUtils.clamp(fwdVel, -22, effectiveMaxSpeed + 6);

  const steerDir = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const speedAbs = Math.abs(fwdVel);
  const casterAssist =
    steerDir === 0 && Math.abs(slipAngle) > 0.1 && speedAbs > 9
      ? THREE.MathUtils.clamp(-slipAngle * 0.68, -0.38, 0.38)
      : 0;
  const targetSteer = THREE.MathUtils.clamp(steerDir * 0.52 + casterAssist, -0.56, 0.56);
  car.steerAngle = THREE.MathUtils.lerp(car.steerAngle, targetSteer, Math.min(1, dt * 13));

  const steerSensitivity =
    THREE.MathUtils.clamp(speedAbs / 12, 0, 1) *
    (2.15 - 0.65 * THREE.MathUtils.clamp(speedAbs / 140, 0, 1)) *
    car.handlingFactor *
    tireGripFactor;

  const reverseSign = fwdVel >= -0.5 ? 1 : -1;
  let targetYawRate = steerDir * steerSensitivity * reverseSign;

  if (input.handbrake && speedAbs > 8 && fwdVel > 0.5) {
    const isCounterSteer = steerDir !== 0 && steerDir * slipAngle < -0.02;
    if (isCounterSteer) {
      // Counter-steering balances and holds the sideways drift angle smoothly
      targetYawRate = steerDir * steerSensitivity * 1.32 * reverseSign;
    } else if (steerDir !== 0) {
      // Turning into the drift swings the rear cleanly sideways up to ~50 deg ("de lado")
      const slipExcess = Math.max(0, Math.abs(slipAngle) - 0.68) / 0.28;
      const oversteerScale = THREE.MathUtils.clamp(1.92 - slipExcess * 1.45, 0.32, 1.92);
      targetYawRate = steerDir * steerSensitivity * oversteerScale * reverseSign;
    } else if (Math.abs(slipAngle) < 0.12 && Math.abs(car.angularVel) > 0.05) {
      // Carrying slight turn momentum when pressing Space kicks the car sideways
      targetYawRate = Math.sign(car.angularVel) * 0.95;
    } else {
      // Hold the sideways drift angle while Space stays pressed instead of snapping straight
      targetYawRate = THREE.MathUtils.clamp(-slipAngle * 0.28, -0.45, 0.45);
    }
  } else if (Math.abs(slipAngle) > 0.14 && steerDir === 0 && fwdVel > 6) {
    // Smooth natural straightening when releasing Space
    targetYawRate = THREE.MathUtils.clamp(-slipAngle * 2.2, -1.9, 1.9);
  }

  const yawBlend = car.aiStunTimer > 0 ? 1.5 : input.handbrake ? 9.5 : 11;
  car.angularVel = THREE.MathUtils.lerp(car.angularVel, targetYawRate, Math.min(1, dt * yawBlend));
  car.heading += car.angularVel * dt;

  const closest = findClosestTrackPoint(track, car.x, car.z, car.sampleHint);
  car.sampleHint = closest.sampleIndex;
  const trackHalfW = track.spec.trackWidth * 0.5;
  const prevInPitZone = closest.sNorm >= 0.80 || closest.sNorm <= 0.20;
  const prevInPitLane =
    prevInPitZone &&
    closest.lateralOffset < -trackHalfW + 0.5 &&
    closest.lateralOffset >= -trackHalfW - 13.0;
  const prevOnGrass =
    !prevInPitLane &&
    (closest.lateralOffset < -trackHalfW - 0.6 || closest.lateralOffset > trackHalfW + 0.6);

  const isDrifting =
    (input.handbrake && speedAbs > 8) ||
    Math.abs(slipAngle) > 0.16 ||
    car.slipAmount > 0.34 ||
    Math.abs(latVel) > 6.5 ||
    (prevOnGrass && Math.abs(latVel) > 4.0);

  // Drop rear lateral grip sharply during Space drift so the car genuinely slides sideways
  const baseGrip = input.handbrake
    ? 0.58
    : Math.abs(slipAngle) > 0.2
    ? 5.5 * car.handlingFactor
    : 11.8 * car.handlingFactor;
  const lateralGrip = baseGrip * tireGripFactor * (prevOnGrass ? 0.72 : 1.0);

  if (input.handbrake && speedAbs > 8 && Math.abs(slipAngle) < 0.92) {
    const kickDir =
      steerDir !== 0
        ? steerDir
        : Math.abs(car.angularVel) > 0.05 && Math.abs(slipAngle) < 0.12
        ? Math.sign(car.angularVel)
        : 0;
    const isCounter = kickDir !== 0 && kickDir * slipAngle < -0.02;
    if (kickDir !== 0 && !isCounter) {
      const driftKick = kickDir * Math.min(20, speedAbs * 0.28) * dt * 5.2;
      latVel = THREE.MathUtils.clamp(latVel + driftKick, -speedAbs * 0.76, speedAbs * 0.76);
    }
  }

  // Mild real-car tire scrub deceleration proportional to sideways slip (never abrupt braking)
  if (isDrifting && speedAbs > 8 && Math.abs(latVel) > 2.5) {
    const scrub = Math.min(6.5, Math.abs(latVel) * 0.11);
    fwdVel = Math.max(0, fwdVel - scrub * dt);
  }

  latVel -= latVel * Math.min(1, lateralGrip * dt);
  if (prevOnGrass && car.airHeight < 0.2) {
    fwdVel -= 0.42 * fwdVel * dt;
  }

  const bankingAssist = prevOnGrass || prevInPitLane ? 0 : Math.sin(car.bankAngle) * 14.5;

  const nFwdX = Math.sin(car.heading);
  const nFwdZ = Math.cos(car.heading);
  const nRightX = -Math.cos(car.heading);
  const nRightZ = Math.sin(car.heading);

  car.vx = nFwdX * fwdVel + nRightX * latVel - closest.right.x * bankingAssist * dt;
  car.vz = nFwdZ * fwdVel + nRightZ * latVel - closest.right.z * bankingAssist * dt;

  // Never let Space drift inflate speed when throttle isn't pressed
  if (input.handbrake && !input.throttle && !car.boostTimer) {
    const postMag = Math.hypot(car.vx, car.vz);
    if (postMag > prevVelSpeed && postMag > 0.01) {
      const scale = prevVelSpeed / postMag;
      car.vx *= scale;
      car.vz *= scale;
    }
  }

  car.x += car.vx * dt;
  car.z += car.vz * dt;
  car.speed = fwdVel;

  const targetRoll = THREE.MathUtils.clamp(
    (-car.angularVel * (speedAbs / 55) - Math.sin(slipAngle) * 0.42) * 0.085,
    -0.1,
    0.1,
  );
  car.bodyRoll = THREE.MathUtils.lerp(car.bodyRoll, targetRoll, Math.min(1, dt * 8));

  const rawSlip = Math.min(
    1,
    Math.abs(latVel) / 13 +
      Math.abs(slipAngle) * 0.85 +
      (input.handbrake && speedAbs > 8 ? 0.35 : 0),
  );
  car.slipAmount = THREE.MathUtils.lerp(car.slipAmount, rawSlip, Math.min(1, dt * 10));

  if (speedAbs > 10) {
    const tireRate = (car.isPlayer || car.isPlayer2 ? 0.18 : 0.65) + car.slipAmount * 0.85;
    car.tireWear = Math.max(15, car.tireWear - tireRate * dt);
  }

  // Airborne, Rollover (4), and Cruz Ramirez Flip (5) physics
  if (car.rolloverTimer > 0) {
    car.rolloverTimer = Math.max(0, car.rolloverTimer - dt);
  }

  if (car.cruzFlipTimer > 0) {
    car.cruzFlipTimer = Math.max(0, car.cruzFlipTimer - dt);
    const dur = Math.max(0.1, car.cruzFlipDuration);
    const p = THREE.MathUtils.clamp(1 - car.cruzFlipTimer / dur, 0, 1);
    car.vy -= 26.5 * dt;
    car.airHeight = Math.max(0, car.airHeight + car.vy * dt);
    // Pure sideways barrel-flip (a lado, around Z axis) with zero forward/back pitch!
    car.stuntPitch = 0;
    car.stuntRoll = -car.lastWallSign * p * Math.PI * 2;
    if (car.cruzFlipTimer <= 0.01 && car.airHeight <= 0.15) {
      car.airHeight = 0;
      car.vy = 0;
      car.stuntPitch = 0;
      car.stuntRoll = 0;
    }
  } else if (car.airHeight > 0 || car.vy > 0) {
    car.vy -= 26 * dt;
    car.airHeight += car.vy * dt;
    car.stuntPitch += car.stuntPitchVel * dt;
    car.stuntRoll += car.stuntRollVel * dt;
    if (car.airHeight <= 0) {
      car.airHeight = 0;
      car.vy = 0;
      car.stuntPitchVel = 0;
      car.stuntRollVel = 0;
      if (car.rolloverTimer > 0.5) {
        // Snap angle near PI so the car lands upside-down on its roof
        const dir = car.stuntRoll >= 0 ? 1 : -1;
        car.stuntRoll = dir * Math.PI;
      }
    }
  } else if (car.rolloverTimer > 0.5) {
    const targetUpsideDown = car.stuntRoll >= 0 ? Math.PI : -Math.PI;
    car.stuntRoll = THREE.MathUtils.lerp(car.stuntRoll, targetUpsideDown, Math.min(1, dt * 8));
    car.stuntPitch = THREE.MathUtils.lerp(car.stuntPitch, 0.04, Math.min(1, dt * 6));
    // Sliding upside-down slows down and throws sparks
    car.vx *= Math.max(0, 1 - 0.75 * dt);
    car.vz *= Math.max(0, 1 - 0.75 * dt);
    car.speed *= Math.max(0, 1 - 0.75 * dt);
    if (Math.abs(car.speed) > 8) {
      events.scrapingRoof = true;
    }
  } else {
    car.stuntPitch = THREE.MathUtils.lerp(car.stuntPitch, 0, Math.min(1, dt * 10));
    car.stuntRoll = THREE.MathUtils.lerp(car.stuntRoll, 0, Math.min(1, dt * 10));
  }

  // Track Boundary, Side Fence Scraping, Pit Road & Open Grass Access!
  const prevLateral = car.lateralOffset;
  const postClosest = findClosestTrackPoint(track, car.x, car.z, car.sampleHint);
  car.sampleHint = postClosest.sampleIndex;
  car.lateralOffset = postClosest.lateralOffset;

  const halfW = track.spec.trackWidth * 0.5;
  const inPitOpening = postClosest.sNorm >= 0.80 || postClosest.sNorm <= 0.20;
  const inGrassGate = postClosest.sNorm >= 0.45 && postClosest.sNorm <= 0.56;
  const maxLatAllowed = halfW - 1.35;

  car.inPitLane =
    inPitOpening &&
    postClosest.lateralOffset < -halfW + 0.5 &&
    postClosest.lateralOffset >= -halfW - 13.0;

  const isOnGrass =
    !car.inPitLane &&
    (postClosest.lateralOffset < -halfW - 0.4 || postClosest.lateralOffset > halfW + 0.4);

  // On flat Pit Road or Grass, banking = 0 and ground is flat; on track, follow exact banked asphalt height!
  const targetBank = car.inPitLane || isOnGrass ? 0 : postClosest.bank;
  car.bankAngle = THREE.MathUtils.lerp(car.bankAngle, targetBank, Math.min(1, dt * 14));
  const groundY = car.inPitLane
    ? 0.06
    : isOnGrass
    ? 0.05
    : Math.max(0.05, postClosest.surfaceY + 0.04);
  const roofLift = car.rolloverTimer > 0.3 ? Math.abs(Math.sin(car.stuntRoll * 0.5)) * 0.58 : 0;
  car.y = groundY + car.airHeight + roofLift;

  // Pit Stop Service for players AND AI bots when slowed down inside Pit Box zone
  const inPitBox = (postClosest.sNorm >= 0.88 || postClosest.sNorm <= 0.12) && car.inPitLane;
  if (!car.isRemote && inPitBox && Math.abs(car.speed) < 15) {
    const needsService = car.fuel < 99 || car.tireWear < 99 || car.damage > 1;
    if (needsService) {
      car.pitProgress = Math.min(1, car.pitProgress + dt / 2.2);
      if (car.pitProgress >= 1) {
        car.fuel = 100;
        car.tireWear = 100;
        car.damage = 0;
        car.pitProgress = 0;
        car.aiWantsPit = false;
        car.aiPitCooldown = 28;
        events.pitServiced = true;
      }
    } else {
      car.pitProgress = 0;
      car.aiWantsPit = false;
    }
  } else {
    car.pitProgress = 0;
  }

  // Smooth side-fence / SAFER wall collision: keep advancing along the wall, or launch flying if drifting!
  const handleFenceCollision = (sign: 1 | -1, excess: number, clampTarget: number) => {
    car.x -= postClosest.right.x * sign * excess;
    car.z -= postClosest.right.z * sign * excess;
    car.lateralOffset = clampTarget;

    const tangentVel = car.vx * postClosest.tangent.x + car.vz * postClosest.tangent.z;
    const wallVel = (car.vx * postClosest.right.x + car.vz * postClosest.right.z) * sign;

    if (wallVel > 0) {
      const impact = Math.min(1, wallVel / 22);
      events.wallHitStrength = Math.max(events.wallHitStrength, impact);
      if (car.isPlayer || car.isPlayer2) {
        car.lastWallSign = sign;
        car.wallStuntTimer = 5.0; // Unlock crash/rollover/cruzflip stunt buttons
      }

      if (car.airHeight > 0.8) {
        car.vx -= postClosest.right.x * sign * Math.max(2, wallVel * 0.45);
        car.vz -= postClosest.right.z * sign * Math.max(2, wallVel * 0.45);
        return;
      }

      if (impact > 0.35) {
        car.damage = Math.min(100, car.damage + impact * 18);
      }
      const bounceOut = Math.min(4, wallVel * 0.2);
      const preservedTangent = tangentVel * (1 - Math.min(0.25, 0.35 * dt + impact * 0.12));

      car.vx = postClosest.tangent.x * preservedTangent - postClosest.right.x * sign * bounceOut;
      car.vz = postClosest.tangent.z * preservedTangent - postClosest.right.z * sign * bounceOut;
      car.speed = preservedTangent;

      const tangentHeading = Math.atan2(postClosest.tangent.x, postClosest.tangent.z);
      let hDiff = tangentHeading - car.heading;
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      car.heading += hDiff * Math.min(1, dt * 10);
    }
  };

  // Outer fence: open on backstretch Grass Gate (0.45..0.56) or when flying high (> 2.5m) over the fence!
  if (!inGrassGate && car.airHeight <= 2.5) {
    if (prevLateral <= maxLatAllowed + 0.6 && postClosest.lateralOffset > maxLatAllowed) {
      handleFenceCollision(1, postClosest.lateralOffset - maxLatAllowed, maxLatAllowed);
    } else if (
      (car.isPlayer || car.isPlayer2) &&
      prevLateral > maxLatAllowed + 0.6 &&
      postClosest.lateralOffset < halfW + 1.8
    ) {
      // Gently keep outer-grass car outside the back of the SAFER wall until entering via the Grass Gate
      const pushOut = halfW + 1.8 - postClosest.lateralOffset;
      car.x += postClosest.right.x * pushOut;
      car.z += postClosest.right.z * pushOut;
      car.lateralOffset = halfW + 1.8;
    }
  }

  // Inner edge & AI outer safety: players can freely drive off onto infield or outer grass! AI stays on track.
  const aiMinLat = inPitOpening ? -halfW - 11.5 : -(halfW - 1.35);
  if (!car.isPlayer && !car.isPlayer2) {
    if (postClosest.lateralOffset < aiMinLat) {
      handleFenceCollision(-1, aiMinLat - postClosest.lateralOffset, aiMinLat);
    } else if (postClosest.lateralOffset > maxLatAllowed) {
      handleFenceCollision(1, postClosest.lateralOffset - maxLatAllowed, maxLatAllowed);
    }
  }

  // Center scoring tower & vast stadium ground edge bounds
  const distFromCenter = Math.hypot(car.x, car.z);
  if (distFromCenter < 6.8 && distFromCenter > 0.01) {
    const nx = car.x / distFromCenter;
    const nz = car.z / distFromCenter;
    car.x = nx * 6.8;
    car.z = nz * 6.8;
    car.vx *= 0.4;
    car.vz *= 0.4;
  } else if (distFromCenter > 1450) {
    const nx = car.x / distFromCenter;
    const nz = car.z / distFromCenter;
    car.x = nx * 1450;
    car.z = nz * 1450;
    car.vx *= -0.35;
    car.vz *= -0.35;
  }

  // Invisible Outer-Side Teleporter: only when going off the outside of the track, never inside infield!
  if (
    raceLive &&
    (car.isPlayer || car.isPlayer2) &&
    car.teleportCooldown <= 0 &&
    postClosest.lateralOffset > halfW + 22
  ) {
    const targetSNorm = (postClosest.sNorm + 0.5) % 1;
    const dest = getSampleAtNorm(track, targetSNorm);
    const keepSpeed = Math.max(24, Math.abs(car.speed));
    car.x = dest.position.x;
    car.y = Math.max(0.05, dest.position.y + 0.04) + 0.7;
    car.z = dest.position.z;
    car.heading = Math.atan2(dest.tangent.x, dest.tangent.z);
    car.vx = dest.tangent.x * keepSpeed;
    car.vz = dest.tangent.z * keepSpeed;
    car.speed = keepSpeed;
    car.angularVel = 0;
    car.airHeight = 0.7;
    car.vy = 0;
    car.stuntPitch = 0;
    car.stuntRoll = 0;
    car.rolloverTimer = 0;
    car.cruzFlipTimer = 0;
    car.bankAngle = dest.bank;
    car.sampleHint = dest.index;
    car.prevSNorm = dest.sNorm;
    car.sNorm = dest.sNorm;
    car.lateralOffset = 0;
    car.wrongWay = false;
    car.teleportCooldown = 1.4;
    events.teleported = true;
  }

  const dotForward = nFwdX * postClosest.tangent.x + nFwdZ * postClosest.tangent.z;
  car.wrongWay = !isOnGrass && dotForward < -0.35 && car.speed > 5;

  if (!events.teleported) {
    car.prevSNorm = car.sNorm;
    car.sNorm = postClosest.sNorm;
    let ds = car.sNorm - car.prevSNorm;
    if (ds < -0.5) ds += 1;
    if (ds > 0.5) ds -= 1;
    if (Math.abs(car.lateralOffset) <= halfW + 16 && Math.abs(ds) < 0.35) {
      car.totalProgress += ds;
    }
  }

  const newLap = Math.max(1, Math.floor(car.totalProgress) + 1);
  if (newLap > car.lap && !car.finished) {
    const lapTime = raceElapsedMs - car.lapStartMs;
    if (lapTime > 4000) {
      car.lastLapMs = lapTime;
      if (car.bestLapMs === null || lapTime < car.bestLapMs) {
        car.bestLapMs = lapTime;
      }
      events.completedLap = true;
    }
    car.lapStartMs = raceElapsedMs;
    car.lap = newLap;

    if (totalLaps > 0 && car.totalProgress >= totalLaps) {
      car.finished = true;
      car.totalTimeMs = raceElapsedMs;
      events.justFinished = true;
    }
  }

  const kmh = Math.abs(car.speed) * 3.6;
  const gearThresholds = [0, 95, 185, 285, 390, 520];
  let gear = 1;
  for (let g = 1; g <= 5; g++) {
    if (kmh >= gearThresholds[g - 1]) gear = g;
  }
  car.gear = gear;
  const gLow = gear === 1 ? 0 : gearThresholds[gear - 1] * 0.72;
  const gHigh = gearThresholds[gear];
  const frac = THREE.MathUtils.clamp((kmh - gLow) / Math.max(10, gHigh - gLow), 0, 1);
  car.rpm = 2200 + frac * 6500 + (input.throttle ? 250 : 0);

  return events;
}

export interface CollisionReport {
  maxImpact: number;
  wreckX: number;
  wreckZ: number;
  wreckY: number;
}

export function resolveCarCollisions(cars: RaceCarState[]): CollisionReport {
  let maxImpact = 0;
  let wreckX = 0;
  let wreckZ = 0;
  let wreckY = 0;
  const minDist = 2.65;

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 0.001 && distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const nz = dz / dist;
        const overlap = (minDist - dist) * 0.52;

        if (!a.isRemote) {
          a.x -= nx * overlap;
          a.z -= nz * overlap;
        }
        if (!b.isRemote) {
          b.x += nx * overlap;
          b.z += nz * overlap;
        }

        const relVx = b.vx - a.vx;
        const relVz = b.vz - a.vz;
        const sepVel = relVx * nx + relVz * nz;
        if (sepVel < 0) {
          const impulse = -sepVel * 0.85;
          const severity = Math.min(1, Math.abs(sepVel) / 16);
          if (severity > maxImpact) {
            maxImpact = severity;
            wreckX = (a.x + b.x) * 0.5;
            wreckZ = (a.z + b.z) * 0.5;
            wreckY = (a.y + b.y) * 0.5 + 0.6;
          }

          if (!a.isRemote) {
            a.vx -= nx * impulse;
            a.vz -= nz * impulse;
            if (severity > 0.42) {
              a.damage = Math.min(100, a.damage + severity * 18);
              a.angularVel += (Math.random() - 0.5) * severity * 5.2;
              if (!a.isPlayer) a.aiStunTimer = 1.6 + severity * 1.2;
            }
          }
          if (!b.isRemote) {
            b.vx += nx * impulse;
            b.vz += nz * impulse;
            if (severity > 0.42) {
              b.damage = Math.min(100, b.damage + severity * 20);
              b.angularVel += (Math.random() - 0.5) * severity * 6.5;
              if (!b.isPlayer) b.aiStunTimer = 1.8 + severity * 1.4;
            }
          }
        }
      }
    }
  }
  return { maxImpact, wreckX, wreckZ, wreckY };
}

export function updateDrafting(cars: RaceCarState[], trackLength: number) {
  for (const car of cars) {
    car.drafting = false;
    if (car.speed < 35) continue;
    for (const other of cars) {
      if (other.id === car.id) continue;
      let ds = (other.sNorm - car.sNorm) * trackLength;
      if (ds < -trackLength * 0.5) ds += trackLength;
      if (ds > 4 && ds < 28 && Math.abs(other.lateralOffset - car.lateralOffset) < 2.8) {
        car.drafting = true;
        break;
      }
    }
  }
}
