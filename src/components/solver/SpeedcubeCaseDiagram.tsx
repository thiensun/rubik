import React from 'react';

export interface SpeedcubeCaseDiagramProps {
  caseName: string;
  diagramTitle?: string;
  diagramType?: 'cross' | 'f2l' | 'oll' | 'pll';
  patternNote?: string;
  topDownPattern?: ('yellow' | 'neutral' | 'active' | 'white')[];
}

export const SpeedcubeCaseDiagram: React.FC<SpeedcubeCaseDiagramProps> = ({
  caseName,
  diagramTitle,
  diagramType,
  patternNote,
  topDownPattern,
}) => {
  const isTPerm = caseName.toLowerCase().includes('t-perm') || caseName.toLowerCase().includes('t-permutation');
  const isPLL = diagramType === 'pll' || caseName.toLowerCase().includes('pll') || isTPerm;
  const isOLL = diagramType === 'oll' || caseName.toLowerCase().includes('oll') || caseName.toLowerCase().includes('sune');
  const isCross = diagramType === 'cross' || caseName.toLowerCase().includes('cross');
  const isF2L = diagramType === 'f2l' || caseName.toLowerCase().includes('f2l');

  // Title display
  const title = diagramTitle || (isTPerm ? 'PLL · T-PERM' : isPLL ? 'PLL DIAGRAM' : isOLL ? 'OLL (TOP FACE)' : isCross ? 'MẶT ĐÁY (D)' : 'TOP-DOWN FACE');

  // RENDER PLL: T-PERMUTATION AUTHENTIC SPEEDCUBING DIAGRAM
  if (isTPerm || (isPLL && isTPerm)) {
    return (
      <div className="w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none">
        <div className="flex items-center justify-between w-full pb-1 border-b border-neutral-800 text-[9px] font-mono font-bold tracking-wider text-amber-400">
          <span>{title}</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">WCA #T</span>
        </div>

        {/* 3x3 Rubik Face with Headlights + Swap Arrows (Forms Capital 'T') */}
        <div className="relative my-2 w-[76px] h-[76px]">
          {/* Headlights Marker on LEFT side */}
          <div className="absolute -left-2.5 top-[2px] bottom-[2px] w-2 flex flex-col justify-between items-center py-0.5 z-20">
            <span className="w-1.5 h-3 rounded-xs bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" title="Headlight 1 (Orange Corner)" />
            <span className="text-[7px] font-mono text-orange-400 font-extrabold leading-none -rotate-90 my-auto">HEADLIGHTS</span>
            <span className="w-1.5 h-3 rounded-xs bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" title="Headlight 2 (Orange Corner)" />
          </div>

          {/* 3x3 Yellow Facelets */}
          <div className="grid grid-cols-3 gap-[2.5px] w-full h-full p-1 bg-neutral-900 rounded-lg border border-neutral-700">
            {Array(9).fill(null).map((_, i) => (
              <div
                key={i}
                className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs"
              />
            ))}
          </div>

          {/* SVG Swap Arrows Overlay (Authentic T-Permutation swap lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 76 76">
            <defs>
              <marker id="arrow-emerald" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill="#10B981" />
              </marker>
              <marker id="arrow-emerald-rev" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
                <polygon points="0 0, 4 2, 0 4" fill="#10B981" />
              </marker>
              <marker id="arrow-cyan" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill="#06B6D4" />
              </marker>
              <marker id="arrow-cyan-rev" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
                <polygon points="0 0, 4 2, 0 4" fill="#06B6D4" />
              </marker>
            </defs>

            {/* Corner Swap: Top-Right (UBR) <-> Bottom-Right (UFR) */}
            <line
              x1="62" y1="20"
              x2="62" y2="56"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerStart="url(#arrow-emerald-rev)"
              markerEnd="url(#arrow-emerald)"
            />

            {/* Edge Swap: Top (UB) <-> Right (UR) */}
            <path
              d="M 38 18 Q 58 18 58 38"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerStart="url(#arrow-cyan-rev)"
              markerEnd="url(#arrow-cyan)"
            />

            {/* Corner Highlight Dots */}
            <circle cx="62" cy="14" r="3" fill="#10B981" />
            <circle cx="62" cy="62" r="3" fill="#10B981" />

            {/* Edge Highlight Dots */}
            <circle cx="38" cy="14" r="3" fill="#06B6D4" />
            <circle cx="62" cy="38" r="3" fill="#06B6D4" />
          </svg>
        </div>

        {/* Legend / Meaning */}
        <div className="w-full flex flex-col gap-0.5 text-center mt-1">
          <div className="flex items-center justify-center gap-2 text-[8.5px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              2 Góc Phải
            </span>
            <span className="text-neutral-500">•</span>
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              2 Cạnh Kề
            </span>
          </div>
          <span className="text-[8.5px] font-mono text-neutral-400 font-medium leading-tight">
            {patternNote || 'Headlights Bên Trái · Đổi 2 Góc & 2 Cạnh Tạo Chữ T'}
          </span>
        </div>
      </div>
    );
  }

  // RENDER OLL: SUNE (DẠNG CON CÁ) WITH DIRECTIONAL ORIENTATION BARS
  if (isOLL) {
    return (
      <div className="w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none">
        <div className="flex items-center justify-between w-full pb-1 border-b border-neutral-800 text-[9px] font-mono font-bold tracking-wider text-amber-400">
          <span>{title}</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">Sune #27</span>
        </div>

        {/* 3x3 Rubik Face with Sune Fish & Directional Yellow Tabs */}
        <div className="relative my-2 w-[76px] h-[76px]">
          {/* Top side (Back face): Yellow tab on top-left corner pointing Back */}
          <div className="absolute top-[-4px] left-[4px] w-[18px] h-[3px] bg-amber-400 rounded-xs shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Yellow facing Back" />

          {/* Right side: Yellow tab on top-right corner pointing Right */}
          <div className="absolute top-[4px] right-[-4px] w-[3px] h-[18px] bg-amber-400 rounded-xs shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Yellow facing Right" />

          {/* Bottom side (Front face): Yellow tab on bottom-right corner pointing Front */}
          <div className="absolute bottom-[-4px] right-[4px] w-[18px] h-[3px] bg-amber-400 rounded-xs shadow-[0_0_6px_rgba(251,191,36,0.8)]" title="Yellow facing Front" />

          {/* 3x3 Grid: Cross is yellow, bottom-left corner is yellow, others neutral */}
          <div className="grid grid-cols-3 gap-[2.5px] w-full h-full p-1 bg-neutral-900 rounded-lg border border-neutral-700">
            {/* Row 0: Top */}
            <div className="rounded-[2px] bg-neutral-700 border border-neutral-600" />
            <div className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs" />
            <div className="rounded-[2px] bg-neutral-700 border border-neutral-600" />

            {/* Row 1: Middle */}
            <div className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs" />
            <div className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs" />
            <div className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs" />

            {/* Row 2: Bottom */}
            <div className="rounded-[2px] bg-[#FFD000] border-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Góc vàng hướng lên (Đầu cá)" />
            <div className="rounded-[2px] bg-[#FFD000] border border-amber-500/40 shadow-2xs" />
            <div className="rounded-[2px] bg-neutral-700 border border-neutral-600" />
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex flex-col gap-0.5 text-center mt-1">
          <span className="text-[9px] font-mono text-emerald-400 font-bold">
            1 Góc Vàng Hướng Lên (Đầu Cá Ở UBL)
          </span>
          <span className="text-[8.5px] font-mono text-neutral-400 font-medium leading-tight">
            {patternNote || '3 Vạch Vàng Quay Vòng · Dạng Con Cá (Sune)'}
          </span>
        </div>
      </div>
    );
  }

  // RENDER CROSS: WHITE CROSS ON D WITH 4 MATCHING SIDE TABS
  if (isCross) {
    return (
      <div className="w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none">
        <div className="flex items-center justify-between w-full pb-1 border-b border-neutral-800 text-[9px] font-mono font-bold tracking-wider text-emerald-400">
          <span>{title}</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">CROSS</span>
        </div>

        {/* 3x3 Rubik Face with White Cross + 4 Side Center Tabs */}
        <div className="relative my-2 w-[76px] h-[76px]">
          {/* Top: Front Face Center tab (Green) */}
          <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-xs bg-[#009B48] text-[7px] font-mono font-bold text-white shadow-xs" title="Khớp tâm F (Xanh lá)">
            F
          </div>
          {/* Right: Right Face Center tab (Red) */}
          <div className="absolute top-1/2 -translate-y-1/2 right-[-5px] py-1 px-0.5 rounded-xs bg-[#B71234] text-[7px] font-mono font-bold text-white shadow-xs" title="Khớp tâm R (Đỏ)">
            R
          </div>
          {/* Bottom: Back Face Center tab (Blue) */}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-xs bg-[#0046AD] text-[7px] font-mono font-bold text-white shadow-xs" title="Khớp tâm B (Xanh dương)">
            B
          </div>
          {/* Left: Left Face Center tab (Orange) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[-5px] py-1 px-0.5 rounded-xs bg-[#FF5800] text-[7px] font-mono font-bold text-white shadow-xs" title="Khớp tâm L (Cam)">
            L
          </div>

          {/* 3x3 Grid: Center and 4 edges are White Cross, corners are dark */}
          <div className="grid grid-cols-3 gap-[2.5px] w-full h-full p-1 bg-neutral-900 rounded-lg border border-neutral-700">
            {/* Row 0 */}
            <div className="rounded-[2px] bg-neutral-800 border border-neutral-700/50" />
            <div className="rounded-[2px] bg-white border border-neutral-300 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <div className="rounded-[2px] bg-neutral-800 border border-neutral-700/50" />

            {/* Row 1 */}
            <div className="rounded-[2px] bg-white border border-neutral-300 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <div className="rounded-[2px] bg-white border border-neutral-300 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <div className="rounded-[2px] bg-white border border-neutral-300 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />

            {/* Row 2 */}
            <div className="rounded-[2px] bg-neutral-800 border border-neutral-700/50" />
            <div className="rounded-[2px] bg-white border border-neutral-300 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <div className="rounded-[2px] bg-neutral-800 border border-neutral-700/50" />
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex flex-col gap-0.5 text-center mt-1">
          <span className="text-[9px] font-mono text-emerald-400 font-bold">
            Chữ Thập Trắng Ở Mặt Đáy (D)
          </span>
          <span className="text-[8.5px] font-mono text-neutral-400 font-medium leading-tight">
            {patternNote || '4 Cạnh Trắng Khớp 4 Màu Tâm Xung Quanh'}
          </span>
        </div>
      </div>
    );
  }

  // RENDER F2L: 2 TẦNG ĐẦU TIÊN
  if (isF2L) {
    return (
      <div className="w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none">
        <div className="flex items-center justify-between w-full pb-1 border-b border-neutral-800 text-[9px] font-mono font-bold tracking-wider text-emerald-400">
          <span>{title}</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">F2L</span>
        </div>

        <div className="my-2 flex flex-col items-center gap-1">
          <div className="w-16 h-12 rounded-lg bg-neutral-900 border border-neutral-700 p-1 flex flex-col justify-between">
            {/* Layer 3 (Top): Active slots */}
            <div className="grid grid-cols-3 gap-1">
              <div className="h-2 rounded-xs bg-neutral-700" />
              <div className="h-2 rounded-xs bg-neutral-700" />
              <div className="h-2 rounded-xs bg-emerald-400 animate-pulse" title="Viên cạnh F2L" />
            </div>
            {/* Layer 2 (Middle): 3 solved slots + 1 target slot */}
            <div className="grid grid-cols-3 gap-1">
              <div className="h-2 rounded-xs bg-blue-500" />
              <div className="h-2 rounded-xs bg-green-500" />
              <div className="h-2 rounded-xs bg-emerald-400 border border-emerald-300" title="Khe mục tiêu (Target Slot)" />
            </div>
            {/* Layer 1 (Bottom): White layer fully solved */}
            <div className="grid grid-cols-3 gap-1">
              <div className="h-2 rounded-xs bg-white" />
              <div className="h-2 rounded-xs bg-white" />
              <div className="h-2 rounded-xs bg-emerald-400" title="Viên góc F2L" />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-0.5 text-center mt-1">
          <span className="text-[9px] font-mono text-emerald-400 font-bold">
            Ghép 4 Cặp Góc - Cạnh (F2L)
          </span>
          <span className="text-[8.5px] font-mono text-neutral-400 font-medium leading-tight">
            {patternNote || 'Hoàn Thiện 2 Tầng Dưới'}
          </span>
        </div>
      </div>
    );
  }

  // DEFAULT FALLBACK: 3x3 GRID WITH PATTERN
  const pattern = topDownPattern || Array(9).fill('yellow');
  return (
    <div className="w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none">
      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5 text-center">
        {title}
      </span>
      <div className="grid grid-cols-3 gap-1 w-16 h-16 p-1 bg-neutral-900 rounded-lg border border-neutral-700">
        {pattern.map((p, i) => (
          <div
            key={i}
            className={`rounded-xs transition-colors ${
              p === 'yellow'
                ? 'bg-[#FFD000]'
                : p === 'white'
                ? 'bg-white border border-neutral-300 shadow-2xs'
                : p === 'active'
                ? 'bg-[#FFD000] ring-1 ring-black'
                : 'bg-neutral-700'
            }`}
          />
        ))}
      </div>
      <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1 text-center leading-none">
        {patternNote || 'Mặt Vàng Đã Xong'}
      </span>
    </div>
  );
};
