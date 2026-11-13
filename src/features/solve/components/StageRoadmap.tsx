import React from 'react';
import { Check, Lock, ArrowLeft } from 'lucide-react';
import { SolutionData, SolutionStage } from '../../../utils/solutionStages';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { ColorScheme } from '../../../engine/algSimulator';
import { CubeSize } from '../../../types/cubing';
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
  cubeSize?: CubeSize;
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
  cubeSize = 3,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-[#EAECEF]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            LỘ TRÌNH GIẢI (ROADMAP)
          </span>
          <span className="font-mono text-xs font-bold text-[#111111] tabular-nums">
            {isAllCompleted || isActuallySolved
              ? `${solutionData.stages.length}/${solutionData.stages.length}`
              : `${currentStage.stageNumber}/${solutionData.stages.length}`}{' '}
            GIAI ĐOẠN
          </span>
        </div>

        {/* CFOP 2-Look vs Full 1-Look Segmented Toggle */}
        {cubeSize === 3 && activeLevel === 'level-2' && !customAlgorithm && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F1F5F9] border border-[#EAECEF] gap-1">
            <button
              type="button"
              onClick={() => {
                setCfopLookMode('2-look');
                sound.playTick();
              }}
              className={`min-h-[38px] py-1.5 px-2.5 rounded-lg font-mono text-[11px] font-bold transition-all duration-200 ease-out active:scale-[0.98] text-center cursor-pointer ${
                cfopLookMode === '2-look'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#64748B] hover:text-[#111111]'
              }`}
            >
              2-Look CFOP (16 Algs)
            </button>
            <button
              type="button"
              onClick={() => {
                setCfopLookMode('1-look');
                sound.playTick();
              }}
              className={`min-h-[38px] py-1.5 px-2.5 rounded-lg font-mono text-[11px] font-bold transition-all duration-200 ease-out active:scale-[0.98] text-center cursor-pointer ${
                cfopLookMode === '1-look'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#64748B] hover:text-[#111111]'
              }`}
            >
              Full CFOP (78 Algs)
            </button>
          </div>
        )}
      </div>

      {/* Clickable Bento Stage Cards Stack */}
      <div className="flex flex-col gap-3">
        {solutionData.stages.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF] text-center flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#111111] text-white flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#111111] tracking-tight">
                Khối Rubik đã ở trạng thái hoàn thành (0 Moves)
              </h4>
              <p className="text-xs text-[#64748B] mt-1">
                Tất cả 6 mặt đã đồng màu hoàn chỉnh.
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
                  cubeSize={cubeSize}
                  activeLevel={activeLevel}
                  onJumpToParity={() => {
                    const parityStage =
                      solutionData.stages.find((s) =>
                        s.titleVi.toLowerCase().includes('parity'),
                      ) || solutionData.stages[solutionData.stages.length - 1];
                    if (parityStage) {
                      onSelectStage(parityStage);
                      sound.playTick();
                    }
                  }}
                />
              );
            }

            // Completed or Pending Stage
            return (
              <div
                key={stage.id}
                onClick={() => onSelectStage(stage)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] ${
                  isDone
                    ? 'bg-[#F8F9FA] border-[#EAECEF] hover:border-[#94A3B8]'
                    : 'bg-white border-[#EAECEF] opacity-65 hover:opacity-90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isDone ? 'bg-[#111111] text-white' : 'border border-[#EAECEF] text-[#64748B] font-mono'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.stageNumber}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#111111] tracking-tight">
                      {stage.titleVi}
                    </div>
                    <div className="font-mono text-[11px] text-[#64748B] whitespace-normal break-words leading-relaxed">
                      {stage.formulaSummary || stage.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isDone ? (
                    <span className="px-2 py-0.5 rounded-lg bg-[#111111] text-white font-mono text-[10px] font-bold">
                      DONE
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA Button */}
      <button
        type="button"
        disabled={solutionData.stages.length === 0}
        onClick={onMarkStageComplete}
        className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#111111] hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] mt-1 cursor-pointer"
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
