import React from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { DynamicCaseDiagram } from '../../../components/DynamicCaseDiagram';
import { ColorScheme } from '../../../engine/algSimulator';
import { parseFormulaTriggers, extractUniqueTriggers } from '../../../engine/triggerParser';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';

export type MasteryStatus = 'unlearned' | 'learning' | 'mastered';

interface AlgCardGridProps {
  filteredAlgs: AlgorithmEntry[];
  masteryMap: Record<string, MasteryStatus>;
  onCycleMastery: (id: string) => void;
  selectedTrainerAlgId: string;
  isDrillMode: boolean;
  onSelectAlgForTrainer: (alg: AlgorithmEntry) => void;
  onLoadInto3D: (algData: CustomAlgorithmData & { prob?: string; holdingNoteVi?: string }) => void;
  onOpenMobileSheet: () => void;
  colorScheme: ColorScheme;
  copiedId: string | null;
  onCopyFormula: (id: string, formula: string) => void;
}

export const AlgCardGrid: React.FC<AlgCardGridProps> = ({
  filteredAlgs,
  masteryMap,
  onCycleMastery,
  selectedTrainerAlgId,
  isDrillMode,
  onSelectAlgForTrainer,
  onLoadInto3D,
  onOpenMobileSheet,
  colorScheme,
  copiedId,
  onCopyFormula,
}) => {
  const renderFormulaWithTriggerBadges = (formula: string) => {
    const segments = parseFormulaTriggers(formula);
    return (
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs leading-relaxed">
        {segments.map((seg, idx) => {
          if (seg.type === 'trigger' && seg.trigger) {
            return (
              <span
                key={idx}
                style={{
                  color: seg.trigger.color,
                  backgroundColor: seg.trigger.bgColor,
                  borderColor: seg.trigger.borderColor,
                }}
                title={`${seg.trigger.tag}: ${seg.trigger.pattern} — ${seg.trigger.descriptionVN}`}
                className="px-2 py-0.5 rounded-lg border font-extrabold cursor-help transition-transform hover:scale-105 inline-flex items-center gap-1 shadow-2xs"
              >
                <span>{seg.rawText}</span>
                <span className="text-[9px] uppercase tracking-tight opacity-85 font-bold">
                  [{seg.trigger.tag}]
                </span>
              </span>
            );
          }
          return (
            <span key={idx} className="font-bold text-neutral-900 px-0.5">
              {seg.rawText}
            </span>
          );
        })}
      </div>
    );
  };

  if (filteredAlgs.length === 0) {
    return (
      <div className="bg-white border border-[#EAECEF] rounded-[24px] p-12 text-center text-neutral-400 font-mono text-xs">
        Không tìm thấy công thức nào khớp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredAlgs.map((alg) => {
        const status: MasteryStatus = masteryMap[alg.id] || 'unlearned';
        const isSelectedInTrainer = !isDrillMode && selectedTrainerAlgId === alg.id;
        const uniqueTriggers = extractUniqueTriggers(alg.mainAlg);

        return (
          <div
            key={alg.id}
            onClick={() => onSelectAlgForTrainer(alg)}
            className={`bg-white rounded-[24px] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all ${
              isSelectedInTrainer
                ? 'border-2 border-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                : 'border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-neutral-300'
            }`}
          >
            {/* Card Top: Dynamic 2D Diagram + Metadata + Mastery Toggle */}
            <div className="flex items-start gap-4">
              <DynamicCaseDiagram
                id={alg.id}
                mainAlg={alg.mainAlg}
                setupAlg={alg.setupAlg}
                category={alg.category}
                subGroup={alg.subGroup}
                colorScheme={colorScheme}
                size={86}
                customArrows={alg.arrows}
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-neutral-800 font-mono text-[10px] font-bold uppercase">
                      {alg.category}
                    </span>
                    {alg.isTwoLook && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold">
                        ★ 2-LOOK
                      </span>
                    )}
                    <span className="font-mono text-[10.5px] text-neutral-400 font-semibold">
                      Prob: {alg.probability}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCycleMastery(alg.id);
                    }}
                    className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      status === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : status === 'learning'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-[#F8F9FA] text-neutral-500 border-[#EAECEF] hover:text-neutral-800'
                    }`}
                    title="Nhấn để chuyển trạng thái: Chưa học -> Đang tập -> Đã thuộc"
                  >
                    {status === 'mastered'
                      ? 'Đã thuộc ✓'
                      : status === 'learning'
                      ? 'Đang tập ●'
                      : 'Chưa học ○'}
                  </button>
                </div>

                <h3 className="text-sm font-extrabold text-neutral-900 leading-snug">
                  {alg.name}
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                  {alg.recognitionVN}
                </p>
              </div>
            </div>

            {/* Formula Box with Color-Coded Trigger Badges */}
            <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  MAIN FORMULA (WCA)
                </span>
                <div className="flex items-center gap-1">
                  {uniqueTriggers.map((t) => (
                    <span
                      key={t.tag}
                      style={{
                        color: t.color,
                        backgroundColor: t.bgColor,
                        borderColor: t.borderColor,
                      }}
                      title={`${t.tag}: ${t.pattern}`}
                      className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border"
                    >
                      {t.tag}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyFormula(alg.id, alg.mainAlg);
                    }}
                    className="p-1 rounded-lg hover:bg-white text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                    title="Sao chép công thức"
                  >
                    {copiedId === alg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {renderFormulaWithTriggerBadges(alg.mainAlg)}
            </div>

            {/* Card Footer: Full-Width Fingertrick Box + Action Button */}
            <div className="pt-2.5 border-t border-[#F1F3F5] flex flex-col gap-2.5">
              <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-xl px-3 py-2.5 h-auto text-xs text-neutral-600 leading-relaxed">
                <strong className="text-neutral-900 font-semibold">Fingertrick:</strong>{' '}
                {alg.fingertrickVN}
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onSelectAlgForTrainer(alg);
                      onOpenMobileSheet();
                    } else {
                      onLoadInto3D({
                        id: alg.id,
                        name: alg.name,
                        notation: alg.mainAlg,
                        category: alg.category,
                        descriptionVi: alg.recognitionVN,
                        holdingNoteVi: alg.fingertrickVN,
                      });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Nạp vào Khối 3D</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
