import React from 'react';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import {
  ZbllRootSetNode,
  CollGroupNode,
} from '../../../data/algorithms/zbllHierarchy';
import { ColorScheme } from '../../../engine/algSimulator';
import { CubeSize } from '../../../types/cubing';
import { sound } from '../../../utils/audio';
import { ZbllBreadcrumbsTree } from './ZbllBreadcrumbsTree';
import { ScrollablePillBar } from './ScrollablePillBar';

export type LevelTab = 'level-1' | 'level-2' | 'level-3' | 'level-4';
export type MasteryFilter = 'all' | 'unlearned' | 'learning' | 'mastered';
export type CfopMode = 'two-look' | 'full-cfop';
export type CfopCategory = 'ALL' | 'F2L' | 'OLL' | 'PLL';
export type RouxFilter = 'ALL' | 'Roux LSE' | 'CMLL';
export type Filter2x2 = 'ALL' | '2x2 LBL' | 'Ortega OLL' | 'Ortega PBL' | 'CLL';
export type Filter4x4 =
  | 'ALL'
  | 'Yau Cross'
  | 'Last 2 Centers (L2C)'
  | 'Last 2 Edges (L2E)'
  | 'OLL Parity'
  | 'PLL Parity';

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
  cubeSize?: CubeSize;
  filter2x2?: Filter2x2;
  setFilter2x2?: (filter: Filter2x2) => void;
  filter4x4?: Filter4x4;
  setFilter4x4?: (filter: Filter4x4) => void;
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
  cubeSize = 3,
  filter2x2 = 'ALL',
  setFilter2x2,
  filter4x4 = 'ALL',
  setFilter4x4,
}) => {
  const categoryTabs: Array<{ id: string; label: string }> =
    cubeSize === 2
      ? [
          { id: 'ALL', label: 'Tất Cả 2×2 (58)' },
          { id: '2x2 LBL', label: '2×2 LBL (4)' },
          { id: 'Ortega OLL', label: 'Ortega OLL (7)' },
          { id: 'Ortega PBL', label: 'Ortega PBL (5)' },
          { id: 'CLL', label: 'CLL Master (42)' },
        ]
      : cubeSize === 4
      ? [
          { id: 'ALL', label: 'Tất Cả 4×4 (16)' },
          { id: 'Yau Cross', label: 'Yau Cross (3)' },
          { id: 'Last 2 Centers (L2C)', label: 'Last 2 Centers (L2C)' },
          { id: 'Last 2 Edges (L2E)', label: 'Last 2 Edges (L2E)' },
          { id: 'OLL Parity', label: 'OLL Parity' },
          { id: 'PLL Parity', label: 'PLL Parity' },
        ]
      : [
          { id: 'level-1', label: 'Lv.1 Beginner (7)' },
          { id: 'level-2', label: 'Lv.2 CFOP System (119)' },
          { id: 'level-3', label: 'Lv.3 Roux (51)' },
          { id: 'level-4', label: 'Lv.4 ZBLL & COLL Tree' },
        ];

  const activeCategoryId =
    cubeSize === 2 ? filter2x2 : cubeSize === 4 ? filter4x4 : activeLevel;

  const handleSelectCategory = (id: string) => {
    if (cubeSize === 2) setFilter2x2?.(id as Filter2x2);
    else if (cubeSize === 4) setFilter4x4?.(id as Filter4x4);
    else setActiveLevel(id as LevelTab);
    sound.playTick();
  };

  return (
    <section className="bg-white border border-[#EAECEF] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
      {/* Title & Search / Back Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EAECEF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#111111]" />
            <BookOpen className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Thư Viện Công Thức
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {cubeSize === 2
              ? 'Thư Viện Công Thức 2×2×2 (Ortega & 42 CLL)'
              : cubeSize === 4
              ? 'Thư Viện Công Thức 4×4×4 (L2C, L2E & OLL/PLL Parity)'
              : 'Thư Viện Công Thức Speedcubing (Lv.1 \u2192 Lv.4 ZBLL)'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm công thức, tên case (VD: T-Perm, Sune, F2L 12)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#EAECEF] rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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

      {/* Row 2: Dedicated Full-Width Category & Status Filter Bars (No Squishing / Wrapping) */}
      <div className="flex flex-col gap-2.5 w-full">
        {/* Row 2A: Category Filter Bar */}
        <ScrollablePillBar activeId={`${cubeSize}-${activeCategoryId}`} className="py-2 px-1.5 gap-2">
          {categoryTabs.map((tab) => {
            const isActive = activeCategoryId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => handleSelectCategory(tab.id)}
                className={`whitespace-nowrap shrink-0 snap-start min-h-[40px] px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </ScrollablePillBar>

        {/* Row 2B: Mastery Status Filter Bar */}
        <ScrollablePillBar activeId={masteryFilter} className="py-1.5 px-1.5 gap-1.5">
          {[
            { id: 'all' as const, label: `Tất cả (${masteryCounts.total})` },
            { id: 'mastered' as const, label: `Đã thuộc (Mastered ✓ · ${masteryCounts.mastered})` },
            { id: 'learning' as const, label: `Đang học (Learning · ${masteryCounts.learning})` },
            { id: 'unlearned' as const, label: `Chưa học (${masteryCounts.unlearned})` },
          ].map((m) => {
            const isActive = masteryFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => {
                  setMasteryFilter(m.id);
                  sound.playTick();
                }}
                className={`whitespace-nowrap shrink-0 snap-start px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-xs border border-[#EAECEF]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </ScrollablePillBar>
      </div>

      {/* Row 3A: CFOP Sub-Filters */}
      {cubeSize === 3 && activeLevel === 'level-2' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F1F3F5]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCfopMode('two-look');
                sound.playTick();
              }}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                cfopMode === 'two-look'
                  ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                  : 'bg-[#F8F9FA] text-neutral-700 border-[#EAECEF] hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2-Look Rút Gọn (16 Algs)</span>
            </button>

            <button
              onClick={() => {
                setCfopMode('full-cfop');
                sound.playTick();
              }}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                cfopMode === 'full-cfop'
                  ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                  : 'bg-[#F8F9FA] text-neutral-700 border-[#EAECEF] hover:bg-neutral-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full CFOP (119 Algs)</span>
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
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
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
      {cubeSize === 3 && activeLevel === 'level-3' && (
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
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
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
      {cubeSize === 3 && activeLevel === 'level-4' && (
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
