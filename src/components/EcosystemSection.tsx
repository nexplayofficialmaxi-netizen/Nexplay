import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {
  type EcosystemCategory,
  type EcosystemPillar,
  type LocalizedContent,
} from '../data/nexplayData';
import {ResilientImage} from './ResilientImage';

interface EcosystemSectionProps {
  onSelectTopic: (topic: string) => void;
  onOpenEcosystemPage: (pillarId: string) => void;
  copy: LocalizedContent['ecosystem'];
}

export function EcosystemSection({
  onSelectTopic,
  onOpenEcosystemPage,
  copy,
}: EcosystemSectionProps) {
  const [activeFilter, setActiveFilter] = useState<EcosystemCategory>('todos');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('videojuegos');

  const visiblePillars =
    activeFilter === 'todos'
      ? copy.pillars
      : copy.pillars.filter((item) => item.category === activeFilter);

  const activePillar: EcosystemPillar =
    visiblePillars.find((item) => item.id === selectedPillarId) ?? visiblePillars[0];

  const handleCardAction = (pillar: EcosystemPillar) => {
    onOpenEcosystemPage(pillar.id);
  };

  return (
    <section
      id="ecosistema"
      className="border-b border-slate-200 dark:border-white/[0.07] py-16 lg:py-24 bg-slate-50 dark:bg-[#090C11]"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--accent-text)]">{copy.kicker}</p>
            <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {copy.title}
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {copy.subtitle}
            </p>
          </div>

          {/* Interactive filter segmented control */}
          <div
            role="tablist"
            aria-label={copy.kicker}
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11161E] p-1 self-start lg:self-auto"
          >
            {copy.filters.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
                    isActive
                      ? 'bg-[var(--accent-main)] text-[var(--accent-on)] font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePillars.map((pillar, idx) => {
            const isWide = activeFilter === 'todos' && (idx === 0 || idx === 3);
            const isSelected = activePillar?.id === pillar.id;

            return (
              <article
                key={pillar.id}
                className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#11161E] transition-colors duration-150 overflow-hidden ${
                  isWide ? 'lg:col-span-2' : 'lg:col-span-1'
                } ${
                  isSelected
                    ? 'border-[var(--accent-border)]'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {pillar.featuredImage ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                    <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {pillar.index} {pillar.categoryLabel}
                        </p>
                        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {pillar.title}
                        </h3>
                        <p className="mt-1.5 text-sm font-medium text-[var(--accent-text)]">
                          {pillar.subtitle}
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPillarId(pillar.id)}
                          className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
                        >
                          {isSelected ? copy.detailsVisible : copy.showDetails}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardAction(pillar)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
                        >
                          {pillar.ctaLabel}
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-5 relative min-h-[220px]">
                      <ResilientImage
                        src={pillar.featuredImage}
                        alt={pillar.featuredAlt ?? pillar.title}
                        fallbackTitle={pillar.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 flex flex-col justify-between h-full">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {pillar.index} {pillar.categoryLabel}
                      </p>
                      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium text-[var(--accent-text)]">
                        {pillar.subtitle}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPillarId(pillar.id)}
                        className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
                      >
                        {isSelected ? copy.detailsVisible : copy.showDetails}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCardAction(pillar)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
                      >
                        {pillar.ctaLabel}
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Selected Pillar Deep-Dive Bar */}
        {activePillar && (
          <div className="mt-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0D1219] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-[var(--accent-text)]">
                  {copy.focusLabel} · {activePillar.categoryLabel}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {activePillar.title}: {copy.focusHeadingSuffix}
                </h3>
              </div>
              {activePillar.allowConsult && activePillar.inquiryTopic && (
                <button
                  type="button"
                  onClick={() => onSelectTopic(activePillar.inquiryTopic!)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                >
                  {copy.consultAbout} {activePillar.title}
                </button>
              )}
            </div>

            <ul className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-slate-200 dark:border-white/[0.07]">
              {activePillar.highlights.map((point, index) => (
                <li
                  key={point}
                  className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                >
                  <span className="font-mono text-xs text-[var(--accent-text)] mr-2">
                    0{index + 1}.
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
