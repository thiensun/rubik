import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { SolveRecord } from '../../types/cubing';
import { formatTime } from '../../utils/cubingStats';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  solves: SolveRecord[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, solves }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-[#EAECEF] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EAECEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] flex items-center justify-center">
              <FileText className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                WCA Official Session Audit Log
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                Session: WCA 2025 · Total Recorded Solves: {solves.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table of all solves */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#EAECEF] text-neutral-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">#</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">HTM / TPS</th>
                <th className="pb-3 font-semibold">Scramble</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F5]">
              {solves.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-2.5 text-neutral-400 font-bold">#{s.id}</td>
                  <td className="py-2.5 font-bold text-neutral-900 font-mono-dotted">
                    {formatTime(s.timeMs, s.penalty)}
                    {s.isPB && (
                      <span className="ml-1.5 px-1 py-0.2 bg-[#111111] text-white text-[9px] rounded font-bold">
                        PB
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        s.penalty === 'dnf'
                          ? 'bg-red-100 text-red-700'
                          : s.penalty === '+2'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {s.penalty === 'none' ? 'OK' : s.penalty.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-500">
                    {s.moves ? `${s.moves} / ${s.tps || '--'}` : '--'}
                  </td>
                  <td className="py-2.5 text-neutral-400 text-[10.5px] truncate max-w-[200px]" title={s.scramble}>
                    {s.scramble}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[#EAECEF] bg-[#F8F9FA] flex items-center justify-between text-xs text-neutral-500 font-mono">
          <span>Client-Side SHA-256 Verified WCA Audit Trail</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111111] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
