// Authentic Rubik's Cube Solver & Stage Decomposition Engine
import {
  CubeNetState,
  CubeColor,
  FaceKey,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  isCubeSolved,
  rotateWhiteToBottom,
} from './cubeState';
import { SolverLevelId } from '../types/cubing';
import { SolutionStage, SolutionSubStep, createMoves } from './solutionStages';
import { validateCubeState } from './cubeValidator';
import { matchAlgorithmDatabaseForStage, OLL_ALGS, PLL_ALGS } from '../data/algorithms';
import { expandAlgorithmNotation } from './cubeState';

export interface MoveStep {
  move: string;
  explanation: string;
  stageName: string;
}

export interface SolveResult {
  success: boolean;
  moves: string[];
  stages: SolutionStage[];
  errorMessage?: string;
}

// Move sequence optimizer: cancels redundant and inverse moves
export function optimizeMoves(moves: string[]): string[] {
  if (moves.length === 0) return [];

  const moveVal: Record<string, number> = { '': 1, '2': 2, "'": 3 };
  const valToMod = ['', '', '2', "'"];

  const stack: { face: string; amount: number }[] = [];

  for (const raw of moves) {
    if (!raw) continue;
    const m = raw.trim();
    if (!m) continue;
    const face = m[0];
    const mod = m.slice(1);
    const amount = moveVal[mod] || 1;

    if (stack.length > 0 && stack[stack.length - 1].face === face) {
      const top = stack.pop()!;
      const totalAmount = (top.amount + amount) % 4;
      if (totalAmount !== 0) {
        stack.push({ face, amount: totalAmount });
      }
    } else {
      stack.push({ face, amount });
    }
  }

  const result: string[] = [];
  for (const item of stack) {
    const modStr = valToMod[item.amount];
    result.push(`${item.face}${modStr}`);
  }

  if (result.length < moves.length) {
    return optimizeMoves(result);
  }

  return result;
}

export function applyMovesSequence(state: CubeNetState, moves: string[]): CubeNetState {
  let cur = state;
  for (const m of moves) {
    cur = applyMove(cur, m);
  }
  return cur;
}

// Helper: Check if White Cross on D is solved
export function isCrossSolved(cube: CubeNetState): boolean {
  return (
    cube.D[1] === 'white' && cube.F[7] === 'green' &&
    cube.D[3] === 'white' && cube.L[7] === 'orange' &&
    cube.D[5] === 'white' && cube.R[7] === 'red' &&
    cube.D[7] === 'white' && cube.B[7] === 'blue'
  );
}

// Helper: Check if First Two Layers (F2L) are solved
export function isF2LSolved(cube: CubeNetState): boolean {
  if (!isCrossSolved(cube)) return false;
  if (!cube.D.every((c) => c === 'white')) return false;

  const sideFaces: FaceKey[] = ['F', 'B', 'L', 'R'];
  for (const f of sideFaces) {
    const center = cube[f][4];
    // Rows 1 and 2: indices 3, 4, 5, 6, 7, 8
    if (
      cube[f][3] !== center ||
      cube[f][5] !== center ||
      cube[f][6] !== center ||
      cube[f][7] !== center ||
      cube[f][8] !== center
    ) {
      return false;
    }
  }
  return true;
}

// Helper: Check if OLL (Yellow face) is solved
export function isOLLSolved(cube: CubeNetState): boolean {
  return isF2LSolved(cube) && cube.U.every((c) => c === 'yellow');
}

// Helper: Check if First Layer (White face + side bottom row) is solved
export function isFirstLayerSolved(cube: CubeNetState): boolean {
  if (!isCrossSolved(cube)) return false;
  if (!cube.D.every((c) => c === 'white')) return false;
  const sideFaces: FaceKey[] = ['F', 'B', 'L', 'R'];
  for (const f of sideFaces) {
    const center = cube[f][4];
    if (cube[f][6] !== center || cube[f][7] !== center || cube[f][8] !== center) {
      return false;
    }
  }
  return true;
}

// Helper: Check if Yellow Cross on U is formed (while preserving F2L)
export function isYellowCrossSolved(cube: CubeNetState): boolean {
  return (
    isF2LSolved(cube) &&
    cube.U[1] === 'yellow' &&
    cube.U[3] === 'yellow' &&
    cube.U[5] === 'yellow' &&
    cube.U[7] === 'yellow'
  );
}

// ----------------------------------------------------
// 1. Cross Solver (White Cross on D)
// ----------------------------------------------------
const ALL_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

export function solveWhiteCross(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isCrossSolved(startCube)) {
    return { moves: [], state: startCube };
  }

  // Cross pieces in order: DF (white-green), DR (white-red), DB (white-blue), DL (white-orange)
  const crossPieces = [
    { name: 'DF', check: (c: CubeNetState) => c.D[1] === 'white' && c.F[7] === 'green' },
    { name: 'DR', check: (c: CubeNetState) => c.D[5] === 'white' && c.R[7] === 'red' },
    { name: 'DB', check: (c: CubeNetState) => c.D[7] === 'white' && c.B[7] === 'blue' },
    { name: 'DL', check: (c: CubeNetState) => c.D[3] === 'white' && c.L[7] === 'orange' },
  ];

  let cur = startCube;
  const path: string[] = [];

  // Try to solve pairs of cross edges together first for a concise 5-to-8 move White Cross
  const targetGroups = [
    [crossPieces[0], crossPieces[1]],
    [crossPieces[0], crossPieces[1], crossPieces[2], crossPieces[3]],
  ];

  let groupSuccess = true;
  let groupCur = startCube;
  const groupPath: string[] = [];

  for (const group of targetGroups) {
    if (group.every((p) => p.check(groupCur))) continue;

    interface Node {
      c: CubeNetState;
      p: string[];
      lastFace: string;
    }

    let queue: Node[] = [{ c: groupCur, p: [], lastFace: '' }];
    let found = false;

    for (let depth = 1; depth <= 4 && !found; depth++) {
      const nextQueue: Node[] = [];
      for (const node of queue) {
        for (const m of ALL_MOVES) {
          const f = m[0];
          if (f === node.lastFace) continue;
          const nextCube = applyMove(node.c, m);
          const nextPath = [...node.p, m];
          if (group.every((p) => p.check(nextCube))) {
            groupCur = nextCube;
            groupPath.push(...nextPath);
            found = true;
            break;
          }
          if (depth < 4) {
            nextQueue.push({ c: nextCube, p: nextPath, lastFace: f });
          }
        }
        if (found) break;
      }
      queue = nextQueue;
    }

    if (!found) {
      groupSuccess = false;
      break;
    }
  }

  if (groupSuccess && isCrossSolved(groupCur)) {
    return { moves: optimizeMoves(groupPath), state: groupCur };
  }

  for (let i = 0; i < crossPieces.length; i++) {
    if (crossPieces.slice(0, i + 1).every((p) => p.check(cur))) {
      continue;
    }

    // BFS to depth <= 5 that solves crossPieces[0..i]
    interface Node {
      c: CubeNetState;
      p: string[];
      lastFace: string;
    }

    let queue: Node[] = [{ c: cur, p: [], lastFace: '' }];
    let found = false;

    for (let depth = 1; depth <= 5 && !found; depth++) {
      const nextQueue: Node[] = [];

      for (const node of queue) {
        for (const m of ALL_MOVES) {
          const f = m[0];
          if (f === node.lastFace) continue;

          const nextCube = applyMove(node.c, m);
          const nextPath = [...node.p, m];

          const allGood = crossPieces.slice(0, i + 1).every((p) => p.check(nextCube));
          if (allGood) {
            cur = nextCube;
            path.push(...nextPath);
            found = true;
            break;
          }

          if (depth < 5) {
            nextQueue.push({ c: nextCube, p: nextPath, lastFace: f });
          }
        }
        if (found) break;
      }
      queue = nextQueue;
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

// ----------------------------------------------------
// 2. F2L Solver (White Corners + Middle Edges)
// ----------------------------------------------------
interface CornerDef {
  name: string;
  colors: CubeColor[]; // [white, side1, side2]
  isSolved: (c: CubeNetState) => boolean;
  isInSlot: (c: CubeNetState) => boolean;
  popMoves: string;
  trigger: string;
  targetUFace: FaceKey;
}

const CORNER_DEFS: CornerDef[] = [
  {
    name: 'DFR',
    colors: ['white', 'green', 'red'],
    isSolved: (c) => c.D[2] === 'white' && c.F[8] === 'green' && c.R[6] === 'red',
    isInSlot: (c) => {
      const colors = [c.D[2], c.F[8], c.R[6]].sort().join(',');
      return colors === ['green', 'red', 'white'].sort().join(',');
    },
    popMoves: "R U R'",
    trigger: "R U R' U'",
    targetUFace: 'R',
  },
  {
    name: 'DFL',
    colors: ['white', 'green', 'orange'],
    isSolved: (c) => c.D[0] === 'white' && c.F[6] === 'green' && c.L[8] === 'orange',
    isInSlot: (c) => {
      const colors = [c.D[0], c.F[6], c.L[8]].sort().join(',');
      return colors === ['green', 'orange', 'white'].sort().join(',');
    },
    popMoves: "L' U' L",
    trigger: "L' U' L U",
    targetUFace: 'L',
  },
  {
    name: 'DBR',
    colors: ['white', 'blue', 'red'],
    isSolved: (c) => c.D[8] === 'white' && c.B[6] === 'blue' && c.R[8] === 'red',
    isInSlot: (c) => {
      const colors = [c.D[8], c.B[6], c.R[8]].sort().join(',');
      return colors === ['blue', 'red', 'white'].sort().join(',');
    },
    popMoves: "R' U' R",
    trigger: "R' U' R U",
    targetUFace: 'B',
  },
  {
    name: 'DBL',
    colors: ['white', 'blue', 'orange'],
    isSolved: (c) => c.D[6] === 'white' && c.B[8] === 'blue' && c.L[6] === 'orange',
    isInSlot: (c) => {
      const colors = [c.D[6], c.B[8], c.L[6]].sort().join(',');
      return colors === ['blue', 'orange', 'white'].sort().join(',');
    },
    popMoves: "L U L'",
    trigger: "L U L' U'",
    targetUFace: 'L',
  },
];

export function solveWhiteCorners(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  let cur = startCube;
  const path: string[] = [];

  const DIRECT_CORNER_INSERTS: Record<string, string[]> = {
    DFR: [
      "R U R'",
      "U R U' R'",
      "F' U' F",
      "U' F' U F",
      "R U2 R' U' R U R'",
      "R U R' U'",
    ],
    DFL: [
      "L' U' L",
      "U' L' U L",
      "F U F'",
      "U F U' F'",
      "L' U2 L U L' U' L",
      "L' U' L U",
    ],
    DBR: [
      "R' U' R",
      "U' R' U R",
      "B U B'",
      "U B U' B'",
      "R' U2 R U R' U' R",
      "R' U' R U",
    ],
    DBL: [
      "L U L'",
      "U L U' L'",
      "B' U' B",
      "U' B' U B",
      "L U2 L' U' L U L'",
      "L U L' U'",
    ],
  };

  for (let i = 0; i < CORNER_DEFS.length; i++) {
    const def = CORNER_DEFS[i];
    if (def.isSolved(cur)) continue;

    // Check if the corner for this def is currently trapped in any bottom slot
    const targetColors = [...def.colors].sort().join(',');

    for (const slot of CORNER_DEFS) {
      if (slot.isSolved(cur)) continue;
      let slotColors: string[] = [];
      if (slot.name === 'DFR') slotColors = [cur.D[2], cur.F[8], cur.R[6]];
      else if (slot.name === 'DFL') slotColors = [cur.D[0], cur.F[6], cur.L[8]];
      else if (slot.name === 'DBR') slotColors = [cur.D[8], cur.B[6], cur.R[8]];
      else if (slot.name === 'DBL') slotColors = [cur.D[6], cur.B[8], cur.L[6]];

      if (slotColors.sort().join(',') === targetColors) {
        for (const m of slot.popMoves.split(' ')) {
          cur = applyMove(cur, m);
          path.push(m);
        }
        break;
      }
    }

    // Try direct 3-to-7 move inserts first (so we never repeat Sexy Move 4 or 5 times!)
    let solved = false;
    const candidateAlgs = DIRECT_CORNER_INSERTS[def.name] || [def.trigger];

    for (const u of ['', 'U', 'U2', "U'"]) {
      for (const alg of candidateAlgs) {
        let test = cur;
        const testMoves: string[] = [];
        if (u) {
          test = applyMove(test, u);
          testMoves.push(u);
        }
        for (const m of alg.split(' ')) {
          test = applyMove(test, m);
          testMoves.push(m);
        }
        const prevCornersOk = CORNER_DEFS.slice(0, i).every((c) => c.isSolved(test));
        if (def.isSolved(test) && isCrossSolved(test) && prevCornersOk) {
          cur = test;
          path.push(...testMoves);
          solved = true;
          break;
        }
      }
      if (solved) break;
    }

    // Fallback to trigger loop if needed
    if (!solved) {
      for (const u of ['', 'U', 'U2', "U'"]) {
        let test = cur;
        const testMoves: string[] = [];
        if (u) {
          test = applyMove(test, u);
          testMoves.push(u);
        }
        for (let rep = 1; rep <= 5; rep++) {
          for (const m of def.trigger.split(' ')) {
            test = applyMove(test, m);
            testMoves.push(m);
          }
          if (def.isSolved(test)) {
            cur = test;
            path.push(...testMoves);
            solved = true;
            break;
          }
        }
        if (solved) break;
      }
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

interface MiddleEdgeDef {
  name: string;
  colors: [CubeColor, CubeColor]; // [frontOrBack, leftOrRight]
  isSolved: (c: CubeNetState) => boolean;
  isInSlot: (c: CubeNetState) => boolean;
  insertFromFace1: string; // when color 1 is on side
  insertFromFace2: string; // when color 2 is on side
  popMoves: string;
}

const MIDDLE_EDGE_DEFS: MiddleEdgeDef[] = [
  {
    name: 'FR',
    colors: ['green', 'red'],
    isSolved: (c) => c.F[5] === 'green' && c.R[3] === 'red',
    isInSlot: (c) => {
      const p = [c.F[5], c.R[3]].sort().join(',');
      return p === ['green', 'red'].sort().join(',');
    },
    // When green matches F: insert to right: U R U' R' U' F' U F
    insertFromFace1: "U R U' R' U' F' U F",
    // When red matches R: insert to left: U' F' U F U R U' R'
    insertFromFace2: "U' F' U F U R U' R'",
    popMoves: "U R U' R' U' F' U F",
  },
  {
    name: 'FL',
    colors: ['green', 'orange'],
    isSolved: (c) => c.F[3] === 'green' && c.L[5] === 'orange',
    isInSlot: (c) => {
      const p = [c.F[3], c.L[5]].sort().join(',');
      return p === ['green', 'orange'].sort().join(',');
    },
    // When green matches F: insert to left: U' L' U L U F U' F'
    insertFromFace1: "U' L' U L U F U' F'",
    // When orange matches L: insert to right: U F U' F' U' L' U L
    insertFromFace2: "U F U' F' U' L' U L",
    popMoves: "U' L' U L U F U' F'",
  },
  {
    name: 'BR',
    colors: ['blue', 'red'],
    isSolved: (c) => c.B[3] === 'blue' && c.R[5] === 'red',
    isInSlot: (c) => {
      const p = [c.B[3], c.R[5]].sort().join(',');
      return p === ['blue', 'red'].sort().join(',');
    },
    // When blue matches B: insert to left: U' R' U R U B U' B'
    insertFromFace1: "U' R' U R U B U' B'",
    // When red matches R: insert to right: U B U' B' U' R' U R
    insertFromFace2: "U B U' B' U' R' U R",
    popMoves: "U' R' U R U B U' B'",
  },
  {
    name: 'BL',
    colors: ['blue', 'orange'],
    isSolved: (c) => c.B[5] === 'blue' && c.L[3] === 'orange',
    isInSlot: (c) => {
      const p = [c.B[5], c.L[3]].sort().join(',');
      return p === ['blue', 'orange'].sort().join(',');
    },
    // When blue matches B: insert to right: U L U' L' U' B' U B
    insertFromFace1: "U L U' L' U' B' U B",
    // When orange matches L: insert to left: U' B' U B U L U' L'
    insertFromFace2: "U' B' U B U L U' L'",
    popMoves: "U L U' L' U' B' U B",
  },
];

export function solveMiddleEdges(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  let cur = startCube;
  const path: string[] = [];

  let safety = 25;
  while (!MIDDLE_EDGE_DEFS.every((e) => e.isSolved(cur)) && safety > 0) {
    safety--;

    let inserted = false;

    // Check if any edge can be inserted directly from U
    for (const def of MIDDLE_EDGE_DEFS) {
      if (def.isSolved(cur)) continue;

      for (const u of ['', 'U', 'U2', "U'"]) {
        for (const alg of [def.insertFromFace1, def.insertFromFace2]) {
          let test = cur;
          const testMoves: string[] = [];
          if (u) {
            test = applyMove(test, u);
            testMoves.push(u);
          }
          for (const m of alg.split(' ')) {
            test = applyMove(test, m);
            testMoves.push(m);
          }

          if (def.isSolved(test)) {
            // Check that previous solved corners and edges were not broken
            const cornersOk = CORNER_DEFS.every((c) => c.isSolved(test));
            const edgesOk = MIDDLE_EDGE_DEFS.every((e) => {
              if (e.isSolved(cur)) return e.isSolved(test);
              return true;
            });

            if (cornersOk && edgesOk) {
              cur = test;
              path.push(...testMoves);
              inserted = true;
              break;
            }
          }
        }
        if (inserted) break;
      }
      if (inserted) break;
    }

    if (!inserted) {
      // Pop one unsolved edge from middle layer
      for (const def of MIDDLE_EDGE_DEFS) {
        if (!def.isSolved(cur)) {
          for (const m of def.popMoves.split(' ')) {
            cur = applyMove(cur, m);
            path.push(m);
          }
          break;
        }
      }
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

export interface F2LPairSolveItem {
  slotId: string;
  labelVi: string;
  moves: string[];
}

export function solveF2LPairs(startCube: CubeNetState): {
  moves: string[];
  state: CubeNetState;
  pairSteps: F2LPairSolveItem[];
} {
  if (isF2LSolved(startCube)) {
    return { moves: [], state: startCube, pairSteps: [] };
  }

  interface F2LSlotSpec {
    slotId: string;
    labelVi: string;
    cornerIdx: number; // index in CORNER_DEFS & MIDDLE_EDGE_DEFS (0:FR, 1:FL, 2:BR, 3:BL)
    isPairSolved: (c: CubeNetState) => boolean;
    extractMoves: string[];
    pairAlgs: string[];
  }

  const F2L_SLOTS: F2LSlotSpec[] = [
    {
      slotId: 'FR',
      labelVi: 'Pair 1: FR (Xanh lá - Đỏ)',
      cornerIdx: 0,
      isPairSolved: (c) => CORNER_DEFS[0].isSolved(c) && MIDDLE_EDGE_DEFS[0].isSolved(c),
      extractMoves: ["R U R'", "R U' R'", "F' U' F", "F' U F"],
      pairAlgs: [
        "R U R'",
        "U R U' R'",
        "F' U' F",
        "U' F' U F",
        "R U' R'",
        "F' U F",
        "U' R U R' U R U' R'",
        "U' R U' R' U R U R'",
        "U' R U2 R' U R U' R'",
        "U R U' R' U' F' U F",
        "U' F' U F U R U' R'",
        "U F' U' F U' F' U F",
        "U F' U F U' F' U' F",
        "U F' U2 F U' F' U F",
        "R U R' U' R U R'",
        "R U' R' U R U' R'",
        "F' U' F U F' U' F",
        "F' U F U' F' U F",
        "R U2 R' U' R U R'",
        "F' U2 F U F' U' F",
        "U2 R U R' U R U' R'",
        "U2 F' U' F U' F' U F",
        "R U R' U2 R U' R' U R U' R'",
        "F' U' F U2 F' U F U' F' U F",
        "R U' R' U2 F' U' F",
        "F' U F U2 R U R'",
      ],
    },
    {
      slotId: 'FL',
      labelVi: 'Pair 2: FL (Xanh lá - Cam)',
      cornerIdx: 1,
      isPairSolved: (c) => CORNER_DEFS[1].isSolved(c) && MIDDLE_EDGE_DEFS[1].isSolved(c),
      extractMoves: ["L' U' L", "L' U L", "F U F'", "F U' F'"],
      pairAlgs: [
        "L' U' L",
        "U' L' U L",
        "F U F'",
        "U F U' F'",
        "L' U L",
        "F U' F'",
        "U L' U' L U' L' U L",
        "U L' U L U' L' U' L",
        "U L' U2 L U' L' U L",
        "U' L' U L U F U' F'",
        "U F U' F' U' L' U L",
        "U' F U F' U F U' F'",
        "U' F U' F' U F U F'",
        "U' F U2 F' U F U' F'",
        "L' U' L U L' U' L",
        "L' U L U' L' U L",
        "F U F' U' F U F'",
        "F U' F' U F U' F'",
        "L' U2 L U L' U' L",
        "F U2 F' U' F U F'",
        "U2 L' U' L U' L' U L",
        "U2 F U F' U F U' F'",
        "L' U' L U2 L' U L U' L' U L",
        "F U F' U2 F U' F' U F U' F'",
        "L' U L U2 F U F'",
        "F U' F' U2 L' U' L",
      ],
    },
    {
      slotId: 'BR',
      labelVi: 'Pair 3: BR (Xanh dương - Đỏ)',
      cornerIdx: 2,
      isPairSolved: (c) => CORNER_DEFS[2].isSolved(c) && MIDDLE_EDGE_DEFS[2].isSolved(c),
      extractMoves: ["R' U' R", "R' U R", "B U B'", "B U' B'"],
      pairAlgs: [
        "R' U' R",
        "U' R' U R",
        "B U B'",
        "U B U' B'",
        "R' U R",
        "B U' B'",
        "U R' U' R U' R' U R",
        "U R' U R U' R' U' R",
        "U R' U2 R U' R' U R",
        "U' R' U R U B U' B'",
        "U B U' B' U' R' U R",
        "U' B U B' U B U' B'",
        "U' B U' B' U B U B'",
        "U' B U2 B' U B U' B'",
        "R' U' R U R' U' R",
        "R' U R U' R' U R",
        "B U B' U' B U B'",
        "B U' B' U B U' B'",
        "R' U2 R U R' U' R",
        "B U2 B' U' B U B'",
        "U2 R' U' R U' R' U R",
        "U2 B U B' U B U' B'",
        "R' U' R U2 R' U R U' R' U R",
        "B U B' U2 B U' B' U B U' B'",
        "R' U R U2 B U B'",
        "B U' B' U2 R' U' R",
      ],
    },
    {
      slotId: 'BL',
      labelVi: 'Pair 4: BL (Xanh dương - Cam)',
      cornerIdx: 3,
      isPairSolved: (c) => CORNER_DEFS[3].isSolved(c) && MIDDLE_EDGE_DEFS[3].isSolved(c),
      extractMoves: ["L U L'", "L U' L'", "B' U' B", "B' U B"],
      pairAlgs: [
        "L U L'",
        "U L U' L'",
        "B' U' B",
        "U' B' U B",
        "L U' L'",
        "B' U B",
        "U' L U L' U L U' L'",
        "U' L U' L' U L U L'",
        "U' L U2 L' U L U' L'",
        "U L U' L' U' B' U B",
        "U' B' U B U L U' L'",
        "U B' U' B U' B' U B",
        "U B' U B U' B' U' B",
        "U B' U2 B U' B' U B",
        "L U L' U' L U L'",
        "L U' L' U L U' L'",
        "B' U' B U B' U' B",
        "B' U B U' B' U B",
        "L U2 L' U' L U L'",
        "B' U2 B U B' U' B",
        "U2 L U L' U L U' L'",
        "U2 B' U' B U' B' U B",
        "L U L' U2 L U' L' U L U' L'",
        "B' U' B U2 B' U B U' B' U B",
        "L U' L' U2 B' U' B",
        "B' U B U2 L U L'",
      ],
    },
  ];

  let cur = startCube;
  const totalMoves: string[] = [];
  const pairSteps: F2LPairSolveItem[] = [];

  for (let sIdx = 0; sIdx < F2L_SLOTS.length; sIdx++) {
    const slot = F2L_SLOTS[sIdx];
    if (slot.isPairSolved(cur)) {
      pairSteps.push({
        slotId: slot.slotId,
        labelVi: slot.labelVi,
        moves: [],
      });
      continue;
    }

    const prevSlotsSolved = (c: CubeNetState) =>
      isCrossSolved(c) && F2L_SLOTS.slice(0, sIdx).every((prev) => prev.isPairSolved(c));

    let pairMoves: string[] = [];
    let pairDone = false;

    // 1. Pre-extract any piece of this pair that is trapped in an unsolved slot (current or later slot)
    let workState = cur;
    const prePopMoves: string[] = [];
    const targetCornerColors = [...CORNER_DEFS[slot.cornerIdx].colors].sort().join(',');
    const targetEdgeColors = [...MIDDLE_EDGE_DEFS[slot.cornerIdx].colors].sort().join(',');

    // If corner is in an unsolved slot, extract it to U
    for (let otherIdx = sIdx; otherIdx < 4; otherIdx++) {
      const cSlot = CORNER_DEFS[otherIdx];
      let slotCColors: string[] = [];
      if (cSlot.name === 'DFR') slotCColors = [workState.D[2], workState.F[8], workState.R[6]];
      else if (cSlot.name === 'DFL') slotCColors = [workState.D[0], workState.F[6], workState.L[8]];
      else if (cSlot.name === 'DBR') slotCColors = [workState.D[8], workState.B[6], workState.R[8]];
      else if (cSlot.name === 'DBL') slotCColors = [workState.D[6], workState.B[8], workState.L[6]];

      if (slotCColors.sort().join(',') === targetCornerColors) {
        // Choose an extract move that does NOT push the target edge (if on U) into this slot!
        for (const uTry of ['', 'U', 'U2', "U'"]) {
          const extAlg = F2L_SLOTS[otherIdx].extractMoves[0];
          let tPop = uTry ? applyMove(workState, uTry) : workState;
          for (const m of extAlg.split(' ')) {
            tPop = applyMove(tPop, m);
          }
          const eSlot = MIDDLE_EDGE_DEFS[otherIdx];
          let eInSlot: string[] = [];
          if (eSlot.name === 'FR') eInSlot = [tPop.F[5], tPop.R[3]];
          else if (eSlot.name === 'FL') eInSlot = [tPop.F[3], tPop.L[5]];
          else if (eSlot.name === 'BR') eInSlot = [tPop.B[3], tPop.R[5]];
          else if (eSlot.name === 'BL') eInSlot = [tPop.B[5], tPop.L[3]];
          if (eInSlot.sort().join(',') !== targetEdgeColors && prevSlotsSolved(tPop)) {
            if (uTry) prePopMoves.push(uTry);
            prePopMoves.push(...extAlg.split(' '));
            workState = tPop;
            break;
          }
        }
        break;
      }
    }

    // If edge is in an unsolved slot, extract it to U without pushing the corner back down
    for (let otherIdx = sIdx; otherIdx < 4; otherIdx++) {
      const eSlot = MIDDLE_EDGE_DEFS[otherIdx];
      let slotEColors: string[] = [];
      if (eSlot.name === 'FR') slotEColors = [workState.F[5], workState.R[3]];
      else if (eSlot.name === 'FL') slotEColors = [workState.F[3], workState.L[5]];
      else if (eSlot.name === 'BR') slotEColors = [workState.B[3], workState.R[5]];
      else if (eSlot.name === 'BL') slotEColors = [workState.B[5], workState.L[3]];

      if (slotEColors.sort().join(',') === targetEdgeColors) {
        let extractedEdge = false;
        for (const uTry of ['', 'U', 'U2', "U'"]) {
          for (const extAlg of F2L_SLOTS[otherIdx].extractMoves) {
            let tPop = uTry ? applyMove(workState, uTry) : workState;
            for (const m of extAlg.split(' ')) {
              tPop = applyMove(tPop, m);
            }
            // Ensure neither edge nor corner is trapped in any bottom/middle slot after pop
            let cornerStillOnU = true;
            for (let k = sIdx; k < 4; k++) {
              const cs = CORNER_DEFS[k];
              let cc: string[] = [];
              if (cs.name === 'DFR') cc = [tPop.D[2], tPop.F[8], tPop.R[6]];
              else if (cs.name === 'DFL') cc = [tPop.D[0], tPop.F[6], tPop.L[8]];
              else if (cs.name === 'DBR') cc = [tPop.D[8], tPop.B[6], tPop.R[8]];
              else if (cs.name === 'DBL') cc = [tPop.D[6], tPop.B[8], tPop.L[6]];
              if (cc.sort().join(',') === targetCornerColors) {
                cornerStillOnU = false;
                break;
              }
            }
            let edgeOut = true;
            for (let k = sIdx; k < 4; k++) {
              const es = MIDDLE_EDGE_DEFS[k];
              let ec: string[] = [];
              if (es.name === 'FR') ec = [tPop.F[5], tPop.R[3]];
              else if (es.name === 'FL') ec = [tPop.F[3], tPop.L[5]];
              else if (es.name === 'BR') ec = [tPop.B[3], tPop.R[5]];
              else if (es.name === 'BL') ec = [tPop.B[5], tPop.L[3]];
              if (ec.sort().join(',') === targetEdgeColors) {
                edgeOut = false;
                break;
              }
            }
            if (cornerStillOnU && edgeOut && prevSlotsSolved(tPop)) {
              if (uTry) prePopMoves.push(uTry);
              prePopMoves.push(...extAlg.split(' '));
              workState = tPop;
              extractedEdge = true;
              break;
            }
          }
          if (extractedEdge) break;
        }
        break;
      }
    }

    // 2. Now both corner and edge are on U! Try 3- or 4-move basic insert first, then 7/8-move pairAlgs
    const basicInserts = slot.extractMoves; // [R U R', R U' R', F' U' F, F' U F] for FR, etc.
    for (const u of ['', 'U', 'U2', "U'"]) {
      for (const alg of slot.pairAlgs) {
        let test = workState;
        const mList = [...prePopMoves];
        if (u) {
          test = applyMove(test, u);
          mList.push(u);
        }
        for (const m of alg.split(' ')) {
          test = applyMove(test, m);
          mList.push(m);
        }
        if (slot.isPairSolved(test) && prevSlotsSolved(test)) {
          cur = test;
          pairMoves = optimizeMoves(mList);
          pairDone = true;
          break;
        }
      }
      if (pairDone) break;
    }

    // 3. Universal U-layer pair setup + basic insert:
    // Any corner + edge on U can be paired by (uPre + 3/7-move hide/split) + (uMid + 3-move insert)!
    if (!pairDone) {
      const setupMovesForSlot: Record<string, string[]> = {
        FR: [
          "R U R'", "R U' R'", "R U2 R'", "F' U' F", "F' U F", "F' U2 F",
          "R U2 R' U' R U R'", "F' U2 F U F' U' F", "R U R' U' R U R'", "F' U' F U F' U' F",
        ],
        FL: [
          "L' U' L", "L' U L", "L' U2 L", "F U F'", "F U' F'", "F U2 F'",
          "L' U2 L U L' U' L", "F U2 F' U' F U F'", "L' U' L U L' U' L", "F U F' U' F U F'",
        ],
        BR: [
          "R' U' R", "R' U R", "R' U2 R", "B U B'", "B U' B'", "B U2 B'",
          "R' U2 R U R' U' R", "B U2 B' U' B U B'", "R' U' R U R' U' R", "B U B' U' B U B'",
        ],
        BL: [
          "L U L'", "L U' L'", "L U2 L'", "B' U' B", "B' U B", "B' U2 B",
          "L U2 L' U' L U L'", "B' U2 B U B' U' B", "L U L' U' L U L'", "B' U' B U B' U' B",
        ],
      };
      const setups = setupMovesForSlot[slot.slotId] || slot.extractMoves;

      for (const uPre of ['', 'U', 'U2', "U'"]) {
        for (const setup of setups) {
          let afterSetup = workState;
          const setupList = [...prePopMoves];
          if (uPre) {
            afterSetup = applyMove(afterSetup, uPre);
            setupList.push(uPre);
          }
          for (const m of setup.split(' ')) {
            afterSetup = applyMove(afterSetup, m);
            setupList.push(m);
          }
          if (!prevSlotsSolved(afterSetup)) continue;

          for (const uMid of ['', 'U', 'U2', "U'"]) {
            for (const ins of basicInserts) {
              let test = afterSetup;
              const mList = [...setupList];
              if (uMid) {
                test = applyMove(test, uMid);
                mList.push(uMid);
              }
              for (const m of ins.split(' ')) {
                test = applyMove(test, m);
                mList.push(m);
              }
              if (slot.isPairSolved(test) && prevSlotsSolved(test)) {
                cur = test;
                pairMoves = optimizeMoves(mList);
                pairDone = true;
                break;
              }
            }
            if (pairDone) break;
          }
          if (pairDone) break;
        }
        if (pairDone) break;
      }
    }

    // 4. Per-slot guaranteed fallback: solve this slot's corner then this slot's edge
    if (!pairDone) {
      const cDef = CORNER_DEFS[slot.cornerIdx];
      const eDef = MIDDLE_EDGE_DEFS[slot.cornerIdx];
      let slotState = cur;
      const slotFallback: string[] = [];

      // Pop corner if trapped
      const targetCColors = [...cDef.colors].sort().join(',');
      for (let otherIdx = sIdx; otherIdx < 4; otherIdx++) {
        const sDef = CORNER_DEFS[otherIdx];
        let sColors: string[] = [];
        if (sDef.name === 'DFR') sColors = [slotState.D[2], slotState.F[8], slotState.R[6]];
        else if (sDef.name === 'DFL') sColors = [slotState.D[0], slotState.F[6], slotState.L[8]];
        else if (sDef.name === 'DBR') sColors = [slotState.D[8], slotState.B[6], slotState.R[8]];
        else if (sDef.name === 'DBL') sColors = [slotState.D[6], slotState.B[8], slotState.L[6]];
        if (sColors.sort().join(',') === targetCColors && !cDef.isSolved(slotState)) {
          for (const m of sDef.popMoves.split(' ')) {
            slotState = applyMove(slotState, m);
            slotFallback.push(m);
          }
          break;
        }
      }

      if (!cDef.isSolved(slotState)) {
        const directAlgs: Record<string, string[]> = {
          DFR: ["R U R'", "U R U' R'", "F' U' F", "U' F' U F", "R U2 R' U' R U R'"],
          DFL: ["L' U' L", "U' L' U L", "F U F'", "U F U' F'", "L' U2 L U L' U' L"],
          DBR: ["R' U' R", "U' R' U R", "B U B'", "U B U' B'", "R' U2 R U R' U' R"],
          DBL: ["L U L'", "U L U' L'", "B' U' B", "U' B' U B", "L U2 L' U' L U L'"],
        };
        let cSolved = false;
        for (const u of ['', 'U', 'U2', "U'"]) {
          for (const alg of directAlgs[cDef.name] || []) {
            let test = u ? applyMove(slotState, u) : slotState;
            const mList = u ? [u] : [];
            for (const m of alg.split(' ')) {
              test = applyMove(test, m);
              mList.push(m);
            }
            if (cDef.isSolved(test) && prevSlotsSolved(test)) {
              slotState = test;
              slotFallback.push(...mList);
              cSolved = true;
              break;
            }
          }
          if (cSolved) break;
        }
        if (!cSolved) {
          for (const u of ['', 'U', 'U2', "U'"]) {
            let test = u ? applyMove(slotState, u) : slotState;
            const mList = u ? [u] : [];
            for (let rep = 1; rep <= 5; rep++) {
              for (const m of cDef.trigger.split(' ')) {
                test = applyMove(test, m);
                mList.push(m);
              }
              if (cDef.isSolved(test) && prevSlotsSolved(test)) {
                slotState = test;
                slotFallback.push(...mList);
                cSolved = true;
                break;
              }
            }
            if (cSolved) break;
          }
        }
      }

      // Now solve this slot's edge
      const targetEColors = [...eDef.colors].sort().join(',');
      if (!eDef.isSolved(slotState)) {
        for (let otherIdx = sIdx; otherIdx < 4; otherIdx++) {
          const mDef = MIDDLE_EDGE_DEFS[otherIdx];
          let eColors: string[] = [];
          if (mDef.name === 'FR') eColors = [slotState.F[5], slotState.R[3]];
          else if (mDef.name === 'FL') eColors = [slotState.F[3], slotState.L[5]];
          else if (mDef.name === 'BR') eColors = [slotState.B[3], slotState.R[5]];
          else if (mDef.name === 'BL') eColors = [slotState.B[5], slotState.L[3]];
          if (eColors.sort().join(',') === targetEColors) {
            for (const m of mDef.popMoves.split(' ')) {
              slotState = applyMove(slotState, m);
              slotFallback.push(m);
            }
            break;
          }
        }

        let eSolved = false;
        for (const u of ['', 'U', 'U2', "U'"]) {
          for (const alg of [eDef.insertFromFace1, eDef.insertFromFace2]) {
            let test = u ? applyMove(slotState, u) : slotState;
            const mList = u ? [u] : [];
            for (const m of alg.split(' ')) {
              test = applyMove(test, m);
              mList.push(m);
            }
            if (slot.isPairSolved(test) && prevSlotsSolved(test)) {
              slotState = test;
              slotFallback.push(...mList);
              eSolved = true;
              break;
            }
          }
          if (eSolved) break;
        }
      }

      if (slot.isPairSolved(slotState) && prevSlotsSolved(slotState)) {
        cur = slotState;
        pairMoves = optimizeMoves(slotFallback);
        pairDone = true;
      }
    }

    if (pairDone) {
      totalMoves.push(...pairMoves);
      pairSteps.push({
        slotId: slot.slotId,
        labelVi: slot.labelVi,
        moves: pairMoves,
      });
    }
  }

  // Safety fallback if any edge/corner wasn't covered
  if (!isF2LSolved(cur)) {
    const remCorners = solveWhiteCorners(cur);
    const remEdges = solveMiddleEdges(remCorners.state);
    const fallbackMoves = optimizeMoves([...remCorners.moves, ...remEdges.moves]);
    totalMoves.push(...fallbackMoves);
    cur = remEdges.state;
  }

  return {
    moves: optimizeMoves(totalMoves),
    state: cur,
    pairSteps,
  };
}

export function solveF2L(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  const res = solveF2LPairs(startCube);
  return {
    moves: res.moves,
    state: res.state,
  };
}

// ----------------------------------------------------
// 3a. Yellow Cross Solver (OLL Step 3a)
// ----------------------------------------------------
export function solveYellowCross(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  const isYellowCross = (c: CubeNetState) =>
    c.U[1] === 'yellow' && c.U[3] === 'yellow' && c.U[5] === 'yellow' && c.U[7] === 'yellow';

  if (isYellowCross(startCube)) {
    return { moves: [], state: startCube };
  }

  let cur = startCube;
  const path: string[] = [];
  const crossAlgs = [
    "F R U R' U' F'",
    "F U R U' R' F'",
    "F R U R' U' F' U2 F U R U' R' F'",
  ];

  let crossDone = false;
  for (const u of ['', 'U', 'U2', "U'"]) {
    for (const alg of crossAlgs) {
      let test = cur;
      const testMoves: string[] = [];
      if (u) {
        test = applyMove(test, u);
        testMoves.push(u);
      }
      for (const m of alg.split(' ')) {
        test = applyMove(test, m);
        testMoves.push(m);
      }
      if (isYellowCross(test)) {
        cur = test;
        path.push(...testMoves);
        crossDone = true;
        break;
      }
    }
    if (crossDone) break;
  }

  return { moves: optimizeMoves(path), state: cur };
}

// ----------------------------------------------------
// 3b. Orient Yellow Corners (OLL Step 3b - Sune / Antisune)
// ----------------------------------------------------
export function solveYellowCorners(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isOLLSolved(startCube)) {
    return { moves: [], state: startCube };
  }

  let cur = startCube;
  const path: string[] = [];
  const cornerAlgs = [
    "R U R' U R U2 R'",           // OLL 27 Sune (7)
    "R U2 R' U' R U' R'",         // OLL 26 Antisune (7)
    "R U R' U R U' R' U R U2 R'", // OLL 21 H (11)
    "R U2 R2 U' R2 U' R2 U2 R",   // OLL 22 Pi (9)
    "R2 D R' U2 R D' R' U2 R'",   // OLL 23 U (9)
    "L F R' F' L' F R F'",        // OLL 24 T (8)
    "F' L F R' F' L' F R",        // OLL 25 L (8)
  ];

  let cornerDone = false;

  // Check depth 1
  for (const u1 of ['', 'U', 'U2', "U'"]) {
    for (const a1 of cornerAlgs) {
      let t1 = cur;
      const m1: string[] = [];
      if (u1) { t1 = applyMove(t1, u1); m1.push(u1); }
      for (const m of a1.split(' ')) { t1 = applyMove(t1, m); m1.push(m); }

      if (isOLLSolved(t1)) {
        cur = t1;
        path.push(...m1);
        cornerDone = true;
        break;
      }
    }
    if (cornerDone) break;
  }

  // If not depth 1, check depth 2
  if (!cornerDone) {
    for (const u1 of ['', 'U', 'U2', "U'"]) {
      for (const a1 of cornerAlgs) {
        let t1 = cur;
        const m1: string[] = [];
        if (u1) { t1 = applyMove(t1, u1); m1.push(u1); }
        for (const m of a1.split(' ')) { t1 = applyMove(t1, m); m1.push(m); }

        for (const u2 of ['', 'U', 'U2', "U'"]) {
          for (const a2 of cornerAlgs) {
            let t2 = t1;
            const m2: string[] = [...m1];
            if (u2) { t2 = applyMove(t2, u2); m2.push(u2); }
            for (const m of a2.split(' ')) { t2 = applyMove(t2, m); m2.push(m); }

            if (isOLLSolved(t2)) {
              cur = t2;
              path.push(...m2);
              cornerDone = true;
              break;
            }
          }
          if (cornerDone) break;
        }
        if (cornerDone) break;
      }
      if (cornerDone) break;
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

// ----------------------------------------------------
// 3. OLL Solver (Orient Last Layer - Yellow Face: Both 2-Look and Full 1-Look)
// ----------------------------------------------------
const STANDARD_OUTER_MOVE_REGEX = /^[UDLRFB]['2]?$/;

function expandToOuterFaceMoves(rawAlg: string): string[] | null {
  const expanded = expandAlgorithmNotation(rawAlg);
  const tokens = expanded
    .split(/\s+/)
    .filter((t) => Boolean(t) && !/^y['2]?$/.test(t));

  if (tokens.length > 0 && tokens.every((t) => STANDARD_OUTER_MOVE_REGEX.test(t))) {
    return tokens;
  }
  return null;
}

const EXTRA_OUTER_FACE_OLL_ALGS: { name: string; alg: string }[] = [
  // OCLL 7 cases
  { name: 'OLL 21 H', alg: "R U R' U R U' R' U R U2 R'" },
  { name: 'OLL 22 Pi', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { name: 'OLL 23 U (Headlights)', alg: "R2 D R' U2 R D' R' U2 R'" },
  { name: 'OLL 24 T (Chameleon)', alg: "L F R' F' L' F R F'" },
  { name: 'OLL 25 L (Bowtie)', alg: "F' L F R' F' L' F R" },
  { name: 'OLL 26 Anti-Sune', alg: "R U2 R' U' R U' R'" },
  { name: 'OLL 27 Sune', alg: "R U R' U R U2 R'" },
  // T-Shapes & P-Shapes & C-Shapes & W-Shapes
  { name: 'OLL 33 T-Shape', alg: "R U R' U' R' F R F'" },
  { name: 'OLL 45 T-Shape', alg: "F R U R' U' F'" },
  { name: 'OLL 44 P-Shape', alg: "F U R U' R' F'" },
  { name: 'OLL 43 P-Shape', alg: "F' U' L' U L F" },
  { name: 'OLL 31 P-Shape', alg: "R' U' F U R U' R' F' R" },
  { name: 'OLL 32 P-Shape', alg: "L U F' U' L' U L F L'" },
  { name: 'OLL 34 C-Shape', alg: "R U R2 U' R' F R U R U' F'" },
  { name: 'OLL 46 C-Shape', alg: "R' U' R' F R F' U R" },
  { name: 'OLL 36 W-Shape', alg: "L' U' L U' L' U L U L F' L' F" },
  { name: 'OLL 38 W-Shape', alg: "R U R' U R U' R' U' R' F R F'" },
  // Fish & Lightning & Knight & Squares & Line & L-Shapes
  { name: 'OLL 37 Fish', alg: "F R' F' R U R U' R'" },
  { name: 'OLL 35 Fish', alg: "R U2 R2 F R F' R U2 R'" },
  { name: 'OLL 9 Fish', alg: "R U R' U' R' F R2 U R' U' F'" },
  { name: 'OLL 10 Fish', alg: "R U R' U R' F R F' R U2 R'" },
  { name: 'OLL 39 Big Lightning', alg: "L F' L' U' L U F U' L'" },
  { name: 'OLL 40 Big Lightning', alg: "R' F R U R' U' F' U R" },
  { name: 'OLL 51 Line', alg: "F U R U' R' U R U' R' F'" },
  { name: 'OLL 52 Line', alg: "R U R' U R U' B U' B' R'" },
  { name: 'OLL 55 Line', alg: "R U2 R2 U' R U' R' U2 F R F'" },
  { name: 'OLL 47 L-Shape', alg: "F' L' U' L U L' U' L U F" },
  { name: 'OLL 48 L-Shape', alg: "F R U R' U' R U R' U' F'" },
  { name: 'OLL 41 Awkward', alg: "R U R' U R U2 R' F R U R' U' F'" },
  { name: 'OLL 42 Awkward', alg: "R' U' R U' R' U2 R F R U R' U' F'" },
];

export function solve1LookOLL(startCube: CubeNetState): {
  moves: string[];
  state: CubeNetState;
  caseName?: string;
  formula?: string;
} {
  if (isOLLSolved(startCube)) {
    return { moves: [], state: startCube, caseName: 'OLL Skip', formula: '' };
  }

  for (const u of ['', 'U', 'U2', "U'"]) {
    for (const entry of OLL_ALGS) {
      const candidates = [entry.mainAlg, ...entry.altAlgs];
      for (const rawAlg of candidates) {
        const tokens = expandToOuterFaceMoves(rawAlg);
        if (!tokens) continue;

        let test = startCube;
        const mList: string[] = [];
        if (u) {
          test = applyMove(test, u);
          mList.push(u);
        }
        for (const m of tokens) {
          test = applyMove(test, m);
          mList.push(m);
        }
        if (isOLLSolved(test)) {
          const opt = optimizeMoves(mList);
          return {
            moves: opt,
            state: test,
            caseName: entry.name,
            formula: u ? `(${u}) ${rawAlg}` : rawAlg,
          };
        }
      }
    }

    for (const extra of EXTRA_OUTER_FACE_OLL_ALGS) {
      const tokens = expandToOuterFaceMoves(extra.alg);
      if (!tokens) continue;
      let test = startCube;
      const mList: string[] = [];
      if (u) {
        test = applyMove(test, u);
        mList.push(u);
      }
      for (const m of tokens) {
        test = applyMove(test, m);
        mList.push(m);
      }
      if (isOLLSolved(test)) {
        const opt = optimizeMoves(mList);
        return {
          moves: opt,
          state: test,
          caseName: extra.name,
          formula: u ? `(${u}) ${extra.alg}` : extra.alg,
        };
      }
    }
  }

  // Fallback to 2-Look OLL if no 1-Look outer-face match
  const yellowCross = solveYellowCross(startCube);
  const yellowCorners = solveYellowCorners(yellowCross.state);
  const opt = optimizeMoves([...yellowCross.moves, ...yellowCorners.moves]);
  return {
    moves: opt,
    state: yellowCorners.state,
    caseName: '2-Look OLL (Edge + Corner)',
    formula: opt.join(' '),
  };
}

export function solveOLL(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isOLLSolved(startCube)) {
    return { moves: [], state: startCube };
  }
  const oneLook = solve1LookOLL(startCube);
  return {
    moves: oneLook.moves,
    state: oneLook.state,
  };
}

// ----------------------------------------------------
// 4a. PLL Corner Permutation (PLL Step 4a)
// ----------------------------------------------------
export function solvePLLCorners(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  const cornersSolved = (c: CubeNetState) =>
    c.F[0] === c.F[2] && c.R[0] === c.R[2] && c.B[0] === c.B[2] && c.L[0] === c.L[2];

  let cur = startCube;
  const path: string[] = [];

  if (!cornersSolved(cur)) {
    const cpAlgs = [
      "R U R' U' R' F R2 U' R' U' R U R' F'",       // T-Perm (Adjacent swap)
      "F R U' R' U' R U R' F' R U R' U' R' F R F'", // Y-Perm (Diagonal swap)
    ];

    let cpDone = false;
    for (const u of ['', 'U', 'U2', "U'"]) {
      for (const alg of cpAlgs) {
        let test = cur;
        const testMoves: string[] = [];
        if (u) {
          test = applyMove(test, u);
          testMoves.push(u);
        }
        for (const m of alg.split(' ')) {
          test = applyMove(test, m);
          testMoves.push(m);
        }

        for (const postU of ['', 'U', 'U2', "U'"]) {
          const aligned = postU ? applyMove(test, postU) : test;
          if (
            aligned.F[0] === 'green' &&
            aligned.F[2] === 'green' &&
            aligned.R[0] === 'red' &&
            aligned.R[2] === 'red' &&
            aligned.B[0] === 'blue' &&
            aligned.B[2] === 'blue' &&
            aligned.L[0] === 'orange' &&
            aligned.L[2] === 'orange'
          ) {
            cur = aligned;
            if (postU) testMoves.push(postU);
            path.push(...testMoves);
            cpDone = true;
            break;
          }
        }
        if (cpDone) break;
      }
      if (cpDone) break;
    }
  }

  // Align corners to centers
  for (const u of ['', 'U', 'U2', "U'"]) {
    const test = u ? applyMove(cur, u) : cur;
    if (test.F[0] === 'green' && test.R[0] === 'red' && test.B[0] === 'blue' && test.L[0] === 'orange') {
      if (u) path.push(u);
      cur = test;
      break;
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

// ----------------------------------------------------
// 4b. PLL Edge Permutation (PLL Step 4b)
// ----------------------------------------------------
export function solvePLLEdges(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isCubeSolved(startCube)) {
    return { moves: [], state: startCube };
  }

  let cur = startCube;
  const path: string[] = [];

  const epAlgs = [
    "R U' R U R U R U' R' U' R2",                   // Ua-Perm
    "R2 U R U R' U' R' U' R' U R'",                 // Ub-Perm
    "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",               // H-Perm
    "R' U' R2 U R U R' U' R U R U' R U' R'",         // Z-Perm
  ];

  let epDone = false;

  // Check depth 1
  for (const u1 of ['', 'U', 'U2', "U'"]) {
    for (const a1 of epAlgs) {
      let t1 = cur;
      const m1: string[] = [];
      if (u1) { t1 = applyMove(t1, u1); m1.push(u1); }
      for (const m of a1.split(' ')) { t1 = applyMove(t1, m); m1.push(m); }

      for (const auf of ['', 'U', 'U2', "U'"]) {
        const finalTest = auf ? applyMove(t1, auf) : t1;
        if (isCubeSolved(finalTest)) {
          if (auf) m1.push(auf);
          cur = finalTest;
          path.push(...m1);
          epDone = true;
          break;
        }
      }
      if (epDone) break;
    }
    if (epDone) break;
  }

  // Check depth 2
  if (!epDone) {
    for (const u1 of ['', 'U', 'U2', "U'"]) {
      for (const a1 of epAlgs) {
        let t1 = cur;
        const m1: string[] = [];
        if (u1) { t1 = applyMove(t1, u1); m1.push(u1); }
        for (const m of a1.split(' ')) { t1 = applyMove(t1, m); m1.push(m); }

        for (const u2 of ['', 'U', 'U2', "U'"]) {
          for (const a2 of epAlgs) {
            let t2 = t1;
            const m2: string[] = [...m1];
            if (u2) { t2 = applyMove(t2, u2); m2.push(u2); }
            for (const m of a2.split(' ')) { t2 = applyMove(t2, m); m2.push(m); }

            for (const auf of ['', 'U', 'U2', "U'"]) {
              const finalTest = auf ? applyMove(t2, auf) : t2;
              if (isCubeSolved(finalTest)) {
                if (auf) m2.push(auf);
                cur = finalTest;
                path.push(...m2);
                epDone = true;
                break;
              }
            }
            if (epDone) break;
          }
          if (epDone) break;
        }
        if (epDone) break;
      }
      if (epDone) break;
    }
  }

  return { moves: optimizeMoves(path), state: cur };
}

// ----------------------------------------------------
// 4. PLL Solver (Permute Last Layer: Both 2-Look and Full 1-Look)
// ----------------------------------------------------
export function solve1LookPLL(startCube: CubeNetState): {
  moves: string[];
  state: CubeNetState;
  caseName?: string;
  formula?: string;
} {
  if (isCubeSolved(startCube)) {
    return { moves: [], state: startCube, caseName: 'PLL Skip', formula: '' };
  }

  // Check pure AUF first
  for (const auf of ['U', 'U2', "U'"]) {
    const test = applyMove(startCube, auf);
    if (isCubeSolved(test)) {
      return {
        moves: [auf],
        state: test,
        caseName: 'PLL Skip (AUF)',
        formula: auf,
      };
    }
  }

  for (const preU of ['', 'U', 'U2', "U'"]) {
    for (const entry of PLL_ALGS) {
      const candidates = [entry.mainAlg, ...entry.altAlgs];
      for (const rawAlg of candidates) {
        const expanded = expandAlgorithmNotation(rawAlg);
        // Strip leading/trailing y/y'/y2 rotations since preU and postU cover all 4 U orientations!
        const tokens = expanded
          .split(/\s+/)
          .filter((t) => Boolean(t) && !/^y['2]?$/.test(t));
        // Only use pure outer-face moves (<U,D,L,R,F,B>) so centers and optimizeMoves remain 100% invariant
        if (tokens.length === 0 || !tokens.every((t) => STANDARD_OUTER_MOVE_REGEX.test(t))) continue;

        let test = startCube;
        const mList: string[] = [];
        if (preU) {
          test = applyMove(test, preU);
          mList.push(preU);
        }
        for (const m of tokens) {
          test = applyMove(test, m);
          mList.push(m);
        }
        for (const postU of ['', 'U', 'U2', "U'"]) {
          const finalTest = postU ? applyMove(test, postU) : test;
          if (isCubeSolved(finalTest)) {
            const fullList = postU ? [...mList, postU] : mList;
            const opt = optimizeMoves(fullList);
            return {
              moves: opt,
              state: finalTest,
              caseName: entry.name,
              formula: [preU ? `(${preU})` : '', entry.mainAlg, postU ? `(${postU})` : '']
                .filter(Boolean)
                .join(' '),
            };
          }
        }
      }
    }
  }

  // Fallback to 2-Look PLL
  const pllCorners = solvePLLCorners(startCube);
  const pllEdges = solvePLLEdges(pllCorners.state);
  const opt = optimizeMoves([...pllCorners.moves, ...pllEdges.moves]);
  return {
    moves: opt,
    state: pllEdges.state,
    caseName: '2-Look PLL (Corner + Edge)',
    formula: opt.join(' '),
  };
}

export function solvePLL(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isCubeSolved(startCube)) {
    return { moves: [], state: startCube };
  }
  const oneLook = solve1LookPLL(startCube);
  return {
    moves: oneLook.moves,
    state: oneLook.state,
  };
}

// ----------------------------------------------------
// Main Solver: solveCube
// ----------------------------------------------------
export function solveCube(
  cube: CubeNetState,
  level: SolverLevelId = 'level-2'
): SolveResult {
  const validation = validateCubeState(cube);
  if (!validation.isValid) {
    return {
      success: false,
      moves: [],
      stages: [],
      errorMessage: validation.errors.join('; '),
    };
  }

  if (isCubeSolved(cube)) {
    return {
      success: true,
      moves: [],
      stages: [],
    };
  }

  // If cube is in Scramble orientation (White on top U), rotate White to bottom D for White Cross solving
  const workingCube = cube.U?.[4] === 'white' ? rotateWhiteToBottom(cube) : cube;

  // 1. White Cross
  const cross = solveWhiteCross(workingCube);

  if (level === 'level-1') {
    // 7 Discrete LBL Stages from dedicated sub-solvers
    const corners = solveWhiteCorners(cross.state);
    const edges = solveMiddleEdges(corners.state);
    const yellowCross = solveYellowCross(edges.state);
    const yellowCorners = solveYellowCorners(yellowCross.state);
    const pllCorners = solvePLLCorners(yellowCorners.state);
    const pllEdges = solvePLLEdges(pllCorners.state);

    const s1Moves = cross.moves;
    const s2Moves = corners.moves;
    const s3Moves = edges.moves;
    const s4Moves = yellowCross.moves;
    const s5Moves = yellowCorners.moves;
    const s6Moves = pllCorners.moves;
    const s7Moves = pllEdges.moves;

    const allLblMoves = optimizeMoves([
      ...s1Moves,
      ...s2Moves,
      ...s3Moves,
      ...s4Moves,
      ...s5Moves,
      ...s6Moves,
      ...s7Moves,
    ]);

    let moveNum = 1;
    const makeStage = (
      id: string,
      num: number,
      titleVi: string,
      titleEn: string,
      descVi: string,
      mList: string[]
    ): SolutionStage => {
      const stageMoves = createMoves(mList.join(' '), moveNum);
      moveNum += stageMoves.length;
      const matchedEntry = matchAlgorithmDatabaseForStage(id, mList.join(' '));
      return {
        id,
        stageNumber: num,
        titleVi,
        titleEn,
        subtitle: mList.join(' ') || 'Đã giải',
        status: num === 1 ? 'active' : 'pending',
        movesCount: stageMoves.length,
        formulaSummary: mList.join(' ') || '0 Moves',
        moves: stageMoves,
        caseDetails: {
          caseName: matchedEntry ? matchedEntry.name : titleVi,
          probability: matchedEntry ? matchedEntry.probability : '100% LBL Stage',
          description: matchedEntry ? `${descVi} — ${matchedEntry.recognitionVN}` : descVi,
          formula: mList.join(' ') || (matchedEntry ? matchedEntry.mainAlg : ''),
          holdingNote: matchedEntry ? matchedEntry.fingertrickVN : 'Trắng ở đáy (D), Vàng ở đỉnh (U).',
          patternNote: titleEn,
        },
      };
    };

    const stages: SolutionStage[] = [
      makeStage('lbl-1', 1, 'Giai đoạn 01 · Chữ Thập Trắng (White Cross)', 'Stage 01 · White Cross', 'Giải 4 viên cạnh trắng về đúng tâm trắng ở mặt đáy D.', s1Moves),
      makeStage('lbl-2', 2, 'Giai đoạn 02 · 4 Góc Trắng (First Layer Corners)', 'Stage 02 · White Corners', 'Đưa 4 viên góc trắng vào đúng vị trí hoàn thiện tầng 1.', s2Moves),
      makeStage('lbl-3', 3, 'Giai đoạn 03 · Tầng Giữa (Middle Layer Edges)', 'Stage 03 · Middle Layer', 'Đưa 4 viên cạnh tầng 2 vào đúng vị trí hoàn thiện 2 tầng dưới.', s3Moves),
      makeStage('lbl-4', 4, 'Giai đoạn 04 · Chữ Thập Vàng (Yellow Cross)', 'Stage 04 · Yellow Cross', 'Tạo chữ thập vàng trên mặt đỉnh U.', s4Moves),
      makeStage('lbl-5', 5, 'Giai đoạn 05 · Định Hướng Góc Vàng (Yellow Corners)', 'Stage 05 · Orient Corners', 'Lật toàn bộ 4 góc vàng hoàn thành mặt đỉnh U.', s5Moves),
      makeStage('lbl-6', 6, 'Giai đoạn 06 · Hoán Vị Góc Vàng (Permute Corners)', 'Stage 06 · Permute Corners', 'Đưa 4 góc vàng về đúng vị trí khớp màu các mặt bên.', s6Moves),
      makeStage('lbl-7', 7, 'Giai đoạn 07 · Hoán Vị Cạnh Vàng (Permute Edges)', 'Stage 07 · Permute Edges', 'Đưa 4 cạnh vàng về đúng vị trí hoàn tất khối Rubik.', s7Moves),
    ];

    return {
      success: true,
      moves: allLblMoves,
      stages,
    };
  }

  // True 4-Pair F2L Solver + 1-Look / 2-Look OLL & PLL for CFOP, Auto-Solve, Roux, ZBLL
  const f2l = solveF2LPairs(cross.state);

  // Compute BOTH 2-Look and Full 1-Look OLL & PLL so Step 3 can toggle seamlessly!
  const twoLookEdgeOLL = solveYellowCross(f2l.state);
  const twoLookCornerOLL = solveYellowCorners(twoLookEdgeOLL.state);
  const twoLookOLLMoves = optimizeMoves([...twoLookEdgeOLL.moves, ...twoLookCornerOLL.moves]);

  const oneLookOLL = solve1LookOLL(f2l.state);

  // Use 1-Look OLL state as starting point for PLL
  const oll = oneLookOLL;
  const twoLookCornerPLL = solvePLLCorners(oll.state);
  const twoLookEdgePLL = solvePLLEdges(twoLookCornerPLL.state);
  const twoLookPLLMoves = optimizeMoves([...twoLookCornerPLL.moves, ...twoLookEdgePLL.moves]);

  const oneLookPLL = solve1LookPLL(oll.state);
  const pll = oneLookPLL;

  const allOptimizedMoves = optimizeMoves([
    ...cross.moves,
    ...f2l.moves,
    ...oll.moves,
    ...pll.moves,
  ]);

  let stages: SolutionStage[] = [];

  if (level === 'auto-solve') {
    const movesObjs = createMoves(allOptimizedMoves.join(' '), 1);
    stages = [
      {
        id: 'auto-solve-opt',
        stageNumber: 1,
        titleVi: 'Lời Giải Trực Tiếp Tối Ưu',
        titleEn: 'Direct Optimal Solution',
        subtitle: `${allOptimizedMoves.join(' ')} (${allOptimizedMoves.length} Moves)`,
        status: 'active',
        movesCount: allOptimizedMoves.length,
        formulaSummary: allOptimizedMoves.join(' '),
        moves: movesObjs,
        caseDetails: {
          caseName: "Optimal Solution",
          probability: '100% Thuật toán chính xác',
          description: `Đường đi toán học giải hoàn tất khối Rubik trong ${allOptimizedMoves.length} bước.`,
          formula: allOptimizedMoves.join(' '),
          holdingNote: 'Giữ khối Rubik: Vàng ở đỉnh (U), Trắng ở đáy (D), Xanh lá ở mặt trước (F).',
          topDownPattern: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
          patternNote: `Giải Toàn Bộ Khối (${allOptimizedMoves.length} Moves)`,
        },
      },
    ];
  } else {
    // 4-Stage CFOP / Advanced (level-2, level-3, level-4)
    let moveNum = 1;
    const stage1Moves = createMoves(cross.moves.join(' '), moveNum);
    moveNum += stage1Moves.length;

    const stage2StartNum = moveNum;
    const stage2Moves = createMoves(f2l.moves.join(' '), stage2StartNum);
    moveNum += stage2Moves.length;

    // Build 4 distinct F2L Pair Sub-Steps (Pair 1: FR, Pair 2: FL, Pair 3: BR, Pair 4: BL)
    let pairCursor = stage2StartNum;
    const f2lSubSteps: SolutionSubStep[] = f2l.pairSteps.map((ps, idx) => {
      const pCount = ps.moves.length;
      const startN = pairCursor;
      const endN = pCount > 0 ? pairCursor + pCount - 1 : pairCursor;
      pairCursor += pCount;
      return {
        id: `f2l-pair-${idx + 1}`,
        labelVi: ps.labelVi,
        formula: ps.moves.join(' ') || 'Đã vào khớp (0 Moves)',
        movesCount: pCount,
        startMoveNum: startN,
        endMoveNum: endN,
      };
    });

    const stage3StartNum = moveNum;
    const stage3Moves = createMoves(oll.moves.join(' '), stage3StartNum);
    moveNum += stage3Moves.length;

    const stage4StartNum = moveNum;
    const stage4Moves = createMoves(pll.moves.join(' '), stage4StartNum);

    // Build 2-Look OLL & PLL Variants for the Step 3 CFOP 2-Look <-> Full 1-Look Segmented Toggle
    const twoLookOLLMoveObjs = createMoves(twoLookOLLMoves.join(' '), stage3StartNum);
    const twoLookOLLSubSteps: SolutionSubStep[] = [
      {
        id: '2look-oll-edge',
        labelVi: 'Bước 3a · Định Hướng Cạnh Vàng (Edge OLL - Chữ Thập)',
        formula: twoLookEdgeOLL.moves.join(' ') || 'Đã có Chữ Thập Vàng (Skip)',
        movesCount: twoLookEdgeOLL.moves.length,
        startMoveNum: stage3StartNum,
        endMoveNum: stage3StartNum + Math.max(0, twoLookEdgeOLL.moves.length - 1),
      },
      {
        id: '2look-oll-corner',
        labelVi: 'Bước 3b · Định Hướng Góc Vàng (Corner OCLL - 7 Algs)',
        formula: twoLookCornerOLL.moves.join(' ') || 'Đã lật 4 góc (Skip)',
        movesCount: twoLookCornerOLL.moves.length,
        startMoveNum: stage3StartNum + twoLookEdgeOLL.moves.length,
        endMoveNum: stage3StartNum + Math.max(0, twoLookOLLMoves.length - 1),
      },
    ];

    const twoLookPLLMoveObjs = createMoves(twoLookPLLMoves.join(' '), stage4StartNum);
    const twoLookPLLSubSteps: SolutionSubStep[] = [
      {
        id: '2look-pll-corner',
        labelVi: 'Bước 4a · Hoán Vị 4 Góc (Corner PLL - T-Perm / Y-Perm)',
        formula: twoLookCornerPLL.moves.join(' ') || '4 góc đã đúng (Skip)',
        movesCount: twoLookCornerPLL.moves.length,
        startMoveNum: stage4StartNum,
        endMoveNum: stage4StartNum + Math.max(0, twoLookCornerPLL.moves.length - 1),
      },
      {
        id: '2look-pll-edge',
        labelVi: 'Bước 4b · Hoán Vị 4 Cạnh (Edge EPLL - Ua / Ub / H / Z)',
        formula: twoLookEdgePLL.moves.join(' ') || '4 cạnh đã đúng (Skip)',
        movesCount: twoLookEdgePLL.moves.length,
        startMoveNum: stage4StartNum + twoLookCornerPLL.moves.length,
        endMoveNum: stage4StartNum + Math.max(0, twoLookPLLMoves.length - 1),
      },
    ];

    const matchedCross = matchAlgorithmDatabaseForStage('cfop-1', cross.moves.join(' '));
    const matchedF2L = matchAlgorithmDatabaseForStage('cfop-2', f2l.moves.join(' '));
    const matchedOLL = matchAlgorithmDatabaseForStage('cfop-3', oll.moves.join(' '));
    const matchedPLL = matchAlgorithmDatabaseForStage('cfop-4', pll.moves.join(' '));

    const f2lPairSummary = f2l.pairSteps
      .filter((p) => p.moves.length > 0)
      .map((p) => `${p.slotId}: ${p.moves.join(' ')}`)
      .join('  |  ');

    stages = [
      {
        id: 'cfop-1',
        stageNumber: 1,
        titleVi: 'Giai đoạn 01 · Chữ Thập Trắng (White Cross)',
        titleEn: 'Stage 01 · White Cross',
        subtitle: cross.moves.join(' ') || 'Đã giải',
        status: 'active',
        movesCount: stage1Moves.length,
        formulaSummary: cross.moves.join(' ') || '0 Moves',
        moves: stage1Moves,
        caseDetails: {
          caseName: matchedCross ? `White Cross · ${matchedCross.name}` : 'White Cross on D (Mặt Đáy)',
          probability: matchedCross ? matchedCross.probability : '100% CFOP Foundation',
          description: matchedCross
            ? `Giải 4 viên cạnh trắng về đúng tâm đáy D — ${matchedCross.recognitionVN}`
            : 'Giải trực tiếp 4 viên cạnh trắng về đúng tâm đáy D khớp 4 tâm bên hông trong <= 8 bước.',
          formula: cross.moves.join(' '),
          holdingNote: matchedCross
            ? matchedCross.fingertrickVN
            : 'Trắng ở đáy (D), Vàng ở đỉnh (U), Xanh lá ở mặt trước (F).',
          diagramTitle: 'MẶT ĐÁY (D)',
          diagramType: 'cross',
          patternNote: 'Chữ Thập Trắng Khớp 4 Tâm',
        },
      },
      {
        id: 'cfop-2',
        stageNumber: 2,
        titleVi: 'Giai đoạn 02 · 2 Tầng Đầu (First Two Layers - 4 Cặp F2L)',
        titleEn: 'Stage 02 · First Two Layers (4 F2L Pairs)',
        subtitle: f2lPairSummary || f2l.moves.join(' ') || 'Đã giải',
        status: 'pending',
        movesCount: stage2Moves.length,
        formulaSummary: f2lPairSummary || f2l.moves.join(' ') || '0 Moves',
        moves: stage2Moves,
        subSteps: f2lSubSteps,
        caseDetails: {
          caseName: 'First Two Layers (4 Cặp Góc - Cạnh F2L)',
          probability: '4 Slots (FR · FL · BR · BL)',
          description:
            'Ghép từng cặp góc - cạnh tương ứng trên tầng U và đưa vào 4 khe (FR, FL, BR, BL) chỉ trong 4–8 bước mỗi cặp.',
          formula: f2l.moves.join(' '),
          holdingNote: matchedF2L
            ? matchedF2L.fingertrickVN
            : 'Giữ tâm Trắng ở đáy, ghép đồng thời từng cặp góc - cạnh rồi chèn vào khe.',
          diagramTitle: '2 TẦNG ĐẦU (F2L)',
          diagramType: 'f2l',
          patternNote: 'Hoàn Thành 4 Khe Góc - Cạnh',
        },
      },
      {
        id: 'cfop-3',
        stageNumber: 3,
        titleVi: 'Giai đoạn 03 · Định Hướng Tầng Cuối (OLL)',
        titleEn: 'Stage 03 · Orientation of the Last Layer (OLL)',
        subtitle: oll.moves.join(' ') || 'Đã giải',
        status: 'pending',
        movesCount: stage3Moves.length,
        formulaSummary: oll.formula || oll.moves.join(' ') || '0 Moves',
        moves: stage3Moves,
        twoLookVariant: {
          titleVi: 'Giai đoạn 03 · Định Hướng Mặt Vàng (2-Look OLL: Cạnh + Góc)',
          subtitle: twoLookOLLMoves.join(' ') || 'Đã giải',
          formulaSummary: `Edge (${twoLookEdgeOLL.moves.join(' ') || 'Skip'}) + Corner (${twoLookCornerOLL.moves.join(' ') || 'Skip'})`,
          moves: twoLookOLLMoveObjs,
          subSteps: twoLookOLLSubSteps,
          caseName: '2-Look OLL (10 Công Thức Rút Gọn)',
          description: 'Chia làm 2 bước: (3a) Tạo chữ thập vàng trên mặt U, sau đó (3b) Dùng 1 trong 7 công thức OCLL để lật 4 góc vàng.',
          formula: twoLookOLLMoves.join(' '),
        },
        oneLookVariant: {
          titleVi: 'Giai đoạn 03 · Định Hướng Tầng Cuối (1-Look Full OLL - 57 Algs)',
          subtitle: oll.moves.join(' ') || 'Đã giải',
          formulaSummary: oll.formula || oll.moves.join(' ') || '0 Moves',
          moves: stage3Moves,
          caseName: oneLookOLL.caseName || (matchedOLL ? matchedOLL.name : '1-Look OLL'),
          description: matchedOLL
            ? matchedOLL.recognitionVN
            : 'Lật toàn bộ mặt vàng trong đúng 1 công thức duy nhất (Full OLL 57 Cases).',
          formula: oll.moves.join(' '),
        },
        caseDetails: {
          caseName: oneLookOLL.caseName || (matchedOLL ? matchedOLL.name : 'Orient Last Layer (OLL)'),
          probability: matchedOLL ? matchedOLL.probability : '1/57 Full OLL',
          description: matchedOLL
            ? matchedOLL.recognitionVN
            : 'Lật toàn bộ các nhãn dán màu Vàng lên mặt đỉnh U.',
          formula: oll.moves.join(' '),
          holdingNote: matchedOLL
            ? matchedOLL.fingertrickVN
            : 'Nhìn từ trên xuống mặt U vàng.',
          diagramTitle: 'MẶT ĐỈNH (U)',
          diagramType: 'oll',
          topDownPattern: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
          patternNote: 'Hoàn Thành Mặt Vàng (OLL)',
        },
      },
      {
        id: 'cfop-4',
        stageNumber: 4,
        titleVi: 'Giai đoạn 04 · Hoán Vị Tầng Cuối (PLL)',
        titleEn: 'Stage 04 · Permutation of the Last Layer (PLL)',
        subtitle: pll.moves.join(' ') || 'Đã giải',
        status: 'pending',
        movesCount: stage4Moves.length,
        formulaSummary: pll.formula || pll.moves.join(' ') || '0 Moves',
        moves: stage4Moves,
        twoLookVariant: {
          titleVi: 'Giai đoạn 04 · Hoán Vị Tầng Cuối (2-Look PLL: Góc + Cạnh)',
          subtitle: twoLookPLLMoves.join(' ') || 'Đã giải',
          formulaSummary: `Corner (${twoLookCornerPLL.moves.join(' ') || 'Skip'}) + Edge (${twoLookEdgePLL.moves.join(' ') || 'Skip'})`,
          moves: twoLookPLLMoveObjs,
          subSteps: twoLookPLLSubSteps,
          caseName: '2-Look PLL (6 Công Thức Rút Gọn)',
          description: 'Chia làm 2 bước: (4a) Hoán vị 4 góc đúng vị trí (T-Perm / Y-Perm), sau đó (4b) Hoán vị 4 cạnh vàng (Ua / Ub / H / Z).',
          formula: twoLookPLLMoves.join(' '),
        },
        oneLookVariant: {
          titleVi: 'Giai đoạn 04 · Hoán Vị Tầng Cuối (1-Look Full PLL - 21 Algs)',
          subtitle: pll.moves.join(' ') || 'Đã giải',
          formulaSummary: pll.formula || pll.moves.join(' ') || '0 Moves',
          moves: stage4Moves,
          caseName: oneLookPLL.caseName || (matchedPLL ? matchedPLL.name : '1-Look PLL'),
          description: matchedPLL
            ? matchedPLL.recognitionVN
            : 'Hoán vị đồng thời cả góc và cạnh tầng 3 về trạng thái hoàn tất trong 1 công thức (Full PLL 21 Cases).',
          formula: pll.moves.join(' '),
        },
        caseDetails: {
          caseName: oneLookPLL.caseName || (matchedPLL ? matchedPLL.name : 'Permute Last Layer (PLL)'),
          probability: matchedPLL ? matchedPLL.probability : '1/21 Full PLL',
          description: matchedPLL
            ? matchedPLL.recognitionVN
            : 'Hoán vị các viên góc và cạnh tầng 3 về đúng màu hoàn thành khối Rubik.',
          formula: pll.moves.join(' '),
          holdingNote: matchedPLL
            ? matchedPLL.fingertrickVN
            : 'Giữ mặt vàng ở đỉnh, hoàn tất khối Rubik.',
          diagramTitle: 'MẶT ĐỈNH (U)',
          diagramType: 'pll',
          patternNote: '100% Hoàn Thành Rubik',
        },
      },
    ];
  }

  return {
    success: true,
    moves: allOptimizedMoves,
    stages,
  };
}
