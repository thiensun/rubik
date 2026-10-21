import React from 'react';
import { Star, TrendingDown } from 'lucide-react';
import { SessionStats } from '../../types/cubing';
import { formatTime } from '../../utils/cubingStats';

interface MetricCardsProps {
  stats: SessionStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Best Time (PB) */}
      <div className="bg-white p-3.5 rounded-xl border border-mono-200/70 shadow-apple flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-mono-500 text-[11px] font-mono uppercase tracking-wider">
          <span>Best Time</span>
          <Star className="w-[15px] h-[15px] text-mono-900" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-mono-dotted text-2xl font-bold text-mono-950 tabular-nums">
            {formatTime(stats.bestTime)}
          </span>
          {stats.bestTime !== null && (
            <span className="px-1 py-0.5 rounded text-[10px] font-mono font-bold bg-mono-950 text-white leading-none">
              PB
            </span>
          )}
        </div>
        <span className="text-[11px] text-mono-400 font-sans">
          {stats.bestSolveId ? `Solve #${stats.bestSolveId}` : 'No solves yet'}
        </span>
      </div>

      {/* Current Ao5 */}
      <div className="bg-white p-3.5 rounded-xl border border-mono-200/70 shadow-apple flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-mono-500 text-[11px] font-mono uppercase tracking-wider">
          <span>Ao5</span>
          <span className="text-[10px] font-mono text-mono-400">
            {stats.ao5 ? (stats.ao5 < 9000 ? 'SUB-9' : stats.ao5 < 10000 ? 'SUB-10' : 'AVG') : 'SUB-9'}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-mono-dotted text-2xl font-bold text-mono-950 tabular-nums">
            {formatTime(stats.ao5)}
          </span>
        </div>
        <span className="text-[11px] text-mono-400 font-sans">
          {stats.ao5Best ? `Best: ${formatTime(stats.ao5Best)}` : 'Best: --.--'}
        </span>
      </div>

      {/* Current Ao12 */}
      <div className="bg-white p-3.5 rounded-xl border border-mono-200/70 shadow-apple flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-mono-500 text-[11px] font-mono uppercase tracking-wider">
          <span>Ao12</span>
          <TrendingDown className="w-3.5 h-3.5 text-mono-400" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-mono-dotted text-2xl font-bold text-mono-950 tabular-nums">
            {formatTime(stats.ao12)}
          </span>
        </div>
        <span className="text-[11px] text-mono-400 font-sans">
          {stats.ao12Best ? `Best: ${formatTime(stats.ao12Best)}` : 'Best: --.--'}
        </span>
      </div>

      {/* Session Mean */}
      <div className="bg-white p-3.5 rounded-xl border border-mono-200/70 shadow-apple flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-mono-500 text-[11px] font-mono uppercase tracking-wider">
          <span>Mean</span>
          <span className="text-[10px] font-mono text-mono-500 font-medium">
            {stats.validSolvesCount}/{stats.totalSolves + 1}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-mono-dotted text-2xl font-bold text-mono-950 tabular-nums">
            {formatTime(stats.mean)}
          </span>
        </div>
        <span className="text-[11px] text-mono-400 font-sans">
          {stats.stdDev !== null ? `σ: ${(stats.stdDev / 1000).toFixed(2)}s` : 'σ: --'}
        </span>
      </div>
    </div>
  );
};
