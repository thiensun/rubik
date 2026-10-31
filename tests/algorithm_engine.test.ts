import { describe, it, expect } from 'vitest';
import {
  applyAlg,
  applySimulatorMove,
  createSolvedCubeForScheme,
  DEFAULT_COLOR_SCHEME,
  getCaseState,
  invertAlg,
  PRESET_COLOR_SCHEMES,
} from '../src/engine/algSimulator';
import { cloneCube } from '../src/utils/cubeState';
import {
  extractUniqueTriggers,
  matchTriggerMoves,
  parseFormulaTriggers,
  TRIGGER_CATALOG,
} from '../src/engine/triggerParser';
import {
  AlgorithmEntry,
  BEGINNER_ALGS,
  CMLL_ALGS,
  COLL_ALGS,
  F2L_ALGS,
  F2L_SUBGROUPS,
  LSE_ALGS,
  OLL_ALGS,
  PLL_ALGS,
  ROUX_ALGS,
  simulateZBLLCase,
  ZBLL_ALGS,
  ZBLL_HIERARCHY_TREE,
} from '../src/data/algorithms';

describe('CubeMaster AI v2.4 - Algorithm Simulator Engine (algSimulator.ts)', () => {
  it('reverses canonical triggers and complex formulas with invertAlg()', () => {
    expect(invertAlg("(R U R' U')")).toBe("U R U' R'");
    expect(invertAlg("F (R U R' U') F'")).toBe("F U R U' R' F'");
    expect(invertAlg("M2 U M U2 M' U M2")).toBe("M2 U' M U2 M' U' M2");
    expect(invertAlg("r U R' U' r' F R F'")).toBe("F R' F' r U R U' r'");
    expect(invertAlg("(R U R' U')3")).toBe("U R U' R' U R U' R' U R U' R'");
  });

  it('supports all WCA outer, wide, slice, and rotation moves with order-4 identity', () => {
    const moveFamilies = [
      'U', 'D', 'L', 'R', 'F', 'B',
      'u', 'd', 'l', 'r', 'f', 'b',
      'Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw',
      'M', 'E', 'S',
      'x', 'y', 'z',
    ];
    const { solvedCube: solved } = createSolvedCubeForScheme(DEFAULT_COLOR_SCHEME);

    for (const move of moveFamilies) {
      let state = cloneCube(solved);
      for (let i = 0; i < 4; i++) {
        state = applySimulatorMove(state, move);
      }
      expect(state).toEqual(solved);

      // Move followed by its prime must also restore solved cube
      const afterForward = applySimulatorMove(solved, move);
      const afterInverse = applySimulatorMove(afterForward, `${move}'`);
      expect(afterInverse).toEqual(solved);
    }
  });

  it('generates exact 54-sticker state and solves back to solved state when mainAlg is applied', () => {
    const sampleAlgs = [
      "(R U R' U') R' F R2 U' R' U' (R U R') F'", // T-Perm
      "M2 U M2 U2 M2 U M2", // H-Perm
      "x R' U R' D2 R U' R' D2 R2 x'", // Aa-Perm
      "r U R' U' r' F R F'", // OLL 24
    ];

    for (const alg of sampleAlgs) {
      const caseState = getCaseState(alg, DEFAULT_COLOR_SCHEME);
      expect(caseState.topFaceColors).toHaveLength(9);
      const solvedAfterAlg = applyAlg(caseState.cubeState, alg);
      // U face should be all yellow and D face all white after applying mainAlg to caseState
      expect(solvedAfterAlg.U.every((c) => c === 'yellow')).toBe(true);
      expect(solvedAfterAlg.D.every((c) => c === 'white')).toBe(true);
    }
  });

  it('calculates automatic permutation vectors (arrows) for PLL, CMLL, COLL, and ZBLL', () => {
    // T-Perm swaps UFR(8) <-> UBR(2) and UL(3) <-> UR(5)
    const tPermState = getCaseState("(R U R' U') R' F R2 U' R' U' (R U R') F'");
    expect(tPermState.arrows).toHaveLength(2);
    const cornerSwap = tPermState.arrows.find((a) => a.pieceType === 'corner');
    const edgeSwap = tPermState.arrows.find((a) => a.pieceType === 'edge');
    expect(cornerSwap).toBeDefined();
    expect(cornerSwap?.bidirectional).toBe(true);
    expect([cornerSwap?.fromCell, cornerSwap?.toCell].sort()).toEqual([2, 8]);
    expect(edgeSwap).toBeDefined();
    expect(edgeSwap?.bidirectional).toBe(true);
    expect([edgeSwap?.fromCell, edgeSwap?.toCell].sort()).toEqual([3, 5]);

    // Ua-Perm cycles 3 edges (single-headed arrows, bidirectional: false)
    const uaPermState = getCaseState("(R U' R U) R U (R U' R' U') R2");
    expect(uaPermState.arrows).toHaveLength(3);
    expect(uaPermState.arrows.every((a) => a.pieceType === 'edge' && !a.bidirectional)).toBe(true);
  });

  it('supports customizable color schemes from settings', () => {
    const yellowBottom = PRESET_COLOR_SCHEMES['yellow-bottom'];
    const state = getCaseState("(R U R' U') (R' F R F')", yellowBottom);
    expect(state.cubeState.D[4]).toBe('yellow');
    expect(state.cubeState.U[4]).toBe('white');
  });
});

describe('CubeMaster AI v2.4 - Trigger Highlighting Parser (triggerParser.ts)', () => {
  it('identifies all 8 canonical triggers with exact hex color metadata', () => {
    const sexy = matchTriggerMoves("(R U R' U')");
    expect(sexy?.tag).toBe('Sexy Move');
    expect(sexy?.color).toBe('#059669');
    expect(sexy?.bgColor).toBe('#D1FAE5');

    const invSexy = matchTriggerMoves("(U R U' R')");
    expect(invSexy?.tag).toBe('Inverse Sexy');
    expect(invSexy?.color).toBe('#0284C7');
    expect(invSexy?.bgColor).toBe('#E0F2FE');

    const sledge = matchTriggerMoves("(R' F R F')");
    expect(sledge?.tag).toBe('Sledgehammer');
    expect(sledge?.color).toBe('#D97706');
    expect(sledge?.bgColor).toBe('#FEF3C7');

    const hedge = matchTriggerMoves("(F R' F' R)");
    expect(hedge?.tag).toBe('Hedgeslammer');
    expect(hedge?.color).toBe('#7C3AED');
    expect(hedge?.bgColor).toBe('#EDE9FE');

    const fastFlick1 = matchTriggerMoves("(R U2 R')");
    const fastFlick2 = matchTriggerMoves("(R U2' R')");
    expect(fastFlick1?.tag).toBe('Fast Flick');
    expect(fastFlick2?.tag).toBe('Fast Flick');
    expect(fastFlick1?.color).toBe('#E11D48');
    expect(fastFlick1?.bgColor).toBe('#FFE4E6');

    const leftSexy = matchTriggerMoves("(L' U' L U)");
    expect(leftSexy?.tag).toBe('Left Sexy');
    expect(leftSexy?.color).toBe('#0D9488');
    expect(leftSexy?.bgColor).toBe('#CCFBF1');

    const leftInvSexy = matchTriggerMoves("(U' L' U L)");
    expect(leftInvSexy?.tag).toBe('Left Inv Sexy');
    expect(leftInvSexy?.color).toBe('#0891B2');
    expect(leftInvSexy?.bgColor).toBe('#CFFAFE');

    const frontInsert1 = matchTriggerMoves("(F' U F)");
    const frontInsert2 = matchTriggerMoves("(F U' F')");
    expect(frontInsert1?.tag).toBe('Front Insert');
    expect(frontInsert2?.tag).toBe('Front Insert');
    expect(frontInsert1?.color).toBe('#4F46E5');
    expect(frontInsert1?.bgColor).toBe('#E0E7FF');
  });

  it('parses complex formulas with multiple triggers and extracts unique trigger badges', () => {
    const yPerm = "F R U' R' U' (R U R') F' (R U R' U') (R' F R F')";
    const segments = parseFormulaTriggers(yPerm);
    const triggerSegments = segments.filter((s) => s.type === 'trigger');
    expect(triggerSegments).toHaveLength(2);
    expect(triggerSegments[0].trigger?.tag).toBe('Sexy Move');
    expect(triggerSegments[1].trigger?.tag).toBe('Sledgehammer');

    const unique = extractUniqueTriggers(yPerm);
    expect(unique.map((u) => u.tag)).toEqual(['Sexy Move', 'Sledgehammer']);
    expect(Object.keys(TRIGGER_CATALOG)).toHaveLength(8);
  });
});

function assertValidAlgorithmEntries(entries: AlgorithmEntry[], expectedCount: number) {
  expect(entries).toHaveLength(expectedCount);
  const ids = new Set<string>();
  for (const entry of entries) {
    expect(entry.id).toBeTruthy();
    expect(ids.has(entry.id)).toBe(false);
    ids.add(entry.id);
    expect(entry.name.length).toBeGreaterThan(2);
    expect(['level-1', 'level-2', 'level-3', 'level-4']).toContain(entry.level);
    expect(entry.category.length).toBeGreaterThan(0);
    expect(entry.subGroup.length).toBeGreaterThan(0);
    expect(entry.mainAlg.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.altAlgs)).toBe(true);
    expect(entry.probability.length).toBeGreaterThan(0);
    expect(entry.recognitionVN.length).toBeGreaterThan(5);
    expect(entry.fingertrickVN.length).toBeGreaterThan(5);
  }
}

describe('CubeMaster AI v2.4 - Comprehensive Gold-Standard Algorithm Databases', () => {
  it('validates beginnerAlgs.ts (LBL Beginner Algorithms)', () => {
    assertValidAlgorithmEntries(BEGINNER_ALGS, 10);
  });

  it('validates f2lAlgs.ts (All 41 Standard F2L Cases across 6 Sub-Groups)', () => {
    expect(F2L_SUBGROUPS).toHaveLength(6);
    assertValidAlgorithmEntries(F2L_ALGS, 41);
  });

  it('validates ollAlgs.ts (All 57 Full OLL Cases + 10 Flagged 2-Look OLL Cases)', () => {
    assertValidAlgorithmEntries(OLL_ALGS, 57);
    const twoLookOlls = OLL_ALGS.filter((a) => a.isTwoLook);
    expect(twoLookOlls).toHaveLength(10);
  });

  it('validates pllAlgs.ts (All 21 Full PLL Cases + 6 Flagged 2-Look PLL Cases + Auto Arrows)', () => {
    assertValidAlgorithmEntries(PLL_ALGS, 21);
    const twoLookPlls = PLL_ALGS.filter((a) => a.isTwoLook);
    expect(twoLookPlls).toHaveLength(6);
    expect(twoLookPlls.map((p) => p.id).sort()).toEqual([
      'pll-h',
      'pll-t',
      'pll-ua',
      'pll-ub',
      'pll-y',
      'pll-z',
    ]);
    for (const pll of PLL_ALGS) {
      expect(pll.arrows).toBeDefined();
      expect(pll.arrows!.length).toBeGreaterThan(0);
    }
  });

  it('validates rouxAlgs.ts (9 LSE Cases + 42 CMLL Cases = 51 Total Roux Entries)', () => {
    assertValidAlgorithmEntries(LSE_ALGS, 9);
    assertValidAlgorithmEntries(CMLL_ALGS, 42);
    expect(ROUX_ALGS).toHaveLength(51);
  });

  it('validates zbllHierarchy.ts (3-Tier Tree: 7 Root Sets -> 42 COLL Groups -> 504 ZBLL Cases)', () => {
    expect(ZBLL_HIERARCHY_TREE).toHaveLength(7);
    for (const root of ZBLL_HIERARCHY_TREE) {
      expect(root.collGroups).toHaveLength(6);
      expect(root.totalCOLLGroups).toBe(6);
      expect(root.totalZBLLCases).toBe(72);
      for (const group of root.collGroups) {
        expect(group.zbllCases).toHaveLength(12);
      }
    }
    assertValidAlgorithmEntries(COLL_ALGS, 42);
    assertValidAlgorithmEntries(ZBLL_ALGS, 504);

    // Verify dynamic simulation helper for ZBLL drill-down:
    // Top edges must be oriented (yellow) in ZBLL/COLL, and applying mainAlg solves the cube
    const sampleZBLL = ZBLL_HIERARCHY_TREE[0].collGroups[0].zbllCases[0];
    const sim = simulateZBLLCase(sampleZBLL);
    expect([sim.topFaceColors[1], sim.topFaceColors[3], sim.topFaceColors[4], sim.topFaceColors[5], sim.topFaceColors[7]]).toEqual([
      'yellow', 'yellow', 'yellow', 'yellow', 'yellow',
    ]);
    const solvedAfterZBLL = applyAlg(sim.cubeState, sampleZBLL.mainAlg);
    expect(solvedAfterZBLL.U.every((c) => c === 'yellow')).toBe(true);
    expect(solvedAfterZBLL.D.every((c) => c === 'white')).toBe(true);

    // Global Invariant Check across ALL OCLL 21..27, PLL (21), COLL (42), and ZBLL (504):
    // 1) OLL 22 Pi specifically must have a Yellow Cross (5 yellow stickers), Left headlights, and Right F/B stickers
    const oll22 = getCaseState("R U2 R2 U' R2 U' R2 U2 R");
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => oll22.topFaceColors[i] === 'yellow')).toEqual([1, 3, 4, 5, 7]);
    expect(oll22.sideStickers.left[0]).toBe('yellow');
    expect(oll22.sideStickers.left[2]).toBe('yellow');
    expect(oll22.sideStickers.bottom[2]).toBe('yellow');
    expect(oll22.sideStickers.top[2]).toBe('yellow');

    // 2) Every single OCLL (OLL 21..27), COLL (42), and ZBLL (504) must preserve the Yellow Cross on U (1,3,4,5,7)
    for (const ocll of OLL_ALGS.slice(0, 7)) {
      const s = getCaseState(ocll.mainAlg);
      expect([1, 3, 4, 5, 7].every((idx) => s.topFaceColors[idx] === 'yellow')).toBe(true);
    }
    for (const pll of PLL_ALGS) {
      const s = getCaseState(pll.mainAlg);
      expect(s.topFaceColors.every((c) => c === 'yellow')).toBe(true);
    }
    for (const coll of COLL_ALGS) {
      const s = getCaseState(coll.mainAlg);
      expect([1, 3, 4, 5, 7].every((idx) => s.topFaceColors[idx] === 'yellow')).toBe(true);
    }
    for (const zbll of ZBLL_ALGS) {
      const s = getCaseState(zbll.mainAlg);
      expect([1, 3, 4, 5, 7].every((idx) => s.topFaceColors[idx] === 'yellow')).toBe(true);
    }
  });
});
