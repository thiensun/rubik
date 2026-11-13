import React, { useState, useEffect } from 'react';
import { ExternalLink, Target, X } from 'lucide-react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { CubeNetState } from '../../../utils/cubeState';
import { ThreeCubeViewer } from '../../../components/solver/ThreeCubeViewer';
import { CustomAlgorithmData } from '../../../components/solver/Step3SolveInteractive';
import { CubeSize } from '../../../types/cubing';
import { sound } from '../../../utils/audio';
import { DrillPoolType } from './DrillModeModal';
import { AlgTrainerPlayback } from './AlgTrainerPlayback';
import { MobileBottomSheet } from './MobileBottomSheet';

interface AlgTrainerStudioProps {
  isDrillMode: boolean;
  setIsDrillMode: (drill: boolean) => void;
  isMobileSheetOpen: boolean;
  setIsMobileSheetOpen: (open: boolean) => void;
  selectedTrainerAlg: AlgorithmEntry;
  trainerMoveIdx: number;
  setTrainerMoveIdx: React.Dispatch<React.SetStateAction<number>>;
  trainerMoves: Array<{ move: string }>;
  trainerInitialCubeState: CubeNetState;
  trainerSpeed: '0.5x' | '1.0x' | '2.0x';
  setTrainerSpeed: (speed: '0.5x' | '1.0x' | '2.0x') => void;
  isTrainerPlaying: boolean;
  setIsTrainerPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onLoadInto3D: (algData: CustomAlgorithmData & { prob?: string; holdingNoteVi?: string }) => void;
  // Drill Mode Props
  drillPoolType: DrillPoolType;
  setDrillPoolType: (pool: DrillPoolType) => void;
  drillCubeState: CubeNetState;
  drillRevealed: boolean;
  setDrillRevealed: (revealed: boolean) => void;
  drillCase: AlgorithmEntry | null;
  drillTimerState: 'idle' | 'holding' | 'running' | 'stopped';
  setDrillTimerState: (state: 'idle' | 'holding' | 'running' | 'stopped') => void;
  drillElapsedMs: number;
  setDrillElapsedMs: (ms: number) => void;
  drillStartRef: React.MutableRefObject<number>;
  pickNextDrillCase: () => void;
  optimalPreAufMove: string;
  cubeSize?: CubeSize;
}

export const AlgTrainerStudio: React.FC<AlgTrainerStudioProps> = ({
  isDrillMode,
  setIsDrillMode,
  isMobileSheetOpen,
  setIsMobileSheetOpen,
  selectedTrainerAlg,
  trainerMoveIdx,
  setTrainerMoveIdx,
  trainerMoves,
  trainerInitialCubeState,
  trainerSpeed,
  setTrainerSpeed,
  isTrainerPlaying,
  setIsTrainerPlaying,
  onLoadInto3D,
  drillRevealed,
  setDrillRevealed,
  pickNextDrillCase,
  cubeSize = 3,
}) => {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Sync Spacebar keyboard reveal from useAlgTrainer
  useEffect(() => {
    setIsAnswerRevealed(drillRevealed);
  }, [drillRevealed]);

  // Always reset reveal state when case changes or Drill Mode toggles
  useEffect(() => {
    setIsAnswerRevealed(false);
    setDrillRevealed(false);
  }, [selectedTrainerAlg.id, isDrillMode, setDrillRevealed]);

  const isBlindHidden = isDrillMode && !isAnswerRevealed;

  const handleToggleDrillMode = () => {
    const next = !isDrillMode;
    setIsDrillMode(next);
    setIsTrainerPlaying(false);
    setTrainerMoveIdx(0);
    setIsAnswerRevealed(false);
    setDrillRevealed(false);
    if (next) {
      pickNextDrillCase();
    } else {
      sound.playTick();
    }
  };

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    setDrillRevealed(true);
    sound.playTick();
  };

  const handleNextRandomCase = () => {
    setIsAnswerRevealed(false);
    setDrillRevealed(false);
    pickNextDrillCase();
  };

  const renderStudioBody = () => (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
      {/* Case Banner */}
      <div
        onClick={isBlindHidden ? handleRevealAnswer : undefined}
        className={`flex items-center justify-between gap-2 bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#EAECEF] shrink-0 ${
          isBlindHidden ? 'cursor-pointer hover:border-neutral-400 transition-colors' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="px-1.5 py-0.5 rounded bg-[#111111] text-white font-mono text-[9.5px] font-bold shrink-0">
            {selectedTrainerAlg.category}
          </span>

          {isBlindHidden ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-xs font-semibold text-neutral-600 truncate">
                [ Ẩn thông tin Case - Tap to reveal ]
              </span>
              <span className="text-xs font-bold text-neutral-900 blur-md select-none opacity-50 truncate hidden sm:inline">
                {selectedTrainerAlg.name}
              </span>
            </div>
          ) : (
            <span className="truncate text-sm font-bold text-neutral-900 py-0.5">
              {selectedTrainerAlg.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isBlindHidden && (
            <>
              <span className="text-[10px] font-mono text-neutral-400 font-semibold hidden sm:inline">
                {selectedTrainerAlg.probability}
              </span>
              <button
                type="button"
                onClick={() =>
                  onLoadInto3D({
                    id: selectedTrainerAlg.id,
                    name: selectedTrainerAlg.name,
                    notation: selectedTrainerAlg.mainAlg,
                    category: selectedTrainerAlg.category,
                    prob: selectedTrainerAlg.probability,
                    descriptionVi: selectedTrainerAlg.recognitionVN,
                    holdingNoteVi: selectedTrainerAlg.fingertrickVN,
                  })
                }
                className="p-1.5 rounded-lg bg-white border border-[#EAECEF] text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 transition-all cursor-pointer"
                title="Mở toàn màn hình trong Step 3 Interactive Solver"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3D Cube Viewport - Always renders exact scrambled state for recognition */}
      <ThreeCubeViewer
        currentMove={
          trainerMoves[Math.min(trainerMoveIdx, Math.max(0, trainerMoves.length - 1))]
            ?.move || 'U'
        }
        moveIndex={trainerMoveIdx}
        allMoves={trainerMoves}
        cameraPreset="Iso"
        initialCubeState={trainerInitialCubeState}
        activeStageHint={
          isBlindHidden
            ? `${selectedTrainerAlg.category} · Blind Drill`
            : `${selectedTrainerAlg.category} · ${trainerMoveIdx}/${trainerMoves.length}`
        }
        isSolved={trainerMoveIdx >= trainerMoves.length && trainerMoves.length > 0}
        playbackSpeed={trainerSpeed}
        heightClassName="h-[200px] xl:h-[220px]"
        compact={true}
        cubeSize={cubeSize}
      />

      {/* Playback Controls & Formula Scrubber */}
      <AlgTrainerPlayback
        trainerMoveIdx={trainerMoveIdx}
        setTrainerMoveIdx={setTrainerMoveIdx}
        trainerMoves={trainerMoves}
        trainerSpeed={trainerSpeed}
        setTrainerSpeed={setTrainerSpeed}
        isTrainerPlaying={isTrainerPlaying}
        setIsTrainerPlaying={setIsTrainerPlaying}
        isDrillMode={isDrillMode}
        isAnswerRevealed={isAnswerRevealed}
        onRevealAnswer={handleRevealAnswer}
        onNextRandomCase={handleNextRandomCase}
      />

      {/* Recognition & Fingertrick HUD */}
      <div className="flex-1 min-h-0 overflow-y-auto text-xs p-2.5 rounded-xl bg-neutral-50 border border-[#EAECEF] space-y-1">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Fingertrick
        </div>
        <div
          className={`space-y-1 transition-all duration-200 ${
            isBlindHidden ? 'blur-md select-none pointer-events-none opacity-50' : ''
          }`}
        >
          <p className="text-neutral-700 leading-snug">
            <strong className="text-neutral-900">Nhận diện:</strong>{' '}
            {selectedTrainerAlg.recognitionVN}
          </p>
          <p className="text-neutral-700 leading-snug">
            <strong className="text-neutral-900">Fingertrick:</strong>{' '}
            {selectedTrainerAlg.fingertrickVN}
          </p>
        </div>
      </div>
    </div>
  );

  const renderDrillToggleBtn = () => (
    <button
      type="button"
      onClick={handleToggleDrillMode}
      className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
        isDrillMode
          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
          : 'bg-neutral-100 text-neutral-800 border-[#EAECEF] hover:bg-neutral-200'
      }`}
    >
      <Target className="w-3.5 h-3.5" />
      <span>🎯 Drill Mode</span>
    </button>
  );

  return (
    <>
      {/* MOBILE FLOATING MINI-BAR (< 1024px) */}
      {!isMobileSheetOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#EAECEF] rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase truncate">
                3D ALG TRAINER · {selectedTrainerAlg.category}
              </span>
            </div>
            <span className="text-xs font-bold text-[#111111] truncate block max-w-[200px] sm:max-w-[260px]">
              {isBlindHidden ? '[ Blind Drill Mode ]' : selectedTrainerAlg.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setIsMobileSheetOpen(true);
            }}
            className="bg-[#111111] hover:bg-neutral-800 text-white text-xs font-medium px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>▶ Mở Khối 3D</span>
          </button>
        </div>
      )}

      {/* MOBILE MULTI-SNAP GESTURE BOTTOM SHEET (< 1024px) */}
      <MobileBottomSheet
        isOpen={isMobileSheetOpen}
        onClose={() => {
          setIsTrainerPlaying(false);
          setIsMobileSheetOpen(false);
        }}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#EAECEF] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-extrabold text-neutral-900 truncate">
              {isDrillMode ? 'Blind Drill Mode' : '3D Alg Trainer'}
            </h3>
            {renderDrillToggleBtn()}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsTrainerPlaying(false);
              setIsMobileSheetOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Đóng Khối 3D"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {renderStudioBody()}
      </MobileBottomSheet>

      {/* DESKTOP STICKY BENTO CARD (>= 1024px) */}
      <div className="hidden lg:flex lg:col-span-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:max-h-[760px] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[#EAECEF] lg:shadow-sm lg:p-4 lg:flex-col lg:justify-between lg:gap-2 bg-white">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EAECEF] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-extrabold text-neutral-900 truncate">
              {isDrillMode ? 'Blind Drill Mode' : '3D Alg Trainer'}
            </h3>
            {renderDrillToggleBtn()}
          </div>
        </div>

        {renderStudioBody()}
      </div>
    </>
  );
};
