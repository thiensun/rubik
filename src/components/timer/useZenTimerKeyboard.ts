import { useEffect } from 'react';
import type { TimerState } from './ZenTimerStage';

interface UseZenTimerKeyboardOptions {
  timerState: TimerState;
  animFrameRef: React.MutableRefObject<number | null>;
  holdTimerRef: React.MutableRefObject<number | null>;
  inspectionIntervalRef: React.MutableRefObject<number | null>;
  splitsRef: React.MutableRefObject<number[]>;
  setSplits: React.Dispatch<React.SetStateAction<number[]>>;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
  setCurrentMs: React.Dispatch<React.SetStateAction<number>>;
  handleRunningTapOrSplit: () => void;
  handleHoldStart: () => void;
  handleHoldRelease: () => void;
  onReset: () => void;
  onTogglePenalty: () => void;
}

export function useZenTimerKeyboard({
  timerState,
  animFrameRef,
  holdTimerRef,
  inspectionIntervalRef,
  splitsRef,
  setSplits,
  setTimerState,
  setCurrentMs,
  handleRunningTapOrSplit,
  handleHoldStart,
  handleHoldRelease,
  onReset,
  onTogglePenalty,
}: UseZenTimerKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          if (timerState === 'running') handleRunningTapOrSplit();
          else handleHoldStart();
        }
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
        splitsRef.current = [];
        setSplits([]);
        setTimerState('idle');
        setCurrentMs(0);
        onReset();
        return;
      }
      if (timerState === 'running') {
        e.preventDefault();
        handleRunningTapOrSplit();
        return;
      }
      if ((e.key === '+' || e.key === '2') && (timerState === 'stopped' || timerState === 'idle')) {
        e.preventDefault();
        onTogglePenalty();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleHoldRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    timerState,
    animFrameRef,
    holdTimerRef,
    inspectionIntervalRef,
    splitsRef,
    setSplits,
    setTimerState,
    setCurrentMs,
    handleHoldStart,
    handleHoldRelease,
    handleRunningTapOrSplit,
    onReset,
    onTogglePenalty,
  ]);
}
