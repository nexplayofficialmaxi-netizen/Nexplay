import type {LocalizedContent} from '../data/nexplayData';

interface FooterProps {
  nav: LocalizedContent['nav'];
  copy: LocalizedContent['footer'];
  onOpenSettings: () => void;
  onNavigateSection?: (hash: string) => void;
}

export function Footer({nav, copy, onOpenSettings, onNavigateSection}: FooterProps) {
  const handleLink = (hash: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigateSection) return;
    e.preventDefault();
    onNavigateSection(hash);
  };

  return (
    <footer className="border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#090C11] py-10">
      <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <a
            href="#inicio"
            onClick={(e) => handleLink('#inicio', e)}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Nex<span className="text-[var(--accent-text)]">Play</span>
          </a>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy.tagline}</p>
        </div>

        <nav
          aria-label="Enlaces del pie de página"
          className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          <a
            href="#ecosistema"
            onClick={(e) => handleLink('#ecosistema', e)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            {nav.ecosystem}
          </a>
          <a
            href="#nexos"
            onClick={(e) => handleLink('#nexos', e)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            {nav.nexos}
          </a>
          <a
            href="#juegos"
            onClick={(e) => handleLink('#juegos', e)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            {nav.games}
          </a>
          <a
            href="#mision"
            onClick={(e) => handleLink('#mision', e)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            {nav.mission}
          </a>
          <button
            type="button"
            onClick={onOpenSettings}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {nav.settings}
          </button>
          <a
            href="mailto:nexplayofficialmaxi@gmail.com"
            className="hover:text-[var(--accent-text)] transition-colors whitespace-nowrap"
          >
            nexplayofficialmaxi@gmail.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
