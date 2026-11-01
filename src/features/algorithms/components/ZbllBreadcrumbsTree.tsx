import React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  ZBLL_HIERARCHY_TREE,
  ZbllRootSetNode,
  CollGroupNode,
} from '../../../data/algorithms/zbllHierarchy';
import { DynamicCaseDiagram } from '../../../components/DynamicCaseDiagram';
import { ColorScheme } from '../../../engine/algSimulator';

interface ZbllBreadcrumbsTreeProps {
  selectedZbllRoot: string;
  onSelectZbllRoot: (rootId: string) => void;
  activeZbllRootNode: ZbllRootSetNode;
  activeCollGroupNode: CollGroupNode;
  onSelectCollGroup: (groupId: string, collAlg: any) => void;
  colorScheme: ColorScheme;
}

export const ZbllBreadcrumbsTree: React.FC<ZbllBreadcrumbsTreeProps> = ({
  selectedZbllRoot,
  onSelectZbllRoot,
  activeZbllRootNode,
  activeCollGroupNode,
  onSelectCollGroup,
  colorScheme,
}) => {
  return (
    <div className="pt-3 border-t border-[#EAECEF] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-700">
          <span className="px-2 py-0.5 rounded bg-neutral-900 text-white">TIER 1-3 TREE</span>
          <span>{activeZbllRootNode.id}</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-emerald-700">{activeCollGroupNode.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span>12 ZBLL Edge Cases</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          7 Root Sets &times; 6 COLL Groups &times; 12 ZBLL = 42 COLL + 504 ZBLL Cases
        </span>
      </div>

      {/* Tier 1 Pills */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
          1. Chọn Nhóm Góc Định Hướng (Tier 1 · 7 Root Orientation Sets):
        </div>
        <div className="flex flex-wrap gap-2">
          {ZBLL_HIERARCHY_TREE.map((root) => {
            const isSelected = root.id === selectedZbllRoot;
            return (
              <button
                key={root.id}
                onClick={() => onSelectZbllRoot(root.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                    : 'bg-[#F8F9FA] text-neutral-700 border-[#EAECEF] hover:bg-neutral-100'
                }`}
              >
                <span>{root.id}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-emerald-400 text-black font-extrabold' : 'bg-white text-neutral-500'
                  }`}
                >
                  6 COLL · 72 ZBLL
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier 2 Cards */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
          2. Chọn Nhóm Hoán Vị Góc COLL (Tier 2 · 6 COLL Sub-sets — Nhấn để mở 12 ZBLL cạnh):
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeZbllRootNode.collGroups.map((group) => {
            const isSelected = group.id === activeCollGroupNode.id;
            return (
              <div
                key={group.id}
                onClick={() => onSelectCollGroup(group.id, group.collAlg)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-white border-2 border-[#111111] shadow-md'
                    : 'bg-[#F8F9FA] border-[#EAECEF] hover:bg-white hover:border-neutral-300'
                }`}
              >
                <DynamicCaseDiagram
                  id={group.collAlg.id}
                  mainAlg={group.collAlg.mainAlg}
                  category="COLL"
                  colorScheme={colorScheme}
                  size={60}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-extrabold text-neutral-900 truncate">
                      {group.groupCode} · {group.recognitionPattern}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold shrink-0">
                      12 ZBLL
                    </span>
                  </div>
                  <div className="mt-1 px-2 py-1 rounded-lg bg-[#F8F9FA] border border-[#EAECEF] font-mono text-[10.5px] font-bold text-neutral-800 truncate">
                    COLL: {group.collAlg.mainAlg}
                  </div>
                  <p className="text-[10.5px] text-neutral-500 mt-1 line-clamp-1">
                    {group.recognitionVN}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
