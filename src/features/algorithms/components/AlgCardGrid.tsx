import React, { useState, useEffect } from 'react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { ColorScheme } from '../../../engine/algSimulator';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { AlgCardItem } from './AlgCardItem';

export type MasteryStatus = 'unlearned' | 'learning' | 'mastered';

const INITIAL_BATCH_SIZE = 36;

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
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [filteredAlgs]);

  if (filteredAlgs.length === 0) {
    return (
      <div className="bg-white border border-[#EAECEF] rounded-[24px] p-12 text-center text-neutral-400 font-mono text-xs">
        Không tìm thấy công thức nào khớp với bộ lọc hiện tại.
      </div>
    );
  }

  const visibleAlgs = filteredAlgs.slice(0, visibleCount);
  const remaining = filteredAlgs.length - visibleAlgs.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleAlgs.map((alg) => (
          <AlgCardItem
            key={alg.id}
            alg={alg}
            status={masteryMap[alg.id] || 'unlearned'}
            isSelectedInTrainer={!isDrillMode && selectedTrainerAlgId === alg.id}
            isCopied={copiedId === alg.id}
            colorScheme={colorScheme}
            onCycleMastery={onCycleMastery}
            onSelectAlgForTrainer={onSelectAlgForTrainer}
            onLoadInto3D={onLoadInto3D}
            onOpenMobileSheet={onOpenMobileSheet}
            onCopyFormula={onCopyFormula}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + INITIAL_BATCH_SIZE)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-neutral-900 border border-[#EAECEF] hover:border-neutral-300 font-mono text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            Hiển thị thêm ({remaining} công thức)
          </button>
        </div>
      )}
    </div>
  );
};
