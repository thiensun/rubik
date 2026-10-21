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
} from 'lucide-react';
import { SolverLevelId } from '../../types/cubing';

interface Step1SelectLevelProps {
  selectedLevel: SolverLevelId;
  onSelectLevel: (levelId: SolverLevelId) => void;
  onProceedToScan: () => void;
}

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
    title: '2-Look CFOP',
    dockTitle: 'LEVEL 02 · INTERMEDIATE (2-Look CFOP)',
    estTime: '35s - 45s',
  },
  'level-3': {
    title: 'Full CFOP Master',
    dockTitle: 'LEVEL 03 · ADVANCED (Full CFOP Master)',
    estTime: 'Sub-15s',
  },
  'level-4': {
    title: 'ZBLL System',
    dockTitle: 'LEVEL 04 · EXPERT (ZBLL System)',
    estTime: 'Sub-8s Elite',
  },
};

export const Step1SelectLevel: React.FC<Step1SelectLevelProps> = ({
  selectedLevel,
  onSelectLevel,
  onProceedToScan,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

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

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* 1. TOP FEATURED BENTO CARD: OPTIMAL AUTO-SOLVE (FASTEST PATH) */}
      <section
        id="card-auto-solve"
        onClick={() => handleCardClick('auto-solve')}
        className={`bg-white border rounded-[20px] p-6 sm:p-7 relative overflow-hidden cursor-pointer transition-all duration-200 ${
          selectedLevel === 'auto-solve'
            ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
            : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
        }`}
      >
        {/* Technical HUD Header Bar in Monospace */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 sm:pb-4 sm:mb-4 border-b border-[#F2F4F7]">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[12px] font-semibold text-[#475467] tracking-tight">
            <span className="inline-flex w-2 h-2 rounded-full bg-[#FD761A] animate-ping" />
            <span className="font-bold text-[#111111]">• ENGINE: KOCIEMBA TWO-PHASE</span>
            <span className="text-[#D0D5DD] hidden sm:inline">|</span>
            <span className="hidden sm:inline">TARGET: &lt;= 20 MOVES (HTM)</span>
            <span className="text-[#D0D5DD]">|</span>
            <span className="text-[#067647] font-bold">INSTANT READY</span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-[#FFF4ED] border border-[#FFD6AE] text-[#B54708] font-mono text-[10px] sm:text-[11px] font-bold tracking-tight">
            GOD&apos;S NUMBER OPTIMIZED
          </span>
        </div>

        {/* Card Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <h2 className="text-xl sm:text-[26px] font-extrabold tracking-tight text-[#111111]">
                Optimal Auto-Solve (Fastest Path)
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F2F4F7] text-[#344054] text-xs font-mono font-semibold">
                Kociemba v2
              </span>
            </div>

            <p className="text-xs sm:text-[15px] text-[#667085] leading-relaxed max-w-3xl">
              Mixed-up cube on your desk? CubeMaster AI runs a two-phase mathematical exploration to calculate the absolute shortest turn sequence. No algorithms or patterns to memorize — simply follow the interactive 3D step-by-step turns to restore the cube in under half a minute.
            </p>

            {/* Metric Pills Row - 2x2 grid on mobile, flex on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1 sm:pt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] sm:text-xs font-mono font-semibold text-[#111111]">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FD761A] fill-[#FD761A] shrink-0" />
                <span>Avg: 18.4 Moves</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] sm:text-xs font-mono font-semibold text-[#111111]">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12B76A] shrink-0" />
                <span>Execution: ~15s</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] sm:text-xs font-mono font-semibold text-[#475467]">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2E90FA] shrink-0" />
                <span>Zero Memorization</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] text-[11px] sm:text-xs font-mono font-semibold text-[#475467]">
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7A5AF8] shrink-0" />
                <span>Step Playback</span>
              </div>
            </div>
          </div>

          {/* Right Action & 2D Unfolded Cube Preview Box */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4">
            {/* 2D Mini Preview Unfolded Cube Icon Visual */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] w-full sm:w-auto lg:w-full justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid grid-cols-3 gap-0.5 p-1 bg-white rounded border border-[#EAECEF]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-white border border-[#D0D5DD]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FD761A]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#12B76A]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#D92D20]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FDB022]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-white border border-[#D0D5DD]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#12B76A]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-mono text-[11px] font-bold text-[#111111]">STATE SCANNER</span>
                  <span className="text-[11px] text-[#667085]">Ready for camera feed</span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#067647] bg-[#ECFDF3] px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" /> 2-PHASE
                </span>
              </div>
            </div>

            {/* Matte Black Primary Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLevel('auto-solve');
                onProceedToScan();
              }}
              className="w-full py-3 px-5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-medium text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold">Select Optimal Auto-Solve</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono tracking-widest text-white/90">
                ENTER
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION TITLE FOR LEARNING PIPELINE */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#111111]" />
          <h2 className="text-base sm:text-[17px] font-bold text-[#111111] tracking-tight">
            Human Learning Curriculum — Structured Progression
          </h2>
        </div>
        <span className="text-xs font-mono text-[#667085]">
          SELECT DESIRED TIER • REAL-TIME TPS &amp; MOVE EFFICIENCY AUDIT
        </span>
      </div>

      {/* 3. BOTTOM 4-COLUMN BENTO GRID: LEVELS 1 TO 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LEVEL 01: BEGINNER */}
        <div
          id="card-level-1"
          onClick={() => handleCardClick('level-1')}
          className={`bg-white border rounded-[20px] p-5 flex flex-col justify-between cursor-pointer relative transition-all duration-200 ${
            selectedLevel === 'level-1'
              ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div>
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
                <span className="font-bold">7 Stages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">4 Core Algs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~65 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                White Cross → 1st Layer → 2nd Layer → Yellow Cross → Last Layer
              </div>
            </div>
          </div>

          {/* Bottom Benchmark Target */}
          <div className="mt-5 pt-3 border-t border-[#F2F4F7] flex items-center justify-between font-mono text-xs">
            <span className="text-[#667085]">Benchmark:</span>
            <span className="font-bold text-[#111111]">~1:30 - 3:00</span>
          </div>
        </div>

        {/* LEVEL 02: INTERMEDIATE */}
        <div
          id="card-level-2"
          onClick={() => handleCardClick('level-2')}
          className={`bg-white border rounded-[20px] p-5 flex flex-col justify-between cursor-pointer relative transition-all duration-200 ${
            selectedLevel === 'level-2'
              ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 02 · INTERMEDIATE
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
              2-Look CFOP
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF6EE] border border-[#F9DBAF] text-[#B54708] font-mono text-[11px] font-semibold mb-3">
              Speedcubing Entry
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">4 Stages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">16 Standard Algs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Avg Moves:</span>
                <span className="font-bold">~52 Moves</span>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="text-[12px] text-[#475467] leading-relaxed space-y-1">
              <span className="font-mono text-[10px] text-[#98A2B3] uppercase block font-semibold">
                Stage Pipeline
              </span>
              <div className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-lg border border-[#EAECEF] text-[#111111]">
                Cross + Intuitive F2L → 2-Look OLL → 2-Look PLL
              </div>
            </div>
          </div>

          {/* Bottom Benchmark Target */}
          <div className="mt-5 pt-3 border-t border-[#F2F4F7] flex items-center justify-between font-mono text-xs">
            <span className="text-[#667085]">Benchmark:</span>
            <span className="font-bold text-[#111111]">35s - 45s</span>
          </div>
        </div>

        {/* LEVEL 03: ADVANCED */}
        <div
          id="card-level-3"
          onClick={() => handleCardClick('level-3')}
          className={`bg-white border rounded-[20px] p-5 flex flex-col justify-between cursor-pointer relative transition-all duration-200 ${
            selectedLevel === 'level-3'
              ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 03 · ADVANCED
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
              Full CFOP Master
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3] font-mono text-[11px] font-semibold mb-3">
              WCA Standard
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Stages:</span>
                <span className="font-bold">4 Stages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">78 (57 OLL + 21 PLL)</span>
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
                Cross → Rotationless F2L → 1-Look OLL → 1-Look PLL
              </div>
            </div>
          </div>

          {/* Bottom Benchmark Target */}
          <div className="mt-5 pt-3 border-t border-[#F2F4F7] flex items-center justify-between font-mono text-xs">
            <span className="text-[#667085]">Benchmark:</span>
            <span className="font-bold text-[#111111]">Sub-15s</span>
          </div>
        </div>

        {/* LEVEL 04: EXPERT */}
        <div
          id="card-level-4"
          onClick={() => handleCardClick('level-4')}
          className={`bg-white border rounded-[20px] p-5 flex flex-col justify-between cursor-pointer relative transition-all duration-200 ${
            selectedLevel === 'level-4'
              ? 'border-[#111111] border-[1.5px] shadow-[0_4px_18px_rgba(0,0,0,0.06)]'
              : 'border-[#EAECEF] hover:border-[#D0D5DD] hover:shadow-[0_4px_20px_-2px_rgba(16,24,40,0.04)]'
          }`}
        >
          <div>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                LEVEL 04 · EXPERT
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
              ZBLL System
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F9F5FF] border border-[#E9D7FE] text-[#6941C6] font-mono text-[11px] font-semibold mb-3">
              Pro / Sub-8 Target
            </span>

            {/* Monospace Metrics Pill */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] mb-3 font-mono text-[11px] text-[#344054] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Algorithms:</span>
                <span className="font-bold">493 Algs Total</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Execution:</span>
                <span className="font-bold">1-Look Last Layer</span>
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
                Oriented Edges → 1-Look LL (Zborowski-Bruchem)
              </div>
            </div>
          </div>

          {/* Bottom Benchmark Target */}
          <div className="mt-5 pt-3 border-t border-[#F2F4F7] flex items-center justify-between font-mono text-xs">
            <span className="text-[#667085]">Benchmark:</span>
            <span className="font-bold text-[#111111]">Sub-8s Elite</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM PERSISTENT ACTION DOCK / FOOTER CARD */}
      <aside className="sticky bottom-3 sm:bottom-4 z-40 w-full pointer-events-none mt-6">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#EAECEF] rounded-2xl p-3 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left: Selected Mode Information & Quick Action */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-mono text-[#667085] uppercase tracking-wider font-semibold">
                  CURRENT SELECTION
                </div>
                <div className="text-xs sm:text-base font-bold text-[#111111] tracking-tight truncate" id="dock-selected-title">
                  {LEVEL_INFO[selectedLevel].dockTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-[#EAECEF] font-mono text-[11px] sm:text-xs text-[#475467] shrink-0">
              <span className="hidden sm:inline">
                Estimated Time: <strong className="text-[#111111]">{LEVEL_INFO[selectedLevel].estTime}</strong>
              </span>
              <span className="text-[#D0D5DD] hidden sm:inline">|</span>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="text-[#111111] hover:text-[#FD761A] transition-colors flex items-center gap-1 font-semibold text-[11px] sm:text-xs bg-[#F8F9FA] px-2 py-1 rounded-lg border border-[#EAECEF]"
              >
                <span className="px-1 py-0.2 rounded bg-white text-[10px] text-[#667085] border border-[#EAECEF]">
                  M
                </span>
                <span>Thủ công</span>
              </button>
            </div>
          </div>

          {/* Right: Matte Black Primary Action Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onProceedToScan}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#111111] hover:bg-[#262626] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 transition-transform active:scale-[0.98] shadow-sm"
            >
              <span>Quét 6 Mặt Camera (Scan Camera)</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/20 text-[10px] font-mono tracking-widest text-white">
                SPACE
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 5. MANUAL COLOR INPUT MODAL (STITCH MATCHING) */}
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
