import React from 'react';
import { CubeNetState, CUBE_HEX_COLORS, CubeColor, FaceKey } from '../../utils/cubeState';
import { CubeSize } from '../../core/types';

interface CubeNet2DProps {
  state: CubeNetState;
  cubeSize?: CubeSize;
}

const SVG_COLOR_MAP: Record<CubeColor, string> = {
  white: '#ffffff',
  yellow: '#eab308',
  green: '#10b981',
  blue: '#2563eb',
  orange: '#f97316',
  red: '#ef4444',
};

export const CubeNet2D: React.FC<CubeNet2DProps> = ({ state, cubeSize }) => {
  const inferredSize = Math.round(Math.sqrt(state?.U?.length || 9));
  const n: CubeSize =
    cubeSize || (inferredSize === 2 || inferredSize === 4 ? (inferredSize as CubeSize) : 3);
  const step = 30 / n;
  const cellSize = step - 1;

  const renderSvgFace = (
    faceKey: FaceKey,
    colors: CubeColor[],
    translateX: number,
    translateY: number,
  ) => {
    const srcDim = Math.round(Math.sqrt(colors.length)) || 3;
    const cells: React.ReactNode[] = [];

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const srcRow = srcDim === n ? row : Math.min(srcDim - 1, Math.floor((row * srcDim) / n));
        const srcCol = srcDim === n ? col : Math.min(srcDim - 1, Math.floor((col * srcDim) / n));
        const color = colors[srcRow * srcDim + srcCol] || 'white';
        const fill = SVG_COLOR_MAP[color] || CUBE_HEX_COLORS[color];
        const isWhite = color === 'white';
        const isCenter = n === 3 && row === 1 && col === 1;

        cells.push(
          <rect
            key={`${row}-${col}`}
            x={col * step}
            y={row * step}
            width={cellSize}
            height={cellSize}
            rx={n === 4 ? '1' : '1.5'}
            fill={fill}
            stroke={isWhite ? (isCenter ? '#a1a1aa' : '#d4d4d8') : undefined}
            strokeWidth={isWhite ? (isCenter ? '0.8' : '0.6') : undefined}
          />,
        );
      }
    }

    return (
      <g id={`face-${faceKey}`} transform={`translate(${translateX}, ${translateY})`}>
        {cells}
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        className="w-36 h-28"
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderSvgFace('U', state.U, 30, 0)}
        {renderSvgFace('L', state.L, 0, 30)}
        {renderSvgFace('F', state.F, 30, 30)}
        {renderSvgFace('R', state.R, 60, 30)}
        {renderSvgFace('B', state.B, 90, 30)}
        {renderSvgFace('D', state.D, 30, 60)}
      </svg>
      <div className="text-center font-mono text-[9px] text-mono-400 mt-1 uppercase tracking-widest">
        {n}x{n}x{n} · U F R B L D
      </div>
    </div>
  );
};
