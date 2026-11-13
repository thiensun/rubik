import React, { useRef, useEffect } from 'react';
import {
  RotateCcw,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Check,
} from 'lucide-react';
import { SolutionSubStep } from '../../../utils/solutionStages';
import { isWideOrSliceMove } from '../../../core/simulator';

export interface MoveTapeItem {
  move: string;
  num: number;
  textVi: string;
  textEn: string;
  holdTip: string;
  angle: string;
  slice: string;
}

interface ExecutionTapeProps {
  currentMoveGlobalIdx: number;
  allMovesLength: number;
  isPlaying: boolean;
  playbackSpeed: '0.5x' | '1.0x' | '2.0x';
  setPlaybackSpeed: (speed: '0.5x' | '1.0x' | '2.0x') => void;
  onRewind: () => void;
  onPrevMove: () => void;
  onNextMove: () => void;
  onTogglePlay: () => void;
  tapeMoves: MoveTapeItem[];
  currentMove: MoveTapeItem;
  isActuallySolved: boolean;
  activeSubStep?: SolutionSubStep | null;
  stageTitle?: string;
  onSelectMove: (moveNum: number) => void;
}

export const ExecutionTape: React.FC<ExecutionTapeProps> = ({
  currentMoveGlobalIdx,
  allMovesLength,
  isPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  onRewind,
  onPrevMove,
  onNextMove,
  onTogglePlay,
  tapeMoves,
  currentMove,
  isActuallySolved,
  activeSubStep,
  stageTitle,
  onSelectMove,
}) => {
  const activeMoveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentMoveGlobalIdx]);

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {/* PINNED PLAYBACK CONTROLS IN WHITE BENTO CONTAINER */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-2.5 sm:p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0 flex flex-col gap-2.5 min-w-0">
        {/* Row 1 (Evenly Spaced Playback Controls) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-w-0">
          <button
            type="button"
            disabled={currentMoveGlobalIdx === 0}
            onClick={onRewind}
            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 shrink-0 rounded-xl bg-[#F1F5F9] border border-[#EAECEF] hover:bg-[#EAECEF] text-[#111111] transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-30 flex items-center justify-center cursor-pointer"
            title="Về Nước Đầu Tiên [Home]"
          >
            <RotateCcw className="w-4 h-4 stroke-[1.75]" />
          </button>

          <button
            type="button"
            disabled={currentMoveGlobalIdx === 0}
            onClick={onPrevMove}
            className="min-h-[44px] px-2.5 sm:px-3.5 shrink-0 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F1F5F9] text-[#111111] text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-30 whitespace-nowrap cursor-pointer"
            title="Lùi 1 Nước [Mũi tên trái]"
          >
            <SkipBack className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
            <span>Lùi</span>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="flex-1 min-w-0 min-h-[44px] px-3 sm:px-4 bg-[#111111] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current shrink-0" />
            ) : (
              <Play className="w-4 h-4 fill-current shrink-0" />
            )}
            <span className="font-bold">
              {isPlaying
                ? 'Tạm Dừng'
                : currentMoveGlobalIdx >= allMovesLength && allMovesLength > 0
                ? 'Phát Lại'
                : 'Chạy'}
            </span>
            <span className="hidden sm:inline-flex keycap-dark ml-0.5 text-[10px]">Space</span>
          </button>

          <button
            type="button"
            disabled={currentMoveGlobalIdx >= allMovesLength}
            onClick={onNextMove}
            className="min-h-[44px] px-2.5 sm:px-3.5 shrink-0 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F1F5F9] text-[#111111] text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-30 whitespace-nowrap cursor-pointer"
            title="Tiến 1 Nước [Mũi tên phải]"
          >
            <span>{currentMoveGlobalIdx >= allMovesLength ? 'Xong' : 'Tiến'}</span>
            <SkipForward className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
          </button>
        </div>

        {/* Row 2 (Secondary Speed & Step Counter) */}
        <div className="flex items-center justify-between gap-2 w-full pt-2 border-t border-[#EAECEF] min-w-0">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#EAECEF] font-mono shrink-0">
            {(['0.5x', '1.0x', '2.0x'] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer text-xs tabular-nums ${
                  playbackSpeed === spd
                    ? 'bg-[#111111] text-white font-bold'
                    : 'text-[#64748B] hover:text-[#111111]'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>

          <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] font-mono text-[11px] font-semibold text-[#111111] tabular-nums whitespace-nowrap shrink-0">
            {currentMoveGlobalIdx >= allMovesLength && allMovesLength > 0
              ? 'Hoàn Thành ✓'
              : `Bước ${Math.min(currentMoveGlobalIdx + 1, allMovesLength || 1)} / ${allMovesLength || 0}`}
          </span>
        </div>
      </div>

      {/* SCROLLABLE EXECUTION TAPE */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#EAECEF] text-[10.5px] font-mono text-[#64748B] font-semibold uppercase tracking-wider">
          <span>EXECUTION TAPE</span>
          <span className="text-[#111111] font-bold truncate max-w-[58%]">
            {activeSubStep ? activeSubStep.labelVi : stageTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 px-0.5 w-full">
          {tapeMoves.length === 0 ? (
            <div className="py-2 px-3 text-xs font-mono font-semibold text-[#111111] bg-[#F1F5F9] rounded-xl border border-[#EAECEF] flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Khối Rubik đã hoàn thành (0 Moves)</span>
            </div>
          ) : (
            tapeMoves.map((m) => {
              const isCurrentTarget = m.num === currentMove.num && currentMoveGlobalIdx < allMovesLength;
              const isAllDone = isActuallySolved || (currentMoveGlobalIdx >= allMovesLength && allMovesLength > 0);
              const isInActiveSubStep =
                activeSubStep &&
                activeSubStep.movesCount > 0 &&
                m.num >= activeSubStep.startMoveNum &&
                m.num <= activeSubStep.endMoveNum;
              const isWideOrSlice = isWideOrSliceMove(m.move);

              return (
                <div
                  key={m.num}
                  ref={isCurrentTarget ? activeMoveRef : null}
                  onClick={() => onSelectMove(m.num)}
                  className={`font-mono shrink-0 min-w-[52px] h-[56px] px-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] tabular-nums ${
                    isCurrentTarget
                      ? 'bg-[#111111] text-white shadow-sm'
                      : isAllDone
                      ? 'bg-[#F1F5F9] text-[#111111] border border-[#111111]/30 font-semibold'
                      : isInActiveSubStep
                      ? `bg-white text-[#111111] ${
                          isWideOrSlice ? 'border-2 border-double border-[#64748B]' : 'border-[1.5px] border-[#111111]'
                        }`
                      : activeSubStep && activeSubStep.movesCount > 0
                      ? 'bg-[#F8F9FA] text-[#94A3B8] border border-[#EAECEF] hover:text-[#111111]'
                      : `bg-white text-[#111111] hover:border-[#94A3B8] ${
                          isWideOrSlice ? 'border-2 border-double border-[#64748B]' : 'border border-[#EAECEF]'
                        }`
                  }`}
                >
                  <span className="font-bold text-base leading-none">{m.move}</span>
                  <span
                    className={`text-[9px] mt-1 font-mono ${
                      isCurrentTarget ? 'text-white/75' : 'text-[#94A3B8]'
                    }`}
                  >
                    {isAllDone ? 'DONE' : isCurrentTarget ? 'NOW' : `#${m.num}`}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-1.5 border-t border-[#EAECEF] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <span className="font-semibold text-[#111111] truncate">
            {currentMove.textVi}{' '}
            <span className="text-[#64748B] font-normal">({currentMove.holdTip})</span>
          </span>
          <div className="font-mono text-[10.5px] text-[#64748B] shrink-0 tabular-nums">
            <span className="font-semibold text-[#111111]">{currentMove.angle}</span> · {currentMove.slice}
          </div>
        </div>
      </div>
    </div>
  );
};
