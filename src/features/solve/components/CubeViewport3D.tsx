import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { ThreeCubeViewer } from '../../../components/solver/ThreeCubeViewer';
import { CubeNetState } from '../../../utils/cubeState';
import { haptic } from '../../../utils/haptics';

interface CubeViewport3DProps {
  currentMove: string;
  moveIndex: number;
  allMoves: Array<{ move: string; [key: string]: any }>;
  cameraAngle: 'Iso' | 'Bottom' | 'Top' | 'Front';
  turnAngle: string;
  slice: string;
  baseCubeState: CubeNetState;
  activeStageHint: string;
  isSolved: boolean;
  playbackSpeed: '0.5x' | '1.0x' | '2.0x';
  onAnimationComplete: () => void;
  heightClassName?: string;
}

export const CubeViewport3D: React.FC<CubeViewport3DProps> = ({
  currentMove,
  moveIndex,
  allMoves,
  cameraAngle,
  turnAngle,
  slice,
  baseCubeState,
  activeStageHint,
  isSolved,
  playbackSpeed,
  onAnimationComplete,
  heightClassName = 'h-[190px] sm:h-[220px] lg:h-[250px]',
}) => {
  const [isOrbitLocked, setIsOrbitLocked] = useState(false);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner flex flex-col justify-center items-center">
      {/* Smart Mobile Touch Isolation Toggle */}
      <button
        type="button"
        onClick={() => {
          setIsOrbitLocked((prev) => !prev);
          haptic.tick();
        }}
        className={`absolute top-2 right-2 z-20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all cursor-pointer ${
          isOrbitLocked
            ? 'bg-amber-500/90 text-white border-amber-400 shadow-sm'
            : 'bg-black/60 hover:bg-black/80 text-white/90 border-white/20'
        }`}
        title={
          isOrbitLocked
            ? 'Góc nhìn 3D đang khóa (Vuốt để cuộn trang bình thường)'
            : 'Đang mở xoay 3D (Bấm để khóa góc nhìn và cuộn trang)'
        }
      >
        {isOrbitLocked ? (
          <>
            <Lock className="w-2.5 h-2.5 text-white" />
            <span>Khóa Xoay (Dễ cuộn)</span>
          </>
        ) : (
          <>
            <Unlock className="w-2.5 h-2.5 text-emerald-400" />
            <span>Xoay 3D</span>
          </>
        )}
      </button>

      <ThreeCubeViewer
        currentMove={currentMove}
        moveIndex={moveIndex}
        allMoves={allMoves}
        cameraPreset={cameraAngle}
        turnAngle={turnAngle}
        slice={slice}
        initialCubeState={baseCubeState}
        activeStageHint={activeStageHint}
        isSolved={isSolved}
        playbackSpeed={playbackSpeed}
        onAnimationComplete={onAnimationComplete}
        heightClassName={heightClassName}
        isOrbitLocked={isOrbitLocked}
      />
    </div>
  );
};
