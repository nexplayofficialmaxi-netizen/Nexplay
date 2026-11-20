import {Info} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';

interface NexOSSectionProps {
  copy: LocalizedContent['nexos'];
}

export function NexOSSection({copy}: NexOSSectionProps) {
  return (
    <section
      id="nexos"
      className="border-b border-slate-200 dark:border-white/[0.07] py-16 lg:py-24 bg-slate-100/70 dark:bg-[#0C1017]"
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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3">
                <Info
                  className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-1"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {copy.imageCaptionKicker}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {copy.unavailableTitle}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {copy.unavailableDescription}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] p-4 sm:p-5">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {copy.unavailableNote}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
              {copy.plannedTitle}
            </p>
            <ul className="space-y-3.5">
              {copy.plannedBullets.map((item, idx) => (
                <li
                  key={item}
                  className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                >
                  <span className="font-mono text-xs text-[var(--accent-text)] mr-2">
                    0{idx + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
