import React, { useState, useMemo } from 'react';
import { RotateCcw, Camera, ChevronDown, Sparkles, Check } from 'lucide-react';
import { CubeNetState } from '../../utils/cubeState';
import { getCrossAdvisor } from '../../utils/crossAnalysis';
import { sound } from '../../utils/audio';
import { SolveRecord, CubeSize } from '../../types/cubing';
import { DEFAULT_COLOR_SCHEME, ColorScheme } from '../../engine/algSimulator';

// Modular Feature Components
import { CubeViewport3D } from '../../features/solve/components/CubeViewport3D';
import { ExecutionTape } from '../../features/solve/components/ExecutionTape';
import { StageRoadmap } from '../../features/solve/components/StageRoadmap';
import { CrossStrategyCard } from '../../features/solve/components/CrossStrategyCard';
import { SolveBannerAlerts } from '../../features/solve/components/SolveBannerAlerts';
import { Step3SummaryBar } from '../../features/solve/components/Step3SummaryBar';
import { useStep3Solution } from '../../features/solve/hooks/useStep3Solution';

export interface CustomAlgorithmData {
  id?: string;
  name: string;
  category: string;
  subGroup?: string;
  notation: string;
  descriptionVi?: string;
  fingertrickVi?: string;
}

interface Step3SolveInteractiveProps {
  scannedCubeState?: CubeNetState | null;
  activeLevel?: 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4';
  selectedLevel?: 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4';
  onBackToScan: () => void;
  onSwitchLevel?: () => void;
  onUpdateScannedCube?: (newState: CubeNetState) => void;
  demoScramble?: string | null;
  onSetDemoScramble?: (scramble: string | null) => void;
  customAlgorithm?: CustomAlgorithmData | null;
  onClearCustomAlgorithm?: () => void;
  analyzedSolve?: SolveRecord | null;
  onClearAnalyzedSolve?: () => void;
  colorScheme?: ColorScheme;
  cubeSize?: CubeSize;
}

export const Step3SolveInteractive: React.FC<Step3SolveInteractiveProps> = ({
  scannedCubeState,
  activeLevel: initialActiveLevel,
  selectedLevel,
  onBackToScan,
  onUpdateScannedCube,
  demoScramble,
  onSetDemoScramble,
  customAlgorithm,
  onClearCustomAlgorithm,
  analyzedSolve,
  onClearAnalyzedSolve,
  cubeSize = 3,
}) => {
  const [activeLevel, setActiveLevel] = useState(initialActiveLevel || selectedLevel || 'auto-solve');
  const [cameraAngle, setCameraAngle] = useState<'Iso' | 'Bottom' | 'Top' | 'Front'>('Iso');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const [copiedDemoScramble, setCopiedDemoScramble] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [cfopLookMode, setCfopLookMode] = useState<'2-look' | '1-look'>('2-look');

  const {
    solutionData,
    baseCubeState,
    allMoves,
    currentStage,
    currentMove,
    isActuallySolved,
    currentMoveGlobalIdx,
    setCurrentMoveGlobalIdx,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    isAllCompleted,
    setIsAllCompleted,
    activeSubStepIndex,
    setActiveSubStepIndex,
    handleNextMove,
    handlePrevMove,
    handleResetToBeginning,
    handleResetToDemo: baseResetToDemo,
    handleResetToSolved: baseResetToSolved,
    handleSelectStage,
    handleMarkStageComplete,
  } = useStep3Solution({
    scannedCubeState,
    activeLevel,
    demoScramble,
    customAlgorithm,
    cfopLookMode,
    onUpdateScannedCube,
    onSetDemoScramble,
    cubeSize,
  });

  const handleResetToDemo = () => { baseResetToDemo(); setIsResetMenuOpen(false); };
  const handleResetToSolved = () => { baseResetToSolved(); setIsResetMenuOpen(false); };
  const crossAdvisor = useMemo(() => getCrossAdvisor(scannedCubeState || null, activeLevel), [scannedCubeState, activeLevel]);
  const isMissingScannedCube = !scannedCubeState && !demoScramble && !isAlertDismissed && !customAlgorithm && !analyzedSolve;
  const tapeMoves = useMemo(() => currentStage?.moves || allMoves, [currentStage, allMoves]);

  const copyWithToast = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SolveBannerAlerts
        isMissingScannedCube={isMissingScannedCube}
        onBackToScan={onBackToScan}
        onLoadDemo={handleResetToDemo}
        onDismissAlert={() => setIsAlertDismissed(true)}
        demoScramble={demoScramble || null}
        analyzedSolve={analyzedSolve}
        onResetToDemo={handleResetToDemo}
        onCopyDemoScramble={(s) => copyWithToast(s, setCopiedDemoScramble)}
        copiedDemoScramble={copiedDemoScramble}
      />

      <Step3SummaryBar
        customAlgorithm={customAlgorithm}
        analyzedSolve={analyzedSolve}
        activeLevel={activeLevel}
        setActiveLevel={setActiveLevel}
        solutionData={solutionData}
        currentStage={currentStage}
        onClearCustomAlgorithm={onClearCustomAlgorithm}
        onClearAnalyzedSolve={onClearAnalyzedSolve}
        onBackToScan={onBackToScan}
      />

      {/* MAIN ASYMMETRIC SPLIT (55% LEFT / 45% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT BENTO ARENA (55% -> 7 Cols) */}
        <div className="lg:col-span-7 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-hidden bg-white border border-[#EAECEF] rounded-[24px] p-3.5 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-2.5">
          {/* Viewport Top Header */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#EAECEF] gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="px-3 py-1 rounded-full bg-[#111111] text-white font-mono text-xs font-bold tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>
                  {currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0
                    ? `Đã Giải Xong (${solutionData.totalMoves}/${solutionData.totalMoves})`
                    : `Move ${currentMove.num} of ${solutionData.totalMoves}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsResetMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium border cursor-pointer transition-all hover:scale-105 ${
                  demoScramble ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : scannedCubeState ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                }`}
                title="Click để đổi hoặc reset màu khối Rubik"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${demoScramble ? 'bg-amber-500' : scannedCubeState ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                <span>{demoScramble ? 'Khối Mẫu (Demo)' : scannedCubeState ? 'Cube Đã Quét' : 'Cube Mặc Định'}</span>
                <RotateCcw className="w-2.5 h-2.5 text-neutral-400 hover:text-neutral-700" />
              </button>
            </div>

            {/* Camera & Reset Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsResetMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all border cursor-pointer ${
                    isResetMenuOpen ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-white text-neutral-700 border-[#EAECEF] hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 shadow-2xs'
                  }`}
                  title="Đặt lại màu sắc khối Rubik (Mẫu Scramble, Khối Giải Sẵn hoặc Quét lại)"
                >
                  <RotateCcw className="w-3 h-3 text-red-500" />
                  <span>Reset Màu</span>
                  <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${isResetMenuOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {isResetMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsResetMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                      <div className="px-3.5 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                        <span>Khôi Phục Màu Rubik 3D</span>
                        <span className="text-[9px] text-neutral-400 font-normal">WCA</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToDemo}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-amber-50/60 flex items-start gap-2.5 transition-colors group cursor-pointer"
                      >
                        <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-neutral-900 group-hover:text-amber-900">Khối Mẫu Demo (WCA)</div>
                          <div className="text-[11px] text-neutral-500 line-clamp-1">Nạp lại 54 màu chuẩn từ Demo Scramble</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToSolved}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-emerald-50/60 flex items-start gap-2.5 transition-colors group cursor-pointer"
                      >
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5 group-hover:scale-105 transition-transform">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-neutral-900 group-hover:text-emerald-900">Khối Đã Giải (Solved Cube)</div>
                          <div className="text-[11px] text-neutral-500 line-clamp-1">6 mặt 6 màu chuẩn hoàn chỉnh</div>
                        </div>
                      </button>
                      <div className="border-t border-neutral-100 my-1" />
                      <button
                        type="button"
                        onClick={() => { setIsResetMenuOpen(false); onBackToScan(); }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 flex items-start gap-2.5 transition-colors group cursor-pointer"
                      >
                        <span className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 mt-0.5 group-hover:scale-105 transition-transform">
                          <Camera className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-neutral-900">Quét Lại Bằng Camera</div>
                          <div className="text-[11px] text-neutral-500 line-clamp-1">Quay lại Bước 2 quét hoặc chỉnh màu tay</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Camera Angle Controls */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center bg-[#F3F4F6] p-1 rounded-2xl sm:rounded-full border border-[#EAECEF]">
                {[
                  { key: 'Iso', label: 'Phối Cảnh' },
                  { key: 'Bottom', label: 'Mặt Đáy (Cross)' },
                  { key: 'Top', label: 'Mặt Đỉnh (Vàng)' },
                  { key: 'Front', label: 'Mặt Trước (F)' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCameraAngle(item.key as any)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      cameraAngle === item.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title={`Chuyển góc camera sang ${item.label}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REAL THREE.JS INTERACTIVE 3D RUBIK VIEWPORT WITH SWIPE GESTURES */}
          <CubeViewport3D
            currentMove={currentMove.move}
            moveIndex={currentMoveGlobalIdx}
            allMoves={allMoves}
            cameraAngle={cameraAngle}
            turnAngle={currentMove.angle}
            slice={currentMove.slice}
            baseCubeState={baseCubeState}
            activeStageHint={`Bước ${currentStage.stageNumber}: ${currentStage.titleVi}`}
            isSolved={isActuallySolved}
            playbackSpeed={playbackSpeed}
            cubeSize={cubeSize}
            onAnimationComplete={() => {
              if (currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0) {
                setIsPlaying(false);
              }
            }}
            onSwipeLeft={handleNextMove}
            onSwipeRight={handlePrevMove}
            onTap={() => setIsPlaying((prev) => !prev)}
          />

          {/* EXECUTION TAPE & PINNED PLAYBACK CONTROLS */}
          {/* Preserves bounded desktop scroll constraint: max-h-36 sm:max-h-48 overflow-y-auto */}
          <div className="w-full">
            <ExecutionTape
              currentMoveGlobalIdx={currentMoveGlobalIdx}
              allMovesLength={allMoves.length}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              onRewind={handleResetToBeginning}
              onPrevMove={handlePrevMove}
              onNextMove={handleNextMove}
              onTogglePlay={() => {
                if (currentMoveGlobalIdx >= allMoves.length) {
                  setCurrentMoveGlobalIdx(0); setIsAllCompleted(false); setIsPlaying(true); sound.playTick();
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              tapeMoves={tapeMoves}
              currentMove={currentMove}
              isActuallySolved={isActuallySolved}
              activeSubStep={currentStage.subSteps?.[activeSubStepIndex]}
              stageTitle={currentStage.caseDetails?.caseName || currentStage.subtitle}
              onSelectMove={(moveNum) => {
                const targetIdx = allMoves.findIndex((mv) => mv.num === moveNum);
                if (targetIdx !== -1) setCurrentMoveGlobalIdx(targetIdx);
                setIsAllCompleted(false); sound.playTick();
              }}
            />
          </div>
        </div>

        {/* RIGHT BENTO CARD: SOLUTION ROADMAP & CROSS STRATEGY (45% -> 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <StageRoadmap
            solutionData={solutionData}
            currentStage={currentStage}
            currentMoveNum={currentMove.num}
            activeLevel={activeLevel}
            customAlgorithm={customAlgorithm || null}
            cfopLookMode={cfopLookMode}
            setCfopLookMode={(mode) => {
              setCfopLookMode(mode);
              setCurrentMoveGlobalIdx(0);
              setIsPlaying(false);
            }}
            activeSubStepIndex={activeSubStepIndex}
            setActiveSubStepIndex={setActiveSubStepIndex}
            isAllCompleted={isAllCompleted}
            isActuallySolved={isActuallySolved}
            colorScheme={DEFAULT_COLOR_SCHEME}
            copiedFormula={copiedFormula}
            onCopyFormula={(f) => copyWithToast(f, setCopiedFormula)}
            onSelectStage={handleSelectStage}
            onMarkStageComplete={handleMarkStageComplete}
            cubeSize={cubeSize}
            onJumpToSubStep={(subIdx, startMoveNum) => {
              setActiveSubStepIndex(subIdx);
              if (startMoveNum !== undefined) {
                const targetIdx = allMoves.findIndex((mv) => mv.num === startMoveNum);
                if (targetIdx !== -1) { setCurrentMoveGlobalIdx(targetIdx); setIsAllCompleted(false); setIsPlaying(false); }
              }
              sound.playTick();
            }}
          />

          <CrossStrategyCard crossAdvisor={crossAdvisor} activeLevel={activeLevel} />
        </div>
      </div>
    </div>
  );
};
