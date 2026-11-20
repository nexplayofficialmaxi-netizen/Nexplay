import { CarConfig, CareerDriverStanding, ControlSettings } from '../types/game';

export const TEAM_PRESETS: CarConfig[] = [
  {
    id: 'nexplay_gp',
    teamName: 'NexPlay Patagonia GP',
    chassisName: 'NP-26 Austral',
    primaryColor: '#E11D48',
    secondaryColor: '#0F172A',
    accentColor: '#F8FAFC',
    helmetColor: '#F43F5E',
    driverNumber: 1,
    tireCompound: 'soft',
    aeroSetup: 'balanced',
    wheelSize: 'medium',
    bodyStyle: 'aero',
    suspensionStyle: 'standard',
    flagStyle: 'aysen',
  },
  {
    id: 'austral_aero',
    teamName: 'Austral Aero Racing',
    chassisName: 'AA-09 Glaciar',
    primaryColor: '#0284C7',
    secondaryColor: '#0B1320',
    accentColor: '#38BDF8',
    helmetColor: '#E0F2FE',
    driverNumber: 14,
    tireCompound: 'medium',
    aeroSetup: 'low_drag',
    wheelSize: 'small',
    bodyStyle: 'classic',
    suspensionStyle: 'active_low',
    flagStyle: 'chile',
  },
  {
    id: 'andes_scuderia',
    teamName: 'Andes Scuderia',
    chassisName: 'AS-26 Cóndor',
    primaryColor: '#059669',
    secondaryColor: '#111827',
    accentColor: '#FBBF24',
    helmetColor: '#FCD34D',
    driverNumber: 7,
    tireCompound: 'soft',
    aeroSetup: 'high_downforce',
    wheelSize: 'large',
    bodyStyle: 'wide',
    suspensionStyle: 'raised',
    flagStyle: 'aysen',
  },
  {
    id: 'fiordo_motorsport',
    teamName: 'Fiordo Motorsport',
    chassisName: 'FM-18 Baker',
    primaryColor: '#F8FAFC',
    secondaryColor: '#1E3A8A',
    accentColor: '#EF4444',
    helmetColor: '#2563EB',
    driverNumber: 22,
    tireCompound: 'medium',
    aeroSetup: 'balanced',
    wheelSize: 'medium',
    bodyStyle: 'futuristic',
    suspensionStyle: 'wide_pushrod',
    flagStyle: 'chile',
  },
  {
    id: 'coyhaique_velocity',
    teamName: 'Coyhaique Velocity',
    chassisName: 'CV-11 Mackay',
    primaryColor: '#D97706',
    secondaryColor: '#18181B',
    accentColor: '#FDE047',
    helmetColor: '#F59E0B',
    driverNumber: 11,
    tireCompound: 'hard',
    aeroSetup: 'low_drag',
    wheelSize: 'small',
    bodyStyle: 'aero',
    suspensionStyle: 'heavy_patagonia',
    flagStyle: 'aysen',
  },
  {
    id: 'ventisquero_f1',
    teamName: 'Ventisquero F1',
    chassisName: 'VF-55 Témpano',
    primaryColor: '#475569',
    secondaryColor: '#0F172A',
    accentColor: '#2DD4BF',
    helmetColor: '#14B8A6',
    driverNumber: 55,
    tireCompound: 'medium',
    aeroSetup: 'high_downforce',
    wheelSize: 'large',
    bodyStyle: 'classic',
    suspensionStyle: 'raised',
    flagStyle: 'none',
  },
  {
    id: 'queulat_racing',
    teamName: 'Queulat Colgante GP',
    chassisName: 'QC-44 Ventisquero',
    primaryColor: '#7C3AED',
    secondaryColor: '#090D16',
    accentColor: '#C4B5FD',
    helmetColor: '#A78BFA',
    driverNumber: 44,
    tireCompound: 'soft',
    aeroSetup: 'balanced',
    wheelSize: 'medium',
    bodyStyle: 'wide',
    suspensionStyle: 'active_low',
    flagStyle: 'aysen',
  },
  {
    id: 'cisnes_team',
    teamName: 'Puerto Cisnes Racing',
    chassisName: 'PC-27 Fiordo',
    primaryColor: '#EA580C',
    secondaryColor: '#1C1917',
    accentColor: '#FED7AA',
    helmetColor: '#FB923C',
    driverNumber: 27,
    tireCompound: 'medium',
    aeroSetup: 'low_drag',
    wheelSize: 'small',
    bodyStyle: 'futuristic',
    suspensionStyle: 'wide_pushrod',
    flagStyle: 'chile',
  },
  {
    id: 'cochrane_apex',
    teamName: 'Cochrane Apex F1',
    chassisName: 'CA-77 Tamango',
    primaryColor: '#0D9488',
    secondaryColor: '#0F172A',
    accentColor: '#F43F5E',
    helmetColor: '#2DD4BF',
    driverNumber: 77,
    tireCompound: 'hard',
    aeroSetup: 'high_downforce',
    wheelSize: 'large',
    bodyStyle: 'futuristic',
    suspensionStyle: 'heavy_patagonia',
    flagStyle: 'chile',
  },
];

// 8 AI drivers + 1 Player = 9 Formula 1 cars on grid (Positions 1..9)
// High competitive skills so AI bots race very fast!
export const AI_DRIVERS = [
  { name: 'M. Valdivia', car: TEAM_PRESETS[1], skill: 1.05 },
  { name: 'C. Bahamonde', car: TEAM_PRESETS[2], skill: 1.03 },
  { name: 'V. Ojeda', car: TEAM_PRESETS[3], skill: 1.01 },
  { name: 'T. Alarcón', car: TEAM_PRESETS[4], skill: 1.00 },
  { name: 'S. Mancilla', car: TEAM_PRESETS[5], skill: 0.99 },
  { name: 'F. Vera', car: TEAM_PRESETS[6], skill: 0.98 },
  { name: 'D. Paredes', car: TEAM_PRESETS[7], skill: 0.97 },
  { name: 'L. Aguilar', car: TEAM_PRESETS[8], skill: 0.96 },
];

export const F1_POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Prize money ($) awarded for finishing positions 1..9 on any of the 900 circuits
export const RACE_PRIZE_BY_POS = [
  20000, // 1°
  15000, // 2°
  12000, // 3°
  9500, // 4°
  8000, // 5°
  6500, // 6°
  5500, // 7°
  4500, // 8°
  4000, // 9°
];

export const FIRST_TIME_TRACK_BONUS = 3000;
export const TIMETRIAL_LAP_REWARD = 3500;
export const CUSTOM_F1_BUILD_COST = 2500;

export const CAR_PRICES: Record<string, number> = {
  nexplay_gp: 0,
  austral_aero: 12000,
  andes_scuderia: 18000,
  fiordo_motorsport: 24000,
  coyhaique_velocity: 32000,
  ventisquero_f1: 42000,
  queulat_racing: 55000,
  cisnes_team: 70000,
  cochrane_apex: 90000,
};

const CAR_TIER_BONUS: Record<string, number> = {
  nexplay_gp: 0,
  austral_aero: 2,
  andes_scuderia: 3,
  fiordo_motorsport: 4,
  coyhaique_velocity: 5,
  ventisquero_f1: 6,
  queulat_racing: 8,
  cisnes_team: 9,
  cochrane_apex: 11,
};

export function getCarPrice(carId: string): number {
  return CAR_PRICES[carId] ?? 0;
}

export function getCarSellValue(car: CarConfig): number {
  if (car.isCustom) {
    let val = 5500;
    if (car.bodyStyle === 'futuristic') val += 2500;
    else if (car.bodyStyle === 'wide') val += 1800;
    else if (car.bodyStyle === 'classic') val += 1200;
    if (car.wheelSize === 'large') val += 1500;
    else if (car.wheelSize === 'small') val += 900;
    if (car.flagStyle && car.flagStyle !== 'none') val += 1000;
    return val;
  }
  const base = getCarPrice(car.id);
  return base > 0 ? Math.round(base * 0.7) : 2000;
}

export function formatMoney(amount: number): string {
  return `$${Math.max(0, Math.round(amount)).toLocaleString('es-CL')}`;
}

export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  keyboard: {
    accelerate: 'KeyW',
    brake: 'KeyS',
    steerLeft: 'KeyA',
    steerRight: 'KeyD',
    handbrake: 'Space',
    drs: 'ShiftLeft',
    camera: 'KeyC',
    reset: 'KeyR',
    pause: 'Escape',
  },
  gamepad: {
    accelerateButton: 7, // RT / R2
    brakeButton: 6, // LT / L2
    handbrakeButton: 0, // A / Cross
    drsButton: 2, // X / Square
    cameraButton: 3, // Y / Triangle
    resetButton: 1, // B / Circle
    steerAxis: 0, // Left Stick X
    deadzone: 0.14,
    sensitivity: 1.0,
  },
  showTrackHud: true,
  audio: {
    muted: false,
    masterVolume: 80,
    engineVolume: 85,
    tiresVolume: 85,
    effectsVolume: 90,
  },
  language: 'es',
};

export function formatKeyCode(code: string): string {
  if (code === 'Space') return 'Espacio';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code === 'Escape') return 'Esc';
  if (code === 'ArrowUp') return '↑';
  if (code === 'ArrowDown') return '↓';
  if (code === 'ArrowLeft') return '←';
  if (code === 'ArrowRight') return '→';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

export function computeCarStats(config: CarConfig) {
  const tierBonus = config.isCustom ? 5 : (CAR_TIER_BONUS[config.id] ?? 0);
  let topSpeed = 326 + tierBonus * 1.4;
  let acceleration = 84 + Math.round(tierBonus * 0.6);
  let handling = 82 + Math.round(tierBonus * 0.6);
  let braking = 84 + Math.round(tierBonus * 0.5);

  if (config.wheelSize === 'small') {
    acceleration += 4;
    handling += 3;
    topSpeed -= 3;
  } else if (config.wheelSize === 'large') {
    topSpeed += 5;
    braking += 3;
    handling -= 2;
  }

  if (config.bodyStyle === 'futuristic') {
    topSpeed += 5;
    acceleration += 2;
  } else if (config.bodyStyle === 'wide') {
    handling += 4;
  } else if (config.bodyStyle === 'classic') {
    braking += 3;
  }

  if (config.suspensionStyle === 'active_low') {
    handling += 5;
    topSpeed += 3;
  } else if (config.suspensionStyle === 'wide_pushrod') {
    handling += 6;
    braking += 3;
  } else if (config.suspensionStyle === 'raised') {
    acceleration += 4;
    braking += 2;
  } else if (config.suspensionStyle === 'heavy_patagonia') {
    braking += 5;
    acceleration += 3;
  }

  if (config.aeroSetup === 'low_drag') {
    topSpeed += 16;
    acceleration += 4;
    handling -= 8;
  } else if (config.aeroSetup === 'high_downforce') {
    topSpeed -= 10;
    handling += 12;
    braking += 8;
  }

  if (config.tireCompound === 'soft') {
    acceleration += 8;
    handling += 9;
    braking += 7;
  } else if (config.tireCompound === 'medium') {
    acceleration += 4;
    handling += 4;
    topSpeed += 3;
  } else {
    topSpeed += 6;
    handling -= 3;
    braking -= 2;
  }

  return {
    topSpeed: Math.round(topSpeed),
    acceleration: Math.min(100, acceleration),
    handling: Math.min(100, handling),
    braking: Math.min(100, braking),
  };
}

export function createInitialCareerStandings(
  playerName: string,
  playerCar: CarConfig
): CareerDriverStanding[] {
  return [
    {
      id: 'player',
      name: playerName,
      teamName: playerCar.teamName,
      color: playerCar.primaryColor,
      isPlayer: true,
      points: 0,
      wins: 0,
      podiums: 0,
    },
    ...AI_DRIVERS.map((ai, i) => ({
      id: `ai-${i}`,
      name: ai.name,
      teamName: ai.car.teamName,
      color: ai.car.primaryColor,
      isPlayer: false,
      points: 0,
      wins: 0,
      podiums: 0,
    })),
  ];
}

export interface F1PromoCodeReward {
  description: string;
  credits?: number;
  unlockCarId?: string;
}

// Registry ready for custom F1 promo codes defined by the user
export const F1_PROMO_CODES: Record<string, F1PromoCodeReward> = {};
