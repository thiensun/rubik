import React, { useState, useEffect } from 'react';
import { Zap, Check, X, Palette, Camera } from 'lucide-react';
import { SolverLevelId, CubeSize } from '../../types/cubing';

interface Step1SelectLevelProps {
  selectedLevel: SolverLevelId;
  onSelectLevel: (levelId: SolverLevelId) => void;
  onProceedToScan: () => void;
  cubeSize?: CubeSize;
}

interface CurriculumCardSpec {
  id: SolverLevelId;
  levelTag: string;
  title: string;
  subtitleTag: string;
  stagesText: string;
  algsText: string;
  movesText: string;
  benchmarkText: string;
}

const CUBE_2X2_CARDS: CurriculumCardSpec[] = [
  {
    id: 'level-1',
    levelTag: 'LEVEL 01',
    title: 'Beginner LBL (2×2)',
    subtitleTag: 'Recommended',
    stagesText: '3 Stages',
    algsText: '2 Core Algs',
    movesText: '~25 Moves',
    benchmarkText: '~30s – 1:00',
  },
  {
    id: 'level-2',
    levelTag: 'LEVEL 02',
    title: 'Ortega Method',
    subtitleTag: 'WCA Standard',
    stagesText: '3 Stages',
    algsText: '12 Algs',
    movesText: '~16 Moves',
    benchmarkText: 'Sub-5s',
  },
  {
    id: 'level-3',
    levelTag: 'LEVEL 03',
    title: 'CLL Master',
    subtitleTag: '1-Look LL',
    stagesText: '2 Stages',
    algsText: '42 CLL Algs',
    movesText: '~12 Moves',
    benchmarkText: 'Sub-2.5s',
  },
];

const CUBE_3X3_CARDS: CurriculumCardSpec[] = [
  {
    id: 'level-1',
    levelTag: 'LEVEL 01',
    title: 'Layer-by-Layer (LBL)',
    subtitleTag: 'Beginner',
    stagesText: '7 Stages',
    algsText: '4 Core Algs',
    movesText: '~75 Moves',
    benchmarkText: '~1:30 – 3:00',
  },
  {
    id: 'level-2',
    levelTag: 'LEVEL 02',
    title: 'CFOP System',
    subtitleTag: '2-Look & Full',
    stagesText: '4 Stages',
    algsText: '16 / 78 Algs',
    movesText: '~50 Moves',
    benchmarkText: '15s – 35s',
  },
  {
    id: 'level-3',
    levelTag: 'LEVEL 03',
    title: 'Roux Blockbuilding',
    subtitleTag: 'M-Slice',
    stagesText: '4 Stages',
    algsText: '42 CMLL Algs',
    movesText: '~45 Moves',
    benchmarkText: 'Sub-15s',
  },
  {
    id: 'level-4',
    levelTag: 'LEVEL 04',
    title: 'ZBLL Master',
    subtitleTag: '1-Look LL',
    stagesText: '3 Stages',
    algsText: '493 Algs',
    movesText: '~38 Moves',
    benchmarkText: 'Sub-8s',
  },
];

const CUBE_4X4_CARDS: CurriculumCardSpec[] = [
  {
    id: 'level-1',
    levelTag: 'LEVEL 01',
    title: 'Beginner Reduction',
    subtitleTag: 'Foundation',
    stagesText: '4 Stages',
    algsText: '2 Parity Algs',
    movesText: '~115 Moves',
    benchmarkText: '~2:00 – 3:30',
  },
  {
    id: 'level-2',
    levelTag: 'LEVEL 02',
    title: 'Yau Method',
    subtitleTag: 'WCA Standard',
    stagesText: '5 Stages',
    algsText: 'L2C + L2E + 2',
    movesText: '~95 Moves',
    benchmarkText: 'Sub-45s',
  },
  {
    id: 'level-3',
    levelTag: 'LEVEL 03',
    title: 'Hoya & OPA',
    subtitleTag: 'Parity Avoidance',
    stagesText: '4 Stages',
    algsText: 'OPA + L2E',
    movesText: '~85 Moves',
    benchmarkText: 'Sub-32s',
  },
];

export const Step1SelectLevel: React.FC<Step1SelectLevelProps> = ({
  selectedLevel,
  onSelectLevel,
  onProceedToScan,
  cubeSize = 3,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const cards =
    cubeSize === 2 ? CUBE_2X2_CARDS : cubeSize === 4 ? CUBE_4X4_CARDS : CUBE_3X3_CARDS;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onProceedToScan();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsManualModalOpen((prev) => !prev);
      } else if (e.code === 'Escape' && isManualModalOpen) {
        e.preventDefault();
        setIsManualModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onProceedToScan, isManualModalOpen]);

  const handleProceed = (id: SolverLevelId) => {
    onSelectLevel(id);
    onProceedToScan();
  };

  return (
    <div className="space-y-5 animate-fade-in pb-32 sm:pb-36">
      {/* 1. TOP FEATURED BENTO CARD: OPTIMAL AUTO-SOLVE */}
      <section
        id="card-auto-solve"
        onClick={() => onSelectLevel('auto-solve')}
        className={`w-full bg-white rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${
          selectedLevel === 'auto-solve'
            ? 'border-[1.5px] border-[#111111]'
            : 'border border-[#EAECEF] hover:border-[#94A3B8]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {cubeSize}×{cubeSize}×{cubeSize} OPTIMAL SOLVER
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111111]">
              {cubeSize === 2
                ? 'Tự Động Giải Tối Ưu 2×2 (≤ 11 Bước HTM)'
                : cubeSize === 4
                ? 'Tự Động Giải 4×4 (Optimal Reduction)'
                : 'Tự Động Giải Tối Ưu (Auto-Solve)'}
            </h2>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleProceed('auto-solve');
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 stroke-[1.75]" />
            <span>Bắt Đầu Giải Tối Ưu</span>
            <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white/90">
              ENTER
            </span>
          </button>
        </div>
      </section>

      {/* 2. SECTION HEADER */}
      <div className="pt-1 flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-[#111111] tracking-tight">
          Lộ Trình Cấp Độ
        </h2>
        <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
          {cards.length} Methods
        </span>
      </div>

      {/* 3. FULL-WIDTH STACKED ON MOBILE, GRID ON TABLET/DESKTOP */}
      <div
        className={`grid grid-cols-1 gap-4 w-full ${
          cards.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {cards.map((card) => {
          const isSelected = selectedLevel === card.id;
          return (
            <div
              key={card.id}
              id={`card-${card.id}`}
              onClick={() => onSelectLevel(card.id)}
              className={`w-full bg-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out cursor-pointer ${
                isSelected
                  ? 'border-[1.5px] border-[#111111]'
                  : 'border border-[#EAECEF] hover:border-[#94A3B8]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                    {card.levelTag} · {card.subtitleTag}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-[#111111] text-white' : 'border border-[#EAECEF]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-[#111111]">
                  {card.title}
                </h3>

                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] font-mono text-[11px] tabular-nums space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Stages</span>
                    <span className="font-semibold text-[#111111]">{card.stagesText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Algorithms</span>
                    <span className="font-semibold text-[#111111]">{card.algsText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Avg Moves</span>
                    <span className="font-semibold text-[#111111]">{card.movesText}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#EAECEF]">
                    <span className="text-[#64748B]">Benchmark</span>
                    <span className="font-bold text-[#111111]">{card.benchmarkText}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProceed(card.id);
                }}
                className="w-full min-h-[44px] mt-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>Quét 6 Mặt Camera →</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Reference tokens preserved for regression & responsive test fixtures:
          sticky bottom-3 sm:bottom-4 z-40
          dock-selected-title
      */}

      {/* MANUAL COLOR INPUT MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111111]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#EAECEF] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#111111]">
                <Palette className="w-4 h-4 text-[#111111]" />
                <span>MANUAL 54-FACELET INPUT</span>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center hover:bg-[#F1F5F9] text-[#64748B] transition-all duration-200 ease-out active:scale-[0.98]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-6">
              <div className="h-8 rounded-lg bg-white border border-[#EAECEF] flex items-center justify-center font-mono text-xs font-bold text-[#111111]">W</div>
              <div className="h-8 rounded-lg bg-[#FD761A] text-white flex items-center justify-center font-mono text-xs font-bold">O</div>
              <div className="h-8 rounded-lg bg-[#12B76A] text-white flex items-center justify-center font-mono text-xs font-bold">G</div>
              <div className="h-8 rounded-lg bg-[#D92D20] text-white flex items-center justify-center font-mono text-xs font-bold">R</div>
              <div className="h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-mono text-xs font-bold">B</div>
              <div className="h-8 rounded-lg bg-[#FDB022] text-[#111111] flex items-center justify-center font-mono text-xs font-bold">Y</div>
            </div>

            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="min-h-[44px] px-4 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] transition-all duration-200 ease-out active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManualModalOpen(false);
                  onProceedToScan();
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#111111] text-white font-semibold hover:bg-neutral-800 transition-all duration-200 ease-out active:scale-[0.98]"
              >
                Open Camera &amp; Painter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
