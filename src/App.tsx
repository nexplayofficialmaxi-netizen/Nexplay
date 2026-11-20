import {Suspense, lazy, useEffect, useState} from 'react';
import {EcosystemDetailPage} from './components/EcosystemDetailPage';
import {EcosystemSection} from './components/EcosystemSection';
import {Footer} from './components/Footer';
import {GamesSection} from './components/GamesSection';
import {Header} from './components/Header';
import {HeroSection} from './components/HeroSection';
import {MissionAndContactSection} from './components/MissionAndContactSection';
import {NexOSSection} from './components/NexOSSection';
import {PortalAuthModal, type PortalAuthUser} from './components/PortalAuthModal';
import {SettingsModal} from './components/SettingsModal';
import {
  CONTENT,
  type AccentColor,
  type Language,
  type ThemeMode,
} from './data/nexplayData';

const F1App = lazy(() => import('./games/f1-aysen/F1App'));
const NexRacingApp = lazy(() => import('./games/nexracing/NexRacingApp'));

const STORAGE_KEY = 'nexplay_preferences_v1';
const PORTAL_TOKEN_KEY = 'nexplay_portal_token_v1';

interface Preferences {
  language: Language;
  theme: ThemeMode;
  accent: AccentColor;
}

const DEFAULT_PREFS: Preferences = {
  language: 'es',
  theme: 'dark',
  accent: 'emerald',
};

function loadInitialPrefs(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      language: parsed.language === 'en' || parsed.language === 'pt' ? parsed.language : 'es',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      accent:
        parsed.accent === 'blue' ||
        parsed.accent === 'cyan' ||
        parsed.accent === 'amber' ||
        parsed.accent === 'red'
          ? parsed.accent
          : 'emerald',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function loadInitialPortalToken(): string | null {
  try {
    return window.localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [prefs, setPrefs] = useState<Preferences>(loadInitialPrefs);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(loadInitialPortalToken);
  const [portalUser, setPortalUser] = useState<PortalAuthUser | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('Soporte técnico');
  const [activeEcosystemPageId, setActiveEcosystemPageId] = useState<string | null>(null);
  const [activePlayableGame, setActivePlayableGame] = useState<
    'f1-aysen' | 'nexracing' | null
  >(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('sala');
      return q ? 'nexracing' : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!portalToken) {
      setPortalUser(null);
      return;
    }
    let cancelled = false;
    fetch('/api/portal/auth/me', {
      headers: {Authorization: `Bearer ${portalToken}`},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('expired'))))
      .then((data) => {
        if (!cancelled && data?.user?.username) {
          setPortalUser(data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPortalUser(null);
          setPortalToken(null);
          try {
            window.localStorage.removeItem(PORTAL_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [portalToken]);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-accent', prefs.accent);
    if (!activePlayableGame) {
      root.setAttribute('lang', prefs.language);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage quota errors
    }
  }, [prefs, activePlayableGame]);

  const copy = CONTENT[prefs.language];

  const handleNavigateContact = (topic?: string) => {
    if (topic) {
      setSelectedTopic(topic);
    }
    setActiveEcosystemPageId(null);
    window.requestAnimationFrame(() => {
      const contactEl = document.getElementById('contacto');
      contactEl?.scrollIntoView({behavior: 'smooth'});
    });
  };

  const handleNavigateSection = (hash: string) => {
    setActiveEcosystemPageId(null);
    window.requestAnimationFrame(() => {
      if (hash === '#inicio') {
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
      }
      const el = document.querySelector(hash);
      el?.scrollIntoView({behavior: 'smooth'});
    });
  };

  const handleOpenEcosystemPage = (pillarId: string) => {
    window.scrollTo({top: 0, behavior: 'auto'});
    setActiveEcosystemPageId(pillarId);
  };

  const handleLaunchGame = (gameId: 'f1-aysen' | 'nexracing') => {
    window.scrollTo({top: 0, behavior: 'auto'});
    setActivePlayableGame(gameId);
  };

  const handleExitGame = () => {
    setActivePlayableGame(null);
    document.documentElement.setAttribute('lang', prefs.language);
    window.requestAnimationFrame(() => {
      const juegosEl = document.getElementById('juegos');
      juegosEl?.scrollIntoView({behavior: 'auto'});
    });
  };

  const handleAuthSuccess = (token: string, user: PortalAuthUser) => {
    setPortalToken(token);
    setPortalUser(user);
    try {
      window.localStorage.setItem(PORTAL_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    const oldToken = portalToken;
    if (oldToken) {
      fetch('/api/portal/auth/logout', {
        method: 'POST',
        headers: {Authorization: `Bearer ${oldToken}`},
      }).catch(() => {});
    }
    setPortalToken(null);
    setPortalUser(null);
    try {
      window.localStorage.removeItem(PORTAL_TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  if (activePlayableGame === 'f1-aysen' || activePlayableGame === 'nexracing') {
    return (
      <div
        className={
          activePlayableGame === 'nexracing'
            ? 'nexracing-scope min-h-screen bg-[#090B10] text-slate-100'
            : 'f1-simulador-scope min-h-screen bg-[#080B10] text-slate-100'
        }
      >
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#080B10] text-slate-200 flex items-center justify-center text-sm font-medium">
              {activePlayableGame === 'nexracing'
                ? 'Cargando Aysén NASCAR...'
                : 'Cargando F1 Simulador Aysén...'}
            </div>
          }
        >
          {activePlayableGame === 'nexracing' ? (
            <NexRacingApp onExitToNexPlay={handleExitGame} />
          ) : (
            <F1App onExitToNexPlay={handleExitGame} />
          )}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090C11] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-150">
      <Header
        onNavigateContact={handleNavigateContact}
        onNavigateSection={handleNavigateSection}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        portalUser={portalUser}
        copy={copy.nav}
      />
      <main className="flex-1">
        {activeEcosystemPageId ? (
          <EcosystemDetailPage
            activePillarId={activeEcosystemPageId}
            onSelectPillar={(id) => {
              window.scrollTo({top: 0, behavior: 'auto'});
              setActiveEcosystemPageId(id);
            }}
            onBackToPortal={() => setActiveEcosystemPageId(null)}
            onConsultTopic={(topic) => handleNavigateContact(topic)}
            onLaunchGame={handleLaunchGame}
            ecosystemCopy={copy.ecosystem}
            nexosCopy={copy.nexos}
            gamesCopy={copy.games}
          />
        ) : (
          <>
            <HeroSection copy={copy.hero} />
            <EcosystemSection
              onSelectTopic={(topic) => handleNavigateContact(topic)}
              onOpenEcosystemPage={handleOpenEcosystemPage}
              copy={copy.ecosystem}
            />
            <NexOSSection copy={copy.nexos} />
            <GamesSection
              onSelectGame={(gameName) => handleNavigateContact(gameName)}
              onLaunchGame={handleLaunchGame}
              copy={copy.games}
            />
            <MissionAndContactSection
              preselectedTopic={selectedTopic}
              copy={copy.missionContact}
            />
          </>
        )}
      </main>
      <Footer
        nav={copy.nav}
        copy={copy.footer}
        onOpenSettings={() => setSettingsOpen(true)}
        onNavigateSection={handleNavigateSection}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={prefs.language}
        onLanguageChange={(language) => setPrefs((prev) => ({...prev, language}))}
        theme={prefs.theme}
        onThemeChange={(theme) => setPrefs((prev) => ({...prev, theme}))}
        accent={prefs.accent}
        onAccentChange={(accent) => setPrefs((prev) => ({...prev, accent}))}
        onReset={() => setPrefs(DEFAULT_PREFS)}
        copy={copy.settings}
      />
      <PortalAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={portalUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        copy={copy.auth}
      />
    </div>
  );
}
