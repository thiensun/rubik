import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Copy, Check, Timer as TimerIcon, LayoutGrid, X } from 'lucide-react';
import { sound } from '../../utils/audio';
import { CubeNet2D } from '../scramble/CubeNet2D';
import { CubeNetState } from '../../utils/cubeState';

interface ZenTimerStageProps {
  scramble: string;
  roundNumber?: number;
  solveNumber?: number;
  onNextScramble: () => void;
  cubeNetState: CubeNetState;
  onSolveComplete: (timeMs: number, penalty?: 'none' | '+2' | 'dnf') => void;
  onReset: () => void;
  onTogglePenalty: () => void;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
  displayTimeMs: number;
}

type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'inspection' | 'stopped';

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
  return 'text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[216px] tracking-tight font-mono';
};

export const ZenTimerStage: React.FC<ZenTimerStageProps> = ({
  scramble,
  roundNumber = 2,
  solveNumber = 42,
  onNextScramble,
  cubeNetState,
  onSolveComplete,
  onReset,
  onTogglePenalty,
  inspectionEnabled,
  onToggleInspection,
  displayTimeMs,
}) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentMs, setCurrentMs] = useState<number>(displayTimeMs);
  const [inspectionSeconds, setInspectionSeconds] = useState<number>(15);
  const [copied, setCopied] = useState(false);
  const [isNetOpen, setIsNetOpen] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<number | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const pendingPenaltyRef = useRef<'none' | '+2' | 'dnf'>('none');
  const netPopoverRef = useRef<HTMLDivElement | null>(null);
  const toggleNetBtnRef = useRef<HTMLButtonElement | null>(null);

  // Sync display time if external prop changes while idle/stopped
  useEffect(() => {
    if (timerState === 'idle' || timerState === 'stopped') {
      setCurrentMs(displayTimeMs);
    }
  }, [displayTimeMs, timerState]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
  }, []);

  // Close 2D Net popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isNetOpen &&
        netPopoverRef.current &&
        !netPopoverRef.current.contains(e.target as Node) &&
        toggleNetBtnRef.current &&
        !toggleNetBtnRef.current.contains(e.target as Node)
      ) {
        setIsNetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNetOpen]);

  // Copy scramble handler
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(scramble.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

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
      }

      if (remaining > 0) {
        setInspectionSeconds(remaining);
      } else if (remaining >= -2) {
        // Between 15s and 17s: +2 penalty
        setInspectionSeconds(remaining);
        pendingPenaltyRef.current = '+2';
      } else {
        // Past 17s: DNF
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

  // Start the actual high-precision timer
  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }

    setTimerState('running');
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
      }, 350);
    } else if (timerState === 'inspection') {
      setTimerState('holding');
      holdTimerRef.current = window.setTimeout(() => {
        setTimerState('ready');
        sound.playTimerReady();
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

  const moveCount = scramble.trim().split(/\s+/).filter(Boolean).length;

  // Dynamic State Pill styling matching Stitch HTML
  const renderStatePill = () => {
    if (timerState === 'inspection') {
      const isOver15 = inspectionSeconds <= 0 && inspectionSeconds >= -2;
      const isDNF = inspectionSeconds < -2;
      return (
        <div
          id="timer-state-pill"
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold transition-all duration-200 shadow-sm ${
            isDNF
              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
              : isOver15
              ? 'bg-orange-50 text-orange-700 border-orange-300 animate-pulse'
              : inspectionSeconds <= 3
              ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
              : 'bg-indigo-50 text-indigo-700 border-indigo-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isDNF || isOver15 || inspectionSeconds <= 3 ? 'bg-red-500 animate-ping' : 'bg-indigo-500 animate-pulse'
            }`}
          />
          <span>
            {isDNF
              ? 'INSPECTION TIME OVER (DNF)'
              : isOver15
              ? 'INSPECTION TIME OVER (+2s Penalty)'
              : `INSPECTION (${inspectionSeconds}s) · Hold [SPACE] to Arm`}
          </span>
        </div>
      );
    }
    if (timerState === 'holding') {
      return (
        <div
          id="timer-state-pill"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-xs font-mono font-medium transition-all duration-200 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>ARMING... (Hold for Emerald)</span>
        </div>
      );
    }
    if (timerState === 'ready') {
      return (
        <div
          id="timer-state-pill"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-mono font-semibold transition-all duration-200 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>READY · Release to Start!</span>
        </div>
      );
    }
    if (timerState === 'running') {
      return (
        <div
          id="timer-state-pill"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mono-950 text-white text-xs font-mono font-medium transition-all duration-200 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TIMING SOLVE...</span>
        </div>
      );
    }
    if (timerState === 'stopped') {
      return (
        <div
          id="timer-state-pill"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mono-100 text-mono-800 text-xs font-mono font-medium border border-mono-200/60 transition-all duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-mono-950" />
          <span>SOLVE FINISHED · Tap to reset</span>
        </div>
      );
    }
    return (
      <div
        id="timer-state-pill"
        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mono-100/90 text-mono-700 text-xs font-mono font-medium border border-mono-200/60 transition-all duration-200 shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-mono-400" />
        <span>Tap anywhere or hold [SPACE]</span>
      </div>
    );
  };

  const getTimerColorClass = () => {
    if (timerState === 'inspection') {
      if (inspectionSeconds < -2) return 'text-rose-600';
      if (inspectionSeconds <= 0) return 'text-orange-600';
      if (inspectionSeconds <= 3) return 'text-red-600';
      return 'text-indigo-600';
    }
    if (timerState === 'holding') return 'text-amber-600';
    if (timerState === 'ready') return 'text-emerald-600';
    return 'text-mono-950';
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
      className="w-full relative flex flex-col items-center justify-center pt-4 sm:pt-8 pb-8 sm:pb-20 px-2.5 sm:px-10 select-none bg-white rounded-3xl border border-mono-200/70 shadow-apple-float transition-all overflow-visible"
    >
      {/* Subtle Zen backdrop aura effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-mono-100/40 via-transparent to-transparent pointer-events-none opacity-60 rounded-3xl" />

      {/* Dynamic Halo Glow during Holding / Ready */}
      <div
        id="halo-glow"
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-3xl ${
          timerState === 'holding'
            ? 'bg-amber-500/10 opacity-100'
            : timerState === 'ready'
            ? 'bg-emerald-500/10 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Scramble Zone: Centered Directly Above Timer with Minimalist Tooltipped Icon Actions */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col items-center text-center gap-1.5 sm:gap-2.5 mb-3 sm:mb-8">
        {/* Metadata chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mono-100 text-mono-600 font-mono text-[10px] sm:text-[11px] font-medium border border-mono-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-mono-400" />
            WCA Rule 4b
          </span>
          <span className="px-2 py-0.5 rounded-md bg-mono-100 text-mono-700 font-mono text-[10px] sm:text-[11px] font-medium">
            Round {roundNumber} · #{solveNumber}
          </span>
          <span className="text-mono-300 text-xs hidden sm:inline">|</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-mono-500 hidden xs:inline">{moveCount} Moves (HTM)</span>
        </div>

        {/* Centered Scramble Formula */}
        <div className="w-full px-1 sm:px-2">
          <p
            id="current-scramble"
            className="font-mono text-sm sm:text-xl md:text-2xl leading-snug sm:leading-relaxed tracking-normal sm:tracking-wider text-mono-950 font-semibold break-words select-all text-center max-h-20 sm:max-h-none overflow-y-auto"
          >
            {scramble}
          </p>
        </div>

        {/* Minimalist Centered Icon-Only Action Toolbar with Tooltips */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 relative">
          {/* Next Scramble Icon Button */}
          <div className="relative group">
            <button
              type="button"
              id="next-scramble-btn"
              aria-label="Next Scramble"
              onClick={(e) => {
                e.stopPropagation();
                onNextScramble();
              }}
              className="w-8 h-8 rounded-lg bg-mono-100 hover:bg-mono-950 hover:text-white text-mono-700 flex items-center justify-center transition-all active:scale-95 border border-mono-200/70"
            >
              <RotateCw className="w-[15px] h-[15px]" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center px-2 py-1 rounded bg-mono-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-30 transition-opacity">
              Next Scramble (Alt+N)
            </div>
          </div>

          {/* Copy Scramble Icon Button */}
          <div className="relative group">
            <button
              type="button"
              id="copy-scramble-btn"
              aria-label="Copy Scramble"
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-mono-100 hover:bg-mono-200/80 text-mono-700 flex items-center justify-center transition-all active:scale-95 border border-mono-200/70"
            >
              {copied ? (
                <Check className="w-[15px] h-[15px] text-emerald-600" />
              ) : (
                <Copy className="w-[15px] h-[15px] text-mono-700" />
              )}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center px-2 py-1 rounded bg-mono-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-30 transition-opacity">
              {copied ? 'Copied to clipboard!' : 'Copy Scramble'}
            </div>
          </div>

          {/* 15s Inspection Toggle Icon Button */}
          <div className="relative group">
            <button
              type="button"
              id="inspection-toggle-btn"
              aria-label="Toggle 15s Inspection"
              onClick={(e) => {
                e.stopPropagation();
                onToggleInspection();
              }}
              className={
                inspectionEnabled
                  ? 'w-8 h-8 rounded-lg bg-mono-950 text-white flex items-center justify-center transition-all active:scale-95 border border-mono-950'
                  : 'w-8 h-8 rounded-lg bg-mono-100 text-mono-400 hover:text-mono-700 flex items-center justify-center transition-all active:scale-95 border border-mono-200/70'
              }
            >
              <TimerIcon className="w-[15px] h-[15px]" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center px-2 py-1 rounded bg-mono-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-30 transition-opacity">
              15s Inspection ({inspectionEnabled ? 'Enabled' : 'Disabled'})
            </div>
          </div>

          <div className="h-4 w-px bg-mono-200 mx-1" />

          {/* Collapsible / Toggleable 2D Cube Net Preview Popover Trigger */}
          <div className="relative">
            <div className="group relative">
              <button
                ref={toggleNetBtnRef}
                type="button"
                id="toggle-net-btn"
                aria-label="Toggle 2D Net Preview"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNetOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-mono-100/90 hover:bg-mono-200/80 text-mono-700 text-xs font-mono font-medium border border-mono-200/70 transition-all active:scale-95"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">2D Net</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center px-2 py-1 rounded bg-mono-900 text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-30 transition-opacity">
                Toggle 2D Net Preview
              </div>
            </div>

            {/* Floating Glass Popover for 2D Unfolded Cube Net */}
            {isNetOpen && (
              <div
                ref={netPopoverRef}
                id="net-popover"
                onClick={(e) => e.stopPropagation()}
                className="flex absolute right-1/2 sm:right-0 translate-x-1/2 sm:translate-x-0 top-full mt-2.5 z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-mono-200/80 shadow-apple-dock flex-col items-center transition-all"
              >
                <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-mono-100 gap-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-mono-500 font-semibold whitespace-nowrap">
                    WCA Net Preview
                  </span>
                  <button
                    type="button"
                    aria-label="Close Preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNetOpen(false);
                    }}
                    className="text-mono-400 hover:text-mono-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <CubeNet2D state={cubeNetState} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Stage: Grand Digital Precision Timer Focal Point */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-3">
        {/* State Pill & Arming Feedback */}
        {renderStatePill()}

        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Hold: Amber Glow
          </span>
          <span className="text-mono-300 text-xs">→</span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ready: Emerald Green
          </span>
        </div>
      </div>

      {/* Huge, Commanding Monospace Digital Timer */}
      <div
        id="click-trigger-area"
        className="relative z-10 my-2 sm:my-8 cursor-pointer transform transition-transform active:scale-[0.99] group text-center max-w-full overflow-hidden"
      >
        <div className="flex items-baseline justify-center max-w-full px-1">
          {(() => {
            const formattedTime = formatDigits(currentMs);
            return (
              <span
                id="timer-main"
                className={`font-mono-dotted leading-none font-bold tabular-nums transition-colors ${getTimerFontSizeClass(
                  formattedTime
                )} ${getTimerColorClass()}`}
              >
                {formattedTime}
              </span>
            );
          })()}
        </div>
        <p className="text-mono-400 text-[11px] sm:text-xs font-sans tracking-wide mt-1.5 sm:mt-3 group-hover:text-mono-700 transition-colors">
          {timerState === 'inspection'
            ? 'Đang xem trước 15s · Nhấn giữ Spacebar hoặc click giữ để vào trạng thái Sẵn sàng'
            : inspectionEnabled
            ? 'Nhấn Spacebar hoặc click để bắt đầu 15s Inspection'
            : 'Click, tap screen, or hold Spacebar'}
        </p>
      </div>

      {/* Subtle keyboard hints underneath */}
      <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono text-mono-400 pt-1 sm:pt-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-mono-100 text-mono-600 border border-mono-200/50">
            Space
          </kbd>{' '}
          Arm &amp; Release
        </span>
        <span className="text-mono-200">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-mono-100 text-mono-600 border border-mono-200/50">
            Esc
          </kbd>{' '}
          Reset
        </span>
        <span className="text-mono-200">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-mono-100 text-mono-600 border border-mono-200/50">
            +2
          </kbd>{' '}
          Penalty
        </span>
      </div>
    </section>
  );
};
