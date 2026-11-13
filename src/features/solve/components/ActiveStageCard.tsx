import React from 'react';
import { Check, Copy } from 'lucide-react';
import { SolutionStage } from '../../../utils/solutionStages';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { SpeedcubeCaseDiagram, F2L_SLOTS_META } from '../../../components/solver/SpeedcubeCaseDiagram';
import { DynamicCaseDiagram } from '../../../components/DynamicCaseDiagram';
import { ColorScheme } from '../../../engine/algSimulator';
import { parseFormulaTriggers, extractUniqueTriggers } from '../../../engine/triggerParser';
import { matchAlgorithmDatabaseForStage } from '../../../data/algorithms';
import { CubeSize } from '../../../types/cubing';
import { OrtegaPBLVisualizer } from './OrtegaPBLVisualizer';
import { ReductionStageVisualizer } from './ReductionStageVisualizer';

interface ActiveStageCardProps {
  stage: SolutionStage;
  currentMoveNum: number;
  totalMoves: number;
  customAlgorithm: CustomAlgorithmData | null;
  activeSubStepIndex: number;
  colorScheme: ColorScheme;
  copiedFormula: boolean;
  onCopyFormula: (formula: string) => void;
  onJumpToSubStep: (subIdx: number, startMoveNum?: number) => void;
  cubeSize?: CubeSize;
  activeLevel?: string;
  onJumpToParity?: (parityType: 'oll' | 'pll') => void;
}

export const ActiveStageCard: React.FC<ActiveStageCardProps> = ({
  stage,
  currentMoveNum,
  totalMoves,
  customAlgorithm,
  activeSubStepIndex,
  colorScheme,
  copiedFormula,
  onCopyFormula,
  onJumpToSubStep,
  cubeSize = 3,
  activeLevel = 'level-1',
  onJumpToParity,
}) => {
  const matchedDbAlg = !customAlgorithm
    ? matchAlgorithmDatabaseForStage(
        stage.id,
        stage.caseDetails?.formula || stage.subtitle,
      )
    : undefined;

  const safeSubIdx = Math.max(0, Math.min(3, activeSubStepIndex));
  const currentSlot = F2L_SLOTS_META[safeSubIdx] || F2L_SLOTS_META[0];
  const activeSubStep = stage.subSteps?.[safeSubIdx];

  const rawFormulaToDisplay =
    stage.caseDetails?.diagramType === 'f2l' && activeSubStep && activeSubStep.movesCount > 0
      ? activeSubStep.formula
      : stage.caseDetails?.formula || '';

  const displayFormula =
    matchedDbAlg &&
    rawFormulaToDisplay.replace(/[()[\]]/g, '').trim() ===
      matchedDbAlg.mainAlg.replace(/[()[\]]/g, '').trim()
      ? matchedDbAlg.mainAlg
      : rawFormulaToDisplay;
  const triggerBadges = extractUniqueTriggers(displayFormula);

  return (
    <div className="p-4 rounded-2xl bg-white border-[1.5px] border-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-3 relative transition-all duration-200 ease-out">
      {/* Active Stage Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#111111] text-white font-mono flex items-center justify-center text-xs font-bold shrink-0">
            {stage.stageNumber.toString().padStart(2, '0')}
          </div>
          <span className="text-xs font-bold text-[#111111] tracking-tight truncate">
            {stage.titleVi}
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg bg-[#111111] text-white font-mono text-[10px] font-bold tabular-nums shrink-0">
          Move {currentMoveNum}/{totalMoves}
        </span>
      </div>

      {stage.caseDetails && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="w-full bg-[#F8F9FA] border border-[#EAECEF] rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-semibold gap-2">
              <span className="text-neutral-900 font-bold">
                {stage.caseDetails.caseName}
              </span>
              <span className="font-mono text-[10.5px] text-neutral-500 bg-white px-2 py-0.5 rounded-md border border-[#EAECEF] shrink-0">
                {stage.caseDetails.probability}
              </span>
            </div>
            <p className="text-[11.5px] text-neutral-600 mt-1 leading-relaxed">
              {stage.caseDetails.description}
            </p>
          </div>

          <div className="grid grid-cols-12 gap-3 items-stretch">
            <div className="col-span-12 sm:col-span-5 flex flex-col items-center justify-center gap-1">
              {customAlgorithm ? (
                <DynamicCaseDiagram
                  id={customAlgorithm.id || 'step3-custom-alg'}
                  mainAlg={customAlgorithm.notation}
                  category={customAlgorithm.category}
                  colorScheme={colorScheme}
                  size={96}
                  cubeSize={cubeSize}
                />
              ) : matchedDbAlg ? (
                <DynamicCaseDiagram
                  id={matchedDbAlg.id}
                  mainAlg={matchedDbAlg.mainAlg}
                  category={matchedDbAlg.category}
                  subGroup={matchedDbAlg.subGroup}
                  colorScheme={colorScheme}
                  size={96}
                  customArrows={matchedDbAlg.arrows}
                  cubeSize={cubeSize}
                />
              ) : (
                <SpeedcubeCaseDiagram
                  caseName={stage.caseDetails.caseName}
                  diagramTitle={stage.caseDetails.diagramTitle}
                  diagramType={stage.caseDetails.diagramType}
                  patternNote={stage.caseDetails.patternNote}
                  topDownPattern={stage.caseDetails.topDownPattern}
                  activeSubStepIndex={safeSubIdx}
                />
              )}
              {matchedDbAlg && (
                <span className="font-mono text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider text-center">
                  {matchedDbAlg.category} · {matchedDbAlg.id.toUpperCase()}
                </span>
              )}
            </div>

            <div className="col-span-12 sm:col-span-7 flex flex-col justify-between bg-[#F8F9FA] border border-[#EAECEF] rounded-xl p-3 font-mono text-xs font-bold text-neutral-900 gap-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-wider border-b border-[#EAECEF] pb-1">
                  <span>
                    {stage.caseDetails.diagramType === 'f2l' && stage.subSteps
                      ? `CÔNG THỨC PAIR ${safeSubIdx + 1} (${currentSlot.slotCode})`
                      : 'CÔNG THỨC GIAI ĐOẠN (FORMULA)'}
                  </span>
                  <button
                    onClick={() => onCopyFormula(displayFormula)}
                    className="p-0.5 rounded text-neutral-400 hover:text-neutral-900 shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Copy Formula"
                  >
                    {copiedFormula ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1 leading-relaxed py-0.5">
                  {parseFormulaTriggers(displayFormula, true).map((seg, idx) =>
                    seg.type === 'trigger' && seg.trigger ? (
                      <span
                        key={idx}
                        style={{
                          color: seg.trigger.color,
                          backgroundColor: seg.trigger.bgColor,
                          borderColor: seg.trigger.borderColor,
                        }}
                        title={`${seg.trigger.tag}: ${seg.trigger.pattern}`}
                        className="px-1.5 py-0.5 rounded border text-[11px] font-extrabold cursor-help"
                      >
                        {seg.rawText}
                      </span>
                    ) : (
                      <span key={idx} className="select-all">
                        {seg.rawText}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {triggerBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-[#EAECEF]/80">
                  {triggerBadges.map((tr) => (
                    <span
                      key={tr.tag}
                      style={{
                        color: tr.color,
                        backgroundColor: tr.bgColor,
                        borderColor: tr.borderColor,
                      }}
                      title={`${tr.tag}: ${tr.pattern} — ${tr.descriptionVN}`}
                      className="px-1.5 py-0.2 rounded-full border font-sans text-[9.5px] font-bold tracking-tight cursor-help"
                    >
                      ★ {tr.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Adaptive Stage Visualizer for 2x2x2 (OrtegaPBLVisualizer) & 4x4x4 (ReductionStageVisualizer) */}
          {cubeSize === 2 && !customAlgorithm && (
            <OrtegaPBLVisualizer
              stageNumber={stage.stageNumber}
              caseName={stage.caseDetails.caseName}
              formula={displayFormula}
            />
          )}

          {cubeSize === 4 && !customAlgorithm && (
            <ReductionStageVisualizer
              stageNumber={stage.stageNumber}
              activeLevel={activeLevel}
              onJumpToParity={onJumpToParity}
            />
          )}
        </div>
      )}

      {/* Sub-Steps Breakdown */}
      {stage.subSteps && stage.subSteps.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            CHI TIẾT TỪNG CẶP / BƯỚC NHỎ ({stage.subSteps.length} SUB-STEPS):
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {stage.subSteps.map((sub, subIdx) => {
              const isSubActive = activeSubStepIndex === subIdx;
              return (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => onJumpToSubStep(subIdx, sub.startMoveNum)}
                  className={`w-full min-h-[40px] p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono transition-all duration-200 ease-out active:scale-[0.98] text-left cursor-pointer ${
                    isSubActive
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F8F9FA] text-[#111111] border-[#EAECEF] hover:border-[#94A3B8] hover:bg-[#F1F5F9]'
                  }`}
                  title={`Nhấn để chọn và nhảy 3D Cube đến ${sub.labelVi}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSubActive ? 'bg-white' : 'bg-[#94A3B8]'
                      }`}
                    />
                    <span className="font-bold text-[11px] truncate">{sub.labelVi}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 tabular-nums ${
                      isSubActive
                        ? 'bg-white/15 text-white'
                        : 'bg-white border border-[#EAECEF] text-[#111111]'
                    }`}
                  >
                    {sub.formula} ({sub.movesCount}b)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Holding Note */}
      {stage.caseDetails?.holdingNote && (
        <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] font-mono text-neutral-600 flex items-start gap-2">
          <span className="font-bold text-neutral-900 shrink-0">Holding Note:</span>
          <span>{stage.caseDetails.holdingNote}</span>
        </div>
      )}
    </div>
  );
};
