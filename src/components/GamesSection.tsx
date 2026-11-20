import {useState} from 'react';
import {ArrowRight, Play} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';
import {ResilientImage} from './ResilientImage';

interface GamesSectionProps {
  onSelectGame: (gameName: string) => void;
  onLaunchGame?: (gameId: 'f1-aysen' | 'nexracing') => void;
  copy: LocalizedContent['games'];
}

export function GamesSection({onSelectGame, onLaunchGame, copy}: GamesSectionProps) {
  const [selectedModes, setSelectedModes] = useState<Record<string, string>>(() =>
    Object.fromEntries(copy.items.map((game) => [game.id, game.modes[0].id]))
  );

  const handleModeChange = (gameId: string, modeId: string) => {
    setSelectedModes((prev) => ({...prev, [gameId]: modeId}));
  };

  return (
    <section
      id="juegos"
      className="border-b border-slate-200 dark:border-white/[0.07] py-16 lg:py-24 bg-slate-50 dark:bg-[#090C11]"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--accent-text)]">{copy.kicker}</p>
          <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            {copy.title}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {copy.items.map((game, idx) => {
            const activeModeId = selectedModes[game.id] ?? game.modes[0].id;
            const activeMode =
              game.modes.find((m) => m.id === activeModeId) ?? game.modes[0];

            return (
              <article
                key={game.id}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] flex flex-col"
              >
                {game.image && (
                  <div className="relative h-40 sm:h-44 w-full bg-slate-900 overflow-hidden shrink-0">
                    <ResilientImage
                      src={game.image}
                      alt={game.imageAlt ?? game.name}
                      fallbackTitle={game.name}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090C11]/85 via-transparent to-transparent"
                    />
                    <span className="absolute left-3.5 bottom-3 text-[11px] font-semibold text-emerald-300 tabular-nums">
                      {copy.projectPrefix} 0{idx + 1} · {game.releaseDate}
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {game.discipline}
                    </p>
                    <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {game.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm font-semibold text-[var(--accent-text)]">
                      {game.tagline}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {game.description}
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-white/[0.07] pt-3.5">
                      {game.specs.map((spec) => (
                        <div key={spec.label}>
                          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                            {spec.label}
                          </dt>
                          <dd className="mt-0.5 text-xs font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 border-t border-slate-200 dark:border-white/[0.07] pt-3.5">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                        {copy.modesLabel}
                      </p>
                      <div
                        role="tablist"
                        aria-label={`${copy.modesLabel} ${game.name}`}
                        className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#090C11] p-1"
                      >
                        {game.modes.map((mode) => {
                          const isSelected = mode.id === activeMode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              role="tab"
                              aria-selected={isSelected}
                              onClick={() => handleModeChange(game.id, mode.id)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                                isSelected
                                  ? 'bg-[var(--accent-main)] text-[var(--accent-on)] font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                              }`}
                            >
                              {mode.name}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[2.5rem]">
                        {activeMode.detail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.07] flex flex-col gap-2">
                    {game.playableApp && onLaunchGame ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onLaunchGame(game.playableApp!)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--accent-on)] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                        >
                          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                          {game.playCtaLabel ?? game.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectGame(game.name)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                        >
                          {copy.ctaPrefix} {game.name}
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectGame(game.name)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--accent-on)] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                      >
                        {copy.ctaPrefix} {game.name}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
