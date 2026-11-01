import React from 'react';

export interface F2LSlotMetadata {
  index: number;
  slotCode: 'FR' | 'FL' | 'BR' | 'BL';
  label: string;
  colors: [string, string];
  facesVisible: [string, string, string];
}

export const F2L_SLOTS_META: F2LSlotMetadata[] = [
  {
    index: 0,
    slotCode: 'FR',
    label: 'PAIR 1 · FR (XANH LÁ - ĐỎ)',
    colors: ['#10B981', '#EF4444'],
    facesVisible: ['U', 'F', 'R'],
  },
  {
    index: 1,
    slotCode: 'FL',
    label: 'PAIR 2 · FL (XANH LÁ - CAM)',
    colors: ['#10B981', '#F97316'],
    facesVisible: ['U', 'L', 'F'],
  },
  {
    index: 2,
    slotCode: 'BR',
    label: 'PAIR 3 · BR (XANH DƯƠNG - ĐỎ)',
    colors: ['#3B82F6', '#EF4444'],
    facesVisible: ['U', 'R', 'B'],
  },
  {
    index: 3,
    slotCode: 'BL',
    label: 'PAIR 4 · BL (XANH DƯƠNG - CAM)',
    colors: ['#3B82F6', '#F97316'],
    facesVisible: ['U', 'B', 'L'],
  },
];

interface F2LSlotVisualizerProps {
  activeSubStepIndex?: number;
  patternNote?: string;
  className?: string;
}

export const F2LSlotVisualizer: React.FC<F2LSlotVisualizerProps> = ({
  activeSubStepIndex = 0,
  patternNote,
  className = '',
}) => {
  const safeIdx = Math.max(0, Math.min(3, activeSubStepIndex));
  const currentSlot = F2L_SLOTS_META[safeIdx] || F2L_SLOTS_META[0];
  const mapGridSlots = [
    F2L_SLOTS_META[3], // BL
    F2L_SLOTS_META[2], // BR
    F2L_SLOTS_META[1], // FL
    F2L_SLOTS_META[0], // FR
  ];

  return (
    <div
      className={`w-full bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-2.5 flex flex-col items-center justify-between text-white shadow-md select-none ${className}`}
    >
      <div className="flex items-center justify-between w-full pb-1 border-b border-neutral-800 text-[9px] font-mono font-bold tracking-wider text-emerald-400">
        <span>F2L 4 SLOTS STATUS</span>
        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
          SLOT {safeIdx + 1}/4
        </span>
      </div>

      <div className="w-full flex items-center justify-around py-1.5 gap-2">
        {/* Left: Isometric Slot-Oriented 3D Cube */}
        <svg
          viewBox="0 0 100 100"
          className="w-20 h-20 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] shrink-0"
        >
          {/* Top Yellow Layer */}
          <polygon
            points="50,8 90,28 50,48 10,28"
            fill="#FACC15"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          <text
            x="50"
            y="31"
            textAnchor="middle"
            fill="#78350F"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            U (Vàng)
          </text>

          {/* Left-Side Visible Face */}
          <polygon
            points="10,28 50,48 50,92 10,72"
            fill="#0F172A"
            stroke="#475569"
            strokeWidth="2"
          />
          <text
            x="23"
            y="53"
            textAnchor="middle"
            fill={currentSlot.colors[0]}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {currentSlot.facesVisible[1]}
          </text>

          {/* Right-Side Visible Face */}
          <polygon
            points="50,48 90,28 90,72 50,92"
            fill="#0F172A"
            stroke="#475569"
            strokeWidth="2"
          />
          <text
            x="77"
            y="53"
            textAnchor="middle"
            fill={currentSlot.colors[1]}
            fontSize="11"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {currentSlot.facesVisible[2]}
          </text>

          {/* White Cross Base Strip on Bottom Layer */}
          <polygon points="10,60 50,80 50,92 10,72" fill="#334155" />
          <polygon points="50,80 90,60 90,72 50,92" fill="#334155" />

          {/* Active F2L Slot Highlight Pillar */}
          <polygon
            points="36,41 50,48 50,64 36,57"
            fill={currentSlot.colors[0]}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <polygon
            points="50,48 64,41 64,57 50,64"
            fill={currentSlot.colors[1]}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <polygon
            points="36,57 50,64 50,80 36,73"
            fill={currentSlot.colors[0]}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <polygon
            points="50,64 64,57 64,73 50,80"
            fill={currentSlot.colors[1]}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <polygon
            points="36,73 50,80 64,73 50,92"
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth="1.8"
          />
        </svg>

        {/* Right: 4-Slot Top-Down Mini Map */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[7.5px] font-mono text-neutral-400 uppercase tracking-wider">
            4 KHE F2L ({safeIdx}/4)
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-lg bg-neutral-900 border border-neutral-700/80">
            {mapGridSlots.map((slotItem) => {
              const isSlotActive = slotItem.index === safeIdx;
              const isSlotSolved = slotItem.index < safeIdx;

              return (
                <div
                  key={slotItem.slotCode}
                  style={
                    isSlotActive
                      ? {
                          background: `linear-gradient(135deg, ${slotItem.colors[0]}, ${slotItem.colors[1]})`,
                        }
                      : undefined
                  }
                  className={`w-9 h-6 rounded flex items-center justify-center font-mono text-[8.5px] font-extrabold transition-all relative ${
                    isSlotActive
                      ? 'text-white ring-2 ring-white shadow-[0_0_8px_rgba(16,185,129,0.75)] scale-105 z-10'
                      : isSlotSolved
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                      : 'bg-[#334155] text-slate-300 border border-slate-600/60 opacity-75'
                  }`}
                  title={`KHE ĐANG GIẢI: ${slotItem.label}`}
                >
                  <span>{slotItem.slotCode}</span>
                  {isSlotSolved && (
                    <span className="ml-0.5 text-emerald-400 font-bold">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Caption Matching the Selected F2L Pair */}
      <div className="w-full flex flex-col gap-0.5 text-center mt-0.5 pt-1 border-t border-neutral-800/80">
        <span className="text-[8.5px] font-mono text-emerald-400 font-extrabold tracking-tight leading-tight">
          KHE ĐANG GIẢI: {currentSlot.label}
        </span>
        <span className="text-[8px] font-mono text-neutral-400 font-medium leading-tight">
          {patternNote || 'Đáy Trắng (White) · Ghép Góc & Cạnh Vào Khe'}
        </span>
      </div>
    </div>
  );
};
