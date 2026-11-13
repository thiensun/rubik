import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/haptics';
import { CubeNetState } from '../../utils/cubeState';
import { parseTimeInput } from '../../utils/cubingStats';
import { CubeSize } from '../../types/cubing';
import { ScrambleHeader } from './ScrambleHeader';

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
}

export type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'inspection' | 'stopped';

/**
 * Responsive font size scaling for digital timer display:
 * Dynamically scales down font size for minute times (>= 7 chars, e.g. "1:12.34" or "12:34.56")
 * on narrow viewports (320px–360px) to prevent horizontal overflow while preserving large
 * commanding visual presence on wider viewports.
 */
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
}) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentMs, setCurrentMs] = useState<number>(displayTimeMs);
  const [inspectionSeconds, setInspectionSeconds] = useState<number>(15);

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

  // Sync display time if external prop changes while idle/stopped
  useEffect(() => {
    if (timerState === 'idle' || timerState === 'stopped') {
      setCurrentMs(displayTimeMs);
    }
  }, [displayTimeMs, timerState]);

  // Notify parent component of running state for Zen Focus
  useEffect(() => {
    onTimerRunningChange?.(timerState === 'running');
  }, [timerState, onTimerRunningChange]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
  }, []);

  // Start 15s inspection countdown
  const startInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
    }
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

      if (remaining > 0) {
        setInspectionSeconds(remaining);
      } else if (remaining >= -2) {
        setInspectionSeconds(remaining);
        pendingPenaltyRef.current = '+2';
      } else {
        setInspectionSeconds(remaining);
        pendingPenaltyRef.current = 'dnf';
      }
    }, 200);
  }, []);

  // Format time to 08.42 or 00.00
  const formatDigits = (ms: number): string => {
    if (timerState === 'inspection') {
      if (inspectionSeconds < -2) return 'DNF';
      if (inspectionSeconds <= 0) return '+2';
      return inspectionSeconds.toString().padStart(2, '0');
    }
    if (timerState === 'ready') {
      return '00.00';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (totalSeconds >= 60) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${pad(mins)}:${pad(secs)}.${pad(hundredths)}`;
    }
    return `${pad(totalSeconds)}.${pad(hundredths)}`;
  };

  // Start the high-precision timer
  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }

    setTimerState('running');
    haptic.start();
    startTimeRef.current = performance.now();

    const loop = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setCurrentMs(elapsed);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // Stop running timer
  const stopTimer = useCallback(() => {
    if (timerState !== 'running') return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const finalElapsed = Math.round(performance.now() - startTimeRef.current);
    setCurrentMs(finalElapsed);
    setTimerState('stopped');
    sound.playTimerStop();
    haptic.stop();

    const penalty = pendingPenaltyRef.current;
    pendingPenaltyRef.current = 'none';
    onSolveComplete(finalElapsed, penalty);
  }, [timerState, onSolveComplete]);

  // Trigger Hold / Prime logic
  const handleHoldStart = useCallback(() => {
    if (timerState === 'running') {
      stopTimer();
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
  }, [timerState, inspectionEnabled, stopTimer, startInspection]);

  const handleHoldRelease = useCallback(() => {
    if (timerState === 'ready') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      startTimer();
    } else if (timerState === 'holding') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (inspectionEnabled && inspectionIntervalRef.current) {
        setTimerState('inspection');
      } else {
        setTimerState('idle');
      }
    }
  }, [timerState, startTimer, inspectionEnabled]);

  // Keyboard controls: Space, Esc, +2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          if (timerState === 'running') {
            stopTimer();
          } else {
            handleHoldStart();
          }
        }
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
        setTimerState('idle');
        setCurrentMs(0);
        onReset();
        return;
      }

      if (timerState === 'running') {
        e.preventDefault();
        stopTimer();
        return;
      }

      if (e.key === '+' || e.key === '2') {
        if (timerState === 'stopped' || timerState === 'idle') {
          e.preventDefault();
          onTogglePenalty();
        }
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
  }, [timerState, handleHoldStart, handleHoldRelease, stopTimer, onReset, onTogglePenalty]);

  // Zen Color Mapping
  const getTimerColorClass = () => {
    if (timerState === 'inspection') {
      if (inspectionSeconds < -2) return 'text-rose-600';
      if (inspectionSeconds <= 0) return 'text-orange-600';
      if (inspectionSeconds <= 3) return 'text-red-600';
      return 'text-indigo-600';
    }
    if (timerState === 'holding') return 'text-[#D97706]';
    if (timerState === 'ready') return 'text-[#059669]';
    return 'text-[#111111]';
  };

  // Tiny monospace micro-hint
  const renderMicroHint = () => {
    if (timerState === 'running') return null;

    let hintText = 'Giữ để bắt đầu';
    let hintClass = 'text-neutral-400';

    if (timerState === 'inspection') {
      hintText = `Quan sát: ${inspectionSeconds}s · Giữ để sẵn sàng`;
      hintClass = inspectionSeconds <= 3 ? 'text-red-500 animate-pulse font-bold' : 'text-indigo-600';
    } else if (timerState === 'holding') {
      hintText = 'Đang chuẩn bị...';
      hintClass = 'text-[#D97706] font-bold';
    } else if (timerState === 'ready') {
      hintText = 'Thả để đếm giờ!';
      hintClass = 'text-[#059669] font-bold animate-pulse';
    }

    return (
      <div className={`transition-opacity duration-200 mt-3 text-center ${timerState === 'running' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <span className={`inline-block font-mono text-xs tracking-wider uppercase ${hintClass}`}>
          {hintText}
        </span>
      </div>
    );
  };

  return (
    <section
      id="timer-arena"
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          e.button === 0 &&
          !target.closest('button') &&
          !target.closest('input') &&
          !target.closest('#net-popover')
        ) {
          handleHoldStart();
        }
      }}
      onPointerUp={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input') && !target.closest('#net-popover')) {
          if (timerState === 'holding' || timerState === 'ready') {
            handleHoldRelease();
          }
        }
      }}
      onPointerLeave={() => {
        if (timerState === 'holding') {
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          if (inspectionEnabled && inspectionIntervalRef.current) {
            setTimerState('inspection');
          } else {
            setTimerState('idle');
          }
        }
      }}
      className="w-full relative flex flex-col items-center justify-between min-h-[65vh] sm:min-h-[72vh] md:min-h-[75vh] pt-4 sm:pt-6 pb-6 sm:pb-8 px-3 sm:px-8 select-none touch-manipulation bg-white rounded-[24px] border border-[#EAECEF] shadow-sm transition-all overflow-hidden"
    >
      {/* Dynamic Background Halo during Holding / Ready */}
      <div
        id="halo-glow"
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-[24px] ${
          timerState === 'holding'
            ? 'bg-amber-500/10 opacity-100'
            : timerState === 'ready'
            ? 'bg-emerald-500/10 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Scramble Header Component */}
      <ScrambleHeader
        scramble={scramble}
        onNextScramble={onNextScramble}
        cubeNetState={cubeNetState}
        inspectionEnabled={inspectionEnabled}
        onToggleInspection={onToggleInspection}
        isManualInputActive={isManualInputActive}
        onToggleManualInput={() => {
          setIsManualInputActive((prev) => {
            const next = !prev;
            if (next) {
              setManualInputVal('');
              setTimeout(() => manualInputRef.current?.focus(), 50);
            }
            return next;
          });
        }}
        isTimerRunning={timerState === 'running'}
        cubeSize={cubeSize}
      />

      {/* Entire Area Below Scramble Card: Responsive Touch-Down Surface & Grand Digits */}
      <div
        id="click-trigger-area"
        className="relative z-10 flex-1 w-full flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation max-w-full overflow-hidden my-auto py-4"
      >
        {isManualInputActive ? (
          <div
            className="flex items-baseline justify-center max-w-full px-1 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={manualInputRef}
              type="text"
              value={manualInputVal}
              placeholder={formatDigits(currentMs)}
              onChange={(e) => setManualInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const parsed = parseTimeInput(manualInputVal);
                  if (parsed !== null && parsed > 0) {
                    if (onManualTimeEntry) {
                      onManualTimeEntry(parsed);
                    } else {
                      onSolveComplete(parsed);
                    }
                    setCurrentMs(parsed);
                    setIsManualInputActive(false);
                    setManualInputVal('');
                  } else {
                    alert('Vui lòng nhập định dạng thời gian hợp lệ (ví dụ: 9.31, 1:04.25 hoặc 931)');
                  }
                } else if (e.key === 'Escape') {
                  setIsManualInputActive(false);
                  setManualInputVal('');
                }
              }}
              className={`font-mono leading-none font-bold tabular-nums text-[#111111] bg-transparent border-none text-center focus:outline-none focus:ring-0 p-0 m-0 w-full max-w-full caret-[#111111] ${getTimerFontSizeClass(
                manualInputVal || formatDigits(currentMs)
              )}`}
            />
          </div>
        ) : (
          <div className="flex items-baseline justify-center max-w-full px-1">
            {(() => {
              const formattedTime = formatDigits(currentMs);
              return (
                <span
                  id="timer-main"
                  className={`font-mono leading-none font-bold tabular-nums transition-colors select-none ${getTimerFontSizeClass(
                    formattedTime
                  )} ${getTimerColorClass()}`}
                >
                  {formattedTime}
                </span>
              );
            })()}
          </div>
        )}

        {/* Tiny Monospace Micro-Hint */}
        {renderMicroHint()}
      </div>
    </section>
  );
};
