import {
  createInitialCareerStandings,
  DEFAULT_CONTROL_SETTINGS,
  TEAM_PRESETS,
} from '../data/cars';
import {
  CarConfig,
  CareerState,
  ControlSettings,
  LanguageCode,
  SavedProgress,
} from '../types/game';

export const STORAGE_CAR_KEY = 'aysen_f1_car_v1';
export const STORAGE_NAME_KEY = 'aysen_f1_driver_v1';
export const STORAGE_CAREER_KEY = 'aysen_f1_career_v2';
export const STORAGE_CONTROLS_KEY = 'aysen_f1_controls_v1';
export const STORAGE_AUTH_TOKEN_KEY = 'aysen_f1_auth_token_v1';
export const STORAGE_PROGRESS_KEY = 'aysen_f1_progress_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  credits: 5000,
  unlockedCarIds: ['nexplay_gp'],
  customCars: [],
  completedCircuits: [],
  bestLapsByCircuit: {},
  redeemedCodes: [],
  stats: {
    racesCompleted: 0,
    wins: 0,
    podiums: 0,
    totalLaps: 0,
    totalEarnings: 5000,
  },
  lastMode: 'quickrace',
  lastCircuitId: 'coyhaique',
};

export function loadSavedCar(): CarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CAR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CarConfig;
      if (parsed && parsed.id && parsed.teamName) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { ...TEAM_PRESETS[0] };
}

export function saveCar(car: CarConfig): void {
  try {
    localStorage.setItem(STORAGE_CAR_KEY, JSON.stringify(car));
  } catch {
    // ignore
  }
}

export function loadSavedName(): string {
  try {
    return localStorage.getItem(STORAGE_NAME_KEY) || 'Piloto Patagonia';
  } catch {
    return 'Piloto Patagonia';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(STORAGE_NAME_KEY, name);
  } catch {
    // ignore
  }
}

const clampVol = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(0, Math.min(100, Math.round(v)))
    : fallback;

const VALID_LANGUAGES: ReadonlySet<LanguageCode> = new Set([
  'es',
  'en',
  'pt',
  'fr',
  'de',
  'it',
  'ja',
  'ko',
  'zh',
  'ru',
  'ar',
  'nl',
]);

export function loadSavedControls(): ControlSettings {
  try {
    const raw = localStorage.getItem(STORAGE_CONTROLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ControlSettings>;
      const defAudio = DEFAULT_CONTROL_SETTINGS.audio;
      const lang =
        parsed.language && VALID_LANGUAGES.has(parsed.language)
          ? parsed.language
          : DEFAULT_CONTROL_SETTINGS.language;
      return {
        keyboard: { ...DEFAULT_CONTROL_SETTINGS.keyboard, ...parsed.keyboard },
        gamepad: { ...DEFAULT_CONTROL_SETTINGS.gamepad, ...parsed.gamepad },
        showTrackHud:
          parsed.showTrackHud !== undefined ? Boolean(parsed.showTrackHud) : true,
        audio: {
          muted:
            parsed.audio?.muted !== undefined
              ? Boolean(parsed.audio.muted)
              : defAudio.muted,
          masterVolume: clampVol(parsed.audio?.masterVolume, defAudio.masterVolume),
          engineVolume: clampVol(parsed.audio?.engineVolume, defAudio.engineVolume),
          tiresVolume: clampVol(parsed.audio?.tiresVolume, defAudio.tiresVolume),
          effectsVolume: clampVol(
            parsed.audio?.effectsVolume,
            defAudio.effectsVolume
          ),
        },
        language: lang,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONTROL_SETTINGS;
}

export function saveControls(controls: ControlSettings): void {
  try {
    localStorage.setItem(STORAGE_CONTROLS_KEY, JSON.stringify(controls));
  } catch {
    // ignore
  }
}

export function loadSavedCareer(name: string, car: CarConfig): CareerState {
  try {
    const raw = localStorage.getItem(STORAGE_CAREER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CareerState;
      if (parsed && Array.isArray(parsed.standings)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    season: 1,
    currentRoundIndex: 0,
    completedRounds: [],
    standings: createInitialCareerStandings(name, car),
  };
}

export function saveCareer(career: CareerState): void {
  try {
    localStorage.setItem(STORAGE_CAREER_KEY, JSON.stringify(career));
  } catch {
    // ignore
  }
}

export function loadSavedProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedProgress>;
      const customCars = Array.isArray(parsed.customCars) ? parsed.customCars : [];
      const customIds = customCars.map((c) => c.id);
      const unlocked = Array.isArray(parsed.unlockedCarIds)
        ? Array.from(new Set(['nexplay_gp', ...parsed.unlockedCarIds, ...customIds]))
        : Array.from(new Set(['nexplay_gp', ...customIds]));
      return {
        credits:
          typeof parsed.credits === 'number' && Number.isFinite(parsed.credits)
            ? Math.max(0, Math.round(parsed.credits))
            : DEFAULT_PROGRESS.credits,
        unlockedCarIds: unlocked,
        customCars,
        completedCircuits: Array.isArray(parsed.completedCircuits)
          ? parsed.completedCircuits
          : [],
        bestLapsByCircuit:
          parsed.bestLapsByCircuit && typeof parsed.bestLapsByCircuit === 'object'
            ? parsed.bestLapsByCircuit
            : {},
        redeemedCodes: Array.isArray(parsed.redeemedCodes)
          ? parsed.redeemedCodes
          : [],
        stats: {
          ...DEFAULT_PROGRESS.stats,
          ...(parsed.stats ?? {}),
        },
        lastMode: parsed.lastMode ?? 'quickrace',
        lastCircuitId: parsed.lastCircuitId ?? 'coyhaique',
      };
    }
  } catch {
    // ignore
  }
  return {
    ...DEFAULT_PROGRESS,
    unlockedCarIds: [...DEFAULT_PROGRESS.unlockedCarIds],
    customCars: [],
    completedCircuits: [],
    bestLapsByCircuit: {},
    redeemedCodes: [],
    stats: { ...DEFAULT_PROGRESS.stats },
  };
}

export function saveProgress(progress: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}
