import React from 'react';
import { SessionStats } from '../../types/cubing';
import { formatTime } from '../../utils/cubingStats';

interface MetricCardsProps {
  stats: SessionStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* 1. Best Time (PB) */}
      <div className="border border-[#EAECEF] bg-white rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs transition-all">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
          PB (Best)
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] tabular-nums">
            {formatTime(stats.bestTime)}
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {stats.bestSolveId ? `Lần giải #${stats.bestSolveId}` : '--'}
        </span>
      </div>

      {/* 2. Current Ao5 */}
      <div className="border border-[#EAECEF] bg-white rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs transition-all">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
          Ao5
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] tabular-nums">
            {formatTime(stats.ao5)}
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {stats.ao5Best ? `PB: ${formatTime(stats.ao5Best)}` : '--'}
        </span>
      </div>

      {/* 3. Current Ao12 */}
      <div className="border border-[#EAECEF] bg-white rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs transition-all">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
          Ao12
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] tabular-nums">
            {formatTime(stats.ao12)}
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {stats.ao12Best ? `PB: ${formatTime(stats.ao12Best)}` : '--'}
        </span>
      </div>

      {/* 4. Total Solves */}
      <div className="border border-[#EAECEF] bg-white rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-1 shadow-xs transition-all">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
          Solves
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] tabular-nums">
            {stats.totalSolves}
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {stats.totalSolves > 0 ? `${stats.validSolvesCount} hợp lệ` : '--'}
        </span>
      </div>
    </div>
  );
};
