import React from 'react';
import { SessionStats } from '../../types/cubing';
import { formatTime } from '../../utils/cubingStats';

interface MetricCardsProps {
  stats: SessionStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'PB (Best)',
      value: formatTime(stats.bestTime),
      sub: stats.bestSolveId ? `Solve #${stats.bestSolveId}` : '--',
    },
    {
      label: 'Ao5',
      value: formatTime(stats.ao5),
      sub: stats.ao5Best ? `PB: ${formatTime(stats.ao5Best)}` : '--',
    },
    {
      label: 'Ao12',
      value: formatTime(stats.ao12),
      sub: stats.ao12Best ? `PB: ${formatTime(stats.ao12Best)}` : '--',
    },
    {
      label: 'Solves',
      value: String(stats.totalSolves),
      sub: stats.totalSolves > 0 ? `${stats.validSolvesCount} valid` : '--',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white border border-[#EAECEF] rounded-2xl p-3.5 sm:p-4 text-center flex flex-col items-center justify-center gap-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out"
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
            {c.label}
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111111] tabular-nums tracking-tight mt-0.5">
            {c.value}
          </span>
          <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
            {c.sub}
          </span>
        </div>
      ))}
    </div>
  );
};
