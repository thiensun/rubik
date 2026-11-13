import React from 'react';
import { Check, Cpu, Zap, ArrowUpRight } from 'lucide-react';

interface ReductionStageVisualizerProps {
  stageNumber?: number;
  activeLevel?: string;
  onJumpToParity?: (parityType: 'oll' | 'pll') => void;
}

const CENTER_FACES: Array<{
  face: 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
  label: string;
  hex: string;
  textDark?: boolean;
}> = [
  { face: 'D', label: 'D (Trắng)', hex: '#FFFFFF', textDark: true },
  { face: 'U', label: 'U (Vàng)', hex: '#FFD500', textDark: true },
  { face: 'F', label: 'F (Lá)', hex: '#009B48' },
  { face: 'R', label: 'R (Đỏ)', hex: '#B71234' },
  { face: 'B', label: 'B (Lam)', hex: '#0046AD' },
  { face: 'L', label: 'L (Cam)', hex: '#FF5800' },
];

export const ReductionStageVisualizer: React.FC<ReductionStageVisualizerProps> = ({
  stageNumber = 2,
  activeLevel = 'level-1',
  onJumpToParity,
}) => {
  const isYau = activeLevel === 'level-2';

  // How many centers are solved at the current stage
  const solvedCentersCount =
    stageNumber === 1 ? (isYau ? 2 : 6) : 6;

  // Dedge pairing sub-stage state
  const dedgeSteps = [
    {
      id: 'cross-dedges',
      label: '3 Cross Dedges',
      subVi: '3 Cạnh Đáy D',
      done: stageNumber >= 2,
      active: stageNumber === 1,
    },
    {
      id: '8-dedges',
      label: 'Last 8 Dedges',
      subVi: 'Chu trình 3-2-3',
      done: stageNumber >= 3,
      active: stageNumber === 2,
    },
    {
      id: 'l2e',
      label: 'L2E (2 Cạnh Cuối)',
      subVi: 'Slice-Flip-Slice',
      done: stageNumber >= 4,
      active: stageNumber === 3,
    },
  ];

  const solvedDedgesCount =
    stageNumber === 1 ? (isYau ? 3 : 0) : stageNumber === 2 ? 10 : 12;

  return (
    <div className="bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-3 text-white flex flex-col gap-3 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-200">
            4x4 {isYau ? 'YAU METHOD' : 'REDUCTION'} TELEMETRY HUD
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[9.5px] font-bold text-emerald-400">
          Stage 0{stageNumber} / 04
        </span>
      </div>

      {/* 1. 6 Tâm (Centers 2x2): Mini 6-face grid (U, D, F, B, L, R) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300">
            1. 6 Tâm (Centers 2x2)
          </span>
          <span className="font-mono text-[10px] font-bold text-emerald-400">
            {solvedCentersCount}/6 Solved
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {CENTER_FACES.map((c, idx) => {
            const isCenterSolved = idx < solvedCentersCount;
            return (
              <div
                key={c.face}
                className={`rounded-lg p-1.5 border flex flex-col items-center gap-1 transition-all ${
                  isCenterSolved
                    ? 'bg-neutral-950 border-emerald-500/50'
                    : 'bg-neutral-950/50 border-neutral-800 opacity-65'
                }`}
              >
                {/* Mini 2x2 center block */}
                <div className="relative w-6 h-6 grid grid-cols-2 gap-0.5 p-0.5 rounded bg-black/60">
                  {[0, 1, 2, 3].map((dot) => (
                    <span
                      key={dot}
                      className="rounded-[1.5px]"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  {isCenterSolved && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] font-bold text-neutral-300">
                  {c.face}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 12 Cặp Cạnh (Dedges): Progress counter (3 Cross Dedges -> Last 8 Dedges -> L2E) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300">
            2. 12 Cặp Cạnh (Dedges)
          </span>
          <span className="font-mono text-[10px] font-bold text-amber-400">
            {solvedDedgesCount}/12 Dedges Paired
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {dedgeSteps.map((st) => (
            <div
              key={st.id}
              className={`px-2 py-1.5 rounded-lg border font-mono flex flex-col justify-between gap-0.5 ${
                st.done
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : st.active
                  ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9.5px] font-bold truncate">{st.label}</span>
                {st.done && <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />}
              </div>
              <span className="text-[8.5px] opacity-80 truncate">{st.subVi}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Parity Check: OLL Parity & PLL Parity Status Badges + 1-Click Jump */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300">
              3. Parity Check (Tầng Cuối 4x4)
            </span>
          </div>
          <span className="font-mono text-[9px] text-neutral-400">
            1-Click Jump to Tape
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onJumpToParity?.('oll')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <span>OLL Parity</span>
                <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-200">
                  Odd Flip
                </span>
              </div>
              <div className="font-mono text-[9px] text-neutral-400 truncate">
                Rw U2 x Rw U2 Rw U2 Rw&apos;...
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => onJumpToParity?.('pll')}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold text-sky-300 flex items-center gap-1">
                <span>PLL Parity</span>
                <span className="text-[8.5px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-200">
                  Odd Swap
                </span>
              </div>
              <div className="font-mono text-[9px] text-neutral-400 truncate">
                2R2 U2 2R2 Uw2 2R2 Uw2
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-sky-300 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
