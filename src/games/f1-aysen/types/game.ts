export type GameMode = 'career' | 'online' | 'timetrial' | 'quickrace';

export type CircuitId = string;

export type TireCompound = 'soft' | 'medium' | 'hard';
export type AeroSetup = 'low_drag' | 'balanced' | 'high_downforce';
export type AIDifficulty = 'rookie' | 'pro' | 'legend';
export type CameraMode = 'chase' | 'driver' | 'hood' | 'floor' | 'far';
export type LanguageCode =
  | 'es'
  | 'en'
  | 'pt'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ru'
  | 'ar'
  | 'nl';

export type BiomeType =
  | 'urban'
  | 'river'
  | 'mountain'
  | 'lake'
  | 'desert'
  | 'night';

export type RegionCategory =
  | 'aysen'
  | 'los_lagos'
  | 'magallanes'
  | 'araucania_biobio'
  | 'centro_norte';

export type WheelSize = 'small' | 'medium' | 'large';
export type BodyStyle = 'aero' | 'classic' | 'wide' | 'futuristic';
export type SuspensionStyle =
  | 'standard'
  | 'raised'
  | 'wide_pushrod'
  | 'active_low'
  | 'heavy_patagonia';
export type FlagStyle = 'none' | 'chile' | 'aysen';

export interface CarConfig {
  id: string;
  teamName: string;
  chassisName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  helmetColor: string;
  driverNumber: number;
  tireCompound: TireCompound;
  aeroSetup: AeroSetup;
  wheelSize?: WheelSize;
  bodyStyle?: BodyStyle;
  suspensionStyle?: SuspensionStyle;
  flagStyle?: FlagStyle;
  isCustom?: boolean;
}

export interface CircuitEnvironment {
  type: BiomeType;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  groundColor: string;
  mountainColor: string;
  snowLineY: number;
  waterColor?: string;
  waterLevel?: number;
}

export interface CircuitDefinition {
  id: CircuitId;
  index: number;
  name: string;
  shortName: string;
  location: string;
  region: RegionCategory;
  lengthKm: number;
  corners: number;
  difficulty: 'Media' | 'Alta' | 'Experto';
  description: string;
  trackWidth: number;
  defaultLaps: number;
  controlPoints: [number, number, number][];
  environment: CircuitEnvironment;
  baseRecordMs: number;
}

export interface KeyBindings {
  accelerate: string;
  brake: string;
  steerLeft: string;
  steerRight: string;
  handbrake: string;
  drs: string;
  camera: string;
  reset: string;
  pause: string;
}

export interface GamepadBindings {
  accelerateButton: number;
  brakeButton: number;
  handbrakeButton: number;
  drsButton: number;
  cameraButton: number;
  resetButton: number;
  steerAxis: number;
  deadzone: number;
  sensitivity: number;
}

export interface AudioSettings {
  muted: boolean;
  masterVolume: number; // 0..100
  engineVolume: number; // 0..100
  tiresVolume: number; // 0..100
  effectsVolume: number; // 0..100
}

export interface ControlSettings {
  keyboard: KeyBindings;
  gamepad: GamepadBindings;
  showTrackHud: boolean;
  audio: AudioSettings;
  language: LanguageCode;
}

export interface UserAccount {
  id: string;
  username: string;
  token: string;
}

export interface RacerTelemetry {
  id: string;
  name: string;
  isPlayer: boolean;
  isPlayer2?: boolean;
  isAI: boolean;
  isRemote: boolean;
  carConfig: CarConfig;
  x: number;
  y: number;
  z: number;
  heading: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  lap: number;
  progress: number;
  drsActive: boolean;
  drsCharge: number;
  drifting: boolean;
  damageLevel: number; // 0..100 frontal damage
  rearDamageLevel: number; // 0..100 rear zone damage
  tireWear: number; // 0..100 (0 = green fresh, 40..74 = yellow medium, 75+ = red pit!)
  inPitStop: boolean;
  nearPitZone: boolean;
  safetyCarActive: boolean;
  safetyCarPos?: { x: number; z: number };
  rescueTruckActive: boolean;
  rescueTruckPos?: { x: number; z: number };
  currentLapMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  finished: boolean;
  finishTimeMs: number | null;
  position: number;
  offTrack: boolean;
}

export interface ReplayRacerSample {
  id: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  steerAngle: number;
  speedMs: number;
  drsActive: boolean;
  drifting: boolean;
  damageLevel: number;
  rearDamageLevel?: number;
}

export interface ReplayFrame {
  timeMs: number;
  racers: ReplayRacerSample[];
}

export interface RaceSessionConfig {
  mode: GameMode;
  circuitId: CircuitId;
  laps: number;
  difficulty: AIDifficulty;
  tireWearEnabled?: boolean;
  splitScreen?: boolean;
  player2Name?: string;
  player2Car?: CarConfig;
  roomId?: string;
  isOnlineHost?: boolean;
  onlinePlayers?: OnlineRoomPlayer[];
}

export interface OnlineRoomPlayer {
  id: string;
  name: string;
  carConfig: CarConfig;
  ready: boolean;
  isHost: boolean;
}

export interface OnlineServerInfo {
  id: string;
  name: string;
  circuitId: CircuitId;
  laps: number;
  maxPlayers: number;
  playerCount: number;
  status: 'waiting' | 'countdown' | 'racing';
  hostName: string;
}

export interface LeaderboardEntry {
  id: string;
  driverName: string;
  teamName: string;
  circuitId: CircuitId;
  lapTimeMs: number;
  tireCompound: TireCompound;
  mode: GameMode;
  points: number;
  createdAt: string;
}

export interface CareerDriverStanding {
  id: string;
  name: string;
  teamName: string;
  color: string;
  isPlayer: boolean;
  points: number;
  wins: number;
  podiums: number;
}

export interface CareerState {
  season: number;
  currentRoundIndex: number;
  completedRounds: CircuitId[];
  standings: CareerDriverStanding[];
}

export interface PlayerStats {
  racesCompleted: number;
  wins: number;
  podiums: number;
  totalLaps: number;
  totalEarnings: number;
}

export interface SavedProgress {
  credits: number;
  unlockedCarIds: string[];
  customCars: CarConfig[];
  completedCircuits: string[];
  bestLapsByCircuit: Record<string, number>;
  redeemedCodes: string[];
  stats: PlayerStats;
  lastMode: GameMode;
  lastCircuitId: CircuitId;
}
