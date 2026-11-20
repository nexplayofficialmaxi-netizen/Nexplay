import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AI_DRIVERS,
  computeCarStats,
  DEFAULT_CONTROL_SETTINGS,
} from '../data/cars';
import {
  AIDifficulty,
  CameraMode,
  CarConfig,
  CircuitDefinition,
  ControlSettings,
  GameMode,
  OnlineRoomPlayer,
  RacerTelemetry,
  ReplayFrame,
  TireCompound,
} from '../types/game';
import { audioEngine } from './audio';
import { buildF1Car, F1CarRig, getCarGeometryMetrics } from './carBuilder';
import { buildTrackScene, BuiltTrack } from './trackBuilder';
import {
  getClampedPixelRatio,
  getJsHeapBytes,
  MAX_PIXEL_RATIO_RACE,
  MAX_REPLAY_FRAMES,
  RACE_SHADOW_MAP_SIZE,
  TARGET_RAM_BUDGET_BYTES,
} from '../utils/memoryBudget';

export interface RaceEngineCallbacks {
  onHudUpdate: (snapshot: {
    racers: RacerTelemetry[];
    player: RacerTelemetry;
    player2: RacerTelemetry | null;
    countdownLights: number;
    raceStarted: boolean;
    raceFinished: boolean;
    cameraMode: CameraMode;
    cameraMode2: CameraMode;
  }) => void;
  onLapComplete?: (
    lapTimeMs: number,
    lapNumber: number,
    isBest: boolean,
    playerNum?: 1 | 2
  ) => void;
  onRaceFinish?: (results: RacerTelemetry[], replayDurationMs: number) => void;
  onPauseToggle?: () => void;
  onOnlineStateEmit?: (state: {
    x: number;
    y: number;
    z: number;
    heading: number;
    speedKmh: number;
    gear: number;
    lap: number;
    progress: number;
    drsActive: boolean;
    finished: boolean;
    finishTimeMs: number | null;
  }) => void;
}

interface InternalRacer {
  id: string;
  name: string;
  isPlayer: boolean;
  isPlayer2: boolean;
  isAI: boolean;
  isRemote: boolean;
  carConfig: CarConfig;
  rig: F1CarRig;
  x: number;
  y: number;
  z: number;
  heading: number;
  velHeading: number;
  speedMs: number;
  steerAngle: number;
  rpm: number;
  gear: number;
  lap: number;
  sampleIndex: number;
  t: number;
  maxCheckpoint: number;
  totalProgress: number;
  drsActive: boolean;
  drsCharge: number;
  drifting: boolean;
  damageLevel: number;
  rearDamageLevel: number;
  tireWear: number;
  inPitStop: boolean;
  nearPitZone: boolean;
  currentLapMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  finished: boolean;
  finishTimeMs: number | null;
  position: number;
  offTrack: boolean;
  aiSkill: number;
  aiLaneOffset: number;
  aiTargetLane: number;
  aiStuckTimer: number;
  aiWantsPit: boolean;
  aiPitTimer: number;
  aiPitCooldown: number;
  lastFenceHitTime: number;
  remoteTargetX: number;
  remoteTargetY: number;
  remoteTargetZ: number;
  remoteTargetHeading: number;
}

interface PooledParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  isDebris: boolean;
}

const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function createSkyGradientTexture(top: string, horizon: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(0.65, horizon);
  grad.addColorStop(1, horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class RaceEngine {
  private container: HTMLElement;
  private circuit: CircuitDefinition;
  private mode: GameMode;
  private totalLaps: number;
  private difficulty: AIDifficulty;
  private controls: ControlSettings;
  private callbacks: RaceEngineCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private camera2: THREE.PerspectiveCamera | null = null;
  private track!: BuiltTrack;
  private racers: InternalRacer[] = [];
  private playerRacer!: InternalRacer;
  private player2Racer: InternalRacer | null = null;
  private splitScreen = false;
  private tireWearEnabled = true;
  private isSoftwareGl = false;

  private smokePool: PooledParticle[] = [];
  private smokeCursor = 0;
  private debrisPool: PooledParticle[] = [];
  private debrisCursor = 0;

  private frameId = 0;
  private disposed = false;
  private paused = false;
  private cameraMode: CameraMode = 'chase';
  private cameraMode2: CameraMode = 'chase';

  private keys = new Set<string>();
  private prevPadCam = false;
  private prevPadReset = false;
  private prevPad2Cam = false;
  private prevPad2Reset = false;

  // Right-click free orbit camera state (front / left / right / rear)
  private rightMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private orbitYaw = 0;
  private orbitPitch = 0.22;

  private lastTime = 0;
  private raceStarted = false;
  private raceFinished = false;
  private raceElapsedMs = 0;
  private countdownTimer = 0;
  private countdownLights = 0;
  private lastEmitTime = 0;
  private lastHudTime = 0;
  private lastReplaySampleTime = 0;
  private lastCollisionTime = 0;
  private lastCollisionTime2 = 0;

  // Video Replay State
  private replayFrames: ReplayFrame[] = [];
  private replayActive = false;
  private replayPlaying = true;
  private replayCursorMs = 0;
  private replaySpeed = 1;

  private skyTex: THREE.CanvasTexture | null = null;
  private envMapTex: THREE.Texture | null = null;

  // Yellow Safety Car & Fast Rescue Truck state
  private safetyCarActive = false;
  private safetyCarDist = 0;
  private safetyCarX = 0;
  private safetyCarZ = 0;
  private safetyCarGroup!: THREE.Group;
  private safetyCarBeaconMats: THREE.MeshBasicMaterial[] = [];
  private safetyCarWheels: THREE.Mesh[] = [];

  private rescueTruckActive = false;
  private rescueTarget: InternalRacer | null = null;
  private rescueTruckDist = 0;
  private rescueTruckX = 0;
  private rescueTruckZ = 0;
  private rescueTruckGroup!: THREE.Group;
  private rescueTruckBeaconMats: THREE.MeshBasicMaterial[] = [];
  private rescueTruckWheels: THREE.Mesh[] = [];
  private supportDisposables: Array<{ dispose: () => void }> = [];
  private particleDisposables: Array<{ dispose: () => void }> = [];
  private lastMemoryCheckTime = 0;

  constructor(params: {
    container: HTMLElement;
    circuit: CircuitDefinition;
    mode: GameMode;
    laps: number;
    difficulty: AIDifficulty;
    playerName: string;
    playerId: string;
    playerCar: CarConfig;
    splitScreen?: boolean;
    tireWearEnabled?: boolean;
    player2Name?: string;
    player2Car?: CarConfig;
    controls?: ControlSettings;
    onlinePlayers?: OnlineRoomPlayer[];
    callbacks: RaceEngineCallbacks;
  }) {
    this.container = params.container;
    this.circuit = params.circuit;
    this.mode = params.mode;
    this.totalLaps = params.laps;
    this.difficulty = params.difficulty;
    this.splitScreen = Boolean(params.splitScreen && params.mode !== 'online');
    this.tireWearEnabled = params.tireWearEnabled !== false;
    this.controls = params.controls ?? DEFAULT_CONTROL_SETTINGS;
    this.callbacks = params.callbacks;

    this.initRendererAndScene(params.playerName, params.playerCar.primaryColor);
    this.initSupportVehicles();
    this.initParticlePools();
    this.spawnRacers(
      params.playerId,
      params.playerName,
      params.playerCar,
      params.onlinePlayers,
      params.player2Name,
      params.player2Car
    );
    this.attachListeners();

    this.lastTime = performance.now();
    this.tick();
  }

  public getPitStreetInfo(): {
    pitRoadPoints: Array<{ x: number; z: number }>;
    pitBoxPos: { x: number; z: number };
  } {
    return {
      pitRoadPoints: this.track.pitRoadPoints,
      pitBoxPos: {
        x: this.track.pitBox.position.x,
        z: this.track.pitBox.position.z,
      },
    };
  }

  private initSupportVehicles(): void {
    // 1. Auto Amarillo (Yellow F1 Safety Car)
    const scGroup = new THREE.Group();
    const scYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.35,
      roughness: 0.25,
    });
    const scDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.45,
      roughness: 0.45,
    });
    const scGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.15,
    });
    const scTireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

    const scBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.58, 4.5), scYellowMat);
    scBody.position.set(0, 0.52, 0);
    scBody.castShadow = !this.isSoftwareGl;
    scGroup.add(scBody);

    const scCabin = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.44, 1.95), scGlassMat);
    scCabin.position.set(0, 0.98, -0.15);
    scGroup.add(scCabin);

    const scWingFront = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.1, 0.42), scDarkMat);
    scWingFront.position.set(0, 0.25, 2.28);
    scGroup.add(scWingFront);

    const scWingRear = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.38), scDarkMat);
    scWingRear.position.set(0, 1.02, -2.05);
    scGroup.add(scWingRear);

    const beaconBar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.28), scDarkMat);
    beaconBar.position.set(0, 1.25, -0.15);
    scGroup.add(beaconBar);

    const bMatL = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bMatR = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const bMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.24), bMatL);
    bMeshL.position.set(-0.28, 1.32, -0.15);
    const bMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.24), bMatR);
    bMeshR.position.set(0.28, 1.32, -0.15);
    scGroup.add(bMeshL, bMeshR);
    this.safetyCarBeaconMats.push(bMatL, bMatR);

    const scWheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14);
    scWheelGeo.rotateZ(Math.PI / 2);
    [
      [-0.95, 0.34, 1.45],
      [0.95, 0.34, 1.45],
      [-0.95, 0.34, -1.45],
      [0.95, 0.34, -1.45],
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(scWheelGeo, scTireMat);
      w.position.set(wx, wy, wz);
      scGroup.add(w);
      this.safetyCarWheels.push(w);
    });

    scGroup.visible = false;
    this.scene.add(scGroup);
    this.safetyCarGroup = scGroup;

    // 2. Camión Rápido de Rescate (Fast F1 Flatbed Recovery Truck)
    const trGroup = new THREE.Group();
    const trCabMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.35,
      roughness: 0.35,
    });
    const trStripeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
    });
    const trBedMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.65,
      roughness: 0.4,
    });

    // Truck cab at front (+Z)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.25, 2.4), trCabMat);
    cab.position.set(0, 1.55, 2.95);
    cab.castShadow = !this.isSoftwareGl;
    trGroup.add(cab);

    const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.12), scGlassMat);
    cabWindshield.position.set(0, 1.95, 4.14);
    trGroup.add(cabWindshield);

    const cabStripe = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.26, 2.44), trStripeMat);
    cabStripe.position.set(0, 0.95, 2.95);
    trGroup.add(cabStripe);

    // Long Flatbed Deck behind cab (-Z) to carry the player's F1 car
    const flatbed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.34, 6.4), trBedMat);
    flatbed.position.set(0, 0.68, -1.25);
    flatbed.castShadow = !this.isSoftwareGl;
    trGroup.add(flatbed);

    // Side safety rails on flatbed
    [-1.22, 1.22].forEach((rx) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 6.2), trStripeMat);
      rail.position.set(rx, 0.94, -1.25);
      trGroup.add(rail);
    });

    // Flashing beacons on truck cab roof
    const tBeaconMatA = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const tBeaconMatB = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const tbA = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.35), tBeaconMatA);
    tbA.position.set(-0.65, 2.78, 3.0);
    const tbB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.35), tBeaconMatB);
    tbB.position.set(0.65, 2.78, 3.0);
    trGroup.add(tbA, tbB);
    this.rescueTruckBeaconMats.push(tBeaconMatA, tBeaconMatB);

    const trWheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 14);
    trWheelGeo.rotateZ(Math.PI / 2);
    [
      [-1.25, 0.48, 3.05],
      [1.25, 0.48, 3.05],
      [-1.25, 0.48, -0.45],
      [1.25, 0.48, -0.45],
      [-1.25, 0.48, -2.95],
      [1.25, 0.48, -2.95],
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(trWheelGeo, scTireMat);
      w.position.set(wx, wy, wz);
      trGroup.add(w);
      this.rescueTruckWheels.push(w);
    });

    trGroup.visible = false;
    this.scene.add(trGroup);
    this.rescueTruckGroup = trGroup;

    this.supportDisposables.push(
      scYellowMat,
      scDarkMat,
      scGlassMat,
      scTireMat,
      scBody.geometry,
      scCabin.geometry,
      scWingFront.geometry,
      scWingRear.geometry,
      beaconBar.geometry,
      bMeshL.geometry,
      bMatL,
      bMatR,
      scWheelGeo,
      trCabMat,
      trStripeMat,
      trBedMat,
      cab.geometry,
      cabWindshield.geometry,
      cabStripe.geometry,
      flatbed.geometry,
      tbA.geometry,
      tBeaconMatA,
      tBeaconMatB,
      trWheelGeo
    );
  }

  private initRendererAndScene(playerName: string, playerColor: string): void {
    this.isSoftwareGl = detectSoftwareWebGL();
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      getClampedPixelRatio(MAX_PIXEL_RATIO_RACE, this.isSoftwareGl)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.skyTex = createSkyGradientTexture(
      this.circuit.environment.skyTop,
      this.circuit.environment.skyHorizon
    );
    this.scene.background = this.skyTex;
    this.scene.fog = new THREE.FogExp2(
      this.circuit.environment.fogColor,
      this.circuit.environment.fogDensity
    );

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMapTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMapTex;
    pmrem.dispose();

    const aspect = this.splitScreen ? (width * 0.5) / height : width / height;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.15, 1600);
    if (this.splitScreen) {
      this.camera2 = new THREE.PerspectiveCamera(62, aspect, 0.15, 1600);
    }

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.78);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(
      this.circuit.environment.sunColor,
      this.circuit.environment.sunIntensity
    );
    sun.position.set(160, 220, 120);
    sun.castShadow = !this.isSoftwareGl;
    sun.shadow.mapSize.set(RACE_SHADOW_MAP_SIZE, RACE_SHADOW_MAP_SIZE);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 700;
    const d = 280;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x93c5fd, 0.45);
    rim.position.set(-140, 90, -160);
    this.scene.add(rim);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.track = buildTrackScene(this.circuit, {
      castShadow: !this.isSoftwareGl,
      maxAnisotropy: maxAniso,
      playerName,
      playerColor,
    });
    this.scene.add(this.track.group);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private initParticlePools(): void {
    const smokeGeo = new THREE.SphereGeometry(0.32, 6, 6);
    this.particleDisposables.push(smokeGeo);
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      this.particleDisposables.push(mat);
      const mesh = new THREE.Mesh(smokeGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.smokePool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.55,
        isDebris: false,
      });
    }

    const debrisGeo = new THREE.BoxGeometry(0.26, 0.06, 0.34);
    this.particleDisposables.push(debrisGeo);
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.4,
      });
      this.particleDisposables.push(mat);
      const mesh = new THREE.Mesh(debrisGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.debrisPool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.5,
        isDebris: true,
      });
    }
  }

  private emitSmoke(x: number, y: number, z: number): void {
    const p = this.smokePool[this.smokeCursor];
    this.smokeCursor = (this.smokeCursor + 1) % this.smokePool.length;
    p.mesh.position.set(x, y + 0.18, z);
    p.mesh.scale.setScalar(0.8);
    p.mesh.visible = true;
    p.vx = (Math.random() - 0.5) * 1.5;
    p.vy = 0.8 + Math.random() * 1.2;
    p.vz = (Math.random() - 0.5) * 1.5;
    p.life = 0.001;
    p.maxLife = 0.55;
  }

  private emitCrashDebris(x: number, y: number, z: number, colorHex: string): void {
    for (let k = 0; k < 5; k++) {
      const p = this.debrisPool[this.debrisCursor];
      this.debrisCursor = (this.debrisCursor + 1) % this.debrisPool.length;
      p.mesh.position.set(x, y + 0.35, z);
      p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      p.mesh.visible = true;
      (p.mesh.material as THREE.MeshStandardMaterial).color.set(
        k % 2 === 0 ? colorHex : '#18181B'
      );
      p.vx = (Math.random() - 0.5) * 12;
      p.vy = 4 + Math.random() * 6;
      p.vz = (Math.random() - 0.5) * 12;
      p.life = 0.001;
      p.maxLife = 1.6;
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.smokePool) {
      if (!p.mesh.visible) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        continue;
      }
      const ratio = p.life / p.maxLife;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(0.8 + ratio * 2.1);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - ratio) * 0.42;
    }

    for (const p of this.debrisPool) {
      if (!p.mesh.visible) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 18 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += 6 * dt;
      p.mesh.rotation.y += 5 * dt;
    }
  }

  private spawnRacers(
    playerId: string,
    playerName: string,
    playerCar: CarConfig,
    onlinePlayers?: OnlineRoomPlayer[],
    player2Name?: string,
    player2Car?: CarConfig
  ): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const castShadow = !this.isSoftwareGl;

    const gridEntries: Array<{
      id: string;
      name: string;
      isPlayer: boolean;
      isPlayer2: boolean;
      isAI: boolean;
      isRemote: boolean;
      carConfig: CarConfig;
      aiSkill: number;
    }> = [];

    if (this.mode === 'timetrial') {
      gridEntries.push({
        id: playerId,
        name: playerName,
        isPlayer: true,
        isPlayer2: false,
        isAI: false,
        isRemote: false,
        carConfig: playerCar,
        aiSkill: 1,
      });
      if (this.splitScreen && player2Car) {
        gridEntries.push({
          id: 'player2',
          name: (player2Name || 'Jugador 2').trim() || 'Jugador 2',
          isPlayer: false,
          isPlayer2: true,
          isAI: false,
          isRemote: false,
          carConfig: player2Car,
          aiSkill: 1,
        });
      }
    } else if (this.mode === 'online' && onlinePlayers && onlinePlayers.length > 0) {
      onlinePlayers.forEach((op) => {
        const isMe = op.id === playerId;
        gridEntries.push({
          id: op.id,
          name: op.name,
          isPlayer: isMe,
          isPlayer2: false,
          isAI: false,
          isRemote: !isMe,
          carConfig: isMe ? playerCar : op.carConfig,
          aiSkill: 1,
        });
      });
    } else {
      // 8 AI + 1 Player = 9 cars (or 7 AI + 2 Players = 9 cars in split-screen)
      const diffMult =
        this.difficulty === 'rookie'
          ? 0.94
          : this.difficulty === 'pro'
            ? 1.03
            : 1.10;
      const aiCount = this.splitScreen ? 7 : 8;
      AI_DRIVERS.slice(0, aiCount).forEach((ai, idx) => {
        gridEntries.push({
          id: `ai-${idx}`,
          name: ai.name,
          isPlayer: false,
          isPlayer2: false,
          isAI: true,
          isRemote: false,
          carConfig: ai.car,
          aiSkill: ai.skill * diffMult,
        });
      });
      gridEntries.push({
        id: playerId,
        name: playerName,
        isPlayer: true,
        isPlayer2: false,
        isAI: false,
        isRemote: false,
        carConfig: playerCar,
        aiSkill: 1,
      });
      if (this.splitScreen) {
        gridEntries.push({
          id: 'player2',
          name: (player2Name || 'Jugador 2').trim() || 'Jugador 2',
          isPlayer: false,
          isPlayer2: true,
          isAI: false,
          isRemote: false,
          carConfig: player2Car ?? AI_DRIVERS[7].car,
          aiSkill: 1,
        });
      }
    }

    gridEntries.forEach((entry, idx) => {
      const rig = buildF1Car(entry.carConfig, {
        castShadow,
        maxAnisotropy: maxAniso,
      });

      const row = Math.floor(idx / 2);
      const col = idx % 2 === 0 ? -1 : 1;
      const distBehind = 10 + row * 9.5;
      const tGrid = (1 - distBehind / this.track.totalLength + 1) % 1;
      const pt = this.track.curve.getPointAt(tGrid);
      const tan = this.track.curve.getTangentAt(tGrid).normalize();
      const right = new THREE.Vector3()
        .crossVectors(tan, new THREE.Vector3(0, 1, 0))
        .normalize();

      const lat = gridEntries.length === 1 ? 0 : col * 3.2;
      const x = pt.x + right.x * lat;
      const y = pt.y;
      const z = pt.z + right.z * lat;
      const heading = Math.atan2(tan.x, tan.z);

      rig.root.position.set(x, y, z);
      rig.root.rotation.y = heading;
      this.scene.add(rig.root);

      const closest = this.track.closestPointOnTrack(x, z);

      const racer: InternalRacer = {
        id: entry.id,
        name: entry.name,
        isPlayer: entry.isPlayer,
        isPlayer2: entry.isPlayer2,
        isAI: entry.isAI,
        isRemote: entry.isRemote,
        carConfig: entry.carConfig,
        rig,
        x,
        y,
        z,
        heading,
        velHeading: heading,
        speedMs: 0,
        steerAngle: 0,
        rpm: 3800,
        gear: 1,
        lap: 1,
        sampleIndex: closest.sampleIndex,
        t: tGrid,
        maxCheckpoint: 0,
        totalProgress: tGrid - 1,
        drsActive: false,
        drsCharge: 100,
        drifting: false,
        damageLevel: 0,
        rearDamageLevel: 0,
        tireWear: 0,
        inPitStop: false,
        nearPitZone: false,
        currentLapMs: 0,
        bestLapMs: null,
        lastLapMs: null,
        finished: false,
        finishTimeMs: null,
        position: idx + 1,
        offTrack: false,
        aiSkill: entry.aiSkill,
        aiLaneOffset: lat,
        aiTargetLane: lat,
        aiStuckTimer: 0,
        aiWantsPit: false,
        aiPitTimer: 0,
        aiPitCooldown: 0,
        lastFenceHitTime: 0,
        remoteTargetX: x,
        remoteTargetY: y,
        remoteTargetZ: z,
        remoteTargetHeading: heading,
      };

      this.racers.push(racer);
      if (entry.isPlayer) {
        this.playerRacer = racer;
      } else if (entry.isPlayer2) {
        this.player2Racer = racer;
      }
    });

    const p = this.playerRacer;
    _fwd.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    this.camera.position.set(
      p.x - _fwd.x * 8.5,
      p.y + 3.4,
      p.z - _fwd.z * 8.5
    );
    this.camera.lookAt(p.x + _fwd.x * 8, p.y + 1.1, p.z + _fwd.z * 8);

    if (this.camera2 && this.player2Racer) {
      const p2 = this.player2Racer;
      _fwd.set(Math.sin(p2.heading), 0, Math.cos(p2.heading));
      this.camera2.position.set(
        p2.x - _fwd.x * 8.5,
        p2.y + 3.4,
        p2.z - _fwd.z * 8.5
      );
      this.camera2.lookAt(p2.x + _fwd.x * 8, p2.y + 1.1, p2.z + _fwd.z * 8);
    }
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public setCameraMode(mode: CameraMode, playerNum: 1 | 2 = 1): void {
    if (playerNum === 2) {
      this.cameraMode2 = mode;
    } else {
      this.cameraMode = mode;
    }
  }

  public cycleCamera(playerNum: 1 | 2 = 1): CameraMode {
    const order: CameraMode[] = ['chase', 'driver', 'hood', 'floor', 'far'];
    if (playerNum === 2) {
      const next = order[(order.indexOf(this.cameraMode2) + 1) % order.length];
      this.cameraMode2 = next;
      return next;
    }
    const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    this.cameraMode = next;
    return next;
  }

  private getHumanRacer(playerNum: 1 | 2 = 1): InternalRacer | null {
    return playerNum === 2 ? this.player2Racer : this.playerRacer;
  }

  public resetPlayerToTrack(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p || p.finished || p.inPitStop) return;
    const sample = this.track.samples[p.sampleIndex];
    p.x = sample.point.x;
    p.y = sample.point.y;
    p.z = sample.point.z;
    p.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    p.velHeading = p.heading;
    p.speedMs *= 0.25;
  }

  public enterPitStop(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p || p.finished || !this.raceStarted || p.inPitStop) return;
    if (this.rescueTarget === p) {
      this.rescueTruckActive = false;
      this.rescueTarget = null;
      this.rescueTruckGroup.visible = false;
    }
    p.inPitStop = true;
    p.speedMs = 0;
    p.steerAngle = 0;
    p.drsActive = false;
    p.drifting = false;
    const otherHuman = playerNum === 2 ? this.playerRacer : this.player2Racer;
    const slotAhead = otherHuman?.inPitStop ? 4.4 : 0;
    const pitFwdX = Math.sin(this.track.pitBox.heading);
    const pitFwdZ = Math.cos(this.track.pitBox.heading);
    p.x = this.track.pitBox.position.x + pitFwdX * slotAhead;
    p.y = this.track.pitBox.position.y;
    p.z = this.track.pitBox.position.z + pitFwdZ * slotAhead;
    p.heading = this.track.pitBox.heading;
    p.velHeading = this.track.pitBox.heading;
    p.sampleIndex = this.track.pitBox.sampleIndex;
    p.rig.root.position.set(p.x, p.y, p.z);
    p.rig.root.rotation.y = p.heading;
    audioEngine.playPitCrewSound();
  }

  public pitServiceTires(compound?: TireCompound, playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p) return;
    p.tireWear = 0;
    const p1Needs = this.playerRacer.tireWear >= 75;
    const p2Needs = Boolean(this.player2Racer && this.player2Racer.tireWear >= 75);
    if (!p1Needs && !p2Needs) {
      this.safetyCarActive = false;
      this.safetyCarGroup.visible = false;
    }
    if (compound && compound !== p.carConfig.tireCompound) {
      p.carConfig = { ...p.carConfig, tireCompound: compound };
      p.rig.updateConfig(p.carConfig);
    }
    audioEngine.playPitCrewSound();
  }

  public pitServiceFrontBumper(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p) return;
    p.damageLevel = 0;
    audioEngine.playPitCrewSound();
  }

  public pitServiceRearZone(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p) return;
    p.rearDamageLevel = 0;
    audioEngine.playPitCrewSound();
  }

  public pitServiceAll(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p) return;
    p.tireWear = 0;
    p.damageLevel = 0;
    p.rearDamageLevel = 0;
    const p1Needs = this.playerRacer.tireWear >= 75;
    const p2Needs = Boolean(this.player2Racer && this.player2Racer.tireWear >= 75);
    if (!p1Needs && !p2Needs) {
      this.safetyCarActive = false;
      this.safetyCarGroup.visible = false;
    }
    audioEngine.playPitCrewSound();
  }

  public exitPitStop(playerNum: 1 | 2 = 1): void {
    const p = this.getHumanRacer(playerNum);
    if (!p || !p.inPitStop) return;
    const exitIdx = this.track.pitExitIndex;
    const s = this.track.samples[exitIdx];
    const halfW = this.circuit.trackWidth * 0.5;
    const rejoinLat = Math.max(1.5, halfW * 0.35 + (playerNum === 2 ? -1.4 : 0));
    p.x = s.point.x + s.right.x * rejoinLat;
    p.y = s.point.y;
    p.z = s.point.z + s.right.z * rejoinLat;
    p.heading = Math.atan2(s.tangent.x, s.tangent.z);
    p.velHeading = p.heading;
    p.sampleIndex = exitIdx;
    p.speedMs = 28;
    p.inPitStop = false;
  }

  public updateControls(next: ControlSettings): void {
    this.controls = next;
  }

  // Video Replay controls
  public startReplay(): void {
    if (this.replayFrames.length === 0) return;
    this.replayActive = true;
    this.replayPlaying = true;
    this.replayCursorMs = 0;
    this.paused = false;
  }

  public stopReplay(): void {
    this.replayActive = false;
  }

  public setReplayPlaying(playing: boolean): void {
    this.replayPlaying = playing;
  }

  public setReplaySpeed(speed: number): void {
    this.replaySpeed = speed;
  }

  public seekReplay(timeMs: number): void {
    const maxTime =
      this.replayFrames.length > 0
        ? this.replayFrames[this.replayFrames.length - 1].timeMs
        : 0;
    this.replayCursorMs = THREE.MathUtils.clamp(timeMs, 0, maxTime);
  }

  public getReplayProgress(): { currentMs: number; totalMs: number } {
    const totalMs =
      this.replayFrames.length > 0
        ? this.replayFrames[this.replayFrames.length - 1].timeMs
        : 0;
    return { currentMs: this.replayCursorMs, totalMs };
  }

  public setExternalCountdown(lights: number, go: boolean): void {
    if (lights > this.countdownLights && lights >= 1 && lights <= 5) {
      audioEngine.playLightBeep(false);
    }
    this.countdownLights = lights;
    this.track.setStartLights(Math.max(0, lights));
    if (go && !this.raceStarted) {
      this.raceStarted = true;
      this.countdownLights = -1;
      this.track.setStartLights(0);
      audioEngine.playLightBeep(true);
    }
  }

  public updateRemotePlayerState(
    playerId: string,
    payload: {
      x: number;
      y: number;
      z: number;
      heading: number;
      speedKmh: number;
      gear: number;
      lap: number;
      progress: number;
      drsActive: boolean;
      finished: boolean;
      finishTimeMs: number | null;
    }
  ): void {
    const r = this.racers.find((item) => item.id === playerId && item.isRemote);
    if (!r) return;
    r.remoteTargetX = payload.x;
    r.remoteTargetY = payload.y;
    r.remoteTargetZ = payload.z;
    r.remoteTargetHeading = payload.heading;
    r.speedMs = payload.speedKmh / 3.6;
    r.gear = payload.gear;
    r.lap = payload.lap;
    r.totalProgress = payload.progress;
    r.drsActive = payload.drsActive;
    r.finished = payload.finished;
    r.finishTimeMs = payload.finishTimeMs;
  }

  private readPlayerInput(playerNum: 1 | 2 = 1): {
    throttle: boolean;
    braking: boolean;
    steerInput: number;
    handbrake: boolean;
    wantsDrs: boolean;
  } {
    const kb = this.controls.keyboard;
    const gpCfg = this.controls.gamepad;

    if (playerNum === 2) {
      let throttle = this.keys.has('ArrowUp');
      let braking = this.keys.has('ArrowDown');
      let steerInput = 0;
      if (this.keys.has('ArrowLeft')) steerInput += 1;
      if (this.keys.has('ArrowRight')) steerInput -= 1;
      let handbrake =
        this.keys.has('Enter') ||
        this.keys.has('ControlRight') ||
        this.keys.has('Numpad0');
      let wantsDrs = this.keys.has('ShiftRight') || this.keys.has('Slash');

      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads[1];
      if (pad && pad.connected) {
        const accelBtn = pad.buttons[gpCfg.accelerateButton];
        const brakeBtn = pad.buttons[gpCfg.brakeButton];
        const hbBtn = pad.buttons[gpCfg.handbrakeButton];
        const drsBtn = pad.buttons[gpCfg.drsButton];
        const camBtn = pad.buttons[gpCfg.cameraButton];
        const rstBtn = pad.buttons[gpCfg.resetButton];

        if (accelBtn && (accelBtn.pressed || accelBtn.value > 0.15)) throttle = true;
        if (brakeBtn && (brakeBtn.pressed || brakeBtn.value > 0.15)) braking = true;
        if (hbBtn?.pressed) handbrake = true;
        if (drsBtn?.pressed) wantsDrs = true;

        if (camBtn?.pressed && !this.prevPad2Cam) {
          this.cycleCamera(2);
        }
        this.prevPad2Cam = Boolean(camBtn?.pressed);

        if (rstBtn?.pressed && !this.prevPad2Reset) {
          this.resetPlayerToTrack(2);
        }
        this.prevPad2Reset = Boolean(rstBtn?.pressed);

        const rawAxis = pad.axes[gpCfg.steerAxis] ?? 0;
        if (Math.abs(rawAxis) > gpCfg.deadzone) {
          steerInput = THREE.MathUtils.clamp(
            -rawAxis * gpCfg.sensitivity,
            -1,
            1
          );
        }
      }

      return { throttle, braking, steerInput, handbrake, wantsDrs };
    }

    const allowArrowsForP1 = !this.splitScreen;
    let throttle =
      this.keys.has(kb.accelerate) || (allowArrowsForP1 && this.keys.has('ArrowUp'));
    let braking =
      this.keys.has(kb.brake) || (allowArrowsForP1 && this.keys.has('ArrowDown'));
    let steerInput = 0;
    if (this.keys.has(kb.steerLeft) || (allowArrowsForP1 && this.keys.has('ArrowLeft')))
      steerInput += 1;
    if (this.keys.has(kb.steerRight) || (allowArrowsForP1 && this.keys.has('ArrowRight')))
      steerInput -= 1;
    let handbrake = this.keys.has(kb.handbrake);
    let wantsDrs =
      this.keys.has(kb.drs) || (allowArrowsForP1 && this.keys.has('ShiftRight'));

    // Poll connected Gamepad API
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = this.splitScreen
      ? pads[0]
      : pads[0] || pads[1] || pads[2] || pads[3];
    if (pad && pad.connected) {
      const accelBtn = pad.buttons[gpCfg.accelerateButton];
      const brakeBtn = pad.buttons[gpCfg.brakeButton];
      const hbBtn = pad.buttons[gpCfg.handbrakeButton];
      const drsBtn = pad.buttons[gpCfg.drsButton];
      const camBtn = pad.buttons[gpCfg.cameraButton];
      const rstBtn = pad.buttons[gpCfg.resetButton];

      if (accelBtn && (accelBtn.pressed || accelBtn.value > 0.15)) throttle = true;
      if (brakeBtn && (brakeBtn.pressed || brakeBtn.value > 0.15)) braking = true;
      if (hbBtn?.pressed) handbrake = true;
      if (drsBtn?.pressed) wantsDrs = true;

      if (camBtn?.pressed && !this.prevPadCam) {
        this.cycleCamera(1);
      }
      this.prevPadCam = Boolean(camBtn?.pressed);

      if (rstBtn?.pressed && !this.prevPadReset) {
        this.resetPlayerToTrack(1);
      }
      this.prevPadReset = Boolean(rstBtn?.pressed);

      const rawAxis = pad.axes[gpCfg.steerAxis] ?? 0;
      if (Math.abs(rawAxis) > gpCfg.deadzone) {
        steerInput = THREE.MathUtils.clamp(
          -rawAxis * gpCfg.sensitivity,
          -1,
          1
        );
      }
    }

    return { throttle, braking, steerInput, handbrake, wantsDrs };
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    const code = e.code;
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'Space'
    ) {
      e.preventDefault();
    }
    this.keys.add(code);
    audioEngine.startEngine();

    if (code === this.controls.keyboard.camera) {
      this.cycleCamera(1);
    } else if (code === this.controls.keyboard.reset) {
      this.resetPlayerToTrack(1);
    } else if (code === 'KeyB') {
      if (this.playerRacer?.inPitStop) {
        this.exitPitStop(1);
      } else {
        this.enterPitStop(1);
      }
    } else if (this.splitScreen && (code === 'KeyK' || code === 'Numpad1')) {
      this.cycleCamera(2);
    } else if (this.splitScreen && (code === 'KeyL' || code === 'Backspace')) {
      this.resetPlayerToTrack(2);
    } else if (this.splitScreen && (code === 'KeyN' || code === 'NumpadDecimal')) {
      if (this.player2Racer?.inPitStop) {
        this.exitPitStop(2);
      } else {
        this.enterPitStop(2);
      }
    } else if (code === this.controls.keyboard.pause || code === 'KeyP') {
      this.callbacks.onPauseToggle?.();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onResize = () => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect =
      this.splitScreen && !this.replayActive ? (width * 0.5) / height : width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    if (this.camera2) {
      this.camera2.aspect = (width * 0.5) / height;
      this.camera2.updateProjectionMatrix();
    }
    this.renderer.setPixelRatio(
      getClampedPixelRatio(MAX_PIXEL_RATIO_RACE, this.isSoftwareGl)
    );
    this.renderer.setSize(width, height);
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      this.rightMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.rightMouseDown) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.orbitYaw -= dx * 0.0085;
    this.orbitPitch = THREE.MathUtils.clamp(
      this.orbitPitch + dy * 0.005,
      0.04,
      1.15
    );
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.rightMouseDown = false;
    }
  };

  private attachListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      this.onContextLost
    );
    this.renderer.domElement.addEventListener(
      'contextmenu',
      this.onContextMenu
    );
    this.renderer.domElement.addEventListener(
      'mousedown',
      this.onMouseDown
    );
  }

  private applyFrontalDamage(r: InternalRacer, impactSpeedMs: number): void {
    if (impactSpeedMs < 11) return;
    const now = performance.now();
    if (r.isPlayer && now - this.lastCollisionTime < 350) return;
    if (r.isPlayer2 && now - this.lastCollisionTime2 < 350) return;
    if (r.isPlayer) this.lastCollisionTime = now;
    if (r.isPlayer2) this.lastCollisionTime2 = now;

    const prevDamage = r.damageLevel;
    const added = Math.min(48, (impactSpeedMs - 9) * 1.45);
    r.damageLevel = Math.min(100, Math.round(r.damageLevel + added));

    // Spawn flying wing/nose debris when crossing damage stages
    if (
      (prevDamage < 20 && r.damageLevel >= 20) ||
      (prevDamage < 45 && r.damageLevel >= 45) ||
      (prevDamage < 75 && r.damageLevel >= 75)
    ) {
      const fx = r.x + Math.sin(r.heading) * 2.2;
      const fz = r.z + Math.cos(r.heading) * 2.2;
      this.emitCrashDebris(fx, r.y, fz, r.carConfig.primaryColor);
    }
  }

  private applyRearDamage(r: InternalRacer, impactSpeedMs: number): void {
    if (impactSpeedMs < 11) return;
    const prevDamage = r.rearDamageLevel;
    const added = Math.min(45, (impactSpeedMs - 9) * 1.4);
    r.rearDamageLevel = Math.min(100, Math.round(r.rearDamageLevel + added));
    if (
      (prevDamage < 20 && r.rearDamageLevel >= 20) ||
      (prevDamage < 55 && r.rearDamageLevel >= 55) ||
      (prevDamage < 80 && r.rearDamageLevel >= 80)
    ) {
      const rx = r.x - Math.sin(r.heading) * 2.2;
      const rz = r.z - Math.cos(r.heading) * 2.2;
      this.emitCrashDebris(rx, r.y, rz, r.carConfig.secondaryColor);
    }
  }

  private updateCountdown(dt: number): void {
    if (this.raceStarted) {
      if (this.countdownLights === -1 && this.raceElapsedMs > 1800) {
        this.countdownLights = -2;
      }
      return;
    }

    if (this.mode === 'online') return;

    this.countdownTimer += dt;
    const nextLights = Math.min(5, Math.floor(this.countdownTimer / 0.72) + 1);
    if (this.countdownTimer < 3.6 && nextLights !== this.countdownLights) {
      this.countdownLights = nextLights;
      this.track.setStartLights(nextLights);
      audioEngine.playLightBeep(false);
    }
    if (this.countdownTimer >= 4.15) {
      this.raceStarted = true;
      this.countdownLights = -1;
      this.track.setStartLights(0);
      audioEngine.playLightBeep(true);
    }
  }

  private updateSupportVehicles(dt: number, nowMs: number): void {
    const p = this.playerRacer;
    const p2 = this.player2Racer;
    if (!p) return;

    const anyHumanNeedsTires = p.tireWear >= 75 || Boolean(p2 && p2.tireWear >= 75);

    // 1. Deploy Auto Amarillo (Yellow Safety Car) whenever a player's wheels are worn out (>= 75)
    if (this.raceStarted && !this.raceFinished && anyHumanNeedsTires) {
      if (!this.safetyCarActive) {
        this.safetyCarActive = true;
        const leader = this.racers.reduce((best, cur) =>
          cur.totalProgress > best.totalProgress ? cur : best
        );
        this.safetyCarDist =
          ((leader.t + 0.04) % 1) * this.track.totalLength;
        this.safetyCarGroup.visible = true;
      }
    } else if (this.safetyCarActive && (!anyHumanNeedsTires || this.raceFinished)) {
      this.safetyCarActive = false;
      this.safetyCarGroup.visible = false;
    }

    if (this.safetyCarActive) {
      const scSpeedMs = 33.5; // ~120 km/h Safety Car pace
      this.safetyCarDist =
        (this.safetyCarDist + scSpeedMs * dt) % this.track.totalLength;
      const scT = this.safetyCarDist / this.track.totalLength;
      const scPt = this.track.curve.getPointAt(scT);
      const scTan = this.track.curve.getTangentAt(scT).normalize();
      const scRight = new THREE.Vector3()
        .crossVectors(scTan, new THREE.Vector3(0, 1, 0))
        .normalize();
      const scLat = -this.circuit.trackWidth * 0.18;

      this.safetyCarX = scPt.x + scRight.x * scLat;
      this.safetyCarZ = scPt.z + scRight.z * scLat;
      const scHeading = Math.atan2(scTan.x, scTan.z);

      this.safetyCarGroup.position.set(this.safetyCarX, scPt.y, this.safetyCarZ);
      this.safetyCarGroup.rotation.y = scHeading;

      const flash = Math.sin(nowMs * 0.016) > 0;
      this.safetyCarBeaconMats[0].color.setHex(flash ? 0xfef08a : 0x713f12);
      this.safetyCarBeaconMats[1].color.setHex(flash ? 0x713f12 : 0xf97316);
      this.safetyCarWheels.forEach((w) => {
        w.rotation.x += (scSpeedMs / 0.34) * dt;
      });
    }

    // 2. Deploy Camión Rápido when a player's tires hit critical (92%+) and not already in Pits!
    if (this.raceStarted && !this.raceFinished && !this.rescueTruckActive) {
      const candidate =
        !p.inPitStop && !p.finished && p.tireWear >= 92
          ? p
          : p2 && !p2.inPitStop && !p2.finished && p2.tireWear >= 92
            ? p2
            : null;
      if (candidate) {
        this.rescueTruckActive = true;
        this.rescueTarget = candidate;
        this.rescueTruckDist = candidate.t * this.track.totalLength;
        this.rescueTruckGroup.visible = true;
      }
    }

    if (this.rescueTruckActive && this.rescueTarget) {
      const target = this.rescueTarget;
      const truckSpeedMs = 70; // ~252 km/h fast rescue truck straight to the Pits!
      const pitTargetDist =
        (this.track.pitBox.sampleIndex / this.track.samples.length) *
        this.track.totalLength;
      const prevDist = this.rescueTruckDist;
      const distToPit =
        (pitTargetDist - prevDist + this.track.totalLength) %
        this.track.totalLength;

      if (distToPit <= truckSpeedMs * dt + 3.0) {
        // Arrived right inside Calle de los Pits -> hand over to Pit Crew!
        this.enterPitStop(target.isPlayer2 ? 2 : 1);
        return;
      }

      this.rescueTruckDist =
        (prevDist + truckSpeedMs * dt) % this.track.totalLength;
      const trT = this.rescueTruckDist / this.track.totalLength;
      const trPt = this.track.curve.getPointAt(trT);
      const trTan = this.track.curve.getTangentAt(trT).normalize();
      const trRight = new THREE.Vector3()
        .crossVectors(trTan, new THREE.Vector3(0, 1, 0))
        .normalize();

      const approxSample =
        Math.floor(trT * this.track.samples.length) % this.track.samples.length;
      let trLat = 0;
      if (
        approxSample >= this.track.pitEntryIndex &&
        approxSample <= this.track.pitBox.sampleIndex
      ) {
        const k =
          (approxSample - this.track.pitEntryIndex) /
          Math.max(1, this.track.pitBox.sampleIndex - this.track.pitEntryIndex);
        trLat = k * this.track.pitBox.lateralOffset;
      }

      this.rescueTruckX = trPt.x + trRight.x * trLat;
      this.rescueTruckZ = trPt.z + trRight.z * trLat;
      const trHeading = Math.atan2(trTan.x, trTan.z);

      this.rescueTruckGroup.position.set(
        this.rescueTruckX,
        trPt.y,
        this.rescueTruckZ
      );
      this.rescueTruckGroup.rotation.y = trHeading;

      const flash = Math.sin(nowMs * 0.022) > 0;
      this.rescueTruckBeaconMats[0].color.setHex(flash ? 0xf97316 : 0x7c2d12);
      this.rescueTruckBeaconMats[1].color.setHex(flash ? 0x713f12 : 0xfef08a);
      this.rescueTruckWheels.forEach((w) => {
        w.rotation.x += (truckSpeedMs / 0.48) * dt;
      });

      const fwdX = Math.sin(trHeading);
      const fwdZ = Math.cos(trHeading);
      target.x = this.rescueTruckX - fwdX * 1.15;
      target.y = trPt.y + 0.86;
      target.z = this.rescueTruckZ - fwdZ * 1.15;
      target.heading = trHeading;
      target.velHeading = trHeading;
      target.speedMs = truckSpeedMs;
      target.steerAngle = 0;
      target.drifting = false;
      target.drsActive = false;
      target.offTrack = false;
      target.gear = 6;
      target.rpm = 8900;
      target.sampleIndex = approxSample;
      target.t = trT;
      target.currentLapMs += dt * 1000;
      target.rig.root.position.set(target.x, target.y, target.z);
      target.rig.root.rotation.y = target.heading;
      target.rig.updateVisuals({
        steerAngle: 0,
        speedMs: 0,
        dt,
        drsActive: false,
        braking: false,
        accelerating: false,
        damageLevel: target.damageLevel,
        rearDamageLevel: target.rearDamageLevel,
      });
      if (target.isPlayer) {
        audioEngine.updateTelemetry(4600, 1, false, 0, false);
      }
    }
  }

  private updateRacerPhysics(r: InternalRacer, dt: number): void {
    if (this.rescueTruckActive && this.rescueTarget === r) {
      return;
    }

    if (r.inPitStop) {
      if (r.isAI) {
        r.aiPitTimer -= dt;
        if (r.aiPitTimer <= 0) {
          r.tireWear = 0;
          r.damageLevel = 0;
          r.rearDamageLevel = 0;
          r.aiWantsPit = false;
          r.aiPitCooldown = 18;
          r.inPitStop = false;
          const exitIdx = this.track.pitExitIndex;
          const s = this.track.samples[exitIdx];
          const halfW = this.circuit.trackWidth * 0.5;
          const rejoinLat = Math.max(1.5, halfW * 0.35);
          r.x = s.point.x + s.right.x * rejoinLat;
          r.y = s.point.y;
          r.z = s.point.z + s.right.z * rejoinLat;
          r.heading = Math.atan2(s.tangent.x, s.tangent.z);
          r.velHeading = r.heading;
          r.sampleIndex = exitIdx;
          r.speedMs = 26;
          r.aiLaneOffset = rejoinLat;
          r.aiTargetLane = rejoinLat;
          return;
        }
      }

      r.speedMs = 0;
      r.gear = 1;
      r.rpm = 4100;
      r.drifting = false;
      r.drsActive = false;
      r.rig.root.position.set(r.x, r.y, r.z);
      r.rig.root.rotation.y = r.heading;
      r.rig.updateVisuals({
        steerAngle: 0,
        speedMs: 0,
        dt,
        drsActive: false,
        braking: false,
        accelerating: false,
        damageLevel: r.damageLevel,
        rearDamageLevel: r.rearDamageLevel,
      });
      if (r.isPlayer) {
        audioEngine.updateTelemetry(4100, 1, false, 0, false);
      }
      return;
    }

    const stats = computeCarStats(r.carConfig);
    const damagePenalty = 1 - (r.damageLevel / 100) * 0.14;
    const tireSpeedMult =
      r.tireWear >= 75
        ? r.isAI
          ? 0.72
          : 0.45
        : r.tireWear >= 40
          ? 0.94
          : 1.0;
    const safetyCarAiCap = r.isAI && this.safetyCarActive && !r.aiWantsPit ? 0.42 : 1.0;
    const maxSpeedMs =
      (stats.topSpeed / 3.6) * damagePenalty * tireSpeedMult * safetyCarAiCap;

    let throttle = false;
    let braking = false;
    let steerInput = 0;
    let handbrake = false;
    let wantsDrs = false;

    if ((r.isPlayer || r.isPlayer2) && !r.finished && this.raceStarted) {
      const inp = this.readPlayerInput(r.isPlayer2 ? 2 : 1);
      throttle = inp.throttle;
      braking = inp.braking;
      steerInput = inp.steerInput;
      handbrake = inp.handbrake;
      wantsDrs = inp.wantsDrs;
    } else if (r.isAI && this.raceStarted && !r.finished) {
      const nSamples = this.track.samples.length;
      const totalLen = this.track.totalLength;
      const samplesPerMeter = nSamples / totalLen;

      const projSelf = this.track.closestPointOnTrack(r.x, r.z, r.sampleIndex);
      r.sampleIndex = projSelf.sampleIndex;
      const selfLat = projSelf.lateralOffset;
      const selfT = projSelf.t;
      const sNow = this.track.samples[r.sampleIndex];

      // Meter-accurate lookahead horizons so corner braking & steering work on all 900 tracks
      const aimDist = THREE.MathUtils.clamp(11 + r.speedMs * 0.36, 11, 34);
      const aimSamples = Math.max(2, Math.round(aimDist * samplesPerMeter));
      const nearCornerSamples = Math.max(3, Math.round(24 * samplesPerMeter));
      const midCornerSamples = Math.max(6, Math.round(54 * samplesPerMeter));
      const farCornerSamples = Math.max(10, Math.round(88 * samplesPerMeter));

      const sTarget = this.track.samples[(r.sampleIndex + aimSamples) % nSamples];
      const sNear = this.track.samples[(r.sampleIndex + nearCornerSamples) % nSamples];
      const sMid = this.track.samples[(r.sampleIndex + midCornerSamples) % nSamples];
      const sFar = this.track.samples[(r.sampleIndex + farCornerSamples) % nSamples];

      const halfW = this.circuit.trackWidth * 0.5;
      const usableHalf = Math.max(3.2, halfW - 1.9);
      const aiIdx = Number(r.id.split('-')[1]) || 0;
      const gridSide = aiIdx % 2 === 0 ? -1 : 1;
      // Start in clean grid columns for first 2.2s, then settle into staggered racing lines
      const baseLane =
        this.raceElapsedMs < 2200
          ? gridSide * 3.0
          : ((aiIdx % 4) - 1.5) * 1.65;

      // Track-relative projections of all other racers (consistent on straights & turns)
      const nearbyOthers: Array<{
        aheadDist: number;
        lat: number;
        futureLat: number;
        speedMs: number;
      }> = [];

      let trafficSpeedCap = Infinity;

      for (const other of this.racers) {
        if (other === r) continue;
        const projOther = this.track.closestPointOnTrack(
          other.x,
          other.z,
          other.sampleIndex
        );
        let dT = projOther.t - selfT;
        if (dT > 0.5) dT -= 1;
        if (dT < -0.5) dT += 1;
        const aheadDist = dT * totalLen;

        if (aheadDist > -7 && aheadDist < 58) {
          const otherLat = projOther.lateralOffset;
          const futureLat = other.isAI
            ? THREE.MathUtils.lerp(otherLat, other.aiTargetLane, 0.4)
            : otherLat;
          nearbyOthers.push({
            aheadDist,
            lat: otherLat,
            futureLat,
            speedMs: other.speedMs,
          });

          // Adaptive following & braking if another car is directly in our path ahead
          if (aheadDist > 0.4 && aheadDist < 34) {
            const latDiffNow = Math.abs(otherLat - selfLat);
            const latDiffPath = Math.abs(otherLat - r.aiLaneOffset);
            if (latDiffNow < 2.65 || latDiffPath < 2.35) {
              let safeSpd = Infinity;
              if (aheadDist < 6.5) {
                safeSpd = Math.max(6, other.speedMs * 0.72 - 4);
              } else if (aheadDist < 13.5) {
                safeSpd = Math.max(10, other.speedMs * 0.9);
              } else {
                safeSpd = other.speedMs + (aheadDist - 13.5) * 1.45;
              }
              if (safeSpd < trafficSpeedCap) {
                trafficSpeedCap = safeSpd;
              }
            }
          }
        }
      }

      // Score 7 candidate racing lanes across the asphalt width to find the cleanest gap
      let bestLane = baseLane;
      let bestCost = Infinity;
      const LANE_COUNT = 7;
      for (let li = 0; li < LANE_COUNT; li++) {
        const frac = (li / (LANE_COUNT - 1)) * 2 - 1; // -1 .. +1
        const candLat = frac * usableHalf;

        let cost =
          Math.abs(candLat - baseLane) * 0.5 +
          Math.abs(candLat - r.aiLaneOffset) * 0.35;

        for (let oi = 0; oi < nearbyOthers.length; oi++) {
          const o = nearbyOthers[oi];
          const gap = Math.min(
            Math.abs(candLat - o.lat),
            Math.abs(candLat - o.futureLat)
          );

          // Never steer sideways across an adjacent car
          if (o.aheadDist > -6.5 && o.aheadDist < 7.5) {
            const crossesSideBySide =
              (selfLat - o.lat) * (candLat - o.lat) <= 0 &&
              Math.abs(selfLat - o.lat) < 4.5;
            if (crossesSideBySide && gap < 3.0) {
              cost += 750;
            }
            if (gap < 2.95) {
              cost += (2.95 - gap) * 420;
            }
          } else if (o.aheadDist >= 7.5) {
            if (gap < 2.95) {
              const urgency = (58 - o.aheadDist) / 58;
              const closing = Math.max(0, r.speedMs - o.speedMs + 6);
              cost +=
                (2.95 - gap) *
                (35 + urgency * urgency * 280 + closing * 4.0);
            }
          }
        }

        if (cost < bestCost) {
          bestCost = cost;
          bestLane = candLat;
        }
      }

      if (r.aiPitCooldown > 0) {
        r.aiPitCooldown = Math.max(0, r.aiPitCooldown - dt);
      }
      if (
        !r.aiWantsPit &&
        r.aiPitCooldown <= 0 &&
        r.lap <= this.totalLaps &&
        (r.tireWear >= 70 || r.damageLevel >= 45 || r.rearDamageLevel >= 45)
      ) {
        r.aiWantsPit = true;
      }

      const pitEntryIdx = this.track.pitEntryIndex;
      const pitBoxIdx = this.track.pitBox.sampleIndex;
      const aiEnteringPits =
        r.aiWantsPit && r.sampleIndex >= pitEntryIdx - 18 && r.sampleIndex <= pitBoxIdx + 4;

      if (aiEnteringPits) {
        const pitApproachLane =
          r.sampleIndex >= pitEntryIdx
            ? this.track.pitBox.lateralOffset
            : Math.max(2.5, halfW - 1.3);
        bestLane = pitApproachLane;
        r.aiTargetLane = THREE.MathUtils.damp(r.aiTargetLane, bestLane, 6.5, dt);
        r.aiLaneOffset = THREE.MathUtils.damp(r.aiLaneOffset, r.aiTargetLane, 7.5, dt);
      } else {
        r.aiTargetLane = THREE.MathUtils.damp(r.aiTargetLane, bestLane, 5.2, dt);
        r.aiLaneOffset = THREE.MathUtils.damp(
          r.aiLaneOffset,
          r.aiTargetLane,
          6.0,
          dt
        );
      }

      const aimX = sTarget.point.x + sTarget.right.x * r.aiLaneOffset;
      const aimZ = sTarget.point.z + sTarget.right.z * r.aiLaneOffset;
      const desiredHeading = Math.atan2(aimX - r.x, aimZ - r.z);

      let angleDiff = desiredHeading - r.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const trackHeading = Math.atan2(sNow.tangent.x, sNow.tangent.z);
      let trackAngleDiff = trackHeading - r.heading;
      while (trackAngleDiff > Math.PI) trackAngleDiff -= Math.PI * 2;
      while (trackAngleDiff < -Math.PI) trackAngleDiff += Math.PI * 2;

      // Instant recovery only if pushed far off-heading or stalled (never block behind cars)
      if (
        this.raceElapsedMs > 2000 &&
        (r.speedMs < 9 || Math.abs(trackAngleDiff) > 1.35)
      ) {
        r.aiStuckTimer += dt;
      } else {
        r.aiStuckTimer = Math.max(0, r.aiStuckTimer - dt * 3);
      }

      if (r.aiStuckTimer > 0.45) {
        r.heading += trackAngleDiff * Math.min(1, 10 * dt);
        r.velHeading = r.heading;
        r.speedMs = Math.max(r.speedMs, 18);
        r.aiStuckTimer = 0;
      }

      steerInput = THREE.MathUtils.clamp(angleDiff * 2.85, -1, 1);

      // Multi-horizon corner detection so fast bots brake cleanly BEFORE tight hairpins
      const dotNear = sNow.tangent.dot(sNear.tangent);
      const dotMid = sNow.tangent.dot(sMid.tangent);
      const dotFar = sNear.tangent.dot(sFar.tangent);
      const minDot = Math.min(dotNear, dotMid, dotFar);
      const cornerFactor = THREE.MathUtils.clamp((1 - minDot) * 1.9, 0, 1);
      const targetCornerSpeed =
        maxSpeedMs * r.aiSkill * (1 - cornerFactor * 0.48);

      const pitSpeedCap = aiEnteringPits
        ? r.sampleIndex >= pitEntryIdx
          ? 24
          : 40
        : Infinity;

      const desiredSpeed = Math.min(
        targetCornerSpeed,
        trafficSpeedCap,
        pitSpeedCap,
        this.safetyCarActive && !aiEnteringPits ? 33.0 : Infinity
      );

      if (r.speedMs > desiredSpeed + 2.8) {
        braking = true;
      } else if (r.speedMs > desiredSpeed + 0.4) {
        throttle = false;
      } else {
        throttle = true;
      }
      wantsDrs =
        !this.safetyCarActive &&
        !aiEnteringPits &&
        minDot > 0.94 &&
        trafficSpeedCap > maxSpeedMs * 0.95 &&
        r.drsCharge > 20;
    } else if (r.finished && !r.isRemote) {
      throttle = r.speedMs < 28;
      const targetIdx = (r.sampleIndex + 10) % this.track.samples.length;
      const sTarget = this.track.samples[targetIdx];
      const desiredHeading = Math.atan2(sTarget.point.x - r.x, sTarget.point.z - r.z);
      let diff = desiredHeading - r.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      steerInput = THREE.MathUtils.clamp(diff * 2.0, -1, 1);
    }

    if (r.isRemote) {
      r.x = THREE.MathUtils.damp(r.x, r.remoteTargetX, 14, dt);
      r.y = THREE.MathUtils.damp(r.y, r.remoteTargetY, 14, dt);
      r.z = THREE.MathUtils.damp(r.z, r.remoteTargetZ, 14, dt);
      let hDiff = r.remoteTargetHeading - r.heading;
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      r.heading += hDiff * Math.min(1, 14 * dt);

      r.rig.root.position.set(r.x, r.y, r.z);
      r.rig.root.rotation.y = r.heading;
      r.rig.updateVisuals({
        steerAngle: 0,
        speedMs: r.speedMs,
        dt,
        drsActive: r.drsActive,
        braking: false,
        accelerating: r.speedMs > 10,
        damageLevel: r.damageLevel,
      });
      return;
    }

    // DRS Boost
    if (wantsDrs && r.drsCharge > 5 && r.speedMs > 25 && throttle) {
      r.drsActive = true;
      r.drsCharge = Math.max(0, r.drsCharge - 36 * dt);
    } else {
      r.drsActive = false;
      const recharge = braking ? 28 : 10;
      r.drsCharge = Math.min(100, r.drsCharge + recharge * dt);
    }

    // Longitudinal forces + Handbrake deceleration
    const accelForce =
      (26 + (stats.acceleration - 80) * 0.45) *
      (r.drsActive ? 1.28 : 1.0) *
      (r.isAI ? 1.18 : 1.0);
    const brakeForce = 44 + (stats.braking - 80) * 0.6;
    const effectiveMax =
      maxSpeedMs * (r.isAI ? r.aiSkill : 1.0) * (r.drsActive ? 1.1 : 1.0);

    if (handbrake && r.speedMs > 4) {
      r.speedMs -= 14 * dt;
    } else if (throttle) {
      const speedRatio = Math.max(0, r.speedMs / effectiveMax);
      const powerCurve = Math.max(0.18, 1 - speedRatio * 0.72);
      r.speedMs += accelForce * powerCurve * dt;
    } else if (braking) {
      if (r.speedMs > 1.5) {
        r.speedMs -= brakeForce * dt;
      } else {
        r.speedMs = Math.max(-14, r.speedMs - 14 * dt);
      }
    } else {
      r.speedMs -= (3.2 + r.speedMs * 0.08) * dt;
      if (Math.abs(r.speedMs) < 0.25) r.speedMs = 0;
    }

    // Steering + Handbrake Drift Slip Angle!
    const targetSteer = steerInput * (handbrake ? 0.56 : 0.42);
    r.steerAngle = THREE.MathUtils.damp(r.steerAngle, targetSteer, 12, dt);

    const speedFactor = r.isAI
      ? Math.max(0.55, Math.min(1, Math.abs(r.speedMs) / 13))
      : Math.min(1, Math.abs(r.speedMs) / 13);
    const highSpeedStability =
      1 - Math.min(0.42, (Math.abs(r.speedMs) / Math.max(20, maxSpeedMs)) * 0.4);
    const gripFactor =
      (0.88 + (stats.handling - 75) * 0.008) *
      (r.tireWear >= 75 ? 0.82 : r.tireWear >= 40 ? 0.93 : 1.0);
    const reverseSign = r.speedMs >= 0 ? 1 : -1;
    const driftMultiplier = handbrake ? 1.65 : 1.0;

    const aiTurnBoost = r.isAI ? 1.18 : 1.0;
    const yawRate =
      steerInput *
      2.15 *
      aiTurnBoost *
      driftMultiplier *
      speedFactor *
      highSpeedStability *
      gripFactor *
      reverseSign;
    r.heading += yawRate * dt;

    // Velocity heading lags behind chassis heading during handbrake drift!
    let vhDiff = r.heading - r.velHeading;
    while (vhDiff > Math.PI) vhDiff -= Math.PI * 2;
    while (vhDiff < -Math.PI) vhDiff += Math.PI * 2;
    const lateralGripRate = handbrake ? 2.4 : r.isAI ? 15.5 : 11.5;
    r.velHeading += vhDiff * Math.min(1, lateralGripRate * dt);

    const slipAngle = Math.abs(vhDiff);
    r.drifting = (handbrake && Math.abs(r.speedMs) > 10) || slipAngle > 0.14;

    if (r.drifting && Math.random() < 0.65) {
      const rx = r.x - Math.sin(r.heading) * 1.6;
      const rz = r.z - Math.cos(r.heading) * 1.6;
      this.emitSmoke(rx, r.y, rz);
    }

    r.x += Math.sin(r.velHeading) * r.speedMs * dt;
    r.z += Math.cos(r.velHeading) * r.speedMs * dt;

    // Track projection & frontal/rear barrier collision damage + Pit Bay Entry!
    const proj = this.track.closestPointOnTrack(r.x, r.z, r.sampleIndex);
    r.sampleIndex = proj.sampleIndex;
    r.y = THREE.MathUtils.damp(r.y, proj.point.y, 18, dt);

    const halfW = this.circuit.trackWidth * 0.5;
    const pitEntry = this.track.pitEntryIndex;
    const pitExit = this.track.pitExitIndex;
    const inPitWindow = r.sampleIndex >= pitEntry && r.sampleIndex <= pitExit;
    const inPitBayLane = inPitWindow && proj.lateralOffset > halfW + 0.5;

    r.nearPitZone =
      (r.isPlayer || r.isPlayer2) &&
      this.raceStarted &&
      !r.finished &&
      r.sampleIndex >= pitEntry - 16 &&
      r.sampleIndex <= pitExit;

    // Realistic tire wear over 3 laps for players & AI bots (only when tireWearEnabled is true)
    if (
      this.tireWearEnabled &&
      (r.isPlayer || r.isPlayer2 || r.isAI) &&
      this.raceStarted &&
      !r.finished
    ) {
      const compoundMult =
        r.carConfig.tireCompound === 'soft'
          ? 1.3
          : r.carConfig.tireCompound === 'medium'
            ? 1.0
            : 0.72;
      const aiIdx = r.isAI ? Number(r.id.split('-')[1]) || 0 : 0;
      const aiVariance = r.isAI ? 1.12 + (aiIdx % 3) * 0.16 : 1.0;
      const loadMult =
        (Math.abs(r.speedMs) / 72) *
        (1 + Math.abs(steerInput) * 0.85 + (r.drifting ? 1.9 : 0) + (r.offTrack ? 1.1 : 0));
      r.tireWear = Math.min(100, r.tireWear + 1.2 * compoundMult * aiVariance * loadMult * dt);
    }

    // Drive directly down Calle de los Pits to the 3D Pit Box to begin Pit Stop!
    if (
      (r.isPlayer || r.isPlayer2) &&
      this.raceStarted &&
      !r.finished &&
      inPitBayLane &&
      Math.abs(r.sampleIndex - this.track.pitBox.sampleIndex) <= 4 &&
      proj.lateralOffset > halfW + 2.4
    ) {
      this.enterPitStop(r.isPlayer2 ? 2 : 1);
      return;
    }

    // AI bots also enter the 3D Pit Box to repair damage & change worn tires!
    if (
      r.isAI &&
      r.aiWantsPit &&
      this.raceStarted &&
      !r.finished &&
      inPitBayLane &&
      Math.abs(r.sampleIndex - this.track.pitBox.sampleIndex) <= 5 &&
      proj.lateralOffset > halfW + 2.0
    ) {
      r.inPitStop = true;
      r.aiPitTimer = 2.4;
      r.speedMs = 0;
      const aiIdx = Number(r.id.split('-')[1]) || 0;
      const slotOffset = ((aiIdx % 3) - 1) * 3.8;
      const pitFwdX = Math.sin(this.track.pitBox.heading);
      const pitFwdZ = Math.cos(this.track.pitBox.heading);
      r.x = this.track.pitBox.position.x + pitFwdX * slotOffset;
      r.y = this.track.pitBox.position.y;
      r.z = this.track.pitBox.position.z + pitFwdZ * slotOffset;
      r.heading = this.track.pitBox.heading;
      r.velHeading = r.heading;
      r.rig.root.position.set(r.x, r.y, r.z);
      r.rig.root.rotation.y = r.heading;
      return;
    }

    r.offTrack = !inPitBayLane && Math.abs(proj.lateralOffset) > halfW + 0.65;

    if (r.offTrack) {
      r.speedMs *= Math.pow(r.isAI ? 0.92 : 0.7, dt);
    }

    const canUsePitLane = r.isPlayer || r.isPlayer2 || r.aiWantsPit;
    const maxLat = inPitWindow && proj.lateralOffset > 0 && canUsePitLane ? halfW + 10.6 : halfW + 2.4;
    if (Math.abs(proj.lateralOffset) > maxLat) {
      const sign = Math.sign(proj.lateralOffset);
      const isPitFence = inPitWindow && proj.lateralOffset > 0;
      const now = performance.now();
      const hitImpact = now - r.lastFenceHitTime > 320;

      // Calculate frontal or rear impact component against barrier
      const wallNormalX = -proj.right.x * sign;
      const wallNormalZ = -proj.right.z * sign;
      const fwdDotWall = -(Math.sin(r.heading) * wallNormalX + Math.cos(r.heading) * wallNormalZ);
      if (hitImpact) {
        if (fwdDotWall >= 0) {
          this.applyFrontalDamage(r, Math.max(0, r.speedMs * Math.max(0.25, fwdDotWall)));
        } else {
          this.applyRearDamage(r, Math.max(0, Math.abs(r.speedMs) * Math.max(0.25, -fwdDotWall)));
        }
      }

      // Track fence collisions (NOT pit fences) wear down tires cleanly when tireWearEnabled is true
      if (this.tireWearEnabled && !isPitFence && this.raceStarted && !r.finished) {
        r.tireWear = Math.min(
          100,
          r.tireWear + (4.2 + Math.abs(r.speedMs) * 0.25) * dt * 2.4
        );
        if (hitImpact && Math.abs(r.speedMs) > 10) {
          r.tireWear = Math.min(
            100,
            r.tireWear + Math.min(9.5, 2.5 + Math.abs(r.speedMs) * 0.14)
          );
        }
      }
      if (hitImpact) {
        r.lastFenceHitTime = now;
      }

      // Slide cleanly forward along the fence instead of getting stopped/stuck
      r.x = proj.point.x + proj.right.x * sign * (maxLat - 0.14);
      r.z = proj.point.z + proj.right.z * sign * (maxLat - 0.14);

      const wallHeading = Math.atan2(proj.tangent.x, proj.tangent.z);
      let hDiff = wallHeading - r.heading;
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      const alignRate = r.isAI ? 0.72 : throttle ? 0.56 : 0.44;
      r.heading += hDiff * alignRate;
      r.velHeading = r.heading;

      const impactScrub =
        hitImpact && fwdDotWall > 0.12 ? Math.min(0.16, fwdDotWall * 0.16) : 0;
      if (throttle) {
        r.speedMs = Math.max(
          Math.min(r.speedMs, 20),
          r.speedMs * (1 - impactScrub)
        );
      } else if (r.isAI) {
        r.speedMs = Math.max(15, r.speedMs * (1 - impactScrub));
      } else {
        r.speedMs = r.speedMs * (1 - impactScrub);
      }
    }

    r.speedMs = THREE.MathUtils.clamp(r.speedMs, -14, effectiveMax);

    // Gear & RPM
    const kmh = Math.abs(r.speedMs) * 3.6;
    const gearThresholds = [0, 75, 120, 165, 205, 245, 282, 315, 380];
    let gear = 1;
    for (let g = 1; g <= 8; g++) {
      if (kmh >= gearThresholds[g - 1]) gear = g;
    }
    r.gear = r.speedMs < -0.5 ? 0 : gear;
    const gearMin = gearThresholds[Math.max(0, gear - 1)];
    const gearMax = gearThresholds[gear] || 360;
    const inGearRatio = THREE.MathUtils.clamp(
      (kmh - gearMin) / Math.max(25, gearMax - gearMin),
      0,
      1
    );
    const idleRpm = this.raceStarted
      ? 4200
      : 5400 + Math.sin(performance.now() * 0.02) * 350;
    r.rpm = this.raceStarted
      ? Math.round(5800 + inGearRatio * 7400)
      : Math.round(idleRpm);

    // Lap & checkpoints
    if (this.raceStarted && !r.finished) {
      r.currentLapMs += dt * 1000;
      const prevT = r.t;
      r.t = proj.t;

      if (r.t > 0.2 && r.t < 0.45 && r.maxCheckpoint === 0) r.maxCheckpoint = 1;
      else if (r.t >= 0.45 && r.t < 0.7 && r.maxCheckpoint === 1) r.maxCheckpoint = 2;
      else if (r.t >= 0.7 && r.t < 0.92 && r.maxCheckpoint === 2) r.maxCheckpoint = 3;

      if (prevT > 0.85 && r.t < 0.15 && r.maxCheckpoint === 3) {
        const completedLapTime = r.currentLapMs;
        const isBest = r.bestLapMs === null || completedLapTime < r.bestLapMs;
        if (isBest) r.bestLapMs = completedLapTime;
        r.lastLapMs = completedLapTime;
        r.currentLapMs = 0;
        r.maxCheckpoint = 0;

        if (r.isPlayer || r.isPlayer2) {
          audioEngine.playLapChime();
          this.callbacks.onLapComplete?.(
            completedLapTime,
            r.lap,
            isBest,
            r.isPlayer2 ? 2 : 1
          );
        }

        if (this.mode !== 'timetrial' && r.lap >= this.totalLaps) {
          r.finished = true;
          r.finishTimeMs = this.raceElapsedMs;
          if (r.isPlayer || r.isPlayer2) {
            const allHumansFinished =
              this.playerRacer.finished &&
              (!this.player2Racer || this.player2Racer.finished);
            if (allHumansFinished) {
              this.finishRace();
            }
          }
        } else {
          r.lap += 1;
        }
      }

      if (r.lap === 1 && r.maxCheckpoint === 0 && r.t > 0.82) {
        r.totalProgress = r.t - 1;
      } else {
        r.totalProgress = (r.lap - 1) + r.t;
      }
    }

    r.rig.root.position.set(r.x, r.y, r.z);
    r.rig.root.rotation.y = r.heading;
    r.rig.updateVisuals({
      steerAngle: r.steerAngle,
      speedMs: r.speedMs,
      dt,
      drsActive: r.drsActive,
      braking: braking || handbrake,
      accelerating: throttle,
      damageLevel: r.damageLevel,
      rearDamageLevel: r.rearDamageLevel,
    });

    if (r.isPlayer) {
      if (throttle || handbrake) {
        audioEngine.startEngine();
      }
      const lateralSlip =
        (r.drifting ? 1.25 : Math.abs(steerInput) * Math.min(1, kmh / 180) * 0.5) *
        (r.offTrack ? 1.2 : 1.0);
      audioEngine.updateTelemetry(
        r.rpm,
        r.gear,
        throttle,
        lateralSlip,
        r.drsActive,
        r.drifting
      );
    }
  }

  private resolveCarCollisions(): void {
    // Exact F1 chassis OBB dimensions in meters:
    // Front wing tip = +2.66m, rear diffuser/wing = -2.66m, width = +-1.02m
    const HALF_LEN = 2.66;
    const HALF_WID = 1.02;
    const BROAD_SQ = 6.2 * 6.2;

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < this.racers.length; i++) {
        const a = this.racers[i];
        if (a.inPitStop || (this.rescueTruckActive && this.rescueTarget === a)) continue;
        const afx = Math.sin(a.heading);
        const afz = Math.cos(a.heading);
        const arx = Math.cos(a.heading);
        const arz = -Math.sin(a.heading);

        for (let j = i + 1; j < this.racers.length; j++) {
          const b = this.racers[j];
          if (b.inPitStop || (this.rescueTruckActive && this.rescueTarget === b)) continue;
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d2 = dx * dx + dz * dz;
          if (d2 > BROAD_SQ) continue;

          const bfx = Math.sin(b.heading);
          const bfz = Math.cos(b.heading);
          const brx = Math.cos(b.heading);
          const brz = -Math.sin(b.heading);

          // 4 SAT axes in XZ plane
          const axesX = [afx, arx, bfx, brx];
          const axesZ = [afz, arz, bfz, brz];

          let minOverlap = Infinity;
          let mtvX = 0;
          let mtvZ = 0;
          let separated = false;

          for (let k = 0; k < 4; k++) {
            const ax = axesX[k];
            const az = axesZ[k];

            const projA =
              Math.abs(afx * ax + afz * az) * HALF_LEN +
              Math.abs(arx * ax + arz * az) * HALF_WID;
            const projB =
              Math.abs(bfx * ax + bfz * az) * HALF_LEN +
              Math.abs(brx * ax + brz * az) * HALF_WID;

            const centerDist = dx * ax + dz * az;
            const overlap = projA + projB - Math.abs(centerDist);

            if (overlap <= 0) {
              separated = true;
              break;
            }
            if (overlap < minOverlap) {
              minOverlap = overlap;
              const dir = centerDist >= 0 ? 1 : -1;
              mtvX = ax * dir;
              mtvZ = az * dir;
            }
          }

          if (separated || !Number.isFinite(minOverlap)) continue;

          // Only damage & apply impulse on first solver iteration
          if (iter === 0) {
            const aForwardDot = afx * mtvX + afz * mtvZ;
            const bForwardDot = -(bfx * mtvX + bfz * mtvZ);

            const avx = Math.sin(a.velHeading) * a.speedMs;
            const avz = Math.cos(a.velHeading) * a.speedMs;
            const bvx = Math.sin(b.velHeading) * b.speedMs;
            const bvz = Math.cos(b.velHeading) * b.speedMs;
            const closingSpeed = (avx - bvx) * mtvX + (avz - bvz) * mtvZ;

            if (closingSpeed > 4) {
              if (aForwardDot > 0.35) {
                this.applyFrontalDamage(a, closingSpeed * aForwardDot);
              } else if (aForwardDot < -0.35) {
                this.applyRearDamage(a, closingSpeed * -aForwardDot);
              }
              if (bForwardDot > 0.35) {
                this.applyFrontalDamage(b, closingSpeed * bForwardDot);
              } else if (bForwardDot < -0.35) {
                this.applyRearDamage(b, closingSpeed * -bForwardDot);
              }

              // Transfer longitudinal momentum cleanly at the front-wing / rear-wing contact
              if (!a.isRemote && !b.isRemote) {
                if (a.isAI && b.isAI && this.raceStarted) {
                  // Keep AI pack flowing smoothly without chain-reaction pile-ups
                  const sA = a.speedMs - closingSpeed * 0.25 * Math.max(0, aForwardDot);
                  const sB = b.speedMs + closingSpeed * 0.25 * Math.max(0, bForwardDot === 0 ? 1 : bForwardDot);
                  a.speedMs = Math.max(16, sA);
                  b.speedMs = Math.max(18, sB);

                  // Nudge both AI target lanes apart along track right so they peel off cleanly
                  const sTrack = this.track.samples[a.sampleIndex];
                  const sepSide = mtvX * sTrack.right.x + mtvZ * sTrack.right.z;
                  const nudgeDir = sepSide >= 0 ? 1 : -1;
                  const halfW = this.circuit.trackWidth * 0.5 - 1.8;
                  a.aiTargetLane = THREE.MathUtils.clamp(a.aiTargetLane - nudgeDir * 1.4, -halfW, halfW);
                  b.aiTargetLane = THREE.MathUtils.clamp(b.aiTargetLane + nudgeDir * 1.4, -halfW, halfW);
                } else {
                  const aNew = a.speedMs - closingSpeed * 0.45 * Math.max(0, aForwardDot);
                  const bNew = b.speedMs + closingSpeed * 0.38 * Math.max(0, bForwardDot === 0 ? 1 : bForwardDot);
                  a.speedMs = a.isAI && this.raceStarted ? Math.max(20, aNew) : aNew;
                  b.speedMs = b.isAI && this.raceStarted ? Math.max(20, bNew) : bNew;
                }
              }
            }
          }

          // Separate cars cleanly so only front wing / hood / rear wing touch (never inside!)
          const pushA = a.isRemote ? 0 : b.isRemote ? minOverlap : minOverlap * 0.5;
          const pushB = b.isRemote ? 0 : a.isRemote ? minOverlap : minOverlap * 0.5;

          if (pushA > 0) {
            a.x -= mtvX * pushA;
            a.z -= mtvZ * pushA;
          }
          if (pushB > 0) {
            b.x += mtvX * pushB;
            b.z += mtvZ * pushB;
          }
        }
      }
    }
  }

  private updatePositions(): void {
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) {
        return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
      }
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.totalProgress - a.totalProgress;
    });
    sorted.forEach((r, idx) => {
      r.position = idx + 1;
    });
  }

  private updateCameraForRacer(
    cam: THREE.PerspectiveCamera,
    p: InternalRacer,
    camMode: CameraMode,
    dt: number,
    allowOrbit: boolean
  ): void {
    _fwd.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    _right.set(Math.cos(p.heading), 0, -Math.sin(p.heading));

    if (allowOrbit && !this.rightMouseDown && Math.abs(this.orbitYaw) > 0.001) {
      this.orbitYaw = THREE.MathUtils.damp(this.orbitYaw, 0, 7, dt);
      this.orbitPitch = THREE.MathUtils.damp(this.orbitPitch, 0.22, 7, dt);
      if (Math.abs(this.orbitYaw) < 0.015) {
        this.orbitYaw = 0;
      }
    }

    const usingOrbit = allowOrbit && (this.rightMouseDown || Math.abs(this.orbitYaw) > 0.015);

    const metrics = getCarGeometryMetrics(p.carConfig);
    const lift = Math.max(0, metrics.chassisLiftY);
    const largeExtra = metrics.isLargeWheels ? 1 : 0;

    if (p.inPitStop && !usingOrbit) {
      _camPos.set(
        p.x + _fwd.x * (3.8 + largeExtra * 0.45) - _right.x * (metrics.outerWheelEdgeX + 3.2),
        p.y + 1.85 + lift + largeExtra * 0.25,
        p.z + _fwd.z * (3.8 + largeExtra * 0.45) - _right.z * (metrics.outerWheelEdgeX + 3.2)
      );
      _camTarget.set(p.x, p.y + 0.55 + lift, p.z);
      cam.position.x = THREE.MathUtils.damp(cam.position.x, _camPos.x, 8, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, _camPos.y, 8, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, _camPos.z, 8, dt);
      cam.lookAt(_camTarget);
    } else if (usingOrbit) {
      const camAngle = p.heading + this.orbitYaw;
      const dist = (camMode === 'far' ? 11.2 : 7.6) + largeExtra * 0.85;
      const horizDist = Math.cos(this.orbitPitch) * dist;
      const height = Math.sin(this.orbitPitch) * dist + 0.65 + lift;
      _camPos.set(
        p.x - Math.sin(camAngle) * horizDist,
        p.y + height,
        p.z - Math.cos(camAngle) * horizDist
      );
      _camTarget.set(p.x, p.y + 0.65 + lift, p.z);
      cam.position.copy(_camPos);
      cam.lookAt(_camTarget);
    } else if (camMode === 'driver') {
      const driverFwd = 0.08 + largeExtra * 0.12;
      const driverHeight = 0.94 + lift + largeExtra * 0.16;
      _camPos.set(p.x + _fwd.x * driverFwd, p.y + driverHeight, p.z + _fwd.z * driverFwd);
      _camTarget.set(p.x + _fwd.x * 22, p.y + 0.72 + lift + largeExtra * 0.12, p.z + _fwd.z * 22);
      cam.position.copy(_camPos);
      cam.lookAt(_camTarget);
    } else if (camMode === 'hood') {
      const hoodFwd = 1.15 + largeExtra * 0.18;
      const hoodHeight = 0.66 + lift + largeExtra * 0.24;
      _camPos.set(p.x + _fwd.x * hoodFwd, p.y + hoodHeight, p.z + _fwd.z * hoodFwd);
      _camTarget.set(p.x + _fwd.x * 26, p.y + 0.45 + lift + largeExtra * 0.16, p.z + _fwd.z * 26);
      cam.position.copy(_camPos);
      cam.lookAt(_camTarget);
    } else if (camMode === 'floor') {
      const floorSide = Math.max(1.32, metrics.outerWheelEdgeX + 0.34);
      const floorFwd = 1.55 + largeExtra * 0.32;
      const floorHeight = 0.28 + largeExtra * 0.12;
      _camPos.set(
        p.x + _fwd.x * floorFwd - _right.x * floorSide,
        p.y + floorHeight,
        p.z + _fwd.z * floorFwd - _right.z * floorSide
      );
      _camTarget.set(p.x + _fwd.x * 24, p.y + 0.34 + largeExtra * 0.1, p.z + _fwd.z * 24);
      cam.position.copy(_camPos);
      cam.lookAt(_camTarget);
    } else if (camMode === 'far') {
      const farBack = 12.5 + largeExtra * 1.1;
      const farHeight = 5.2 + lift + largeExtra * 0.45;
      _camPos.set(p.x - _fwd.x * farBack, p.y + farHeight, p.z - _fwd.z * farBack);
      _camTarget.set(p.x + _fwd.x * 10, p.y + 1.1 + lift + largeExtra * 0.2, p.z + _fwd.z * 10);
      cam.position.x = THREE.MathUtils.damp(cam.position.x, _camPos.x, 8, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, _camPos.y, 7, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, _camPos.z, 8, dt);
      cam.lookAt(_camTarget);
    } else {
      const chaseBack = 8.2 + largeExtra * 0.9;
      const chaseHeight = 3.1 + lift + largeExtra * 0.38;
      _camPos.set(p.x - _fwd.x * chaseBack, p.y + chaseHeight, p.z - _fwd.z * chaseBack);
      _camTarget.set(p.x + _fwd.x * 9.5, p.y + 1.05 + lift + largeExtra * 0.22, p.z + _fwd.z * 9.5);
      cam.position.x = THREE.MathUtils.damp(cam.position.x, _camPos.x, 11, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, _camPos.y, 9, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, _camPos.z, 11, dt);
      cam.lookAt(_camTarget);
    }

    const speedRatio = Math.min(1, Math.abs(p.speedMs) / 95);
    const baseFov = usingOrbit
      ? 58
      : camMode === 'driver'
        ? 76
        : camMode === 'floor'
          ? 78
          : camMode === 'hood'
            ? 70
            : 60;
    const targetFov = baseFov + speedRatio * (p.drsActive ? 14 : 9);
    if (Math.abs(cam.fov - targetFov) > 0.05) {
      cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 7, dt);
      cam.updateProjectionMatrix();
    }
  }

  private updateCamera(dt: number): void {
    this.updateCameraForRacer(this.camera, this.playerRacer, this.cameraMode, dt, true);
    if (this.splitScreen && this.camera2 && this.player2Racer && !this.replayActive) {
      this.updateCameraForRacer(
        this.camera2,
        this.player2Racer,
        this.cameraMode2,
        dt,
        false
      );
    }
  }

  private stepReplay(dt: number): void {
    if (this.replayFrames.length === 0) return;
    const maxTime = this.replayFrames[this.replayFrames.length - 1].timeMs;

    if (this.replayPlaying) {
      this.replayCursorMs += dt * 1000 * this.replaySpeed;
      if (this.replayCursorMs > maxTime) {
        this.replayCursorMs = 0; // loop replay seamlessly
      }
    }

    // Binary search nearest replay frame
    let lo = 0;
    let hi = this.replayFrames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.replayFrames[mid].timeMs < this.replayCursorMs) lo = mid + 1;
      else hi = mid;
    }
    const f1 = this.replayFrames[lo];
    const f0 = this.replayFrames[Math.max(0, lo - 1)];
    const span = Math.max(1, f1.timeMs - f0.timeMs);
    const alpha = THREE.MathUtils.clamp((this.replayCursorMs - f0.timeMs) / span, 0, 1);

    for (let i = 0; i < f1.racers.length; i++) {
      const s1 = f1.racers[i];
      const s0 = f0.racers[i] ?? s1;
      const r = this.racers.find((rc) => rc.id === s1.id);
      if (!r) continue;

      r.x = THREE.MathUtils.lerp(s0.x, s1.x, alpha);
      r.y = THREE.MathUtils.lerp(s0.y, s1.y, alpha);
      r.z = THREE.MathUtils.lerp(s0.z, s1.z, alpha);

      let hDiff = s1.heading - s0.heading;
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      r.heading = s0.heading + hDiff * alpha;

      r.steerAngle = THREE.MathUtils.lerp(s0.steerAngle, s1.steerAngle, alpha);
      r.speedMs = THREE.MathUtils.lerp(s0.speedMs, s1.speedMs, alpha);
      r.drsActive = s1.drsActive;
      r.drifting = s1.drifting;
      r.damageLevel = s1.damageLevel;
      r.rearDamageLevel = s1.rearDamageLevel ?? 0;

      r.rig.root.position.set(r.x, r.y, r.z);
      r.rig.root.rotation.y = r.heading;
      r.rig.updateVisuals({
        steerAngle: r.steerAngle,
        speedMs: r.speedMs,
        dt: dt * this.replaySpeed,
        drsActive: r.drsActive,
        braking: false,
        accelerating: r.speedMs > 10,
        damageLevel: r.damageLevel,
        rearDamageLevel: r.rearDamageLevel,
      });

      if (r.drifting && this.replayPlaying && Math.random() < 0.45) {
        this.emitSmoke(
          r.x - Math.sin(r.heading) * 1.6,
          r.y,
          r.z - Math.cos(r.heading) * 1.6
        );
      }
    }

    this.updateParticles(dt);
    this.updateCamera(dt);
  }

  private toTelemetry(r: InternalRacer): RacerTelemetry {
    return {
      id: r.id,
      name: r.name,
      isPlayer: r.isPlayer,
      isPlayer2: r.isPlayer2,
      isAI: r.isAI,
      isRemote: r.isRemote,
      carConfig: r.carConfig,
      x: r.x,
      y: r.y,
      z: r.z,
      heading: r.heading,
      speedKmh: Math.round(Math.abs(r.speedMs) * 3.6),
      rpm: r.rpm,
      gear: r.gear,
      lap: Math.min(r.lap, this.totalLaps),
      progress: r.totalProgress,
      drsActive: r.drsActive,
      drsCharge: Math.round(r.drsCharge),
      drifting: r.drifting,
      damageLevel: r.damageLevel,
      rearDamageLevel: r.rearDamageLevel,
      tireWear: Math.round(r.tireWear),
      inPitStop: r.inPitStop,
      nearPitZone: r.nearPitZone,
      safetyCarActive: this.safetyCarActive,
      safetyCarPos: this.safetyCarActive
        ? { x: this.safetyCarX, z: this.safetyCarZ }
        : undefined,
      rescueTruckActive: this.rescueTruckActive,
      rescueTruckPos: this.rescueTruckActive
        ? { x: this.rescueTruckX, z: this.rescueTruckZ }
        : undefined,
      currentLapMs: r.currentLapMs,
      bestLapMs: r.bestLapMs,
      lastLapMs: r.lastLapMs,
      finished: r.finished,
      finishTimeMs: r.finishTimeMs,
      position: r.position,
      offTrack: r.offTrack,
    };
  }

  private finishRace(): void {
    if (this.raceFinished) return;
    this.raceFinished = true;
    let prevEst = this.playerRacer.finishTimeMs ?? this.raceElapsedMs;
    const sorted = [...this.racers].sort((a, b) => a.position - b.position);
    sorted.forEach((r) => {
      if (!r.finished) {
        const remLaps = Math.max(0.05, this.totalLaps - r.totalProgress);
        const est = this.raceElapsedMs + remLaps * 32000;
        r.finishTimeMs = Math.max(prevEst + 650, est);
        prevEst = r.finishTimeMs;
      }
    });
    const results = sorted.map((r) => this.toTelemetry(r));
    const totalReplayMs =
      this.replayFrames.length > 0
        ? this.replayFrames[this.replayFrames.length - 1].timeMs
        : 0;
    this.callbacks.onRaceFinish?.(results, totalReplayMs);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(0.05, Math.max(0.001, rawDt));

    this.track.updateCrowd(now * 0.001, Boolean(this.playerRacer?.inPitStop));

    if (this.replayActive) {
      this.stepReplay(dt);
    } else if (!this.paused) {
      this.updateCountdown(dt);
      if (this.raceStarted && !this.raceFinished) {
        this.raceElapsedMs += dt * 1000;
      }
      this.updateSupportVehicles(dt, now);
      for (let i = 0; i < this.racers.length; i++) {
        this.updateRacerPhysics(this.racers[i], dt);
      }
      this.resolveCarCollisions();
      this.updatePositions();
      this.updateParticles(dt);
      this.updateCamera(dt);

      // Record replay frame at 20 Hz while race is active (bounded for <= 600 MB RAM budget)
      if (
        this.raceStarted &&
        !this.raceFinished &&
        now - this.lastReplaySampleTime >= 50 &&
        this.replayFrames.length < MAX_REPLAY_FRAMES
      ) {
        this.lastReplaySampleTime = now;
        this.replayFrames.push({
          timeMs: this.raceElapsedMs,
          racers: this.racers.map((r) => ({
            id: r.id,
            x: r.x,
            y: r.y,
            z: r.z,
            heading: r.heading,
            steerAngle: r.steerAngle,
            speedMs: r.speedMs,
            drsActive: r.drsActive,
            drifting: r.drifting,
            damageLevel: r.damageLevel,
            rearDamageLevel: r.rearDamageLevel,
          })),
        });
      }

      if (
        this.mode === 'online' &&
        now - this.lastEmitTime > 50 &&
        this.callbacks.onOnlineStateEmit
      ) {
        this.lastEmitTime = now;
        const p = this.playerRacer;
        this.callbacks.onOnlineStateEmit({
          x: p.x,
          y: p.y,
          z: p.z,
          heading: p.heading,
          speedKmh: Math.round(Math.abs(p.speedMs) * 3.6),
          gear: p.gear,
          lap: p.lap,
          progress: p.totalProgress,
          drsActive: p.drsActive,
          finished: p.finished,
          finishTimeMs: p.finishTimeMs,
        });
      }
    }

    if (this.splitScreen && this.camera2 && !this.replayActive) {
      const width = this.renderer.domElement.clientWidth || window.innerWidth;
      const height = this.renderer.domElement.clientHeight || window.innerHeight;
      const halfW = Math.floor(width / 2);
      this.renderer.setScissorTest(true);

      this.renderer.setViewport(0, 0, halfW, height);
      this.renderer.setScissor(0, 0, halfW, height);
      this.renderer.render(this.scene, this.camera);

      this.renderer.setViewport(halfW, 0, width - halfW, height);
      this.renderer.setScissor(halfW, 0, width - halfW, height);
      this.renderer.render(this.scene, this.camera2);

      this.renderer.setScissorTest(false);
    } else {
      const width = this.renderer.domElement.clientWidth || window.innerWidth;
      const height = this.renderer.domElement.clientHeight || window.innerHeight;
      if (this.camera.aspect !== width / height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, width, height);
      this.renderer.render(this.scene, this.camera);
    }

    if (now - this.lastHudTime > 48) {
      this.lastHudTime = now;
      const sorted = [...this.racers]
        .sort((a, b) => a.position - b.position)
        .map((r) => this.toTelemetry(r));
      const playerTel = this.toTelemetry(this.playerRacer);
      const player2Tel = this.player2Racer
        ? this.toTelemetry(this.player2Racer)
        : null;
      this.callbacks.onHudUpdate({
        racers: sorted,
        player: playerTel,
        player2: player2Tel,
        countdownLights: this.countdownLights,
        raceStarted: this.raceStarted,
        raceFinished: this.raceFinished,
        cameraMode: this.cameraMode,
        cameraMode2: this.cameraMode2,
      });
    }

    if (now - this.lastMemoryCheckTime > 5000) {
      this.lastMemoryCheckTime = now;
      const heap = getJsHeapBytes();
      if (heap > TARGET_RAM_BUDGET_BYTES * 0.72) {
        if (!this.isSoftwareGl && this.renderer.getPixelRatio() > 1) {
          this.renderer.setPixelRatio(1);
        }
        if (this.replayFrames.length > 1200) {
          this.replayFrames = this.replayFrames.filter((_, idx) => idx % 2 === 0);
        }
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    audioEngine.stopEngine();

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.onContextLost
    );
    this.renderer.domElement.removeEventListener(
      'contextmenu',
      this.onContextMenu
    );
    this.renderer.domElement.removeEventListener(
      'mousedown',
      this.onMouseDown
    );

    this.racers.forEach((r) => r.rig.dispose());
    this.racers.length = 0;
    this.player2Racer = null;
    this.rescueTarget = null;
    this.camera2 = null;
    this.replayFrames.length = 0;
    this.smokePool.length = 0;
    this.debrisPool.length = 0;
    this.particleDisposables.forEach((d) => d.dispose());
    this.particleDisposables.length = 0;
    this.supportDisposables.forEach((d) => d.dispose());
    this.supportDisposables.length = 0;
    this.track.dispose();
    this.skyTex?.dispose();
    this.envMapTex?.dispose();
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
