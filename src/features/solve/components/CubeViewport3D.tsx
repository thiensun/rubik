import React, { useState, useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { ThreeCubeViewer } from '../../../components/solver/ThreeCubeViewer';
import { CubeNetState } from '../../../utils/cubeState';
import { haptic } from '../../../utils/haptics';
import { CubeSize } from '../../../core/types';

interface CubeViewport3DProps {
  cubeSize?: CubeSize;
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
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}

export const CubeViewport3D: React.FC<CubeViewport3DProps> = ({
  cubeSize = 3,
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
  heightClassName = 'h-[350px] sm:h-[400px] lg:h-[500px] w-full',
  onSwipeLeft,
  onSwipeRight,
  onTap,
}) => {
  const [isOrbitLocked, setIsOrbitLocked] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 500) {
      if (deltaX < 0) {
        onSwipeLeft?.();
        haptic.tick();
      } else {
        onSwipeRight?.();
        haptic.tick();
      }
    } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaTime < 300) {
      onTap?.();
      haptic.tick();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full rounded-2xl overflow-hidden bg-white flex flex-col justify-center items-center touch-none"
    >
      <button
        type="button"
        onClick={() => {
          setIsOrbitLocked((prev) => !prev);
          haptic.tick();
        }}
        className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all cursor-pointer ${
          isOrbitLocked
            ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
            : 'bg-white/95 hover:bg-white text-[#111111] border-[#EAECEF] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
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
            <Unlock className="w-2.5 h-2.5 text-[#111111]" />
            <span>Xoay 3D</span>
          </>
        )}
      </button>

      <ThreeCubeViewer
        cubeSize={cubeSize}
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
