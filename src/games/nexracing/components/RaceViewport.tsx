import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraMode,
  CarCustomization,
  CircuitSpec,
  FlagState,
  GameSettings,
  LeaderboardEntry,
  MultiplayerDriverInfo,
  RaceMode,
  RaceResult,
  RaceTelemetry,
  RemoteCarPacket,
  StockCarSpec,
} from '../types/game';
import { AI_DRIVER_NAMES, STOCK_CARS } from '../data/cars';
import { compileTrack } from '../engine/trackMath';
import { buildTrackScene, getThemeAtmosphere } from '../engine/trackBuilder';
import { createStockCarMesh, CarMeshRig } from '../engine/carFactory';
import {
  activateFuelBoost,
  CarInput,
  computeAiInput,
  createCarStateFromSpec,
  RaceCarState,
  resetCarToTrack,
  resolveCarCollisions,
  stepCarPhysics,
  triggerWallStunt,
  updateDrafting,
} from '../engine/physics';
import { RaceAudioEngine } from '../engine/audioEngine';
import {
  Camera,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  LogOut,
  Zap,
  AlertTriangle,
  Fuel,
  Wrench,
  Flame,
  Copy,
  Check,
  Infinity as InfinityIcon,
} from 'lucide-react';

interface RaceViewportProps {
  mode: RaceMode;
  circuit: CircuitSpec;
  totalLaps: number;
  freeRoam?: boolean;
  roomCode?: string | null;
  playerCarSpec: StockCarSpec;
  playerCustomization: CarCustomization;
  settings: GameSettings;
  multiplayerDrivers?: MultiplayerDriverInfo[];
  localClientId?: string | null;
  wsRef?: React.MutableRefObject<WebSocket | null>;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onRestart?: () => void;
  onExit: () => void;
  onRaceComplete: (result: RaceResult) => void;
}

const _camTarget = new THREE.Vector3();
const _camTarget2 = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _lookDesired = new THREE.Vector3();
const _quatBank = new THREE.Quaternion();
const _quatYaw = new THREE.Quaternion();
const _quatRollPitch = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _axisZ = new THREE.Vector3(0, 0, 1);
const _axisY = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();

export function formatLapTime(ms: number | null): string {
  if (ms === null || ms <= 0 || !Number.isFinite(ms)) return '--:--.---';
  const totalSec = ms / 1000;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const millis = Math.floor(ms % 1000);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export const RaceViewport: React.FC<RaceViewportProps> = ({
  mode,
  circuit,
  totalLaps,
  freeRoam = false,
  roomCode = null,
  playerCarSpec,
  playerCustomization,
  settings,
  multiplayerDrivers,
  localClientId,
  wsRef,
  onUpdateSettings,
  onRestart,
  onExit,
  onRaceComplete,
}) => {
  const isFreeRoam = mode === 'freeroam' || freeRoam || totalLaps <= 0;
  const effectiveTotalLaps = isFreeRoam ? 0 : totalLaps;
  const [inviteCopied, setInviteCopied] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const cameraModeRef = useRef<CameraMode>(settings.cameraMode);
  const [cameraModeLabel, setCameraModeLabel] = useState<CameraMode>(settings.cameraMode);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const audioRef = useRef<RaceAudioEngine | null>(null);
  const resetFlagRef = useRef(false);
  const stuntActionRef = useRef<'fly' | 'spin' | 'flip' | 'rollover' | 'cruzflip' | null>(null);
  const stuntActionP2Ref = useRef<'fly' | 'spin' | 'flip' | 'rollover' | 'cruzflip' | null>(null);
  const boostActionRef = useRef(false);
  const orbitRef = useRef({
    active: false,
    yaw: 0,
    pitch: 0.14,
    zoom: 1.0,
    lastX: 0,
    lastY: 0,
  });
  const contextLostRef = useRef(false);
  const [contextLost, setContextLost] = useState(false);
  const [pitBanner, setPitBanner] = useState<string | null>(null);
  const [teleportBanner, setTeleportBanner] = useState(false);

  const compiledTrack = useRef(compileTrack(circuit, 320)).current;

  const [telemetry, setTelemetry] = useState<RaceTelemetry>({
    position: 1,
    totalCars: 1,
    lap: 1,
    totalLaps: effectiveTotalLaps,
    speedKmh: 0,
    rpm: 1400,
    gear: 1,
    fuel: 100,
    tireWear: 100,
    damage: 0,
    inPitLane: false,
    pitProgress: 0,
    fuelBoostCharge: 45,
    boostTimer: 0,
    wallStuntTimer: 0,
    currentLapMs: 0,
    elapsedMs: 0,
    bestLapMs: null,
    lastLapMs: null,
    flag: 'countdown',
    countdownStep: 3,
    drafting: false,
    wrongWay: false,
    leaderboard: [],
    carPositions: [],
  });

  const remotePacketsRef = useRef<Map<string, RemoteCarPacket>>(new Map());
  const multiplayerDriversRef = useRef<MultiplayerDriverInfo[] | undefined>(multiplayerDrivers);
  multiplayerDriversRef.current = multiplayerDrivers;
  const syncLiveRemoteDriversRef = useRef<((drivers: MultiplayerDriverInfo[]) => void) | null>(null);

  useEffect(() => {
    const ws = wsRef?.current;
    if (mode !== 'multiplayer' || !ws) return;

    const handleMsg = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === 'race:car' && msg.packet) {
          const pkt = msg.packet as RemoteCarPacket;
          remotePacketsRef.current.set(pkt.id, pkt);
        }
      } catch {
        // ignore
      }
    };
    ws.addEventListener('message', handleMsg);
    return () => ws.removeEventListener('message', handleMsg);
  }, [mode, wsRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setSettings(settings.volume, settings.muted);
    }
  }, [settings.volume, settings.muted]);

  const cycleCamera = () => {
    const order: CameraMode[] = ['chase', 'far', 'hood', 'bumper'];
    const next = order[(order.indexOf(cameraModeRef.current) + 1) % order.length];
    cameraModeRef.current = next;
    setCameraModeLabel(next);
    onUpdateSettings({ cameraMode: next });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const quality = settingsRef.current.quality;
    const pixelRatioCap = isSoftwareGl
      ? 1
      : quality === 'low'
      ? 1
      : quality === 'medium'
      ? 1.5
      : Math.min(window.devicePixelRatio, 2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && quality !== 'low',
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = circuit.isNight ? 1.25 : 1.08;
    renderer.setPixelRatio(pixelRatioCap);
    renderer.shadowMap.enabled = !isSoftwareGl && quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
      setContextLost(true);
    };
    const onContextRestored = () => {
      contextLostRef.current = false;
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const atmo = getThemeAtmosphere(circuit.theme);
    scene.background = new THREE.Color(atmo.skyColor);
    const farDist = quality === 'low' ? 750 : quality === 'medium' ? 1050 : 1400;
    scene.fog = new THREE.Fog(atmo.fogColor, 260, farDist);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const isSplit = mode === 'splitscreen';
    const initAspect =
      (Math.max(1, container.clientWidth) * (isSplit ? 0.5 : 1)) /
      Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(64, initAspect, 0.25, farDist + 200);
    const camera2 = isSplit
      ? new THREE.PerspectiveCamera(64, initAspect, 0.25, farDist + 200)
      : null;

    const hemi = new THREE.HemisphereLight(atmo.hemiSky, atmo.hemiGround, circuit.isNight ? 0.95 : 0.75);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(atmo.sunColor, atmo.sunIntensity);
    sun.position.set(160, 220, 120);
    if (!isSoftwareGl && quality !== 'low') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
      sun.shadow.camera.near = 20;
      sun.shadow.camera.far = 520;
      const d = 140;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
    }
    scene.add(sun);
    scene.add(sun.target);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const builtTrack = buildTrackScene(compiledTrack, quality, maxAniso);
    scene.add(builtTrack.group);

    const carStates: RaceCarState[] = [];
    const carRigs = new Map<string, CarMeshRig>();

    const addCar = (
      cfg: {
        id: string;
        name: string;
        number: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        pattern: CarCustomization['pattern'];
        doorStyle?: CarCustomization['doorStyle'];
        wheelStyle?: CarCustomization['wheelStyle'];
        customImageUrl?: string | null;
        sponsor: string;
        isPlayer: boolean;
        isPlayer2?: boolean;
        isRemote?: boolean;
        spec: StockCarSpec;
        aiSkill?: number;
      },
      gridIndex: number,
    ) => {
      const state = createCarStateFromSpec(
        {
          id: cfg.id,
          name: cfg.name,
          number: cfg.number,
          color: cfg.primaryColor,
          isPlayer: cfg.isPlayer,
          isPlayer2: cfg.isPlayer2,
          isRemote: cfg.isRemote,
          spec: cfg.spec,
          aiSkill: cfg.aiSkill,
        },
        compiledTrack,
        gridIndex,
      );
      const rig = createStockCarMesh(
        {
          primaryColor: cfg.primaryColor,
          secondaryColor: cfg.secondaryColor,
          accentColor: cfg.accentColor,
          number: cfg.number,
          pattern: cfg.pattern,
          doorStyle: cfg.doorStyle,
          wheelStyle: cfg.wheelStyle,
          customImageUrl: cfg.customImageUrl,
          sponsor: cfg.sponsor,
        },
        maxAniso,
      );
      if (circuit.isNight) {
        rig.headLightMat.emissiveIntensity = 2.6;
      }
      scene.add(rig.root);
      carStates.push(state);
      carRigs.set(state.id, rig);
    };

    syncLiveRemoteDriversRef.current = (drivers: MultiplayerDriverInfo[]) => {
      if (mode !== 'multiplayer') return;
      drivers.forEach((drv) => {
        if (drv.id === localClientId) return;
        if (carRigs.has(drv.id)) return;
        const spec = STOCK_CARS.find((c) => c.id === drv.carId) || STOCK_CARS[0];
        addCar(
          {
            id: drv.id,
            name: drv.name,
            number: drv.number,
            primaryColor: drv.primaryColor,
            secondaryColor: drv.secondaryColor,
            accentColor: drv.accentColor,
            pattern: drv.pattern,
            doorStyle: drv.doorStyle || 'classic',
            wheelStyle: drv.wheelStyle || 'steel-nascar',
            customImageUrl: null,
            sponsor: spec.sponsor,
            isPlayer: false,
            isRemote: true,
            spec,
          },
          carStates.length,
        );
      });
    };

    const diffBase =
      settingsRef.current.aiDifficulty === 'rookie'
        ? 0.84
        : settingsRef.current.aiDifficulty === 'legend'
        ? 0.99
        : 0.92;

    const initDrivers = multiplayerDriversRef.current;
    if (mode === 'timetrial') {
      addCar(
        {
          id: 'player',
          name: settingsRef.current.playerName || 'Piloto NexPlay',
          number: playerCustomization.number,
          primaryColor: playerCustomization.primaryColor,
          secondaryColor: playerCustomization.secondaryColor,
          accentColor: playerCustomization.accentColor,
          pattern: playerCustomization.pattern,
          doorStyle: playerCustomization.doorStyle,
          wheelStyle: playerCustomization.wheelStyle,
          customImageUrl: playerCustomization.customImageUrl,
          sponsor: playerCarSpec.sponsor,
          isPlayer: true,
          spec: playerCarSpec,
        },
        0,
      );
    } else if (mode === 'multiplayer' && initDrivers && initDrivers.length > 0) {
      let gridIdx = 0;
      initDrivers.forEach((drv) => {
        const isMe = drv.id === localClientId;
        const spec = STOCK_CARS.find((c) => c.id === drv.carId) || STOCK_CARS[0];
        addCar(
          {
            id: drv.id,
            name: drv.name,
            number: drv.number,
            primaryColor: drv.primaryColor,
            secondaryColor: drv.secondaryColor,
            accentColor: drv.accentColor,
            pattern: drv.pattern,
            doorStyle: drv.doorStyle || (isMe ? playerCustomization.doorStyle : 'classic'),
            wheelStyle: drv.wheelStyle || (isMe ? playerCustomization.wheelStyle : 'steel-nascar'),
            customImageUrl: isMe ? playerCustomization.customImageUrl : null,
            sponsor: spec.sponsor,
            isPlayer: isMe,
            isRemote: !isMe,
            spec,
          },
          gridIdx++,
        );
      });
      const aiNeeded = Math.max(0, 6 - initDrivers.length);
      for (let i = 0; i < aiNeeded; i++) {
        const aiMeta = AI_DRIVER_NAMES[i % AI_DRIVER_NAMES.length];
        const aiSpec = STOCK_CARS[(i + 1) % STOCK_CARS.length];
        addCar(
          {
            id: `ai-${i}`,
            name: aiMeta.name,
            number: aiMeta.number,
            primaryColor: aiMeta.color,
            secondaryColor: '#111827',
            accentColor: '#F8FAFC',
            pattern: aiSpec.pattern,
            sponsor: aiSpec.sponsor,
            isPlayer: false,
            spec: aiSpec,
            aiSkill: diffBase - 0.02 + (i % 3) * 0.03,
          },
          gridIdx++,
        );
      }
    } else if (mode === 'splitscreen') {
      addCar(
        {
          id: 'player',
          name: `${settingsRef.current.playerName || 'Piloto 1'} (P1)`,
          number: playerCustomization.number,
          primaryColor: playerCustomization.primaryColor,
          secondaryColor: playerCustomization.secondaryColor,
          accentColor: playerCustomization.accentColor,
          pattern: playerCustomization.pattern,
          doorStyle: playerCustomization.doorStyle,
          wheelStyle: playerCustomization.wheelStyle,
          customImageUrl: playerCustomization.customImageUrl,
          sponsor: playerCarSpec.sponsor,
          isPlayer: true,
          spec: playerCarSpec,
        },
        0,
      );
      const p2Spec = STOCK_CARS[1] || playerCarSpec;
      addCar(
        {
          id: 'player2',
          name: 'Piloto 2 (P2)',
          number: '24',
          primaryColor: '#0284C7',
          secondaryColor: '#0F172A',
          accentColor: '#FACC15',
          pattern: 'stripes',
          doorStyle: 'angled',
          wheelStyle: '5-spoke',
          sponsor: p2Spec.sponsor,
          isPlayer: false,
          isPlayer2: true,
          spec: p2Spec,
        },
        1,
      );
      for (let i = 0; i < 6; i++) {
        const aiMeta = AI_DRIVER_NAMES[i % AI_DRIVER_NAMES.length];
        const aiSpec = STOCK_CARS[(i + 2) % STOCK_CARS.length];
        addCar(
          {
            id: `ai-${i}`,
            name: aiMeta.name,
            number: aiMeta.number,
            primaryColor: aiMeta.color,
            secondaryColor: '#0F172A',
            accentColor: '#F8FAFC',
            pattern: aiSpec.pattern,
            sponsor: aiSpec.sponsor,
            isPlayer: false,
            spec: aiSpec,
            aiSkill: THREE.MathUtils.clamp(diffBase + ((i % 3) - 1) * 0.025, 0.8, 1.0),
          },
          i + 2,
        );
      }
    } else {
      const totalOpponents = Math.max(3, Math.min(11, settingsRef.current.aiCount));
      const playerGridPos = Math.min(totalOpponents, 4);
      let aiIdx = 0;
      for (let g = 0; g <= totalOpponents; g++) {
        if (g === playerGridPos) {
          addCar(
            {
              id: 'player',
              name: settingsRef.current.playerName || 'Piloto NexPlay',
              number: playerCustomization.number,
              primaryColor: playerCustomization.primaryColor,
              secondaryColor: playerCustomization.secondaryColor,
              accentColor: playerCustomization.accentColor,
              pattern: playerCustomization.pattern,
              doorStyle: playerCustomization.doorStyle,
              wheelStyle: playerCustomization.wheelStyle,
              customImageUrl: playerCustomization.customImageUrl,
              sponsor: playerCarSpec.sponsor,
              isPlayer: true,
              spec: playerCarSpec,
            },
            g,
          );
        } else {
          const aiMeta = AI_DRIVER_NAMES[aiIdx % AI_DRIVER_NAMES.length];
          const aiSpec = STOCK_CARS[(aiIdx + 1) % STOCK_CARS.length];
          const skillOffset = ((aiIdx % 5) - 2) * 0.022;
          addCar(
            {
              id: `ai-${aiIdx}`,
              name: aiMeta.name,
              number: aiMeta.number,
              primaryColor: aiMeta.color,
              secondaryColor: '#0F172A',
              accentColor: '#F8FAFC',
              pattern: aiSpec.pattern,
              sponsor: aiSpec.sponsor,
              isPlayer: false,
              spec: aiSpec,
              aiSkill: THREE.MathUtils.clamp(diffBase + skillOffset, 0.78, 1.03),
            },
            g,
          );
          aiIdx++;
        }
      }
    }

    const playerCar = carStates.find((c) => c.isPlayer) || carStates[0];
    const player2Car = carStates.find((c) => c.isPlayer2) || null;

    // Smoke Particle Pool (84)
    const SMOKE_COUNT = 84;
    const smokeGeo = new THREE.SphereGeometry(0.45, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const smokeInst = new THREE.InstancedMesh(smokeGeo, smokeMat, SMOKE_COUNT);
    smokeInst.frustumCulled = false;
    scene.add(smokeInst);

    const smokeParticles = Array.from({ length: SMOKE_COUNT }, () => ({
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.6,
    }));
    let smokeCursor = 0;

    // Wreck Sparks Particle Pool (36)
    const SPARK_COUNT = 36;
    const sparkGeo = new THREE.BoxGeometry(0.22, 0.22, 0.45);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, SPARK_COUNT);
    sparkInst.frustumCulled = false;
    scene.add(sparkInst);

    const sparkParticles = Array.from({ length: SPARK_COUNT }, () => ({
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
    }));
    let sparkCursor = 0;

    const spawnSparks = (x: number, y: number, z: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const sp = sparkParticles[sparkCursor];
        sparkCursor = (sparkCursor + 1) % SPARK_COUNT;
        sp.x = x + (Math.random() - 0.5) * 1.2;
        sp.y = y + 0.3;
        sp.z = z + (Math.random() - 0.5) * 1.2;
        sp.vx = (Math.random() - 0.5) * 26;
        sp.vy = 4 + Math.random() * 10;
        sp.vz = (Math.random() - 0.5) * 26;
        sp.life = 0.42 + Math.random() * 0.25;
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const audio = new RaceAudioEngine();
    audio.setSettings(settingsRef.current.volume, settingsRef.current.muted);
    audioRef.current = audio;

    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      audio.init();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keys.add(e.code);
      if (e.code === 'KeyC') cycleCamera();
      else if (e.code === 'KeyR') resetFlagRef.current = true;
      else if (e.code === 'Enter') boostActionRef.current = true;
      else if (e.code === 'Digit1') stuntActionRef.current = 'fly';
      else if (e.code === 'Digit2') stuntActionRef.current = 'spin';
      else if (e.code === 'Digit3') stuntActionRef.current = 'flip';
      else if (e.code === 'Digit4') stuntActionRef.current = 'rollover';
      else if (e.code === 'Digit5') stuntActionRef.current = 'cruzflip';
      else if (e.code === 'Digit6' || e.code === 'Numpad1') stuntActionP2Ref.current = 'fly';
      else if (e.code === 'Digit7' || e.code === 'Numpad2') stuntActionP2Ref.current = 'spin';
      else if (e.code === 'Digit8' || e.code === 'Numpad3') stuntActionP2Ref.current = 'flip';
      else if (e.code === 'Digit9' || e.code === 'Numpad4') stuntActionP2Ref.current = 'rollover';
      else if (e.code === 'Digit0' || e.code === 'Numpad5') stuntActionP2Ref.current = 'cruzflip';
      else if (e.code === 'Escape' || e.code === 'KeyP') setPaused((prev) => !prev);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Right-click drag to orbit camera around the car
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        orbitRef.current.active = true;
        orbitRef.current.lastX = e.clientX;
        orbitRef.current.lastY = e.clientY;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!orbitRef.current.active) return;
      const dx = e.clientX - orbitRef.current.lastX;
      const dy = e.clientY - orbitRef.current.lastY;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
      orbitRef.current.yaw -= dx * 0.0065;
      orbitRef.current.pitch = THREE.MathUtils.clamp(
        orbitRef.current.pitch + dy * 0.005,
        -0.06,
        0.75,
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 2) {
        orbitRef.current.active = false;
      }
    };
    const onWheel = (e: WheelEvent) => {
      orbitRef.current.zoom = THREE.MathUtils.clamp(
        orbitRef.current.zoom + e.deltaY * 0.0008,
        0.65,
        1.6,
      );
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      const asp = (w * (isSplit ? 0.5 : 1)) / h;
      camera.aspect = asp;
      camera.updateProjectionMatrix();
      if (camera2) {
        camera2.aspect = asp;
        camera2.updateProjectionMatrix();
      }
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    camera.position.set(
      playerCar.x - Math.sin(playerCar.heading) * 9,
      playerCar.y + 3.4,
      playerCar.z - Math.cos(playerCar.heading) * 9,
    );
    camera.lookAt(playerCar.x, playerCar.y + 1.0, playerCar.z);
    if (camera2 && player2Car) {
      camera2.position.set(
        player2Car.x - Math.sin(player2Car.heading) * 9,
        player2Car.y + 3.4,
        player2Car.z - Math.cos(player2Car.heading) * 9,
      );
      camera2.lookAt(player2Car.x, player2Car.y + 1.0, player2Car.z);
    }

    const clock = new THREE.Clock();
    let countdownTimer = 3.2;
    let lastBeepStep = 4;
    let raceLive = false;
    let raceElapsedMs = 0;
    let finishCounter = 0;
    let yellowTimer = 0;
    let shakePower = 0;
    let pitGunPlaying = false;
    let hudAccum = 0;
    let netAccum = 0;
    let smokeAccum = 0;
    let flashAccum = 0;
    let raceFinishedReported = false;
    let chaseCamYaw = playerCar.heading;
    let chaseCamYaw2 = player2Car ? player2Car.heading : 0;
    let frameId = 0;
    let disposed = false;

    const updateGantryLights = (step: number) => {
      const bulbs = builtTrack.lightBulbs;
      if (bulbs.length < 4) return;
      bulbs.forEach((b, i) => {
        const mat = b.material as THREE.MeshStandardMaterial;
        if (step === 0) {
          mat.color.setHex(0x22c55e);
          mat.emissive.setHex(0x22c55e);
          mat.emissiveIntensity = 2.4;
        } else {
          const lit = 3 - step >= i;
          mat.color.setHex(lit ? 0xef4444 : 0x334155);
          mat.emissive.setHex(lit ? 0xef4444 : 0x0f172a);
          mat.emissiveIntensity = lit ? 2.2 : 0.2;
        }
      });
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(0.05, rawDt);

      if (!pausedRef.current && !contextLostRef.current) {
        let countdownStep = 0;
        if (!raceLive) {
          countdownTimer -= dt;
          countdownStep = Math.max(0, Math.ceil(countdownTimer));
          if (countdownStep < lastBeepStep) {
            lastBeepStep = countdownStep;
            updateGantryLights(countdownStep);
            if (countdownStep >= 1 && countdownStep <= 3) audio.playCountdownBeep(false);
            else if (countdownStep === 0) {
              audio.playCountdownBeep(true);
              raceLive = true;
            }
          }
        } else {
          raceElapsedMs += dt * 1000;
        }

        if (yellowTimer > 0) yellowTimer = Math.max(0, yellowTimer - dt);
        if (shakePower > 0) shakePower = Math.max(0, shakePower - dt * 2.8);

        if (resetFlagRef.current) {
          resetFlagRef.current = false;
          resetCarToTrack(playerCar, compiledTrack);
          if (player2Car) resetCarToTrack(player2Car, compiledTrack);
        }

        if (boostActionRef.current) {
          boostActionRef.current = false;
          if (raceLive && activateFuelBoost(playerCar)) {
            audio.playCountdownBeep(true);
            shakePower = Math.max(shakePower, 0.35);
          }
        }

        if (stuntActionRef.current) {
          const kind = stuntActionRef.current;
          stuntActionRef.current = null;
          if (playerCar.wallStuntTimer > 0) {
            triggerWallStunt(playerCar, kind);
            audio.playImpact(0.85);
            spawnSparks(playerCar.x, playerCar.y, playerCar.z, 18);
            shakePower = Math.max(shakePower, 0.85);
          }
        }

        if (stuntActionP2Ref.current) {
          const kind = stuntActionP2Ref.current;
          stuntActionP2Ref.current = null;
          if (player2Car && player2Car.wallStuntTimer > 0) {
            triggerWallStunt(player2Car, kind);
            audio.playImpact(0.85);
            spawnSparks(player2Car.x, player2Car.y, player2Car.z, 18);
            shakePower = Math.max(shakePower, 0.75);
          }
        }

        const playerInput: CarInput = isSplit
          ? {
              throttle: keys.has('KeyW'),
              brake: keys.has('KeyS'),
              left: keys.has('KeyA'),
              right: keys.has('KeyD'),
              handbrake: keys.has('Space'),
            }
          : {
              throttle: keys.has('KeyW') || keys.has('ArrowUp'),
              brake: keys.has('KeyS') || keys.has('ArrowDown'),
              left: keys.has('KeyA') || keys.has('ArrowLeft'),
              right: keys.has('KeyD') || keys.has('ArrowRight'),
              handbrake: keys.has('Space'),
            };

        const player2Input: CarInput = {
          throttle: keys.has('ArrowUp'),
          brake: keys.has('ArrowDown'),
          left: keys.has('ArrowLeft'),
          right: keys.has('ArrowRight'),
          handbrake: keys.has('ShiftRight') || keys.has('Slash'),
        };

        updateDrafting(carStates, compiledTrack.totalLength);

        for (const car of carStates) {
          if (car.isRemote) {
            const pkt = remotePacketsRef.current.get(car.id);
            if (pkt) {
              car.x = THREE.MathUtils.lerp(car.x, pkt.x, Math.min(1, dt * 14));
              car.y = THREE.MathUtils.lerp(car.y, pkt.y, Math.min(1, dt * 14));
              car.z = THREE.MathUtils.lerp(car.z, pkt.z, Math.min(1, dt * 14));
              car.heading = pkt.heading;
              car.speed = pkt.speed;
              car.lap = pkt.lap;
              car.sNorm = pkt.sNorm;
              car.totalProgress = pkt.lap - 1 + pkt.sNorm;
              car.finished = pkt.finished;
              car.bestLapMs = pkt.bestLapMs;
              car.totalTimeMs = pkt.totalTimeMs;
            }
            continue;
          }

          const input = car.isPlayer
            ? car.finished
              ? computeAiInput(car, carStates, compiledTrack, dt)
              : playerInput
            : car.isPlayer2
            ? car.finished
              ? computeAiInput(car, carStates, compiledTrack, dt)
              : player2Input
            : computeAiInput(car, carStates, compiledTrack, dt);

          const ev = stepCarPhysics(
            car,
            input,
            compiledTrack,
            dt,
            raceElapsedMs,
            effectiveTotalLaps,
            raceLive,
          );

          if (car.isPlayer) {
            if (car.pitProgress > 0 && !pitGunPlaying) {
              pitGunPlaying = true;
              audio.playPitWheelGun();
            } else if (car.pitProgress === 0) {
              pitGunPlaying = false;
            }

            if (ev.pitServiced) {
              audio.playLapChime();
              setPitBanner('¡PARADA EN PITS COMPLETA! GASOLINA Y RUEDAS AL 100%');
              setTimeout(() => setPitBanner(null), 2800);
            }

            if (ev.teleported) {
              audio.playTeleport();
              spawnSparks(car.x, car.y + 0.5, car.z, 24);
              shakePower = Math.max(shakePower, 0.55);
              setTeleportBanner(true);
              setTimeout(() => setTeleportBanner(false), 2400);
            }

            if (ev.scrapingRoof && Math.random() < 0.45) {
              spawnSparks(car.x, Math.max(0.15, car.y - 0.25), car.z, 3);
            }

            if (ev.wallHitStrength > 0.25) {
              audio.playImpact(ev.wallHitStrength);
              spawnSparks(car.x, car.y, car.z, Math.ceil(ev.wallHitStrength * 14));
              if (ev.wallHitStrength > 0.5) {
                yellowTimer = 3.0;
                shakePower = Math.min(1, ev.wallHitStrength * 0.9);
              }
            }
            if (ev.completedLap) audio.playLapChime();
            if (ev.justFinished && !raceFinishedReported) {
              car.finishOrder = ++finishCounter;
              raceFinishedReported = true;
              const sorted = [...carStates].sort((a, b) => {
                if (a.finished && b.finished) return a.totalTimeMs - b.totalTimeMs;
                return b.totalProgress - a.totalProgress;
              });
              const standings: LeaderboardEntry[] = sorted.map((c, idx) => {
                const leaderProg = sorted[0].totalProgress;
                const gapMeters = Math.max(0, (leaderProg - c.totalProgress) * compiledTrack.totalLength);
                const estTimeMs = c.finished
                  ? c.totalTimeMs
                  : raceElapsedMs +
                    ((Math.max(0, totalLaps - c.totalProgress) * compiledTrack.totalLength) /
                      Math.max(40, c.maxSpeedMs * 0.86)) *
                      1000;
                return {
                  id: c.id,
                  name: c.name,
                  number: c.number,
                  color: c.color,
                  isPlayer: c.isPlayer,
                  isRemote: c.isRemote,
                  position: idx + 1,
                  lap: Math.min(totalLaps, c.lap),
                  progress: c.totalProgress,
                  speedKmh: Math.round(Math.abs(c.speed) * 3.6),
                  bestLapMs: c.bestLapMs,
                  lastLapMs: c.lastLapMs,
                  totalTimeMs: estTimeMs,
                  finished: c.finished,
                  gapSeconds: idx === 0 ? 0 : gapMeters / Math.max(25, Math.abs(c.speed)),
                };
              });

              const pPos = standings.find((s) => s.isPlayer)?.position || 1;
              const ptsTable = [40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25];
              const ptsEarned = ptsTable[Math.min(ptsTable.length - 1, pPos - 1)] || 20;

              window.setTimeout(() => {
                onRaceComplete({
                  mode,
                  circuitId: circuit.id,
                  circuitName: circuit.name,
                  totalLaps,
                  standings,
                  playerPosition: pPos,
                  playerBestLapMs: playerCar.bestLapMs,
                  playerTotalTimeMs: playerCar.totalTimeMs,
                  pointsEarned: ptsEarned,
                });
              }, 1300);
            }
          } else if (car.isPlayer2) {
            if (ev.teleported) {
              audio.playTeleport();
              spawnSparks(car.x, car.y + 0.5, car.z, 24);
              shakePower = Math.max(shakePower, 0.5);
              setTeleportBanner(true);
              setTimeout(() => setTeleportBanner(false), 2400);
            }
            if (ev.scrapingRoof && Math.random() < 0.45) {
              spawnSparks(car.x, Math.max(0.15, car.y - 0.25), car.z, 3);
            }
            if (ev.wallHitStrength > 0.25) {
              audio.playImpact(ev.wallHitStrength);
              spawnSparks(car.x, car.y, car.z, Math.ceil(ev.wallHitStrength * 14));
            }
            if (ev.completedLap) audio.playLapChime();
            if (ev.justFinished) {
              car.finishOrder = ++finishCounter;
            }
          } else if (ev.justFinished) {
            car.finishOrder = ++finishCounter;
          }
        }

        // Heavy Car-to-Car NASCAR Wrecks
        const crash = resolveCarCollisions(carStates);
        if (crash.maxImpact > 0.28) {
          audio.playImpact(crash.maxImpact);
          spawnSparks(crash.wreckX, crash.wreckY, crash.wreckZ, Math.ceil(crash.maxImpact * 18));
          if (crash.maxImpact > 0.55) {
            yellowTimer = 3.2;
            shakePower = Math.min(1, crash.maxImpact);
          }
        }

        // Sync 3D Car Meshes & Damage visuals
        for (const car of carStates) {
          const rig = carRigs.get(car.id);
          if (!rig) continue;

          rig.root.position.set(car.x, car.y, car.z);
          _quatYaw.setFromAxisAngle(_axisY, car.heading);
          _euler.set(car.bodyPitch + car.stuntPitch, 0, car.bodyRoll + car.stuntRoll);
          _quatRollPitch.setFromEuler(_euler);
          _quatBank.setFromAxisAngle(_axisZ, -car.bankAngle);

          rig.root.quaternion.copy(_quatYaw).multiply(_quatBank);
          rig.bodyGroup.quaternion.copy(_quatRollPitch);

          rig.frontLeftSteer.rotation.y = car.steerAngle;
          rig.frontRightSteer.rotation.y = car.steerAngle;
          const wheelSpin = (car.speed / 0.35) * dt;
          for (const w of rig.wheels) {
            w.rotation.x += wheelSpin;
          }

          const isBraking = car.isPlayer
            ? playerInput.brake
            : car.isPlayer2
            ? player2Input.brake
            : false;
          rig.tailLightMat.emissiveIntensity = isBraking ? 2.5 : 0.45;
          rig.setDamageVisual(car.damage / 100);
        }

        // Smoke Particles (dual rear-tire drift smoke + heavy engine damage / pit smoke)
        smokeAccum += dt;
        if (smokeAccum > 0.04) {
          smokeAccum = 0;
          for (const car of carStates) {
            const damagedSmoke = car.damage > 45 && Math.random() < 0.65;
            const pitServiceSmoke = car.pitProgress > 0 && Math.random() < 0.7;
            const driftSmoke = car.slipAmount > 0.25 && Math.abs(car.speed) > 8 && car.airHeight < 0.4;
            if (driftSmoke) {
              const cFwdX = Math.sin(car.heading);
              const cFwdZ = Math.cos(car.heading);
              const cRightX = -cFwdZ;
              const cRightZ = cFwdX;
              for (let side = -1; side <= 1; side += 2) {
                const p = smokeParticles[smokeCursor];
                smokeCursor = (smokeCursor + 1) % SMOKE_COUNT;
                const latOff = side * 0.88;
                p.x = car.x - cFwdX * 1.65 + cRightX * latOff + (Math.random() - 0.5) * 0.28;
                p.y = car.y + 0.28;
                p.z = car.z - cFwdZ * 1.65 + cRightZ * latOff + (Math.random() - 0.5) * 0.28;
                p.vx = -cFwdX * 2.2 + (Math.random() - 0.5) * 2.1;
                p.vy = 1.4 + Math.random() * 1.2;
                p.vz = -cFwdZ * 2.2 + (Math.random() - 0.5) * 2.1;
                p.life = 0.62;
                p.maxLife = 0.62;
              }
            }
            if (damagedSmoke || pitServiceSmoke) {
              const p = smokeParticles[smokeCursor];
              smokeCursor = (smokeCursor + 1) % SMOKE_COUNT;
              const offsetFwd = damagedSmoke ? 1.5 : 0.6;
              p.x = car.x + Math.sin(car.heading) * offsetFwd + (Math.random() - 0.5) * 1.1;
              p.y = car.y + (damagedSmoke ? 0.9 : 0.35);
              p.z = car.z + Math.cos(car.heading) * offsetFwd + (Math.random() - 0.5) * 1.1;
              p.vx = (Math.random() - 0.5) * 2.8;
              p.vy = 1.6 + Math.random() * 1.4;
              p.vz = (Math.random() - 0.5) * 2.8;
              p.life = 0.6;
              p.maxLife = 0.6;
            }
          }
        }
        for (let i = 0; i < SMOKE_COUNT; i++) {
          const p = smokeParticles[i];
          if (p.life > 0) {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            const s = 0.6 + (1 - p.life / p.maxLife) * 1.9;
            _dummy.position.set(p.x, p.y, p.z);
            _dummy.scale.set(s, s, s);
          } else {
            _dummy.position.set(0, -100, 0);
            _dummy.scale.set(0.01, 0.01, 0.01);
          }
          _dummy.updateMatrix();
          smokeInst.setMatrixAt(i, _dummy.matrix);
        }
        smokeInst.instanceMatrix.needsUpdate = true;

        // Sparks Particles
        for (let i = 0; i < SPARK_COUNT; i++) {
          const sp = sparkParticles[i];
          if (sp.life > 0) {
            sp.life -= dt;
            sp.vy -= 22 * dt;
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.z += sp.vz * dt;
            _dummy.position.set(sp.x, sp.y, sp.z);
            _dummy.scale.setScalar(0.9);
          } else {
            _dummy.position.set(0, -100, 0);
            _dummy.scale.setScalar(0.01);
          }
          _dummy.updateMatrix();
          sparkInst.setMatrixAt(i, _dummy.matrix);
        }
        sparkInst.instanceMatrix.needsUpdate = true;

        // Night Stadium Camera Flashes
        if (builtTrack.cameraFlashMesh && builtTrack.cameraFlashPositions.length > 0) {
          flashAccum += dt;
          if (flashAccum > 0.09) {
            flashAccum = 0;
            const pts = builtTrack.cameraFlashPositions;
            for (let i = 0; i < pts.length; i++) {
              _dummy.position.copy(pts[i]);
              _dummy.scale.setScalar(Math.random() < 0.07 ? 1.4 : 0.01);
              _dummy.updateMatrix();
              builtTrack.cameraFlashMesh.setMatrixAt(i, _dummy.matrix);
            }
            builtTrack.cameraFlashMesh.instanceMatrix.needsUpdate = true;
          }
        }

        if (sun.castShadow) {
          sun.position.set(playerCar.x + 80, playerCar.y + 130, playerCar.z + 60);
          sun.target.position.set(playerCar.x, playerCar.y, playerCar.z);
        }

        // Camera Choreography + Right-Click Orbit + Wreck Shake + Split-Screen Camera 2
        const camMode = cameraModeRef.current;
        const speedKmh = Math.abs(playerCar.speed) * 3.6;
        const targetFov =
          camMode === 'bumper' || camMode === 'hood'
            ? 70 + Math.min(18, speedKmh / 24)
            : 62 + Math.min(20, speedKmh / 22) + (playerCar.boostTimer > 0 ? 7 : 0);
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5, dt);
        camera.updateProjectionMatrix();

        const orbit = orbitRef.current;
        if (!orbit.active) {
          orbit.yaw = THREE.MathUtils.damp(orbit.yaw, 0, 3.5, dt);
          orbit.pitch = THREE.MathUtils.damp(orbit.pitch, 0.14, 3.5, dt);
        }

        const fwdX = Math.sin(playerCar.heading);
        const fwdZ = Math.cos(playerCar.heading);
        const shakeX = (Math.random() - 0.5) * shakePower * 0.65;
        const shakeY = (Math.random() - 0.5) * shakePower * 0.45;
        const userOrbitActive = orbit.active || Math.abs(orbit.yaw) > 0.02;

        if (!userOrbitActive && camMode === 'hood') {
          _camDesired.set(
            playerCar.x + fwdX * 0.55 + shakeX,
            playerCar.y + 1.48 + shakeY,
            playerCar.z + fwdZ * 0.55,
          );
          _lookDesired.set(playerCar.x + fwdX * 26, playerCar.y + 1.1, playerCar.z + fwdZ * 26);
          camera.position.copy(_camDesired);
          camera.lookAt(_lookDesired);
        } else if (!userOrbitActive && camMode === 'bumper') {
          _camDesired.set(
            playerCar.x + fwdX * 2.55 + shakeX,
            playerCar.y + 0.72 + shakeY,
            playerCar.z + fwdZ * 2.55,
          );
          _lookDesired.set(playerCar.x + fwdX * 30, playerCar.y + 0.65, playerCar.z + fwdZ * 30);
          camera.position.copy(_camDesired);
          camera.lookAt(_lookDesired);
        } else {
          const baseDist = (camMode === 'far' ? 11.2 : 7.8) * orbit.zoom;
          // Blend travel vector with heading so sideways drift angles are clearly visible in 3D
          const velMag = Math.hypot(playerCar.vx, playerCar.vz);
          let targetChaseYaw = playerCar.heading;
          if (velMag > 6.5 && playerCar.speed > 4.0) {
            const travelYaw = Math.atan2(playerCar.vx, playerCar.vz);
            let slipDiff = travelYaw - playerCar.heading;
            while (slipDiff > Math.PI) slipDiff -= Math.PI * 2;
            while (slipDiff < -Math.PI) slipDiff += Math.PI * 2;
            targetChaseYaw = playerCar.heading + slipDiff * 0.82;
          }
          let camDiff = targetChaseYaw - chaseCamYaw;
          while (camDiff > Math.PI) camDiff -= Math.PI * 2;
          while (camDiff < -Math.PI) camDiff += Math.PI * 2;
          chaseCamYaw += camDiff * (1 - Math.exp(-8.8 * dt));

          const viewYaw = (orbit.active ? playerCar.heading : chaseCamYaw) + orbit.yaw;
          const vFwdX = Math.sin(viewYaw);
          const vFwdZ = Math.cos(viewYaw);
          const height =
            (camMode === 'far' ? 4.3 : 2.95) + Math.sin(orbit.pitch) * baseDist * 0.65;
          const horizDist = baseDist * Math.cos(Math.max(0, orbit.pitch * 0.5));

          _camDesired.set(
            playerCar.x - vFwdX * horizDist + shakeX,
            playerCar.y + height + shakeY,
            playerCar.z - vFwdZ * horizDist,
          );
          const dampSpeed = orbit.active ? 18 : 11;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camDesired.x, dampSpeed, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camDesired.y, dampSpeed, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camDesired.z, dampSpeed, dt);

          _lookDesired.set(
            playerCar.x + (orbit.active ? 0 : vFwdX * 9),
            playerCar.y + 1.15,
            playerCar.z + (orbit.active ? 0 : vFwdZ * 9),
          );
          _camTarget.x = THREE.MathUtils.damp(_camTarget.x, _lookDesired.x, 14, dt);
          _camTarget.y = THREE.MathUtils.damp(_camTarget.y, _lookDesired.y, 14, dt);
          _camTarget.z = THREE.MathUtils.damp(_camTarget.z, _lookDesired.z, 14, dt);
          camera.lookAt(_camTarget);
        }

        // Split-Screen Camera 2 (follows Jugador 2 with velocity-blended drift angle)
        if (camera2 && player2Car) {
          const p2VelMag = Math.hypot(player2Car.vx, player2Car.vz);
          let p2TargetYaw = player2Car.heading;
          if (p2VelMag > 6.5 && player2Car.speed > 4.0) {
            const p2Travel = Math.atan2(player2Car.vx, player2Car.vz);
            let p2Slip = p2Travel - player2Car.heading;
            while (p2Slip > Math.PI) p2Slip -= Math.PI * 2;
            while (p2Slip < -Math.PI) p2Slip += Math.PI * 2;
            p2TargetYaw = player2Car.heading + p2Slip * 0.82;
          }
          let p2CamDiff = p2TargetYaw - chaseCamYaw2;
          while (p2CamDiff > Math.PI) p2CamDiff -= Math.PI * 2;
          while (p2CamDiff < -Math.PI) p2CamDiff += Math.PI * 2;
          chaseCamYaw2 += p2CamDiff * (1 - Math.exp(-8.8 * dt));

          const p2FwdX = Math.sin(chaseCamYaw2);
          const p2FwdZ = Math.cos(chaseCamYaw2);
          const p2DesiredX = player2Car.x - p2FwdX * 8.2;
          const p2DesiredY = player2Car.y + 3.1;
          const p2DesiredZ = player2Car.z - p2FwdZ * 8.2;
          camera2.position.x = THREE.MathUtils.damp(camera2.position.x, p2DesiredX, 11, dt);
          camera2.position.y = THREE.MathUtils.damp(camera2.position.y, p2DesiredY, 7.5, dt);
          camera2.position.z = THREE.MathUtils.damp(camera2.position.z, p2DesiredZ, 11, dt);
          _camTarget2.x = THREE.MathUtils.damp(_camTarget2.x, player2Car.x + p2FwdX * 10, 12, dt);
          _camTarget2.y = THREE.MathUtils.damp(_camTarget2.y, player2Car.y + 1.15, 12, dt);
          _camTarget2.z = THREE.MathUtils.damp(_camTarget2.z, player2Car.z + p2FwdZ * 10, 12, dt);
          camera2.lookAt(_camTarget2);
        }

        audio.updateEngine(playerCar.rpm, playerInput.throttle ? 1 : 0, playerCar.slipAmount);

        netAccum += dt;
        if (mode === 'multiplayer' && wsRef?.current?.readyState === WebSocket.OPEN && netAccum >= 0.05) {
          netAccum = 0;
          wsRef.current.send(
            JSON.stringify({
              type: 'race:telemetry',
              packet: {
                x: playerCar.x,
                y: playerCar.y,
                z: playerCar.z,
                heading: playerCar.heading,
                speed: playerCar.speed,
                lap: playerCar.lap,
                sNorm: playerCar.sNorm,
                finished: playerCar.finished,
                bestLapMs: playerCar.bestLapMs,
                totalTimeMs: playerCar.totalTimeMs,
              },
            }),
          );
        }

        hudAccum += dt;
        if (hudAccum >= 0.066) {
          hudAccum = 0;
          const sorted = [...carStates].sort((a, b) => {
            if (a.finished && b.finished) return a.totalTimeMs - b.totalTimeMs;
            return b.totalProgress - a.totalProgress;
          });
          const leaderProg = sorted[0]?.totalProgress ?? 0;

          const leaderboard: LeaderboardEntry[] = sorted.map((c, idx) => ({
            id: c.id,
            name: c.name,
            number: c.number,
            color: c.color,
            isPlayer: c.isPlayer,
            isRemote: c.isRemote,
            position: idx + 1,
            lap: Math.min(totalLaps, c.lap),
            progress: c.totalProgress,
            speedKmh: Math.round(Math.abs(c.speed) * 3.6),
            bestLapMs: c.bestLapMs,
            lastLapMs: c.lastLapMs,
            totalTimeMs: c.totalTimeMs,
            finished: c.finished,
            inPitLane: c.inPitLane,
            gapSeconds:
              idx === 0
                ? 0
                : Math.max(
                    0,
                    ((leaderProg - c.totalProgress) * compiledTrack.totalLength) /
                      Math.max(25, Math.abs(c.speed)),
                  ),
          }));

          const playerRank = leaderboard.find((l) => l.isPlayer)?.position || 1;
          const p2Rank = player2Car
            ? leaderboard.find((l) => l.id === player2Car.id)?.position || 2
            : 2;

          let flag: FlagState = 'green';
          if (!raceLive) flag = 'countdown';
          else if (!isFreeRoam && playerCar.finished) flag = 'checkered';
          else if (playerCar.wrongWay || yellowTimer > 0) flag = 'yellow';
          else if (!isFreeRoam && effectiveTotalLaps > 0 && playerCar.lap >= effectiveTotalLaps) flag = 'white';

          setTelemetry({
            position: playerRank,
            totalCars: carStates.length,
            lap: effectiveTotalLaps > 0 ? Math.min(effectiveTotalLaps, playerCar.lap) : playerCar.lap,
            totalLaps: effectiveTotalLaps,
            speedKmh: Math.round(Math.abs(playerCar.speed) * 3.6),
            rpm: Math.round(playerCar.rpm),
            gear: playerCar.gear,
            fuel: Math.round(playerCar.fuel),
            tireWear: Math.round(playerCar.tireWear),
            damage: Math.round(playerCar.damage),
            inPitLane: playerCar.inPitLane,
            pitProgress: playerCar.pitProgress,
            fuelBoostCharge: Math.round(playerCar.fuelBoostCharge),
            boostTimer: Number(playerCar.boostTimer.toFixed(1)),
            wallStuntTimer: Number(playerCar.wallStuntTimer.toFixed(1)),
            p2: player2Car
              ? {
                  position: p2Rank,
                  lap: effectiveTotalLaps > 0 ? Math.min(effectiveTotalLaps, player2Car.lap) : player2Car.lap,
                  speedKmh: Math.round(Math.abs(player2Car.speed) * 3.6),
                  gear: player2Car.gear,
                  fuel: Math.round(player2Car.fuel),
                  wallStuntTimer: Number(player2Car.wallStuntTimer.toFixed(1)),
                }
              : undefined,
            currentLapMs: raceLive ? Math.max(0, raceElapsedMs - playerCar.lapStartMs) : 0,
            elapsedMs: raceLive ? raceElapsedMs : 0,
            bestLapMs: playerCar.bestLapMs,
            lastLapMs: playerCar.lastLapMs,
            flag,
            countdownStep,
            drafting: playerCar.drafting,
            wrongWay: playerCar.wrongWay,
            leaderboard: leaderboard.slice(0, 6),
            carPositions: carStates.map((c) => ({
              id: c.id,
              x: c.x,
              z: c.z,
              isPlayer: c.isPlayer || Boolean(c.isPlayer2),
              color: c.color,
            })),
          });
        }
      }

      if (isSplit && camera2 && container) {
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        const halfW = Math.floor(w * 0.5);
        renderer.setScissorTest(true);

        renderer.setViewport(0, 0, halfW, h);
        renderer.setScissor(0, 0, halfW, h);
        renderer.render(scene, camera);

        renderer.setViewport(halfW, 0, w - halfW, h);
        renderer.setScissor(halfW, 0, w - halfW, h);
        renderer.render(scene, camera2);

        renderer.setScissorTest(false);
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      audio.dispose();
      builtTrack.dispose();
      carRigs.forEach((r) => r.dispose());
      smokeGeo.dispose();
      smokeMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      syncLiveRemoteDriversRef.current = null;
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    circuit,
    compiledTrack,
    effectiveTotalLaps,
    isFreeRoam,
    localClientId,
    mode,
    playerCarSpec,
    playerCustomization,
  ]);

  useEffect(() => {
    if (multiplayerDrivers && syncLiveRemoteDriversRef.current) {
      syncLiveRemoteDriversRef.current(multiplayerDrivers);
    }
  }, [multiplayerDrivers]);

  const displaySpeed =
    settings.units === 'mph'
      ? Math.round(telemetry.speedKmh * 0.621371)
      : telemetry.speedKmh;

  const unitLabel = settings.units === 'mph' ? 'MPH' : 'KM/H';
  const rpmPct = Math.min(100, Math.max(0, (telemetry.rpm / 9000) * 100));

  const { minX, maxX, minZ, maxZ } = compiledTrack.bounds;
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const mapScale = 76 / Math.max(spanX, spanZ);
  const mapOffX = (100 - spanX * mapScale) * 0.5;
  const mapOffZ = (100 - spanZ * mapScale) * 0.5;

  const pitMinimapData = useMemo(() => {
    const samples = compiledTrack.samples;
    const halfW = compiledTrack.spec.trackWidth * 0.5;
    const pts: string[] = [];
    // Walk from sNorm 0.80 through 1.0 -> 0.0 -> 0.20 continuously
    const startIdx = Math.floor(0.80 * samples.length);
    const endIdx = Math.floor(0.20 * samples.length) + samples.length;
    for (let k = startIdx; k <= endIdx; k += 3) {
      const s = samples[k % samples.length];
      const p = s.position.clone().addScaledVector(s.right, -halfW - 6.5);
      const x = mapOffX + (p.x - minX) * mapScale;
      const y = mapOffZ + (p.z - minZ) * mapScale;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const stallSample = samples[0];
    const stallWorld = stallSample.position.clone().addScaledVector(stallSample.right, -halfW - 6.5);
    return {
      points: pts.join(' '),
      stallX: mapOffX + (stallWorld.x - minX) * mapScale,
      stallY: mapOffZ + (stallWorld.z - minZ) * mapScale,
    };
  }, [compiledTrack, mapOffX, mapOffZ, mapScale, maxX, maxZ, minX, minZ]);

  const flagConfig: Record<FlagState, { label: string; bg: string; text: string }> = {
    countdown: { label: 'PREPARADO', bg: 'bg-amber-500', text: 'text-slate-950' },
    green: { label: 'BANDERA VERDE', bg: 'bg-emerald-500', text: 'text-slate-950' },
    yellow: { label: 'PRECAUCIÓN · CHOQUE', bg: 'bg-yellow-400', text: 'text-slate-950' },
    white: { label: 'ÚLTIMA VUELTA', bg: 'bg-slate-100', text: 'text-slate-950' },
    checkered: { label: 'BANDERA A CUADROS', bg: 'bg-white', text: 'text-slate-950' },
  };

  const currentFlag = flagConfig[telemetry.flag];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#090B10] select-none"
      onClick={() => audioRef.current?.init()}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {telemetry.speedKmh > 235 && !paused && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at center, transparent 58%, rgba(56,189,248,0.12) 100%)',
          }}
        />
      )}

      {contextLost && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#090B10]/95">
          <div className="text-center p-6 rounded-xl border border-white/10 bg-[#111622]">
            <p className="font-display text-2xl font-bold text-white mb-2">
              Contexto Gráfico Reiniciándose
            </p>
            <p className="text-sm text-slate-400">Recuperando renderizado 3D de Aysén NASCAR...</p>
          </div>
        </div>
      )}

      {/* TOP-LEFT HUD */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-stretch gap-2">
          {mode !== 'timetrial' && (
            <div className="bg-[#0B0F19]/90 border border-white/10 rounded-lg px-3.5 py-2 flex flex-col justify-center">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                POSICIÓN
              </span>
              <span className="font-display text-3xl font-extrabold leading-none text-white font-mono-tabular">
                {telemetry.position}
                <span className="text-base text-slate-400 font-normal">/{telemetry.totalCars}</span>
              </span>
            </div>
          )}

          <div className="bg-[#0B0F19]/90 border border-white/10 rounded-lg px-3.5 py-2 flex flex-col justify-center">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400">
              {isFreeRoam ? 'MODO LIBRE' : 'VUELTA'}
            </span>
            {isFreeRoam ? (
              <span className="font-display text-2xl font-extrabold leading-none text-sky-400 flex items-center gap-1.5">
                <InfinityIcon className="w-6 h-6" />
                <span>LIBRE</span>
              </span>
            ) : (
              <span className="font-display text-3xl font-extrabold leading-none text-white font-mono-tabular">
                {telemetry.lap}
                <span className="text-base text-slate-400 font-normal">/{telemetry.totalLaps}</span>
              </span>
            )}
          </div>

          <div
            className={`rounded-lg px-3 py-2 flex items-center gap-2 font-display font-bold text-sm tracking-wide ${currentFlag.bg} ${currentFlag.text}`}
          >
            <Flag className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">
              {isFreeRoam && telemetry.flag === 'green' ? 'TIEMPO INFINITO' : currentFlag.label}
            </span>
          </div>

          {roomCode && (
            <div className="bg-[#0B0F19]/92 border border-sky-400/40 rounded-lg px-3 py-2 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-sky-400 tracking-wider">CÓDIGO AMIGOS</span>
              <span className="font-mono-tabular text-lg font-extrabold leading-none text-white">
                {roomCode}
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#0B0F19]/88 border border-white/10 rounded-lg px-3.5 py-2 flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">
              {isFreeRoam ? 'TIEMPO SESIÓN' : 'ACTUAL'}
            </span>
            <span className="font-mono-tabular font-bold text-white text-sm">
              {formatLapTime(isFreeRoam ? telemetry.elapsedMs : telemetry.currentLapMs)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">MEJOR VUELTA</span>
            <span className="font-mono-tabular font-bold text-emerald-400 text-sm">
              {formatLapTime(telemetry.bestLapMs)}
            </span>
          </div>
          {mode === 'timetrial' && (
            <div>
              <span className="text-slate-400 block text-[10px]">RÉCORD PISTA</span>
              <span className="font-mono-tabular font-bold text-amber-400 text-sm">
                {formatLapTime(circuit.recordLapMs)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CENTER-TOP: Semaphore, Pit Stop, Crash & Draft Notifications */}
      <div className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {telemetry.flag === 'countdown' && (
          <div className="bg-[#0B0F19]/95 border border-white/15 rounded-xl px-6 py-3 flex flex-col items-center gap-2 shadow-xl">
            <div className="flex items-center gap-3">
              {[3, 2, 1].map((step) => (
                <div
                  key={step}
                  className={`w-6 h-6 rounded-full border border-white/20 ${
                    telemetry.countdownStep <= step && telemetry.countdownStep > 0
                      ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.85)]'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
              <div
                className={`w-6 h-6 rounded-full border border-white/20 ${
                  telemetry.countdownStep === 0
                    ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                    : 'bg-slate-800'
                }`}
              />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-wide text-white">
              {telemetry.countdownStep > 0 ? `SALIDA EN ${telemetry.countdownStep}` : '¡BANDERA VERDE!'}
            </span>
          </div>
        )}

        {telemetry.pitProgress > 0 && (
          <div className="bg-emerald-950/95 border border-emerald-400/50 rounded-xl px-6 py-3 w-72 text-center shadow-xl">
            <p className="font-display text-lg font-extrabold text-emerald-300 mb-1.5">
              EN PITS · CAMBIANDO RUEDAS Y GASOLINA
            </p>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.round(telemetry.pitProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {telemetry.inPitLane && telemetry.pitProgress === 0 && (
          <div className="bg-[#0B0F19]/92 border border-emerald-400/40 rounded-lg px-4 py-1.5 text-emerald-300 font-display font-bold text-sm tracking-wide">
            CALLE DE PITS · FRENA EN LA ZONA VERDE PARA REPOSTAR
          </div>
        )}

        {pitBanner && (
          <div className="bg-emerald-600/95 rounded-lg px-4 py-1.5 text-white font-display font-bold text-sm tracking-wide">
            {pitBanner}
          </div>
        )}

        {teleportBanner && (
          <div className="bg-cyan-500/95 border border-cyan-200/60 rounded-lg px-4 py-1.5 text-slate-950 font-display font-bold text-sm tracking-wide shadow-lg">
            ¡TELETRANSPORTADOR INVISIBLE! TRASLADO AL OTRO LADO DE LA PISTA
          </div>
        )}

        {telemetry.wrongWay && (
          <div className="bg-red-600/95 border border-red-300/40 rounded-lg px-4 py-2 flex items-center gap-2 text-white font-display font-bold text-lg tracking-wide">
            <AlertTriangle className="w-5 h-5" />
            <span>SENTIDO CONTRARIO · PRESIONA R PARA REUBICAR</span>
          </div>
        )}

        {telemetry.damage > 60 && !telemetry.inPitLane && (
          <div className="bg-amber-500/95 rounded-lg px-4 py-1.5 flex items-center gap-2 text-slate-950 font-display font-bold text-sm tracking-wide">
            <Wrench className="w-4 h-4" />
            <span>DAÑO GRAVE ({telemetry.damage}%) · ENTRA A PITS POR EL BORDE INTERIOR</span>
          </div>
        )}

        {telemetry.drafting && !telemetry.wrongWay && (
          <div className="bg-sky-500/90 rounded-lg px-3.5 py-1 flex items-center gap-1.5 text-slate-950 font-display font-bold text-sm tracking-wide">
            <Zap className="w-4 h-4" />
            <span>REBUFO ACTIVO (+VELOCIDAD)</span>
          </div>
        )}
      </div>

      {/* TOP-RIGHT HUD */}
      <div className="pointer-events-none absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        {mode !== 'timetrial' && telemetry.leaderboard.length > 0 && (
          <div className="w-64 bg-[#0B0F19]/90 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>TABLA EN VIVO</span>
              <span>GAP</span>
            </div>
            <div className="divide-y divide-white/5">
              {telemetry.leaderboard.map((row) => (
                <div
                  key={row.id}
                  className={`px-3 py-1 flex items-center justify-between text-xs ${
                    row.isPlayer ? 'bg-rose-600/25 text-white font-semibold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono-tabular w-4 text-slate-400">{row.position}</span>
                    <span
                      className="w-1.5 h-3.5 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-mono-tabular text-[11px] text-slate-400">
                      #{row.number}
                    </span>
                    <span className="truncate">{row.name}</span>
                  </div>
                  <span className="font-mono-tabular text-[11px] ml-2 shrink-0">
                    {row.inPitLane ? (
                      <span className="text-emerald-400 font-bold">PITS</span>
                    ) : (
                      <span className="text-slate-400">
                        {row.position === 1 ? 'LÍDER' : `+${row.gapSeconds.toFixed(1)}s`}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-32 h-32 bg-[#0B0F19]/90 border border-white/10 rounded-lg p-1.5 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polyline
              points={pitMinimapData.points}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon
              points={compiledTrack.minimapPoints
                .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#334155"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <circle
              cx={pitMinimapData.stallX}
              cy={pitMinimapData.stallY}
              r={2.5}
              fill="#34D399"
            />
            {telemetry.carPositions.map((cp) => {
              const mx = mapOffX + (cp.x - minX) * mapScale;
              const mz = mapOffZ + (cp.z - minZ) * mapScale;
              return (
                <circle
                  key={cp.id}
                  cx={mx}
                  cy={mz}
                  r={cp.isPlayer ? 4.2 : 2.8}
                  fill={cp.isPlayer ? '#E11D48' : cp.color}
                  stroke={cp.isPlayer ? '#FFFFFF' : 'none'}
                  strokeWidth={cp.isPlayer ? 1.2 : 0}
                />
              );
            })}
          </svg>
          <span className="absolute bottom-1 right-1.5 text-[9px] font-bold text-emerald-400 tracking-wider">
            PITS
          </span>
        </div>
      </div>

      {/* SPLIT-SCREEN VERTICAL DIVIDER & P2 BADGE */}
      {mode === 'splitscreen' && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-white/30 z-10" />
          <div className="pointer-events-none absolute top-4 left-[calc(50%+16px)] z-10 bg-[#0B0F19]/90 border border-sky-400/40 rounded-lg px-3.5 py-2">
            <span className="text-[10px] font-bold text-sky-400 block">
              JUGADOR 2 · FLECHAS ↑↓←→ + SHIFT DER
            </span>
            {telemetry.p2 && (
              <div className="flex items-center gap-4 mt-0.5 text-white font-display font-bold text-xl font-mono-tabular">
                <span>P{telemetry.p2.position}</span>
                <span>
                  V{telemetry.p2.lap}
                  {telemetry.totalLaps > 0 ? `/${telemetry.totalLaps}` : ' · ∞'}
                </span>
                <span className="text-sky-300">
                  {settings.units === 'mph'
                    ? Math.round(telemetry.p2.speedKmh * 0.621371)
                    : telemetry.p2.speedKmh}{' '}
                  {unitLabel}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* SIDE-WALL CRASH STUNT BUTTONS P1 (appear after hitting side rail!) */}
      {telemetry.wallStuntTimer > 0 && !paused && (
        <div
          className={`absolute bottom-20 ${
            mode === 'splitscreen' ? 'left-1/4 max-w-[46vw]' : 'left-1/2 max-w-[95vw]'
          } -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 bg-[#0B0F19]/92 border border-amber-400/45 rounded-xl px-4 py-2.5 shadow-2xl`}
        >
          <span className="text-[11px] font-bold text-amber-300 mr-1 whitespace-nowrap">
            {mode === 'splitscreen' ? 'P1 REJA:' : 'CHOQUE EN REJA:'}
          </span>
          <button
            onClick={() => {
              stuntActionRef.current = 'fly';
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [1] ¡Salir Volando!
          </button>
          <button
            onClick={() => {
              stuntActionRef.current = 'spin';
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [2] ¡Trompo Gracioso!
          </button>
          <button
            onClick={() => {
              stuntActionRef.current = 'flip';
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [3] ¡Voltereta 720°!
          </button>
          <button
            onClick={() => {
              stuntActionRef.current = 'rollover';
            }}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [4] ¡Volcar Auto!
          </button>
          <button
            onClick={() => {
              stuntActionRef.current = 'cruzflip';
            }}
            className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [5] ¡Vuelta a Lado Voltereta!
          </button>
        </div>
      )}

      {/* SIDE-WALL CRASH STUNT BUTTONS P2 (Split-Screen right half!) */}
      {mode === 'splitscreen' && telemetry.p2 && telemetry.p2.wallStuntTimer > 0 && !paused && (
        <div className="absolute bottom-20 left-3/4 -translate-x-1/2 max-w-[46vw] z-20 flex flex-wrap items-center justify-center gap-2 bg-[#0B0F19]/92 border border-sky-400/50 rounded-xl px-4 py-2.5 shadow-2xl">
          <span className="text-[11px] font-bold text-sky-300 mr-1 whitespace-nowrap">
            P2 REJA (6–0 / Num1–5):
          </span>
          <button
            onClick={() => {
              stuntActionP2Ref.current = 'fly';
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [6] ¡Salir Volando!
          </button>
          <button
            onClick={() => {
              stuntActionP2Ref.current = 'spin';
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [7] ¡Trompo Gracioso!
          </button>
          <button
            onClick={() => {
              stuntActionP2Ref.current = 'flip';
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [8] ¡Voltereta 720°!
          </button>
          <button
            onClick={() => {
              stuntActionP2Ref.current = 'rollover';
            }}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [9] ¡Volcar Auto!
          </button>
          <button
            onClick={() => {
              stuntActionP2Ref.current = 'cruzflip';
            }}
            className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            [0] ¡Vuelta a Lado Voltereta!
          </button>
        </div>
      )}

      {/* BOTTOM-LEFT */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPaused(true)}
          className="px-3 py-2 rounded-lg bg-[#0B0F19]/90 border border-white/10 hover:border-white/25 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Pausa (Esc)</span>
        </button>
        <button
          onClick={cycleCamera}
          className="px-3 py-2 rounded-lg bg-[#0B0F19]/90 border border-white/10 hover:border-white/25 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Cámara: {cameraModeLabel.toUpperCase()} (C)</span>
        </button>
        <button
          onClick={() => {
            resetFlagRef.current = true;
          }}
          className="px-3 py-2 rounded-lg bg-[#0B0F19]/90 border border-white/10 hover:border-white/25 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reubicar (R)</span>
        </button>
        <button
          onClick={() => onUpdateSettings({ muted: !settings.muted })}
          className="px-3 py-2 rounded-lg bg-[#0B0F19]/90 border border-white/10 hover:border-white/25 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
          aria-label="Alternar audio"
        >
          {settings.muted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
        <span className="hidden md:inline-block px-2.5 py-2 rounded-lg bg-[#0B0F19]/80 border border-white/10 text-[11px] text-slate-400">
          Click derecho + arrastrar: Mover cámara
        </span>
      </div>

      {/* BOTTOM-RIGHT: Speedometer, 3s Saved-Gas Boost, Fuel, Tire Health & Damage */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 w-68 bg-[#0B0F19]/92 border border-white/10 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-5xl font-extrabold leading-none text-white font-mono-tabular">
              {displaySpeed}
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 mt-0.5">
              {unitLabel}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">MARCHA</span>
            <span className="font-display text-3xl font-extrabold text-rose-500 font-mono-tabular leading-none">
              {telemetry.gear}
            </span>
          </div>
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-sm overflow-hidden">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${rpmPct}%`,
              backgroundColor:
                rpmPct > 86 ? '#EF4444' : rpmPct > 65 ? '#F59E0B' : '#38BDF8',
            }}
          />
        </div>

        {/* Saved-Gas 3s Turbo Boost Meter */}
        <div className="pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold text-sky-300 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {telemetry.boostTimer > 0
                ? `IMPULSO ACTIVO (${telemetry.boostTimer.toFixed(1)}s)`
                : 'IMPULSO AHORRO GAS [ENTER]'}
            </span>
            <span className="font-mono-tabular font-bold text-white">
              {telemetry.boostTimer > 0 ? 'MAX' : `${telemetry.fuelBoostCharge}%`}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full transition-all duration-75"
              style={{
                width:
                  telemetry.boostTimer > 0
                    ? `${Math.min(100, (telemetry.boostTimer / 3) * 100)}%`
                    : `${telemetry.fuelBoostCharge}%`,
                backgroundColor:
                  telemetry.boostTimer > 0
                    ? '#F97316'
                    : telemetry.fuelBoostCharge >= 20
                    ? '#38BDF8'
                    : '#475569',
              }}
            />
          </div>
        </div>

        {/* Fuel / Tires / Damage Strip */}
        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/10 text-[10px]">
          <div>
            <span className="text-slate-400 flex items-center gap-1">
              <Fuel className="w-3 h-3 text-amber-400" /> GAS
            </span>
            <span className="font-mono-tabular font-bold text-white text-xs">
              {telemetry.fuel}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">RUEDAS</span>
            <span
              className={`font-mono-tabular font-bold text-xs ${
                telemetry.tireWear < 45 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {telemetry.tireWear}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">DAÑO</span>
            <span
              className={`font-mono-tabular font-bold text-xs ${
                telemetry.damage > 45 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {telemetry.damage}%
            </span>
          </div>
        </div>
      </div>

      {/* PAUSE OVERLAY */}
      {paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75">
          <div className="w-full max-w-md bg-[#111622] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <h2 className="font-display text-3xl font-extrabold text-white mb-1">
              CARRERA EN PAUSA
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              {circuit.name} ·{' '}
              {isFreeRoam ? 'Carrera Libre (Tiempo Infinito · Sin Vueltas)' : `Vuelta ${telemetry.lap} de ${telemetry.totalLaps}`}
            </p>

            {roomCode && (
              <div className="mb-4 rounded-xl bg-[#0B0F18] border border-sky-500/35 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 block">
                    INVITAR AMIGOS · SALA {roomCode}
                  </span>
                  <span className="text-xs text-slate-300">
                    Comparte el link o código para que entren directo a esta pista.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?sala=${roomCode}`;
                    navigator.clipboard?.writeText(url);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 1800);
                  }}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {inviteCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{inviteCopied ? 'Link Copiado' : 'Copiar Link'}</span>
                </button>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-300 bg-[#0B0F18] border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Acelerar / Frenar</span>
                <span className="font-mono-tabular font-semibold">W / S o ↑ / ↓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dirección</span>
                <span className="font-mono-tabular font-semibold">A / D o ← / →</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Derrape (Sin frenar)</span>
                <span className="font-mono-tabular font-semibold">Espacio</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pits (Gasolina / Ruedas / Reparar)</span>
                <span className="font-mono-tabular font-semibold">Carril interior recta meta</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Reanudar Carrera</span>
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  if (onRestart) {
                    onRestart();
                  } else {
                    resetFlagRef.current = true;
                  }
                }}
                className="w-full py-3 rounded-xl bg-amber-500/15 border border-amber-400/40 hover:bg-amber-500/25 text-amber-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Partida</span>
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isFreeRoam ? 'Finalizar Carrera Libre' : 'Salir al Menú Principal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
