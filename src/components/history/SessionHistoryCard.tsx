import React, { useState } from 'react';
import { History, Download, Trash2, PlaySquare, ArrowRight, X, Plus, Edit2, Check as CheckIcon } from 'lucide-react';
import { SolveRecord, PenaltyType } from '../../types/cubing';
import { formatTime, parseTimeInput } from '../../utils/cubingStats';

interface SessionHistoryCardProps {
  solves: SolveRecord[];
  onAddManualSolve?: (timeMs: number, penalty?: PenaltyType, customScramble?: string) => void;
  onEditSolveTime?: (id: number, newTimeMs: number) => void;
  onUpdatePenalty: (id: number, penalty: PenaltyType) => void;
  onDeleteSolve: (id: number) => void;
  onClearSession: () => void;
  onAnalyzeSolve: (solve: SolveRecord) => void;
  onOpenAuditLog: () => void;
}

export const SessionHistoryCard: React.FC<SessionHistoryCardProps> = ({
  solves,
  onAddManualSolve,
  onEditSolveTime,
  onUpdatePenalty,
  onDeleteSolve,
  onClearSession,
  onAnalyzeSolve,
  onOpenAuditLog,
}) => {
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualTimeStr, setManualTimeStr] = useState('');
  const [manualPenalty, setManualPenalty] = useState<PenaltyType>('none');
  const [manualScramble, setManualScramble] = useState('');
  const [manualError, setManualError] = useState('');
  const [editingSolveId, setEditingSolveId] = useState<number | null>(null);
  const [editTimeStr, setEditTimeStr] = useState('');

  const latestSolve = solves.length > 0 ? solves[0] : null;
  const previousSolves = solves.length > 1 ? solves.slice(1) : [];

  const handleStartEdit = (solve: SolveRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSolveId(solve.id);
    setEditTimeStr((solve.timeMs / 1000).toFixed(2));
  };

  const handleSaveEdit = (solveId: number, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    const parsed = parseTimeInput(editTimeStr);
    if (parsed !== null && parsed > 0) {
      onEditSolveTime?.(solveId, parsed);
      setEditingSolveId(null);
      setEditTimeStr('');
    } else {
      alert('Vui lòng nhập định dạng thời gian hợp lệ (ví dụ: 9.31, 1:04.25 hoặc 931)');
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSolveId(null);
    setEditTimeStr('');
  };

  const handleConfirmAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const parsed = parseTimeInput(manualTimeStr);
    if (parsed === null || parsed <= 0) {
      setManualError('Thời gian không hợp lệ. Ví dụ: 9.31, 12.50, 1:04.25');
      return;
    }
    onAddManualSolve?.(parsed, manualPenalty, manualScramble.trim() || undefined);
    setManualTimeStr('');
    setManualScramble('');
    setManualPenalty('none');
    setIsAddingManual(false);
  };

  const handleExport = () => {
    const csvRows = [
      ['Solve #', 'Time (ms)', 'Formatted Time', 'Penalty', 'Moves (HTM)', 'TPS', 'Scramble'],
      ...solves.map((s) => [s.id, s.timeMs, formatTime(s.timeMs, s.penalty), s.penalty, s.moves || '', s.tps || '', `"${s.scramble || ''}"`]),
    ];
    const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.map((r) => r.join(',')).join('\n'));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', csvStr);
    dlAnchor.setAttribute('download', `cubemaster_session_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  };

  const renderInlineEditor = (solveId: number, compact = false) => (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        autoFocus
        value={editTimeStr}
        onChange={(e) => setEditTimeStr(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSaveEdit(solveId, e);
          if (e.key === 'Escape') handleCancelEdit(e);
        }}
        className={`${compact ? 'w-16 text-xs' : 'w-20 text-sm'} px-2 py-0.5 font-mono border border-[#94A3B8] rounded-lg bg-white text-[#111111] font-bold focus:outline-none focus:border-[#111111]`}
      />
      <button type="button" onClick={(e) => handleSaveEdit(solveId, e)} className="p-1.5 rounded-lg bg-[#111111] text-white hover:bg-neutral-800 transition-all" title="Lưu">
        <CheckIcon className="w-3 h-3" />
      </button>
      <button type="button" onClick={handleCancelEdit} className="p-1.5 rounded-lg bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] transition-all" title="Huỷ">
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col gap-3.5 h-full justify-between">
      <div className="flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAECEF]">
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-4 h-4 text-[#64748B] stroke-[1.75] shrink-0" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111] truncate">Session History</h3>
            <span className="px-2 py-0.5 rounded-lg bg-[#F1F5F9] text-[#64748B] font-mono text-[10px] font-semibold tabular-nums shrink-0">
              {solves.length}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddingManual(!isAddingManual)}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-medium font-mono transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
                isAddingManual ? 'bg-[#111111] text-white' : 'bg-[#F1F5F9] hover:bg-[#EAECEF] text-[#111111] border border-[#EAECEF]'
              }`}
              title="Thêm lần giải thủ công"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Thêm</span>
            </button>
            <button type="button" onClick={handleExport} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#111111] hover:bg-[#F1F5F9] transition-all cursor-pointer" title="Export CSV">
              <Download className="w-4 h-4 stroke-[1.75]" />
            </button>
            <button type="button" onClick={onClearSession} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#111111] hover:bg-[#F1F5F9] transition-all cursor-pointer" title="Clear Session">
              <Trash2 className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* Manual Solve Input Drawer */}
        {isAddingManual && (
          <form onSubmit={handleConfirmAddManual} className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#111111]">
              <span>Thêm thời gian thủ công</span>
              <button type="button" onClick={() => setIsAddingManual(false)} className="text-[#64748B] hover:text-[#111111]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="VD: 9.31, 1:04.25"
                value={manualTimeStr}
                onChange={(e) => setManualTimeStr(e.target.value)}
                className="flex-1 bg-white border border-[#EAECEF] rounded-xl px-2.5 py-2 text-xs font-mono text-[#111111] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#111111]"
              />
              <select
                value={manualPenalty}
                onChange={(e) => setManualPenalty(e.target.value as PenaltyType)}
                className="bg-white border border-[#EAECEF] rounded-xl px-2 py-2 text-xs font-mono text-[#111111] focus:outline-none"
              >
                <option value="none">OK</option>
                <option value="+2">+2s</option>
                <option value="dnf">DNF</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Scramble tuỳ chọn (bỏ trống để lấy hiện tại)"
              value={manualScramble}
              onChange={(e) => setManualScramble(e.target.value)}
              className="w-full bg-white border border-[#EAECEF] rounded-xl px-2.5 py-2 text-[11px] font-mono text-[#111111] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#111111]"
            />
            {manualError && <span className="text-[11px] font-mono text-[#111111] font-semibold">{manualError}</span>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsAddingManual(false)} className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#64748B] hover:bg-[#F1F5F9]">Huỷ</button>
              <button type="submit" className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-mono font-semibold hover:bg-neutral-800 transition-all active:scale-[0.98]">Lưu</button>
            </div>
          </form>
        )}

        {/* Scrollable Solve List */}
        <div id="solves-list-container" className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          {latestSolve && (
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF] flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-[#94A3B8] font-medium tabular-nums">#{latestSolve.id}</span>
                  {editingSolveId === latestSolve.id ? renderInlineEditor(latestSolve.id) : (
                    <div className="flex items-center gap-1.5 group/time">
                      <span className="font-mono-dotted text-lg font-bold text-[#111111] tabular-nums">
                        {formatTime(latestSolve.timeMs, latestSolve.penalty)}
                      </span>
                      <button type="button" onClick={(e) => handleStartEdit(latestSolve, e)} className="opacity-0 group-hover/time:opacity-100 p-1 rounded hover:bg-[#EAECEF] text-[#64748B] transition-opacity" title="Chỉnh sửa thời gian">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#EAECEF] text-[#111111] leading-none">
                    {latestSolve.penalty === 'none' ? 'OK' : latestSolve.penalty.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(['+2', 'dnf'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onUpdatePenalty(latestSolve.id, latestSolve.penalty === p ? 'none' : p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
                        latestSolve.penalty === p ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white hover:bg-[#F1F5F9] text-[#64748B] border-[#EAECEF]'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <button type="button" onClick={() => onDeleteSolve(latestSolve.id)} className="p-1 text-[#94A3B8] hover:text-[#111111] transition-colors cursor-pointer" title="Delete solve">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAnalyzeSolve(latestSolve)}
                className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold font-sans transition-all duration-200 ease-out active:scale-[0.98] group w-full cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <PlaySquare className="w-4 h-4 text-white/80 stroke-[1.75]" />
                  <span>Analyze Solve in 3D</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {previousSolves.map((solve) => (
            <div
              key={solve.id}
              onClick={() => onAnalyzeSolve(solve)}
              title="Click to analyze & replay solve in 3D"
              className="p-2.5 rounded-xl hover:bg-[#F8F9FA] transition-all duration-200 ease-out flex items-center justify-between border border-transparent hover:border-[#EAECEF] cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-[#94A3B8] font-medium tabular-nums">#{solve.id}</span>
                {editingSolveId === solve.id ? renderInlineEditor(solve.id, true) : (
                  <div className="flex items-center gap-1.5 group/edit">
                    <span className="font-mono-dotted text-base font-semibold text-[#111111] tabular-nums">
                      {formatTime(solve.timeMs, solve.penalty)}
                    </span>
                    {solve.penalty === '+2' && (
                      <span className="text-[11px] text-[#94A3B8] line-through font-mono tabular-nums">
                        {formatTime(solve.timeMs, 'none')}
                      </span>
                    )}
                    <button type="button" onClick={(e) => handleStartEdit(solve, e)} className="opacity-0 group-hover/edit:opacity-100 p-0.5 rounded hover:bg-[#EAECEF] text-[#64748B]" title="Sửa thời gian">
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    {solve.isPB && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#111111] text-white font-mono text-[9px] font-bold leading-none">
                        PB
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
                  {solve.moves && solve.tps ? `${solve.moves} HTM · ${solve.tps.toFixed(2)} TPS` : `${(solve.timeMs / 1000).toFixed(2)}s`}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] leading-none">
                  {solve.penalty === 'none' ? 'OK' : solve.penalty.toUpperCase()}
                </span>
              </div>
            </div>
          ))}

          {solves.length === 0 && (
            <div className="py-12 text-center text-xs font-mono text-[#94A3B8]">
              No solves in this session yet. Hold Space to start!
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#EAECEF] flex items-center justify-between text-xs font-mono text-[#64748B]">
        <span>Session: WCA 2025</span>
        <button type="button" onClick={onOpenAuditLog} className="text-[#111111] hover:underline font-semibold font-sans cursor-pointer">
          Full Audit Log
        </button>
      </div>
    </div>
  );
};
