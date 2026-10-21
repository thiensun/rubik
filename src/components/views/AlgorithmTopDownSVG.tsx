import React from 'react';
import { AlgorithmCase } from '../../utils/algorithmsData';

interface AlgorithmTopDownSVGProps {
  alg: AlgorithmCase;
  size?: number;
}

export const AlgorithmTopDownSVG: React.FC<AlgorithmTopDownSVGProps> = ({
  alg,
  size = 80,
}) => {
  // Cell positions on the 100x100 canvas
  const cellPositions = [
    { x: 20, y: 20 }, { x: 41, y: 20 }, { x: 62, y: 20 },
    { x: 20, y: 41 }, { x: 41, y: 41 }, { x: 62, y: 41 },
    { x: 20, y: 62 }, { x: 41, y: 62 }, { x: 62, y: 62 },
  ];

  const getColor = (cellType: 'yellow' | 'gray' | 'white' | 'active') => {
    switch (cellType) {
      case 'yellow':
        return '#FFD000';
      case 'white':
        return '#FFFFFF';
      case 'active':
        return '#10B981';
      case 'gray':
      default:
        return '#E5E7EB';
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 bg-[#F8F9FA] rounded-xl border border-[#EAECEF] p-1 flex items-center justify-center relative select-none shadow-2xs"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <marker
            id={`arrowhead-${alg.id}`}
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#111111" />
          </marker>
          <marker
            id={`arrowstart-${alg.id}`}
            markerWidth="6"
            markerHeight="6"
            refX="2"
            refY="3"
            orient="auto"
          >
            <polygon points="6 0, 0 3, 6 6" fill="#111111" />
          </marker>
        </defs>

        {/* 3x3 Dark Substrate / Border */}
        <rect
          x="18"
          y="18"
          width="64"
          height="64"
          rx="4"
          fill="#1E232A"
          stroke="#1E232A"
          strokeWidth="1.5"
        />

        {/* 9 Facelets */}
        {alg.topFace.map((type, idx) => {
          const pos = cellPositions[idx];
          const fill = getColor(type);
          const isWhite = type === 'white';

          return (
            <rect
              key={idx}
              x={pos.x}
              y={pos.y}
              width="18"
              height="18"
              rx="2.5"
              fill={fill}
              stroke={isWhite ? '#D1D5DB' : '#1E232A'}
              strokeWidth="0.8"
            />
          );
        })}

        {/* Outer Yellow Bars (For OLL Side Orientation) */}
        {alg.bars?.top && (
          <>
            {alg.bars.top[0] && <rect x="20" y="9" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.top[1] && <rect x="41" y="9" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.top[2] && <rect x="62" y="9" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
          </>
        )}

        {alg.bars?.bottom && (
          <>
            {alg.bars.bottom[0] && <rect x="20" y="86" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.bottom[1] && <rect x="41" y="86" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.bottom[2] && <rect x="62" y="86" width="18" height="5" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
          </>
        )}

        {alg.bars?.left && (
          <>
            {alg.bars.left[0] && <rect x="9" y="20" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.left[1] && <rect x="9" y="41" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.left[2] && <rect x="9" y="62" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
          </>
        )}

        {alg.bars?.right && (
          <>
            {alg.bars.right[0] && <rect x="86" y="20" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.right[1] && <rect x="86" y="41" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
            {alg.bars.right[2] && <rect x="86" y="62" width="5" height="18" rx="1.5" fill="#FFD000" stroke="#1E232A" strokeWidth="0.8" />}
          </>
        )}

        {/* Permutation Arrows (For PLL / ZBLL) */}
        {alg.arrows?.map((arr, i) => {
          return (
            <line
              key={i}
              x1={arr.from[0]}
              y1={arr.from[1]}
              x2={arr.to[0]}
              y2={arr.to[1]}
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${alg.id})`}
              markerStart={arr.bidirectional ? `url(#arrowstart-${alg.id})` : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
};
