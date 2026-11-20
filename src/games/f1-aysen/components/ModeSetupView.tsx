import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Columns2,
  Disc3,
  Flag,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
  Trophy,
  User,
} from 'lucide-react';
import {
  FIRST_TIME_TRACK_BONUS,
  formatMoney,
  RACE_PRIZE_BY_POS,
  TEAM_PRESETS,
} from '../data/cars';
import { CIRCUITS, FEATURED_CIRCUITS, getCircuitById } from '../data/circuits';
import {
  AIDifficulty,
  CareerState,
  CircuitId,
  GameMode,
  RaceSessionConfig,
  RegionCategory,
} from '../types/game';
import { formatLapTime, getTrackSvgGeometry } from '../utils/formatters';
import { useI18n } from '../utils/i18n';

interface ModeSetupViewProps {
  initialMode: GameMode;
  initialCircuitId: CircuitId;
  playerName: string;
  playerCarId?: string;
  completedCircuits: string[];
  bestLapsByCircuit: Record<string, number>;
  onChangePlayerName: (name: string) => void;
  careerState: CareerState;
  onResetCareer: () => void;
  onStartRace: (config: RaceSessionConfig) => void;
  onGoOnline: () => void;
  onOpenLeaderboard: () => void;
}

const REGION_FILTERS: Array<{ id: 'all' | RegionCategory; label: string }> = [
  { id: 'all', label: 'Todo Chile (900)' },
  { id: 'aysen', label: 'Aysén' },
  { id: 'los_lagos', label: 'Los Lagos y Los Ríos' },
  { id: 'magallanes', label: 'Magallanes' },
  { id: 'araucania_biobio', label: 'Araucanía, Biobío y Maule' },
  { id: 'centro_norte', label: 'Centro y Norte de Chile' },
];

const PAGE_SIZE = 12;

export default function ModeSetupView({
  initialMode,
  initialCircuitId,
  playerName,
  playerCarId,
  completedCircuits,
  bestLapsByCircuit,
  onChangePlayerName,
  careerState,
  onResetCareer,
  onStartRace,
  onGoOnline,
  onOpenLeaderboard,
}: ModeSetupViewProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GameMode>(
    initialMode === 'online' ? 'quickrace' : initialMode
  );
  const [circuitId, setCircuitId] = useState<CircuitId>(initialCircuitId);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('pro');
  const [tireWearEnabled, setTireWearEnabled] = useState(true);
  const [splitScreen, setSplitScreen] = useState(false);
  const [player2Name, setPlayer2Name] = useState('Jugador 2');
  const [player2CarId, setPlayer2CarId] = useState<string>(
    () =>
      TEAM_PRESETS.find((t) => t.id !== (playerCarId ?? 'nexplay_gp'))?.id ??
      TEAM_PRESETS[2].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | RegionCategory>('all');
  const [page, setPage] = useState(0);

  const filteredCircuits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CIRCUITS.filter((c) => {
      if (regionFilter !== 'all' && c.region !== regionFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        `#${c.index}`.includes(q)
      );
    });
  }, [searchQuery, regionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCircuits.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedCircuits = filteredCircuits.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const careerCircuit =
    FEATURED_CIRCUITS[careerState.currentRoundIndex % FEATURED_CIRCUITS.length];
  const activeCircuit =
    mode === 'career' ? careerCircuit : getCircuitById(circuitId);

  const svg = useMemo(
    () => getTrackSvgGeometry(activeCircuit, 320, 170, 18),
    [activeCircuit]
  );

  const player2Car =
    TEAM_PRESETS.find((t) => t.id === player2CarId) ?? TEAM_PRESETS[2];

  const handleLaunch = () => {
    onStartRace({
      mode,
      circuitId: activeCircuit.id,
      laps: mode === 'timetrial' ? 99 : 3, // Standard 3 laps across tracks
      difficulty,
      tireWearEnabled,
      splitScreen,
      player2Name: splitScreen ? player2Name.trim() || 'Jugador 2' : undefined,
      player2Car: splitScreen ? player2Car : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {t.modes.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.modes.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#121822] p-1 border border-white/10">
            {(
              [
                { id: 'quickrace', label: t.modes.quickrace },
                { id: 'career', label: t.modes.career },
                { id: 'timetrial', label: t.modes.timetrial },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`rounded-md px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === tab.id
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onGoOnline}
              className="rounded-md px-4 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 whitespace-nowrap transition-colors cursor-pointer"
            >
              {t.modes.online}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0F141C] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.modes.leaderboard}</span>
          </button>
        </div>
      </div>

      {/* Tire Wear Toggle BEFORE Choosing the Map */}
      <section className="rounded-xl border border-white/10 bg-[#0F141C] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white">
              {t.modes.tireWearTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.modes.tireWearHint}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTireWearEnabled(true)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer ${
              tireWearEnabled
                ? 'border-amber-400 bg-amber-500/15 text-white'
                : 'border-white/10 bg-[#080B10] text-slate-300 hover:border-white/25'
            }`}
          >
            <Disc3 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold">{t.modes.tireWearOnTitle}</div>
              <div className="text-[11px] text-slate-400">
                {t.modes.tireWearOnDesc}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTireWearEnabled(false)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer ${
              !tireWearEnabled
                ? 'border-emerald-400 bg-emerald-500/15 text-white'
                : 'border-white/10 bg-[#080B10] text-slate-300 hover:border-white/25'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold">{t.modes.tireWearOffTitle}</div>
              <div className="text-[11px] text-slate-400">
                {t.modes.tireWearOffDesc}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {mode !== 'career' ? (
            <div className="space-y-4">
              {/* Search + Region Filter for 900 circuits */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.modes.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    className="w-full rounded-lg border border-white/15 bg-[#0F141C] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="text-xs text-slate-400 tabular-nums">
                  {filteredCircuits.length} {t.modes.tracksFound}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {REGION_FILTERS.map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => {
                      setRegionFilter(rf.id);
                      setPage(0);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                      regionFilter === rf.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-[#0F141C] border border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pagedCircuits.map((c) => {
                  const selected = c.id === circuitId;
                  const done = completedCircuits.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCircuitId(c.id)}
                      className={`rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-white/10 bg-[#0F141C] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-sky-400 font-medium">
                        <span className="truncate">{c.location}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {done && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="font-mono-tabular text-slate-500">
                            #{c.index}
                          </span>
                        </div>
                      </div>
                      <div className="font-display text-sm font-bold text-white mt-0.5 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mt-1.5 tabular-nums">
                        <span>
                          {c.lengthKm.toFixed(2)} km · {c.corners} curvas
                        </span>
                        <span className="text-amber-300 font-mono-tabular">
                          {done
                            ? `Mejor ${formatLapTime(bestLapsByCircuit[c.id] ?? null)}`
                            : `+${formatMoney(RACE_PRIZE_BY_POS[0])}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0F141C] px-3 py-1.5 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.modes.prev}</span>
                </button>
                <span className="font-mono-tabular">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0F141C] px-3 py-1.5 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <span>{t.modes.next}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#0F141C] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">
                      Campeonato Aysén — Temporada {careerState.season}
                    </h2>
                    <div className="text-xs text-slate-400">
                      Fecha {careerState.currentRoundIndex + 1} de{' '}
                      {FEATURED_CIRCUITS.length} · Próximo GP:{' '}
                      {careerCircuit.name} (3 vueltas)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onResetCareer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Temporada</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 pr-3 font-medium">Pos</th>
                      <th className="py-2 pr-3 font-medium">Piloto</th>
                      <th className="py-2 pr-3 font-medium">Escudería</th>
                      <th className="py-2 pr-3 font-medium text-right">
                        Victorias
                      </th>
                      <th className="py-2 font-medium text-right">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...careerState.standings]
                      .sort((a, b) => b.points - a.points)
                      .map((driver, idx) => (
                        <tr
                          key={driver.id}
                          className={`border-b border-white/5 ${
                            driver.isPlayer
                              ? 'bg-rose-500/10 text-white'
                              : 'text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 pr-3 font-mono-tabular font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-sm inline-block"
                              style={{ backgroundColor: driver.color }}
                            />
                            <span>{driver.name}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-400">
                            {driver.teamName}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono-tabular">
                            {driver.wins}
                          </td>
                          <td className="py-2.5 text-right font-mono-tabular font-bold text-white">
                            {driver.points}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Race Parameters (3 laps standard + 2P Split-Screen Multiplayer vs Bots) */}
          <div className="rounded-xl border border-white/10 bg-[#0F141C] p-5 space-y-5">
            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-300">
                {t.modes.playerModeTitle}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSplitScreen(false)}
                  className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    !splitScreen
                      ? 'border-rose-500 bg-rose-500/15 text-white'
                      : 'border-white/10 bg-[#080B10] text-slate-300 hover:border-white/25'
                  }`}
                >
                  <User className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{t.modes.onePlayer}</div>
                    <div className="text-[11px] text-slate-400">
                      {mode === 'timetrial'
                        ? t.modes.timetrial
                        : 'vs 8 Bots F1'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitScreen(true)}
                  className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    splitScreen
                      ? 'border-sky-500 bg-sky-500/15 text-white'
                      : 'border-white/10 bg-[#080B10] text-slate-300 hover:border-white/25'
                  }`}
                >
                  <Columns2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {t.modes.splitScreen}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {mode === 'timetrial'
                        ? '2P'
                        : '2P vs 7 Bots F1'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="pilot-name"
                  className="block text-xs font-medium text-slate-300"
                >
                  {splitScreen ? t.modes.pilot1Name : t.modes.pilotName}
                </label>
                <input
                  id="pilot-name"
                  type="text"
                  maxLength={20}
                  value={playerName}
                  onChange={(e) => onChangePlayerName(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3 py-2 text-sm text-white"
                />
              </div>

              {mode !== 'timetrial' ? (
                <>
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-300">
                      {t.modes.officialDistance}
                    </span>
                    <div className="rounded-lg border border-white/10 bg-[#080B10] px-3 py-2 text-sm font-semibold text-white">
                      {splitScreen
                        ? '3 · 2P + 7 Bots'
                        : '3 · 9 F1'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-300">
                      {t.modes.aiDifficulty}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'rookie', label: t.modes.rookie },
                          { id: 'pro', label: t.modes.pro },
                          { id: 'legend', label: t.modes.legend },
                        ] as const
                      ).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDifficulty(d.id)}
                          className={`rounded-md py-2 text-xs font-semibold cursor-pointer ${
                            difficulty === d.id
                              ? 'bg-rose-600 text-white'
                              : 'bg-[#080B10] text-slate-400 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center gap-3 text-xs text-slate-300 bg-[#080B10] rounded-lg px-4 py-3 border border-white/5">
                  <Timer className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    {splitScreen
                      ? '2P'
                      : t.modes.timetrial}
                  </span>
                </div>
              )}
            </div>

            {splitScreen && (
              <div className="rounded-lg border border-sky-500/30 bg-[#080B10] p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pilot2-name"
                      className="block text-xs font-medium text-sky-300"
                    >
                      {t.modes.pilot2Name}
                    </label>
                    <input
                      id="pilot2-name"
                      type="text"
                      maxLength={20}
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0F141C] px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pilot2-car"
                      className="block text-xs font-medium text-sky-300"
                    >
                      {t.modes.pilot2Car}
                    </label>
                    <select
                      id="pilot2-car"
                      value={player2CarId}
                      onChange={(e) => setPlayer2CarId(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0F141C] px-3 py-2 text-sm text-white"
                    >
                      {TEAM_PRESETS.map((t) => (
                        <option key={t.id} value={t.id}>
                          #{t.driverNumber} {t.teamName} ({t.chassisName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-white/10">
                  <div>
                    <span className="font-bold text-rose-400">Jugador 1 (Izq.):</span>{' '}
                    W/A/S/D · Espacio Derrape · Shift Izq DRS · B Pits · C Cámara
                  </div>
                  <div>
                    <span className="font-bold text-sky-400">Jugador 2 (Der.):</span>{' '}
                    Flechas ↑↓←→ · Enter Derrape · Shift Der DRS · N Pits · K Cámara
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Track Preview & Launch */}
        <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-5 sticky top-20">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-sky-400">
              <span>{activeCircuit.location}</span>
              <span className="font-mono-tabular text-slate-400">
                Pista #{activeCircuit.index} / 900
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mt-0.5">
              {activeCircuit.name}
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {activeCircuit.description}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#080B10] p-4 flex items-center justify-center">
            <svg viewBox="0 0 320 170" className="w-full h-44">
              <path
                d={svg.pathData}
                fill="none"
                stroke="#1E293B"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              <path
                d={svg.pathData}
                fill="none"
                stroke="#E11D48"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center border-y border-white/10 py-3.5">
            <div>
              <div className="font-mono-tabular text-base font-bold text-white">
                {activeCircuit.lengthKm.toFixed(2)} km
              </div>
              <div className="text-[11px] text-slate-400">{t.modes.length}</div>
            </div>
            <div>
              <div className="font-mono-tabular text-base font-bold text-white">
                {activeCircuit.corners}
              </div>
              <div className="text-[11px] text-slate-400">{t.modes.corners}</div>
            </div>
            <div>
              <div className="font-mono-tabular text-base font-bold text-amber-400">
                {formatLapTime(
                  bestLapsByCircuit[activeCircuit.id] ?? activeCircuit.baseRecordMs
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {bestLapsByCircuit[activeCircuit.id]
                  ? t.modes.yourRecord
                  : t.modes.baseRecord}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-500/10 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Coins className="w-4 h-4 shrink-0" />
              <span>
                {t.modes.firstPrize}: {formatMoney(RACE_PRIZE_BY_POS[0])}
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono-tabular">
              {tireWearEnabled
                ? t.modes.tireWearOnTitle
                : t.modes.tireWearOffTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLaunch}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 py-3.5 text-sm font-bold tracking-wide text-white hover:bg-rose-500 transition-colors cursor-pointer"
          >
            <Flag className="w-4 h-4" />
            <span>
              {splitScreen
                ? mode === 'timetrial'
                  ? `${t.modes.launchTimeTrial} · ${activeCircuit.shortName}`
                  : t.modes.launch2P
                : mode === 'timetrial'
                  ? `${t.modes.launchTimeTrial} · ${activeCircuit.shortName}`
                  : t.modes.launch1P}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
