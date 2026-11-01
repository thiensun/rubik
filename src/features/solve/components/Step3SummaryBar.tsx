import React, { useState } from 'react';
import { Check, Download, FlipHorizontal, X } from 'lucide-react';
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
  onBackToScan: () => void;
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
  onBackToScan,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <section className="w-full bg-white border border-[#EAECEF] rounded-[20px] p-3 sm:px-5 sm:py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div className="relative flex flex-wrap items-center justify-between sm:justify-start gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3F4F6] border border-[#EAECEF] text-[11px] sm:text-xs font-bold text-neutral-900">
          <span className={`w-2 h-2 rounded-full ${customAlgorithm ? 'bg-emerald-500' : 'bg-blue-600'}`} />
          <span className="truncate max-w-[200px] sm:max-w-none">
            {customAlgorithm ? `CÔNG THỨC · ${customAlgorithm.name}` : LEVEL_LABELS[activeLevel]}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-[#F3F4F6] transition-colors border border-[#EAECEF] flex items-center gap-1 cursor-pointer"
          >
            <span>{customAlgorithm || analyzedSolve ? 'Đổi / Thoát ▾' : 'Đổi Cấp Độ ▾'}</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-white rounded-2xl border border-[#EAECEF] shadow-xl p-2 z-50 animate-fade-in">
              {(customAlgorithm || analyzedSolve) && (
                <button
                  onClick={() => {
                    onClearCustomAlgorithm?.();
                    onClearAnalyzedSolve?.();
                    setIsDropdownOpen(false);
                    sound.playTick();
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-mono text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between border-b border-neutral-100 mb-1 cursor-pointer"
                >
                  <span>Thoát Phân Tích / Công Thức</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {(['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    onClearCustomAlgorithm?.();
                    onClearAnalyzedSolve?.();
                    setActiveLevel(lvl);
                    setIsDropdownOpen(false);
                    sound.playTick();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    !customAlgorithm && !analyzedSolve && activeLevel === lvl
                      ? 'bg-[#111111] text-white font-bold'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <span>{LEVEL_LABELS[lvl]}</span>
                  {!customAlgorithm && !analyzedSolve && activeLevel === lvl && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="font-mono text-[10.5px] sm:text-xs text-neutral-500 tracking-wide flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
        <span><strong className="text-neutral-900">GIẢI:</strong> {solutionData.totalMoves} BƯỚC</span>
        <span className="text-neutral-300">•</span>
        <span><strong className="text-neutral-900">GIAI ĐOẠN:</strong> {currentStage.stageNumber}/{solutionData.stages.length}</span>
        <span className="text-neutral-300">•</span>
        <span><strong className="text-neutral-900">THỜI GIAN:</strong> {solutionData.estTime}</span>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          onClick={onBackToScan}
          className="px-3 py-1.5 rounded-full text-xs font-mono font-medium text-neutral-700 hover:text-neutral-900 hover:bg-[#F3F4F6] border border-[#EAECEF] transition-all flex items-center gap-1.5 cursor-pointer"
          title="Quét Lại (Alt+S)"
        >
          <FlipHorizontal className="w-3.5 h-3.5 text-neutral-500" />
          <span>Quét Lại</span>
          <kbd className="hidden sm:inline text-[10px] bg-white px-1 py-0.5 rounded border border-[#EAECEF] text-neutral-900">Alt+S</kbd>
        </button>
        <button
          onClick={() => window.alert('Exporting PDF Solution Guide...')}
          className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#111111] text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>
    </section>
  );
};
