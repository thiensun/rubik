import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { SolveRecord } from '../../types/cubing';
import { getEffectiveTime, formatTime } from '../../utils/cubingStats';

interface SolveVelocityCurveProps {
  solves: SolveRecord[];
}

export const SolveVelocityCurve: React.FC<SolveVelocityCurveProps> = ({ solves }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    id: number;
    timeMs: number;
    x: number;
    y: number;
  } | null>(null);

  // Chronological order: from oldest (#1) to newest (#24)
  const chronological = [...solves].reverse();

  if (chronological.length < 2) {
    return (
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-mono-200/70 shadow-apple flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-mono-700" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-mono-800">
              Solve Velocity Curve
            </h3>
          </div>
        </div>
        <div className="h-28 flex items-center justify-center text-xs text-mono-400 font-mono">
          Complete at least 2 solves to generate velocity curve
        </div>
      </div>
    );
  }

  const times = chronological.map((s) => getEffectiveTime(s)).filter((t) => isFinite(t));
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  // Add margin so graph doesn't clip
  const paddingY = Math.max(800, (maxTime - minTime) * 0.25);
  const yMin = Math.max(0, minTime - paddingY);
  const yMax = maxTime + paddingY;

  const width = 600;
  const height = 100;
  const paddingX = 4;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - 28;

  // Calculate coordinates for Raw Solves
  const points = chronological.map((s, idx) => {
    const t = getEffectiveTime(s);
    const x = paddingX + (idx / (chronological.length - 1)) * graphWidth;
    const normalizedY = (t - yMin) / (yMax - yMin);
    const y = 22 + (1 - Math.max(0, Math.min(1, normalizedY))) * graphHeight;
    return { id: s.id, timeMs: t, x, y, isPB: s.isPB || t === minTime };
  });

  // Calculate coordinates for Ao5 trend (rolling average of 5)
  const ao5Points: { x: number; y: number }[] = [];
  for (let i = 0; i < chronological.length; i++) {
    const startIdx = Math.max(0, i - 4);
    const windowSlice = chronological.slice(startIdx, i + 1).map(getEffectiveTime).filter(isFinite);
    let avg = windowSlice[0] || 9000;
    if (windowSlice.length >= 5) {
      const sorted = [...windowSlice].sort((a, b) => a - b);
      avg = (sorted[1] + sorted[2] + sorted[3]) / 3;
    } else if (windowSlice.length > 0) {
      avg = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
    }
    const x = paddingX + (i / (chronological.length - 1)) * graphWidth;
    const normalizedY = (avg - yMin) / (yMax - yMin);
    const y = 22 + (1 - Math.max(0, Math.min(1, normalizedY))) * graphHeight;
    ao5Points.push({ x, y });
  }

  // Smooth SVG cubic-bezier path helper
  const createSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const rawCurvePath = createSmoothPath(points);
  const ao5CurvePath = createSmoothPath(ao5Points);

  const pbPoint =
    points.find((p) => p.isPB) ||
    points.reduce((best, p) => (p.timeMs < best.timeMs ? p : best), points[0]);
  const currentPoint = points[points.length - 1];
  const startPoint = points[0];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-mono-200/70 shadow-apple flex flex-col gap-3">
      {/* Header and Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-[18px] h-[18px] text-mono-700" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-mono-800">
            Solve Velocity Curve
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-mono-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-mono-950 rounded-full" /> Raw Solves
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-mono-400 rounded-full" /> Ao5 Trend
          </span>
        </div>
      </div>

      {/* Apple Clean Monochrome SVG Path */}
      <div className="relative w-full h-28 pt-2">
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Light grid guidelines */}
          <line stroke="#f4f4f5" strokeWidth="1" x1="0" x2="600" y1="25" y2="25" />
          <line stroke="#f4f4f5" strokeWidth="1" x1="0" x2="600" y1="55" y2="55" />
          <line stroke="#f4f4f5" strokeWidth="1" x1="0" x2="600" y1="85" y2="85" />

          {/* Ao5 trend line (Muted grey dashed) */}
          {ao5CurvePath && (
            <path
              d={ao5CurvePath}
              fill="none"
              stroke="#a1a1aa"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Raw solves stroke (Clean dark monochrome) */}
          <path
            d={rawCurvePath}
            fill="none"
            stroke="#18181b"
            strokeLinecap="round"
            strokeWidth="2"
          />

          {/* Key highlight points: PB */}
          {pbPoint && (
            <g>
              <circle
                cx={pbPoint.x}
                cy={pbPoint.y}
                fill="#18181b"
                r="3.5"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                fill="#18181b"
                fontFamily="JetBrains Mono"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                x={pbPoint.x}
                y={pbPoint.y - 9}
              >
                PB {(pbPoint.timeMs / 1000).toFixed(2)}s
              </text>
            </g>
          )}

          {/* Latest solve point */}
          {currentPoint && (
            <g>
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                fill="#18181b"
                r="3.5"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                fill="#52525b"
                fontFamily="JetBrains Mono"
                fontSize="9"
                fontWeight="500"
                textAnchor="end"
                x={currentPoint.x - 6}
                y={currentPoint.y - 6}
              >
                {(currentPoint.timeMs / 1000).toFixed(2)}s
              </text>
            </g>
          )}

          {/* Hover targets */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="8"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2 py-1 rounded bg-mono-900 text-white text-[10px] font-mono shadow-md whitespace-nowrap"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 6}%`,
            }}
          >
            #{hoveredPoint.id}: {formatTime(hoveredPoint.timeMs)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-mono-400 pt-2 border-t border-mono-100">
        <span>
          Start (#{startPoint.id} · {formatTime(startPoint.timeMs)}s)
        </span>
        <span>Sub-8.50 Target</span>
        <span>
          Current (#{currentPoint.id} · {formatTime(currentPoint.timeMs)}s)
        </span>
      </div>
    </div>
  );
};
