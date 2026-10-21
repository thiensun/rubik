import React from 'react';
import { CubeNetState, CUBE_HEX_COLORS, CubeColor, FaceKey } from '../../utils/cubeState';

interface CubeNet2DProps {
  state: CubeNetState;
}

const SVG_COLOR_MAP: Record<CubeColor, string> = {
  white: '#ffffff',
  yellow: '#eab308',
  green: '#10b981',
  blue: '#2563eb',
  orange: '#f97316',
  red: '#ef4444',
};

export const CubeNet2D: React.FC<CubeNet2DProps> = ({ state }) => {
  const renderSvgFace = (faceKey: FaceKey, colors: CubeColor[], translateX: number, translateY: number) => (
    <g id={`face-${faceKey}`} transform={`translate(${translateX}, ${translateY})`}>
      {colors.map((color, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const fill = SVG_COLOR_MAP[color] || CUBE_HEX_COLORS[color];
        const isWhite = color === 'white';
        const isCenter = idx === 4;
        return (
          <rect
            key={idx}
            x={col * 10}
            y={row * 10}
            width="9"
            height="9"
            rx="1.5"
            fill={fill}
            stroke={isWhite ? (isCenter ? '#a1a1aa' : '#d4d4d8') : undefined}
            strokeWidth={isWhite ? (isCenter ? '0.8' : '0.6') : undefined}
          />
        );
      })}
    </g>
  );

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
        U F R B L D
      </div>
    </div>
  );
};
