import React from 'react';
import { Clock, Zap, RotateCcw, Eye } from 'lucide-react';
import { AlgorithmEntry } from '../../../data/algorithms';
import { CubeNetState } from '../../../utils/cubeState';
import { ThreeCubeViewer } from '../../../components/solver/ThreeCubeViewer';
import { parseFormulaTriggers } from '../../../engine/triggerParser';
import { sound } from '../../../utils/audio';

export type DrillPoolType = 'current' | 'learning' | 'mastered';

interface DrillModeModalProps {
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
}

export const DrillModeModal: React.FC<DrillModeModalProps> = ({
  drillPoolType,
  setDrillPoolType,
  drillCubeState,
  drillRevealed,
  setDrillRevealed,
  drillCase,
  drillTimerState,
  setDrillTimerState,
  drillElapsedMs,
  setDrillElapsedMs,
  drillStartRef,
  pickNextDrillCase,
  optimalPreAufMove,
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
                title={`${seg.trigger.tag}: ${seg.trigger.pattern}`}
                className="px-2 py-0.5 rounded-lg border font-extrabold cursor-help inline-flex items-center gap-1 shadow-2xs"
              >
                <span>{seg.rawText}</span>
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

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
      {/* Row 2: Drill Pool Selector */}
      <div className="grid grid-cols-3 gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#EAECEF] shrink-0">
        {[
          { id: 'learning' as const, label: 'Đang Tập ●' },
          { id: 'mastered' as const, label: 'Đã Thuộc ✓' },
          { id: 'current' as const, label: 'Nhóm Hiện Tại' },
        ].map((pool) => (
          <button
            key={pool.id}
            type="button"
            onClick={() => {
              setDrillPoolType(pool.id);
              setTimeout(pickNextDrillCase, 0);
            }}
            className={`py-1 px-1.5 rounded-lg font-mono text-[10.5px] font-bold transition-all cursor-pointer ${
              drillPoolType === pool.id
                ? 'bg-[#111111] text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {pool.label}
          </button>
        ))}
      </div>

      {/* Row 3: 3D Cube Constrained Height */}
      <ThreeCubeViewer
        currentMove="U"
        moveIndex={0}
        allMoves={[]}
        cameraPreset="Iso"
        initialCubeState={drillCubeState}
        activeStageHint={
          drillRevealed && drillCase
            ? `✅ ${drillCase.name}`
            : '❓ Giữ [Space] để bấm giờ!'
        }
        isSolved={false}
        heightClassName="h-[200px] xl:h-[220px]"
        compact={true}
      />

      {/* Row 4: Pinned Next Case & Spacebar Timer Controls */}
      <div className="flex items-center gap-1.5 shrink-0 py-1">
        <div
          onClick={() => {
            if (drillTimerState === 'running') {
              const finalMs = Math.max(
                10,
                Math.round(performance.now() - drillStartRef.current),
              );
              setDrillElapsedMs(finalMs);
              setDrillTimerState('stopped');
              setDrillRevealed(true);
              sound.playPBChord();
            } else {
              drillStartRef.current = performance.now();
              setDrillTimerState('running');
            }
          }}
          className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
            drillTimerState === 'holding'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
              : drillTimerState === 'running'
              ? 'bg-[#111111] border-[#111111] text-white'
              : 'bg-[#F8F9FA] border-[#EAECEF] text-neutral-900 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {drillTimerState === 'holding'
                ? 'Thả Space...'
                : drillTimerState === 'running'
                ? 'Nhấn Space dừng!'
                : 'Giữ [Space]'}
            </span>
          </div>
          <span className="text-lg font-mono font-extrabold">
            {(drillElapsedMs / 1000).toFixed(2)}s
          </span>
        </div>

        <button
          type="button"
          onClick={pickNextDrillCase}
          className="py-2 px-3 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
          title="Ca Tiếp Theo [Alt+N]"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Tiếp [Alt+N]</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setDrillRevealed(false);
            setDrillElapsedMs(0);
            setDrillTimerState('idle');
            sound.playTick();
          }}
          className="p-2 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] text-neutral-700 shrink-0 cursor-pointer"
          title="Thử lại ca này"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 5 & 6: Answer Reveal / Hidden Card */}
      {drillCase && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 rounded-xl bg-neutral-50 border border-[#EAECEF] space-y-2 text-xs">
          {!drillRevealed ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-[11px] font-mono text-neutral-500">
                Tên trường hợp &amp; công thức đang ẩn để luyện phản xạ nhận diện.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDrillRevealed(true);
                  sound.playTick();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EAECEF] hover:border-neutral-400 text-xs font-mono font-bold text-neutral-900 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hiện Đáp Án</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[9.5px] font-extrabold">
                  ĐÁP ÁN CHÍNH XÁC
                </span>
                <span className="font-mono text-[10px] font-bold text-neutral-500">
                  Pre-AUF: <strong className="text-neutral-900">{optimalPreAufMove}</strong>
                </span>
              </div>
              <div className="text-xs font-extrabold text-neutral-900">
                {drillCase.name}
              </div>
              {renderFormulaWithTriggerBadges(drillCase.mainAlg)}
              <p className="text-[11px] text-neutral-600 leading-snug">
                {drillCase.recognitionVN}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
