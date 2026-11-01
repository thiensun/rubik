import React from 'react';
import { Target, BookOpen } from 'lucide-react';
import { CrossAdvisor } from '../../../utils/crossAnalysis';
import { CUBE_HEX_COLORS } from '../../../utils/cubeState';

interface CrossStrategyCardProps {
  crossAdvisor: CrossAdvisor;
  activeLevel: string;
}

export const CrossStrategyCard: React.FC<CrossStrategyCardProps> = ({
  crossAdvisor,
  activeLevel,
}) => {
  return (
    <section className="bg-white rounded-[24px] border border-[#EAECEF] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3.5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#F2F4F7] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] text-[#111111] flex items-center justify-center border border-[#EAECEF] shrink-0">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Chiến Thuật Cross
            </span>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900">
              Gợi Ý Chọn Cross Theo Cấp Độ
            </h3>
          </div>
        </div>

        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#111111] text-white text-[10px] font-mono font-bold tracking-tight">
          {crossAdvisor.badgeVi}
        </span>
      </div>

      {/* Recommendation Banner */}
      <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-[#EAECEF] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
            style={{ backgroundColor: CUBE_HEX_COLORS[crossAdvisor.recommendedColor] }}
          />
          <span className="font-bold text-xs sm:text-sm text-neutral-900">
            {crossAdvisor.titleVi}
          </span>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
          {crossAdvisor.summaryVi}
        </p>
      </div>

      {/* Holding Orientation HUD */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
          QUY TẮC CẦM KHỐI (HOLDING ORIENTATION):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-white border border-neutral-400 shrink-0 shadow-2xs" />
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT ĐÁY (D)</span>
              <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.bottomVi}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0 shadow-2xs" />
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT ĐỈNH (U)</span>
              <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.topVi}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#EAECEF] flex items-center gap-2 text-xs shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono text-neutral-400 block font-bold">MẶT TRƯỚC (F)</span>
              <span className="font-bold text-neutral-800 truncate block">{crossAdvisor.holdingOrientation.frontVi}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beginner LBL Special Pedagogy Guide */}
      {crossAdvisor.beginnerGuide && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col gap-2 mt-0.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[12px]">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Hướng Dẫn Người Mới: Phương Pháp Hoa Cúc (Daisy) vs Cross Trực Tiếp</span>
          </div>
          <p className="leading-relaxed text-[11.5px] text-neutral-700">
            <strong className="text-amber-900 font-semibold">1. Phương pháp Hoa Cúc (Daisy): </strong>
            {crossAdvisor.beginnerGuide.daisyMethodVi}
          </p>
          <p className="leading-relaxed text-[11.5px] text-neutral-700">
            <strong className="text-amber-900 font-semibold">2. White Cross Trực Tiếp: </strong>
            {crossAdvisor.beginnerGuide.directCrossVi}
          </p>
          <p className="leading-relaxed text-[11px] text-neutral-500 italic pt-1 border-t border-amber-200/60">
            💡 {crossAdvisor.beginnerGuide.whyWhiteFirstVi}
          </p>
        </div>
      )}

      {/* Advanced / CFOP Cross Faces Evaluation Chips */}
      {activeLevel !== 'level-1' && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            SO SÁNH 6 MẶT CROSS (COLOR EVALUATION):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {crossAdvisor.options.map((opt) => (
              <div
                key={opt.faceKey}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  opt.isRecommended
                    ? 'bg-emerald-50/90 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                    : 'bg-white border-[#EAECEF] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: opt.colorHex }}
                  />
                  <span className="font-mono text-[10.5px] font-bold text-neutral-800">
                    {opt.faceKey} · {opt.colorNameVi}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-neutral-900">
                  ~{opt.estimatedMoves} Moves
                </span>
                <span className="text-[9.5px] font-mono text-neutral-500 mt-0.5">
                  {opt.solvedEdgesCount}/4 Cạnh Sẵn
                </span>
                {opt.isRecommended && (
                  <span className="mt-1 px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono text-[8.5px] font-bold tracking-tight">
                    TOP PICK
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
