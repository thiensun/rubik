import React, { useState } from 'react';
import { Check, Layers } from 'lucide-react';

export type BarStateType = 'no-bar' | 'adj-bar' | 'solved';

interface OrtegaPBLVisualizerProps {
  stageNumber?: number;
  caseName?: string;
  formula?: string;
}

const BAR_STATES: Array<{
  id: BarStateType;
  labelVi: string;
  shortVi: string;
  badgeColor: string;
  descVi: string;
}> = [
  {
    id: 'no-bar',
    labelVi: 'No Bar (Chéo)',
    shortVi: 'Chéo Góc',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    descVi: 'Không có cặp góc kề cùng màu -> Cần đổi 2 góc chéo (Y-Perm / R2 F2 R2)',
  },
  {
    id: 'adj-bar',
    labelVi: '1 Adjacent Bar (1 Cặp Kề)',
    shortVi: '1 Thanh Bar',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descVi: 'Có 1 thanh Bar 1x2 đồng màu -> Đặt thanh Bar ở mặt Trước F hoặc Trái L',
  },
  {
    id: 'solved',
    labelVi: 'Solved (Đã Giải)',
    shortVi: 'Đã Giải Đủ',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    descVi: 'Toàn bộ 4 góc của tầng đã đúng hoán vị 100%',
  },
];

export const OrtegaPBLVisualizer: React.FC<OrtegaPBLVisualizerProps> = ({
  stageNumber = 2,
  caseName = '',
}) => {
  const lowerCase = caseName.toLowerCase();
  const defaultTop: BarStateType = lowerCase.includes('diag')
    ? 'no-bar'
    : stageNumber >= 3
    ? 'adj-bar'
    : 'no-bar';
  const defaultBottom: BarStateType = lowerCase.includes('diag / diag')
    ? 'no-bar'
    : lowerCase.includes('top')
    ? 'solved'
    : 'adj-bar';

  const [uLayerBar, setULayerBar] = useState<BarStateType>(defaultTop);
  const [dLayerBar, setDLayerBar] = useState<BarStateType>(defaultBottom);

  const activeSubStep: 'face1' | 'oll' | 'pbl' =
    stageNumber === 1 ? 'face1' : stageNumber === 2 ? 'oll' : 'pbl';

  const renderLayerCard = (
    layerTitle: string,
    faceColorHex: string,
    barState: BarStateType,
    onSelectBarState: (next: BarStateType) => void,
  ) => {
    const activeMeta = BAR_STATES.find((b) => b.id === barState) || BAR_STATES[1];
    // Side sticker colors around 2x2 layer [FrontLeft, FrontRight]
    const frontStickers =
      barState === 'solved'
        ? ['#009B48', '#009B48']
        : barState === 'adj-bar'
        ? ['#009B48', '#009B48']
        : ['#009B48', '#0046AD'];

    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300">
            {layerTitle}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold ${activeMeta.badgeColor}`}
          >
            {activeMeta.shortVi}
          </span>
        </div>

        {/* Mini 2x2 Layer + Front Bar Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 p-1.5 flex flex-col justify-between shrink-0">
            <div className="grid grid-cols-2 gap-1 flex-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="rounded-[3px] border border-black/30"
                  style={{ backgroundColor: faceColorHex }}
                />
              ))}
            </div>
            {/* Front side bar indicator strip */}
            <div className="grid grid-cols-2 gap-1 h-1.5 mt-1">
              {frontStickers.map((hex, i) => (
                <div
                  key={i}
                  className={`rounded-full ${
                    barState === 'adj-bar' || barState === 'solved'
                      ? 'ring-1 ring-amber-400'
                      : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* 3-State Selector Pills */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {BAR_STATES.map((st) => {
              const isSelected = st.id === barState;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectBarState(st.id)}
                  className={`text-left px-2 py-0.5 rounded-md font-mono text-[9.5px] font-bold transition-all flex items-center justify-between gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'bg-neutral-800/70 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="truncate">{st.labelVi}</span>
                  {isSelected && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1A1C1E] rounded-xl border border-neutral-700/60 p-3 text-white flex flex-col gap-2.5 w-full">
      {/* Header & Sub-step Pipeline (Face 1 -> OLL -> PBL) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-200">
            2x2 DUAL-LAYER BAR MAP (ORTEGA / CLL)
          </span>
        </div>

        {/* Sub-step progression pills */}
        <div className="flex items-center gap-1 font-mono text-[9.5px]">
          {(
            [
              { id: 'face1', label: '1. Face 1' },
              { id: 'oll', label: '2. OLL' },
              { id: 'pbl', label: '3. PBL' },
            ] as const
          ).map((step, idx) => {
            const isActive = activeSubStep === step.id;
            const isPassed =
              (activeSubStep === 'oll' && idx === 0) ||
              (activeSubStep === 'pbl' && idx < 2);
            return (
              <span
                key={step.id}
                className={`px-2 py-0.5 rounded-md font-bold border transition-all ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-2xs'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {step.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Dual-Layer Bar Comparison (Tầng Trên U vs Tầng Dưới D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderLayerCard('Tầng Trên U (Vàng)', '#FFD500', uLayerBar, setULayerBar)}
        {renderLayerCard('Tầng Dưới D (Trắng)', '#FFFFFF', dLayerBar, setDLayerBar)}
      </div>

      {/* Recommended PBL Action Summary */}
      <div className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2 font-mono text-[10px]">
        <span className="text-neutral-400 truncate">
          Tổ hợp:{' '}
          <strong className="text-white">
            U ({uLayerBar === 'no-bar' ? 'Chéo' : uLayerBar === 'adj-bar' ? '1 Bar' : 'Solved'}) + D (
            {dLayerBar === 'no-bar' ? 'Chéo' : dLayerBar === 'adj-bar' ? '1 Bar' : 'Solved'})
          </strong>
        </span>
        <span className="text-amber-400 font-bold shrink-0">
          {uLayerBar === 'adj-bar' && dLayerBar === 'adj-bar'
            ? "R2 U' B2 U2 R2 U' R2"
            : uLayerBar === 'no-bar' && dLayerBar === 'no-bar'
            ? 'R2 F2 R2'
            : uLayerBar === 'no-bar' && dLayerBar === 'adj-bar'
            ? "R U' R F2 R' U R'"
            : "T-Perm / Y-Perm"}
        </span>
      </div>
    </div>
  );
};
