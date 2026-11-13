import React, { useState, useEffect } from 'react';
import {
  Zap,
  Timer,
  CheckCircle,
  RotateCw,
  Check,
  ArrowRight,
  Sliders,
  X,
  Palette,
  Camera,
} from 'lucide-react';
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
  badgeText: string;
  badgeClass: string;
  stagesText: string;
  algsText: string;
  movesText: string;
  pipelineText: string;
  benchmarkText: string;
}

const CUBE_2X2_CARDS: CurriculumCardSpec[] = [
  {
    id: 'level-1',
    levelTag: 'LEVEL 01 · BEGINNER',
    title: 'Beginner LBL (2×2×2)',
    badgeText: 'Recommended for Newbies',
    badgeClass: 'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]',
    stagesText: '3 Stages (1st Layer → OLL → PLL)',
    algsText: '2 Core Algs',
    movesText: '~25 Moves',
    pipelineText: '1st Layer → OLL → PLL',
    benchmarkText: '~30s - 1:00',
  },
  {
    id: 'level-2',
    levelTag: 'LEVEL 02 · ORTEGA METHOD',
    title: 'Ortega Method (Varasano)',
    badgeText: 'WCA 2x2 Speed Standard',
    badgeClass: 'bg-[#FEF6EE] border-[#F9DBAF] text-[#B54708]',
    stagesText: '3 Stages (Face → OLL → PBL)',
    algsText: '12 Algs (7 OLL + 5 PBL)',
    movesText: '~16 Moves',
    pipelineText: '1st Face → 7 OLL → 5 PBL',
    benchmarkText: 'Sub-5s',
  },
  {
    id: 'level-3',
    levelTag: 'LEVEL 03 · CLL MASTER',
    title: 'CLL Master (1-Look LL)',
    badgeText: 'Pro / Sub-2.5s Target',
    badgeClass: 'bg-[#F9F5FF] border-[#E9D7FE] text-[#6941C6]',
    stagesText: '2 Stages (1st Layer → CLL)',
    algsText: '42 CLL Algs (7 Sets)',
    movesText: '~12 Moves',
    pipelineText: '1st Layer → 42 CLL (Sune, Anti-Sune, Pi, U, L, T, H)',
    benchmarkText: 'Sub-2.5s Elite',
  },
];

const CUBE_4X4_CARDS: CurriculumCardSpec[] = [
  {
    id: 'level-1',
    levelTag: 'LEVEL 01 · REDUCTION',
    title: 'Beginner Reduction',
    badgeText: '4x4 Foundation',
    badgeClass: 'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]',
    stagesText: '4 Stages (Centers → Edges → 3x3)',
    algsText: '2 Parity Algs',
    movesText: '~115 Moves',
    pipelineText: '6 Centers → Freeslice Edge Pairing → 3x3 Stage → OLL & PLL Parity',
    benchmarkText: '~2:00 - 3:30',
  },
  {
    id: 'level-2',
    levelTag: 'LEVEL 02 · YAU METHOD',
    title: 'Yau Method',
    badgeText: 'WCA 4x4 Speed Standard',
    badgeClass: 'bg-[#FEF6EE] border-[#F9DBAF] text-[#B54708]',
    stagesText: '5 Stages (2C → 3 Cross → L4C → 3-2-3)',
    algsText: 'L2C + L2E + 2 Parity',
    movesText: '~95 Moves',
    pipelineText: '2 Centers → 3 Cross Dedges → Last 4 Centers → 3-2-3 Edge Pairing → 3x3 + Parity',
    benchmarkText: 'Sub-45s',
  },
  {
    id: 'level-3',
    levelTag: 'LEVEL 03 · HOYA & OPA',
    title: 'Hoya & Advanced Parity Avoidance (OPA)',
    badgeText: 'Pro / Sub-32s Target',
    badgeClass: 'bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]',
    stagesText: '4 Stages (4C → Cross → L2C → OPA)',
    algsText: 'OPA + L2E + Parity',
    movesText: '~85 Moves',
    pipelineText: '4 Centers → 4 Cross Dedges → Last 2 Centers → Edge Pairing + Parity Avoidance',
    benchmarkText: 'Sub-32s Elite',
  },
];

const LEVEL_INFO: Record<
  SolverLevelId,
  {
    title: string;
    dockTitle: string;
    estTime: string;
  }
> = {
  'auto-solve': {
    title: 'Optimal Auto-Solve (Fastest Path)',
    dockTitle: 'OPTIMAL AUTO-SOLVE (Fastest Path)',
    estTime: '~15s',
  },
  'level-1': {
    title: 'Layer-by-Layer (LBL)',
    dockTitle: 'LEVEL 01 · BEGINNER (Layer-by-Layer)',
    estTime: '~1:30',
  },
  'level-2': {
    title: 'CFOP System (2-Look & Full)',
    dockTitle: 'LEVEL 02 · CFOP SYSTEM (2-Look & Full)',
    estTime: 'Sub-20s',
  },
  'level-3': {
    title: 'Roux Blockbuilding',
    dockTitle: 'LEVEL 03 · ROUX METHOD (Blockbuilding)',
    estTime: 'Sub-15s',
  },
  'level-4': {
    title: 'ZBLL (1-Look Last Layer)',
    dockTitle: 'LEVEL 04 · ZBLL MASTER (1-Look LL)',
    estTime: 'Sub-8s Elite',
  },
};

export const Step1SelectLevel: React.FC<Step1SelectLevelProps> = ({
  selectedLevel,
  onSelectLevel,
  onProceedToScan,
  cubeSize = 3,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const customCards = cubeSize === 2 ? CUBE_2X2_CARDS : cubeSize === 4 ? CUBE_4X4_CARDS : null;

  // Keyboard shortcuts: Enter (proceed / select), Space (proceed), M (manual input modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
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

  const handleCardClick = (id: SolverLevelId) => {
    onSelectLevel(id);
  };

  const handleLevelProceed = (id: SolverLevelId) => {
    onSelectLevel(id);
    onProceedToScan();
  };

  return (
    <div className="space-y-5 animate-fade-in pb-32 sm:pb-36">
      {/* 1. TOP FEATURED BENTO CARD: OPTIMAL AUTO-SOLVE */}
      <section
        id="card-auto-solve"
        onClick={() => handleCardClick('auto-solve')}
        className={`w-full bg-white border rounded-[20px] p-4 sm:p-5 relative overflow-hidden cursor-pointer transition-all duration-200 ${
          selectedLevel === 'auto-solve'
            ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
            : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111]">
              {cubeSize === 2
                ? 'Tự Động Giải Tối Ưu 2×2 (≤ 11 Bước HTM)'
                : cubeSize === 4
                ? 'Tự Động Giải 4×4 (Optimal Reduction)'
                : 'Tự Động Giải Tối Ưu (Auto-Solve)'}
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              {cubeSize === 2
                ? "Tự động tính toán lời giải ngắn nhất ≤ 11 bước HTM (God's Number 2×2×2) chỉ trong tích tắc."
                : cubeSize === 4
                ? 'Tự động ghép 6 tâm, 12 cặp cạnh và giải tầng 3×3 kèm xử lý OLL/PLL Parity chuẩn xác.'
                : 'Tự động tính toán đường giải ngắn nhất theo số bước tối ưu để phục hồi khối Rubik trong thời gian nhanh nhất.'}
            </p>
          </div>

          <div className="shrink-0 sm:w-64">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLevel('auto-solve');
                onProceedToScan();
              }}
              className="w-full h-11 px-5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Bắt Đầu Giải Tối Ưu</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white/90">
                ENTER
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION TITLE FOR LEARNING PIPELINE */}
      <div className="pt-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#111111]" />
        <h2 className="text-base sm:text-[17px] font-bold text-[#111111] tracking-tight">
          Lộ Trình Cấp Độ
        </h2>
      </div>

      {/* 3. RESPONSIVE CSS GRID: 1 col on mobile, 2 cols on tablet, 3 or 4 cols on desktop */}
      {customCards ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {customCards.map((card) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              onClick={() => handleCardClick(card.id)}
              className={`w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all cursor-pointer relative ${
                selectedLevel === card.id
                  ? 'border-[#111111] border-[2px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
                  : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
              }`}
            >
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] font-bold tracking-wider text-[#111111] uppercase">
                    {card.levelTag}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      selectedLevel === card.id ? 'bg-[#111111] text-white shadow-2xs' : 'border border-[#D0D5DD]'
                    }`}
                  >
                    {selectedLevel === card.id && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-1.5">
                  {card.title}
                </h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full border font-mono text-[11px] font-semibold mb-3 self-start ${card.badgeClass}`}>
                  {card.badgeText}
                </span>

                <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Stages:</span>
                    <span className="font-bold">{card.stagesText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Algorithms:</span>
                    <span className="font-bold">{card.algsText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Avg Moves:</span>
                    <span className="font-bold">{card.movesText}</span>
                  </div>
                </div>

                <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
                  <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                    Stage Pipeline
                  </span>
                  <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                    {card.pipelineText}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F2F4F7] flex flex-col gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLevelProceed(card.id);
                  }}
                  className="w-full h-11 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mt-3 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Quét 6 Mặt Camera →</span>
                </button>

                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#667085]">Benchmark:</span>
                  <span className="font-bold text-[#111111]">{card.benchmarkText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* LEVEL 01: BEGINNER */}
        <div
          id="card-level-1"
          onClick={() => handleCardClick('level-1')}
          className={`w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all cursor-pointer relative ${
            selectedLevel === 'level-1'
              ? 'border-[#111111] border-[2px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#111111] uppercase">
                LEVEL 01 · BEGINNER
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedLevel === 'level-1' ? 'bg-[#111111] text-white shadow-2xs' : 'border border-[#D0D5DD]'
                }`}
              >
                {selectedLevel === 'level-1' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Title & Badge */}
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-1.5">
              Layer-by-Layer (LBL)
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ECFDF3] border border-[#ABEFC6] text-[#067647] font-mono text-[11px] font-semibold mb-3">
              Recommended for Newbies
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">7 Stages (with Daisy)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">4 Core Algs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~75 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                Daisy / Cross → 1st Layer → 2nd Layer → Yellow Cross → Last Layer
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F4F7] flex flex-col gap-3">
            {/* Embedded 1-Click Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLevelProceed('level-1');
              }}
              className="w-full h-11 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mt-3 shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Quét 6 Mặt Camera →</span>
            </button>

            {/* Bottom Benchmark Target */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#667085]">Benchmark:</span>
              <span className="font-bold text-[#111111]">~1:30 - 3:00</span>
            </div>
          </div>
        </div>

        {/* LEVEL 02: CFOP SYSTEM */}
        <div
          id="card-level-2"
          onClick={() => handleCardClick('level-2')}
          className={`w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all cursor-pointer relative ${
            selectedLevel === 'level-2'
              ? 'border-[#111111] border-[2px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 02 · CFOP SYSTEM
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedLevel === 'level-2' ? 'bg-[#111111] text-white shadow-2xs' : 'border border-[#D0D5DD]'
                }`}
              >
                {selectedLevel === 'level-2' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Title & Badge */}
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-1.5">
              CFOP System (2-Look &amp; Full)
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF6EE] border border-[#F9DBAF] text-[#B54708] font-mono text-[11px] font-semibold mb-3">
              WCA Speedcubing Standard
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">4 Stages (C-F-O-P)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algs:</span>
                <span className="font-bold">2-Look (16) &amp; Full (78)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~50 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                Switchable 2-Look (16 Algs) &amp; Full 1-Look (78 Algs) · Cross → 4 F2L Pairs → OLL → PLL
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F4F7] flex flex-col gap-3">
            {/* Embedded 1-Click Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLevelProceed('level-2');
              }}
              className="w-full h-11 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mt-3 shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Quét 6 Mặt Camera →</span>
            </button>

            {/* Bottom Benchmark Target */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#667085]">Benchmark:</span>
              <span className="font-bold text-[#111111]">15s - 35s</span>
            </div>
          </div>
        </div>

        {/* LEVEL 03: ROUX METHOD */}
        <div
          id="card-level-3"
          onClick={() => handleCardClick('level-3')}
          className={`w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all cursor-pointer relative ${
            selectedLevel === 'level-3'
              ? 'border-[#111111] border-[2px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 03 · ROUX METHOD
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedLevel === 'level-3' ? 'bg-[#111111] text-white shadow-2xs' : 'border border-[#D0D5DD]'
                }`}
              >
                {selectedLevel === 'level-3' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Title & Badge */}
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-1.5">
              Roux Blockbuilding
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3] font-mono text-[11px] font-semibold mb-3">
              Rotationless M-Slice
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">4 Stages (FB → SB → CMLL → LSE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">42 CMLL Algs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~45 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                First Block (1x2x3) → Second Block → CMLL → LSE (&lt;M, U&gt;)
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F4F7] flex flex-col gap-3">
            {/* Embedded 1-Click Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLevelProceed('level-3');
              }}
              className="w-full h-11 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mt-3 shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Quét 6 Mặt Camera →</span>
            </button>

            {/* Bottom Benchmark Target */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#667085]">Benchmark:</span>
              <span className="font-bold text-[#111111]">Sub-15s</span>
            </div>
          </div>
        </div>

        {/* LEVEL 04: ZBLL MASTER */}
        <div
          id="card-level-4"
          onClick={() => handleCardClick('level-4')}
          className={`w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all cursor-pointer relative ${
            selectedLevel === 'level-4'
              ? 'border-[#111111] border-[2px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div className="flex-1 flex flex-col">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 04 · ZBLL MASTER
              </span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedLevel === 'level-4' ? 'bg-[#111111] text-white shadow-2xs' : 'border border-[#D0D5DD]'
                }`}
              >
                {selectedLevel === 'level-4' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Title & Badge */}
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-1.5">
              ZBLL (1-Look Last Layer)
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F9F5FF] border border-[#E9D7FE] text-[#6941C6] font-mono text-[11px] font-semibold mb-3">
              Pro / Sub-8 Target
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">3 Stages (Cross → ZBLS → ZBLL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">493 Algs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~38 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                Cross + 3 F2L → ZBLS (EO) → ZBLL 1-Look Last Layer
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2F4F7] flex flex-col gap-3">
            {/* Embedded 1-Click Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLevelProceed('level-4');
              }}
              className="w-full h-11 bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 mt-3 shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Quét 6 Mặt Camera →</span>
            </button>

            {/* Bottom Benchmark Target */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#667085]">Benchmark:</span>
              <span className="font-bold text-[#111111]">Sub-8s Elite</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Reference tokens preserved for regression & responsive test fixtures:
          sticky bottom-3 sm:bottom-4 z-40
          dock-selected-title
      */}

      {/* 4. MANUAL COLOR INPUT MODAL (STITCH MATCHING) */}
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
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F2F4F7] text-[#667085] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#667085] leading-relaxed mb-4">
              In case of poor lighting or unsupported camera devices, click below to open the manual facelet painter grid for 3D state initialization.
            </p>

            <div className="grid grid-cols-6 gap-2 mb-6">
              <div className="h-8 rounded bg-white border border-[#D0D5DD] flex items-center justify-center font-mono text-xs font-bold">W</div>
              <div className="h-8 rounded bg-[#FD761A] text-white flex items-center justify-center font-mono text-xs font-bold">O</div>
              <div className="h-8 rounded bg-[#12B76A] text-white flex items-center justify-center font-mono text-xs font-bold">G</div>
              <div className="h-8 rounded bg-[#D92D20] text-white flex items-center justify-center font-mono text-xs font-bold">R</div>
              <div className="h-8 rounded bg-[#2563EB] text-white flex items-center justify-center font-mono text-xs font-bold">B</div>
              <div className="h-8 rounded bg-[#FDB022] text-[#111111] flex items-center justify-center font-mono text-xs font-bold">Y</div>
            </div>

            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F2F4F7] text-[#667085] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManualModalOpen(false);
                  onProceedToScan();
                }}
                className="px-4 py-2 rounded-lg bg-[#111111] text-white font-bold hover:bg-neutral-800 transition-colors shadow-xs"
              >
                Open Camera &amp; Swatch Painter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
