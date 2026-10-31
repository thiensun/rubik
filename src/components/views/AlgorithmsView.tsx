import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  ChevronRight,
  RotateCcw,
  Eye,
  Clock,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  AlgorithmEntry,
  BEGINNER_ALGS,
  F2L_ALGS,
  OLL_ALGS,
  PLL_ALGS,
  ROUX_ALGS,
  ZBLL_HIERARCHY_TREE,
  ZBLLRootSetId,
} from '../../data/algorithms';
import {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  getCaseState,
  tokenizeAlg,
  applySimulatorMove,
} from '../../engine/algSimulator';
import {
  parseFormulaTriggers,
  extractUniqueTriggers,
} from '../../engine/triggerParser';
import { DynamicCaseDiagram } from '../DynamicCaseDiagram';
import { ThreeCubeViewer } from '../solver/ThreeCubeViewer';
import { createMoves } from '../../utils/solutionStages';
import { cloneCube } from '../../utils/cubeState';
import { sound } from '../../utils/audio';

export type MasteryStatus = 'unlearned' | 'learning' | 'mastered';

const MASTERY_STORAGE_KEY = 'cubemaster_alg_mastery_v2_4';
const DRILL_HISTORY_STORAGE_KEY = 'cubemaster_alg_drill_history_v2_4';

export interface DrillLogRecord {
  algId: string;
  timeMs: number;
  preAuf: string;
  timestamp: number;
}

export interface AlgorithmsViewProps {
  onBackToTimer: () => void;
  onLoadInto3D: (alg: {
    id: string;
    name: string;
    notation: string;
    category: string;
    prob?: string;
    descriptionVi?: string;
    holdingNoteVi?: string;
  }) => void;
  colorScheme?: ColorScheme;
}

type LevelTab = 'level-1' | 'level-2' | 'level-3' | 'level-4';
type CfopMode = 'two-look' | 'full-cfop';
type CfopCategoryFilter = 'ALL' | 'F2L' | 'OLL' | 'PLL';
type MasteryFilter = 'all' | MasteryStatus;
type DrillPoolType = 'current' | 'learning' | 'mastered';

const PRE_AUF_OPTIONS = ['', 'U', "U'", 'U2'] as const;

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  onBackToTimer,
  onLoadInto3D,
  colorScheme = DEFAULT_COLOR_SCHEME,
}) => {
  // 1. Level & Sub-Filter State
  const [activeLevel, setActiveLevel] = useState<LevelTab>('level-2');
  const [cfopMode, setCfopMode] = useState<CfopMode>('two-look');
  const [cfopCategory, setCfopCategory] = useState<CfopCategoryFilter>('ALL');
  const [rouxFilter, setRouxFilter] = useState<'ALL' | 'Roux LSE' | 'CMLL'>('ALL');

  // Level 4 ZBLL 3-Tier Explorer State
  const [selectedZbllRoot, setSelectedZbllRoot] = useState<ZBLLRootSetId>('T-Set');
  const [selectedCollGroupId, setSelectedCollGroupId] = useState<string>('coll-t-1');

  // Mastery & Search State
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persisted Mastery Map in localStorage
  const [masteryMap, setMasteryMap] = useState<Record<string, MasteryStatus>>(() => {
    try {
      const saved = localStorage.getItem(MASTERY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      'pll-t': 'mastered',
      'pll-y': 'mastered',
      'pll-ua': 'learning',
      'pll-ub': 'learning',
      'oll-27': 'mastered',
      'oll-26': 'learning',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(masteryMap));
    } catch {
      // ignore
    }
  }, [masteryMap]);

  // Persisted Drill History in localStorage
  const [drillHistory, setDrillHistory] = useState<DrillLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem(DRILL_HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRILL_HISTORY_STORAGE_KEY, JSON.stringify(drillHistory.slice(0, 200)));
    } catch {
      // ignore
    }
  }, [drillHistory]);

  // Core 7 Beginner Algorithms (plus full 10 if searched)
  const coreBeginnerAlgs = useMemo(() => BEGINNER_ALGS.slice(0, 7), []);
  const allCfopAlgs = useMemo(() => [...F2L_ALGS, ...OLL_ALGS, ...PLL_ALGS], []);
  const twoLookCfopAlgs = useMemo(
    () => [...OLL_ALGS.filter((a) => a.isTwoLook), ...PLL_ALGS.filter((a) => a.isTwoLook)],
    [],
  );

  // Active ZBLL Root & COLL Group Node
  const activeZbllRootNode = useMemo(
    () => ZBLL_HIERARCHY_TREE.find((r) => r.id === selectedZbllRoot) || ZBLL_HIERARCHY_TREE[0],
    [selectedZbllRoot],
  );

  const activeCollGroupNode = useMemo(() => {
    const found = activeZbllRootNode.collGroups.find((g) => g.id === selectedCollGroupId);
    return found || activeZbllRootNode.collGroups[0];
  }, [activeZbllRootNode, selectedCollGroupId]);

  // Keep selectedCollGroupId synced when root changes
  const handleSelectZbllRoot = (rootId: ZBLLRootSetId) => {
    setSelectedZbllRoot(rootId);
    const rootNode = ZBLL_HIERARCHY_TREE.find((r) => r.id === rootId);
    if (rootNode && rootNode.collGroups.length > 0) {
      setSelectedCollGroupId(rootNode.collGroups[0].id);
    }
    sound.playTick();
  };

  // Current Level Base Pool
  const baseLevelAlgs = useMemo<AlgorithmEntry[]>(() => {
    if (activeLevel === 'level-1') {
      return searchQuery.trim() ? BEGINNER_ALGS : coreBeginnerAlgs;
    }
    if (activeLevel === 'level-2') {
      if (cfopMode === 'two-look') {
        return twoLookCfopAlgs;
      }
      if (cfopCategory === 'F2L') return F2L_ALGS;
      if (cfopCategory === 'OLL') return OLL_ALGS;
      if (cfopCategory === 'PLL') return PLL_ALGS;
      return allCfopAlgs;
    }
    if (activeLevel === 'level-3') {
      if (rouxFilter === 'ALL') return ROUX_ALGS;
      return ROUX_ALGS.filter((a) => a.category === rouxFilter);
    }
    // Level 4: ZBLL & COLL Tree (shows the 12 ZBLL Edge Permutation cases for the selected COLL group)
    return activeCollGroupNode.zbllCases;
  }, [
    activeLevel,
    searchQuery,
    coreBeginnerAlgs,
    cfopMode,
    twoLookCfopAlgs,
    cfopCategory,
    allCfopAlgs,
    rouxFilter,
    activeCollGroupNode,
  ]);

  // Filtered Algorithms by Mastery & Search Query
  const filteredAlgs = useMemo(() => {
    return baseLevelAlgs.filter((alg) => {
      const status: MasteryStatus = masteryMap[alg.id] || 'unlearned';
      if (masteryFilter !== 'all' && status !== masteryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          alg.name.toLowerCase().includes(q) ||
          alg.id.toLowerCase().includes(q) ||
          alg.mainAlg.toLowerCase().includes(q) ||
          alg.subGroup.toLowerCase().includes(q) ||
          alg.recognitionVN.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [baseLevelAlgs, masteryMap, masteryFilter, searchQuery]);

  // All algorithms flat map for global lookup / Drill Mode
  const allDatabaseAlgs = useMemo<AlgorithmEntry[]>(() => {
    const zblls = ZBLL_HIERARCHY_TREE.flatMap((r) => r.collGroups.flatMap((g) => g.zbllCases));
    const colls = ZBLL_HIERARCHY_TREE.flatMap((r) => r.collGroups.map((g) => g.collAlg));
    return [...BEGINNER_ALGS, ...allCfopAlgs, ...ROUX_ALGS, ...colls, ...zblls];
  }, [allCfopAlgs]);

  // ============================================================================
  // RIGHT PANEL: 3D ALG TRAINER & DRILL MODE STATE
  // ============================================================================
  const [selectedTrainerAlg, setSelectedTrainerAlg] = useState<AlgorithmEntry>(
    () => twoLookCfopAlgs[0] || PLL_ALGS[0],
  );
  const [trainerMoveIdx, setTrainerMoveIdx] = useState<number>(0);
  const [isTrainerPlaying, setIsTrainerPlaying] = useState<boolean>(false);
  const [trainerSpeed, setTrainerSpeed] = useState<'0.5x' | '1.0x' | '2.0x'>('1.0x');

  // Auto-sync right 3D Trainer to the FIRST algorithm whenever switching level tabs or sub-filters
  useEffect(() => {
    if (baseLevelAlgs.length > 0) {
      setSelectedTrainerAlg(baseLevelAlgs[0]);
      setTrainerMoveIdx(0);
      setIsTrainerPlaying(false);
    }
  }, [activeLevel, cfopMode, cfopCategory, rouxFilter, selectedZbllRoot, selectedCollGroupId, baseLevelAlgs]);

  // Mode B: Drill Mode State
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [drillPoolType, setDrillPoolType] = useState<DrillPoolType>('current');
  const [drillCase, setDrillCase] = useState<AlgorithmEntry | null>(null);
  const [drillPreAuf, setDrillPreAuf] = useState<string>('');
  const [drillRevealed, setDrillRevealed] = useState<boolean>(false);
  const [drillTimerState, setDrillTimerState] = useState<'idle' | 'holding' | 'running' | 'stopped'>('idle');
  const [drillElapsedMs, setDrillElapsedMs] = useState<number>(0);
  const drillStartRef = useRef<number>(0);
  const drillRafRef = useRef<number | null>(null);

  // Cycle Mastery Status: unlearned -> learning -> mastered -> unlearned
  const handleCycleMastery = (algId: string) => {
    sound.playTick();
    setMasteryMap((prev) => {
      const current: MasteryStatus = prev[algId] || 'unlearned';
      const next: MasteryStatus =
        current === 'unlearned'
          ? 'learning'
          : current === 'learning'
            ? 'mastered'
            : 'unlearned';
      return { ...prev, [algId]: next };
    });
  };

  // Select an algorithm card to inspect in the right sticky 3D Trainer
  const handleSelectAlgForTrainer = (alg: AlgorithmEntry) => {
    sound.playTick();
    setIsDrillMode(false);
    setSelectedTrainerAlg(alg);
    setTrainerMoveIdx(0);
    setIsTrainerPlaying(false);
  };

  // Trainer Moves & 3D Setup State
  const trainerMoves = useMemo(() => {
    const cleanTokens = tokenizeAlg(selectedTrainerAlg.mainAlg).join(' ');
    return createMoves(cleanTokens, 1);
  }, [selectedTrainerAlg]);

  const trainerInitialCubeState = useMemo(() => {
    const setupOrMain = selectedTrainerAlg.setupAlg || selectedTrainerAlg.mainAlg;
    return getCaseState(setupOrMain, colorScheme).cubeState;
  }, [selectedTrainerAlg, colorScheme]);

  // Auto-advance 3D Trainer Playback
  useEffect(() => {
    if (!isTrainerPlaying || isDrillMode) return;
    const ms = trainerSpeed === '0.5x' ? 1600 : trainerSpeed === '2.0x' ? 500 : 950;
    const timer = window.setInterval(() => {
      setTrainerMoveIdx((prev) => {
        if (prev >= trainerMoves.length) {
          setIsTrainerPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (next >= trainerMoves.length) {
          setIsTrainerPlaying(false);
          sound.playPBChord();
        } else {
          sound.playTick();
        }
        return next;
      });
    }, ms);
    return () => window.clearInterval(timer);
  }, [isTrainerPlaying, isDrillMode, trainerSpeed, trainerMoves.length]);

  // ============================================================================
  // DRILL MODE LOGIC (Random Case + Pre-AUF + Spacebar Timer + localStorage Log)
  // ============================================================================
  const drillPool = useMemo<AlgorithmEntry[]>(() => {
    if (drillPoolType === 'learning') {
      const list = allDatabaseAlgs.filter((a) => masteryMap[a.id] === 'learning');
      return list.length > 0 ? list : filteredAlgs.length > 0 ? filteredAlgs : twoLookCfopAlgs;
    }
    if (drillPoolType === 'mastered') {
      const list = allDatabaseAlgs.filter((a) => masteryMap[a.id] === 'mastered');
      return list.length > 0 ? list : filteredAlgs.length > 0 ? filteredAlgs : twoLookCfopAlgs;
    }
    return filteredAlgs.length > 0 ? filteredAlgs : baseLevelAlgs;
  }, [drillPoolType, allDatabaseAlgs, masteryMap, filteredAlgs, twoLookCfopAlgs, baseLevelAlgs]);

  const pickNextDrillCase = useCallback(() => {
    if (drillPool.length === 0) return;
    const randomAlg = drillPool[Math.floor(Math.random() * drillPool.length)];
    const randomAuf = PRE_AUF_OPTIONS[Math.floor(Math.random() * PRE_AUF_OPTIONS.length)];
    setDrillCase(randomAlg);
    setDrillPreAuf(randomAuf);
    setDrillRevealed(false);
    setDrillTimerState('idle');
    setDrillElapsedMs(0);
    sound.playTick();
  }, [drillPool]);

  // Initialize drill case when entering Drill Mode
  useEffect(() => {
    if (isDrillMode && !drillCase) {
      pickNextDrillCase();
    }
  }, [isDrillMode, drillCase, pickNextDrillCase]);

  // Drill Cube State = Case Setup State + Pre-AUF
  const drillCubeState = useMemo(() => {
    const target = drillCase || selectedTrainerAlg;
    const setupOrMain = target.setupAlg || target.mainAlg;
    const base = getCaseState(setupOrMain, colorScheme).cubeState;
    if (!drillPreAuf) return base;
    return applySimulatorMove(cloneCube(base), drillPreAuf);
  }, [drillCase, selectedTrainerAlg, colorScheme, drillPreAuf]);

  // Optimal inverse of Pre-AUF to align before executing standard formula
  const optimalPreAufMove = useMemo(() => {
    if (!drillPreAuf) return 'Không cần AUF';
    if (drillPreAuf === 'U') return "U'";
    if (drillPreAuf === "U'") return 'U';
    return 'U2';
  }, [drillPreAuf]);

  // RAF loop for Drill Timer
  useEffect(() => {
    if (drillTimerState === 'running') {
      const update = () => {
        setDrillElapsedMs(Math.round(performance.now() - drillStartRef.current));
        drillRafRef.current = requestAnimationFrame(update);
      };
      drillRafRef.current = requestAnimationFrame(update);
      return () => {
        if (drillRafRef.current) cancelAnimationFrame(drillRafRef.current);
      };
    }
  }, [drillTimerState]);

  // Keyboard shortcuts for Trainer & Drill Mode (Spacebar & Alt+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isDrillMode) {
        if (e.altKey && (e.key === 'n' || e.key === 'N')) {
          e.preventDefault();
          pickNextDrillCase();
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          if (drillTimerState === 'running') {
            // Stop timer & reveal case
            const finalMs = Math.max(10, Math.round(performance.now() - drillStartRef.current));
            setDrillElapsedMs(finalMs);
            setDrillTimerState('stopped');
            setDrillRevealed(true);
            sound.playPBChord();
            if (drillCase) {
              setDrillHistory((prev) => [
                {
                  algId: drillCase.id,
                  timeMs: finalMs,
                  preAuf: drillPreAuf || 'None',
                  timestamp: Date.now(),
                },
                ...prev,
              ]);
            }
          } else if (drillTimerState === 'idle' || drillTimerState === 'stopped') {
            setDrillTimerState('holding');
          }
        }
      } else {
        // Inspect & Learn Mode: Space toggles 3D playback
        if (e.code === 'Space') {
          e.preventDefault();
          setIsTrainerPlaying((prev) => {
            if (!prev && trainerMoveIdx >= trainerMoves.length) {
              setTrainerMoveIdx(0);
            }
            return !prev;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (isDrillMode && e.code === 'Space' && drillTimerState === 'holding') {
        e.preventDefault();
        drillStartRef.current = performance.now();
        setDrillElapsedMs(0);
        setDrillTimerState('running');
        sound.playTick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isDrillMode,
    drillTimerState,
    drillCase,
    drillPreAuf,
    pickNextDrillCase,
    trainerMoveIdx,
    trainerMoves.length,
  ]);

  const handleCopy = (id: string, notation: string) => {
    navigator.clipboard.writeText(notation);
    sound.playTick();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Render Formula with Color-Coded Trigger Badges & Hover Tooltips
  const renderFormulaWithTriggerBadges = (formula: string) => {
    const segments = parseFormulaTriggers(formula);
    return (
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs leading-relaxed">
        {segments.map((seg, idx) => {
          if (seg.type === 'trigger' && seg.trigger) {
            return (
              <span
                key={idx}
                style={{
                  color: seg.trigger.color,
                  backgroundColor: seg.trigger.bgColor,
                  borderColor: seg.trigger.borderColor,
                }}
                title={`${seg.trigger.tag}: ${seg.trigger.pattern} — ${seg.trigger.descriptionVN}`}
                className="px-2 py-0.5 rounded-lg border font-extrabold cursor-help transition-transform hover:scale-105 inline-flex items-center gap-1 shadow-2xs"
              >
                <span>{seg.rawText}</span>
                <span className="text-[9px] uppercase tracking-tight opacity-85 font-bold">
                  [{seg.trigger.tag}]
                </span>
              </span>
            );
          }
          return (
            <span key={idx} className="font-bold text-neutral-900 px-0.5">
              {seg.rawText}
            </span>
          );
        })}
      </div>
    );
  };

  // Mastery counts for current view
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

  // Drill stats for current drillCase
  const currentDrillStats = useMemo(() => {
    if (!drillCase) return null;
    const records = drillHistory.filter((r) => r.algId === drillCase.id);
    if (records.length === 0) return null;
    const bestMs = Math.min(...records.map((r) => r.timeMs));
    const avgMs = Math.round(records.reduce((acc, r) => acc + r.timeMs, 0) / records.length);
    return { count: records.length, bestMs, avgMs };
  }, [drillCase, drillHistory]);

  return (
    <div className="w-full space-y-5 animate-fade-in pb-14">
      {/* 1. TOP FILTER BENTO BAR */}
      <section className="bg-white border border-[#EAECEF] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
        {/* Title & Back Button Row */}
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
            {/* Search Box */}
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
              className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs hover:border-neutral-300 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Timer</span>
            </button>
          </div>
        </div>

        {/* Row 2: 4-Level Switcher + Mastery Status Filter */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Level Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8F9FA] p-1.5 rounded-2xl border border-[#EAECEF]">
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
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

          {/* Mastery Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8F9FA] p-1.5 rounded-2xl border border-[#EAECEF]">
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
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all ${
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

        {/* Row 3A: CFOP Sub-Filters (2-Look vs Full CFOP) */}
        {activeLevel === 'level-2' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F1F3F5]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setCfopMode('two-look');
                  sound.playTick();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
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
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
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

        {/* Row 3C: Interactive 3-Tier Breadcrumb Explorer for Level 4 (ZBLL & COLL) */}
        {activeLevel === 'level-4' && (
          <div className="pt-3 border-t border-[#EAECEF] space-y-4">
            {/* Breadcrumb Header */}
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

            {/* Tier 1 Pills: 1. Chọn Nhóm Góc (T / U / L / Pi / H / S / AS) */}
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
                      onClick={() => handleSelectZbllRoot(root.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 ${
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

            {/* Tier 2 Cards: 2. Chọn Nhóm Màu Góc (6 COLL Sub-sets) showing COLL formula on header */}
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
                      onClick={() => {
                        setSelectedCollGroupId(group.id);
                        handleSelectAlgForTrainer(group.collAlg);
                      }}
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
        )}
      </section>

      {/* 2. ASYMMETRIC MAIN WORKSPACE: LEFT 65% BENTO CARDS / RIGHT 35% STICKY 3D ALG TRAINER & DRILL MODE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (65% -> 8 Cols on lg): Algorithm Bento Cards */}
        <div className="lg:col-span-8 space-y-4">
          {filteredAlgs.length === 0 ? (
            <div className="bg-white border border-[#EAECEF] rounded-[24px] p-12 text-center text-neutral-400 font-mono text-xs">
              Không tìm thấy công thức nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlgs.map((alg) => {
                const status: MasteryStatus = masteryMap[alg.id] || 'unlearned';
                const isSelectedInTrainer = !isDrillMode && selectedTrainerAlg.id === alg.id;
                const uniqueTriggers = extractUniqueTriggers(alg.mainAlg);

                return (
                  <div
                    key={alg.id}
                    onClick={() => handleSelectAlgForTrainer(alg)}
                    className={`bg-white rounded-[24px] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all ${
                      isSelectedInTrainer
                        ? 'border-2 border-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                        : 'border border-[#EAECEF] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-neutral-300'
                    }`}
                  >
                    {/* Card Top: Dynamic 2D SVG Diagram + Metadata + Mastery Toggle */}
                    <div className="flex items-start gap-4">
                      <DynamicCaseDiagram
                        id={alg.id}
                        mainAlg={alg.mainAlg}
                        setupAlg={alg.setupAlg}
                        category={alg.category}
                        subGroup={alg.subGroup}
                        colorScheme={colorScheme}
                        size={86}
                        customArrows={alg.arrows}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#F1F3F5] text-neutral-800 font-mono text-[10px] font-bold uppercase">
                              {alg.category}
                            </span>
                            {alg.isTwoLook && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold">
                                ★ 2-LOOK
                              </span>
                            )}
                            <span className="font-mono text-[10.5px] text-neutral-400 font-semibold">
                              Prob: {alg.probability}
                            </span>
                          </div>

                          {/* Mastery Selector Pill Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleMastery(alg.id);
                            }}
                            className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-all ${
                              status === 'mastered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : status === 'learning'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-[#F8F9FA] text-neutral-500 border-[#EAECEF] hover:text-neutral-800'
                            }`}
                            title="Nhấn để chuyển trạng thái: Chưa học -> Đang tập -> Đã thuộc"
                          >
                            {status === 'mastered'
                              ? 'Đã thuộc ✓'
                              : status === 'learning'
                                ? 'Đang tập ●'
                                : 'Chưa học ○'}
                          </button>
                        </div>

                        <h3 className="text-sm font-extrabold text-neutral-900 leading-snug">
                          {alg.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                          {alg.recognitionVN}
                        </p>
                      </div>
                    </div>

                    {/* Formula Box with Color-Coded Trigger Badges */}
                    <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                          MAIN FORMULA (WCA)
                        </span>
                        <div className="flex items-center gap-1">
                          {uniqueTriggers.map((t) => (
                            <span
                              key={t.tag}
                              style={{
                                color: t.color,
                                backgroundColor: t.bgColor,
                                borderColor: t.borderColor,
                              }}
                              title={`${t.tag}: ${t.pattern}`}
                              className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border"
                            >
                              {t.tag}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(alg.id, alg.mainAlg);
                            }}
                            className="p-1 rounded-lg hover:bg-white text-neutral-400 hover:text-neutral-900 transition-colors"
                            title="Sao chép công thức"
                          >
                            {copiedId === alg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {renderFormulaWithTriggerBadges(alg.mainAlg)}
                    </div>

                    {/* Card Footer: Full-Width Fingertrick Box + Action Button */}
                    <div className="pt-2.5 border-t border-[#F1F3F5] flex flex-col gap-2.5">
                      <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-xl px-3 py-2.5 h-auto text-xs text-neutral-600 leading-relaxed">
                        <strong className="text-neutral-900 font-semibold">Fingertrick:</strong>{' '}
                        {alg.fingertrickVN}
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadInto3D({
                              id: alg.id,
                              name: alg.name,
                              notation: alg.mainAlg,
                              category: alg.category,
                              prob: alg.probability,
                              descriptionVi: alg.recognitionVN,
                              holdingNoteVi: alg.fingertrickVN,
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Nạp vào Khối 3D</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT STICKY BENTO CARD (35% -> 4 Cols on lg): 3D ALG TRAINER & DRILL MODE */}
        <div className="lg:col-span-4 sticky top-4 h-[calc(100vh-2rem)] max-h-[760px] flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-[#EAECEF] p-4 shadow-sm gap-2">
          {/* Row 1 (Compact Header - Fixed Height): Title on left + Drill Mode button on right */}
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#EAECEF] shrink-0">
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                INTERACTIVE 3D STUDIO
              </span>
              <h3 className="text-sm font-extrabold text-neutral-900 truncate mt-0.5">
                {isDrillMode ? '⚡ Chế Độ Luyện Phản Xạ (Drill)' : '3D Alg Trainer'}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !isDrillMode;
                setIsDrillMode(next);
                setIsTrainerPlaying(false);
                if (next) {
                  pickNextDrillCase();
                } else {
                  sound.playTick();
                }
              }}
              className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
                isDrillMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[#111111] text-white border-[#111111] hover:bg-neutral-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>🎯 Luyện Phản Xạ (Drill Mode)</span>
            </button>
          </div>

          {/* ==================================================================== */}
          {/* MODE A: INSPECT & LEARN (Single Locked Viewport Layout for ALL Algs) */}
          {/* ==================================================================== */}
          {!isDrillMode ? (
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
              {/* Row 2 (Compact Case Banner - Fixed Height) */}
              <div className="flex items-center justify-between gap-2 bg-[#F8F9FA] px-2.5 py-1 rounded-xl border border-[#EAECEF] shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded bg-[#111111] text-white font-mono text-[9.5px] font-bold shrink-0">
                    {selectedTrainerAlg.category}
                  </span>
                  <span className="truncate text-sm font-bold text-neutral-900 py-0.5">
                    {selectedTrainerAlg.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-neutral-400 font-semibold hidden sm:inline">
                    {selectedTrainerAlg.probability}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onLoadInto3D({
                        id: selectedTrainerAlg.id,
                        name: selectedTrainerAlg.name,
                        notation: selectedTrainerAlg.mainAlg,
                        category: selectedTrainerAlg.category,
                        prob: selectedTrainerAlg.probability,
                        descriptionVi: selectedTrainerAlg.recognitionVN,
                        holdingNoteVi: selectedTrainerAlg.fingertrickVN,
                      })
                    }
                    className="p-1.5 rounded-lg bg-white border border-[#EAECEF] text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 transition-all"
                    title="Mở toàn màn hình trong Step 3 Interactive Solver"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 3 (3D Cube Viewport - Constrained Height: 200px / xl:220px) */}
              <ThreeCubeViewer
                currentMove={
                  trainerMoves[Math.min(trainerMoveIdx, Math.max(0, trainerMoves.length - 1))]
                    ?.move || 'U'
                }
                moveIndex={trainerMoveIdx}
                allMoves={trainerMoves}
                cameraPreset="Iso"
                initialCubeState={trainerInitialCubeState}
                activeStageHint={`${selectedTrainerAlg.category} · ${trainerMoveIdx}/${trainerMoves.length}`}
                isSolved={trainerMoveIdx >= trainerMoves.length && trainerMoves.length > 0}
                playbackSpeed={trainerSpeed}
                heightClassName="h-[200px] xl:h-[220px]"
                compact={true}
              />

              {/* Row 4 (PINNED PLAYBACK CONTROLS - ALWAYS IMMEDIATELY BELOW 3D CUBE) */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 shrink-0 py-1.5 px-1 border-y border-[#F1F3F5]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrainerPlaying(false);
                      setTrainerMoveIdx(0);
                      sound.playTick();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800"
                    title="Về đầu (|<)"
                  >
                    |&lt;
                  </button>
                  <button
                    type="button"
                    disabled={trainerMoveIdx === 0}
                    onClick={() => {
                      setIsTrainerPlaying(false);
                      setTrainerMoveIdx((p) => Math.max(0, p - 1));
                      sound.playTick();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800 disabled:opacity-40"
                    title="Lùi 1 bước (<)"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (trainerMoveIdx >= trainerMoves.length) {
                        setTrainerMoveIdx(0);
                        setIsTrainerPlaying(true);
                      } else {
                        setIsTrainerPlaying((p) => !p);
                      }
                      sound.playTick();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-neutral-800 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    {isTrainerPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isTrainerPlaying ? 'Pause' : 'Play [Space]'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={trainerMoveIdx >= trainerMoves.length}
                    onClick={() => {
                      setIsTrainerPlaying(false);
                      setTrainerMoveIdx((p) => Math.min(trainerMoves.length, p + 1));
                      sound.playTick();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] font-mono text-xs font-bold text-neutral-800 disabled:opacity-40"
                    title="Tiến 1 bước (>)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center bg-[#F8F9FA] p-0.5 rounded-lg border border-[#EAECEF] font-mono text-[10.5px]">
                  {(
                    [
                      { id: '0.5x', label: '0.5x' },
                      { id: '1.0x', label: '1x' },
                      { id: '2.0x', label: '2x' },
                    ] as const
                  ).map((spd) => (
                    <button
                      key={spd.id}
                      type="button"
                      onClick={() => setTrainerSpeed(spd.id)}
                      className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                        trainerSpeed === spd.id
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5 (Compact Formula Scrubber - Scrollable if long: max-h-[85px]) */}
              <div className="max-h-[85px] overflow-y-auto p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] shrink-0 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 font-bold leading-none">
                  <span>FORMULA SCRUBBER</span>
                  <span className="text-neutral-700">
                    Bước {trainerMoveIdx} / {trainerMoves.length}
                  </span>
                </div>

                {/* Step-by-Step Move Tokens */}
                <div className="flex flex-wrap gap-1">
                  {trainerMoves.map((m, idx) => {
                    const isDone = idx < trainerMoveIdx;
                    const isCurrent = idx === trainerMoveIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIsTrainerPlaying(false);
                          setTrainerMoveIdx(idx);
                          sound.playTick();
                        }}
                        className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all ${
                          isCurrent
                            ? 'bg-[#111111] text-white ring-1 ring-emerald-500 scale-105'
                            : isDone
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-white text-neutral-700 border border-[#EAECEF] hover:border-neutral-400'
                        }`}
                      >
                        {m.move}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6 (Compact Recognition & Fingertrick HUD: flex-1 min-h-0 overflow-y-auto) */}
              <div className="flex-1 min-h-0 overflow-y-auto text-xs p-2.5 rounded-xl bg-neutral-50 border border-[#EAECEF] space-y-1">
                <div className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-neutral-400">
                  RECOGNITION &amp; FINGERTRICK HUD
                </div>
                <p className="text-neutral-700 leading-snug">
                  <strong className="text-neutral-900">Nhận diện:</strong>{' '}
                  {selectedTrainerAlg.recognitionVN}
                </p>
                <p className="text-neutral-700 leading-snug">
                  <strong className="text-neutral-900">Fingertrick:</strong>{' '}
                  {selectedTrainerAlg.fingertrickVN}
                </p>
              </div>
            </div>
          ) : (
            /* ==================================================================== */
            /* MODE B: ALG DRILL MODE (⚡ Chế Độ Luyện Phản Xạ - Locked Viewport)    */
            /* ==================================================================== */
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-hidden">
              {/* Row 2: Drill Pool Selector */}
              <div className="grid grid-cols-3 gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#EAECEF] shrink-0">
                {[
                  { id: 'learning' as const, label: 'Đang Tập ●' },
                  { id: 'mastered' as const, label: 'Đã Thuộc ✓' },
                  { id: 'current' as const, label: 'Nhóm Hiện Tại' },
                ].map((pool) => (
                  <button
                    key={pool.id}
                    type="button"
                    onClick={() => {
                      setDrillPoolType(pool.id);
                      setTimeout(pickNextDrillCase, 0);
                    }}
                    className={`py-1 px-1.5 rounded-lg font-mono text-[10.5px] font-bold transition-all ${
                      drillPoolType === pool.id
                        ? 'bg-[#111111] text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {pool.label}
                  </button>
                ))}
              </div>

              {/* Row 3: 3D Cube Constrained Height (200px / xl:220px) */}
              <ThreeCubeViewer
                currentMove="U"
                moveIndex={0}
                allMoves={[]}
                cameraPreset="Iso"
                initialCubeState={drillCubeState}
                activeStageHint={
                  drillRevealed && drillCase
                    ? `✅ ${drillCase.name}`
                    : '❓ Giữ [Space] để bấm giờ!'
                }
                isSolved={false}
                heightClassName="h-[200px] xl:h-[220px]"
                compact={true}
              />

              {/* Row 4: Pinned Next Case & Spacebar Timer Controls */}
              <div className="flex items-center gap-1.5 shrink-0 py-1">
                <div
                  onClick={() => {
                    if (drillTimerState === 'running') {
                      const finalMs = Math.max(
                        10,
                        Math.round(performance.now() - drillStartRef.current),
                      );
                      setDrillElapsedMs(finalMs);
                      setDrillTimerState('stopped');
                      setDrillRevealed(true);
                      sound.playPBChord();
                    } else {
                      drillStartRef.current = performance.now();
                      setDrillTimerState('running');
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                    drillTimerState === 'holding'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : drillTimerState === 'running'
                        ? 'bg-[#111111] border-[#111111] text-white'
                        : 'bg-[#F8F9FA] border-[#EAECEF] text-neutral-900 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {drillTimerState === 'holding'
                        ? 'Thả Space...'
                        : drillTimerState === 'running'
                          ? 'Nhấn Space dừng!'
                          : 'Giữ [Space]'}
                    </span>
                  </div>
                  <span className="text-lg font-mono font-extrabold">
                    {(drillElapsedMs / 1000).toFixed(2)}s
                  </span>
                </div>

                <button
                  type="button"
                  onClick={pickNextDrillCase}
                  className="py-2 px-3 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-xs shrink-0"
                  title="Ca Tiếp Theo [Alt+N]"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tiếp [Alt+N]</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrillRevealed(false);
                    setDrillElapsedMs(0);
                    setDrillTimerState('idle');
                    sound.playTick();
                  }}
                  className="p-2 rounded-xl bg-white border border-[#EAECEF] hover:bg-[#F8F9FA] text-neutral-700 shrink-0"
                  title="Thử lại ca này"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 5 & 6: Answer Reveal / Hidden Card (Scrollable inside remaining height) */}
              {drillCase && (
                <div className="flex-1 min-h-0 overflow-y-auto p-3 rounded-xl bg-neutral-50 border border-[#EAECEF] space-y-2 text-xs">
                  {!drillRevealed ? (
                    <div className="text-center py-3 space-y-2">
                      <p className="text-[11px] font-mono text-neutral-500">
                        Tên trường hợp &amp; công thức đang ẩn để luyện phản xạ nhận diện.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDrillRevealed(true);
                          sound.playTick();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EAECEF] hover:border-neutral-400 text-xs font-mono font-bold text-neutral-900 inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hiện Đáp Án</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[9.5px] font-extrabold">
                          ĐÁP ÁN CHÍNH XÁC
                        </span>
                        <span className="font-mono text-[10px] font-bold text-neutral-500">
                          Pre-AUF: <strong className="text-neutral-900">{optimalPreAufMove}</strong>
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-neutral-900">
                        {drillCase.name}
                      </div>
                      {renderFormulaWithTriggerBadges(drillCase.mainAlg)}
                      <p className="text-[11px] text-neutral-600 leading-snug">
                        {drillCase.recognitionVN}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
