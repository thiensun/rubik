import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Download,
  FlipHorizontal,
  ArrowLeft,
  Check,
  Sparkles,
  ChevronDown,
  Copy,
  Lock,
  Volume2,
  AlertTriangle,
  Camera,
  X,
  Target,
  BookOpen,
} from 'lucide-react';
import { SolverLevelId, SolveRecord } from '../../types/cubing';
import {
  getSolutionForLevel,
  SolutionStage,
  SolutionMove,
  createMoves,
  DEMO_SCRAMBLES,
  CFOP_DEMO_SCRAMBLE,
  AUTO_SOLVE_DEMO_SCRAMBLE,
} from '../../utils/solutionStages';
import { ThreeCubeViewer } from './ThreeCubeViewer';
import { SpeedcubeCaseDiagram } from './SpeedcubeCaseDiagram';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  CubeNetState,
  applyScramble,
  CUBE_HEX_COLORS,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  isCubeSolved,
  invertMoves,
  expandAlgorithmNotation,
} from '../../utils/cubeState';
import { getCrossAdvisor } from '../../utils/crossAnalysis';


export interface CustomAlgorithmData {
  name: string;
  notation: string;
  category: string;
  prob?: string;
  descriptionVi?: string;
  holdingNoteVi?: string;
}

interface Step3SolveInteractiveProps {
  selectedLevel: SolverLevelId;
  onBackToScan: () => void;
  onSwitchLevel: (newLevel?: SolverLevelId) => void;
  customAlgorithm?: CustomAlgorithmData | null;
  onClearCustomAlgorithm?: () => void;
  scannedCubeState?: CubeNetState | null;
  onUpdateScannedCube?: (cubeState: CubeNetState | null) => void;
  demoScramble?: string | null;
  onSetDemoScramble?: (scramble: string | null) => void;
  analyzedSolve?: SolveRecord | null;
  onClearAnalyzedSolve?: () => void;
}

const LEVEL_LABELS: Record<SolverLevelId, string> = {
  'auto-solve': 'OPTIMAL AUTO-SOLVE (Fastest Path)',
  'level-1': 'LEVEL 01 · BEGINNER (Layer-by-Layer)',
  'level-2': 'LEVEL 02 · 2-LOOK CFOP',
  'level-3': 'LEVEL 03 · FULL CFOP MASTER',
  'level-4': 'LEVEL 04 · EXPERT (ZBLL SYSTEM)',
};

export const Step3SolveInteractive: React.FC<Step3SolveInteractiveProps> = ({
  selectedLevel: initialLevel,
  onBackToScan,
  onSwitchLevel,
  customAlgorithm,
  onClearCustomAlgorithm,
  scannedCubeState,
  onUpdateScannedCube,
  demoScramble,
  onSetDemoScramble,
  analyzedSolve,
  onClearAnalyzedSolve,
}) => {
  const [activeLevel, setActiveLevel] = useState<SolverLevelId>(initialLevel);
  const DEMO_SCRAMBLE = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<'Iso' | 'Bottom' | 'Top' | 'Front'>('Iso');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [copiedDemoScramble, setCopiedDemoScramble] = useState(false);

  const isMissingScannedCube = !scannedCubeState && !customAlgorithm && !isAlertDismissed;

  const handleCopyDemoScramble = (scramble: string) => {
    navigator.clipboard.writeText(scramble);
    setCopiedDemoScramble(true);
    sound.playTick();
    setTimeout(() => setCopiedDemoScramble(false), 2000);
  };

  const handleLoadDemoInStep3 = () => {
    sound.playPBChord();
    const targetScramble = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    const demo = applyScramble(targetScramble);
    onUpdateScannedCube?.(demo);
    onSetDemoScramble?.(targetScramble);
    setIsAlertDismissed(true);
  };

  // Cross Advisor & Inspection Analysis for current cube and active level
  const crossAdvisor = useMemo(() => {
    return getCrossAdvisor(scannedCubeState || null, activeLevel);
  }, [scannedCubeState, activeLevel]);

  // Solution data based on activeLevel or customAlgorithm or dynamic scramble or solved state
  const solutionData = useMemo(() => {
    if (customAlgorithm) {
      const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
      const moves = createMoves(sanitizedNotation, 1);
      const customStage: SolutionStage = {
        id: 'custom-alg-stage',
        stageNumber: 1,
        titleVi: `Công Thức: ${customAlgorithm.name}`,
        titleEn: `Algorithm: ${customAlgorithm.name}`,
        subtitle: customAlgorithm.notation,
        status: 'active',
        movesCount: moves.length,
        formulaSummary: customAlgorithm.notation,
        moves,
        caseDetails: {
          caseName: customAlgorithm.name,
          probability: customAlgorithm.prob || 'WCA Standard',
          description: customAlgorithm.descriptionVi || `Công thức WCA cho trường hợp ${customAlgorithm.name}`,
          formula: customAlgorithm.notation,
          holdingNote: customAlgorithm.holdingNoteVi || 'Giữ khối Rubik theo hướng chuẩn trước khi bắt đầu chuỗi ngón tay.',
          topDownPattern: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
          patternNote: `${customAlgorithm.category} Case`,
        },
      };
      return {
        levelId: 'custom' as SolverLevelId,
        totalMoves: moves.length,
        estTime: `~${Math.max(1, (moves.length * 0.45)).toFixed(1)}s`,
        stages: [customStage],
      };
    }

    // Task 4: Solved Cube Reset Handling: Detect isCubeSolved(scannedCubeState) and return clean 0 moves
    if (scannedCubeState && isCubeSolved(scannedCubeState)) {
      return {
        levelId: activeLevel,
        totalMoves: 0,
        stages: [],
        currentStageIndex: 0,
        estTime: '0.0s',
      };
    }

    return getSolutionForLevel(activeLevel, demoScramble || undefined, scannedCubeState || undefined);
  }, [activeLevel, customAlgorithm, demoScramble, scannedCubeState]);


  // Flattened all moves across all stages
  const allMoves = useMemo(() => {
    return solutionData.stages.flatMap((s) => s.moves);
  }, [solutionData]);

  const [currentMoveGlobalIdx, setCurrentMoveGlobalIdx] = useState<number>(0);
  const [isAllCompleted, setIsAllCompleted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'0.5x' | '1.0x' | '2.0x'>('1.0x');
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);

  // Task 1: Live mathematical state tracking at step k
  const baseCubeState = useMemo(() => {
    if (customAlgorithm) {
      const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
      return applyScramble(invertMoves(sanitizedNotation));
    }
    if (scannedCubeState) return scannedCubeState;
    const targetScramble = demoScramble || DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    return applyScramble(targetScramble);
  }, [customAlgorithm, scannedCubeState, demoScramble, activeLevel]);

  const currentCubeState = useMemo(() => {
    let state = cloneCube(baseCubeState);
    const movesToApply = allMoves.slice(0, currentMoveGlobalIdx);
    for (const m of movesToApply) {
      state = applyMove(state, m.move);
    }
    return state;
  }, [baseCubeState, allMoves, currentMoveGlobalIdx]);

  const isActuallySolved = useMemo(() => {
    if (allMoves.length > 0 && currentMoveGlobalIdx < allMoves.length) {
      return false; // Still moves remaining
    }
    return isCubeSolved(currentCubeState);
  }, [allMoves.length, currentMoveGlobalIdx, currentCubeState]);

  // Task 5: Fire celebration/confetti only after the final move's 3D rotation animation has completed
  const handleAnimationComplete = useCallback(() => {
    if (isActuallySolved && currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0) {
      if (!isAllCompleted) {
        setIsAllCompleted(true);
        sound.playPBChord();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [isActuallySolved, currentMoveGlobalIdx, allMoves.length, isAllCompleted]);

  // If already solved (e.g. 0 moves), immediately mark completed cleanly without animation
  useEffect(() => {
    if (allMoves.length === 0 && isActuallySolved) {
      setIsAllCompleted(true);
    }
  }, [allMoves.length, isActuallySolved]);

  const handleResetToDemo = () => {
    sound.playPBChord();
    onClearAnalyzedSolve?.();
    onClearCustomAlgorithm?.();
    const targetScramble = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    const demo = applyScramble(targetScramble);
    onUpdateScannedCube?.(demo);
    onSetDemoScramble?.(targetScramble);
    setCurrentMoveGlobalIdx(0);
    setIsAllCompleted(false);
    setIsPlaying(false);
    setIsAlertDismissed(true);
    setIsResetMenuOpen(false);
  };

  const handleResetToSolved = () => {
    sound.playPBChord();
    onClearAnalyzedSolve?.();
    onClearCustomAlgorithm?.();
    onUpdateScannedCube?.(SOLVED_CUBE);
    onSetDemoScramble?.(null);
    setCurrentMoveGlobalIdx(0);
    setIsAllCompleted(true);
    setIsPlaying(false);
    setIsAlertDismissed(true);
    setIsResetMenuOpen(false);
  };

  // Current active stage is dynamically determined by the active move, with safe fallback for 0-move solved cube
  const currentStage = useMemo(() => {
    if (!solutionData.stages || solutionData.stages.length === 0) {
      return {
        id: 'solved-stage',
        stageNumber: 1,
        titleVi: 'Khối Đã Giải Hoàn Tất (0 Moves)',
        titleEn: 'Solved Cube (0 Moves)',
        subtitle: '100% Solved',
        status: 'done' as const,
        movesCount: 0,
        formulaSummary: '0 Moves',
        moves: [],
        caseDetails: {
          caseName: 'Khối Đã Giải',
          probability: '100% Solved',
          description: 'Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)',
          formula: '0 Moves',
          holdingNote: 'Khối đã hoàn tất 6 mặt đồng màu.',
          patternNote: 'Hoàn Thành 100%',
        },
      };
    }
    const idx = Math.min(currentMoveGlobalIdx, Math.max(0, allMoves.length - 1));
    const move = allMoves[idx];
    if (move) {
      const matched = solutionData.stages.find((s) =>
        s.moves.some((m) => m.num === move.num)
      );
      if (matched) return matched;
    }
    return solutionData.stages[solutionData.stages.length - 1] || solutionData.stages[0];
  }, [solutionData.stages, allMoves, currentMoveGlobalIdx]);

  // Dynamic layer highlight text for 3D Viewer HUD
  const activeStageHint = useMemo(() => {
    if (isActuallySolved) {
      return allMoves.length === 0
        ? '🎉 Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)'
        : '🎉 Chúc mừng! Khối Rubik đã được giải hoàn tất 100%!';
    }
    if (currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0) {
      return '⭐ Đã hoàn thành các bước xoay';
    }
    if (!currentStage) return undefined;
    const num = currentStage.stageNumber;
    if (activeLevel === 'level-1') {
      if (num === 1) return '⭐ Chữ Thập Trắng (Mặt Đáy D)';
      if (num === 2) return "⭐ 4 Góc Trắng Tầng 1 (R U R' U')";
      if (num === 3) return '⭐ 4 Cạnh Tầng 2';
      if (num === 4) return "⭐ Chữ Thập Vàng Tầng 3 (F R U R' U' F')";
      if (num === 5) return '⭐ Đúng Màu Cạnh Vàng (Sune)';
      if (num === 6) return '⭐ Hoán Vị Góc Vàng (Niklas)';
      if (num === 7) return "⭐ Lật Góc Vàng (R' D' R D)";
    }
    // Default CFOP hints
    if (num === 1) return '⭐ Chữ Thập Trắng (Mặt Đáy D)';
    if (num === 2) return '⭐ 2 Tầng Đầu Tiên (F2L)';
    if (num === 3) return '⭐ Định Hướng Mặt Vàng (OLL)';
    if (num === 4) return '⭐ Hoán Vị Tầng Cuối (PLL)';
    return `⭐ ${currentStage.titleVi}`;
  }, [currentStage, activeLevel, currentMoveGlobalIdx, allMoves.length, isActuallySolved]);


  // When activeLevel, customAlgorithm, or analyzedSolve changes, reset playback and sync cube
  useEffect(() => {
    setCurrentMoveGlobalIdx(0);
    setIsAllCompleted(false);
    setIsPlaying(false);

    // Task 3: Fix Algorithm Library "Practice in 3D" Setup: Set cube to invertMoves(customAlgorithm.notation)
    if (customAlgorithm) {
      const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
      const setupState = applyScramble(invertMoves(sanitizedNotation));
      onUpdateScannedCube?.(setupState);
      onSetDemoScramble?.(null);
      return;
    }

    if (analyzedSolve && analyzedSolve.scramble) {
      const solveCube = applyScramble(analyzedSolve.scramble);
      onUpdateScannedCube?.(solveCube);
      onSetDemoScramble?.(analyzedSolve.scramble);
      return;
    }

    const LEGACY_CFOP_SCRAMBLE =
      "F R U' R' U R U R2 F' R U R U R' U' R U' R' F' U' F U2 R U R' U' F' U' F U R U R' U2 R U' R' U F2 R D2 F' R D";

    const isBuiltInDemo =
      !demoScramble ||
      Object.values(DEMO_SCRAMBLES).includes(demoScramble) ||
      demoScramble === LEGACY_CFOP_SCRAMBLE;

    // Switch to the active level's matching built-in demo scramble & 3D cube state
    if (isBuiltInDemo && (demoScramble || !scannedCubeState)) {
      const targetScramble = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
      const demoCube = applyScramble(targetScramble);
      onUpdateScannedCube?.(demoCube);
      onSetDemoScramble?.(targetScramble);
    }
  }, [activeLevel, customAlgorithm, analyzedSolve]);

  // Synchronize on mount if no scramble/cube state is present
  useEffect(() => {
    if (customAlgorithm) {
      const sanitizedNotation = customAlgorithm.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
      const setupState = applyScramble(invertMoves(sanitizedNotation));
      onUpdateScannedCube?.(setupState);
      onSetDemoScramble?.(null);
      return;
    }
    if (analyzedSolve && analyzedSolve.scramble) {
      const solveCube = applyScramble(analyzedSolve.scramble);
      onUpdateScannedCube?.(solveCube);
      onSetDemoScramble?.(analyzedSolve.scramble);
      return;
    }
    const LEGACY_CFOP_SCRAMBLE =
      "F R U' R' U R U R2 F' R U R U R' U' R U' R' F' U' F U2 R U R' U' F' U' F U R U R' U2 R U' R' U F2 R D2 F' R D";
    const isAnyBuiltInDemo =
      demoScramble &&
      (Object.values(DEMO_SCRAMBLES).includes(demoScramble) || demoScramble === LEGACY_CFOP_SCRAMBLE);

    if (
      (isAnyBuiltInDemo && demoScramble !== DEMO_SCRAMBLES[activeLevel]) ||
      (!demoScramble && !scannedCubeState)
    ) {
      const targetScramble = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
      const demoCube = applyScramble(targetScramble);
      onUpdateScannedCube?.(demoCube);
      onSetDemoScramble?.(targetScramble);
    }
  }, []);

  const currentMove =
    allMoves[Math.min(currentMoveGlobalIdx, Math.max(0, allMoves.length - 1))] || {
      move: '—',
      num: 0,
      textVi: isActuallySolved ? 'Khối Rubik đã giải hoàn tất 100%' : 'Chưa có bước xoay',
      textEn: isActuallySolved ? 'Cube is 100% solved' : 'No moves',
      holdTip: '6 mặt đã hoàn thành',
      angle: '0°',
      slice: '—',
    };

  // Auto-play interval: cleanly advances moves; celebration triggers after animation completes
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      const ms = playbackSpeed === '0.5x' ? 2200 : playbackSpeed === '2.0x' ? 650 : 1200;
      interval = window.setInterval(() => {
        setCurrentMoveGlobalIdx((prev) => {
          if (prev >= allMoves.length) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (next >= allMoves.length) {
            setIsPlaying(false);
          } else {
            sound.playTick();
          }
          return next;
        });
      }, ms);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, allMoves.length]);


  // Keyboard navigation: Space (play/pause), Left (prev), Right (next), Alt+S (rescan), Enter (complete stage)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextMove();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMove();
      } else if (e.code === 'Home') {
        e.preventDefault();
        handleResetToBeginning();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else if (isPlaying) {
          setIsPlaying(false);
        }
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onBackToScan();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleMarkStageComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNextMove = () => {
    if (currentMoveGlobalIdx < allMoves.length) {
      const next = currentMoveGlobalIdx + 1;
      setCurrentMoveGlobalIdx(next);
      if (next < allMoves.length) {
        sound.playTick();
      }
    }
  };

  const handlePrevMove = () => {
    if (currentMoveGlobalIdx > 0) {
      setCurrentMoveGlobalIdx((prev) => prev - 1);
      setIsAllCompleted(false);
      sound.playTick();
    }
  };


  const handleResetToBeginning = () => {
    setCurrentMoveGlobalIdx(0);
    setIsPlaying(false);
    setIsAllCompleted(false);
    sound.playTick();
  };

  // Jump to specific stage
  const handleSelectStage = (stage: SolutionStage) => {
    sound.playTick();
    setIsAllCompleted(false);
    const startIdx = allMoves.findIndex((m) => m.num === (stage.moves[0]?.num || 1));
    if (startIdx !== -1) {
      setCurrentMoveGlobalIdx(startIdx);
    }
  };

  // Mark stage complete
  const handleMarkStageComplete = () => {
    const currentIdx = solutionData.stages.findIndex((s) => s.id === currentStage.id);
    if (currentIdx < solutionData.stages.length - 1) {
      const nextStage = solutionData.stages[currentIdx + 1];
      handleSelectStage(nextStage);
    } else {
      setCurrentMoveGlobalIdx(allMoves.length);
      if (isActuallySolved) {
        setIsAllCompleted(true);
        sound.playPBChord();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
    }
  };

  // Copy formula
  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 1800);
  };

  // Show all moves of the current stage in the algorithmic execution tape
  const tapeMoves = useMemo(() => {
    if (!currentStage || !currentStage.moves || currentStage.moves.length === 0) {
      return allMoves;
    }
    return currentStage.moves;
  }, [allMoves, currentStage]);


  return (
    <div className="space-y-5 animate-fade-in">
      {/* ALERT BANNER: NO SCANNED RUBIK FOUND */}
      {isMissingScannedCube && (
        <section className="w-full bg-amber-50 border border-amber-300 rounded-[20px] p-4 sm:p-5 shadow-[0_2px_12px_rgba(245,158,11,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in text-amber-950 font-sans">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-neutral-900">
                  Chưa phát hiện khối Rubik đã quét (Scanned Rubik Not Found)
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300">
                  CHƯA QUÉT CAMERA
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-600 mt-1 leading-relaxed">
                Khối Rubik 3D bên dưới hiện đang dùng trạng thái mẫu mặc định vì chưa nhận được dữ liệu quét 6 mặt từ camera Bước 2. Hãy quay lại quét camera để nhận diện đúng khối Rubik của bạn hoặc nạp khối mẫu xáo trộn sẵn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={onBackToScan}
              className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Quay Lại Quét Camera</span>
              <kbd className="hidden sm:inline-block keycap-dark ml-0.5">Alt+S</kbd>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoInStep3}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-[#D0D5DD] font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              title="Dùng khối Rubik mẫu xáo trộn sẵn để kiểm tra thử"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dùng Khối Mẫu (Demo)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAlertDismissed(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-amber-100/60 transition-colors"
              title="Đóng thông báo này"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* TOP SUMMARY HUD CARD */}
      <section className="w-full bg-white border border-[#EAECEF] rounded-[20px] p-3 sm:px-5 sm:py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mode pill with clean Switch Level Dropdown */}
        <div className="relative flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F4F6] border border-[#EAECEF] text-[11px] sm:text-xs font-bold text-neutral-900">
            <span className={`w-2 h-2 rounded-full ${customAlgorithm ? 'bg-emerald-500' : 'bg-blue-600'}`} />
            <span className="truncate max-w-[200px] sm:max-w-none">
              {customAlgorithm ? `CÔNG THỨC · ${customAlgorithm.name}` : LEVEL_LABELS[activeLevel]}
            </span>
          </div>

          {/* Switch Level Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-[#F3F4F6] transition-colors border border-[#EAECEF] flex items-center gap-1"
            >
              <span>{customAlgorithm || analyzedSolve ? 'Đổi / Thoát ▾' : 'Đổi Cấp Độ ▾'}</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-white rounded-2xl border border-[#EAECEF] shadow-xl p-2 z-50 animate-fade-in">
                {(customAlgorithm || analyzedSolve) && (
                  <button
                    onClick={() => {
                      onClearCustomAlgorithm?.();
                      onClearAnalyzedSolve?.();
                      setIsDropdownOpen(false);
                      sound.playTick();
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-mono text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between border-b border-neutral-100 mb-1"
                  >
                    <span>Thoát Phân Tích / Công Thức</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {(['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      onClearCustomAlgorithm?.();
                      onClearAnalyzedSolve?.();
                      setActiveLevel(lvl);
                      setIsDropdownOpen(false);
                      sound.playTick();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-colors flex items-center justify-between ${
                      !customAlgorithm && !analyzedSolve && activeLevel === lvl
                        ? 'bg-[#111111] text-white font-bold'
                        : 'hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <span>{LEVEL_LABELS[lvl]}</span>
                    {!customAlgorithm && !analyzedSolve && activeLevel === lvl && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Monospace status metrics */}
        <div className="font-mono text-[10.5px] sm:text-xs text-neutral-500 tracking-wide flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <span>
            <strong className="text-neutral-900">GIẢI:</strong> {solutionData.totalMoves} BƯỚC
          </span>
          <span className="text-neutral-300">•</span>
          <span>
            <strong className="text-neutral-900">GIAI ĐOẠN:</strong> {currentStage.stageNumber}/{solutionData.stages.length}
          </span>
          <span className="text-neutral-300">•</span>
          <span>
            <strong className="text-neutral-900">THỜI GIAN:</strong> {solutionData.estTime}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onBackToScan}
            className="px-3 py-1.5 rounded-full text-xs font-mono font-medium text-neutral-700 hover:text-neutral-900 hover:bg-[#F3F4F6] border border-[#EAECEF] transition-all flex items-center gap-1.5"
            title="Quét Lại (Alt+S)"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Quét Lại</span>
            <kbd className="hidden sm:inline text-[10px] bg-white px-1 py-0.5 rounded border border-[#EAECEF] text-neutral-900">Alt+S</kbd>
          </button>

          <button
            onClick={() => window.alert('Exporting PDF Solution Guide...')}
            className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#111111] text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </section>

      {/* DEMO SCRAMBLE FORMULA HUD CARD */}
      {demoScramble && (
        <section className="w-full bg-[#111111] text-white rounded-[20px] p-3.5 sm:px-5 sm:py-4 border border-neutral-800 shadow-md flex flex-col md:flex-row md:items-start justify-between gap-3.5 animate-fade-in font-mono">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              <span className={`w-2 h-2 rounded-full animate-ping ${analyzedSolve ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span
                className={`px-2 py-0.5 rounded text-black text-[10px] sm:text-[11px] font-black tracking-wider uppercase ${
                  analyzedSolve ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              >
                {analyzedSolve
                  ? `SOLVE #${analyzedSolve.id} (${(analyzedSolve.timeMs / 1000).toFixed(2)}s) · ${demoScramble.trim().split(/\s+/).filter(Boolean).length} BƯỚC`
                  : `DEMO SCRAMBLE · ${demoScramble.trim().split(/\s+/).filter(Boolean).length} BƯỚC`}
              </span>
            </div>
            <div className="text-xs sm:text-[13.5px] font-bold tracking-wider text-neutral-100 whitespace-normal break-words leading-relaxed select-all flex-1">
              {demoScramble}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 border border-white/10 shadow-2xs cursor-pointer"
              title="Khôi phục lại màu khối Rubik chuẩn từ Demo Scramble"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Màu Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyDemoScramble(demoScramble)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 border border-white/10 shadow-2xs"
              title="Sao chép công thức xáo trộn demo"
            >
              {copiedDemoScramble ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400 font-bold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Sao chép Scramble</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* MAIN ASYMMETRIC SPLIT (55% LEFT / 45% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT BENTO ARENA (55% -> 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-[#EAECEF] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
            {/* Viewport Top Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#EAECEF] gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="px-3 py-1 rounded-full bg-[#111111] text-white font-mono text-xs font-bold tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>
                    {currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0
                      ? `Đã Giải Xong (${solutionData.totalMoves}/${solutionData.totalMoves})`
                      : `Move ${currentMove.num} of ${solutionData.totalMoves}`}
                  </span>
                </div>

                {/* Badge (clickable to open Reset Menu) */}
                <button
                  type="button"
                  onClick={() => setIsResetMenuOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium border cursor-pointer transition-all hover:scale-105 ${
                    demoScramble
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : scannedCubeState
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                  }`}
                  title="Click để đổi hoặc reset màu khối Rubik"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      demoScramble
                        ? 'bg-amber-500'
                        : scannedCubeState
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-neutral-400'
                    }`}
                  />
                  <span>{demoScramble ? 'Khối Mẫu (Demo)' : scannedCubeState ? 'Cube Đã Quét' : 'Cube Mặc Định'}</span>
                  <RotateCcw className="w-2.5 h-2.5 text-neutral-400 hover:text-neutral-700" />
                </button>

                <span className="font-semibold text-xs text-neutral-600 tracking-tight hidden md:inline">
                  {currentStage.titleVi}
                </span>
              </div>

              {/* Camera & Reset Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Reset Color Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsResetMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all border cursor-pointer ${
                      isResetMenuOpen
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-700 border-[#EAECEF] hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 shadow-2xs'
                    }`}
                    title="Đặt lại màu sắc khối Rubik (Mẫu Scramble, Khối Giải Sẵn hoặc Quét lại)"
                  >
                    <RotateCcw className="w-3 h-3 text-red-500" />
                    <span>Reset Màu</span>
                    <ChevronDown
                      className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${
                        isResetMenuOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {isResetMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsResetMenuOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                        <div className="px-3.5 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                          <span>Khôi Phục Màu Rubik 3D</span>
                          <span className="text-[9px] text-neutral-400 font-normal">WCA</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetToDemo}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-amber-50/60 flex items-start gap-2.5 transition-colors group cursor-pointer"
                        >
                          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-neutral-900 group-hover:text-amber-900">Khối Mẫu Demo (WCA)</div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1">Nạp lại 54 màu chuẩn từ Demo Scramble</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetToSolved}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-emerald-50/60 flex items-start gap-2.5 transition-colors group cursor-pointer"
                        >
                          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5 group-hover:scale-105 transition-transform">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-neutral-900 group-hover:text-emerald-900">Khối Đã Giải (Solved Cube)</div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1">6 mặt 6 màu chuẩn hoàn chỉnh</div>
                          </div>
                        </button>
                        <div className="border-t border-neutral-100 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetMenuOpen(false);
                            onBackToScan();
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-start gap-2.5 transition-colors group cursor-pointer"
                        >
                          <span className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 mt-0.5 group-hover:scale-105 transition-transform">
                            <Camera className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-neutral-900">Quét Lại Bằng Camera</div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1">Quay lại Bước 2 quét hoặc chỉnh màu tay</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Camera Angle Controls */}
                <div className="flex flex-wrap gap-1.5 justify-center items-center bg-[#F3F4F6] p-1 rounded-2xl sm:rounded-full border border-[#EAECEF]">
                  {[
                    { key: 'Iso', label: 'Phối Cảnh' },
                    { key: 'Bottom', label: 'Mặt Đáy (Cross)' },
                    { key: 'Top', label: 'Mặt Đỉnh (Vàng)' },
                    { key: 'Front', label: 'Mặt Trước (F)' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setCameraAngle(item.key as any)}
                      className={`px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                        cameraAngle === item.key
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                      title={`Chuyển góc camera sang ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* REAL THREE.JS INTERACTIVE 3D RUBIK'S CUBE VIEWPORT */}
            <ThreeCubeViewer
              currentMove={currentMove.move}
              moveIndex={currentMoveGlobalIdx}
              allMoves={allMoves}
              cameraPreset={cameraAngle}
              turnAngle={currentMove.angle}
              slice={currentMove.slice}
              initialCubeState={baseCubeState}
              activeStageHint={activeStageHint}
              isSolved={isActuallySolved}
              playbackSpeed={playbackSpeed}
              onAnimationComplete={handleAnimationComplete}
            />


            {/* ALGORITHMIC EXECUTION TAPE / FORMULA BOX */}
            <div className="bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#EAECEF]/60 text-[11px] font-mono text-neutral-400 font-semibold uppercase tracking-wider">
                <span>ALGORITHMIC EXECUTION TAPE</span>
                <span className="text-neutral-600 font-bold">
                  {currentStage.caseDetails?.caseName || currentStage.subtitle}
                </span>
              </div>

              {/* Tape Reel (All moves of current stage wrapped cleanly) */}
              <div className="flex flex-wrap items-center gap-2 px-1 py-1.5 max-h-36 sm:max-h-48 overflow-y-auto">
                {tapeMoves.length === 0 ? (
                  <div className="py-3 px-4 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)</span>
                  </div>
                ) : (
                  tapeMoves.map((m) => {
                    const isCurrentTarget = m.num === currentMove.num && currentMoveGlobalIdx < allMoves.length;
                    const isAllDone = isActuallySolved || (currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0);

                    return (
                      <div
                        key={m.num}
                        onClick={() => {
                          const targetIdx = allMoves.findIndex((mv) => mv.num === m.num);
                          if (targetIdx !== -1) {
                            setCurrentMoveGlobalIdx(targetIdx);
                          }
                          setIsAllCompleted(false);
                          sound.playTick();
                        }}
                        className={`font-mono px-3.5 py-2.5 rounded-xl flex flex-col items-center justify-center min-w-[58px] cursor-pointer transition-all ${
                          isCurrentTarget
                            ? 'bg-[#111111] text-white shadow-md scale-105 ring-2 ring-emerald-500'
                            : isAllDone
                            ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-bold'
                            : 'bg-white text-neutral-800 border border-[#EAECEF] hover:border-neutral-400'
                        }`}
                      >
                        <span className="font-bold text-xl leading-none">{m.move}</span>
                        <span
                          className={`text-[9px] mt-1 ${
                            isCurrentTarget
                              ? 'text-emerald-400 font-bold'
                              : isAllDone
                              ? 'text-emerald-600 font-bold'
                              : 'text-neutral-400'
                          }`}
                        >
                          {isAllDone ? 'ĐÃ GIẢI ✓' : isCurrentTarget ? 'ACTIVE' : `#${m.num}`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>


              {/* Clear Vietnamese Explanation & Sub-metrics */}
              <div className="pt-2 border-t border-[#EAECEF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-900">
                    {currentMove.textVi}{' '}
                    <span className="text-neutral-400 font-normal">
                      ({currentMove.holdTip})
                    </span>
                  </span>
                </div>

                <div className="font-mono text-[11px] text-neutral-500 shrink-0">
                  Góc xoay: <span className="font-bold text-neutral-900">{currentMove.angle}</span> ·
                  Lát cắt: <span className="font-bold text-neutral-900">{currentMove.slice}</span>
                </div>
              </div>
            </div>

            {/* BOTTOM CONTROL ROW */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Precision Playback Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetToBeginning}
                  className="px-2.5 py-2 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F3F4F6] text-neutral-800 font-mono text-xs font-bold transition-all shadow-sm"
                  title="Về Đầu [Home]"
                >
                  |&lt;
                </button>

                <button
                  disabled={currentMoveGlobalIdx === 0}
                  onClick={handlePrevMove}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F3F4F6] text-neutral-800 text-xs font-semibold transition-all shadow-sm flex items-center gap-1 disabled:opacity-30"
                  title="Lùi 1 Nước [Mũi tên trái]"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>Lùi</span>
                </button>

                <button
                  onClick={() => {
                    if (currentMoveGlobalIdx >= allMoves.length) {
                      setCurrentMoveGlobalIdx(0);
                      setIsAllCompleted(false);
                      setIsPlaying(true);
                      sound.playTick();
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className="px-3 sm:px-5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>
                    {isPlaying
                      ? 'Tạm Dừng'
                      : currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0
                      ? 'Phát Lại'
                      : 'Tự Động'}
                  </span>
                  <span className="hidden sm:inline-block keycap-dark ml-0.5">Space</span>
                </button>

                <button
                  disabled={currentMoveGlobalIdx >= allMoves.length}
                  onClick={handleNextMove}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F3F4F6] text-neutral-800 text-xs font-semibold transition-all shadow-sm flex items-center gap-1 disabled:opacity-30"
                  title="Tiến 1 Nước [Mũi tên phải]"
                >
                  <span>{currentMoveGlobalIdx >= allMoves.length ? 'Đã Xong' : 'Tiến'}</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>


              {/* Speed Selector & Smart Cube Sync */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#EAECEF] text-xs font-mono">
                  {(['0.5x', '1.0x', '2.0x'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        playbackSpeed === spd
                          ? 'bg-white text-neutral-900 font-bold shadow-sm'
                          : 'text-neutral-500'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>

                <label className="hidden sm:flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-500 hover:text-neutral-900">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[#D1D5DB] text-neutral-900 focus:ring-0 cursor-pointer accent-black w-3.5 h-3.5"
                  />
                  <span>
                    Smart Cube Sync{' '}
                    <span className="text-emerald-600 font-bold font-mono">(Synced)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* INSPECTION & CROSS SELECTION ADVISOR CARD */}
          <section className="bg-white rounded-[24px] border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3.5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#F2F4F7] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                  <Target className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    INSPECTION &amp; CROSS STRATEGY (15s WCA)
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900">
                    Gợi Ý Chọn Cross Theo Cấp Độ
                  </h3>
                </div>
              </div>

              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold tracking-tight">
                {crossAdvisor.badgeVi}
              </span>
            </div>

            {/* Recommendation Banner */}
            <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-[#EAECEF] flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                  style={{ backgroundColor: CUBE_HEX_COLORS[crossAdvisor.recommendedColor] }}
                />
                <span className="font-bold text-xs sm:text-sm text-neutral-900">
                  {crossAdvisor.titleVi}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                {crossAdvisor.summaryVi}
              </p>
            </div>

            {/* Holding Orientation HUD */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                QUY TẮC CẦM KHỐI (HOLDING ORIENTATION):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
                  <span className="w-3 h-3 rounded-full bg-white border border-neutral-400 shrink-0 shadow-2xs" />
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT ĐÁY (D)</span>
                    <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.bottomVi}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0 shadow-2xs" />
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT ĐỈNH (U)</span>
                    <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.topVi}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT TRƯỚC (F)</span>
                    <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.frontVi}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Beginner LBL Special Pedagogy Guide */}
            {crossAdvisor.beginnerGuide && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col gap-2 mt-0.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[12px]">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Hướng Dẫn Người Mới: Phương Pháp Hoa Cúc (Daisy) vs Cross Trực Tiếp</span>
                </div>
                <p className="leading-relaxed text-[11.5px] text-neutral-700">
                  <strong className="text-amber-900 font-semibold">1. Phương pháp Hoa Cúc (Daisy): </strong>
                  {crossAdvisor.beginnerGuide.daisyMethodVi}
                </p>
                <p className="leading-relaxed text-[11.5px] text-neutral-700">
                  <strong className="text-amber-900 font-semibold">2. White Cross Trực Tiếp: </strong>
                  {crossAdvisor.beginnerGuide.directCrossVi}
                </p>
                <p className="leading-relaxed text-[11px] text-neutral-500 italic pt-1 border-t border-amber-200/60">
                  💡 {crossAdvisor.beginnerGuide.whyWhiteFirstVi}
                </p>
              </div>
            )}

            {/* Advanced / CFOP Cross Faces Evaluation Chips */}
            {activeLevel !== 'level-1' && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  SO SÁNH 6 MẶT CROSS (COLOR EVALUATION):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {crossAdvisor.options.map((opt) => (
                    <div
                      key={opt.faceKey}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        opt.isRecommended
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                          : 'bg-white border-[#EAECEF] hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                        <span className="font-mono text-[10.5px] font-bold text-neutral-800">
                          {opt.faceKey} · {opt.colorNameVi}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-extrabold text-neutral-900">
                        ~{opt.estimatedMoves} Moves
                      </span>
                      <span className="text-[9.5px] font-mono text-neutral-500 mt-0.5">
                        {opt.solvedEdgesCount}/4 Cạnh Sẵn
                      </span>
                      {opt.isRecommended && (
                        <span className="mt-1 px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono text-[8.5px] font-bold tracking-tight">
                          TOP PICK
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>


        {/* RIGHT BENTO CARD: SOLUTION ROADMAP & FORMULAS (45% -> 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-[#EAECEF] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECEF]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-900">Solution Roadmap</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] text-neutral-500 font-medium">
                  {solutionData.stages.length} Stages
                </span>
              </div>
              <span className="font-mono text-xs text-neutral-400 font-medium">
                Step {currentMove.num} / {solutionData.totalMoves}
              </span>
            </div>

            {/* Clickable Bento Stage Cards Stack */}
            <div className="flex flex-col gap-3">
              {solutionData.stages.length === 0 ? (
                <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">
                      Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Tất cả 6 mặt đều đồng màu chuẩn WCA hoàn chỉnh. Không cần thực hiện thêm bước giải nào.
                    </p>
                  </div>
                </div>
              ) : (
                solutionData.stages.map((stage) => {
                const isActive = stage.id === currentStage.id && !isAllCompleted;
                const isDone = isAllCompleted || stage.stageNumber < currentStage.stageNumber;

                if (isActive) {
                  return (
                    <div
                      key={stage.id}
                      className="p-4 rounded-xl bg-white border-2 border-neutral-900 shadow-sm flex flex-col gap-3 relative transition-all"
                    >
                      {/* Active Stage Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#111111] text-white font-mono flex items-center justify-center text-xs font-bold">
                            {stage.stageNumber.toString().padStart(2, '0')}
                          </div>
                          <span className="text-xs font-extrabold text-neutral-900">
                            {stage.titleVi}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#111111] text-white font-mono text-[10px] font-bold tracking-tight">
                          ACTIVE STEP · Move {currentMove.num}/{solutionData.totalMoves}
                        </span>
                      </div>

                      {/* 2D Top-Down Mini Diagram + Details */}
                      {stage.caseDetails && (
                        <div className="grid grid-cols-12 gap-3 pt-1">
                          {/* Rich Speedcubing Case Diagram (5 Cols) */}
                          <div className="col-span-12 sm:col-span-5 flex flex-col justify-center">
                            <SpeedcubeCaseDiagram
                              caseName={stage.caseDetails.caseName}
                              diagramTitle={stage.caseDetails.diagramTitle}
                              diagramType={stage.caseDetails.diagramType}
                              patternNote={stage.caseDetails.patternNote}
                              topDownPattern={stage.caseDetails.topDownPattern}
                            />
                          </div>

                          {/* Details & Formula Box (7 Cols) */}
                          <div className="col-span-12 sm:col-span-7 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-neutral-900 font-bold">
                                  {stage.caseDetails.caseName}
                                </span>
                                <span className="font-mono text-[10.5px] text-neutral-400">
                                  {stage.caseDetails.probability}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                                {stage.caseDetails.description}
                              </p>
                            </div>

                            {/* Standard Speedcubing Formula with Copy */}
                            <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-lg p-2 font-mono text-xs font-bold text-neutral-900 mt-2 flex items-start justify-between gap-2">
                              <span className="select-all whitespace-normal break-words leading-relaxed flex-1">{stage.caseDetails.formula}</span>
                              <button
                                onClick={() => handleCopyFormula(stage.caseDetails!.formula)}
                                className="p-1 rounded text-neutral-400 hover:text-neutral-900 shrink-0"
                                title="Copy Formula"
                              >
                                {copiedFormula ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Holding Note */}
                      {stage.caseDetails?.holdingNote && (
                        <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] font-mono text-neutral-600 flex items-start gap-2">
                          <span className="font-bold text-neutral-900 shrink-0">Holding Note:</span>
                          <span>{stage.caseDetails.holdingNote}</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // Completed or Pending Stage
                return (
                  <div
                    key={stage.id}
                    onClick={() => handleSelectStage(stage)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isDone
                        ? 'bg-[#F8F9FA] border-[#EAECEF] hover:bg-neutral-100'
                        : 'bg-white border-[#EAECEF] opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isDone ? 'bg-[#111111] text-white' : 'border border-neutral-300 text-neutral-400 font-mono'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.stageNumber}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900">
                          {stage.titleVi}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400 whitespace-normal break-words leading-relaxed">
                          {stage.formulaSummary || stage.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
                          DONE
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {/* Bottom CTA Button */}
            <button
              disabled={solutionData.stages.length === 0}
              onClick={handleMarkStageComplete}
              className="w-full py-3.5 px-4 rounded-xl bg-[#111111] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-2"
            >
              <span>
                {isAllCompleted || isActuallySolved
                  ? 'Khối Rubik Đã Giải Hoàn Tất!'
                  : currentStage.stageNumber < solutionData.stages.length
                  ? `Hoàn Thành Bước ${currentStage.stageNumber} (Next Stage)`
                  : 'Hoàn Thành Toàn Bộ Lời Giải!'}
              </span>
              {solutionData.stages.length > 0 && <span className="hidden sm:inline-block keycap-dark">Enter</span>}
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
