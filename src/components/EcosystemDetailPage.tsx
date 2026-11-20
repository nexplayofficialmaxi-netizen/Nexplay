import {ArrowLeft, ArrowRight, CheckCircle2, Info, Play} from 'lucide-react';
import type {EcosystemPillar, LocalizedContent} from '../data/nexplayData';
import {ResilientImage} from './ResilientImage';

interface EcosystemDetailPageProps {
  activePillarId: string;
  onSelectPillar: (pillarId: string) => void;
  onBackToPortal: () => void;
  onConsultTopic: (topic: string) => void;
  onLaunchGame: (gameId: 'f1-aysen' | 'nexracing') => void;
  ecosystemCopy: LocalizedContent['ecosystem'];
  nexosCopy: LocalizedContent['nexos'];
  gamesCopy: LocalizedContent['games'];
}

export function EcosystemDetailPage({
  activePillarId,
  onSelectPillar,
  onBackToPortal,
  onConsultTopic,
  onLaunchGame,
  ecosystemCopy,
  nexosCopy,
  gamesCopy,
}: EcosystemDetailPageProps) {
  const pillar: EcosystemPillar =
    ecosystemCopy.pillars.find((p) => p.id === activePillarId) ?? ecosystemCopy.pillars[0];

  const isNexOS = pillar.id === 'sistemas-operativos';
  const isGames = pillar.id === 'videojuegos';

  return (
    <div className="min-h-[70vh] bg-slate-50 dark:bg-[#090C11] py-10 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Top bar: Return to NexPlay + Switch across all 5 Ecosystem pages */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onBackToPortal}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#11161E] hover:bg-slate-100 dark:hover:bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--accent-text)]" />
            {ecosystemCopy.backToPortalLabel}
          </button>

          <div
            role="tablist"
            aria-label={ecosystemCopy.switchAreaLabel}
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11161E] p-1"
          >
            {ecosystemCopy.pillars.map((item) => {
              const active = item.id === pillar.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectPillar(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-main)] text-[var(--accent-on)] font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {item.index} {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Header for Selected Ecosystem Area */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-[var(--accent-text)]">
              {pillar.index} {pillar.categoryLabel}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pillar.title}
            </h1>
            <p className="mt-2 text-base font-medium text-[var(--accent-text)]">
              {pillar.subtitle}
            </p>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {pillar.pageOverview}
            </p>
          </div>

          {pillar.allowConsult && pillar.inquiryTopic && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onConsultTopic(pillar.inquiryTopic!)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] transition-colors cursor-pointer"
              >
                {ecosystemCopy.consultAbout} {pillar.title}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Special notice when viewing Familia NexOS */}
        {isNexOS && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {nexosCopy.imageCaptionKicker}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {nexosCopy.unavailableTitle}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {nexosCopy.unavailableDescription}
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {nexosCopy.unavailableNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compact ordered games showcase when viewing Videojuegos */}
        {isGames && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {gamesCopy.items.map((game) => (
              <article
                key={game.id}
                className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] overflow-hidden flex flex-col"
              >
                {game.image && (
                  <div className="h-36 w-full bg-slate-900 overflow-hidden relative shrink-0">
                    <ResilientImage
                      src={game.image}
                      alt={game.imageAlt ?? game.name}
                      fallbackTitle={game.name}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-[var(--accent-text)]">
                      {game.releaseDate}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {game.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {game.tagline}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.07]">
                    {game.playableApp ? (
                      <button
                        type="button"
                        onClick={() => onLaunchGame(game.playableApp!)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--accent-on)] transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {game.playCtaLabel ?? game.name}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConsultTopic(game.name)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                      >
                        {gamesCopy.ctaPrefix} {game.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Structured Capabilities & Highlights */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {ecosystemCopy.capabilitiesTitle}
            </h2>
            <div className="mt-5 space-y-4">
              {pillar.pageCapabilities.map((cap, idx) => (
                <div
                  key={cap.title}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0D1219] p-4"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    <span className="font-mono text-xs text-[var(--accent-text)] mr-2">
                      0{idx + 1}.
                    </span>
                    {cap.title}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cap.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {ecosystemCopy.highlightsTitle}
            </h2>
            <ul className="mt-5 space-y-3.5">
              {pillar.highlights.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
