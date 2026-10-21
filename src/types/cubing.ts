export type PenaltyType = 'none' | '+2' | 'dnf';

export interface SolveRecord {
  id: number;
  timeMs: number; // Raw solve time in milliseconds
  penalty: PenaltyType;
  scramble: string;
  timestamp: number;
  moves?: number;
  tps?: number;
  comment?: string;
  isPB?: boolean;
}

export interface SessionStats {
  bestTime: number | null;
  bestSolveId: number | null;
  ao5: number | null;
  ao5Best: number | null;
  ao12: number | null;
  ao12Best: number | null;
  mean: number | null;
  stdDev: number | null;
  totalSolves: number;
  validSolvesCount: number;
}

export type SolverLevelId = 'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4';

export interface SolverLevelInfo {
  id: SolverLevelId;
  name: string;
  badge: string;
  badgeColor: string;
  stagesCount: number | string;
  algorithmsCount: string;
  avgMoves: string;
  benchmark: string;
  pipeline: string;
  description: string;
}
