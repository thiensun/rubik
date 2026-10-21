import { SolveRecord, SessionStats, PenaltyType } from '../types/cubing';

// Format milliseconds to 08.42 or 1:04.25
export function formatTime(ms: number | null | undefined, penalty: PenaltyType = 'none'): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '--.--';
  if (penalty === 'dnf') return 'DNF';

  const effectiveMs = penalty === '+2' ? ms + 2000 : ms;
  const totalSeconds = Math.floor(effectiveMs / 1000);
  const hundredths = Math.floor((effectiveMs % 1000) / 10);

  const pad = (n: number, width = 2) => n.toString().padStart(width, '0');

  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainderSeconds = totalSeconds % 60;
    return `${minutes}:${pad(remainderSeconds)}.${pad(hundredths)}`;
  }

  return `${pad(totalSeconds)}.${pad(hundredths)}`;
}

// Get effective milliseconds accounting for penalty
export function getEffectiveTime(solve: SolveRecord): number {
  if (solve.penalty === 'dnf') return Infinity;
  if (solve.penalty === '+2') return solve.timeMs + 2000;
  return solve.timeMs;
}

// Calculate standard WCA Ao5
export function calculateAo5(solves: SolveRecord[]): number | null {
  if (solves.length < 5) return null;
  const slice = solves.slice(0, 5);
  const dnfs = slice.filter((s) => s.penalty === 'dnf').length;
  if (dnfs > 1) return null; // DNF

  const times = slice.map(getEffectiveTime).sort((a, b) => a - b);
  // drop lowest (index 0) and highest (index 4)
  const middle = times.slice(1, 4);
  const sum = middle.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / 3);
}

// Calculate standard WCA Ao12
export function calculateAo12(solves: SolveRecord[]): number | null {
  if (solves.length < 12) return null;
  const slice = solves.slice(0, 12);
  const dnfs = slice.filter((s) => s.penalty === 'dnf').length;
  if (dnfs > 1) return null;

  const times = slice.map(getEffectiveTime).sort((a, b) => a - b);
  // drop lowest (index 0) and highest (index 11)
  const middle = times.slice(1, 11);
  const sum = middle.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / 10);
}

// Compute all session stats
export function computeSessionStats(solves: SolveRecord[]): SessionStats {
  if (!solves.length) {
    return {
      bestTime: null,
      bestSolveId: null,
      ao5: null,
      ao5Best: null,
      ao12: null,
      ao12Best: null,
      mean: null,
      stdDev: null,
      totalSolves: 0,
      validSolvesCount: 0,
    };
  }

  const validSolves = solves.filter((s) => s.penalty !== 'dnf');

  let bestTime: number | null = null;
  let bestSolveId: number | null = null;

  validSolves.forEach((s) => {
    const t = getEffectiveTime(s);
    if (bestTime === null || t < bestTime) {
      bestTime = t;
      bestSolveId = s.id;
    }
  });

  const ao5 = calculateAo5(solves);
  const ao12 = calculateAo12(solves);

  // Calculate historical best Ao5 and Ao12 across all windows
  let ao5Best: number | null = null;
  for (let i = 0; i <= solves.length - 5; i++) {
    const val = calculateAo5(solves.slice(i, i + 5));
    if (val !== null && (ao5Best === null || val < ao5Best)) {
      ao5Best = val;
    }
  }

  let ao12Best: number | null = null;
  for (let i = 0; i <= solves.length - 12; i++) {
    const val = calculateAo12(solves.slice(i, i + 12));
    if (val !== null && (ao12Best === null || val < ao12Best)) {
      ao12Best = val;
    }
  }

  // Mean & Standard Deviation
  let mean: number | null = null;
  let stdDev: number | null = null;

  if (validSolves.length > 0) {
    const sum = validSolves.reduce((acc, s) => acc + getEffectiveTime(s), 0);
    mean = Math.round(sum / validSolves.length);

    const varianceSum = validSolves.reduce((acc, s) => {
      const diff = getEffectiveTime(s) - mean!;
      return acc + diff * diff;
    }, 0);
    stdDev = Math.round(Math.sqrt(varianceSum / validSolves.length));
  }

  return {
    bestTime,
    bestSolveId,
    ao5,
    ao5Best,
    ao12,
    ao12Best,
    mean,
    stdDev,
    totalSolves: solves.length,
    validSolvesCount: validSolves.length,
  };
}

// Initial 24 solves matching reference image session
export const SEED_SOLVES: SolveRecord[] = [
  {
    id: 24,
    timeMs: 8420,
    penalty: 'none',
    scramble: "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R",
    timestamp: Date.now() - 1000 * 60 * 2,
    moves: 56,
    tps: 6.65,
  },
  {
    id: 23,
    timeMs: 7190,
    penalty: 'none',
    scramble: "R U R' U' R' F R2 U' R' U' R U R' F'",
    timestamp: Date.now() - 1000 * 60 * 7,
    moves: 58,
    tps: 8.06,
    isPB: true,
  },
  {
    id: 22,
    timeMs: 9050,
    penalty: 'none',
    scramble: "F2 D2 B2 U2 F2 L2 R2 U B2 D' F' L' U' R F2 D2 L' B R'",
    timestamp: Date.now() - 1000 * 60 * 12,
    moves: 61,
    tps: 6.74,
  },
  {
    id: 21,
    timeMs: 10120,
    penalty: '+2',
    scramble: "U2 F2 R2 B2 D' L2 U' B2 U' L2 U B' R2 B' F2 U B' F' L2",
    timestamp: Date.now() - 1000 * 60 * 17,
    moves: 59,
    tps: 5.82,
    comment: 'AUF Penalty',
  },
  {
    id: 20,
    timeMs: 8870,
    penalty: 'none',
    scramble: "B2 L2 D' B2 R2 D' F2 D B2 L2 D2 L' F' R2 D' U' B R2 F'",
    timestamp: Date.now() - 1000 * 60 * 22,
    moves: 54,
    tps: 6.08,
  },
  {
    id: 19,
    timeMs: 9210,
    penalty: 'none',
    scramble: "L2 B2 D2 R2 D2 F2 U L2 U' B2 L2 F' R' U' L2 B' D F2 R'",
    timestamp: Date.now() - 1000 * 60 * 28,
    moves: 62,
    tps: 6.73,
  },
  {
    id: 18,
    timeMs: 9340,
    penalty: 'none',
    scramble: "R2 D2 B2 R2 F2 D R2 U' L2 B2 U' F' L' D2 U B2 R' D' F2",
    timestamp: Date.now() - 1000 * 60 * 33,
    moves: 57,
    tps: 6.1,
  },
  {
    id: 17,
    timeMs: 8950,
    penalty: 'none',
    scramble: "D2 F2 L2 D2 B2 U' R2 D' B2 U B2 R' F' D2 L' U' B' D' R'",
    timestamp: Date.now() - 1000 * 60 * 38,
    moves: 55,
    tps: 6.14,
  },
  {
    id: 16,
    timeMs: 9680,
    penalty: 'none',
    scramble: "U2 R2 B2 U2 F2 D' L2 U B2 D2 L2 B' U' R2 B2 D L' B' F2",
    timestamp: Date.now() - 1000 * 60 * 43,
    moves: 63,
    tps: 6.5,
  },
  {
    id: 15,
    timeMs: 8820,
    penalty: 'none',
    scramble: "F2 R2 U2 F2 D' B2 U' L2 B2 D' F2 L' B' U R B' U2 L' F'",
    timestamp: Date.now() - 1000 * 60 * 48,
    moves: 58,
    tps: 6.57,
  },
  {
    id: 14,
    timeMs: 9410,
    penalty: 'none',
    scramble: "D2 L2 F2 D2 R2 U' B2 D' R2 U' L2 F' D' R' F' U2 B' D' L2",
    timestamp: Date.now() - 1000 * 60 * 53,
    moves: 60,
    tps: 6.37,
  },
  {
    id: 13,
    timeMs: 9150,
    penalty: 'none',
    scramble: "B2 U2 L2 U2 F2 D' L2 U F2 U' B2 R' D' B2 U' R' F' L2 D'",
    timestamp: Date.now() - 1000 * 60 * 58,
    moves: 59,
    tps: 6.44,
  },
  {
    id: 12,
    timeMs: 9890,
    penalty: 'none',
    scramble: "L2 D2 B2 R2 U' B2 D' L2 D' B2 U' F' R2 D' U' B2 R' D' F'",
    timestamp: Date.now() - 1000 * 60 * 63,
    moves: 64,
    tps: 6.47,
  },
  {
    id: 11,
    timeMs: 8760,
    penalty: 'none',
    scramble: "R2 U2 F2 D2 R2 B2 U' R2 D' L2 U' B' D' L2 U' F' R2 D' L'",
    timestamp: Date.now() - 1000 * 60 * 68,
    moves: 56,
    tps: 6.39,
  },
  {
    id: 10,
    timeMs: 9540,
    penalty: 'none',
    scramble: "D2 B2 L2 U2 F2 D' R2 D' B2 U' R2 F' U' B' D2 L' U' B' R'",
    timestamp: Date.now() - 1000 * 60 * 73,
    moves: 61,
    tps: 6.39,
  },
  {
    id: 9,
    timeMs: 9230,
    penalty: 'none',
    scramble: "U2 B2 R2 D2 F2 U' L2 U' B2 D' B2 L' D' R' F2 D2 L' B' U'",
    timestamp: Date.now() - 1000 * 60 * 78,
    moves: 58,
    tps: 6.28,
  },
  {
    id: 8,
    timeMs: 9780,
    penalty: 'none',
    scramble: "F2 D2 R2 U2 B2 D' L2 U' F2 D2 L2 B' D' F2 U L' B' D' R'",
    timestamp: Date.now() - 1000 * 60 * 83,
    moves: 62,
    tps: 6.33,
  },
  {
    id: 7,
    timeMs: 9450,
    penalty: 'none',
    scramble: "L2 U2 B2 D2 R2 U' B2 U' L2 D' B2 F' D' R' U2 L' B' D' F'",
    timestamp: Date.now() - 1000 * 60 * 88,
    moves: 59,
    tps: 6.24,
  },
  {
    id: 6,
    timeMs: 9980,
    penalty: 'none',
    scramble: "B2 D2 L2 U2 F2 D' R2 D' B2 U' R2 F' L' U2 B2 D L' B' F2",
    timestamp: Date.now() - 1000 * 60 * 93,
    moves: 65,
    tps: 6.51,
  },
  {
    id: 5,
    timeMs: 9620,
    penalty: 'none',
    scramble: "R2 D2 F2 U2 B2 D' L2 U B2 D2 L2 B' U' R2 B2 D L' B' F2",
    timestamp: Date.now() - 1000 * 60 * 98,
    moves: 60,
    tps: 6.23,
  },
  {
    id: 4,
    timeMs: 10150,
    penalty: 'none',
    scramble: "D2 F2 L2 D2 B2 U' R2 D' B2 U B2 R' F' D2 L' U' B' D' R'",
    timestamp: Date.now() - 1000 * 60 * 103,
    moves: 63,
    tps: 6.2,
  },
  {
    id: 3,
    timeMs: 9840,
    penalty: 'none',
    scramble: "U2 R2 B2 U2 F2 D' L2 U B2 D2 L2 B' U' R2 B2 D L' B' F2",
    timestamp: Date.now() - 1000 * 60 * 108,
    moves: 61,
    tps: 6.2,
  },
  {
    id: 2,
    timeMs: 10210,
    penalty: 'none',
    scramble: "F2 R2 U2 F2 D' B2 U' L2 B2 D' F2 L' B' U R B' U2 L' F'",
    timestamp: Date.now() - 1000 * 60 * 113,
    moves: 64,
    tps: 6.26,
  },
  {
    id: 1,
    timeMs: 10450,
    penalty: 'none',
    scramble: "D2 L2 F2 D2 R2 U' B2 D' R2 U' L2 F' D' R' F' U2 B' D' L2",
    timestamp: Date.now() - 1000 * 60 * 118,
    moves: 66,
    tps: 6.31,
  },
];
