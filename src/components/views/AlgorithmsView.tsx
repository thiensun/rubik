import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  AlgorithmCase,
  ALGORITHMS_LIBRARY,
  ALGORITHM_CATEGORIES,
  AlgCategory,
} from '../../utils/algorithmsData';
import { AlgorithmTopDownSVG } from './AlgorithmTopDownSVG';
import { sound } from '../../utils/audio';

interface AlgorithmsViewProps {
  onBackToTimer: () => void;
  onLoadInto3D: (alg: AlgorithmCase) => void;
}

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  onBackToTimer,
  onLoadInto3D,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AlgCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered algorithms
  const filteredAlgs = useMemo(() => {
    return ALGORITHMS_LIBRARY.filter((alg) => {
      if (selectedCategory !== 'ALL' && alg.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          alg.name.toLowerCase().includes(q) ||
          alg.notation.toLowerCase().includes(q) ||
          alg.category.toLowerCase().includes(q) ||
          alg.descriptionVi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = (id: string, notation: string) => {
    navigator.clipboard.writeText(notation);
    sound.playTick();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePracticeIn3D = (alg: AlgorithmCase) => {
    sound.playTick();
    onLoadInto3D(alg);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* 1. TOP SUMMARY HUD BANNER */}
      <div className="bg-white border border-[#EAECEF] rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <BookOpen className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              WCA SPEEDCUBING ALGORITHM ENCYCLOPEDIA
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Thư Viện Công Thức Chuẩn (Algorithms Library)
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-mono mt-1">
            Tra cứu đầy đủ 46 công thức chuẩn WCA kèm sơ đồ 2D Top-Down, mẹo xoay ngón tay và mô phỏng 3D tương tác.
          </p>
        </div>

        <button
          onClick={onBackToTimer}
          className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs hover:border-neutral-300 transition-all flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Scramble &amp; Timer</span>
        </button>
      </div>

      {/* 2. CATEGORY PILLS FILTER & SEARCH HUD */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-white border border-[#EAECEF] rounded-[20px] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F3F5] p-1.5 rounded-xl">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              sound.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Tất Cả ({ALGORITHMS_LIBRARY.length})
          </button>

          {ALGORITHM_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  sound.playTick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc công thức (ví dụ: T-Perm, Sune)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-[#EAECEF] rounded-xl pl-9.5 pr-4 py-2 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all"
          />
        </div>
      </div>

      {/* 3. ALGORITHM BENTO GRID */}
      {filteredAlgs.length === 0 ? (
        <div className="bg-white border border-[#EAECEF] rounded-[24px] p-12 text-center text-neutral-400 font-mono text-xs">
          Không tìm thấy công thức phù hợp với từ khóa &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlgs.map((alg) => {
            const isCopied = copiedId === alg.id;

            return (
              <div
                key={alg.id}
                className="bg-white border border-[#EAECEF] rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:border-neutral-300 transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Top Section: Diagram & Case Meta */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    {/* 2D Top-Down SVG Diagram */}
                    <AlgorithmTopDownSVG alg={alg} size={74} />

                    {/* Case Name & Sub-details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-[#F1F3F5] text-[10px] font-mono text-neutral-600 font-bold shrink-0">
                          {alg.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 font-medium shrink-0">
                          {alg.movesCount} Moves · {alg.prob}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-neutral-900 tracking-tight truncate" title={alg.name}>
                        {alg.name}
                      </h3>

                      <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2 mt-1">
                        {alg.descriptionVi}
                      </p>
                    </div>
                  </div>

                  {/* Monospace Formula Box */}
                  <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-xl p-3 font-mono text-xs font-bold text-neutral-900 tracking-wide select-all leading-relaxed break-words shadow-2xs">
                    {alg.notation}
                  </div>

                  {/* Holding Note Tip */}
                  <div className="bg-[#F8F9FA]/80 rounded-lg p-2 text-[11px] text-neutral-600 flex items-start gap-1.5 font-mono">
                    <Compass className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      <strong className="text-neutral-800">Mẹo Cầm:</strong> {alg.holdingNoteVi}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      alg.difficulty === 'Beginner'
                        ? 'bg-emerald-50 text-emerald-700'
                        : alg.difficulty === 'Intermediate'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {alg.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(alg.id, alg.notation)}
                      className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1 ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-bold'
                          : 'bg-white border-[#EAECEF] text-neutral-600 hover:text-neutral-900 hover:bg-[#F8F9FA]'
                      }`}
                      title="Sao chép công thức"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Đã chép</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Primary Button: Xem Trên Khối 3D */}
                    <button
                      onClick={() => handlePracticeIn3D(alg)}
                      className="bg-[#111111] hover:bg-neutral-800 active:scale-95 text-white text-xs font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Xem Trên Khối 3D</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
