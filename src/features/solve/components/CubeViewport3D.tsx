import React from 'react';
import { ThreeCubeViewer } from '../../../components/solver/ThreeCubeViewer';
import { CubeNetState } from '../../../utils/cubeState';

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
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner flex flex-col justify-center items-center">
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
      />
    </div>
  );
};
