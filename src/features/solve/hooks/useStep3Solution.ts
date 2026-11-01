import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CubeNetState,
  applyScramble,
  invertMoves,
  isCubeSolved,
  rotateWhiteToBottom,
  SOLVED_CUBE,
} from '../../../utils/cubeState';
import {
  SolutionData,
  SolutionStage,
  DEMO_SCRAMBLES,
  CFOP_DEMO_SCRAMBLE,
  getSolutionForLevel,
} from '../../../utils/solutionStages';
import { sound } from '../../../utils/audio';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { MoveTapeItem } from '../components/ExecutionTape';

interface UseStep3SolutionProps {
  scannedCubeState?: CubeNetState | null;
  activeLevel: 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4';
  demoScramble?: string | null;
  customAlgorithm?: CustomAlgorithmData | null;
  cfopLookMode: '2-look' | '1-look';
  onUpdateScannedCube?: (newState: CubeNetState) => void;
  onSetDemoScramble?: (scramble: string | null) => void;
}

export function useStep3Solution({
  scannedCubeState,
  activeLevel,
  demoScramble,
  customAlgorithm,
  cfopLookMode,
  onUpdateScannedCube,
  onSetDemoScramble,
}: UseStep3SolutionProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentMoveGlobalIdx, setCurrentMoveGlobalIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'0.5x' | '1.0x' | '2.0x'>('1.0x');
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState(0);

  const solutionData: SolutionData = useMemo(() => {
    if (customAlgorithm) {
      const sanitizedNotation = customAlgorithm.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
      const movesArr = sanitizedNotation.length > 0 ? sanitizedNotation.split(' ') : [];
      return {
        level: 'custom-alg',
        methodName: customAlgorithm.name,
        totalMoves: movesArr.length,
        estTime: `${Math.max(1, Math.round(movesArr.length * 1.5))}s`,
        stages: [
          {
            id: 'custom-alg-stage',
            stageNumber: 1,
            titleVi: customAlgorithm.name,
            subtitle: customAlgorithm.category,
            formulaSummary: sanitizedNotation,
            moves: movesArr.map((m, i) => ({
              move: m,
              num: i + 1,
              textVi: `Bước ${i + 1}: Xoay ${m}`,
              textEn: `Step ${i + 1}: Turn ${m}`,
              holdTip: customAlgorithm.fingertrickVi || 'Cầm khối đúng hướng',
              angle: '90°',
              slice: m[0],
            })),
            caseDetails: {
              caseName: customAlgorithm.name,
              formula: sanitizedNotation,
              description: customAlgorithm.descriptionVi || 'Công thức speedcubing chuẩn WCA',
              diagramTitle: customAlgorithm.category,
              probability: '1/1',
              diagramType: 'pll',
              holdingNote: customAlgorithm.fingertrickVi,
            },
          },
        ],
      };
    }

    if (scannedCubeState) {
      const currentLevelToSolve = activeLevel === 'auto-solve' ? 'level-2' : activeLevel;
      return getSolutionForLevel(currentLevelToSolve, scannedCubeState, cfopLookMode);
    }

    const fallbackScramble = demoScramble || DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    const initialCube = applyScramble(fallbackScramble);
    return getSolutionForLevel(activeLevel, initialCube, cfopLookMode);
  }, [activeLevel, scannedCubeState, demoScramble, customAlgorithm, cfopLookMode]);

  const baseCubeState: CubeNetState = useMemo(() => {
    if (customAlgorithm) {
      const sanitized = customAlgorithm.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
      return applyScramble(invertMoves(sanitized));
    }
    if (scannedCubeState) {
      return rotateWhiteToBottom(scannedCubeState);
    }
    const targetScramble = demoScramble || DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    return rotateWhiteToBottom(applyScramble(targetScramble));
  }, [customAlgorithm, scannedCubeState, demoScramble, activeLevel]);

  const allMoves = useMemo(() => {
    const list: MoveTapeItem[] = [];
    solutionData.stages.forEach((stg) => {
      stg.moves.forEach((m) => list.push(m));
    });
    return list;
  }, [solutionData]);

  const currentStage: SolutionStage = useMemo(() => {
    if (!solutionData.stages || solutionData.stages.length === 0) {
      return {
        id: 'solved-stage',
        stageNumber: 1,
        titleVi: 'Khối Đã Giải Hoàn Tất',
        subtitle: '100% Solved',
        moves: [],
      };
    }
    return solutionData.stages[currentStageIdx] || solutionData.stages[0];
  }, [solutionData, currentStageIdx]);

  const currentMove: MoveTapeItem =
    allMoves[Math.min(currentMoveGlobalIdx, Math.max(0, allMoves.length - 1))] || {
      move: '—',
      num: 0,
      textVi: isCubeSolved(baseCubeState) ? 'Khối Rubik đã giải hoàn tất 100%' : 'Chưa có bước xoay',
      textEn: 'No moves',
      holdTip: '6 mặt đã hoàn thành',
      angle: '0°',
      slice: '—',
    };

  const isActuallySolved = useMemo(() => {
    return isCubeSolved(baseCubeState) || (currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0);
  }, [baseCubeState, currentMoveGlobalIdx, allMoves.length]);

  const handleNextMove = useCallback(() => {
    setCurrentMoveGlobalIdx((prev) => {
      if (prev >= allMoves.length) return prev;
      sound.playTick();
      return prev + 1;
    });
  }, [allMoves.length]);

  const handlePrevMove = useCallback(() => {
    setCurrentMoveGlobalIdx((prev) => {
      if (prev <= 0) return 0;
      sound.playTick();
      return prev - 1;
    });
  }, []);

  const handleResetToBeginning = useCallback(() => {
    setCurrentMoveGlobalIdx(0);
    setIsPlaying(false);
    setIsAllCompleted(false);
    sound.playTick();
  }, []);

  const handleResetToDemo = useCallback(() => {
    const targetScramble = DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
    const demoCube = applyScramble(targetScramble);
    onUpdateScannedCube?.(demoCube);
    onSetDemoScramble?.(targetScramble);
    handleResetToBeginning();
  }, [activeLevel, onUpdateScannedCube, onSetDemoScramble, handleResetToBeginning]);

  const handleResetToSolved = useCallback(() => {
    onUpdateScannedCube?.(SOLVED_CUBE);
    onSetDemoScramble?.(null);
    handleResetToBeginning();
  }, [onUpdateScannedCube, onSetDemoScramble, handleResetToBeginning]);

  const handleSelectStage = useCallback((stage: SolutionStage) => {
    sound.playTick();
    setIsAllCompleted(false);
    setActiveSubStepIndex(0);
    const startIdx = allMoves.findIndex((m) => m.num === (stage.moves[0]?.num || 1));
    if (startIdx !== -1) {
      setCurrentMoveGlobalIdx(startIdx);
    }
  }, [allMoves]);

  const handleMarkStageComplete = useCallback(() => {
    const currentIdx = solutionData.stages.findIndex((s) => s.id === currentStage.id);
    if (currentIdx < solutionData.stages.length - 1) {
      handleSelectStage(solutionData.stages[currentIdx + 1]);
    } else {
      setCurrentMoveGlobalIdx(allMoves.length);
      if (isActuallySolved) {
        setIsAllCompleted(true);
        sound.playPBChord();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
    }
  }, [solutionData.stages, currentStage.id, handleSelectStage, allMoves.length, isActuallySolved]);

  // Stage synchronization with current move index
  useEffect(() => {
    if (allMoves.length === 0) return;
    const currentMv = allMoves[currentMoveGlobalIdx];
    if (!currentMv) return;
    const stageIdx = solutionData.stages.findIndex((stg) =>
      stg.moves.some((m) => m.num === currentMv.num),
    );
    if (stageIdx !== -1 && stageIdx !== currentStageIdx) {
      setCurrentStageIdx(stageIdx);
    }
  }, [currentMoveGlobalIdx, allMoves, solutionData.stages, currentStageIdx]);

  // Auto-play interval
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextMove();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextMove, handlePrevMove]);

  return {
    solutionData,
    baseCubeState,
    allMoves,
    currentStage,
    currentMove,
    isActuallySolved,
    currentStageIdx,
    setCurrentStageIdx,
    currentMoveGlobalIdx,
    setCurrentMoveGlobalIdx,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    isAllCompleted,
    setIsAllCompleted,
    activeSubStepIndex,
    setActiveSubStepIndex,
    handleNextMove,
    handlePrevMove,
    handleResetToBeginning,
    handleResetToDemo,
    handleResetToSolved,
    handleSelectStage,
    handleMarkStageComplete,
  };
}
