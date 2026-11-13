import React, { useMemo } from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { DynamicCaseDiagram } from '../../../components/DynamicCaseDiagram';
import { ColorScheme } from '../../../engine/algSimulator';
import { parseFormulaTriggers, extractUniqueTriggers } from '../../../engine/triggerParser';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { MasteryStatus } from './AlgCardGrid';

interface AlgCardItemProps {
  alg: AlgorithmEntry;
  status: MasteryStatus;
  isSelectedInTrainer: boolean;
  isCopied: boolean;
  colorScheme: ColorScheme;
  onCycleMastery: (id: string) => void;
  onSelectAlgForTrainer: (alg: AlgorithmEntry) => void;
  onLoadInto3D: (algData: CustomAlgorithmData & { prob?: string; holdingNoteVi?: string }) => void;
  onOpenMobileSheet: () => void;
  onCopyFormula: (id: string, formula: string) => void;
}

export const AlgCardItem = React.memo<AlgCardItemProps>(({
  alg,
  status,
  isSelectedInTrainer,
  isCopied,
  colorScheme,
  onCycleMastery,
  onSelectAlgForTrainer,
  onLoadInto3D,
  onOpenMobileSheet,
  onCopyFormula,
}) => {
  const segments = useMemo(() => parseFormulaTriggers(alg.mainAlg), [alg.mainAlg]);
  const uniqueTriggers = useMemo(() => extractUniqueTriggers(alg.mainAlg), [alg.mainAlg]);

  const formulaNode = (
    <div className="flex flex-wrap items-center gap-1.5 font-mono tabular-nums text-xs leading-relaxed">
      {segments.map((seg, idx) =>
        seg.type === 'trigger' && seg.trigger ? (
          <span
            key={idx}
            title={`${seg.trigger.tag}: ${seg.trigger.pattern} — ${seg.trigger.descriptionVN}`}
            className="px-2 py-0.5 rounded-lg border border-[#EAECEF] bg-white text-[#111111] font-bold cursor-help inline-flex items-center gap-1"
          >
            <span>{seg.rawText}</span>
            <span className="text-[9px] uppercase tracking-tight text-[#64748B] font-semibold">
              [{seg.trigger.tag}]
            </span>
          </span>
        ) : (
          <span key={idx} className="font-bold text-[#111111] px-0.5">
            {seg.rawText}
          </span>
        ),
      )}
    </div>
  );

  return (
    <div
      onClick={() => {
        onSelectAlgForTrainer(alg);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          onOpenMobileSheet();
        }
      }}
      className={`bg-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${
        isSelectedInTrainer
          ? 'border-[1.5px] border-[#111111]'
          : 'border border-[#EAECEF] hover:border-[#94A3B8]'
      }`}
    >
      {/* 1. MOBILE COMPACT ROW LAYOUT (< sm) */}
      <div className="flex sm:hidden items-start gap-3 w-full">
        <div className="shrink-0 w-16 h-16 flex items-center justify-center bg-[#F8F9FA] rounded-xl border border-[#EAECEF] p-1">
          <DynamicCaseDiagram
            id={alg.id}
            mainAlg={alg.mainAlg}
            setupAlg={alg.setupAlg}
            category={alg.category}
            subGroup={alg.subGroup}
            colorScheme={colorScheme}
            size={64}
            customArrows={alg.arrows}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-sans text-xs font-bold tracking-tight text-[#111111] truncate">
                {alg.name}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-mono text-[9px] font-semibold shrink-0">
                {alg.category}
              </span>
              {alg.isTwoLook && (
                <span className="px-1.5 py-0.5 rounded bg-[#111111] text-white font-mono text-[9px] font-bold shrink-0">
                  2L
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCycleMastery(alg.id);
              }}
              className={`shrink-0 px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold border transition-all duration-200 ease-out cursor-pointer ${
                status === 'mastered'
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : status === 'learning'
                  ? 'bg-[#F1F5F9] text-[#111111] border-[#EAECEF]'
                  : 'bg-white text-[#64748B] border-[#EAECEF]'
              }`}
            >
              {status === 'mastered' ? '✓' : status === 'learning' ? '●' : '○'}
            </button>
          </div>

          <div className="font-mono text-xs text-[#111111] font-bold leading-snug break-words">
            {formulaNode}
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAlgForTrainer(alg);
                onOpenMobileSheet();
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <span>▶ Xem 3D</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP & TABLET COMPREHENSIVE CARD (>= sm) */}
      <div className="hidden sm:flex flex-col justify-between gap-4 h-full">
        <div className="flex items-start gap-4">
          <div className="shrink-0 bg-[#F8F9FA] rounded-xl border border-[#EAECEF] p-1.5">
            <DynamicCaseDiagram
              id={alg.id}
              mainAlg={alg.mainAlg}
              setupAlg={alg.setupAlg}
              category={alg.category}
              subGroup={alg.subGroup}
              colorScheme={colorScheme}
              size={84}
              customArrows={alg.arrows}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-[#F1F5F9] text-[#64748B] font-mono text-[10px] font-bold uppercase">
                  {alg.category}
                </span>
                {alg.isTwoLook && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#111111] text-white font-mono text-[10px] font-bold">
                    2-LOOK
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleMastery(alg.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
                  status === 'mastered'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : status === 'learning'
                    ? 'bg-[#F1F5F9] text-[#111111] border-[#EAECEF]'
                    : 'bg-white text-[#64748B] border-[#EAECEF] hover:text-[#111111]'
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

            <h3 className="text-sm font-bold tracking-tight text-[#111111] leading-snug">
              {alg.name}
            </h3>
            <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
              {alg.recognitionVN}
            </p>
          </div>
        </div>

        <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-end gap-1">
            {uniqueTriggers.map((t) => (
              <span
                key={t.tag}
                title={`${t.tag}: ${t.pattern}`}
                className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded-md border border-[#EAECEF] bg-white text-[#64748B]"
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
              className="p-1 rounded-lg hover:bg-white text-[#64748B] hover:text-[#111111] transition-colors cursor-pointer"
              title="Sao chép công thức"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-[#111111]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {formulaNode}
        </div>

        <div className="pt-2.5 border-t border-[#EAECEF] flex flex-col gap-2.5">
          <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-xl px-3 py-2 text-xs text-[#64748B] leading-relaxed">
            <strong className="text-[#111111] font-semibold">Fingertrick:</strong>{' '}
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
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Xem 3D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
