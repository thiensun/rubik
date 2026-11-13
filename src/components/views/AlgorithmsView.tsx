import React, { useState, useMemo, useEffect } from 'react';
import {
  AlgorithmEntry,
  BEGINNER_ALGS,
  F2L_ALGS,
  OLL_ALGS,
  PLL_ALGS,
  ROUX_ALGS,
  ZBLL_HIERARCHY_TREE,
  CUBE_2X2_ALGS,
  LBL_2X2_ALGS,
  ORTEGA_OLL_ALGS,
  ORTEGA_PBL_ALGS,
  CLL_2X2_ALGS,
  CUBE_4X4_ALGS,
  YAU_CROSS_4X4_ALGS,
  L2C_4X4_ALGS,
  L2E_4X4_ALGS,
  OLL_PARITY_4X4_ALGS,
  PLL_PARITY_4X4_ALGS,
} from '../../data/algorithms';
import {
  ZbllRootSetNode,
  CollGroupNode,
} from '../../data/algorithms/zbllHierarchy';
import { ColorScheme, DEFAULT_COLOR_SCHEME } from '../../engine/algSimulator';
import { sound } from '../../utils/audio';
import { CustomAlgorithmData } from '../solver/Step3SolveInteractive';
import { CubeSize } from '../../types/cubing';

// Modular Feature Components
import {
  AlgFiltersBar,
  LevelTab,
  MasteryFilter,
  CfopMode,
  CfopCategory,
  RouxFilter,
  Filter2x2,
  Filter4x4,
} from '../../features/algorithms/components/AlgFiltersBar';
import {
  AlgCardGrid,
  MasteryStatus,
} from '../../features/algorithms/components/AlgCardGrid';
import { AlgTrainerStudio } from '../../features/algorithms/components/AlgTrainerStudio';
import { useAlgTrainer } from '../../features/algorithms/hooks/useAlgTrainer';

const MASTERY_STORAGE_KEY = 'cubemaster_alg_mastery_v2_4';

export interface DrillLogRecord {
  algId: string;
  timeMs: number;
  timestamp: number;
}

interface AlgorithmsViewProps {
  onBackToTimer: () => void;
  onLoadInto3D: (algData: CustomAlgorithmData & { prob?: string; holdingNoteVi?: string }) => void;
  colorScheme?: ColorScheme;
  cubeSize?: CubeSize;
}

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  onBackToTimer,
  onLoadInto3D,
  colorScheme = DEFAULT_COLOR_SCHEME,
  cubeSize = 3,
}) => {
  const [activeLevel, setActiveLevel] = useState<LevelTab>('level-2');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sub-filters
  const [cfopMode, setCfopMode] = useState<CfopMode>('two-look');
  const [cfopCategory, setCfopCategory] = useState<CfopCategory>('ALL');
  const [rouxFilter, setRouxFilter] = useState<RouxFilter>('ALL');
  const [filter2x2, setFilter2x2] = useState<Filter2x2>('ALL');
  const [filter4x4, setFilter4x4] = useState<Filter4x4>('ALL');

  // Level 4 ZBLL State
  const [selectedZbllRoot, setSelectedZbllRoot] = useState<string>('T');
  const [selectedCollGroupId, setSelectedCollGroupId] = useState<string>('T-1');

  // Persisted Mastery State
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryStatus>>(() => {
    try {
      const saved = localStorage.getItem(MASTERY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(masteryMap));
    } catch {
      // ignore
    }
  }, [masteryMap]);

  // ZBLL Active Nodes
  const activeZbllRootNode = useMemo<ZbllRootSetNode>(() => {
    return ZBLL_HIERARCHY_TREE.find((r) => r.id === selectedZbllRoot) || ZBLL_HIERARCHY_TREE[0];
  }, [selectedZbllRoot]);

  const activeCollGroupNode = useMemo<CollGroupNode>(() => {
    return (
      activeZbllRootNode.collGroups.find((g) => g.id === selectedCollGroupId) ||
      activeZbllRootNode.collGroups[0]
    );
  }, [activeZbllRootNode, selectedCollGroupId]);

  // Base list of algorithms for active level / cube size
  const baseLevelAlgs = useMemo<AlgorithmEntry[]>(() => {
    if (cubeSize === 2) {
      if (filter2x2 === '2x2 LBL') return LBL_2X2_ALGS;
      if (filter2x2 === 'Ortega OLL') return ORTEGA_OLL_ALGS;
      if (filter2x2 === 'Ortega PBL') return ORTEGA_PBL_ALGS;
      if (filter2x2 === 'CLL') return CLL_2X2_ALGS;
      return CUBE_2X2_ALGS;
    }
    if (cubeSize === 4) {
      if (filter4x4 === 'Yau Cross') return YAU_CROSS_4X4_ALGS;
      if (filter4x4 === 'Last 2 Centers (L2C)') return L2C_4X4_ALGS;
      if (filter4x4 === 'Last 2 Edges (L2E)') return L2E_4X4_ALGS;
      if (filter4x4 === 'OLL Parity') return OLL_PARITY_4X4_ALGS;
      if (filter4x4 === 'PLL Parity') return PLL_PARITY_4X4_ALGS;
      return CUBE_4X4_ALGS;
    }
    if (activeLevel === 'level-1') return BEGINNER_ALGS;
    if (activeLevel === 'level-2') {
      const fullCfop = [...F2L_ALGS, ...OLL_ALGS, ...PLL_ALGS];
      if (cfopMode === 'two-look') return fullCfop.filter((a) => a.isTwoLook);
      if (cfopCategory === 'F2L') return F2L_ALGS;
      if (cfopCategory === 'OLL') return OLL_ALGS;
      if (cfopCategory === 'PLL') return PLL_ALGS;
      return fullCfop;
    }
    if (activeLevel === 'level-3') {
      if (rouxFilter === 'Roux LSE') return ROUX_ALGS.filter((a) => a.category === 'Roux LSE');
      if (rouxFilter === 'CMLL') return ROUX_ALGS.filter((a) => a.category === 'CMLL');
      return ROUX_ALGS;
    }
    return activeCollGroupNode.zbllCases;
  }, [cubeSize, filter2x2, filter4x4, activeLevel, cfopMode, cfopCategory, rouxFilter, activeCollGroupNode]);

  // All algorithms flat map for global search / drill
  const allDatabaseAlgs = useMemo<AlgorithmEntry[]>(() => {
    if (cubeSize === 2) return CUBE_2X2_ALGS;
    if (cubeSize === 4) return CUBE_4X4_ALGS;
    const zblls = ZBLL_HIERARCHY_TREE.flatMap((r) => r.collGroups.flatMap((g) => g.zbllCases));
    return [...BEGINNER_ALGS, ...F2L_ALGS, ...OLL_ALGS, ...PLL_ALGS, ...ROUX_ALGS, ...zblls];
  }, [cubeSize]);

  // Filtered algorithms by search query and mastery filter
  const filteredAlgs = useMemo<AlgorithmEntry[]>(() => {
    let list = baseLevelAlgs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = allDatabaseAlgs.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.mainAlg.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.subGroup && a.subGroup.toLowerCase().includes(q)),
      );
    }
    if (masteryFilter !== 'all') {
      list = list.filter((a) => (masteryMap[a.id] || 'unlearned') === masteryFilter);
    }
    return list;
  }, [baseLevelAlgs, searchQuery, masteryFilter, allDatabaseAlgs, masteryMap]);

  // Trainer & Drill Mode Hook
  const trainer = useAlgTrainer(
    PLL_ALGS[0] || BEGINNER_ALGS[0],
    baseLevelAlgs,
    allDatabaseAlgs,
    masteryMap,
    cubeSize,
  );

  // Sync trainer algorithm when cubeSize changes
  useEffect(() => {
    if (baseLevelAlgs.length > 0) {
      trainer.setSelectedTrainerAlg(baseLevelAlgs[0]);
      trainer.setTrainerMoveIdx(0);
      trainer.setIsTrainerPlaying(false);
    }
  }, [cubeSize]);

  const handleCycleMastery = (algId: string) => {
    setMasteryMap((prev) => {
      const current = prev[algId] || 'unlearned';
      const next: MasteryStatus =
        current === 'unlearned' ? 'learning' : current === 'learning' ? 'mastered' : 'unlearned';
      sound.playTick();
      return { ...prev, [algId]: next };
    });
  };

  const handleSelectAlgForTrainer = (alg: AlgorithmEntry) => {
    sound.playTick();
    trainer.setIsDrillMode(false);
    trainer.setSelectedTrainerAlg(alg);
    trainer.setTrainerMoveIdx(0);
    trainer.setIsTrainerPlaying(false);
  };

  const handleCopyFormula = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    sound.playTick();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const masteryCounts = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    for (const alg of baseLevelAlgs) {
      const st = masteryMap[alg.id] || 'unlearned';
      if (st === 'mastered') mastered++;
      else if (st === 'learning') learning++;
    }
    return {
      total: baseLevelAlgs.length,
      mastered,
      learning,
      unlearned: baseLevelAlgs.length - mastered - learning,
    };
  }, [baseLevelAlgs, masteryMap]);

  return (
    <div className="w-full space-y-5 animate-fade-in pb-24 lg:pb-8">
      {/* 1. TOP FILTER BENTO BAR */}
      <AlgFiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeLevel={activeLevel}
        setActiveLevel={setActiveLevel}
        masteryFilter={masteryFilter}
        setMasteryFilter={setMasteryFilter}
        masteryCounts={masteryCounts}
        cfopMode={cfopMode}
        setCfopMode={setCfopMode}
        cfopCategory={cfopCategory}
        setCfopCategory={setCfopCategory}
        rouxFilter={rouxFilter}
        setRouxFilter={setRouxFilter}
        selectedZbllRoot={selectedZbllRoot}
        onSelectZbllRoot={(rootId) => {
          setSelectedZbllRoot(rootId);
          const rootNode = ZBLL_HIERARCHY_TREE.find((r) => r.id === rootId);
          if (rootNode && rootNode.collGroups.length > 0) {
            setSelectedCollGroupId(rootNode.collGroups[0].id);
            handleSelectAlgForTrainer(rootNode.collGroups[0].collAlg);
          }
          sound.playTick();
        }}
        activeZbllRootNode={activeZbllRootNode}
        activeCollGroupNode={activeCollGroupNode}
        onSelectCollGroup={(groupId, collAlg) => {
          setSelectedCollGroupId(groupId);
          handleSelectAlgForTrainer(collAlg);
        }}
        colorScheme={colorScheme}
        onBackToTimer={onBackToTimer}
        cubeSize={cubeSize}
        filter2x2={filter2x2}
        setFilter2x2={setFilter2x2}
        filter4x4={filter4x4}
        setFilter4x4={setFilter4x4}
      />

      {/* 2. ASYMMETRIC MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Cards Grid */}
        <div className="lg:col-span-8 space-y-4 pb-20 lg:pb-0">
          <AlgCardGrid
            filteredAlgs={filteredAlgs}
            masteryMap={masteryMap}
            onCycleMastery={handleCycleMastery}
            selectedTrainerAlgId={trainer.selectedTrainerAlg.id}
            isDrillMode={trainer.isDrillMode}
            onSelectAlgForTrainer={handleSelectAlgForTrainer}
            onLoadInto3D={onLoadInto3D}
            onOpenMobileSheet={() => trainer.setIsMobileSheetOpen(true)}
            colorScheme={colorScheme}
            copiedId={copiedId}
            onCopyFormula={handleCopyFormula}
          />
        </div>

        {/* RIGHT COLUMN: 3D Trainer Studio & Drill Mode */}
        <AlgTrainerStudio
          isDrillMode={trainer.isDrillMode}
          setIsDrillMode={trainer.setIsDrillMode}
          isMobileSheetOpen={trainer.isMobileSheetOpen}
          setIsMobileSheetOpen={trainer.setIsMobileSheetOpen}
          selectedTrainerAlg={trainer.selectedTrainerAlg}
          trainerMoveIdx={trainer.trainerMoveIdx}
          setTrainerMoveIdx={trainer.setTrainerMoveIdx}
          trainerMoves={trainer.trainerMoves}
          trainerInitialCubeState={trainer.trainerInitialCubeState}
          trainerSpeed={trainer.trainerSpeed}
          setTrainerSpeed={trainer.setTrainerSpeed}
          isTrainerPlaying={trainer.isTrainerPlaying}
          setIsTrainerPlaying={trainer.setIsTrainerPlaying}
          onLoadInto3D={onLoadInto3D}
          drillPoolType={trainer.drillPoolType}
          setDrillPoolType={trainer.setDrillPoolType}
          drillCubeState={trainer.drillCubeState}
          drillRevealed={trainer.drillRevealed}
          setDrillRevealed={trainer.setDrillRevealed}
          drillCase={trainer.drillCase}
          drillTimerState={trainer.drillTimerState}
          setDrillTimerState={trainer.setDrillTimerState}
          drillElapsedMs={trainer.drillElapsedMs}
          setDrillElapsedMs={trainer.setDrillElapsedMs}
          drillStartRef={trainer.drillStartRef}
          pickNextDrillCase={trainer.pickNextDrillCase}
          optimalPreAufMove={trainer.optimalPreAufMove}
          cubeSize={cubeSize}
        />
      </div>
    </div>
  );
};
