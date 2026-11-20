import {ArrowRight} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';

interface HeroSectionProps {
  copy: LocalizedContent['hero'];
}

export function HeroSection({copy}: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="border-b border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#090C11]"
    >
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-14 lg:pt-16 lg:pb-20">
        <div className="max-w-3xl py-2">
          <p className="text-sm font-medium text-[var(--accent-text)] tracking-wide mb-4">
            {copy.kicker}
          </p>

          <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white text-balance">
            {copy.headline}
          </h1>

          <p className="mt-6 max-w-2xl text-base lg:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href="#juegos"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-5 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
            >
              {copy.primaryCta}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>

            <a
              href="#nexos"
              className="inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-[var(--accent-text)] hover:opacity-80 transition-opacity duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
            >
              {copy.secondaryCta}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Full-width 4-column summary strip directly below the hero */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {copy.pillarsStrip.map((item) => (
            <div key={item.title}>
              <p className="text-xs font-medium text-[var(--accent-text)]">{item.kicker}</p>
              <p className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
