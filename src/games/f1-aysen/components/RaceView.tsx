import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Coins,
  Eye,
  EyeOff,
  Film,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { F1_POINTS_TABLE, formatKeyCode, formatMoney } from '../data/cars';
import { getCircuitById } from '../data/circuits';
import { audioEngine } from '../engine/audio';
import { RaceEngine } from '../engine/raceEngine';
import {
  CameraMode,
  CarConfig,
  ControlSettings,
  RaceSessionConfig,
  RacerTelemetry,
  TireCompound,
} from '../types/game';
import { formatLapTime, getTrackSvgGeometry } from '../utils/formatters';
import { useI18n } from '../utils/i18n';

export interface RaceRewardSummary {
  positionPrize: number;
  firstTrackBonus: number;
  totalEarned: number;
  newBalance: number;
}

interface RaceViewProps {
  session: RaceSessionConfig;
  playerId: string;
  playerName: string;
  playerCar: CarConfig;
  controls: ControlSettings;
  onlineWs: WebSocket | null;
  onToggleTrackHud: () => void;
  onToggleAudioMute?: (muted: boolean) => void;
  onExit: () => void;
  onRaceCompleted: (results: RacerTelemetry[]) => RaceRewardSummary;
  onTimeTrialLap?: (lapTimeMs: number, circuitId: string) => number;
}

const CAMERA_LABELS: Record<CameraMode, string> = {
  chase: 'Persecución',
  driver: 'Conductor',
  hood: 'Capot',
  floor: 'Piso',
  far: 'Panorámica',
};

const CAMERA_ORDER: CameraMode[] = ['driver', 'hood', 'floor', 'chase', 'far'];

function getTireStatus(tireWear: number) {
  if (tireWear >= 75) {
    return {
      color: 'red' as const,
      label: '¡Ruedas Rojas! Ve a los Pits',
      short: 'ROJO · IR A PITS',
      badgeClass: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
      barClass: 'bg-rose-500',
      dotClass: 'bg-rose-500',
    };
  }
  if (tireWear >= 40) {
    return {
      color: 'yellow' as const,
      label: 'Ruedas en Desgaste Medio',
      short: 'AMARILLO · MEDIO',
      badgeClass: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
      barClass: 'bg-amber-400',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    color: 'green' as const,
    label: 'Ruedas en Buen Estado',
    short: 'VERDE · BIEN',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
  };
}

export default function RaceView({
  session,
  playerId,
  playerName,
  playerCar,
  controls,
  onlineWs,
  onToggleTrackHud,
  onToggleAudioMute,
  onExit,
  onRaceCompleted,
  onTimeTrialLap,
}: RaceViewProps) {
  const { t } = useI18n();
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const circuit = useMemo(
    () => getCircuitById(session.circuitId),
    [session.circuitId]
  );

  const minimapSvg = useMemo(
    () => getTrackSvgGeometry(circuit, 180, 120, 14),
    [circuit]
  );

  const [hud, setHud] = useState<{
    racers: RacerTelemetry[];
    player: RacerTelemetry | null;
    player2: RacerTelemetry | null;
    countdownLights: number;
    raceStarted: boolean;
    raceFinished: boolean;
    cameraMode: CameraMode;
    cameraMode2: CameraMode;
  }>({
    racers: [],
    player: null,
    player2: null,
    countdownLights: 0,
    raceStarted: false,
    raceFinished: false,
    cameraMode: 'chase',
    cameraMode2: 'chase',
  });

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => controls.audio.muted);
  const [finalResults, setFinalResults] = useState<RacerTelemetry[] | null>(null);
  const [rewardSummary, setRewardSummary] = useState<RaceRewardSummary | null>(null);
  const [lapBanner, setLapBanner] = useState<string | null>(null);
  const [lapBanner2, setLapBanner2] = useState<string | null>(null);
  const [pitNotice, setPitNotice] = useState<string | null>(null);
  const [pitNotice2, setPitNotice2] = useState<string | null>(null);
  const [pitCompound, setPitCompound] = useState<TireCompound>(playerCar.tireCompound);
  const [pitCompound2, setPitCompound2] = useState<TireCompound>(
    session.player2Car?.tireCompound ?? 'medium'
  );
  const [pitStreet, setPitStreet] = useState<{
    pitRoadPoints: Array<{ x: number; z: number }>;
    pitBoxPos: { x: number; z: number };
  } | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  // Post-Race Video Replay UI state
  const [watchingReplay, setWatchingReplay] = useState(false);
  const [replayPlaying, setReplayPlaying] = useState(true);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [replayTimeMs, setReplayTimeMs] = useState(0);
  const [replayTotalMs, setReplayTotalMs] = useState(0);

  const completedRef = useRef(false);

  const submitLapRecord = (lapTimeMs: number, points = 0) => {
    fetch('/api/leaderboard/lap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverName: playerName,
        teamName: playerCar.teamName,
        circuitId: session.circuitId,
        lapTimeMs,
        tireCompound: playerCar.tireCompound,
        mode: session.mode,
        points,
      }),
    }).catch(() => {});
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    completedRef.current = false;
    setFinalResults(null);
    setRewardSummary(null);
    setWatchingReplay(false);
    setPaused(false);

    const engine = new RaceEngine({
      container,
      circuit,
      mode: session.mode,
      laps: session.laps,
      difficulty: session.difficulty,
      playerName,
      playerId,
      playerCar,
      splitScreen: session.splitScreen,
      tireWearEnabled: session.tireWearEnabled,
      player2Name: session.player2Name,
      player2Car: session.player2Car,
      controls: controlsRef.current,
      onlinePlayers: session.onlinePlayers,
      callbacks: {
        onHudUpdate: (snapshot) => {
          setHud(snapshot);
          if (engineRef.current) {
            const rp = engineRef.current.getReplayProgress();
            setReplayTimeMs(rp.currentMs);
          }
        },
        onLapComplete: (lapTimeMs, lapNumber, isBest, playerNum = 1) => {
          const lapCash =
            playerNum === 1 && session.mode === 'timetrial' && onTimeTrialLap
              ? onTimeTrialLap(lapTimeMs, session.circuitId)
              : 0;
          const text = `Vuelta ${lapNumber}: ${formatLapTime(lapTimeMs)}${
            isBest ? ' · Mejor Vuelta' : ''
          }${lapCash > 0 ? ` · +${formatMoney(lapCash)}` : ''}`;
          if (playerNum === 2) {
            setLapBanner2(text);
            setTimeout(() => setLapBanner2(null), 2800);
          } else {
            setLapBanner(text);
            setTimeout(() => setLapBanner(null), 2800);
            submitLapRecord(lapTimeMs, 0);
          }
        },
        onRaceFinish: (results, replayDurMs) => {
          if (completedRef.current) return;
          completedRef.current = true;
          setReplayTotalMs(replayDurMs);
          setFinalResults(results);
          const pRes = results.find((r) => r.isPlayer);
          const pts =
            pRes && pRes.position <= F1_POINTS_TABLE.length
              ? F1_POINTS_TABLE[pRes.position - 1]
              : 0;
          if (pRes?.bestLapMs) {
            submitLapRecord(pRes.bestLapMs, pts);
          }
          if (session.mode === 'online' && onlineWs?.readyState === WebSocket.OPEN) {
            onlineWs.send(
              JSON.stringify({
                type: 'player:finished',
                finishTimeMs: pRes?.finishTimeMs ?? 0,
              })
            );
          }
          const reward = onRaceCompleted(results);
          setRewardSummary(reward);
        },
        onPauseToggle: () => {
          if (!completedRef.current) {
            setPaused((prev) => {
              const next = !prev;
              engine.setPaused(next);
              return next;
            });
          }
        },
        onOnlineStateEmit: (state) => {
          if (onlineWs && onlineWs.readyState === WebSocket.OPEN) {
            onlineWs.send(JSON.stringify({ type: 'player:state', state }));
          }
        },
      },
    });

    engineRef.current = engine;
    setPitStreet(engine.getPitStreetInfo());

    const handleWsMessage = (event: MessageEvent) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.type === 'race:countdown') {
        engine.setExternalCountdown(
          Number(msg.lights) || 0,
          Boolean(msg.go)
        );
      } else if (msg.type === 'player:state' && msg.playerId !== playerId) {
        engine.updateRemotePlayerState(
          String(msg.playerId),
          msg.state as Parameters<RaceEngine['updateRemotePlayerState']>[1]
        );
      }
    };

    if (onlineWs) {
      onlineWs.addEventListener('message', handleWsMessage);
    }

    const onKeyMute = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        const nextMuted = audioEngine.toggleMute();
        setMuted(nextMuted);
        onToggleAudioMute?.(nextMuted);
      }
    };
    window.addEventListener('keydown', onKeyMute);

    return () => {
      window.removeEventListener('keydown', onKeyMute);
      if (onlineWs) {
        onlineWs.removeEventListener('message', handleWsMessage);
      }
      engine.dispose();
      engineRef.current = null;
    };
  }, [circuit, session, playerId, playerName, playerCar, restartKey]);

  useEffect(() => {
    engineRef.current?.updateControls(controls);
    setMuted(controls.audio.muted);
  }, [controls]);

  const handleTogglePause = () => {
    if (finalResults) return;
    setPaused((prev) => {
      const next = !prev;
      engineRef.current?.setPaused(next);
      return next;
    });
  };

  const handleToggleMute = () => {
    const nextMuted = audioEngine.toggleMute();
    setMuted(nextMuted);
    onToggleAudioMute?.(nextMuted);
  };

  const handleCycleCamera = () => {
    engineRef.current?.cycleCamera();
  };

  const handleSelectCamera = (mode: CameraMode) => {
    engineRef.current?.setCameraMode(mode);
  };

  const handleRestart = () => {
    setRestartKey((k) => k + 1);
  };

  const handleStartVideoReplay = () => {
    if (!engineRef.current) return;
    setWatchingReplay(true);
    setReplayPlaying(true);
    setReplaySpeed(1);
    engineRef.current.startReplay();
  };

  const handleExitVideoReplay = () => {
    engineRef.current?.stopReplay();
    setWatchingReplay(false);
  };

  const handleExit = () => {
    if (onlineWs && onlineWs.readyState === WebSocket.OPEN) {
      onlineWs.send(JSON.stringify({ type: 'room:leave' }));
      onlineWs.close();
    }
    onExit();
  };

  const triggerPitNotice = (msg: string, playerNum: 1 | 2 = 1) => {
    if (playerNum === 2) {
      setPitNotice2(msg);
      setTimeout(() => setPitNotice2(null), 2200);
    } else {
      setPitNotice(msg);
      setTimeout(() => setPitNotice(null), 2200);
    }
  };

  const isSplitScreen = Boolean(session.splitScreen && hud.player2);
  const player = hud.player;
  const player2 = hud.player2;
  const rpmPct = player
    ? Math.min(100, Math.max(8, (player.rpm / 13500) * 100))
    : 20;
  const rpmPct2 = player2
    ? Math.min(100, Math.max(8, (player2.rpm / 13500) * 100))
    : 20;

  const tireWear = player?.tireWear ?? 0;
  const tireStatus = getTireStatus(tireWear);
  const tireWear2 = player2?.tireWear ?? 0;
  const tireStatus2 = getTireStatus(tireWear2);

  return (
    <div className="relative w-screen h-screen bg-[#080B10] overflow-hidden select-none">
      {/* Isolated WebGL Viewport */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Split-screen vertical center divider */}
      {!watchingReplay && isSplitScreen && (
        <div className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 z-10 w-[2px] bg-white/30" />
      )}

      {/* Split-Screen Top Badges (Left = J1, Right = J2) */}
      {!watchingReplay && isSplitScreen && player && player2 && (
        <>
          <div className="fixed top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-[#080B10]/90 px-3 py-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: player.carConfig.primaryColor }}
            />
            <span className="font-bold text-white truncate max-w-[120px]">
              J1 · {player.name}
            </span>
            <span className="font-mono-tabular font-bold text-rose-400">
              P{player.position}/{hud.racers.length}
            </span>
            <span className="font-mono-tabular text-slate-300">
              {session.mode === 'timetrial'
                ? `V${player.lap}`
                : `V${player.lap}/${session.laps}`}
            </span>
            <button
              type="button"
              onClick={() => engineRef.current?.cycleCamera(1)}
              className="ml-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:bg-white/20 cursor-pointer"
            >
              {CAMERA_LABELS[hud.cameraMode]} (C)
            </button>
          </div>

          <div className="fixed top-3 left-[calc(50%+12px)] z-10 flex items-center gap-2 rounded-lg border border-sky-500/40 bg-[#080B10]/90 px-3 py-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: player2.carConfig.primaryColor }}
            />
            <span className="font-bold text-white truncate max-w-[120px]">
              J2 · {player2.name}
            </span>
            <span className="font-mono-tabular font-bold text-sky-400">
              P{player2.position}/{hud.racers.length}
            </span>
            <span className="font-mono-tabular text-slate-300">
              {session.mode === 'timetrial'
                ? `V${player2.lap}`
                : `V${player2.lap}/${session.laps}`}
            </span>
            <button
              type="button"
              onClick={() => engineRef.current?.cycleCamera(2)}
              className="ml-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:bg-white/20 cursor-pointer"
            >
              {CAMERA_LABELS[hud.cameraMode2]} (K)
            </button>
          </div>

          {/* Per-half status banners in split-screen */}
          <div className="pointer-events-none fixed top-14 left-0 w-1/2 z-10 flex flex-col items-center gap-1.5 px-3">
            {lapBanner && (
              <div className="rounded-md border border-amber-400/40 bg-[#080B10]/92 px-3 py-1 font-mono-tabular text-xs font-bold text-amber-300">
                {lapBanner}
              </div>
            )}
            {player.finished && !hud.raceFinished && (
              <div className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                ¡META! Esperando a {player2.name}...
              </div>
            )}
            {player.nearPitZone && !player.inPitStop && (
              <div className="rounded-md bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
                Pits a la derecha (B)
              </div>
            )}
            {tireWear >= 75 && !player.inPitStop && hud.raceStarted && (
              <div className="rounded-md bg-rose-600/95 px-2.5 py-0.5 text-[11px] font-bold text-white">
                Ruedas ROJAS · Entra a Pits (B)
              </div>
            )}
          </div>

          <div className="pointer-events-none fixed top-14 left-1/2 w-1/2 z-10 flex flex-col items-center gap-1.5 px-3">
            {lapBanner2 && (
              <div className="rounded-md border border-amber-400/40 bg-[#080B10]/92 px-3 py-1 font-mono-tabular text-xs font-bold text-amber-300">
                {lapBanner2}
              </div>
            )}
            {player2.finished && !hud.raceFinished && (
              <div className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                ¡META! Esperando a {player.name}...
              </div>
            )}
            {player2.nearPitZone && !player2.inPitStop && (
              <div className="rounded-md bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
                Pits a la derecha (N)
              </div>
            )}
            {tireWear2 >= 75 && !player2.inPitStop && hud.raceStarted && (
              <div className="rounded-md bg-rose-600/95 px-2.5 py-0.5 text-[11px] font-bold text-white">
                Ruedas ROJAS · Entra a Pits (N)
              </div>
            )}
          </div>
        </>
      )}

      {/* Top-Left Live Timing Tower (Positions 1..9 — 1P Mode) */}
      {!watchingReplay && !isSplitScreen && controls.showTrackHud && (
        <div className="pointer-events-none fixed top-4 left-4 z-10 w-56 rounded-lg border border-white/10 bg-[#080B10]/88 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-white/10 pb-1.5 mb-1.5">
            <span className="truncate">{circuit.shortName}</span>
            <span className="font-mono-tabular text-white shrink-0">
              {session.mode === 'timetrial'
                ? `Vuelta ${player?.lap ?? 1}`
                : `Vuelta ${player?.lap ?? 1}/${session.laps}`}
            </span>
          </div>
          <div className="space-y-0.5">
            {hud.racers.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded px-2 py-0.5 text-[11px] ${
                  r.isPlayer
                    ? 'bg-rose-600/30 text-white font-semibold'
                    : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-3.5 font-mono-tabular text-slate-400">
                    {r.position}
                  </span>
                  <span
                    className="w-1.5 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: r.carConfig.primaryColor }}
                  />
                  <span className="truncate">{r.name}</span>
                </div>
                <span
                  className={`font-mono-tabular text-[10px] ${
                    r.inPitStop ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {r.finished ? 'META' : r.inPitStop ? 'PITS' : `${r.speedKmh}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top-Center Starting Lights & Notifications */}
      {!watchingReplay && (
        <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          {hud.countdownLights >= 0 && !hud.raceStarted && (
            <div className="rounded-xl border border-white/15 bg-[#080B10]/92 px-5 py-3 flex flex-col items-center gap-2 shadow-xl">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((idx) => {
                  const lit = idx <= hud.countdownLights;
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full border-2 ${
                        lit
                          ? 'bg-red-500 border-red-300 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                          : 'bg-red-950/70 border-white/15'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-300">
                {hud.countdownLights === 0
                  ? 'PREPARADOS EN PARRILLA'
                  : 'ATENCIÓN AL SEMÁFORO'}
              </div>
            </div>
          )}

          {hud.countdownLights === -1 && (
            <div className="rounded-lg bg-emerald-600 px-6 py-2 font-display text-xl font-bold tracking-wider text-white shadow-lg">
              ¡LARGADA!
            </div>
          )}

          {!isSplitScreen && lapBanner && (
            <div className="rounded-lg border border-amber-400/40 bg-[#080B10]/92 px-5 py-2 font-mono-tabular text-sm font-bold text-amber-300">
              {lapBanner}
            </div>
          )}

          {!isSplitScreen && player && player.damageLevel > 15 && !player.inPitStop && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-[#080B10]/92 px-3 py-1 text-xs font-semibold text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {player.damageLevel >= 75
                  ? `Parachoque destruido (${player.damageLevel}%) · Ve a Pits`
                  : `Parachoque dañado (${player.damageLevel}%)`}
              </span>
            </div>
          )}

          {!isSplitScreen && player && player.rearDamageLevel > 15 && !player.inPitStop && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-[#080B10]/92 px-3 py-1 text-xs font-semibold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Zona trasera dañada ({player.rearDamageLevel}%)</span>
            </div>
          )}

          {player?.safetyCarActive && hud.raceStarted && (
            <div className="inline-flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg">
              <span>AUTO AMARILLO EN PISTA · Todos los F1 van más lento</span>
            </div>
          )}

          {player?.rescueTruckActive && (
            <div className="inline-flex items-center gap-2 rounded-md border border-orange-300 bg-orange-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg">
              <span>CAMIÓN RÁPIDO · Llevando F1 a Calle de los Pits...</span>
            </div>
          )}

          {!isSplitScreen && player && tireWear >= 75 && !player.inPitStop && !player.rescueTruckActive && hud.raceStarted && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-500 bg-rose-600/95 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>Ruedas en ROJO · Vas lento · Entra a Calle de Pits (B)</span>
            </div>
          )}

          {!isSplitScreen && player?.nearPitZone && !player.inPitStop && !player.rescueTruckActive && (
            <div className="rounded-md border border-emerald-400/50 bg-emerald-600/90 px-3 py-1 text-xs font-bold text-white">
              Calle de Pits a tu derecha · Entra por el carril amarillo o presiona B
            </div>
          )}

          {!isSplitScreen && player?.offTrack && hud.raceStarted && !player.inPitStop && !player.rescueTruckActive && (
            <div className="rounded-md bg-amber-600/90 px-3 py-1 text-xs font-semibold text-white">
              Fuera de pista · Vuelve al asfalto
            </div>
          )}
        </div>
      )}

      {/* Top-Right Camera Quick Selector & Audio/Pause */}
      {!watchingReplay && (
        <div className="fixed top-3 right-3 z-10 flex items-center gap-1.5">
          {!isSplitScreen && (
            <>
              <div className="hidden xl:flex items-center gap-1 rounded-lg border border-white/10 bg-[#080B10]/85 p-1">
                {CAMERA_ORDER.map((cm) => (
                  <button
                    key={cm}
                    type="button"
                    onClick={() => handleSelectCamera(cm)}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                      hud.cameraMode === cm
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {CAMERA_LABELS[cm]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCycleCamera}
                className="xl:hidden inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#080B10]/85 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#131B26] cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>{CAMERA_LABELS[hud.cameraMode]}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleTrackHud}
            title={
              controls.showTrackHud
                ? 'Desactivar info de F1 en pista (km/h, posición, DRS)'
                : 'Mostrar info de F1 en pista'
            }
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold cursor-pointer ${
              controls.showTrackHud
                ? 'border-white/10 bg-[#080B10]/85 text-slate-200 hover:bg-[#131B26]'
                : 'border-rose-500/40 bg-rose-600/90 text-white hover:bg-rose-500'
            }`}
          >
            {controls.showTrackHud ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ocultar Info</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mostrar Info</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="rounded-lg border border-white/10 bg-[#080B10]/85 p-2 text-slate-200 hover:bg-[#131B26] cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleTogglePause}
            aria-label="Pausar carrera"
            className="rounded-lg border border-white/10 bg-[#080B10]/85 p-2 text-slate-200 hover:bg-[#131B26] cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Live Minimap (Bottom-Left in 1P, Bottom-Center in Split-Screen) */}
      {!watchingReplay && (
        <div
          className={`pointer-events-none fixed z-10 rounded-xl border border-white/10 bg-[#080B10]/88 space-y-1 ${
            isSplitScreen
              ? 'bottom-3 left-1/2 -translate-x-1/2 p-2'
              : 'bottom-4 left-4 p-3'
          }`}
        >
          <svg
            viewBox="0 0 180 120"
            className={isSplitScreen ? 'w-32 h-20 overflow-visible' : 'w-44 h-28 overflow-visible'}
          >
            <path
              d={minimapSvg.pathData}
              fill="none"
              stroke="#334155"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {pitStreet && pitStreet.pitRoadPoints.length > 1 && (
              <>
                <path
                  d={pitStreet.pitRoadPoints
                    .map((pt, idx) => {
                      const px = pt.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX;
                      const py = pt.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY;
                      return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={pitStreet.pitBoxPos.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX}
                  cy={pitStreet.pitBoxPos.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY}
                  r={3.5}
                  fill="#22C55E"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                />
                <text
                  x={pitStreet.pitBoxPos.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX + 5}
                  y={pitStreet.pitBoxPos.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY + 3}
                  fill="#4ADE80"
                  fontSize="7"
                  fontWeight="bold"
                >
                  PITS
                </text>
              </>
            )}

            {player?.safetyCarActive && player.safetyCarPos && (
              <circle
                cx={player.safetyCarPos.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX}
                cy={player.safetyCarPos.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY}
                r={4.4}
                fill="#FACC15"
                stroke="#0F172A"
                strokeWidth={1.3}
              />
            )}

            {player?.rescueTruckActive && player.rescueTruckPos && (
              <rect
                x={player.rescueTruckPos.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX - 3.5}
                y={player.rescueTruckPos.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY - 3.5}
                width={7}
                height={7}
                rx={1.5}
                fill="#F97316"
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />
            )}

            {hud.racers.map((r) => {
              const cx =
                r.x * minimapSvg.bounds.scale + minimapSvg.bounds.offsetX;
              const cy =
                r.z * minimapSvg.bounds.scale + minimapSvg.bounds.offsetY;
              const isHuman = r.isPlayer || r.isPlayer2;
              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r={isHuman ? 4.8 : 3.1}
                  fill={
                    r.isPlayer
                      ? '#F43F5E'
                      : r.isPlayer2
                        ? '#38BDF8'
                        : r.carConfig.primaryColor
                  }
                  stroke="#FFFFFF"
                  strokeWidth={isHuman ? 1.5 : 0.7}
                />
              );
            })}
          </svg>
          <div className="flex items-center justify-between text-[9px] text-slate-400 gap-2">
            {isSplitScreen ? (
              <>
                <span className="text-rose-400 font-bold">● J1</span>
                <span className="text-sky-400 font-bold">● J2</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-0.5 bg-yellow-400 inline-block" />
                Calle Pits
              </span>
            )}
            {player?.safetyCarActive && (
              <span className="text-yellow-300 font-bold">Auto Amarillo</span>
            )}
            {player?.rescueTruckActive && (
              <span className="text-orange-400 font-bold">Camión</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom-Center Dynamic Keyboard & Mouse Orbit Guide (1P mode) */}
      {!watchingReplay && !isSplitScreen && !player?.inPitStop && controls.showTrackHud && (
        <div className="pointer-events-none hidden lg:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-10 items-center gap-2.5 rounded-lg border border-white/10 bg-[#080B10]/85 px-4 py-1.5 text-[11px] text-slate-400">
          <span>{formatKeyCode(controls.keyboard.accelerate)} Acelerar</span>
          <span>·</span>
          <span>{formatKeyCode(controls.keyboard.handbrake)} Derrapar</span>
          <span>·</span>
          <span>{formatKeyCode(controls.keyboard.drs)} DRS</span>
          <span>·</span>
          <span>B Pits</span>
          <span>·</span>
          <span>Clic Der. Rotar Vista</span>
        </div>
      )}

      {/* Interactive Team Pit Stop Panel for P1 */}
      {!watchingReplay && !finalResults && player?.inPitStop && (
        <div
          className={`fixed bottom-4 z-20 rounded-xl border border-white/15 bg-[#0B1018]/95 p-4 shadow-2xl space-y-3 ${
            isSplitScreen
              ? 'left-3 w-[calc(50%-24px)]'
              : 'left-1/2 -translate-x-1/2 w-[min(680px,95vw)] p-5 space-y-4'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Pits · {playerName}
                </h3>
                {!isSplitScreen && (
                  <p className="text-xs text-slate-400">
                    Indica a tus mecánicos qué piezas cambiar o reparar en tu F1
                  </p>
                )}
              </div>
            </div>
            {pitNotice && (
              <span className="rounded-md bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {pitNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Ruedas</span>
                <span className="inline-flex items-center gap-1 font-mono-tabular">
                  <span className={`w-2 h-2 rounded-full ${tireStatus.dotClass}`} />
                  <span>{100 - tireWear}%</span>
                </span>
              </div>
              <div className="flex gap-1">
                {(['soft', 'medium', 'hard'] as TireCompound[]).map((cmp) => (
                  <button
                    key={cmp}
                    type="button"
                    onClick={() => setPitCompound(cmp)}
                    className={`flex-1 rounded border py-0.5 text-[10px] font-semibold cursor-pointer ${
                      pitCompound === cmp
                        ? 'border-sky-400 bg-sky-500/20 text-white'
                        : 'border-white/10 bg-[#0A0E14] text-slate-400'
                    }`}
                  >
                    {cmp === 'soft' ? 'Blando' : cmp === 'medium' ? 'Medio' : 'Duro'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceTires(pitCompound, 1);
                  triggerPitNotice('¡Ruedas nuevas (100%)!', 1);
                }}
                className="w-full rounded-lg bg-emerald-600 py-1.5 font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Cambiar Ruedas
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Parachoque</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    player.damageLevel > 20 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {player.damageLevel}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceFrontBumper(1);
                  triggerPitNotice('¡Parachoque nuevo!', 1);
                }}
                className="w-full rounded-lg bg-sky-600 py-1.5 font-bold text-white hover:bg-sky-500 cursor-pointer"
              >
                Cambiar Parachoque
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Trasera</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    player.rearDamageLevel > 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {player.rearDamageLevel}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceRearZone(1);
                  triggerPitNotice('¡Trasera restaurada!', 1);
                }}
                className="w-full rounded-lg bg-amber-500 py-1.5 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                Cambiar Trasera
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                engineRef.current?.pitServiceAll(1);
                triggerPitNotice('¡Servicio completo!', 1);
              }}
              className="rounded-lg border border-white/15 bg-[#161F2C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1E2A3B] cursor-pointer"
            >
              Cambiar Todo
            </button>

            <button
              type="button"
              onClick={() => engineRef.current?.exitPitStop(1)}
              className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              Salir a Pista (B)
            </button>
          </div>
        </div>
      )}

      {/* Interactive Team Pit Stop Panel for P2 in Split-Screen */}
      {!watchingReplay && !finalResults && isSplitScreen && player2?.inPitStop && (
        <div className="fixed bottom-4 right-3 z-20 w-[calc(50%-24px)] rounded-xl border border-sky-400/25 bg-[#0B1018]/95 p-4 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <h3 className="font-display text-base font-bold text-white">
                Pits · {player2.name}
              </h3>
            </div>
            {pitNotice2 && (
              <span className="rounded-md bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {pitNotice2}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Ruedas</span>
                <span className="inline-flex items-center gap-1 font-mono-tabular">
                  <span className={`w-2 h-2 rounded-full ${tireStatus2.dotClass}`} />
                  <span>{100 - tireWear2}%</span>
                </span>
              </div>
              <div className="flex gap-1">
                {(['soft', 'medium', 'hard'] as TireCompound[]).map((cmp) => (
                  <button
                    key={cmp}
                    type="button"
                    onClick={() => setPitCompound2(cmp)}
                    className={`flex-1 rounded border py-0.5 text-[10px] font-semibold cursor-pointer ${
                      pitCompound2 === cmp
                        ? 'border-sky-400 bg-sky-500/20 text-white'
                        : 'border-white/10 bg-[#0A0E14] text-slate-400'
                    }`}
                  >
                    {cmp === 'soft' ? 'Blando' : cmp === 'medium' ? 'Medio' : 'Duro'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceTires(pitCompound2, 2);
                  triggerPitNotice('¡Ruedas nuevas (100%)!', 2);
                }}
                className="w-full rounded-lg bg-emerald-600 py-1.5 font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Cambiar Ruedas
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Parachoque</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    player2.damageLevel > 20 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {player2.damageLevel}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceFrontBumper(2);
                  triggerPitNotice('¡Parachoque nuevo!', 2);
                }}
                className="w-full rounded-lg bg-sky-600 py-1.5 font-bold text-white hover:bg-sky-500 cursor-pointer"
              >
                Cambiar Parachoque
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#121923] p-2.5 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Trasera</span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    player2.rearDamageLevel > 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {player2.rearDamageLevel}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.pitServiceRearZone(2);
                  triggerPitNotice('¡Trasera restaurada!', 2);
                }}
                className="w-full rounded-lg bg-amber-500 py-1.5 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                Cambiar Trasera
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                engineRef.current?.pitServiceAll(2);
                triggerPitNotice('¡Servicio completo!', 2);
              }}
              className="rounded-lg border border-white/15 bg-[#161F2C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1E2A3B] cursor-pointer"
            >
              Cambiar Todo
            </button>

            <button
              type="button"
              onClick={() => engineRef.current?.exitPitStop(2)}
              className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 cursor-pointer"
            >
              Salir a Pista (N)
            </button>
          </div>
        </div>
      )}

      {/* Telemetry HUD — 1P Bottom-Right OR Split-Screen Left (J1) + Right (J2) */}
      {!watchingReplay && player && !player.inPitStop && controls.showTrackHud && (
        <div
          className={`fixed bottom-3 z-10 rounded-xl border border-white/10 bg-[#080B10]/92 ${
            isSplitScreen
              ? 'left-3 w-56 p-3 space-y-2'
              : 'bottom-4 right-4 w-76 p-4 space-y-3'
          }`}
        >
          {!isSplitScreen && (
            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-[11px] text-slate-400">Posición</div>
                <div className="font-display text-2xl font-bold text-white tabular-nums">
                  P{player.position}
                  <span className="text-sm font-normal text-slate-400">
                    /{hud.racers.length}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Cronómetro</div>
                <div className="font-mono-tabular text-base font-bold text-white">
                  {formatLapTime(player.currentLapMs)}
                </div>
                <div className="font-mono-tabular text-[11px] text-amber-400">
                  Mejor {formatLapTime(player.bestLapMs)}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-mono-tabular font-bold text-white tracking-tight ${
                  isSplitScreen ? 'text-2xl' : 'text-4xl'
                }`}
              >
                {player.speedKmh}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">km/h</span>
            </div>

            <div className="flex items-center gap-2">
              {player.drifting && !isSplitScreen && (
                <span className="text-[11px] font-bold text-amber-400 tracking-wider">
                  DERRAPE
                </span>
              )}
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/15 bg-[#121822] px-2.5 py-1">
                <span className="text-[9px] text-slate-400">Marcha</span>
                <span
                  className={`font-display font-bold text-rose-400 leading-none ${
                    isSplitScreen ? 'text-lg' : 'text-2xl'
                  }`}
                >
                  {player.gear === 0 ? 'R' : player.gear}
                </span>
              </div>
            </div>
          </div>

          {/* Color-coded Tire Wear Indicator (Verde / Amarillo / Rojo) */}
          <div
            className={`rounded-lg border px-2.5 py-1.5 space-y-1 ${tireStatus.badgeClass}`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="inline-flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${tireStatus.dotClass}`} />
                <span>{tireStatus.short}</span>
              </span>
              <span className="font-mono-tabular">{100 - tireWear}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${tireStatus.barClass}`}
                style={{ width: `${Math.max(4, 100 - tireWear)}%` }}
              />
            </div>
            {!isSplitScreen && (
              <div className="text-[10px] opacity-90">{tireStatus.label}</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono-tabular text-slate-400">
              <span>Parachoque: {player.damageLevel}%</span>
              <span>Trasera: {player.rearDamageLevel}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  rpmPct > 86
                    ? 'bg-sky-400'
                    : rpmPct > 68
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${rpmPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1">
              <span
                className={`text-[10px] font-bold tracking-wider ${
                  player.drsActive ? 'text-sky-400' : 'text-slate-400'
                }`}
              >
                DRS
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${player.drsCharge}%` }}
                />
              </div>
              <span className="font-mono-tabular text-[10px] text-slate-300">
                {player.drsCharge}%
              </span>
            </div>

            {hud.raceStarted && !hud.raceFinished && (
              <button
                type="button"
                onClick={() => engineRef.current?.enterPitStop(1)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer ${
                  tireWear >= 75 || player.damageLevel > 35 || player.rearDamageLevel > 35
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'border border-white/15 bg-[#141C28] text-slate-200 hover:bg-[#1E293B]'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Pits (B)</span>
              </button>
            )}
          </div>

          {isSplitScreen && (
            <div className="text-[9px] text-slate-400 pt-0.5 border-t border-white/10">
              WASD · Espacio Derrape · Shift Izq DRS
            </div>
          )}
        </div>
      )}

      {/* Split-Screen P2 Bottom-Right Telemetry HUD */}
      {!watchingReplay && isSplitScreen && player2 && !player2.inPitStop && controls.showTrackHud && (
        <div className="fixed bottom-3 right-3 z-10 w-56 rounded-xl border border-sky-400/20 bg-[#080B10]/92 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-tabular text-2xl font-bold text-white tracking-tight">
                {player2.speedKmh}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">km/h</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-white/15 bg-[#121822] px-2.5 py-1">
              <span className="text-[9px] text-slate-400">Marcha</span>
              <span className="font-display text-lg font-bold text-sky-400 leading-none">
                {player2.gear === 0 ? 'R' : player2.gear}
              </span>
            </div>
          </div>

          <div
            className={`rounded-lg border px-2.5 py-1.5 space-y-1 ${tireStatus2.badgeClass}`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="inline-flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${tireStatus2.dotClass}`} />
                <span>{tireStatus2.short}</span>
              </span>
              <span className="font-mono-tabular">{100 - tireWear2}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${tireStatus2.barClass}`}
                style={{ width: `${Math.max(4, 100 - tireWear2)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono-tabular text-slate-400">
              <span>Parachoque: {player2.damageLevel}%</span>
              <span>Trasera: {player2.rearDamageLevel}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  rpmPct2 > 86
                    ? 'bg-sky-400'
                    : rpmPct2 > 68
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${rpmPct2}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1">
              <span
                className={`text-[10px] font-bold tracking-wider ${
                  player2.drsActive ? 'text-sky-400' : 'text-slate-400'
                }`}
              >
                DRS
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${player2.drsCharge}%` }}
                />
              </div>
              <span className="font-mono-tabular text-[10px] text-slate-300">
                {player2.drsCharge}%
              </span>
            </div>

            {hud.raceStarted && !hud.raceFinished && (
              <button
                type="button"
                onClick={() => engineRef.current?.enterPitStop(2)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold cursor-pointer ${
                  tireWear2 >= 75 || player2.damageLevel > 35 || player2.rearDamageLevel > 35
                    ? 'bg-sky-600 text-white hover:bg-sky-500'
                    : 'border border-white/15 bg-[#141C28] text-slate-200 hover:bg-[#1E293B]'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Pits (N)</span>
              </button>
            )}
          </div>

          <div className="text-[9px] text-slate-400 pt-0.5 border-t border-white/10">
            Flechas · Enter Derrape · Shift Der DRS
          </div>
        </div>
      )}

      {/* Video Replay Overlay Player (when watching post-race video!) */}
      {watchingReplay && (
        <>
          <div className="pointer-events-none fixed top-5 left-6 z-20 rounded-lg border border-white/15 bg-[#080B10]/90 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <Film className="w-4 h-4" />
              <span>REPETICIÓN EN VIDEO DE TU CARRERA</span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {circuit.name} · {playerName}
            </div>
          </div>

          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-[min(920px,95vw)] rounded-xl border border-white/15 bg-[#080B10]/95 p-4 space-y-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs text-slate-300 w-16">
                {formatLapTime(replayTimeMs)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(100, replayTotalMs)}
                value={replayTimeMs}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReplayTimeMs(val);
                  engineRef.current?.seekReplay(val);
                }}
                className="flex-1 accent-rose-500"
              />
              <span className="font-mono-tabular text-xs text-slate-400 w-16 text-right">
                {formatLapTime(replayTotalMs)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !replayPlaying;
                    setReplayPlaying(next);
                    engineRef.current?.setReplayPlaying(next);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
                >
                  {replayPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar Video</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Reproducir</span>
                    </>
                  )}
                </button>

                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setReplaySpeed(spd);
                      engineRef.current?.setReplaySpeed(spd);
                    }}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-mono-tabular font-semibold cursor-pointer ${
                      replaySpeed === spd
                        ? 'bg-sky-600 text-white'
                        : 'bg-[#131A24] text-slate-300 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {CAMERA_ORDER.map((cm) => (
                  <button
                    key={cm}
                    type="button"
                    onClick={() => handleSelectCamera(cm)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                      hud.cameraMode === cm
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {CAMERA_LABELS[cm]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExitVideoReplay}
                className="rounded-lg border border-white/15 bg-[#151D29] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
              >
                Ver Clasificación (1–9)
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pause Modal */}
      {paused && !finalResults && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#0F141C] p-6 space-y-5 text-center">
            <h2 className="font-display text-2xl font-bold text-white">
              {t.race.pauseTitle}
            </h2>
            <p className="text-xs text-slate-400">{circuit.name}</p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                {t.race.resume}
              </button>
              {session.mode !== 'online' && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="w-full rounded-lg border border-white/15 bg-[#151D29] py-2.5 text-sm font-semibold text-white hover:bg-[#1D2736] cursor-pointer"
                >
                  {t.race.restart}
                </button>
              )}
              <button
                type="button"
                onClick={onToggleTrackHud}
                className="w-full rounded-lg border border-white/15 bg-[#151D29] py-2.5 text-sm font-semibold text-white hover:bg-[#1D2736] cursor-pointer"
              >
                {controls.showTrackHud ? t.race.hudHide : t.race.hudShow}
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                {t.race.exit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Post-Race 1..9 Results Modal + Video Replay Button */}
      {finalResults && !watchingReplay && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl border border-white/15 bg-[#0F141C] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Clasificación Final (1° al {finalResults.length}°)
                  </h2>
                  <div className="text-xs text-slate-400">
                    {circuit.name} · {session.laps} vueltas
                  </div>
                </div>
              </div>

              {replayTotalMs > 0 && (
                <button
                  type="button"
                  onClick={handleStartVideoReplay}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>Ver Video de mi Carrera</span>
                </button>
              )}
            </div>

            {rewardSummary && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-300">
                      Premio de Carrera: +{formatMoney(rewardSummary.totalEarned)}
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      Puesto: +{formatMoney(rewardSummary.positionPrize)}
                      {rewardSummary.firstTrackBonus > 0
                        ? ` · Bono nueva pista: +${formatMoney(rewardSummary.firstTrackBonus)}`
                        : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono-tabular">
                  <div className="text-[11px] text-slate-400">Saldo guardado</div>
                  <div className="text-sm font-bold text-white">
                    {formatMoney(rewardSummary.newBalance)}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 pr-3 font-medium">Lugar</th>
                    <th className="py-2 pr-3 font-medium">Piloto</th>
                    <th className="py-2 pr-3 font-medium">Escudería</th>
                    <th className="py-2 pr-3 font-medium text-right">
                      Mejor Vuelta
                    </th>
                    <th className="py-2 pr-3 font-medium text-right">
                      Tiempo Total
                    </th>
                    <th className="py-2 font-medium text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {finalResults.map((r) => {
                    const pts =
                      r.position <= F1_POINTS_TABLE.length
                        ? F1_POINTS_TABLE[r.position - 1]
                        : 0;
                    return (
                      <tr
                        key={r.id}
                        className={
                          r.isPlayer
                            ? 'bg-rose-500/15 text-white font-semibold'
                            : r.isPlayer2
                              ? 'bg-sky-500/15 text-white font-semibold'
                              : 'text-slate-300'
                        }
                      >
                        <td className="py-2 pr-3 font-mono-tabular font-bold">
                          {r.position}°
                        </td>
                        <td className="py-2 pr-3 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm inline-block"
                            style={{ backgroundColor: r.carConfig.primaryColor }}
                          />
                          <span>
                            {r.name}
                            {isSplitScreen && r.isPlayer ? ' (J1)' : ''}
                            {isSplitScreen && r.isPlayer2 ? ' (J2)' : ''}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-400">
                          {r.carConfig.teamName}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono-tabular text-amber-300">
                          {formatLapTime(r.bestLapMs)}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono-tabular">
                          {formatLapTime(r.finishTimeMs)}
                        </td>
                        <td className="py-2 text-right font-mono-tabular font-bold">
                          +{pts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
              {session.mode !== 'online' && (
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#151D29] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Correr de Nuevo</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExit}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Volver al Menú</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
