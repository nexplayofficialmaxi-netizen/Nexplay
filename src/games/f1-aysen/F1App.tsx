import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GarageView from './components/GarageView';
import HomeView from './components/HomeView';
import LeaderboardView from './components/LeaderboardView';
import ModeSetupView from './components/ModeSetupView';
import OnlineLobbyView from './components/OnlineLobbyView';
import RaceView, { RaceRewardSummary } from './components/RaceView';
import SettingsView from './components/SettingsView';
import TopNav, { AppTab } from './components/TopNav';
import {
  createInitialCareerStandings,
  F1_POINTS_TABLE,
  F1_PROMO_CODES,
  FIRST_TIME_TRACK_BONUS,
  getCarSellValue,
  RACE_PRIZE_BY_POS,
  TEAM_PRESETS,
  TIMETRIAL_LAP_REWARD,
} from './data/cars';
import { FEATURED_CIRCUITS } from './data/circuits';
import { audioEngine } from './engine/audio';
import { I18nProvider } from './utils/i18n';
import {
  CarConfig,
  CareerState,
  CircuitId,
  ControlSettings,
  GameMode,
  RaceSessionConfig,
  RacerTelemetry,
  SavedProgress,
  UserAccount,
} from './types/game';
import {
  loadSavedCar,
  loadSavedCareer,
  loadSavedControls,
  loadSavedName,
  loadSavedProgress,
  saveCar,
  saveCareer,
  saveControls,
  saveName,
  saveProgress,
  STORAGE_AUTH_TOKEN_KEY,
} from './utils/storage';

interface F1AppProps {
  onExitToNexPlay?: () => void;
}

export default function F1App({ onExitToNexPlay }: F1AppProps = {}) {
  const playerId = useMemo(
    () => `drv-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const [progress, setProgress] = useState<SavedProgress>(loadSavedProgress);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    () => loadSavedProgress().lastMode
  );
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitId>(
    () => loadSavedProgress().lastCircuitId
  );

  const [playerName, setPlayerName] = useState<string>(loadSavedName);
  const [carConfig, setCarConfig] = useState<CarConfig>(loadSavedCar);
  const [controls, setControls] = useState<ControlSettings>(loadSavedControls);
  const [careerState, setCareerState] = useState<CareerState>(() =>
    loadSavedCareer(loadSavedName(), loadSavedCar())
  );

  // Keep a ref to latest progress so callbacks & pagehide always flush latest values synchronously
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const carRef = useRef(carConfig);
  carRef.current = carConfig;
  const careerRef = useRef(careerState);
  careerRef.current = careerState;
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const nameRef = useRef(playerName);
  nameRef.current = playerName;

  // Optional Online-only user session
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);
  const [activeRace, setActiveRace] = useState<RaceSessionConfig | null>(null);
  const [onlineWs, setOnlineWs] = useState<WebSocket | null>(null);

  // Persist every change immediately + on browser close/pagehide
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveCareer(careerState);
  }, [careerState]);

  useEffect(() => {
    audioEngine.applyAudioSettings(controls.audio);
  }, [controls.audio]);

  useEffect(() => {
    const flushAll = () => {
      saveProgress(progressRef.current);
      saveCar(carRef.current);
      saveCareer(careerRef.current);
      saveControls(controlsRef.current);
      saveName(nameRef.current);
    };
    window.addEventListener('beforeunload', flushAll);
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('beforeunload', flushAll);
      window.removeEventListener('pagehide', flushAll);
    };
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
      if (token) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user) {
              setAuthUser(data.user as UserAccount);
            }
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAuthSuccess = useCallback((user: UserAccount) => {
    setAuthUser(user);
    try {
      localStorage.setItem(STORAGE_AUTH_TOKEN_KEY, user.token);
    } catch {
      // ignore
    }
  }, []);

  const handleAuthLogout = useCallback(() => {
    setAuthUser(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateCar = useCallback((next: CarConfig) => {
    setCarConfig(next);
    saveCar(next);
    if (next.isCustom) {
      setProgress((prev) => {
        const updated: SavedProgress = {
          ...prev,
          customCars: prev.customCars.map((c) => (c.id === next.id ? next : c)),
        };
        progressRef.current = updated;
        saveProgress(updated);
        return updated;
      });
    }
    setCareerState((prev) => ({
      ...prev,
      standings: prev.standings.map((s) =>
        s.isPlayer
          ? { ...s, teamName: next.teamName, color: next.primaryColor }
          : s
      ),
    }));
  }, []);

  const handleBuyCar = useCallback(
    (car: CarConfig, price: number): boolean => {
      const cur = progressRef.current;
      if (cur.unlockedCarIds.includes(car.id)) {
        handleUpdateCar({ ...car });
        return true;
      }
      if (cur.credits < price) return false;

      const updated: SavedProgress = {
        ...cur,
        credits: cur.credits - price,
        unlockedCarIds: [...cur.unlockedCarIds, car.id],
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);
      handleUpdateCar({ ...car });
      return true;
    },
    [handleUpdateCar]
  );

  const handleCreateCustomCar = useCallback(
    (car: CarConfig, buildCost: number): boolean => {
      const cur = progressRef.current;
      if (cur.credits < buildCost) return false;
      const updated: SavedProgress = {
        ...cur,
        credits: cur.credits - buildCost,
        unlockedCarIds: [...cur.unlockedCarIds, car.id],
        customCars: [...cur.customCars, car],
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);
      handleUpdateCar(car);
      return true;
    },
    [handleUpdateCar]
  );

  const handleSellCar = useCallback(
    (car: CarConfig): boolean => {
      const cur = progressRef.current;
      const ownedCustom = cur.customCars.filter((c) => c.id !== car.id);
      const remainingUnlocked = cur.unlockedCarIds.filter((id) => id !== car.id);
      if (remainingUnlocked.length === 0 && ownedCustom.length === 0) {
        return false;
      }

      const sellPrice = getCarSellValue(car);
      const nextEquipped =
        carRef.current.id === car.id
          ? ownedCustom[0] ??
            TEAM_PRESETS.find((t) => remainingUnlocked.includes(t.id)) ?? {
              ...TEAM_PRESETS[0],
            }
          : carRef.current;

      const finalUnlocked =
        remainingUnlocked.length > 0 ? remainingUnlocked : ['nexplay_gp'];

      const updated: SavedProgress = {
        ...cur,
        credits: cur.credits + sellPrice,
        unlockedCarIds: finalUnlocked,
        customCars: ownedCustom,
        stats: {
          ...cur.stats,
          totalEarnings: cur.stats.totalEarnings + sellPrice,
        },
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);
      handleUpdateCar({ ...nextEquipped });
      return true;
    },
    [handleUpdateCar]
  );

  const handleUpdateControls = useCallback((next: ControlSettings) => {
    setControls(next);
    saveControls(next);
  }, []);

  const handleRedeemCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        return { ok: false, message: 'Escribe un código F1 primero.' };
      }
      const cur = progressRef.current;
      if (cur.redeemedCodes.includes(code)) {
        return { ok: false, message: `El código "${code}" ya fue canjeado.` };
      }
      const reward = F1_PROMO_CODES[code];
      if (!reward) {
        return {
          ok: false,
          message: `Código "${code}" aún no está activo. Indícame qué código quieres activar y su premio.`,
        };
      }
      const addedCredits = reward.credits ?? 0;
      const nextUnlocked =
        reward.unlockCarId && !cur.unlockedCarIds.includes(reward.unlockCarId)
          ? [...cur.unlockedCarIds, reward.unlockCarId]
          : cur.unlockedCarIds;

      const updated: SavedProgress = {
        ...cur,
        credits: cur.credits + addedCredits,
        unlockedCarIds: nextUnlocked,
        redeemedCodes: [...cur.redeemedCodes, code],
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);
      return { ok: true, message: `¡Código "${code}" canjeado! ${reward.description}` };
    },
    []
  );

  const handleChangePlayerName = useCallback((name: string) => {
    setPlayerName(name);
    saveName(name);
    setCareerState((prev) => ({
      ...prev,
      standings: prev.standings.map((s) =>
        s.isPlayer ? { ...s, name: name.trim() || 'Piloto Patagonia' } : s
      ),
    }));
  }, []);

  const handleResetCareer = useCallback(() => {
    const fresh: CareerState = {
      season: 1,
      currentRoundIndex: 0,
      completedRounds: [],
      standings: createInitialCareerStandings(playerName, carConfig),
    };
    setCareerState(fresh);
    saveCareer(fresh);
  }, [playerName, carConfig]);

  const handleTimeTrialLap = useCallback(
    (lapTimeMs: number, circuitId: string): number => {
      const cur = progressRef.current;
      const prevBest = cur.bestLapsByCircuit[circuitId];
      const nextBest =
        prevBest === undefined ? lapTimeMs : Math.min(prevBest, lapTimeMs);
      const isNewCircuit = !cur.completedCircuits.includes(circuitId);
      const earned =
        TIMETRIAL_LAP_REWARD + (isNewCircuit ? FIRST_TIME_TRACK_BONUS : 0);

      const updated: SavedProgress = {
        ...cur,
        credits: cur.credits + earned,
        completedCircuits: isNewCircuit
          ? [...cur.completedCircuits, circuitId]
          : cur.completedCircuits,
        bestLapsByCircuit: {
          ...cur.bestLapsByCircuit,
          [circuitId]: nextBest,
        },
        stats: {
          ...cur.stats,
          totalLaps: cur.stats.totalLaps + 1,
          totalEarnings: cur.stats.totalEarnings + earned,
        },
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);
      return earned;
    },
    []
  );

  const handleRaceCompleted = useCallback(
    (results: RacerTelemetry[]): RaceRewardSummary => {
      const pRes = results.find((r) => r.isPlayer);
      const pos = pRes?.position ?? 9;
      const positionPrize =
        RACE_PRIZE_BY_POS[
          Math.max(0, Math.min(RACE_PRIZE_BY_POS.length - 1, pos - 1))
        ];

      const cur = progressRef.current;
      const circuitId = activeRace?.circuitId ?? selectedCircuit;
      const isNewCircuit = !cur.completedCircuits.includes(circuitId);
      const firstTrackBonus = isNewCircuit ? FIRST_TIME_TRACK_BONUS : 0;
      const totalEarned = positionPrize + firstTrackBonus;
      const newBalance = cur.credits + totalEarned;

      const prevBest = cur.bestLapsByCircuit[circuitId];
      const nextBest =
        pRes?.bestLapMs != null
          ? prevBest === undefined
            ? pRes.bestLapMs
            : Math.min(prevBest, pRes.bestLapMs)
          : prevBest;

      const updatedProgress: SavedProgress = {
        ...cur,
        credits: newBalance,
        completedCircuits: isNewCircuit
          ? [...cur.completedCircuits, circuitId]
          : cur.completedCircuits,
        bestLapsByCircuit:
          nextBest !== undefined
            ? { ...cur.bestLapsByCircuit, [circuitId]: nextBest }
            : cur.bestLapsByCircuit,
        stats: {
          racesCompleted: cur.stats.racesCompleted + 1,
          wins: cur.stats.wins + (pos === 1 ? 1 : 0),
          podiums: cur.stats.podiums + (pos <= 3 ? 1 : 0),
          totalLaps: cur.stats.totalLaps + (activeRace?.laps ?? 3),
          totalEarnings: cur.stats.totalEarnings + totalEarned,
        },
      };
      progressRef.current = updatedProgress;
      setProgress(updatedProgress);
      saveProgress(updatedProgress);

      if (activeRace && activeRace.mode === 'career') {
        setCareerState((prev) => {
          const updatedStandings = prev.standings.map((driver) => {
            const match = results.find((r) =>
              driver.isPlayer ? r.isPlayer : r.name === driver.name
            );
            if (!match) return driver;
            const pts =
              match.position <= F1_POINTS_TABLE.length
                ? F1_POINTS_TABLE[match.position - 1]
                : 0;
            return {
              ...driver,
              points: driver.points + pts,
              wins: driver.wins + (match.position === 1 ? 1 : 0),
              podiums: driver.podiums + (match.position <= 3 ? 1 : 0),
            };
          });

          const nextRound = prev.currentRoundIndex + 1;
          const wrappedSeason =
            nextRound >= FEATURED_CIRCUITS.length ? prev.season + 1 : prev.season;
          const nextIdx =
            nextRound >= FEATURED_CIRCUITS.length ? 0 : nextRound;

          const nextState: CareerState = {
            season: wrappedSeason,
            currentRoundIndex: nextIdx,
            completedRounds: [...prev.completedRounds, activeRace.circuitId],
            standings: updatedStandings,
          };
          saveCareer(nextState);
          return nextState;
        });
      }

      return {
        positionPrize,
        firstTrackBonus,
        totalEarned,
        newBalance,
      };
    },
    [activeRace, selectedCircuit]
  );

  const launchRace = useCallback((cfg: RaceSessionConfig) => {
    setSelectedCircuit(cfg.circuitId);
    setSelectedMode(cfg.mode);
    setProgress((prev) => ({
      ...prev,
      lastCircuitId: cfg.circuitId,
      lastMode: cfg.mode,
    }));
    setActiveRace(cfg);
  }, []);

  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'online') {
      setActiveTab('online');
    } else {
      setSelectedMode(mode);
      setProgress((prev) => ({ ...prev, lastMode: mode }));
      setActiveTab('modes');
    }
  };

  const handleQuickStart = () => {
    launchRace({
      mode: 'quickrace',
      circuitId: selectedCircuit,
      laps: 3,
      difficulty: 'pro',
    });
  };

  const handleQuickCircuit = (circuitId: CircuitId) => {
    launchRace({
      mode: 'quickrace',
      circuitId,
      laps: 3,
      difficulty: 'pro',
    });
  };

  const handleStartOnlineRace = (
    session: RaceSessionConfig,
    ws: WebSocket
  ) => {
    setOnlineWs(ws);
    launchRace(session);
  };

  const handleExitRace = () => {
    setActiveRace(null);
    setOnlineWs(null);
  };

  // Ensure carConfig is always an unlocked preset or custom car
  const isOwnedCar =
    progress.unlockedCarIds.includes(carConfig.id) ||
    progress.customCars.some((c) => c.id === carConfig.id);
  const equippedCar = isOwnedCar ? carConfig : { ...TEAM_PRESETS[0] };

  return (
    <I18nProvider language={controls.language}>
      {activeRace ? (
        <RaceView
          session={activeRace}
          playerId={playerId}
          playerName={
            activeRace.mode === 'online' && authUser
              ? authUser.username
              : playerName.trim() || 'Piloto Patagonia'
          }
          playerCar={equippedCar}
          controls={controls}
          onlineWs={onlineWs}
          onToggleTrackHud={() =>
            handleUpdateControls({
              ...controlsRef.current,
              showTrackHud: !controlsRef.current.showTrackHud,
            })
          }
          onToggleAudioMute={(muted) =>
            handleUpdateControls({
              ...controlsRef.current,
              audio: {
                ...controlsRef.current.audio,
                muted,
              },
            })
          }
          onExit={handleExitRace}
          onRaceCompleted={handleRaceCompleted}
          onTimeTrialLap={handleTimeTrialLap}
        />
      ) : (
        <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col">
          <TopNav
            activeTab={activeTab}
            credits={progress.credits}
            onNavigate={setActiveTab}
            onQuickStart={handleQuickStart}
            onExitToNexPlay={onExitToNexPlay}
          />

          <main className="flex-1">
            {activeTab === 'home' && (
              <HomeView
                carConfig={equippedCar}
                progress={progress}
                onSelectMode={handleSelectMode}
                onOpenGarage={() => setActiveTab('garage')}
                onOpenSettings={() => setActiveTab('settings')}
                onOpenLeaderboard={() => setActiveTab('leaderboard')}
                onQuickCircuit={handleQuickCircuit}
              />
            )}

            {activeTab === 'modes' && (
              <ModeSetupView
                initialMode={selectedMode}
                initialCircuitId={selectedCircuit}
                playerName={playerName}
                playerCarId={equippedCar.id}
                completedCircuits={progress.completedCircuits}
                bestLapsByCircuit={progress.bestLapsByCircuit}
                onChangePlayerName={handleChangePlayerName}
                careerState={careerState}
                onResetCareer={handleResetCareer}
                onStartRace={launchRace}
                onGoOnline={() => setActiveTab('online')}
                onOpenLeaderboard={() => setActiveTab('leaderboard')}
              />
            )}

            {activeTab === 'garage' && (
              <GarageView
                carConfig={equippedCar}
                credits={progress.credits}
                unlockedCarIds={progress.unlockedCarIds}
                customCars={progress.customCars}
                onUpdateCar={handleUpdateCar}
                onBuyCar={handleBuyCar}
                onCreateCustomCar={handleCreateCustomCar}
                onSellCar={handleSellCar}
                onTestOnTrack={() =>
                  launchRace({
                    mode: 'timetrial',
                    circuitId: selectedCircuit,
                    laps: 99,
                    difficulty: 'pro',
                  })
                }
              />
            )}

            {activeTab === 'online' && (
              <OnlineLobbyView
                playerId={playerId}
                carConfig={equippedCar}
                authUser={authUser}
                onAuthSuccess={handleAuthSuccess}
                onAuthLogout={handleAuthLogout}
                onStartOnlineRace={handleStartOnlineRace}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                controls={controls}
                redeemedCodes={progress.redeemedCodes}
                onUpdateControls={handleUpdateControls}
                onRedeemCode={handleRedeemCode}
              />
            )}

            {activeTab === 'leaderboard' && <LeaderboardView />}
          </main>
        </div>
      )}
    </I18nProvider>
  );
}
