import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { BottomNavBar } from './components/navigation/BottomNavBar';
import { Footer } from './components/Footer';
import { ZenTimerStage } from './components/timer/ZenTimerStage';
import { MetricCards } from './components/metrics/MetricCards';
import { SolveVelocityCurve } from './components/metrics/SolveVelocityCurve';
import { SessionHistoryCard } from './components/history/SessionHistoryCard';
import { SolveAndLearnView } from './components/views/SolveAndLearnView';
import { AlgorithmsView } from './components/views/AlgorithmsView';
import { AuditLogModal } from './components/history/AuditLogModal';
import { SettingsModal, ColorSchemePresetKey } from './components/SettingsModal';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { SolveRecord, PenaltyType, CubeSize } from './types/cubing';
import { SEED_SOLVES, computeSessionStats } from './utils/cubingStats';
import { applyScrambleForNet, CubeNetState } from './utils/cubeState';
import {
  ALL_TIMER_MODES,
  TimerMode,
  generateScrambleForMode,
  getDefaultTimerModeForSize,
} from './components/timer/substepScrambler';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';
import { CustomAlgorithmData } from './components/solver/Step3SolveInteractive';
import { DEFAULT_COLOR_SCHEME, PRESET_COLOR_SCHEMES } from './engine/algSimulator';

const STORAGE_KEY = 'cubemaster_solves_v2_4';
const SESSIONS_STORAGE_KEY = 'cubemaster_sessions_v2_4';
const DEFAULT_SCRAMBLE = "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R";

type ModeSessionsMap = Record<TimerMode, SolveRecord[]>;

function createEmptySessions(): ModeSessionsMap {
  return ALL_TIMER_MODES.reduce((acc, mode) => {
    acc[mode] = [];
    return acc;
  }, {} as ModeSessionsMap);
}

function loadInitialSessions(): ModeSessionsMap {
  const empty = createEmptySessions();
  try {
    const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      if (parsed && typeof parsed === 'object') {
        const hydrated = { ...empty };
        for (const mode of ALL_TIMER_MODES) {
          hydrated[mode] = Array.isArray(parsed[mode]) ? parsed[mode] : [];
        }
        return hydrated;
      }
    }
    const legacySaved = localStorage.getItem(STORAGE_KEY);
    if (legacySaved) {
      const parsedLegacy = JSON.parse(legacySaved);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        return { ...empty, FULL: parsedLegacy };
      }
    }
  } catch {
    // Fallback
  }
  return { ...empty, FULL: SEED_SOLVES };
}

export const App: React.FC = () => {
  // Navigation - default to 'scramble-timer' to showcase the redesigned tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('scramble-timer');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [cubeSize, setCubeSize] = useState<CubeSize>(3);
  const [timerMode, setTimerMode] = useState<TimerMode>('FULL');

  // Custom Algorithm loaded for 3D exploration
  const [customAlgorithmFor3D, setCustomAlgorithmFor3D] = useState<CustomAlgorithmData | null>(null);

  // Scramble State
  const [scramble, setScramble] = useState<string>(DEFAULT_SCRAMBLE);
  const [cubeNetState, setCubeNetState] = useState<CubeNetState>(() => applyScrambleForNet(DEFAULT_SCRAMBLE));

  const handleCubeSizeChange = useCallback((newSize: CubeSize) => {
    const defaultMode = getDefaultTimerModeForSize(newSize);
    setCubeSize(newSize);
    setTimerMode(defaultMode);
    const nextScramble = generateScrambleForMode(newSize, defaultMode);
    setScramble(nextScramble);
    setCubeNetState(applyScrambleForNet(nextScramble));
    sound.playTick();
  }, []);

  // Mode-Isolated Solve Sessions from LocalStorage or Seed Data
  const [sessions, setSessions] = useState<ModeSessionsMap>(loadInitialSessions);
  const solves = sessions[timerMode] || [];

  const setSolvesForActiveMode = useCallback(
    (updater: (prev: SolveRecord[]) => SolveRecord[]) => {
      setSessions((prev) => ({
        ...prev,
        [timerMode]: updater(prev[timerMode] || []),
      }));
    },
    [timerMode],
  );

  // Settings (15s inspection enabled by default per Stitch design)
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [colorSchemeKey, setColorSchemeKey] = useState<ColorSchemePresetKey>(() => {
    try {
      const saved = localStorage.getItem('cubemaster_color_scheme_v2_4') as ColorSchemePresetKey | null;
      if (saved && PRESET_COLOR_SCHEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'white-bottom';
  });

  const activeColorScheme = useMemo(
    () => PRESET_COLOR_SCHEMES[colorSchemeKey] || DEFAULT_COLOR_SCHEME,
    [colorSchemeKey],
  );

  const handleChangeColorSchemeKey = (key: ColorSchemePresetKey) => {
    setColorSchemeKey(key);
    try {
      localStorage.setItem('cubemaster_color_scheme_v2_4', key);
    } catch {
      // ignore
    }
  };

  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active solve selected for AI analysis
  const [selectedSolveForAnalysis, setSelectedSolveForAnalysis] = useState<SolveRecord | null>(null);

  // Persist mode-isolated sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Storage full or unavailable
    }
  }, [sessions]);

  // Compute stats dynamically for the active timerMode only
  const sessionStats = useMemo(() => computeSessionStats(solves), [solves]);

  // Solve number display
  const currentSolveNumber = solves.length > 0 ? solves[0].id + 18 : 1;

  // Switch Timer Substep Mode and immediately generate mode-specific scramble
  const handleTimerModeChange = useCallback(
    (newMode: TimerMode) => {
      setTimerMode(newMode);
      const next = generateScrambleForMode(cubeSize, newMode);
      setScramble(next);
      setCubeNetState(applyScrambleForNet(next));
      sound.playTick();
    },
    [cubeSize],
  );

  // Generate Next Scramble
  const handleNextScramble = useCallback(() => {
    const next = generateScrambleForMode(cubeSize, timerMode);
    setScramble(next);
    setCubeNetState(applyScrambleForNet(next));
    sound.playTick();
  }, [cubeSize, timerMode]);

  // Global Alt+N Hotkey for Next Scramble
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNextScramble();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextScramble]);

  // When timer completes a solve
  const handleSolveComplete = (timeMs: number, penalty: PenaltyType = 'none') => {
    const isNewPB = sessionStats.bestTime === null || timeMs < sessionStats.bestTime;

    const newId = solves.length > 0 ? Math.max(...solves.map((s) => s.id)) + 1 : 1;
    const moves = Math.floor(Math.random() * 12) + 52; // realistic 52-64 HTM
    const seconds = timeMs / 1000;
    const tps = Number((moves / Math.max(0.1, seconds)).toFixed(2));

    const newSolve: SolveRecord = {
      id: newId,
      timeMs,
      penalty,
      scramble,
      timestamp: Date.now(),
      moves,
      tps,
      isPB: isNewPB,
    };

    setSolvesForActiveMode((prev) => [newSolve, ...prev]);

    if (isNewPB && penalty !== 'dnf') {
      sound.playPBChord();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10B981', '#34D399', '#111111', '#F59E0B'],
      });
    }

    // Prepare next scramble automatically for current mode
    const nextScramble = generateScrambleForMode(cubeSize, timerMode);
    setScramble(nextScramble);
    setCubeNetState(applyScrambleForNet(nextScramble));
  };

  // Manual solve entry (from external Stackmat timer, hand timer, etc.)
  const handleAddManualSolve = (timeMs: number, penalty: PenaltyType = 'none', customScramble?: string) => {
    const isNewPB = sessionStats.bestTime === null || timeMs < sessionStats.bestTime;
    const newId = solves.length > 0 ? Math.max(...solves.map((s) => s.id)) + 1 : 1;
    const moves = Math.floor(Math.random() * 12) + 52;
    const seconds = timeMs / 1000;
    const tps = Number((moves / Math.max(0.1, seconds)).toFixed(2));
    const targetScramble = customScramble || scramble;

    const newSolve: SolveRecord = {
      id: newId,
      timeMs,
      penalty,
      scramble: targetScramble,
      timestamp: Date.now(),
      moves,
      tps,
      isPB: isNewPB,
      comment: 'Manual Entry',
    };

    setSolvesForActiveMode((prev) => [newSolve, ...prev]);

    if (isNewPB && penalty !== 'dnf') {
      sound.playPBChord();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10B981', '#34D399', '#111111', '#F59E0B'],
      });
    }

    // Refresh scramble for next solve
    const nextScramble = generateScrambleForMode(cubeSize, timerMode);
    setScramble(nextScramble);
    setCubeNetState(applyScrambleForNet(nextScramble));
  };

  // Edit existing solve time
  const handleEditSolveTime = (id: number, newTimeMs: number) => {
    setSolvesForActiveMode((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const seconds = newTimeMs / 1000;
        const moves = s.moves || 56;
        const tps = Number((moves / Math.max(0.1, seconds)).toFixed(2));
        return {
          ...s,
          timeMs: newTimeMs,
          tps,
        };
      })
    );
  };

  // Penalty modification
  const handleUpdatePenalty = (id: number, penalty: PenaltyType) => {
    setSolvesForActiveMode((prev) =>
      prev.map((s) => (s.id === id ? { ...s, penalty } : s))
    );
  };

  // Delete a solve
  const handleDeleteSolve = (id: number) => {
    setSolvesForActiveMode((prev) => prev.filter((s) => s.id !== id));
  };

  // Reset/Clear entire session for active mode
  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear current session solves?')) {
      setSolvesForActiveMode(() => []);
    }
  };

  // Navigate to Solve & Learn tab with specific solve
  const handleAnalyzeSolve = (solve: SolveRecord) => {
    if (solve.scramble && navigator.clipboard) {
      navigator.clipboard.writeText(solve.scramble).catch(() => {});
    }
    sound.playPBChord();
    setSelectedSolveForAnalysis(solve);
    setCustomAlgorithmFor3D(null);
    setActiveTab('solve-learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load an algorithm from library into 3D viewer
  const handleLoadAlgorithmInto3D = (alg: CustomAlgorithmData) => {
    setSelectedSolveForAnalysis(null);
    setCustomAlgorithmFor3D({
      id: alg.id,
      name: alg.name,
      notation: alg.notation,
      category: alg.category,
      prob: alg.prob,
      descriptionVi: alg.descriptionVi,
      holdingNoteVi: alg.holdingNoteVi,
    });
    setActiveTab('solve-learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle latest solve penalty from timer stage
  const handleToggleLatestPenalty = () => {
    if (solves.length === 0) return;
    const latest = solves[0];
    const nextPenalty: PenaltyType = latest.penalty === '+2' ? 'none' : '+2';
    handleUpdatePenalty(latest.id, nextPenalty);
  };

  return (
    <div className="bg-[#F8F9FA] font-sans text-[#111111] antialiased min-h-screen flex flex-col justify-between selection:bg-[#111111] selection:text-white">
      {/* 1. Global Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== activeTab) {
            setSelectedSolveForAnalysis(null);
            setCustomAlgorithmFor3D(null);
          }
          setActiveTab(tab);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isTimerRunning={isTimerRunning}
        cubeSize={cubeSize}
        onCubeSizeChange={handleCubeSizeChange}
      />

      {/* Main Content Area */}
      <main className="w-full pt-16 sm:pt-20 pb-24 lg:pb-16 flex-1 flex flex-col justify-start">
        {/* TAB 1: Solve & Learn */}
        {activeTab === 'solve-learn' && (
          <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8">
            <SolveAndLearnView
              analyzedSolve={selectedSolveForAnalysis}
              onClearAnalyzedSolve={() => setSelectedSolveForAnalysis(null)}
              onBackToTimer={() => setActiveTab('scramble-timer')}
              initialStep={customAlgorithmFor3D || selectedSolveForAnalysis ? 3 : 1}
              customAlgorithm={customAlgorithmFor3D}
              onClearCustomAlgorithm={() => setCustomAlgorithmFor3D(null)}
              colorScheme={activeColorScheme}
              cubeSize={cubeSize}
            />
          </div>
        )}

        {/* TAB 2: Scramble & Timer (Zen Center Focus & Minimalist HUD - Variant 1) */}
        {activeTab === 'scramble-timer' && (
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
            {/* Dominant Hero Bento: Scramble Directly Integrated and Centered Above the Grand Timer */}
            <ZenTimerStage
              scramble={scramble}
              roundNumber={2}
              solveNumber={currentSolveNumber}
              onNextScramble={handleNextScramble}
              cubeNetState={cubeNetState}
              onSolveComplete={handleSolveComplete}
              onManualTimeEntry={handleAddManualSolve}
              onReset={() => {}}
              onTogglePenalty={handleToggleLatestPenalty}
              inspectionEnabled={inspectionEnabled}
              onToggleInspection={() => setInspectionEnabled(!inspectionEnabled)}
              displayTimeMs={solves.length > 0 ? solves[0].timeMs : 0}
              onTimerRunningChange={setIsTimerRunning}
              cubeSize={cubeSize}
              timerMode={timerMode}
              onTimerModeChange={handleTimerModeChange}
            />

            {/* Apple-style Refined Bottom Dock & Session Split Grid */}
            <div className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transition-opacity duration-200 ${
              isTimerRunning ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              {/* Left Side (7 Columns): Compact Metric Cards, Velocity Pace Curve */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <MetricCards stats={sessionStats} />
                <SolveVelocityCurve solves={solves} />
              </div>

              {/* Right Side (5 Columns): Solve History Drawer / Panel */}
              <div className="lg:col-span-5 w-full">
                <SessionHistoryCard
                  solves={solves}
                  onAddManualSolve={handleAddManualSolve}
                  onEditSolveTime={handleEditSolveTime}
                  onUpdatePenalty={handleUpdatePenalty}
                  onDeleteSolve={handleDeleteSolve}
                  onClearSession={handleClearSession}
                  onAnalyzeSolve={handleAnalyzeSolve}
                  onOpenAuditLog={() => setIsAuditModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Algorithms Reference Encyclopedia */}
        {activeTab === 'algorithms' && (
          <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8">
            <AlgorithmsView
              onBackToTimer={() => setActiveTab('scramble-timer')}
              onLoadInto3D={handleLoadAlgorithmInto3D}
              colorScheme={activeColorScheme}
              cubeSize={cubeSize}
            />
          </div>
        )}
      </main>

      {/* 2. Global Footer */}
      <div className={`pb-16 lg:pb-0 transition-opacity duration-200 ${isTimerRunning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Footer />
      </div>

      {/* 3. Sleek Frosted Glass Bottom Navigation Bar (< 1024px lg breakpoint) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== activeTab) {
            setSelectedSolveForAnalysis(null);
            setCustomAlgorithmFor3D(null);
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isTimerRunning={isTimerRunning}
      />

      {/* 4. Global Scroll to Top Button (Shifted above Bottom Navigation Bar on mobile) */}
      <ScrollToTopButton
        className={activeTab === 'algorithms' ? 'bottom-28 lg:bottom-6' : 'bottom-20 lg:bottom-6'}
      />

      {/* 5. PWA Installation Banner */}
      <PWAInstallBanner />

      {/* Modals */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        solves={solves}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = sound.toggle();
          setSoundEnabled(next);
        }}
        inspectionEnabled={inspectionEnabled}
        onToggleInspection={() => setInspectionEnabled(!inspectionEnabled)}
        colorSchemeKey={colorSchemeKey}
        onChangeColorSchemeKey={handleChangeColorSchemeKey}
      />
    </div>
  );
};
export default App;
