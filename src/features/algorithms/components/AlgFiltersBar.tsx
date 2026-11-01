import React from 'react';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ZbllRootSetNode,
  CollGroupNode,
} from '../../../data/algorithms/zbllHierarchy';
import { ColorScheme } from '../../../engine/algSimulator';
import { sound } from '../../../utils/audio';
import { ZbllBreadcrumbsTree } from './ZbllBreadcrumbsTree';

export type LevelTab = 'level-1' | 'level-2' | 'level-3' | 'level-4';
export type MasteryFilter = 'all' | 'unlearned' | 'learning' | 'mastered';
export type CfopMode = 'two-look' | 'full-cfop';
export type CfopCategory = 'ALL' | 'F2L' | 'OLL' | 'PLL';
export type RouxFilter = 'ALL' | 'Roux LSE' | 'CMLL';

interface AlgFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeLevel: LevelTab;
  setActiveLevel: (level: LevelTab) => void;
  masteryFilter: MasteryFilter;
  setMasteryFilter: (filter: MasteryFilter) => void;
  masteryCounts: { total: number; mastered: number; learning: number; unlearned: number };
  cfopMode: CfopMode;
  setCfopMode: (mode: CfopMode) => void;
  cfopCategory: CfopCategory;
  setCfopCategory: (cat: CfopCategory) => void;
  rouxFilter: RouxFilter;
  setRouxFilter: (filter: RouxFilter) => void;
  selectedZbllRoot: string;
  onSelectZbllRoot: (rootId: string) => void;
  activeZbllRootNode: ZbllRootSetNode;
  activeCollGroupNode: CollGroupNode;
  onSelectCollGroup: (groupId: string, collAlg: any) => void;
  colorScheme: ColorScheme;
  onBackToTimer: () => void;
}

export const AlgFiltersBar: React.FC<AlgFiltersBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeLevel,
  setActiveLevel,
  masteryFilter,
  setMasteryFilter,
  masteryCounts,
  cfopMode,
  setCfopMode,
  cfopCategory,
  setCfopCategory,
  rouxFilter,
  setRouxFilter,
  selectedZbllRoot,
  onSelectZbllRoot,
  activeZbllRootNode,
  activeCollGroupNode,
  onSelectCollGroup,
  colorScheme,
  onBackToTimer,
}) => {
  return (
    <section className="bg-white border border-[#EAECEF] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
      {/* Title & Search / Back Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EAECEF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <BookOpen className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              GOLD-STANDARD ALGORITHM DATABASE &amp; 3D SIMULATOR
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Thư Viện Công Thức Speedcubing (Lv.1 &#8594; Lv.4 ZBLL)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm công thức, tên case (VD: T-Perm, Sune, F2L 12)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#EAECEF] rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-all"
            />
          </div>

          <button
            onClick={onBackToTimer}
            className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs hover:border-neutral-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Timer</span>
          </button>
        </div>
      </div>

      {/* Row 2: 4-Level Switcher (Horizontal Scrolling Pill Bar) + Mastery Status Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="snap-x flex gap-2 overflow-x-auto no-scrollbar py-2 px-1 bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] max-w-full">
          {[
            { id: 'level-1' as const, label: 'Lv.1 Beginner (7)' },
            { id: 'level-2' as const, label: 'Lv.2 CFOP System (119)' },
            { id: 'level-3' as const, label: 'Lv.3 Roux (51)' },
            { id: 'level-4' as const, label: 'Lv.4 ZBLL & COLL Tree' },
          ].map((lvl) => {
            const isActive = activeLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setActiveLevel(lvl.id);
                  sound.playTick();
                }}
                className={`shrink-0 snap-start min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        <div className="snap-x flex gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-1 bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] max-w-full">
          {[
            { id: 'all' as const, label: `Tất cả (${masteryCounts.total})` },
            { id: 'mastered' as const, label: `Đã thuộc (Mastered ✓ · ${masteryCounts.mastered})` },
            { id: 'learning' as const, label: `Đang học (Learning ● · ${masteryCounts.learning})` },
            { id: 'unlearned' as const, label: `Chưa học (${masteryCounts.unlearned})` },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMasteryFilter(m.id);
                sound.playTick();
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                masteryFilter === m.id
                  ? 'bg-white text-neutral-900 shadow-xs border border-[#EAECEF]'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3A: CFOP Sub-Filters */}
      {activeLevel === 'level-2' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F1F3F5]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCfopMode('two-look');
                sound.playTick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                cfopMode === 'two-look'
                  ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                  : 'bg-[#F8F9FA] text-neutral-700 border-[#EAECEF] hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>[ ★ 2-Look Rút Gọn (16 Algs) ]</span>
            </button>

            <button
              onClick={() => {
                setCfopMode('full-cfop');
                sound.playTick();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                cfopMode === 'full-cfop'
                  ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                  : 'bg-[#F8F9FA] text-neutral-700 border-[#EAECEF] hover:bg-neutral-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>[ Full CFOP (41 F2L · 57 OLL · 21 PLL) ]</span>
            </button>
          </div>

          {cfopMode === 'full-cfop' && (
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F8F9FA] p-1.5 rounded-xl border border-[#EAECEF]">
              {[
                { id: 'ALL' as const, label: 'Tất cả (119)' },
                { id: 'F2L' as const, label: 'F2L Chuẩn (41)' },
                { id: 'OLL' as const, label: 'Full OLL (57)' },
                { id: 'PLL' as const, label: 'Full PLL (21)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCfopCategory(cat.id);
                    sound.playTick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    cfopCategory === cat.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-[#EAECEF] hover:text-neutral-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Row 3B: Roux Sub-Filters */}
      {activeLevel === 'level-3' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F3F5]">
          {[
            { id: 'ALL' as const, label: 'Toàn Bộ Roux (51 Cases)' },
            { id: 'Roux LSE' as const, label: 'LSE · Last Six Edges (9 Cases)' },
            { id: 'CMLL' as const, label: 'CMLL · 7 Orientation Sets (42 Cases)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setRouxFilter(item.id);
                sound.playTick();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                rouxFilter === item.id
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-[#F8F9FA] text-neutral-600 border-[#EAECEF] hover:text-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Row 3C: ZBLL 3-Tier Tree Explorer */}
      {activeLevel === 'level-4' && (
        <ZbllBreadcrumbsTree
          selectedZbllRoot={selectedZbllRoot}
          onSelectZbllRoot={onSelectZbllRoot}
          activeZbllRootNode={activeZbllRootNode}
          activeCollGroupNode={activeCollGroupNode}
          onSelectCollGroup={onSelectCollGroup}
          colorScheme={colorScheme}
        />
      )}
    </section>
  );
};
