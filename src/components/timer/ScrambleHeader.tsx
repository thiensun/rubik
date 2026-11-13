import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Copy, Check, Timer as TimerIcon, LayoutGrid, X, Plus } from 'lucide-react';
import { CubeNet2D } from '../scramble/CubeNet2D';
import { CubeNetState } from '../../utils/cubeState';
import { CubeSize } from '../../types/cubing';
import { TIMER_MODES_BY_SIZE, TimerMode } from './substepScrambler';

interface ScrambleHeaderProps {
  scramble: string;
  onNextScramble: () => void;
  cubeNetState: CubeNetState;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
  isSplitMode?: boolean;
  onToggleSplitMode?: () => void;
  timerMode?: TimerMode;
  onTimerModeChange?: (mode: TimerMode) => void;
  isManualInputActive: boolean;
  onToggleManualInput: () => void;
  isTimerRunning: boolean;
  cubeSize?: CubeSize;
}

export const ScrambleHeader: React.FC<ScrambleHeaderProps> = ({
  scramble,
  onNextScramble,
  cubeNetState,
  inspectionEnabled,
  onToggleInspection,
  isSplitMode = false,
  onToggleSplitMode,
  timerMode = 'FULL',
  onTimerModeChange,
  isManualInputActive,
  onToggleManualInput,
  isTimerRunning,
  cubeSize = 3,
}) => {
  const [copied, setCopied] = useState(false);
  const [isNetOpen, setIsNetOpen] = useState(false);
  const netPopoverRef = useRef<HTMLDivElement | null>(null);
  const toggleNetBtnRef = useRef<HTMLButtonElement | null>(null);
  const availableModes = TIMER_MODES_BY_SIZE[cubeSize] || TIMER_MODES_BY_SIZE[3];

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

  return (
    <div
      className={`relative z-20 w-full max-w-4xl flex flex-col items-center text-center gap-2 mb-2 shrink-0 transition-opacity duration-200 select-none ${
        isTimerRunning ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Substep Mode Selector Pill Switcher */}
      <div
        role="tablist"
        aria-label="Timer Training Mode"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center justify-start sm:justify-center gap-1 p-1 rounded-xl bg-[#F1F5F9] border border-[#EAECEF] max-w-full overflow-x-auto no-scrollbar"
      >
        {availableModes.map((m) => {
          const isActive = timerMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={(e) => {
                e.stopPropagation();
                onTimerModeChange?.(m.id);
              }}
              className={`min-h-[36px] whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer touch-manipulation ${
                isActive
                  ? 'bg-[#111111] text-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                  : 'text-[#64748B] hover:text-[#111111]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Crisp JetBrains Mono Scramble Display */}
      <div className="w-full px-2 py-1">
        <p
          id="current-scramble"
          className="font-mono tabular-nums text-sm sm:text-xl md:text-2xl leading-snug sm:leading-relaxed tracking-tight text-[#111111] font-semibold break-words select-all text-center max-h-20 sm:max-h-none overflow-y-auto"
        >
          {scramble}
        </p>
      </div>

      {/* Minimalist Icon Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 relative">
        {/* Next Scramble */}
        <button
          type="button"
          id="next-scramble-btn"
          aria-label="Next Scramble"
          onClick={(e) => {
            e.stopPropagation();
            onNextScramble();
          }}
          className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-[#F1F5F9] hover:bg-[#111111] hover:text-white text-[#111111] flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.98] border border-[#EAECEF] cursor-pointer"
          title="Scramble kế tiếp"
        >
          <RotateCw className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Copy Scramble */}
        <button
          type="button"
          id="copy-scramble-btn"
          aria-label="Copy Scramble"
          onClick={handleCopy}
          className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-[#F1F5F9] hover:bg-[#EAECEF] text-[#111111] flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.98] border border-[#EAECEF] cursor-pointer"
          title={copied ? 'Đã sao chép!' : 'Sao chép scramble'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-[#111111] stroke-[2]" />
          ) : (
            <Copy className="w-4 h-4 stroke-[1.75]" />
          )}
        </button>

        {/* 15s Inspection Toggle */}
        <button
          type="button"
          id="inspection-toggle-btn"
          aria-label="Toggle 15s Inspection"
          onClick={(e) => {
            e.stopPropagation();
            onToggleInspection();
          }}
          className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.98] border cursor-pointer ${
            inspectionEnabled
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] border-[#EAECEF]'
          }`}
          title={inspectionEnabled ? 'Quan sát 15s (Đang bật)' : 'Quan sát 15s (Đang tắt)'}
        >
          <TimerIcon className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Manual Input Toggle */}
        <button
          type="button"
          id="manual-input-btn"
          aria-label="Manual Time Entry"
          onClick={(e) => {
            e.stopPropagation();
            onToggleManualInput();
          }}
          className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.98] border cursor-pointer ${
            isManualInputActive
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] hover:bg-[#EAECEF] border-[#EAECEF]'
          }`}
          title="Nhập thời gian thủ công"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
        </button>

        <div className="h-4 w-px bg-[#EAECEF] mx-1 hidden sm:block" />

        {/* 2D Net Toggle */}
        <div className="relative">
          <button
            ref={toggleNetBtnRef}
            type="button"
            id="toggle-net-btn"
            aria-label="Toggle 2D Net Preview"
            onClick={(e) => {
              e.stopPropagation();
              setIsNetOpen((prev) => !prev);
            }}
            className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-[#F1F5F9] hover:bg-[#EAECEF] text-[#111111] text-xs font-mono font-medium border border-[#EAECEF] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
            title="Xem trước sơ đồ 2D Net"
          >
            <LayoutGrid className="w-3.5 h-3.5 stroke-[1.75]" />
            <span className="text-[11px]">2D Net</span>
          </button>

          {/* Floating Popover for 2D Unfolded Cube Net */}
          {isNetOpen && (
            <div
              ref={netPopoverRef}
              id="net-popover"
              onClick={(e) => e.stopPropagation()}
              className="flex absolute right-1/2 sm:right-0 translate-x-1/2 sm:translate-x-0 top-full mt-2 z-40 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EAECEF] shadow-xl flex-col items-center transition-all"
            >
              <div className="flex items-center justify-between w-full pb-1.5 mb-1.5 border-b border-[#EAECEF] gap-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold whitespace-nowrap">
                  2D Scramble Net
                </span>
                <button
                  type="button"
                  aria-label="Close Preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNetOpen(false);
                  }}
                  className="text-[#64748B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <CubeNet2D state={cubeNetState} cubeSize={cubeSize} />
            </div>
          )}
        </div>
      </div>

      {/* Minimalist CFOP Multi-Phase Split Mode Toggle (Full CFOP on 3x3 only) */}
      {cubeSize === 3 && timerMode === 'FULL' && (
        <button
          type="button"
          id="split-mode-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSplitMode?.();
          }}
          className={`mt-1 min-h-[38px] px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all duration-200 ease-out active:scale-[0.98] touch-manipulation cursor-pointer ${
            isSplitMode
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-[#F1F5F9] text-[#64748B] border-[#EAECEF] hover:text-[#111111] hover:border-[#94A3B8]'
          }`}
        >
          {isSplitMode
            ? '[✓] Bấm giờ phân chặng (CFOP Splits)'
            : '[ ] Bấm giờ phân chặng (CFOP Splits)'}
        </button>
      )}
    </div>
  );
};
