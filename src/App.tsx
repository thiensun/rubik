import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { ZenTimerStage } from './components/timer/ZenTimerStage';
import { MetricCards } from './components/metrics/MetricCards';
import { SolveVelocityCurve } from './components/metrics/SolveVelocityCurve';
import { HardwareStatusBar } from './components/metrics/HardwareStatusBar';
import { SessionHistoryCard } from './components/history/SessionHistoryCard';
import { SolveAndLearnView } from './components/views/SolveAndLearnView';
import { AlgorithmsView } from './components/views/AlgorithmsView';
import { AuditLogModal } from './components/history/AuditLogModal';
import { SettingsModal } from './components/SettingsModal';
import { SolveRecord, PenaltyType } from './types/cubing';
import { SEED_SOLVES, computeSessionStats } from './utils/cubingStats';
import { applyScramble, generateWCAScramble, CubeNetState } from './utils/cubeState';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';
import { CustomAlgorithmData } from './components/solver/Step3SolveInteractive';
import { AlgorithmCase } from './utils/algorithmsData';

const STORAGE_KEY = 'cubemaster_solves_v2_4';
const DEFAULT_SCRAMBLE = "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R";

export const App: React.FC = () => {
  // Navigation - default to 'scramble-timer' to showcase the redesigned tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('scramble-timer');

  // Custom Algorithm loaded for 3D exploration
  const [customAlgorithmFor3D, setCustomAlgorithmFor3D] = useState<CustomAlgorithmData | null>(null);

  // Scramble State
  const [scramble, setScramble] = useState<string>(DEFAULT_SCRAMBLE);
  const [cubeNetState, setCubeNetState] = useState<CubeNetState>(() => applyScramble(DEFAULT_SCRAMBLE));

  // Solve History from LocalStorage or Seed Data
  const [solves, setSolves] = useState<SolveRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return SEED_SOLVES;
  });

  // Settings (15s inspection enabled by default per Stitch design)
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active solve selected for AI analysis
  const [selectedSolveForAnalysis, setSelectedSolveForAnalysis] = useState<SolveRecord | null>(null);

  // Persist solves to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solves));
    } catch {
      // Storage full or unavailable
    }
  }, [solves]);

  // Compute stats dynamically
  const sessionStats = useMemo(() => computeSessionStats(solves), [solves]);

  // Solve number display (42 on default seed, incrementing with new solves)
  const currentSolveNumber = solves.length > 0 ? solves[0].id + 18 : 1;

  // Generate Next Scramble
  const handleNextScramble = useCallback(() => {
    const next = generateWCAScramble(21);
    setScramble(next);
    setCubeNetState(applyScramble(next));
    sound.playTick();
  }, []);

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

    setSolves((prev) => [newSolve, ...prev]);

    if (isNewPB && penalty !== 'dnf') {
      sound.playPBChord();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10B981', '#34D399', '#111111', '#F59E0B'],
      });
    }

    // Prepare next scramble automatically
    const nextScramble = generateWCAScramble(21);
    setScramble(nextScramble);
    setCubeNetState(applyScramble(nextScramble));
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

    setSolves((prev) => [newSolve, ...prev]);

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
    const nextScramble = generateWCAScramble(21);
    setScramble(nextScramble);
    setCubeNetState(applyScramble(nextScramble));
  };

  // Edit existing solve time
  const handleEditSolveTime = (id: number, newTimeMs: number) => {
    setSolves((prev) =>
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
    setSolves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, penalty } : s))
    );
  };

  // Delete a solve
  const handleDeleteSolve = (id: number) => {
    setSolves((prev) => prev.filter((s) => s.id !== id));
  };

  // Reset/Clear entire session
  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear current session solves?')) {
      setSolves([]);
    }
  };

  // Simulate a solve via hardware HUD button
  const handleSimulateSolve = () => {
    const simTimeMs = Math.floor(7400 + Math.random() * 2400);
    handleSolveComplete(simTimeMs);
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
  const handleLoadAlgorithmInto3D = (alg: AlgorithmCase) => {
    setSelectedSolveForAnalysis(null);
    setCustomAlgorithmFor3D({
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
    <div className="bg-mono-50 font-sans text-mono-900 antialiased min-h-screen flex flex-col justify-between selection:bg-mono-900 selection:text-white">
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
      />

      {/* Main Content Area */}
      <main className="w-full pt-16 sm:pt-20 pb-16 flex-1 flex flex-col justify-start">
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
              displayTimeMs={solves.length > 0 ? solves[0].timeMs : 8420}
            />

            {/* Apple-style Refined Bottom Dock & Session Split Grid */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side (7 Columns): Compact Metric Cards, Velocity Pace Curve, Hardware Dock */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <MetricCards stats={sessionStats} />
                <SolveVelocityCurve solves={solves} />
                <HardwareStatusBar
                  onSimulateSolve={handleSimulateSolve}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
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
            />
          </div>
        )}
      </main>

      {/* 2. Global Footer */}
      <Footer />

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
      />
    </div>
  );
};
export default App;
