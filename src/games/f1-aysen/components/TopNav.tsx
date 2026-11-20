import { ArrowLeft, Coins } from 'lucide-react';
import { formatMoney } from '../data/cars';
import { useI18n } from '../utils/i18n';

export type AppTab =
  | 'home'
  | 'modes'
  | 'garage'
  | 'online'
  | 'settings'
  | 'leaderboard';

interface TopNavProps {
  activeTab: AppTab;
  credits: number;
  onNavigate: (tab: AppTab) => void;
  onQuickStart: () => void;
  onExitToNexPlay?: () => void;
}

export default function TopNav({
  activeTab,
  credits,
  onNavigate,
  onQuickStart,
  onExitToNexPlay,
}: TopNavProps) {
  const { t } = useI18n();
  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'home', label: t.nav.home },
    { id: 'modes', label: t.nav.tracks },
    { id: 'garage', label: t.nav.garage },
    { id: 'online', label: t.nav.online },
    { id: 'settings', label: t.nav.settings },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#080B10]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-3.5">
        <div className="flex items-center gap-3 shrink-0">
          {onExitToNexPlay && (
            <button
              type="button"
              onClick={onExitToNexPlay}
              title="Volver a NexPlay"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>NexPlay</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="font-display text-lg font-bold tracking-wider text-white whitespace-nowrap shrink-0 cursor-pointer hover:text-rose-400 transition-colors"
          >
            F1 SIMULADOR AYSÉN
          </button>
        </div>

        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-rose-500" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('garage')}
            title="Dinero disponible para comprar monoplazas en el Garaje"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-[#121822] px-3 py-1.5 text-xs font-mono-tabular font-bold text-amber-300 hover:border-amber-400/50 transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatMoney(credits)}</span>
          </button>

          <button
            type="button"
            onClick={onQuickStart}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold tracking-wide text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.raceNow}
          </button>
        </div>
      </div>

      <div className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-white/5 px-4 py-2 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === item.id
                ? 'text-rose-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
