import React from 'react';
import { TimerState } from './ZenTimerStage';

export const CFOP_SPLIT_PHASES = ['Cross', 'F2L', 'OLL', 'PLL'] as const;

const PHASE_BAR_CLASSES = [
  'bg-neutral-800',
  'bg-neutral-600',
  'bg-neutral-400',
  'bg-neutral-200',
] as const;

interface SplitBreakdownBarProps {
  isSplitMode: boolean;
  timerState: TimerState;
  splits: number[];
}

export const SplitBreakdownBar: React.FC<SplitBreakdownBarProps> = ({
  isSplitMode,
  timerState,
  splits,
}) => {
  if (!isSplitMode) return null;

  // Running Micro-HUD at the bottom of the screen (Zen Focus)
  if (timerState === 'running') {
    const activePhaseIdx = Math.min(splits.length, CFOP_SPLIT_PHASES.length - 1);
    const activePhaseName = CFOP_SPLIT_PHASES[activePhaseIdx];

    return (
      <div
        id="split-running-hud"
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none"
      >
        <div className="px-3.5 py-1.5 rounded-full bg-white/90 border border-[#EAECEF] shadow-xs font-mono text-xs font-semibold text-neutral-600 tracking-wide whitespace-nowrap">
          Chặng {activePhaseIdx + 1}/4 ({activePhaseName})
        </div>
      </div>
    );
  }

  // Post-Solve Breakdown Bar & Exact Phase Grid
  if (timerState === 'stopped' && splits.length === 4) {
    const totalMs = Math.max(1, splits[3]);
    const durations = [
      splits[0],
      Math.max(0, splits[1] - splits[0]),
      Math.max(0, splits[2] - splits[1]),
      Math.max(0, splits[3] - splits[2]),
    ];

    return (
      <div
        id="split-breakdown-container"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl mx-auto px-2 mt-4 select-none"
      >
        <div className="w-full h-2 flex rounded-full overflow-hidden mt-4 bg-neutral-100 border border-[#EAECEF]">
          {CFOP_SPLIT_PHASES.map((phase, idx) => {
            const pct = (durations[idx] / totalMs) * 100;
            return (
              <div
                key={phase}
                style={{ width: `${Math.max(pct, 0.5)}%` }}
                className={`h-full transition-all ${PHASE_BAR_CLASSES[idx]}`}
                title={`${phase}: ${(durations[idx] / 1000).toFixed(2)}s (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 w-full">
          {CFOP_SPLIT_PHASES.map((phase, idx) => {
            const sec = (durations[idx] / 1000).toFixed(2);
            const pct = Math.round((durations[idx] / totalMs) * 100);
            return (
              <div
                key={phase}
                className="flex items-center justify-between sm:justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] font-mono text-[11px] text-neutral-700"
              >
                <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PHASE_BAR_CLASSES[idx]}`} />
                  {phase}:
                </span>
                <span className="tabular-nums text-neutral-600">
                  {sec}s ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
