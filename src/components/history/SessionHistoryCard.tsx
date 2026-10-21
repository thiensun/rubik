import React from 'react';
import { History, Download, Trash2, PlaySquare, ArrowRight, X } from 'lucide-react';
import { SolveRecord, PenaltyType } from '../../types/cubing';
import { formatTime } from '../../utils/cubingStats';

interface SessionHistoryCardProps {
  solves: SolveRecord[];
  onUpdatePenalty: (id: number, penalty: PenaltyType) => void;
  onDeleteSolve: (id: number) => void;
  onClearSession: () => void;
  onAnalyzeSolve: (solve: SolveRecord) => void;
  onOpenAuditLog: () => void;
}

export const SessionHistoryCard: React.FC<SessionHistoryCardProps> = ({
  solves,
  onUpdatePenalty,
  onDeleteSolve,
  onClearSession,
  onAnalyzeSolve,
  onOpenAuditLog,
}) => {
  // Latest solve is at index 0
  const latestSolve = solves.length > 0 ? solves[0] : null;
  const previousSolves = solves.length > 1 ? solves.slice(1) : [];

  const handleExport = () => {
    const csvRows = [
      ['Solve #', 'Time (ms)', 'Formatted Time', 'Penalty', 'Moves (HTM)', 'TPS', 'Scramble'],
      ...solves.map((s) => [
        s.id,
        s.timeMs,
        formatTime(s.timeMs, s.penalty),
        s.penalty,
        s.moves || '',
        s.tps || '',
        `"${s.scramble || ''}"`,
      ]),
    ];
    const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.map((r) => r.join(',')).join('\n'));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', csvStr);
    dlAnchorElem.setAttribute('download', `cubemaster_session_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchorElem.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-mono-200/70 shadow-apple p-5 flex flex-col gap-3.5 h-full justify-between">
      <div className="flex flex-col gap-3.5">
        {/* History Header */}
        <div className="flex items-center justify-between pb-3 border-b border-mono-200/60">
          <div className="flex items-center gap-2">
            <History className="w-[18px] h-[18px] text-mono-600" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-mono-950">
              Session History
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-mono-100 text-mono-600 font-mono text-[10px] font-semibold">
              {solves.length} Solves
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExport}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-mono-400 hover:text-mono-900 hover:bg-mono-100 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClearSession}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-mono-400 hover:text-mono-900 hover:bg-mono-100 transition-colors"
              title="Clear Session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Scrollable Solve List */}
        <div
          id="solves-list-container"
          className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1"
        >
          {/* Latest Solve with Highlight & Dedicated AI Replay Button */}
          {latestSolve && (
            <div className="p-3 rounded-xl bg-mono-50 border border-mono-200/80 flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-mono-400 font-medium">
                    #{latestSolve.id}
                  </span>
                  <span className="font-mono-dotted text-lg font-bold text-mono-950 tabular-nums">
                    {formatTime(latestSolve.timeMs, latestSolve.penalty)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-mono-200 text-mono-800 leading-none">
                    {latestSolve.penalty === 'none' ? 'OK' : latestSolve.penalty.toUpperCase()}
                  </span>
                </div>
                {/* Quick penalty tags (+2, DNF) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePenalty(
                        latestSolve.id,
                        latestSolve.penalty === '+2' ? 'none' : '+2'
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      latestSolve.penalty === '+2'
                        ? 'bg-mono-950 text-white border-mono-950'
                        : 'bg-white hover:bg-mono-200 text-mono-600 border-mono-200'
                    }`}
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePenalty(
                        latestSolve.id,
                        latestSolve.penalty === 'dnf' ? 'none' : 'dnf'
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      latestSolve.penalty === 'dnf'
                        ? 'bg-mono-950 text-white border-mono-950'
                        : 'bg-white hover:bg-mono-200 text-mono-600 border-mono-200'
                    }`}
                  >
                    DNF
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSolve(latestSolve.id)}
                    className="p-0.5 text-mono-400 hover:text-mono-900 transition-colors"
                    title="Delete solve"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dedicated Button: Analyze Solve with Camera & AI Replay */}
              <button
                type="button"
                onClick={() => onAnalyzeSolve(latestSolve)}
                className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-mono-950 hover:bg-mono-800 text-white text-xs font-medium font-sans transition-all shadow-sm group w-full"
              >
                <span className="flex items-center gap-1.5">
                  <PlaySquare className="w-[15px] h-[15px] text-mono-300" />
                  <span>Analyze Solve with Camera &amp; AI Replay</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-mono-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Previous Solves */}
          {previousSolves.map((solve) => (
            <div
              key={solve.id}
              onClick={() => onAnalyzeSolve(solve)}
              title="Click to analyze & replay solve in 3D"
              className="p-2.5 rounded-lg hover:bg-mono-50 transition-colors flex items-center justify-between border border-transparent hover:border-mono-200/50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-mono-400 font-medium">#{solve.id}</span>
                {solve.penalty === '+2' ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono-dotted text-base font-semibold text-mono-950 tabular-nums">
                        {formatTime(solve.timeMs, '+2')}
                      </span>
                      <span className="text-[11px] text-mono-400 line-through font-mono">
                        {formatTime(solve.timeMs, 'none')}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-mono-200 text-mono-800 font-mono text-[9px] font-semibold leading-none">
                      +2
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono-dotted text-base font-semibold text-mono-950 tabular-nums">
                      {formatTime(solve.timeMs, solve.penalty)}
                    </span>
                    {solve.isPB && (
                      <span className="px-1.5 py-0.5 rounded bg-mono-950 text-white font-mono text-[9px] font-bold leading-none">
                        PB
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {solve.penalty === '+2' && solve.comment ? (
                  <span className="text-[11px] font-mono text-mono-400">{solve.comment}</span>
                ) : (
                  <>
                    <span className="text-[11px] font-mono text-mono-400">
                      {solve.moves && solve.tps
                        ? `${solve.moves} HTM · ${solve.tps.toFixed(2)} TPS`
                        : `${(solve.timeMs / 1000).toFixed(2)}s`}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-mono-500 bg-mono-100 leading-none">
                      {solve.penalty === 'none' ? 'OK' : solve.penalty.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {solves.length === 0 && (
            <div className="py-12 text-center text-xs font-mono text-mono-400">
              No solves in this session yet. Hold Space to start!
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="pt-3 border-t border-mono-100 flex items-center justify-between text-xs font-mono text-mono-500">
        <span>Session: WCA 2025</span>
        <button
          type="button"
          onClick={onOpenAuditLog}
          className="text-mono-900 hover:underline font-semibold font-sans"
        >
          Full Audit Log
        </button>
      </div>
    </div>
  );
};
