import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { sound } from '../../../utils/audio';
import { isWideOrSliceMove } from '../../../core/simulator';

interface AlgTrainerPlaybackProps {
  trainerMoveIdx: number;
  setTrainerMoveIdx: React.Dispatch<React.SetStateAction<number>>;
  trainerMoves: Array<{ move: string }>;
  trainerSpeed: '0.5x' | '1.0x' | '2.0x';
  setTrainerSpeed: (speed: '0.5x' | '1.0x' | '2.0x') => void;
  isTrainerPlaying: boolean;
  setIsTrainerPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isDrillMode?: boolean;
  isAnswerRevealed?: boolean;
  onRevealAnswer?: () => void;
  onNextRandomCase?: () => void;
}

export const AlgTrainerPlayback: React.FC<AlgTrainerPlaybackProps> = ({
  trainerMoveIdx,
  setTrainerMoveIdx,
  trainerMoves,
  trainerSpeed,
  setTrainerSpeed,
  isTrainerPlaying,
  setIsTrainerPlaying,
  isDrillMode = false,
  isAnswerRevealed = true,
  onRevealAnswer,
  onNextRandomCase,
}) => {
  const isBlindHidden = isDrillMode && !isAnswerRevealed;

  return (
    <>
      {/* PINNED PLAYBACK / BLIND DRILL CONTROLS */}
      {isBlindHidden ? (
        <div className="flex flex-wrap items-center justify-center gap-2 shrink-0 py-1.5 px-1 border-y border-[#F1F3F5]">
          <button
            type="button"
            onClick={() => {
              onRevealAnswer?.();
              sound.playTick();
            }}
            className="bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            👀 Xem Đáp Án (Reveal)
          </button>
          <button
            type="button"
            onClick={() => onNextRandomCase?.()}
            className="bg-white hover:bg-[#F8F9FA] text-[#111111] border border-[#EAECEF] hover:border-neutral-300 font-mono text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            🎲 Next Random Case
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0 py-1.5 px-1 border-y border-[#F1F3F5]">
          <div className="flex items-center gap-1">
            {!isDrillMode && (
              <button
                type="button"
                onClick={() => {
                  setIsTrainerPlaying(false);
                  setTrainerMoveIdx(0);
                  sound.playTick();
                }}
                className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800 cursor-pointer"
                title="Về đầu (|<)"
              >
                |&lt;
              </button>
            )}
            <button
              type="button"
              disabled={trainerMoveIdx === 0}
              onClick={() => {
                setIsTrainerPlaying(false);
                setTrainerMoveIdx((p) => Math.max(0, p - 1));
                sound.playTick();
              }}
              className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800 disabled:opacity-40 cursor-pointer"
              title="Lùi 1 bước (<)"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (trainerMoveIdx >= trainerMoves.length) {
                  setTrainerMoveIdx(0);
                  setIsTrainerPlaying(true);
                } else {
                  setIsTrainerPlaying((p) => !p);
                }
                sound.playTick();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              {isTrainerPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              )}
              <span>
                {isTrainerPlaying ? (
                  'Pause'
                ) : (
                  <>
                    Play<span className="hidden sm:inline"> [Space]</span>
                  </>
                )}
              </span>
            </button>
            <button
              type="button"
              disabled={trainerMoveIdx >= trainerMoves.length}
              onClick={() => {
                setIsTrainerPlaying(false);
                setTrainerMoveIdx((p) => Math.min(trainerMoves.length, p + 1));
                sound.playTick();
              }}
              className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800 disabled:opacity-40 cursor-pointer"
              title="Tiến 1 bước (>)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            {isDrillMode && (
              <button
                type="button"
                onClick={() => onNextRandomCase?.()}
                className="bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-95"
              >
                🎲 Next Random Case
              </button>
            )}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#F8F9FA] p-0.5 rounded-lg border border-[#EAECEF] font-mono text-[10.5px]">
            {(
              [
                { id: '0.5x', label: '0.5x' },
                { id: '1.0x', label: '1x' },
                { id: '2.0x', label: '2x' },
              ] as const
            ).map((spd) => (
              <button
                key={spd.id}
                type="button"
                onClick={() => setTrainerSpeed(spd.id)}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  trainerSpeed === spd.id
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formula Scrubber */}
      <div className="max-h-[85px] overflow-y-auto p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] shrink-0 space-y-1.5">
        <div
          className={`flex items-center justify-between text-[10px] font-mono text-neutral-400 font-bold leading-none transition-all duration-200 ${
            isBlindHidden ? 'blur-md select-none pointer-events-none opacity-50' : ''
          }`}
        >
          <span>FORMULA SCRUBBER</span>
          <span className="text-neutral-700">
            Bước {trainerMoveIdx} / {trainerMoves.length}
          </span>
        </div>

        <div
          className={`flex flex-wrap gap-1 transition-all duration-200 ${
            isBlindHidden ? 'blur-md select-none pointer-events-none opacity-50' : ''
          }`}
        >
          {trainerMoves.map((m, idx) => {
            const isDone = idx < trainerMoveIdx;
            const isCurrent = idx === trainerMoveIdx;
            const isWideOrSlice = isWideOrSliceMove(m.move);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsTrainerPlaying(false);
                  setTrainerMoveIdx(idx);
                  sound.playTick();
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#111111] text-white ring-1 ring-emerald-500 scale-105'
                    : isDone
                    ? `bg-emerald-50 text-emerald-700 ${
                        isWideOrSlice ? 'border-2 border-double border-emerald-400' : 'border border-emerald-200'
                      }`
                    : `bg-white text-neutral-700 hover:border-neutral-400 ${
                        isWideOrSlice ? 'border-2 border-double border-neutral-400' : 'border border-[#EAECEF]'
                      }`
                }`}
              >
                {m.move}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
