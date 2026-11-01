import React from 'react';
import { Check, Lock, ArrowLeft } from 'lucide-react';
import { SolutionData, SolutionStage } from '../../../utils/solutionStages';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { ColorScheme } from '../../../engine/algSimulator';
import { sound } from '../../../utils/audio';
import { ActiveStageCard } from './ActiveStageCard';

interface StageRoadmapProps {
  solutionData: SolutionData;
  currentStage: SolutionStage;
  currentMoveNum: number;
  activeLevel: string;
  customAlgorithm: CustomAlgorithmData | null;
  cfopLookMode: '2-look' | '1-look';
  setCfopLookMode: (mode: '2-look' | '1-look') => void;
  activeSubStepIndex: number;
  setActiveSubStepIndex: (idx: number) => void;
  isAllCompleted: boolean;
  isActuallySolved: boolean;
  colorScheme: ColorScheme;
  copiedFormula: boolean;
  onCopyFormula: (formula: string) => void;
  onSelectStage: (stage: SolutionStage) => void;
  onMarkStageComplete: () => void;
  onJumpToSubStep: (subIdx: number, startMoveNum?: number) => void;
}

export const StageRoadmap: React.FC<StageRoadmapProps> = ({
  solutionData,
  currentStage,
  currentMoveNum,
  activeLevel,
  customAlgorithm,
  cfopLookMode,
  setCfopLookMode,
  activeSubStepIndex,
  isAllCompleted,
  isActuallySolved,
  colorScheme,
  copiedFormula,
  onCopyFormula,
  onSelectStage,
  onMarkStageComplete,
  onJumpToSubStep,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#EAECEF] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-[#F2F4F7]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            LỘ TRÌNH GIẢI TỪNG BƯỚC (ROADMAP)
          </span>
          <span className="font-mono text-xs font-bold text-neutral-500">
            {isAllCompleted || isActuallySolved
              ? `${solutionData.stages.length}/${solutionData.stages.length}`
              : `${currentStage.stageNumber}/${solutionData.stages.length}`}{' '}
            GIAI ĐOẠN
          </span>
        </div>

        {/* CFOP 2-Look vs Full 1-Look Segmented Toggle */}
        {activeLevel === 'level-2' && !customAlgorithm && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F4F6] border border-[#EAECEF] gap-1">
            <button
              type="button"
              onClick={() => {
                setCfopLookMode('2-look');
                sound.playTick();
              }}
              className={`py-1.5 px-2.5 rounded-lg font-mono text-[11px] font-bold transition-all text-center cursor-pointer ${
                cfopLookMode === '2-look'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              ★ 2-Look CFOP (Rút gọn 16 Algs)
            </button>
            <button
              type="button"
              onClick={() => {
                setCfopLookMode('1-look');
                sound.playTick();
              }}
              className={`py-1.5 px-2.5 rounded-lg font-mono text-[11px] font-bold transition-all text-center cursor-pointer ${
                cfopLookMode === '1-look'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Full CFOP (1-Look 78 Algs)
            </button>
          </div>
        )}
      </div>

      {/* Clickable Bento Stage Cards Stack */}
      <div className="flex flex-col gap-3">
        {solutionData.stages.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)
              </h4>
              <p className="text-xs text-emerald-700 mt-1">
                Tất cả 6 mặt đều đồng màu chuẩn WCA hoàn chỉnh. Không cần thực hiện thêm bước giải nào.
              </p>
            </div>
          </div>
        ) : (
          solutionData.stages.map((stage) => {
            const isActive = stage.id === currentStage.id && !isAllCompleted;
            const isDone = isAllCompleted || stage.stageNumber < currentStage.stageNumber;

            if (isActive) {
              return (
                <ActiveStageCard
                  key={stage.id}
                  stage={stage}
                  currentMoveNum={currentMoveNum}
                  totalMoves={solutionData.totalMoves}
                  customAlgorithm={customAlgorithm}
                  activeSubStepIndex={activeSubStepIndex}
                  colorScheme={colorScheme}
                  copiedFormula={copiedFormula}
                  onCopyFormula={onCopyFormula}
                  onJumpToSubStep={onJumpToSubStep}
                />
              );
            }

            // Completed or Pending Stage
            return (
              <div
                key={stage.id}
                onClick={() => onSelectStage(stage)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isDone
                    ? 'bg-[#F8F9FA] border-[#EAECEF] hover:bg-neutral-100'
                    : 'bg-white border-[#EAECEF] opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isDone ? 'bg-[#111111] text-white' : 'border border-neutral-300 text-neutral-400 font-mono'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.stageNumber}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">
                      {stage.titleVi}
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400 whitespace-normal break-words leading-relaxed">
                      {stage.formulaSummary || stage.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
                      DONE
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA Button */}
      <button
        disabled={solutionData.stages.length === 0}
        onClick={onMarkStageComplete}
        className="w-full py-3.5 px-4 rounded-xl bg-[#111111] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-2 cursor-pointer"
      >
        <span>
          {isAllCompleted || isActuallySolved
            ? 'Khối Rubik Đã Giải Hoàn Tất!'
            : currentStage.stageNumber < solutionData.stages.length
            ? `Hoàn Thành Bước ${currentStage.stageNumber} (Next Stage)`
            : 'Hoàn Thành Toàn Bộ Lời Giải!'}
        </span>
        {solutionData.stages.length > 0 && <span className="hidden sm:inline-block keycap-dark">Enter</span>}
        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
      </button>
    </div>
  );
};
