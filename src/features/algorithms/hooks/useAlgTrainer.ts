import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { CubeNetState, applyScramble, invertMoves } from '../../../utils/cubeState';
import { sound } from '../../../utils/audio';
import { DrillPoolType } from '../components/DrillModeModal';
import { MasteryStatus } from '../components/AlgCardGrid';

const PRE_AUF_OPTIONS = ['', 'U', "U'", 'U2'] as const;

export function useAlgTrainer(
  initialAlg: AlgorithmEntry,
  baseLevelAlgs: AlgorithmEntry[],
  allDatabaseAlgs: AlgorithmEntry[],
  masteryMap: Record<string, MasteryStatus>,
) {
  const [selectedTrainerAlg, setSelectedTrainerAlg] = useState<AlgorithmEntry>(initialAlg);
  const [trainerMoveIdx, setTrainerMoveIdx] = useState<number>(0);
  const [trainerSpeed, setTrainerSpeed] = useState<'0.5x' | '1.0x' | '2.0x'>('1.0x');
  const [isTrainerPlaying, setIsTrainerPlaying] = useState<boolean>(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  // Drill Mode State
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [drillPoolType, setDrillPoolType] = useState<DrillPoolType>('current');
  const [drillCase, setDrillCase] = useState<AlgorithmEntry | null>(null);
  const [drillPreAuf, setDrillPreAuf] = useState<string>('');
  const [drillRevealed, setDrillRevealed] = useState<boolean>(false);
  const [drillTimerState, setDrillTimerState] = useState<'idle' | 'holding' | 'running' | 'stopped'>('idle');
  const [drillElapsedMs, setDrillElapsedMs] = useState<number>(0);
  const drillStartRef = useRef<number>(0);
  const drillRafRef = useRef<number | null>(null);

  // Tokenized moves for the active algorithm
  const trainerMoves = useMemo(() => {
    const sanitized = selectedTrainerAlg.mainAlg.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
    if (!sanitized) return [];
    return sanitized.split(' ').map((mv) => ({ move: mv }));
  }, [selectedTrainerAlg.mainAlg]);

  // Initial inverse state for 3D Trainer
  const trainerInitialCubeState = useMemo<CubeNetState>(() => {
    if (selectedTrainerAlg.setupAlg && selectedTrainerAlg.setupAlg.trim()) {
      return applyScramble(selectedTrainerAlg.setupAlg);
    }
    const cleanFormula = selectedTrainerAlg.mainAlg.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
    const inverse = invertMoves(cleanFormula);
    return applyScramble(inverse);
  }, [selectedTrainerAlg]);

  // Trainer auto-play interval
  useEffect(() => {
    if (!isTrainerPlaying || isDrillMode) return;
    const ms = trainerSpeed === '0.5x' ? 1600 : trainerSpeed === '2.0x' ? 500 : 950;
    const timer = window.setInterval(() => {
      setTrainerMoveIdx((prev) => {
        if (prev >= trainerMoves.length) {
          setIsTrainerPlaying(false);
          return prev;
        }
        const next = prev + 1;
        sound.playTick();
        if (next >= trainerMoves.length) {
          setIsTrainerPlaying(false);
        }
        return next;
      });
    }, ms);
    return () => clearInterval(timer);
  }, [isTrainerPlaying, trainerSpeed, trainerMoves.length, isDrillMode]);

  // Pick Next Drill Case
  const pickNextDrillCase = useCallback(() => {
    let pool: AlgorithmEntry[] = [];
    if (drillPoolType === 'learning') {
      pool = allDatabaseAlgs.filter((a) => masteryMap[a.id] === 'learning');
    } else if (drillPoolType === 'mastered') {
      pool = allDatabaseAlgs.filter((a) => masteryMap[a.id] === 'mastered');
    }
    if (pool.length === 0) {
      pool = baseLevelAlgs;
    }
    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex] || pool[0];
    const randomAuf = PRE_AUF_OPTIONS[Math.floor(Math.random() * PRE_AUF_OPTIONS.length)];

    setDrillCase(chosen);
    setDrillPreAuf(randomAuf);
    setDrillRevealed(false);
    setDrillElapsedMs(0);
    setDrillTimerState('idle');
    sound.playTick();
  }, [drillPoolType, allDatabaseAlgs, baseLevelAlgs, masteryMap]);

  // Drill Cube State
  const drillCubeState = useMemo<CubeNetState>(() => {
    if (!drillCase) return applyScramble('');
    const cleanFormula = drillCase.mainAlg.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
    const inverse = invertMoves(cleanFormula);
    const scramble = drillPreAuf ? `${inverse} ${drillPreAuf}` : inverse;
    return applyScramble(scramble);
  }, [drillCase, drillPreAuf]);

  const optimalPreAufMove = useMemo(() => {
    if (!drillPreAuf) return 'None (0°)';
    if (drillPreAuf === 'U') return "U' (kéo U ngược lại)";
    if (drillPreAuf === "U'") return 'U (đẩy U thuận lại)';
    if (drillPreAuf === 'U2') return 'U2 (xoay 180°)';
    return drillPreAuf;
  }, [drillPreAuf]);

  // Drill timer animation frame
  useEffect(() => {
    if (drillTimerState === 'running') {
      const loop = () => {
        setDrillElapsedMs(Math.round(performance.now() - drillStartRef.current));
        drillRafRef.current = requestAnimationFrame(loop);
      };
      drillRafRef.current = requestAnimationFrame(loop);
    } else if (drillRafRef.current) {
      cancelAnimationFrame(drillRafRef.current);
      drillRafRef.current = null;
    }
    return () => {
      if (drillRafRef.current) cancelAnimationFrame(drillRafRef.current);
    };
  }, [drillTimerState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (isDrillMode) {
        if (e.altKey && (e.key === 'n' || e.key === 'N')) {
          e.preventDefault();
          pickNextDrillCase();
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          if (drillTimerState === 'idle' || drillTimerState === 'stopped') {
            setDrillTimerState('holding');
          } else if (drillTimerState === 'running') {
            const finalMs = Math.max(10, Math.round(performance.now() - drillStartRef.current));
            setDrillElapsedMs(finalMs);
            setDrillTimerState('stopped');
            setDrillRevealed(true);
            sound.playPBChord();
          }
        }
      } else {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsTrainerPlaying((prev) => {
            if (!prev && trainerMoveIdx >= trainerMoves.length) {
              setTrainerMoveIdx(0);
            }
            return !prev;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isDrillMode && e.code === 'Space' && drillTimerState === 'holding') {
        e.preventDefault();
        drillStartRef.current = performance.now();
        setDrillElapsedMs(0);
        setDrillTimerState('running');
        sound.playTick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isDrillMode,
    drillTimerState,
    pickNextDrillCase,
    trainerMoveIdx,
    trainerMoves.length,
  ]);

  return {
    selectedTrainerAlg,
    setSelectedTrainerAlg,
    trainerMoveIdx,
    setTrainerMoveIdx,
    trainerSpeed,
    setTrainerSpeed,
    isTrainerPlaying,
    setIsTrainerPlaying,
    isMobileSheetOpen,
    setIsMobileSheetOpen,
    isDrillMode,
    setIsDrillMode,
    drillPoolType,
    setDrillPoolType,
    drillCase,
    drillPreAuf,
    drillRevealed,
    setDrillRevealed,
    drillTimerState,
    setDrillTimerState,
    drillElapsedMs,
    setDrillElapsedMs,
    drillStartRef,
    trainerMoves,
    trainerInitialCubeState,
    drillCubeState,
    optimalPreAufMove,
    pickNextDrillCase,
  };
}
