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
    solutionData, baseCubeState, allMoves, currentStage, currentMove, isActuallySolved,
    currentMoveGlobalIdx, setCurrentMoveGlobalIdx, isPlaying, setIsPlaying,
    playbackSpeed, setPlaybackSpeed, isAllCompleted, setIsAllCompleted,
    activeSubStepIndex, setActiveSubStepIndex, handleNextMove, handlePrevMove,
    handleResetToBeginning, handleResetToDemo: baseResetToDemo,
    handleResetToSolved: baseResetToSolved, handleSelectStage, handleMarkStageComplete,
  } = useStep3Solution({
    scannedCubeState, activeLevel, demoScramble, customAlgorithm,
    cfopLookMode, onUpdateScannedCube, onSetDemoScramble, cubeSize,
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
      />

      {/* MAIN ASYMMETRIC SPLIT (55% LEFT / 45% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT BENTO ARENA (55% -> 7 Cols) */}
        <div className="lg:col-span-7 min-w-0 bg-white border border-[#EAECEF] rounded-2xl p-3.5 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-3">
          {/* Viewport Top Header */}
          <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[#EAECEF] gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#111111] text-white font-mono text-xs font-bold tracking-tight tabular-nums flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>
                  {currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0
                    ? `Đã Giải Xong (${solutionData.totalMoves}/${solutionData.totalMoves})`
                    : `Move ${currentMove.num} of ${solutionData.totalMoves}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsResetMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border bg-[#F1F5F9] text-[#111111] border-[#EAECEF] hover:border-[#94A3B8] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98]"
                title="Click để đổi hoặc reset màu khối Rubik"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                <span>{demoScramble ? 'Khối Mẫu (Demo)' : scannedCubeState ? 'Cube Đã Quét' : 'Cube Mặc Định'}</span>
                <RotateCcw className="w-3 h-3 text-[#64748B]" />
              </button>
            </div>

            {/* Camera & Reset Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsResetMenuOpen((prev) => !prev)}
                  className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all duration-200 ease-out active:scale-[0.98] border cursor-pointer ${
                    isResetMenuOpen
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#64748B] border-[#EAECEF] hover:text-[#111111] hover:border-[#94A3B8]'
                  }`}
                  title="Đặt lại màu sắc khối Rubik (Mẫu Scramble, Khối Giải Sẵn hoặc Quét lại)"
                >
                  <RotateCcw className="w-3 h-3 stroke-[1.75]" />
                  <span>Reset Màu</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isResetMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isResetMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsResetMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-[#EAECEF] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                      <div className="px-3.5 py-2 text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider border-b border-[#EAECEF] flex items-center justify-between">
                        <span>Khôi Phục Màu 3D</span>
                        <span className="text-[9px] text-[#94A3B8]">WCA</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToDemo}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-[#111111] hover:bg-[#F8F9FA] flex items-start gap-2.5 transition-all duration-200 ease-out cursor-pointer"
                      >
                        <span className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#111111] mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111111]">Khối Mẫu Demo (WCA)</div>
                          <div className="text-[11px] text-[#64748B] line-clamp-1">Nạp 54 màu từ Demo Scramble</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToSolved}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-[#111111] hover:bg-[#F8F9FA] flex items-start gap-2.5 transition-all duration-200 ease-out cursor-pointer"
                      >
                        <span className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#111111] mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2]" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111111]">Khối Đã Giải (Solved)</div>
                          <div className="text-[11px] text-[#64748B] line-clamp-1">6 mặt chuẩn hoàn chỉnh</div>
                        </div>
                      </button>
                      <div className="border-t border-[#EAECEF] my-1" />
                      <button
                        type="button"
                        onClick={() => { setIsResetMenuOpen(false); onBackToScan(); }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-[#111111] hover:bg-[#F8F9FA] flex items-start gap-2.5 transition-all duration-200 ease-out cursor-pointer"
                      >
                        <span className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#111111] mt-0.5">
                          <Camera className="w-3.5 h-3.5 stroke-[1.75]" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111111]">Quét Lại Bằng Camera</div>
                          <div className="text-[11px] text-[#64748B] line-clamp-1">Quay lại Bước 2 quét hoặc chỉnh tay</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Camera Angle Controls */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#EAECEF]">
                {[
                  { key: 'Iso', label: 'Phối Cảnh' },
                  { key: 'Bottom', label: 'Đáy' },
                  { key: 'Top', label: 'Đỉnh' },
                  { key: 'Front', label: 'Trước' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCameraAngle(item.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-semibold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
                      cameraAngle === item.key ? 'bg-[#111111] text-white' : 'text-[#64748B] hover:text-[#111111]'
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
          <div className="w-full flex flex-col gap-3">
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
