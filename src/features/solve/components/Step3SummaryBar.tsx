import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { LEVEL_LABELS, SolutionData, SolutionStage } from '../../../utils/solutionStages';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { SolveRecord } from '../../../types/cubing';
import { sound } from '../../../utils/audio';

interface Step3SummaryBarProps {
  customAlgorithm?: CustomAlgorithmData | null;
  analyzedSolve?: SolveRecord | null;
  activeLevel: 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4';
  setActiveLevel: (level: 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4') => void;
  solutionData: SolutionData;
  currentStage: SolutionStage;
  onClearCustomAlgorithm?: () => void;
  onClearAnalyzedSolve?: () => void;
}

export const Step3SummaryBar: React.FC<Step3SummaryBarProps> = ({
  customAlgorithm,
  analyzedSolve,
  activeLevel,
  setActiveLevel,
  solutionData,
  currentStage,
  onClearCustomAlgorithm,
  onClearAnalyzedSolve,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <section className="w-full bg-white border border-[#EAECEF] rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div className="relative flex flex-wrap items-center justify-between sm:justify-start gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F1F5F9] border border-[#EAECEF] text-xs font-bold text-[#111111]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
          <span className="truncate max-w-[200px] sm:max-w-none tracking-tight">
            {customAlgorithm ? customAlgorithm.name : LEVEL_LABELS[activeLevel]}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#111111] hover:bg-[#F1F5F9] transition-all duration-200 ease-out active:scale-[0.98] border border-[#EAECEF] flex items-center gap-1 cursor-pointer"
          >
            <span>{customAlgorithm || analyzedSolve ? 'Đổi / Thoát ▾' : 'Đổi Cấp Độ ▾'}</span>
          </button>
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl border border-[#EAECEF] shadow-xl p-2 z-50 animate-fade-in">
              {(customAlgorithm || analyzedSolve) && (
                <button
                  type="button"
                  onClick={() => {
                    onClearCustomAlgorithm?.();
                    onClearAnalyzedSolve?.();
                    setIsDropdownOpen(false);
                    sound.playTick();
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-mono text-[#111111] hover:bg-[#F1F5F9] transition-all duration-200 ease-out flex items-center justify-between border-b border-[#EAECEF] mb-1 cursor-pointer"
                >
                  <span>Thoát Phân Tích / Công Thức</span>
                  <X className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              )}
              {(['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    onClearCustomAlgorithm?.();
                    onClearAnalyzedSolve?.();
                    setActiveLevel(lvl);
                    setIsDropdownOpen(false);
                    sound.playTick();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all duration-200 ease-out flex items-center justify-between cursor-pointer ${
                    !customAlgorithm && !analyzedSolve && activeLevel === lvl
                      ? 'bg-[#111111] text-white font-bold'
                      : 'hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111111]'
                  }`}
                >
                  <span>{LEVEL_LABELS[lvl]}</span>
                  {!customAlgorithm && !analyzedSolve && activeLevel === lvl && (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>
              ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="font-mono text-[11px] sm:text-xs text-[#64748B] tabular-nums flex flex-wrap items-center justify-center sm:justify-end gap-2">
        <span><strong className="text-[#111111]">{solutionData.totalMoves}</strong> BƯỚC</span>
        <span className="text-[#94A3B8]">•</span>
        <span>GIAI ĐOẠN <strong className="text-[#111111]">{currentStage.stageNumber}/{solutionData.stages.length}</strong></span>
        <span className="text-[#94A3B8]">•</span>
        <strong className="text-[#111111]">{solutionData.estTime}</strong>
      </div>
    </section>
  );
};
