import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/haptics';
import { CubeNetState } from '../../utils/cubeState';
import { CubeSize } from '../../types/cubing';
import { ScrambleHeader } from './ScrambleHeader';
import { SplitBreakdownBar } from './SplitBreakdownBar';
import { ManualTimeInput } from './ManualTimeInput';
import { useZenTimerKeyboard } from './useZenTimerKeyboard';
import { formatTimerDigits, getTimerColorClass, getTimerMicroHint } from './timerFormatting';
import { TimerMode } from './substepScrambler';

interface ZenTimerStageProps {
  scramble: string;
  roundNumber?: number;
  solveNumber?: number;
  onNextScramble: () => void;
  cubeNetState: CubeNetState;
  onSolveComplete: (timeMs: number, penalty?: 'none' | '+2' | 'dnf') => void;
  onManualTimeEntry?: (timeMs: number) => void;
  onReset: () => void;
  onTogglePenalty: () => void;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
  displayTimeMs: number;
  onTimerRunningChange?: (isRunning: boolean) => void;
  cubeSize?: CubeSize;
  timerMode?: TimerMode;
  onTimerModeChange?: (mode: TimerMode) => void;
}

export type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'inspection' | 'stopped';

export const getTimerFontSizeClass = (formattedTime: string): string => {
  if (formattedTime.length > 5) {
    return 'text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight font-mono';
  }
  return 'text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[216px] text-[20vw] sm:text-[18vw] md:text-[14vw] tracking-tight font-mono';
};

export const ZenTimerStage: React.FC<ZenTimerStageProps> = ({
  scramble,
  onNextScramble,
  cubeNetState,
  onSolveComplete,
  onManualTimeEntry,
  onReset,
  onTogglePenalty,
  inspectionEnabled,
  onToggleInspection,
  displayTimeMs,
  onTimerRunningChange,
  cubeSize = 3,
  timerMode = 'FULL',
  onTimerModeChange,
}) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentMs, setCurrentMs] = useState<number>(displayTimeMs);
  const [inspectionSeconds, setInspectionSeconds] = useState<number>(15);

  // Manual Split Timer (CFOP Multi-Phase: Cross -> F2L -> OLL -> PLL)
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splits, setSplits] = useState<number[]>([]);
  const splitsRef = useRef<number[]>([]);
  const effectiveSplitMode = cubeSize === 3 && timerMode === 'FULL' && isSplitMode;

  // Manual In-Place Time Input State
  const [isManualInputActive, setIsManualInputActive] = useState<boolean>(false);
  const [manualInputVal, setManualInputVal] = useState<string>('');
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<number | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const pendingPenaltyRef = useRef<'none' | '+2' | 'dnf'>('none');

  useEffect(() => {
    if (timerState === 'idle' || timerState === 'stopped') {
      setCurrentMs(displayTimeMs);
    }
  }, [displayTimeMs, timerState]);

  useEffect(() => {
    onTimerRunningChange?.(timerState === 'running');
  }, [timerState, onTimerRunningChange]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
  }, []);

  const startInspection = useCallback(() => {
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    setTimerState('inspection');
    setInspectionSeconds(15);
    pendingPenaltyRef.current = 'none';
    inspectionStartRef.current = Date.now();

    inspectionIntervalRef.current = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - inspectionStartRef.current) / 1000);
      const remaining = 15 - elapsedSec;

      if (elapsedSec === 8 || elapsedSec === 12) {
        sound.playInspectionWarning();
        haptic.warning();
      }
      setInspectionSeconds(remaining);
      if (remaining <= 0 && remaining >= -2) pendingPenaltyRef.current = '+2';
      else if (remaining < -2) pendingPenaltyRef.current = 'dnf';
    }, 200);
  }, []);

  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
    splitsRef.current = [];
    setSplits([]);
    setTimerState('running');
    haptic.start();
    startTimeRef.current = performance.now();

    const loop = () => {
      setCurrentMs(performance.now() - startTimeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const stopTimer = useCallback((overrideElapsedMs?: number) => {
    if (timerState !== 'running') return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const finalElapsed =
      overrideElapsedMs ?? Math.round(performance.now() - startTimeRef.current);
    setCurrentMs(finalElapsed);
    setTimerState('stopped');
    sound.playTimerStop();
    haptic.stop();

    const penalty = pendingPenaltyRef.current;
    pendingPenaltyRef.current = 'none';
    onSolveComplete(finalElapsed, penalty);
  }, [timerState, onSolveComplete]);

  const handleRunningTapOrSplit = useCallback(() => {
    if (timerState !== 'running') return;
    if (!effectiveSplitMode) {
      stopTimer();
      return;
    }

    const elapsed = Math.max(1, Math.round(performance.now() - startTimeRef.current));
    const nextSplits = [...splitsRef.current, elapsed];
    splitsRef.current = nextSplits;
    setSplits(nextSplits);

    if (nextSplits.length < 4) {
      sound.playTick();
      haptic.start();
    } else {
      stopTimer(elapsed);
    }
  }, [timerState, effectiveSplitMode, stopTimer]);

  const handleHoldStart = useCallback(() => {
    if (timerState === 'running') {
      handleRunningTapOrSplit();
      return;
    }
    if (timerState === 'idle' || timerState === 'stopped') {
      if (inspectionEnabled) {
        startInspection();
        return;
      }
      setTimerState('holding');
      holdTimerRef.current = window.setTimeout(() => {
        setTimerState('ready');
        sound.playTimerReady();
        haptic.ready();
      }, 350);
    } else if (timerState === 'inspection') {
      setTimerState('holding');
      holdTimerRef.current = window.setTimeout(() => {
        setTimerState('ready');
        sound.playTimerReady();
        haptic.ready();
      }, 350);
    }
  }, [timerState, inspectionEnabled, handleRunningTapOrSplit, startInspection]);

  const handleHoldRelease = useCallback(() => {
    if (timerState === 'ready') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      startTimer();
    } else if (timerState === 'holding') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setTimerState(inspectionEnabled && inspectionIntervalRef.current ? 'inspection' : 'idle');
    }
  }, [timerState, startTimer, inspectionEnabled]);

  useZenTimerKeyboard({
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
  });

  const formattedTime = formatTimerDigits(currentMs, timerState, inspectionSeconds);
  const microHint = getTimerMicroHint(timerState, inspectionSeconds, effectiveSplitMode);

  return (
    <section
      id="timer-arena"
      style={{ touchAction: 'manipulation' }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          e.button === 0 &&
          !target.closest('button') &&
          !target.closest('input') &&
          !target.closest('#net-popover') &&
          !target.closest('#split-breakdown-container')
        ) {
          handleHoldStart();
        }
      }}
      onPointerUp={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input') && !target.closest('#net-popover')) {
          if (timerState === 'holding' || timerState === 'ready') handleHoldRelease();
        }
      }}
      onPointerLeave={() => {
        if (timerState === 'holding') {
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          setTimerState(inspectionEnabled && inspectionIntervalRef.current ? 'inspection' : 'idle');
        }
      }}
      className="w-full relative flex flex-col items-center justify-between min-h-[65vh] sm:min-h-[72vh] md:min-h-[75vh] pt-4 sm:pt-6 pb-6 sm:pb-8 px-3 sm:px-8 select-none touch-manipulation bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out overflow-hidden"
    >
      <div
        id="halo-glow"
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-2xl ${
          timerState === 'holding'
            ? 'bg-amber-500/10 opacity-100'
            : timerState === 'ready'
            ? 'bg-emerald-500/10 opacity-100'
            : 'opacity-0'
        }`}
      />

      <ScrambleHeader
        scramble={scramble}
        onNextScramble={onNextScramble}
        cubeNetState={cubeNetState}
        inspectionEnabled={inspectionEnabled}
        onToggleInspection={onToggleInspection}
        timerMode={timerMode}
        onTimerModeChange={(nextMode) => {
          splitsRef.current = [];
          setSplits([]);
          onTimerModeChange?.(nextMode);
        }}
        isSplitMode={isSplitMode}
        onToggleSplitMode={() => {
          setIsSplitMode((prev) => !prev);
          splitsRef.current = [];
          setSplits([]);
        }}
        isManualInputActive={isManualInputActive}
        onToggleManualInput={() => {
          setIsManualInputActive((prev) => {
            if (!prev) { setManualInputVal(''); setTimeout(() => manualInputRef.current?.focus(), 50); }
            return !prev;
          });
        }}
        isTimerRunning={timerState === 'running'}
        cubeSize={cubeSize}
      />

      <div
        id="click-trigger-area"
        style={{ touchAction: 'manipulation' }}
        className="relative z-10 flex-1 w-full flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation max-w-full overflow-hidden my-auto py-4"
      >
        {isManualInputActive ? (
          <ManualTimeInput
            inputRef={manualInputRef}
            value={manualInputVal}
            placeholder={formattedTime}
            fontSizeClass={getTimerFontSizeClass(manualInputVal || formattedTime)}
            onChange={setManualInputVal}
            onSubmitMs={(parsed) => {
              if (onManualTimeEntry) onManualTimeEntry(parsed);
              else onSolveComplete(parsed);
              setCurrentMs(parsed); setIsManualInputActive(false); setManualInputVal('');
            }}
            onCancel={() => { setIsManualInputActive(false); setManualInputVal(''); }}
          />
        ) : (
          <div className="flex items-baseline justify-center max-w-full px-1">
            <span
              id="timer-main"
              className={`font-mono leading-none font-bold tabular-nums transition-colors select-none ${getTimerFontSizeClass(formattedTime)} ${getTimerColorClass(timerState, inspectionSeconds)}`}
            >
              {formattedTime}
            </span>
          </div>
        )}

        {microHint && (
          <div className="transition-opacity duration-200 mt-3 text-center opacity-100">
            <span className={`inline-block font-mono text-xs tracking-wider uppercase ${microHint.className}`}>
              {microHint.text}
            </span>
          </div>
        )}

        <SplitBreakdownBar isSplitMode={effectiveSplitMode} timerState={timerState} splits={splits} />
      </div>
    </section>
  );
};
