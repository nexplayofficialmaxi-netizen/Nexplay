export type MenuSection =
  | 'jugar'
  | 'multijugador'
  | 'garage'
  | 'circuitos'
  | 'campeonato'
  | 'configuracion';

export type RaceMode =
  | 'quick'
  | 'championship'
  | 'timetrial'
  | 'freeroam'
  | 'multiplayer'
  | 'splitscreen';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type CameraMode = 'chase' | 'far' | 'hood' | 'bumper';

export type LiveryPattern = 'stripes' | 'chevron' | 'dual' | 'apex' | 'flames';

export type DoorStyle = 'classic' | 'angled' | 'carbon' | 'clean';

export type WheelStyle = 'steel-nascar' | '5-spoke' | 'bbs-mesh' | 'carbon-lip';

export interface CarCustomization {
  carId: string;
  number: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: LiveryPattern;
  doorStyle: DoorStyle;
  wheelStyle: WheelStyle;
  customImageUrl?: string | null;
}

export interface StockCarSpec {
  id: string;
  name: string;
  team: string;
  sponsor: string;
  defaultNumber: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: LiveryPattern;
  stats: {
    topSpeed: number; // 1-100
    acceleration: number; // 1-100
    handling: number; // 1-100
    braking: number; // 1-100
  };
  description: string;
}

export interface TrackWaypoint {
  x: number;
  y: number;
  z: number;
  bank: number; // radians; positive = outer right side higher
}

export type CircuitTheme =
  | 'daytona_day'
  | 'talladega_sunset'
  | 'charlotte_night'
  | 'bristol_night';

export interface CircuitSpec {
  id: string;
  name: string;
  location: string;
  type: 'Superspeedway' | 'Quad-Oval Nocturno' | 'Short Track Nocturno';
  lengthKm: number;
  defaultLaps: number;
  maxBankingDeg: number;
  trackWidth: number;
  difficulty: 'Fácil' | 'Media' | 'Alta';
  theme: CircuitTheme;
  isNight: boolean;
  recordLapMs: number;
  description: string;
  waypoints: TrackWaypoint[];
}

export interface GameSettings {
  quality: GraphicsQuality;
  volume: number; // 0 to 1
  muted: boolean;
  cameraMode: CameraMode;
  units: 'kmh' | 'mph';
  aiCount: number; // 3 to 11
  aiDifficulty: 'rookie' | 'pro' | 'legend';
  playerName: string;
}

export type FlagState = 'countdown' | 'green' | 'yellow' | 'white' | 'checkered';

export interface LeaderboardEntry {
  id: string;
  name: string;
  number: string;
  color: string;
  isPlayer: boolean;
  isRemote?: boolean;
  position: number;
  lap: number;
  progress: number; // lap + normalized s (0..1)
  speedKmh: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  totalTimeMs: number;
  finished: boolean;
  gapSeconds: number;
  inPitLane?: boolean;
}

export interface RaceTelemetry {
  position: number;
  totalCars: number;
  lap: number;
  totalLaps: number;
  speedKmh: number;
  rpm: number; // 0 to 9000
  gear: number; // 1 to 5
  fuel: number; // 0 to 100
  tireWear: number; // 0 to 100 (100 = fresh)
  damage: number; // 0 to 100 (0 = pristine, 100 = wrecked)
  inPitLane: boolean;
  pitProgress: number; // 0 to 1 during active pit stop
  fuelBoostCharge: number; // 0 to 100 saved-gas boost meter
  boostTimer: number; // seconds left in 3s Enter speed boost
  wallStuntTimer: number; // >0 right after hitting side rail so stunt buttons appear
  p2?: {
    position: number;
    lap: number;
    speedKmh: number;
    gear: number;
    fuel: number;
    wallStuntTimer: number;
  };
  currentLapMs: number;
  elapsedMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  flag: FlagState;
  countdownStep: number; // 3, 2, 1, 0 (GO)
  drafting: boolean;
  wrongWay: boolean;
  leaderboard: LeaderboardEntry[];
  carPositions: Array<{
    id: string;
    x: number;
    z: number;
    isPlayer: boolean;
    color: string;
  }>;
}

export interface RaceResult {
  mode: RaceMode;
  circuitId: string;
  circuitName: string;
  totalLaps: number;
  standings: LeaderboardEntry[];
  playerPosition: number;
  playerBestLapMs: number | null;
  playerTotalTimeMs: number;
  pointsEarned: number;
}

export interface ChampionshipDriverStanding {
  id: string;
  name: string;
  number: string;
  team: string;
  color: string;
  points: number;
  wins: number;
  isPlayer: boolean;
}

export interface ChampionshipState {
  active: boolean;
  currentRound: number; // 0 to 3
  circuitIds: string[];
  standings: ChampionshipDriverStanding[];
  completedRounds: number[];
}

export interface MultiplayerDriverInfo {
  id: string;
  name: string;
  carId: string;
  number: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: LiveryPattern;
  doorStyle?: DoorStyle;
  wheelStyle?: WheelStyle;
  ready: boolean;
  isHost: boolean;
}

export interface MultiplayerRoomInfo {
  code: string;
  name: string;
  circuitId: string;
  laps: number;
  freeRoam?: boolean;
  fillWithAi: boolean;
  status: 'lobby' | 'racing';
  drivers: MultiplayerDriverInfo[];
}

export interface SavedPlayerData {
  settings: GameSettings;
  customization: CarCustomization;
  records: Record<string, number>;
  championship: ChampionshipState;
  selectedCircuitId: string;
  lapsOverride: number;
  updatedAt: number;
}

export interface RemoteCarPacket {
  id: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  lap: number;
  sNorm: number;
  finished: boolean;
  bestLapMs: number | null;
  totalTimeMs: number;
}
