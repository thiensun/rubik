import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Copy, Check, Timer as TimerIcon, LayoutGrid, X, Plus } from 'lucide-react';
import { CubeNet2D } from '../scramble/CubeNet2D';
import { CubeNetState } from '../../utils/cubeState';
import { CubeSize } from '../../types/cubing';

interface ScrambleHeaderProps {
  scramble: string;
  onNextScramble: () => void;
  cubeNetState: CubeNetState;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
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
  isManualInputActive,
  onToggleManualInput,
  isTimerRunning,
  cubeSize = 3,
}) => {
  const [copied, setCopied] = useState(false);
  const [isNetOpen, setIsNetOpen] = useState(false);
  const netPopoverRef = useRef<HTMLDivElement | null>(null);
  const toggleNetBtnRef = useRef<HTMLButtonElement | null>(null);

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
      {/* Crisp JetBrains Mono Scramble Display */}
      <div className="w-full px-2">
        <p
          id="current-scramble"
          className="font-mono text-sm sm:text-xl md:text-2xl leading-snug sm:leading-relaxed tracking-normal text-[#111111] font-semibold break-words select-all text-center max-h-20 sm:max-h-none overflow-y-auto"
        >
          {scramble}
        </p>
      </div>

      {/* Minimalist Icon Actions Toolbar */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5 relative">
        {/* Next Scramble */}
        <button
          type="button"
          id="next-scramble-btn"
          aria-label="Next Scramble"
          onClick={(e) => {
            e.stopPropagation();
            onNextScramble();
          }}
          className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-[#111111] hover:text-white text-neutral-700 flex items-center justify-center transition-all active:scale-95 border border-[#EAECEF] cursor-pointer"
          title="Scramble kế tiếp"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Copy Scramble */}
        <button
          type="button"
          id="copy-scramble-btn"
          aria-label="Copy Scramble"
          onClick={handleCopy}
          className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-all active:scale-95 border border-[#EAECEF] cursor-pointer"
          title={copied ? 'Đã sao chép!' : 'Sao chép scramble'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
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
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 border cursor-pointer ${
            inspectionEnabled
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-neutral-100 text-neutral-400 hover:text-neutral-700 border-[#EAECEF]'
          }`}
          title={inspectionEnabled ? 'Quan sát 15s (Đang bật)' : 'Quan sát 15s (Đang tắt)'}
        >
          <TimerIcon className="w-3.5 h-3.5" />
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
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 border cursor-pointer ${
            isManualInputActive
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-neutral-100 text-neutral-600 hover:text-[#111111] hover:bg-neutral-200 border-[#EAECEF]'
          }`}
          title="Nhập thời gian thủ công"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-neutral-200 mx-1" />

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
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-mono font-medium border border-[#EAECEF] transition-all active:scale-95 cursor-pointer"
            title="Xem trước sơ đồ 2D Net"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
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
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">
                  2D Scramble Net
                </span>
                <button
                  type="button"
                  aria-label="Close Preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNetOpen(false);
                  }}
                  className="text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <CubeNet2D state={cubeNetState} cubeSize={cubeSize} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
