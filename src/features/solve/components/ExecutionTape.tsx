import React from 'react';
import {
  RotateCcw,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Check,
} from 'lucide-react';
import { SolutionSubStep } from '../../../utils/solutionStages';

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
  return (
    <div className="flex flex-col gap-3">
      {/* PINNED PLAYBACK CONTROLS (Right beneath 3D Canvas) */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-2.5 sm:p-3 shadow-xs shrink-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Playback Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              disabled={currentMoveGlobalIdx === 0}
              onClick={onRewind}
              className="p-1.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] hover:bg-neutral-200 text-neutral-700 transition-colors disabled:opacity-30 disabled:hover:bg-[#F8F9FA] cursor-pointer"
              title="Về Nước Đầu Tiên [Home]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              disabled={currentMoveGlobalIdx === 0}
              onClick={onPrevMove}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F3F4F6] text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 disabled:opacity-30 whitespace-nowrap cursor-pointer"
              title="Lùi 1 Nước [Mũi tên trái]"
            >
              <SkipBack className="w-3.5 h-3.5 shrink-0" />
              <span>Lùi</span>
            </button>

            <button
              onClick={onTogglePlay}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {isPlaying
                  ? 'Tạm Dừng'
                  : currentMoveGlobalIdx >= allMovesLength && allMovesLength > 0
                  ? 'Phát Lại'
                  : 'Tự Động'}
              </span>
              <span className="hidden sm:inline-block keycap-dark ml-0.5">Space</span>
            </button>

            <button
              disabled={currentMoveGlobalIdx >= allMovesLength}
              onClick={onNextMove}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F3F4F6] text-neutral-800 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 disabled:opacity-30 whitespace-nowrap cursor-pointer"
              title="Tiến 1 Nước [Mũi tên phải]"
            >
              <span>{currentMoveGlobalIdx >= allMovesLength ? 'Đã Xong' : 'Tiến'}</span>
              <SkipForward className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          {/* Speed Selector & Smart Cube Sync */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded-xl border border-[#EAECEF] text-[11px] font-mono">
              {(['0.5x', '1.0x', '2.0x'] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>

            <label className="hidden xl:flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-neutral-500 hover:text-neutral-900">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-[#D1D5DB] text-neutral-900 focus:ring-0 cursor-pointer accent-black w-3.5 h-3.5"
              />
              <span>
                Sync <span className="text-emerald-600 font-bold font-mono">(OK)</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* SCROLLABLE ALGORITHMIC EXECUTION TAPE */}
      <div className="bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] p-3 flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
        <div className="flex items-center justify-between pb-1 border-b border-[#EAECEF]/60 text-[10.5px] font-mono text-neutral-400 font-semibold uppercase tracking-wider shrink-0">
          <span>ALGORITHMIC EXECUTION TAPE</span>
          <span className="text-neutral-600 font-bold truncate max-w-[55%]">
            {activeSubStep ? activeSubStep.labelVi : stageTitle}
          </span>
        </div>

        {/* Tape Reel (Scrollable if long) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 px-1 max-h-36 sm:max-h-48 overflow-y-auto max-h-[160px]">
          {tapeMoves.length === 0 ? (
            <div className="py-2 px-3 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)</span>
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

              return (
                <div
                  key={m.num}
                  onClick={() => onSelectMove(m.num)}
                  className={`font-mono px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[48px] cursor-pointer transition-all ${
                    isCurrentTarget
                      ? 'bg-[#111111] text-white shadow-sm scale-105 ring-2 ring-emerald-500'
                      : isAllDone
                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 font-bold'
                      : isInActiveSubStep
                      ? 'bg-white text-neutral-900 border-2 border-emerald-500 shadow-2xs'
                      : activeSubStep && activeSubStep.movesCount > 0
                      ? 'bg-white/60 text-neutral-400 border border-[#EAECEF] opacity-60 hover:opacity-100 hover:border-neutral-400'
                      : 'bg-white text-neutral-800 border border-[#EAECEF] hover:border-neutral-400'
                  }`}
                >
                  <span className="font-bold text-base leading-none">{m.move}</span>
                  <span
                    className={`text-[8.5px] mt-0.5 ${
                      isCurrentTarget
                        ? 'text-emerald-400 font-bold'
                        : isAllDone
                        ? 'text-emerald-600 font-bold'
                        : isInActiveSubStep
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
        <div className="pt-1.5 border-t border-[#EAECEF] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-semibold text-neutral-900 truncate">
              {currentMove.textVi}{' '}
              <span className="text-neutral-400 font-normal">
                ({currentMove.holdTip})
              </span>
            </span>
          </div>

          <div className="font-mono text-[10.5px] text-neutral-500 shrink-0">
            Góc xoay: <span className="font-bold text-neutral-900">{currentMove.angle}</span> ·
            Lát cắt: <span className="font-bold text-neutral-900">{currentMove.slice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
