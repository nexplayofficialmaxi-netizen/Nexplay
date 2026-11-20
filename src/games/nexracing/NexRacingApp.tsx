import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CameraMode,
  CarCustomization,
  ChampionshipState,
  DoorStyle,
  GameSettings,
  GraphicsQuality,
  LiveryPattern,
  MenuSection,
  MultiplayerRoomInfo,
  RaceMode,
  RaceResult,
  SavedPlayerData,
  WheelStyle,
} from './types/game';
import { AI_DRIVER_NAMES, LIVERY_SWATCHES, STOCK_CARS } from './data/cars';
import { CIRCUITS } from './data/circuits';
import { NexPlayLogo } from './components/NexPlayLogo';
import { GarageShowroom } from './components/GarageShowroom';
import { CircuitMapSvg } from './components/CircuitMapSvg';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { RaceViewport, formatLapTime } from './components/RaceViewport';
import { RaceResultsScreen } from './components/RaceResultsScreen';
import {
  Play,
  Trophy,
  Gauge,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Flag,
  Sliders,
  Image as ImageIcon,
  Clipboard,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Save,
  Infinity as InfinityIcon,
  ArrowLeft,
} from 'lucide-react';

const SETTINGS_KEY = 'nexracing_settings_v2';
const CUSTOM_KEY = 'nexracing_custom_v2';
const CHAMP_KEY = 'nexracing_champ_v2';
const RECORDS_KEY = 'nexracing_records_v2';
const AUTH_TOKEN_KEY = 'nexracing_auth_token_v1';

const DEFAULT_SETTINGS: GameSettings = {
  quality: 'medium',
  volume: 0.65,
  muted: false,
  cameraMode: 'chase',
  units: 'kmh',
  aiCount: 7,
  aiDifficulty: 'pro',
  playerName: 'Piloto NexPlay',
};

const DEFAULT_CUSTOMIZATION: CarCustomization = {
  carId: STOCK_CARS[0].id,
  number: STOCK_CARS[0].defaultNumber,
  primaryColor: STOCK_CARS[0].primaryColor,
  secondaryColor: STOCK_CARS[0].secondaryColor,
  accentColor: STOCK_CARS[0].accentColor,
  pattern: STOCK_CARS[0].pattern,
  doorStyle: 'classic',
  wheelStyle: 'steel-nascar',
  customImageUrl: null,
};

function createInitialChampionship(playerName: string, custom: CarCustomization): ChampionshipState {
  const standings = [
    {
      id: 'player',
      name: playerName || 'Piloto NexPlay',
      number: custom.number,
      team: 'NexPlay Motorsports',
      color: custom.primaryColor,
      points: 0,
      wins: 0,
      isPlayer: true,
    },
    ...AI_DRIVER_NAMES.slice(0, 7).map((ai, i) => ({
      id: `ai-${i}`,
      name: ai.name,
      number: ai.number,
      team: ai.team,
      color: ai.color,
      points: 0,
      wins: 0,
      isPlayer: false,
    })),
  ];
  return {
    active: true,
    currentRound: 0,
    circuitIds: CIRCUITS.map((c) => c.id),
    standings,
    completedRounds: [],
  };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

async function compressImageSourceToDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas no disponible'));
        return;
      }
      ctx.drawImage(img, 0, 0, 256, 256);
      resolve(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

export interface NexRacingAppProps {
  onExitToNexPlay?: () => void;
}

export default function App({ onExitToNexPlay }: NexRacingAppProps = {}) {
  const [inviteJoinCode] = useState<string>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('sala');
      return q ? q.trim().toUpperCase().slice(0, 4) : '';
    } catch {
      return '';
    }
  });
  const [section, setSection] = useState<MenuSection>(() =>
    inviteJoinCode ? 'multijugador' : 'jugar',
  );
  const [garageTab, setGarageTab] = useState<'design' | 'doors' | 'wheels' | 'image'>('design');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() =>
    loadJson(SETTINGS_KEY, DEFAULT_SETTINGS),
  );
  const [customization, setCustomization] = useState<CarCustomization>(() =>
    loadJson(CUSTOM_KEY, DEFAULT_CUSTOMIZATION),
  );
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>(CIRCUITS[0].id);
  const [lapsOverride, setLapsOverride] = useState<number>(CIRCUITS[0].defaultLaps);
  const [playMode, setPlayMode] = useState<'quick' | 'timetrial' | 'freeroam'>('quick');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [records, setRecords] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [championship, setChampionship] = useState<ChampionshipState>(() => {
    try {
      const raw = localStorage.getItem(CHAMP_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return createInitialChampionship(DEFAULT_SETTINGS.playerName, DEFAULT_CUSTOMIZATION);
  });

  const [activeRace, setActiveRace] = useState<{
    mode: RaceMode;
    circuitId: string;
    laps: number;
  } | null>(null);
  const [raceSessionKey, setRaceSessionKey] = useState(0);
  const [lastResult, setLastResult] = useState<RaceResult | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsClientId, setWsClientId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<MultiplayerRoomInfo[]>([]);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoomInfo | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [authUser, setAuthUser] = useState<{ username: string } | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    } catch {
      return false;
    }
  });
  const authTokenRef = useRef(authToken);
  authTokenRef.current = authToken;

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customization));
    } catch {
      // ignore
    }
  }, [customization]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAMP_KEY, JSON.stringify(championship));
    } catch {
      // ignore
    }
  }, [championship]);

  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  const applySavedData = useCallback((saved: SavedPlayerData | null | undefined) => {
    if (!saved) return;
    if (saved.settings) setSettings((prev) => ({ ...prev, ...saved.settings }));
    if (saved.customization) setCustomization((prev) => ({ ...prev, ...saved.customization }));
    if (saved.records) setRecords(saved.records);
    if (saved.championship) setChampionship(saved.championship);
    if (saved.selectedCircuitId) setSelectedCircuitId(saved.selectedCircuitId);
    if (typeof saved.lapsOverride === 'number') setLapsOverride(saved.lapsOverride);
    if (saved.updatedAt) setLastSavedAt(saved.updatedAt);
  }, []);

  const saveAllData = useCallback(
    async (explicit = false, overrideToken?: string | null) => {
      const payload: SavedPlayerData = {
        settings,
        customization,
        records,
        championship,
        selectedCircuitId,
        lapsOverride,
        updatedAt: Date.now(),
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(customization));
        localStorage.setItem(CHAMP_KEY, JSON.stringify(championship));
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      } catch {
        // ignore
      }
      const activeTok = overrideToken !== undefined ? overrideToken : authTokenRef.current;
      let syncedCloud = false;
      if (activeTok) {
        try {
          const res = await fetch('/api/nexracing/user/data', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeTok}`,
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) syncedCloud = true;
        } catch {
          // ignore network error
        }
      }
      setLastSavedAt(payload.updatedAt);
      if (explicit) {
        setSaveNotice(
          syncedCloud ? '¡Datos guardados en tu cuenta y en esta PC!' : '¡Datos guardados en esta PC!',
        );
        setTimeout(() => setSaveNotice(null), 2600);
      }
    },
    [championship, customization, lapsOverride, records, selectedCircuitId, settings],
  );

  // Auto-save to account whenever logged-in player updates car, records, settings, or championship
  useEffect(() => {
    if (!authToken) return;
    const t = window.setTimeout(() => {
      saveAllData(false);
    }, 900);
    return () => window.clearTimeout(t);
  }, [authToken, saveAllData]);

  const applyCustomImageFromBlob = useCallback(async (blob: Blob) => {
    setImageBusy(true);
    setImageStatus(null);
    const objUrl = URL.createObjectURL(blob);
    try {
      const dataUrl = await compressImageSourceToDataUrl(objUrl);
      setCustomization((p) => ({ ...p, customImageUrl: dataUrl }));
      setImageStatus('Imagen aplicada al diseño del auto.');
    } catch {
      setImageStatus('Error al procesar la imagen.');
    } finally {
      URL.revokeObjectURL(objUrl);
      setImageBusy(false);
    }
  }, []);

  const applyCustomImageFromUrl = useCallback(async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    setImageBusy(true);
    setImageStatus(null);
    try {
      const targetSrc = trimmed.startsWith('data:')
        ? trimmed
        : `/api/nexracing/proxy-image?url=${encodeURIComponent(trimmed)}`;
      const dataUrl = await compressImageSourceToDataUrl(targetSrc);
      setCustomization((p) => ({ ...p, customImageUrl: dataUrl }));
      setImageStatus('Imagen de Google / URL aplicada al auto.');
    } catch {
      setImageStatus('No se pudo cargar esa URL. Prueba copiar la imagen (Ctrl+V) o subir un archivo.');
    } finally {
      setImageBusy(false);
    }
  }, []);

  // Global Ctrl+V paste handler when inside Garage
  useEffect(() => {
    if (section !== 'garage') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            applyCustomImageFromBlob(file);
            return;
          }
        }
      }
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setImageUrlInput(text);
        applyCustomImageFromUrl(text);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [section, applyCustomImageFromBlob, applyCustomImageFromUrl]);

  const handleClipboardButton = async () => {
    setImageStatus(null);
    try {
      if (navigator.clipboard && 'read' in navigator.clipboard) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            await applyCustomImageFromBlob(blob);
            return;
          }
        }
      }
      const text = await navigator.clipboard?.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setImageUrlInput(text);
        await applyCustomImageFromUrl(text);
        return;
      }
      setImageStatus('Copia primero una imagen de Google (clic derecho → Copiar imagen) y presiona Ctrl+V aquí.');
    } catch {
      setImageStatus('Presiona Ctrl+V directamente en esta pantalla para pegar la imagen copiada.');
    }
  };

  // Verify saved Online Multiplayer auth session
  useEffect(() => {
    if (!authToken) {
      setAuthUser(null);
      setAuthChecking(false);
      return;
    }
    let cancelled = false;
    setAuthChecking(true);
    fetch('/api/nexracing/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('expired'))))
      .then((data) => {
        if (!cancelled && data?.user?.username) {
          setAuthUser({ username: data.user.username });
          if (data.savedData) {
            applySavedData(data.savedData as SavedPlayerData);
          }
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'auth:verify', token: authToken }));
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthUser(null);
          setAuthToken(null);
          try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  // WebSocket Multiplayer Connection
  const shouldKeepWs =
    section === 'multijugador' ||
    Boolean(currentRoom) ||
    activeRace?.mode === 'multiplayer';

  useEffect(() => {
    if (!shouldKeepWs) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      return;
    }
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws-nexracing`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setWsError(null);
      if (authTokenRef.current) {
        ws.send(JSON.stringify({ type: 'auth:verify', token: authTokenRef.current }));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === 'connected') {
          setWsClientId(msg.clientId);
          setRooms(msg.rooms || []);
        } else if (msg.type === 'rooms:list') {
          setRooms(msg.rooms || []);
        } else if (msg.type === 'room:joined') {
          setWsClientId(msg.clientId);
          setCurrentRoom(msg.room);
          setWsError(null);
        } else if (msg.type === 'room:state') {
          setCurrentRoom(msg.room);
        } else if (msg.type === 'room:left') {
          setCurrentRoom(null);
        } else if (msg.type === 'room:error') {
          setWsError(msg.message || 'Error de sala');
        } else if (msg.type === 'race:started' && msg.room) {
          const rm = msg.room as MultiplayerRoomInfo;
          setCurrentRoom(rm);
          setLastResult(null);
          setRaceSessionKey((k) => k + 1);
          setActiveRace({
            mode: 'multiplayer',
            circuitId: rm.circuitId,
            laps: rm.freeRoam ? 0 : rm.laps,
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };
  }, [shouldKeepWs]);

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, []);

  const selectedCar = useMemo(
    () => STOCK_CARS.find((c) => c.id === customization.carId) || STOCK_CARS[0],
    [customization.carId],
  );

  const selectedCircuit = useMemo(
    () => CIRCUITS.find((c) => c.id === selectedCircuitId) || CIRCUITS[0],
    [selectedCircuitId],
  );

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectCarModel = (carId: string) => {
    const spec = STOCK_CARS.find((c) => c.id === carId) || STOCK_CARS[0];
    setCustomization((prev) => ({
      ...prev,
      carId: spec.id,
      number: spec.defaultNumber,
      primaryColor: spec.primaryColor,
      secondaryColor: spec.secondaryColor,
      accentColor: spec.accentColor,
      pattern: spec.pattern,
    }));
  };

  const handleSelectCircuit = (id: string) => {
    const c = CIRCUITS.find((x) => x.id === id) || CIRCUITS[0];
    setSelectedCircuitId(c.id);
    setLapsOverride(c.defaultLaps);
  };

  const launchRace = (mode: RaceMode, circuitId: string, laps: number) => {
    setLastResult(null);
    setRaceSessionKey((k) => k + 1);
    setActiveRace({ mode, circuitId, laps });
  };

  const handleRaceComplete = (result: RaceResult) => {
    setActiveRace(null);
    setLastResult(result);

    if (result.playerBestLapMs !== null) {
      setRecords((prev) => {
        const currentBest = prev[result.circuitId];
        if (!currentBest || result.playerBestLapMs! < currentBest) {
          return { ...prev, [result.circuitId]: result.playerBestLapMs! };
        }
        return prev;
      });
    }

    if (result.mode === 'championship') {
      const ptsTable = [40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25];
      setChampionship((prev) => {
        const updatedStandings = prev.standings.map((drv) => {
          const match = result.standings.find(
            (s) => (drv.isPlayer && s.isPlayer) || (!drv.isPlayer && s.name === drv.name),
          );
          const pos = match ? match.position : 8;
          const pts = ptsTable[Math.min(ptsTable.length - 1, pos - 1)] || 20;
          return {
            ...drv,
            name: drv.isPlayer ? settings.playerName || drv.name : drv.name,
            number: drv.isPlayer ? customization.number : drv.number,
            color: drv.isPlayer ? customization.primaryColor : drv.color,
            points: drv.points + pts,
            wins: drv.wins + (pos === 1 ? 1 : 0),
          };
        });
        updatedStandings.sort((a, b) => b.points - a.points);

        const completed = prev.completedRounds.includes(prev.currentRound)
          ? prev.completedRounds
          : [...prev.completedRounds, prev.currentRound];
        const nextRound = Math.min(prev.circuitIds.length - 1, prev.currentRound + 1);

        return {
          ...prev,
          currentRound: nextRound,
          completedRounds: completed,
          standings: updatedStandings,
        };
      });
    }

    if (result.mode === 'multiplayer' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'race:end' }));
    }
  };

  if (activeRace) {
    const raceCircuit = CIRCUITS.find((c) => c.id === activeRace.circuitId) || CIRCUITS[0];
    const isMpHost =
      activeRace.mode === 'multiplayer' &&
      Boolean(currentRoom?.drivers.find((d) => d.id === wsClientId)?.isHost);
    return (
      <RaceViewport
        key={raceSessionKey}
        mode={activeRace.mode}
        circuit={raceCircuit}
        totalLaps={activeRace.laps}
        freeRoam={
          activeRace.mode === 'freeroam' ||
          Boolean(currentRoom?.freeRoam) ||
          activeRace.laps <= 0
        }
        roomCode={activeRace.mode === 'multiplayer' ? currentRoom?.code || null : null}
        playerCarSpec={selectedCar}
        playerCustomization={customization}
        settings={settings}
        multiplayerDrivers={currentRoom?.drivers}
        localClientId={wsClientId}
        wsRef={wsRef}
        onUpdateSettings={updateSettings}
        onRestart={() => {
          if (isMpHost && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'race:start' }));
          } else {
            setRaceSessionKey((k) => k + 1);
          }
        }}
        onExit={() => {
          if (activeRace.mode === 'multiplayer' && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
            setCurrentRoom(null);
          }
          setActiveRace(null);
        }}
        onRaceComplete={handleRaceComplete}
      />
    );
  }

  if (lastResult) {
    const hasNextChamp =
      lastResult.mode === 'championship' &&
      championship.completedRounds.length < championship.circuitIds.length;
    return (
      <RaceResultsScreen
        result={lastResult}
        hasNextChampRound={hasNextChamp}
        onRetry={() =>
          launchRace(lastResult.mode, lastResult.circuitId, lastResult.totalLaps)
        }
        onNextChampRound={() => {
          const nextCktId = championship.circuitIds[championship.currentRound] || CIRCUITS[0].id;
          const nextCkt = CIRCUITS.find((c) => c.id === nextCktId) || CIRCUITS[0];
          launchRace('championship', nextCkt.id, nextCkt.defaultLaps);
        }}
        onBackToMenu={() => setLastResult(null)}
      />
    );
  }

  const navItems: Array<{ id: MenuSection; label: string }> = [
    { id: 'jugar', label: 'JUGAR' },
    { id: 'multijugador', label: 'MULTIJUGADOR' },
    { id: 'garage', label: 'GARAGE' },
    { id: 'circuitos', label: 'CIRCUITOS' },
    { id: 'campeonato', label: 'CAMPEONATO' },
    { id: 'configuracion', label: 'CONFIGURACIÓN' },
  ];

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col">
      <header className="border-b border-white/10 bg-[#0B0E15]">
        <div className="max-w-[1360px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            {onExitToNexPlay && (
              <button
                type="button"
                onClick={onExitToNexPlay}
                title="Volver al portal NexPlay"
                className="px-3 py-2 rounded-xl bg-[#111520] border border-white/15 hover:border-white/30 text-xs font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Volver a NexPlay</span>
              </button>
            )}
            <NexPlayLogo />
          </div>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Menú principal">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`font-display text-base font-bold tracking-wide py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-white border-rose-500'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => saveAllData(true)}
              title="Guardar progreso, auto, récords y configuración"
              className="hidden md:flex px-3 py-2.5 rounded-xl bg-[#111520] border border-white/15 hover:border-emerald-400/50 text-xs font-semibold text-slate-200 items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{saveNotice ? '¡Guardado!' : 'Guardar'}</span>
            </button>

            <button
              onClick={() => setSection('multijugador')}
              className={`hidden sm:flex px-3.5 py-2.5 rounded-xl border text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                authUser
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-[#111520] border-white/15 text-slate-200 hover:border-rose-500/50'
              }`}
            >
              {authUser ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>{authUser.username}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Crear Cuenta Online</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                launchRace(
                  playMode,
                  selectedCircuit.id,
                  playMode === 'freeroam' ? 0 : lapsOverride,
                )
              }
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-base tracking-wide flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>INICIAR CARRERA</span>
            </button>
          </div>
        </div>

        <div className="lg:hidden border-t border-white/5 px-4 py-2 flex items-center gap-4 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`font-display text-sm font-bold tracking-wide px-2 py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                section === item.id ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {/* SECTION: JUGAR */}
        {section === 'jugar' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-[#111520] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-rose-400 mb-2">
                    NASCAR CUP SIMULATOR · DESARROLLADO POR NEXPLAY CHILE
                  </p>
                  <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 text-balance">
                    NASCAR EN ESTADIOS LLENOS, DE DÍA Y DE NOCHE
                  </h1>
                  <p className="text-slate-400 text-sm md:text-base max-w-2xl mb-6">
                    Compite en Daytona, Talladega, Charlotte y Bristol con miles de espectadores, paradas en pits para gasolina y cambio de ruedas, y choques múltiples de alto impacto.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => setPlayMode('quick')}
                      className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                        playMode === 'quick'
                          ? 'bg-rose-600/15 border-rose-500/60 text-white'
                          : 'bg-[#0B0E17] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="font-display text-xl font-bold block">
                        CARRERA NASCAR
                      </span>
                      <span className="text-xs text-slate-400">
                        Pelotón completo con bots IA, rebufo y pits reales.
                      </span>
                    </button>

                    <button
                      onClick={() => setPlayMode('freeroam')}
                      className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                        playMode === 'freeroam'
                          ? 'bg-emerald-600/15 border-emerald-500/60 text-white'
                          : 'bg-[#0B0E17] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="font-display text-xl font-bold flex items-center gap-1.5">
                        <InfinityIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>CARRERA LIBRE</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        Tiempo infinito, sin vueltas; explora la pista y el pasto.
                      </span>
                    </button>

                    <button
                      onClick={() => setPlayMode('timetrial')}
                      className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                        playMode === 'timetrial'
                          ? 'bg-sky-600/15 border-sky-500/60 text-white'
                          : 'bg-[#0B0E17] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="font-display text-xl font-bold block">
                        CONTRARRELOJ
                      </span>
                      <span className="text-xs text-slate-400">
                        Vuelta rápida en solitario para marcar el récord del óvalo.
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0B0E17] border border-white/10 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block mb-1.5">
                        {playMode === 'freeroam'
                          ? 'Vueltas: Sin límite (∞)'
                          : `Vueltas (${lapsOverride})`}
                      </span>
                      <input
                        type="range"
                        min={2}
                        max={20}
                        disabled={playMode === 'freeroam'}
                        value={lapsOverride}
                        onChange={(e) => setLapsOverride(Number(e.target.value))}
                        className="w-full accent-rose-600 disabled:opacity-40"
                      />
                    </div>

                    <div className="bg-[#0B0E17] border border-white/10 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block mb-1.5">
                        Rivales IA ({playMode === 'timetrial' ? 0 : settings.aiCount})
                      </span>
                      <input
                        type="range"
                        min={3}
                        max={11}
                        disabled={playMode === 'timetrial'}
                        value={settings.aiCount}
                        onChange={(e) =>
                          updateSettings({ aiCount: Number(e.target.value) })
                        }
                        className="w-full accent-rose-600 disabled:opacity-40"
                      />
                    </div>

                    <div className="bg-[#0B0E17] border border-white/10 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400 block mb-1.5">
                        Nivel IA
                      </span>
                      <select
                        value={settings.aiDifficulty}
                        disabled={playMode === 'timetrial'}
                        onChange={(e) =>
                          updateSettings({
                            aiDifficulty: e.target.value as GameSettings['aiDifficulty'],
                          })
                        }
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                      >
                        <option value="rookie" className="bg-[#111520]">Novato</option>
                        <option value="pro" className="bg-[#111520]">Profesional</option>
                        <option value="legend" className="bg-[#111520]">Leyenda</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() =>
                      launchRace(
                        playMode,
                        selectedCircuit.id,
                        playMode === 'freeroam' ? 0 : lapsOverride,
                      )
                    }
                    className="px-7 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-lg tracking-wide flex items-center gap-2.5 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      {playMode === 'timetrial'
                        ? 'INICIAR CLASIFICACIÓN'
                        : playMode === 'freeroam'
                        ? 'ENTRAR A CARRERA LIBRE'
                        : 'SALTAR A LA PISTA'}
                    </span>
                  </button>
                  <button
                    onClick={() => setSection('campeonato')}
                    className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Copa NASCAR
                  </button>
                  <button
                    onClick={() => setSection('multijugador')}
                    className="px-5 py-3.5 rounded-xl bg-sky-600/20 border border-sky-500/45 hover:bg-sky-600/30 text-sky-200 text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4 text-sky-400" />
                    <span>{authUser ? `Online (${authUser.username})` : 'Online · Crear Cuenta'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-[#111520] border border-white/10 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400">
                        Óvalo NASCAR · {selectedCircuit.isNight ? 'Carrera Nocturna' : 'Carrera Diurna'}
                      </span>
                      <h2 className="font-display text-2xl font-bold text-white">
                        {selectedCircuit.name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedCircuit.type} · {selectedCircuit.lengthKm} km · Peralte {selectedCircuit.maxBankingDeg}°
                      </p>
                    </div>
                    <button
                      onClick={() => setSection('circuitos')}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="my-3 bg-[#0B0E17] border border-white/10 rounded-xl p-3">
                    <CircuitMapSvg circuit={selectedCircuit} className="w-full h-32" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tu Récord: <strong className="font-mono-tabular text-emerald-400">{formatLapTime(records[selectedCircuit.id] || null)}</strong></span>
                    <span>Récord Pista: <strong className="font-mono-tabular text-amber-400">{formatLapTime(selectedCircuit.recordLapMs)}</strong></span>
                  </div>
                </div>

                <div className="bg-[#111520] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-10 rounded-xs shrink-0"
                        style={{ backgroundColor: customization.primaryColor }}
                      />
                      <div>
                        <span className="text-xs text-slate-400 block">Stock Car Activo</span>
                        <h3 className="font-display text-xl font-bold text-white">
                          #{customization.number} · {selectedCar.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setSection('garage')}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap"
                    >
                      Editar Auto
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedCar.team} · Puertas: {customization.doorStyle} · Ruedas: {customization.wheelStyle}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111520] border border-white/10 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
              <span className="font-semibold text-white">Controles & Pits</span>
              <div className="flex flex-wrap items-center gap-5 font-mono-tabular">
                <span><strong className="text-rose-400">W / ↑</strong> Acelerar</span>
                <span><strong className="text-rose-400">S / ↓</strong> Frenar</span>
                <span><strong className="text-rose-400">A / D o ← / →</strong> Girar</span>
                <span><strong className="text-rose-400">Espacio</strong> Derrapar</span>
                <span><strong className="text-amber-400">1–5</strong> Acrobacias en reja</span>
                <span><strong className="text-amber-400">Enter</strong> Impulso 3s</span>
                <span><strong className="text-sky-400">Click Der.</strong> Mover cámara</span>
                <span><strong className="text-emerald-400">Pits</strong> Borde interno en meta</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: MULTIJUGADOR */}
        {section === 'multijugador' && (
          <MultiplayerLobby
            connected={wsConnected}
            clientId={wsClientId}
            rooms={rooms}
            currentRoom={currentRoom}
            errorMsg={wsError}
            authToken={authToken}
            authUser={authUser}
            authChecking={authChecking}
            initialJoinCode={inviteJoinCode}
            onAuthSuccess={(token, user, savedData) => {
              try {
                localStorage.setItem(AUTH_TOKEN_KEY, token);
              } catch {
                // ignore
              }
              setAuthToken(token);
              setAuthUser(user);
              setWsError(null);
              if (savedData) {
                applySavedData(savedData);
              } else {
                updateSettings({ playerName: user.username });
                saveAllData(false, token);
              }
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'auth:verify', token }));
              }
            }}
            onLogout={() => {
              const oldToken = authToken;
              if (oldToken) {
                fetch('/api/nexracing/auth/logout', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${oldToken}` },
                }).catch(() => {});
              }
              if (currentRoom && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
              }
              setCurrentRoom(null);
              setAuthToken(null);
              setAuthUser(null);
              try {
                localStorage.removeItem(AUTH_TOKEN_KEY);
              } catch {
                // ignore
              }
            }}
            carSpec={selectedCar}
            customization={customization}
            selectedCircuit={selectedCircuit}
            wsRef={wsRef}
            onStartSplitScreen={() => launchRace('splitscreen', selectedCircuit.id, lapsOverride)}
          />
        )}

        {/* SECTION: GARAGE */}
        {section === 'garage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="h-[430px]">
                <GarageShowroom carSpec={selectedCar} customization={customization} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STOCK_CARS.map((car) => {
                  const active = car.id === customization.carId;
                  return (
                    <button
                      key={car.id}
                      onClick={() => handleSelectCarModel(car.id)}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-rose-600/15 border-rose-500 text-white'
                          : 'bg-[#111520] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-tabular text-xs font-bold text-slate-400">
                          #{car.defaultNumber}
                        </span>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: car.primaryColor }}
                        />
                      </div>
                      <p className="font-display text-base font-bold truncate">{car.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{car.team}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Tabbed Customization (Diseño / Puertas / Ruedas / Imagen Google) */}
            <div className="lg:col-span-5 bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-5">
              <div>
                <p className="text-xs text-rose-400 font-semibold">{selectedCar.team}</p>
                <h2 className="font-display text-3xl font-extrabold text-white">
                  {selectedCar.name}
                </h2>
              </div>

              {/* Editor Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0E17] rounded-xl border border-white/10">
                {(
                  [
                    { id: 'design', label: 'Diseño' },
                    { id: 'doors', label: 'Puertas' },
                    { id: 'wheels', label: 'Ruedas' },
                    { id: 'image', label: 'Imagen' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setGarageTab(t.id)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      garageTab === t.id
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: DISEÑO & COLORES */}
              {garageTab === 'design' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-slate-400">
                      Número (00–99)
                      <input
                        type="text"
                        maxLength={2}
                        value={customization.number}
                        onChange={(e) =>
                          setCustomization((p) => ({
                            ...p,
                            number: e.target.value.replace(/[^0-9]/g, '') || '0',
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2 font-mono-tabular text-sm text-white"
                      />
                    </label>

                    <label className="text-xs text-slate-400">
                      Patrón de Pintura
                      <select
                        value={customization.pattern}
                        onChange={(e) =>
                          setCustomization((p) => ({
                            ...p,
                            pattern: e.target.value as LiveryPattern,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2 text-sm text-white"
                      >
                        <option value="apex">Apex Racing</option>
                        <option value="stripes">Franjas Clásicas</option>
                        <option value="chevron">Chevrón V8</option>
                        <option value="dual">Doble Tono</option>
                        <option value="flames">Llamas NASCAR</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-2">Color Primario</span>
                    <div className="flex flex-wrap gap-2">
                      {LIVERY_SWATCHES.map((hex) => (
                        <button
                          key={`p-${hex}`}
                          onClick={() => setCustomization((p) => ({ ...p, primaryColor: hex }))}
                          className={`w-7 h-7 rounded-lg border cursor-pointer flex items-center justify-center ${
                            customization.primaryColor === hex
                              ? 'border-white scale-110'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {customization.primaryColor === hex && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-2">
                      Color Secundario (Franjas)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {LIVERY_SWATCHES.map((hex) => (
                        <button
                          key={`s-${hex}`}
                          onClick={() => setCustomization((p) => ({ ...p, secondaryColor: hex }))}
                          className={`w-7 h-7 rounded-lg border cursor-pointer flex items-center justify-center ${
                            customization.secondaryColor === hex
                              ? 'border-white scale-110'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {customization.secondaryColor === hex && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-2">
                      Color de Acento y Alerón
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {LIVERY_SWATCHES.map((hex) => (
                        <button
                          key={`a-${hex}`}
                          onClick={() => setCustomization((p) => ({ ...p, accentColor: hex }))}
                          className={`w-7 h-7 rounded-lg border cursor-pointer flex items-center justify-center ${
                            customization.accentColor === hex
                              ? 'border-white scale-110'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {customization.accentColor === hex && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PUERTAS */}
              {garageTab === 'doors' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Elige el estilo de placa y numeración lateral en las puertas y el techo.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(
                      [
                        {
                          id: 'classic',
                          name: 'Placa Clásica Blanca',
                          desc: 'Fondo blanco NASCAR con borde de color acento.',
                        },
                        {
                          id: 'angled',
                          name: 'Número Inclinado Cup',
                          desc: 'Estilo aerodinámico inclinado de velocidad.',
                        },
                        {
                          id: 'carbon',
                          name: 'Panel Fibra de Carbono',
                          desc: 'Placa oscura de carbono con número blanco brillante.',
                        },
                        {
                          id: 'clean',
                          name: 'Puertas Limpias (Sin Placa)',
                          desc: 'Ideal para lucir tu imagen pegada sin recuadro en el centro.',
                        },
                      ] as Array<{ id: DoorStyle; name: string; desc: string }>
                    ).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setCustomization((p) => ({ ...p, doorStyle: d.id }))}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer ${
                          customization.doorStyle === d.id
                            ? 'bg-rose-600/15 border-rose-500 text-white'
                            : 'bg-[#0B0E17] border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: RUEDAS */}
              {garageTab === 'wheels' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Personaliza el diseño de las llantas y el perfil de los neumáticos slick.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(
                      [
                        {
                          id: 'steel-nascar',
                          name: 'Acero Aero NASCAR',
                          desc: 'Llanta negra clásica con banda lateral amarilla estilo Goodyear.',
                        },
                        {
                          id: '5-spoke',
                          name: 'Aleación Cromada 5-Spoke',
                          desc: 'Llanta deportiva plateada brillante con centro del color del auto.',
                        },
                        {
                          id: 'bbs-mesh',
                          name: 'Dorada BBS Next-Gen',
                          desc: 'Llanta dorada monotuerca oficial de la nueva generación NASCAR.',
                        },
                        {
                          id: 'carbon-lip',
                          name: 'Carbono Negro + Aro Acento',
                          desc: 'Acabado mate oscuro con perfil del color acento elegido.',
                        },
                      ] as Array<{ id: WheelStyle; name: string; desc: string }>
                    ).map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setCustomization((p) => ({ ...p, wheelStyle: w.id }))}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer ${
                          customization.wheelStyle === w.id
                            ? 'bg-rose-600/15 border-rose-500 text-white'
                            : 'bg-[#0B0E17] border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <p className="font-semibold text-sm">{w.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{w.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PEGAR IMAGEN DE GOOGLE / URL */}
              {garageTab === 'image' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Copia cualquier imagen desde <strong>Google Imágenes</strong> (clic derecho → <em>Copiar imagen</em> o <em>Copiar dirección de imagen</em>) y pégala directamente con <strong>Ctrl+V</strong> o usando los botones de abajo.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleClipboardButton}
                      disabled={imageBusy}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4" />
                      <span>Pegar Portapapeles</span>
                    </button>

                    <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Subir Archivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) applyCustomImageFromBlob(f);
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-slate-400 block">
                      O pega el enlace (URL) de la imagen de Google:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => applyCustomImageFromUrl(imageUrlInput)}
                        disabled={imageBusy || !imageUrlInput.trim()}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {imageStatus && (
                    <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2">
                      {imageStatus}
                    </p>
                  )}

                  {customization.customImageUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0E17] border border-white/10">
                      <div className="flex items-center gap-3">
                        <img
                          src={customization.customImageUrl}
                          alt="Diseño personalizado"
                          className="w-12 h-12 rounded-lg object-cover border border-white/15"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                            <span>Imagen Activa en el Auto</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Tip: En la pestaña Puertas puedes elegir &ldquo;Sin Placa&rdquo; para verla completa.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCustomization((p) => ({ ...p, customImageUrl: null }));
                          setImageStatus('Imagen personalizada eliminada.');
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-300 cursor-pointer"
                        aria-label="Quitar imagen personalizada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Compact Performance Stats Footer */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
                {[
                  { label: 'VEL', val: selectedCar.stats.topSpeed },
                  { label: 'ACEL', val: selectedCar.stats.acceleration },
                  { label: 'MAN', val: selectedCar.stats.handling },
                  { label: 'FREN', val: selectedCar.stats.braking },
                ].map((s) => (
                  <div key={s.label} className="bg-[#0B0E17] rounded-lg py-2 px-1">
                    <span className="text-[10px] text-slate-400 block">{s.label}</span>
                    <span className="font-mono-tabular text-sm font-bold text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: CIRCUITOS */}
        {section === 'circuitos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-extrabold text-white">
                  ÓVALOS OFICIALES NASCAR
                </h2>
                <p className="text-sm text-slate-400">
                  Circuitos oficiales NASCAR de día y de noche con tribunas llenas y calle de pits activa.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[#111520] border border-white/10 rounded-xl px-4 py-2.5 text-xs">
                <span className="text-slate-400">Vueltas:</span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={lapsOverride}
                  onChange={(e) => setLapsOverride(Number(e.target.value))}
                  className="w-28 accent-rose-600"
                />
                <span className="font-mono-tabular font-bold text-white w-5">
                  {lapsOverride}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CIRCUITS.map((ckt) => {
                const isSelected = ckt.id === selectedCircuit.id;
                return (
                  <div
                    key={ckt.id}
                    onClick={() => handleSelectCircuit(ckt.id)}
                    className={`rounded-2xl p-6 border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#151B2B] border-rose-500'
                        : 'bg-[#111520] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          {ckt.type} · {ckt.location}
                        </p>
                        <h3 className="font-display text-2xl font-extrabold text-white mt-0.5">
                          {ckt.name}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          ckt.isNight ? 'text-sky-400' : 'text-amber-400'
                        }`}
                      >
                        {ckt.isNight ? 'Nocturna · Luces LED' : 'Diurna'}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                      <div className="col-span-5 bg-[#0B0E17] border border-white/10 rounded-xl p-3">
                        <CircuitMapSvg
                          circuit={ckt}
                          className="w-full h-28"
                          accentColor={isSelected ? '#E11D48' : '#38BDF8'}
                        />
                      </div>
                      <div className="col-span-7 space-y-2 text-xs">
                        <p className="text-slate-300 leading-relaxed">{ckt.description}</p>
                        <div className="grid grid-cols-2 gap-2 pt-2 text-slate-400">
                          <span>Longitud: <strong className="text-white font-mono-tabular">{ckt.lengthKm} km</strong></span>
                          <span>Peralte: <strong className="text-white font-mono-tabular">{ckt.maxBankingDeg}°</strong></span>
                          <span>Récord: <strong className="text-amber-400 font-mono-tabular">{formatLapTime(ckt.recordLapMs)}</strong></span>
                          <span>Tu mejor: <strong className="text-emerald-400 font-mono-tabular">{formatLapTime(records[ckt.id] || null)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-xs text-slate-400">
                        {isSelected ? 'Circuito seleccionado' : 'Clic para seleccionar'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCircuit(ckt.id);
                          launchRace('quick', ckt.id, ckt.defaultLaps);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Correr Aquí</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: CAMPEONATO */}
        {section === 'campeonato' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-[#111520] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <p className="text-xs font-semibold text-rose-400">
                    TEMPORADA OFICIAL 4 RONDAS
                  </p>
                  <h2 className="font-display text-3xl font-extrabold text-white flex items-center gap-2.5">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <span>AYSÉN NASCAR CUP SERIES</span>
                  </h2>
                </div>
                <button
                  onClick={() =>
                    setChampionship(
                      createInitialChampionship(settings.playerName, customization),
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Copa</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#0B0E17]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-slate-400">
                    <tr>
                      <th className="py-3 px-4">POS</th>
                      <th className="py-3 px-4">PILOTO</th>
                      <th className="py-3 px-4">EQUIPO</th>
                      <th className="py-3 px-4 text-center">VICTORIAS</th>
                      <th className="py-3 px-4 text-right">PUNTOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {championship.standings.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={row.isPlayer ? 'bg-rose-600/15 text-white font-semibold' : 'text-slate-300'}
                      >
                        <td className="py-2.5 px-4 font-mono-tabular">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-4 rounded-xs"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="font-mono-tabular text-slate-400">
                              #{row.number}
                            </span>
                            <span>{row.isPlayer ? settings.playerName : row.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-400">{row.team}</td>
                        <td className="py-2.5 px-4 text-center font-mono-tabular">{row.wins}</td>
                        <td className="py-2.5 px-4 text-right font-mono-tabular font-bold text-amber-400">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-5">
              <h3 className="font-display text-2xl font-bold text-white">
                CALENDARIO NASCAR CUP
              </h3>

              <div className="space-y-3">
                {championship.circuitIds.map((cid, idx) => {
                  const ckt = CIRCUITS.find((c) => c.id === cid) || CIRCUITS[0];
                  const done = championship.completedRounds.includes(idx);
                  const isCurrent =
                    !done &&
                    idx === championship.currentRound &&
                    championship.completedRounds.length < championship.circuitIds.length;
                  return (
                    <div
                      key={cid}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-rose-600/15 border-rose-500/60'
                          : 'bg-[#0B0E17] border-white/10'
                      }`}
                    >
                      <div>
                        <p className="text-xs text-slate-400">
                          Ronda {idx + 1} · {ckt.defaultLaps} vueltas · {ckt.isNight ? 'Noche' : 'Día'}
                        </p>
                        <p className="font-semibold text-white text-sm">{ckt.name}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          done
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {done ? 'Completada' : isCurrent ? 'Siguiente' : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {championship.completedRounds.length >= championship.circuitIds.length ? (
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center">
                  <p className="font-display text-xl font-bold text-amber-300">
                    ¡CAMPEONATO FINALIZADO!
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Campeón actual: {championship.standings[0]?.name} ({championship.standings[0]?.points} pts)
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const cid =
                      championship.circuitIds[championship.currentRound] || CIRCUITS[0].id;
                    const ckt = CIRCUITS.find((c) => c.id === cid) || CIRCUITS[0];
                    launchRace('championship', ckt.id, ckt.defaultLaps);
                  }}
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-lg tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Flag className="w-5 h-5" />
                  <span>CORRER RONDA {championship.currentRound + 1}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION: CONFIGURACIÓN */}
        {section === 'configuracion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="font-display text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Sliders className="w-6 h-6 text-rose-500" />
                  <span>CONFIGURACIÓN DEL SIMULADOR</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Ajusta el rendimiento gráfico para PCs de bajos recursos, audio V8 y preferencias de conducción.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Nombre del Piloto (Sin iniciar sesión)
                </label>
                <input
                  type="text"
                  maxLength={22}
                  value={settings.playerName}
                  onChange={(e) => updateSettings({ playerName: e.target.value })}
                  className="w-full max-w-sm rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <span className="block text-xs text-slate-400 mb-2">
                  Calidad Gráfica 3D (Optimización de RAM y FPS)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'low', label: 'Bajo', desc: 'Máx. FPS / Mín. RAM' },
                      { id: 'medium', label: 'Medio', desc: 'Equilibrado' },
                      { id: 'high', label: 'Alto', desc: 'Sombras HD' },
                    ] as Array<{ id: GraphicsQuality; label: string; desc: string }>
                  ).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => updateSettings({ quality: q.id })}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer ${
                        settings.quality === q.id
                          ? 'bg-rose-600/15 border-rose-500 text-white'
                          : 'bg-[#0B0E17] border-white/10 text-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">{q.label}</p>
                      <p className="text-[11px] text-slate-400">{q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Volumen Motor V8</span>
                    <span className="font-mono-tabular text-white">
                      {settings.muted ? 'Silenciado' : `${Math.round(settings.volume * 100)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSettings({ muted: !settings.muted })}
                      className="p-2 rounded-lg bg-[#0B0E17] border border-white/15 text-slate-200 cursor-pointer"
                    >
                      {settings.muted ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.volume}
                      onChange={(e) =>
                        updateSettings({ volume: Number(e.target.value), muted: false })
                      }
                      className="flex-1 accent-rose-600"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-400 mb-2">
                    Unidades y Cámara por Defecto
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={settings.units}
                      onChange={(e) =>
                        updateSettings({ units: e.target.value as 'kmh' | 'mph' })
                      }
                      className="flex-1 rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2 text-sm text-white"
                    >
                      <option value="kmh">KM/H</option>
                      <option value="mph">MPH</option>
                    </select>
                    <select
                      value={settings.cameraMode}
                      onChange={(e) =>
                        updateSettings({ cameraMode: e.target.value as CameraMode })
                      }
                      className="flex-1 rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2 text-sm text-white"
                    >
                      <option value="chase">Persecución</option>
                      <option value="far">Lejana</option>
                      <option value="hood">Capó</option>
                      <option value="bumper">Parachoques</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#111520] border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-sky-400" />
                  <span>CONTROLES DE PC</span>
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { action: 'Acelerar', keys: 'W o Flecha Arriba' },
                    { action: 'Frenar / Reversa', keys: 'S o Flecha Abajo' },
                    { action: 'Girar a la izquierda', keys: 'A o Flecha Izquierda' },
                    { action: 'Girar a la derecha', keys: 'D o Flecha Derecha' },
                    { action: 'Freno de mano (Derrape)', keys: 'Espacio' },
                    { action: 'Cambiar cámara', keys: 'C' },
                    { action: 'Reubicar auto', keys: 'R' },
                    { action: 'Pausa', keys: 'Esc o P' },
                  ].map((c) => (
                    <div
                      key={c.action}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
                    >
                      <span className="text-slate-300">{c.action}</span>
                      <span className="font-mono-tabular text-xs font-semibold text-white bg-[#0B0E17] border border-white/10 rounded-md px-2.5 py-1">
                        {c.keys}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Guardar Datos de Piloto</p>
                    <p className="text-xs text-slate-400">
                      {authUser
                        ? `Sincronizado con tu cuenta (${authUser.username}) y esta PC.`
                        : 'Guarda tu auto, diseños, récords, campeonato y ajustes en esta PC.'}
                    </p>
                  </div>
                  <button
                    onClick={() => saveAllData(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Datos Ahora</span>
                  </button>
                </div>

                {saveNotice && (
                  <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 text-xs text-emerald-200 font-medium">
                    {saveNotice}
                  </div>
                )}

                {lastSavedAt && (
                  <p className="text-[11px] text-slate-500">
                    Último guardado: {new Date(lastSavedAt).toLocaleTimeString()}
                  </p>
                )}

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Aysén NASCAR by NexPlay</p>
                    <p className="text-xs text-slate-400">
                      Simulador NASCAR Web desarrollado por NexPlay Chile · by maxiLillo.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem(RECORDS_KEY);
                      localStorage.removeItem(CHAMP_KEY);
                      setRecords({});
                      setChampionship(
                        createInitialChampionship(settings.playerName, customization),
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    Restablecer Récords
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
