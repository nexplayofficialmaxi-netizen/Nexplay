import {
  ArrowRight,
  Flag,
  Globe,
  SlidersHorizontal,
  Timer,
  Trophy,
  Wrench,
} from 'lucide-react';
import { formatMoney, TEAM_PRESETS } from '../data/cars';
import { FEATURED_CIRCUITS } from '../data/circuits';
import { CarConfig, CircuitId, GameMode, SavedProgress } from '../types/game';
import { formatLapTime, getTrackSvgGeometry } from '../utils/formatters';
import { useI18n } from '../utils/i18n';
import ShowroomCanvas from './ShowroomCanvas';

interface HomeViewProps {
  carConfig: CarConfig;
  progress: SavedProgress;
  onSelectMode: (mode: GameMode) => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onQuickCircuit: (circuitId: CircuitId) => void;
}

const MODES_LIST: Array<{
  id: GameMode;
  title: string;
  subtitle: string;
  detail: string;
  icon: typeof Trophy;
}> = [
  {
    id: 'career',
    title: 'Modo Carrera',
    subtitle: 'Campeonato Patagónico IA',
    detail:
      'Compite contra 8 rivales de IA (9 autos en parrilla) en carreras oficiales a 3 vueltas, suma puntos y gana dinero para tu garaje.',
    icon: Trophy,
  },
  {
    id: 'online',
    title: 'Modo Online',
    subtitle: 'Requiere Iniciar Sesión',
    detail:
      'Inicia sesión solo para el modo multijugador, únete a servidores en tiempo real o crea salas en cualquiera de las 900 pistas.',
    icon: Globe,
  },
  {
    id: 'timetrial',
    title: 'Contrarreloj',
    subtitle: 'Vuelta Rápida y Récords',
    detail:
      'Pista libre para perfeccionar tus derrapes, marcar récords en la clasificación y ganar $3,500 por cada vuelta completada.',
    icon: Timer,
  },
  {
    id: 'quickrace',
    title: 'Carrera Rápida',
    subtitle: '900 Pistas · 3 Vueltas',
    detail:
      'Corre en cualquiera de las 900 pistas para ganar dinero, comprar nuevos Fórmula 1 y guardar todo tu progreso automáticamente.',
    icon: Flag,
  },
];

export default function HomeView({
  carConfig,
  progress,
  onSelectMode,
  onOpenGarage,
  onOpenSettings,
  onOpenLeaderboard,
  onQuickCircuit,
}: HomeViewProps) {
  const { t } = useI18n();
  const localizedModes = [
    { id: 'career' as const, title: t.home.careerTitle, subtitle: t.home.careerSub, detail: t.home.careerDetail, icon: Trophy },
    { id: 'online' as const, title: t.home.onlineTitle, subtitle: t.home.onlineSub, detail: t.home.onlineDetail, icon: Globe },
    { id: 'timetrial' as const, title: t.home.timeTrialTitle, subtitle: t.home.timeTrialSub, detail: t.home.timeTrialDetail, icon: Timer },
    { id: 'quickrace' as const, title: t.home.quickRaceTitle, subtitle: t.home.quickRaceSub, detail: t.home.quickRaceDetail, icon: Flag },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-14">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 py-4">
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-400">
            <span className="text-rose-400 font-semibold">NexPlay Studios</span>
            <span aria-hidden="true">·</span>
            <span>Región de Aysén, Chile</span>
            <span aria-hidden="true">·</span>
            <span>F1</span>
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]"
            style={{ textWrap: 'balance' }}
          >
            {t.home.heroTitle}
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-xl">
            {t.home.heroDesc}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onSelectMode('quickrace')}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.home.exploreTracks}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenGarage}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#121822] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-[#192230] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>{t.home.shopGarage}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#121822] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-[#192230] transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>{t.home.settingsSound}</span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{t.home.leaderboard}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="font-display text-2xl font-bold text-amber-300 tabular-nums">
                {formatMoney(progress.credits)}
              </div>
              <div className="text-xs text-slate-400">{t.home.yourMoney}</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white tabular-nums">
                {progress.unlockedCarIds.length}/{TEAM_PRESETS.length}
              </div>
              <div className="text-xs text-slate-400">{t.home.unlockedCars}</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white tabular-nums">
                {progress.completedCircuits.length}/900
              </div>
              <div className="text-xs text-slate-400">{t.home.tracksDriven}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 relative min-h-[380px] lg:min-h-[460px] rounded-xl border border-white/10 bg-[#090D12] overflow-hidden">
          <ShowroomCanvas carConfig={carConfig} cameraPreset="hero" autoRotate />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3.5 bg-[#080B10]/85 border-t border-white/10">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">
                {carConfig.teamName}
              </span>
              <span className="mx-2 text-slate-500">·</span>
              <span>
                #{carConfig.driverNumber} {carConfig.chassisName}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Arrastra para rotar el monoplaza en 3D
            </div>
          </div>
        </div>
      </section>

      {/* 4 Game Modes */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-white">
            {t.home.gameModes}
          </h2>
          <p className="text-sm text-slate-400">
            {t.home.modesSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {localizedModes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className="group flex flex-col justify-between text-left rounded-xl border border-white/10 bg-[#0F141C] p-6 hover:border-rose-500/60 hover:bg-[#131A24] transition-colors cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-medium text-slate-400">
                      {m.subtitle}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {m.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {m.detail}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rose-400 group-hover:text-rose-300">
                  <span>{t.home.selectMode}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Aysén Circuits */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-white">
            {t.home.featuredCircuits}
          </h2>
          <button
            type="button"
            onClick={() => onSelectMode('quickrace')}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            {t.home.viewAll900}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURED_CIRCUITS.map((circuit) => {
            const svg = getTrackSvgGeometry(circuit, 220, 120, 14);
            return (
              <div
                key={circuit.id}
                className="flex flex-col sm:flex-row items-stretch justify-between gap-5 rounded-xl border border-white/10 bg-[#0F141C] p-5"
              >
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-sky-400 font-medium">
                      {circuit.location}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mt-0.5">
                      {circuit.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {circuit.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-3 text-xs text-slate-300 tabular-nums">
                      <span>3 {t.race.lap}</span>
                      <span aria-hidden="true">·</span>
                      <span>{circuit.lengthKm.toFixed(2)} km</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular text-slate-400">
                        {formatLapTime(circuit.baseRecordMs)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickCircuit(circuit.id)}
                      className="rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {t.home.raceHere}
                    </button>
                  </div>
                </div>

                <div className="sm:w-48 shrink-0 flex items-center justify-center rounded-lg border border-white/5 bg-[#080B10] p-2">
                  <svg
                    viewBox="0 0 220 120"
                    className="w-full h-28"
                    aria-label={`Trazado ${circuit.name}`}
                  >
                    <path
                      d={svg.pathData}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                    <path
                      d={svg.pathData}
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <span>F1 Simulador Aysén · Desarrollado por NexPlay</span>
        <span>
          W/↑ Acelerar · Espacio Freno de Mano (Derrape) · Shift DRS · C Cámaras · Mando USB/BT
        </span>
      </footer>
    </div>
  );
}
