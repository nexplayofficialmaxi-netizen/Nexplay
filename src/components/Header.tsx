import {useState} from 'react';
import {Menu, User, UserCheck, X} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';
import type {PortalAuthUser} from './PortalAuthModal';

interface HeaderProps {
  onNavigateContact: (topic?: string) => void;
  onNavigateSection: (hash: string) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  portalUser: PortalAuthUser | null;
  copy: LocalizedContent['nav'];
}

export function Header({
  onNavigateContact,
  onNavigateSection,
  onOpenSettings,
  onOpenAuth,
  portalUser,
  copy,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {href: '#ecosistema', label: copy.ecosystem},
    {href: '#nexos', label: copy.nexos},
    {href: '#juegos', label: copy.games},
    {href: '#mision', label: copy.mission},
  ];

  const handleNavClick = (hash: string) => {
    setMobileOpen(false);
    onNavigateSection(hash);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090C11]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3.5">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('#inicio');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
        >
          Nex<span className="text-[var(--accent-text)]">Play</span>
        </a>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-main)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onOpenSettings}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-main)] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
          >
            {copy.settings}
          </button>
        </nav>

        {/* Zone 3: Optional Account button + Contact CTA + mobile toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenAuth();
            }}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] ${
              portalUser
                ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            {portalUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{portalUser.username}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copy.account}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateContact();
            }}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-4 py-2 text-sm font-semibold text-[var(--accent-on)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
          >
            {copy.contact}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? copy.closeMenu : copy.openMenu}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Navegación móvil"
          className="md:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F16] px-6 py-4 flex flex-col gap-2"
        >
          {navItems.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="py-2.5 text-base font-medium text-slate-800 dark:text-slate-200 hover:text-[var(--accent-text)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenSettings();
            }}
            className="py-2.5 text-left text-base font-medium text-slate-800 dark:text-slate-200 hover:text-[var(--accent-text)] transition-colors cursor-pointer"
          >
            {copy.settings}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenAuth();
            }}
            className="py-2.5 text-left text-base font-medium text-slate-800 dark:text-slate-200 hover:text-[var(--accent-text)] transition-colors cursor-pointer flex items-center gap-2"
          >
            {portalUser ? <UserCheck className="w-4 h-4 text-[var(--accent-text)]" /> : <User className="w-4 h-4" />}
            <span>{portalUser ? portalUser.username : copy.account}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigateContact();
            }}
            className="mt-2 w-full rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-4 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors cursor-pointer"
          >
            {copy.contact}
          </button>
        </nav>
      )}
    </header>
  );
}
