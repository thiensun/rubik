import {
  OLL_ALGS,
  PLL_ALGS,
  ORTEGA_OLL_ALGS,
  ORTEGA_PBL_ALGS,
  CLL_2X2_ALGS,
  OLL_PARITY_4X4_ALGS,
  PLL_PARITY_4X4_ALGS,
} from '../../data/algorithms';
import { invertAlg } from '../../core/simulator';
import { CubeSize } from '../../types/cubing';
import { expandAlgorithmNotation, generateScrambleForSize } from '../../utils/cubeState';

export type TimerMode =
  | '2x2_FULL'
  | '2x2_FACE'
  | '2x2_OLL'
  | '2x2_PBL_CLL'
  | 'FULL'
  | 'CROSS'
  | 'F2L'
  | 'OLL'
  | 'PLL'
  | '4x4_FULL'
  | '4x4_CENTERS'
  | '4x4_EDGES'
  | '4x4_3X3'
  | '4x4_PARITY';

export const TIMER_MODES_BY_SIZE: Record<CubeSize, Array<{ id: TimerMode; label: string }>> = {
  2: [
    { id: '2x2_FULL', label: 'Full Solve' },
    { id: '2x2_FACE', label: '1st Face' },
    { id: '2x2_OLL', label: 'OLL (2x2)' },
    { id: '2x2_PBL_CLL', label: 'PBL/CLL' },
  ],
  3: [
    { id: 'FULL', label: 'Full CFOP' },
    { id: 'CROSS', label: 'Cross' },
    { id: 'F2L', label: 'F2L' },
    { id: 'OLL', label: 'OLL' },
    { id: 'PLL', label: 'PLL' },
  ],
  4: [
    { id: '4x4_FULL', label: 'Full Yau' },
    { id: '4x4_CENTERS', label: 'Cross/Centers' },
    { id: '4x4_EDGES', label: 'Edge Pairing' },
    { id: '4x4_3X3', label: '3x3 Stage' },
    { id: '4x4_PARITY', label: 'OLL/PLL Parity' },
  ],
};

export const TIMER_MODES = TIMER_MODES_BY_SIZE[3];

export const ALL_TIMER_MODES: TimerMode[] = [
  ...TIMER_MODES_BY_SIZE[2].map((m) => m.id),
  ...TIMER_MODES_BY_SIZE[3].map((m) => m.id),
  ...TIMER_MODES_BY_SIZE[4].map((m) => m.id),
];

export function getDefaultTimerModeForSize(cubeSize: CubeSize): TimerMode {
  if (cubeSize === 2) return '2x2_FULL';
  if (cubeSize === 4) return '4x4_FULL';
  return 'FULL';
}

const AUF_OPTIONS = ['', 'U', "U'", 'U2'] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function invertRandomAlgFromPool(pool: readonly { mainAlg: string }[]): string {
  const chosen = pickRandom(pool);
  const expanded = expandAlgorithmNotation(chosen.mainAlg)
    .split(/\s+/)
    .filter((tok) => tok && !/^[xyz]['2]?$/i.test(tok))
    .join(' ');

  const inverted = invertAlg(expanded);
  const preAuf = pickRandom(AUF_OPTIONS);
  const postAuf = pickRandom(AUF_OPTIONS);

  return [preAuf, inverted, postAuf].filter(Boolean).join(' ').trim();
}

/**
 * Generates a dynamic cube-size & substep-aware scramble:
 * - 2x2x2: Full Solve / 1st Face (11-move <U,R,F>), OLL (2x2), PBL/CLL
 * - 3x3x3: Full CFOP / Cross / F2L (20-move WCA), OLL, PLL
 * - 4x4x4: Full Yau / Cross/Centers / Edge Pairing (40-move WCA), 3x3 Stage (20-move 3x3), OLL/PLL Parity
 */
export function generateScrambleForMode(cubeSize: CubeSize, mode: TimerMode): string {
  if (cubeSize === 2) {
    if (mode === '2x2_OLL') return invertRandomAlgFromPool(ORTEGA_OLL_ALGS);
    if (mode === '2x2_PBL_CLL') return invertRandomAlgFromPool([...ORTEGA_PBL_ALGS, ...CLL_2X2_ALGS]);
    return generateScrambleForSize(2);
  }

  if (cubeSize === 4) {
    if (mode === '4x4_3X3') return generateScrambleForSize(3);
    if (mode === '4x4_PARITY') return invertRandomAlgFromPool([...OLL_PARITY_4X4_ALGS, ...PLL_PARITY_4X4_ALGS]);
    return generateScrambleForSize(4);
  }

  if (mode === 'OLL') return invertRandomAlgFromPool(OLL_ALGS);
  if (mode === 'PLL') return invertRandomAlgFromPool(PLL_ALGS);
  return generateScrambleForSize(3);
}
