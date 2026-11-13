// Master Barrel Export for CubeMaster AI v2.4 Gold-Standard Algorithm Database
import { BEGINNER_ALGS, AlgorithmEntry } from './beginnerAlgs';
import { F2L_ALGS } from './f2lAlgs';
import { OLL_ALGS } from './ollAlgs';
import { PLL_ALGS } from './pllAlgs';
import { ROUX_ALGS } from './rouxAlgs';
import { COLL_ALGS, ZBLL_ALGS } from './zbllHierarchy';
import { CUBE_2X2_ALGS } from './cube2x2Algs';
import { CUBE_4X4_ALGS } from './cube4x4Algs';

export * from './beginnerAlgs';
export * from './f2lAlgs';
export * from './ollAlgs';
export * from './pllAlgs';
export * from './rouxAlgs';
export * from './zbllHierarchy';
export * from './cube2x2Algs';
export * from './cube4x4Algs';

const ALL_DB_ALGS: AlgorithmEntry[] = [
  ...BEGINNER_ALGS,
  ...F2L_ALGS,
  ...OLL_ALGS,
  ...PLL_ALGS,
  ...ROUX_ALGS,
  ...COLL_ALGS,
  ...ZBLL_ALGS,
  ...CUBE_2X2_ALGS,
  ...CUBE_4X4_ALGS,
];

function stripMoves(str: string): string {
  return str
    .replace(/[()[\]]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Matches a solver stage's ID, category, or move sequence against our Gold-Standard Algorithm Database
 * so Step 3 ("Solve & Learn" -> 3D Solution) renders the exact database case name, trigger-parenthesized
 * formula, 2D/isometric diagram metadata, and Vietnamese recognition/fingertrick tips.
 */
export function matchAlgorithmDatabaseForStage(
  stageId: string,
  stageMovesStr: string,
): AlgorithmEntry | undefined {
  const cleanMoves = stripMoves(stageMovesStr);
  const idLower = stageId.toLowerCase();

  // 1. Direct normalized formula match (with or without leading/trailing U/U'/U2 AUF adjustments)
  if (cleanMoves) {
    const tokens = cleanMoves.split(' ').filter(Boolean);
    const strippedAUF = [...tokens];
    while (strippedAUF.length > 2 && /^U['2]?$/.test(strippedAUF[0])) {
      strippedAUF.shift();
    }
    while (strippedAUF.length > 2 && /^U['2]?$/.test(strippedAUF[strippedAUF.length - 1])) {
      strippedAUF.pop();
    }
    const coreMoves = strippedAUF.join(' ');

    for (const entry of ALL_DB_ALGS) {
      const entryClean = stripMoves(entry.mainAlg);
      if (entryClean === cleanMoves || (coreMoves.length >= 5 && entryClean === coreMoves)) {
        return entry;
      }
      for (const alt of entry.altAlgs) {
        const altClean = stripMoves(alt);
        if (altClean === cleanMoves || (coreMoves.length >= 5 && altClean === coreMoves)) {
          return entry;
        }
      }
    }

    // 2. Substring match for composite last-layer or F2L solver sequences
    if (idLower.includes('oll') || idLower === 'lbl-4' || idLower === 'lbl-5' || idLower === 'stage-3' || idLower === 'cfop-3') {
      const ollPool = idLower === 'lbl-4' ? BEGINNER_ALGS : OLL_ALGS;
      for (const entry of ollPool) {
        const entryClean = stripMoves(entry.mainAlg);
        if (entryClean.length >= 7 && cleanMoves.includes(entryClean)) {
          return entry;
        }
      }
    }

    if (idLower.includes('pll') || idLower === 'lbl-6' || idLower === 'lbl-7' || idLower === 'stage-4' || idLower === 'cfop-4') {
      for (const entry of PLL_ALGS) {
        const entryClean = stripMoves(entry.mainAlg);
        if (entryClean.length >= 9 && cleanMoves.includes(entryClean)) {
          return entry;
        }
        for (const alt of entry.altAlgs) {
          const altClean = stripMoves(alt);
          if (altClean.length >= 9 && cleanMoves.includes(altClean)) {
            return entry;
          }
        }
      }
    }
  }

  // 3. Stage ID canonical fallback to gold-standard representative database entry
  if (idLower === 'lbl-1') {
    return BEGINNER_ALGS.find((a) => a.id === 'lbl-daisy-to-cross');
  }
  if (idLower === 'stage-1' || idLower === 'cfop-1' || idLower === 'stage-2' || idLower === 'cfop-2') {
    return undefined;
  }
  if (idLower === 'lbl-2') {
    return BEGINNER_ALGS.find((a) => a.id === 'lbl-corner-right-trigger');
  }
  if (idLower === 'lbl-3') {
    return BEGINNER_ALGS.find((a) => a.id === 'lbl-middle-edge-right');
  }
  if (idLower === 'lbl-4') {
    return BEGINNER_ALGS.find((a) => a.id === 'lbl-yellow-cross');
  }
  if (idLower === 'lbl-5' || idLower === 'stage-3' || idLower === 'cfop-3') {
    return OLL_ALGS.find((a) => a.id === 'oll-27') || BEGINNER_ALGS.find((a) => a.id === 'lbl-sune-edge-swap');
  }
  if (idLower === 'lbl-6') {
    return PLL_ALGS.find((a) => a.id === 'pll-y') || BEGINNER_ALGS.find((a) => a.id === 'lbl-niklas-corner-position');
  }
  if (idLower === 'lbl-7') {
    return PLL_ALGS.find((a) => a.id === 'pll-z') || PLL_ALGS.find((a) => a.id === 'pll-ua');
  }
  if (idLower === 'zbll-1') {
    return F2L_ALGS.find((a) => a.id === 'f2l-1');
  }
  if (idLower === 'stage-4' || idLower === 'cfop-4') {
    return PLL_ALGS.find((a) => a.id === 'pll-t');
  }
  if (idLower === 'zbll-2') {
    return ZBLL_ALGS[0];
  }

  return undefined;
}

