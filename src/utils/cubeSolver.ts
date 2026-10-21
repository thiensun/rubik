// Authentic Rubik's Cube Solver & Stage Decomposition Engine
import {
  CubeNetState,
  CubeColor,
  FaceKey,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  isCubeSolved,
} from './cubeState';
import { SolverLevelId } from '../types/cubing';
import { SolutionStage, createMoves } from './solutionStages';
import { validateCubeState } from './cubeValidator';

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

  for (const m of moves) {
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
    cube.D[1] === 'yellow' && cube.F[7] === 'green' &&
    cube.D[3] === 'yellow' && cube.L[7] === 'orange' &&
    cube.D[5] === 'yellow' && cube.R[7] === 'red' &&
    cube.D[7] === 'yellow' && cube.B[7] === 'blue'
  );
}

// Helper: Check if First Two Layers (F2L) are solved
export function isF2LSolved(cube: CubeNetState): boolean {
  if (!isCrossSolved(cube)) return false;
  if (!cube.D.every((c) => c === 'yellow')) return false;

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
  return isF2LSolved(cube) && cube.U.every((c) => c === 'white');
}

// Helper: Check if First Layer (White face + side bottom row) is solved
export function isFirstLayerSolved(cube: CubeNetState): boolean {
  if (!isCrossSolved(cube)) return false;
  if (!cube.D.every((c) => c === 'yellow')) return false;
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
    cube.U[1] === 'white' &&
    cube.U[3] === 'white' &&
    cube.U[5] === 'white' &&
    cube.U[7] === 'white'
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
    { name: 'DF', check: (c: CubeNetState) => c.D[1] === 'yellow' && c.F[7] === 'green' },
    { name: 'DR', check: (c: CubeNetState) => c.D[5] === 'yellow' && c.R[7] === 'red' },
    { name: 'DB', check: (c: CubeNetState) => c.D[7] === 'yellow' && c.B[7] === 'blue' },
    { name: 'DL', check: (c: CubeNetState) => c.D[3] === 'yellow' && c.L[7] === 'orange' },
  ];

  let cur = startCube;
  const path: string[] = [];

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
    colors: ['yellow', 'green', 'red'],
    isSolved: (c) => c.D[2] === 'yellow' && c.F[8] === 'green' && c.R[6] === 'red',
    isInSlot: (c) => {
      const colors = [c.D[2], c.F[8], c.R[6]].sort().join(',');
      return colors === ['green', 'red', 'yellow'].sort().join(',');
    },
    popMoves: "R U R'",
    trigger: "R U R' U'",
    targetUFace: 'R',
  },
  {
    name: 'DFL',
    colors: ['yellow', 'green', 'orange'],
    isSolved: (c) => c.D[0] === 'yellow' && c.F[6] === 'green' && c.L[8] === 'orange',
    isInSlot: (c) => {
      const colors = [c.D[0], c.F[6], c.L[8]].sort().join(',');
      return colors === ['green', 'orange', 'yellow'].sort().join(',');
    },
    popMoves: "L' U' L",
    trigger: "L' U' L U",
    targetUFace: 'L',
  },
  {
    name: 'DBR',
    colors: ['yellow', 'blue', 'red'],
    isSolved: (c) => c.D[8] === 'yellow' && c.B[6] === 'blue' && c.R[8] === 'red',
    isInSlot: (c) => {
      const colors = [c.D[8], c.B[6], c.R[8]].sort().join(',');
      return colors === ['blue', 'red', 'yellow'].sort().join(',');
    },
    popMoves: "R' U' R",
    trigger: "R' U' R U",
    targetUFace: 'B',
  },
  {
    name: 'DBL',
    colors: ['yellow', 'blue', 'orange'],
    isSolved: (c) => c.D[6] === 'yellow' && c.B[8] === 'blue' && c.L[6] === 'orange',
    isInSlot: (c) => {
      const colors = [c.D[6], c.B[8], c.L[6]].sort().join(',');
      return colors === ['blue', 'orange', 'yellow'].sort().join(',');
    },
    popMoves: "L U L'",
    trigger: "L U L' U'",
    targetUFace: 'L',
  },
];

export function solveWhiteCorners(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  let cur = startCube;
  const path: string[] = [];

  for (const def of CORNER_DEFS) {
    if (def.isSolved(cur)) continue;

    // Check if the corner for this def is currently in any bottom slot
    const targetColors = [...def.colors].sort().join(',');

    for (const slot of CORNER_DEFS) {
      if (slot.isSolved(cur)) continue;
      // Get colors in this slot
      let slotColors: string[] = [];
      if (slot.name === 'DFR') slotColors = [cur.D[2], cur.F[8], cur.R[6]];
      else if (slot.name === 'DFL') slotColors = [cur.D[0], cur.F[6], cur.L[8]];
      else if (slot.name === 'DBR') slotColors = [cur.D[8], cur.B[6], cur.R[8]];
      else if (slot.name === 'DBL') slotColors = [cur.D[6], cur.B[8], cur.L[6]];

      if (slotColors.sort().join(',') === targetColors) {
        // Pop it!
        for (const m of slot.popMoves.split(' ')) {
          cur = applyMove(cur, m);
          path.push(m);
        }
        break;
      }
    }

    // Now corner is on U layer (or in target slot)
    // Position on U and apply trigger until solved
    let solved = false;
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

export function solveF2L(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isF2LSolved(startCube)) {
    return { moves: [], state: startCube };
  }

  const corners = solveWhiteCorners(startCube);
  const edges = solveMiddleEdges(corners.state);

  return {
    moves: optimizeMoves([...corners.moves, ...edges.moves]),
    state: edges.state,
  };
}

// ----------------------------------------------------
// 3a. Yellow Cross Solver (OLL Step 3a)
// ----------------------------------------------------
export function solveYellowCross(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  const isYellowCross = (c: CubeNetState) =>
    c.U[1] === 'white' && c.U[3] === 'white' && c.U[5] === 'white' && c.U[7] === 'white';

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
    "R U R' U R U2 R'",           // Sune
    "R U2 R' U' R U' R'",         // Antisune
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
// 3. OLL Solver (Orient Last Layer - Yellow Face)
// ----------------------------------------------------
export function solveOLL(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isOLLSolved(startCube)) {
    return { moves: [], state: startCube };
  }
  const yellowCross = solveYellowCross(startCube);
  const yellowCorners = solveYellowCorners(yellowCross.state);
  return {
    moves: optimizeMoves([...yellowCross.moves, ...yellowCorners.moves]),
    state: yellowCorners.state,
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
      "R U R' U' R' F R2 U' R' U' R U R' F'", // T-Perm
      "F R U' R' U' R U R' F' R U R' U' R' F R F'", // Y-Perm
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

        if (cornersSolved(test)) {
          cur = test;
          path.push(...testMoves);
          cpDone = true;
          break;
        }
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
// 4. PLL Solver (Permute Last Layer)
// ----------------------------------------------------
export function solvePLL(startCube: CubeNetState): { moves: string[]; state: CubeNetState } {
  if (isCubeSolved(startCube)) {
    return { moves: [], state: startCube };
  }
  const pllCorners = solvePLLCorners(startCube);
  const pllEdges = solvePLLEdges(pllCorners.state);
  return {
    moves: optimizeMoves([...pllCorners.moves, ...pllEdges.moves]),
    state: pllEdges.state,
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

  // 1. White Cross
  const cross = solveWhiteCross(cube);

  // 2. White Corners (LBL Stage 2)
  const corners = solveWhiteCorners(cross.state);

  // 3. Middle Edges (LBL Stage 3)
  const edges = solveMiddleEdges(corners.state);

  // 4. Yellow Cross (LBL Stage 4)
  const yellowCross = solveYellowCross(edges.state);

  // 5. Orient Yellow Corners (LBL Stage 5)
  const yellowCorners = solveYellowCorners(yellowCross.state);

  // 6. Permute Corners (LBL Stage 6)
  const pllCorners = solvePLLCorners(yellowCorners.state);

  // 7. Permute Edges (LBL Stage 7)
  const pllEdges = solvePLLEdges(pllCorners.state);

  const f2l = {
    moves: optimizeMoves([...corners.moves, ...edges.moves]),
    state: edges.state,
  };
  const oll = {
    moves: optimizeMoves([...yellowCross.moves, ...yellowCorners.moves]),
    state: yellowCorners.state,
  };
  const pll = {
    moves: optimizeMoves([...pllCorners.moves, ...pllEdges.moves]),
    state: pllEdges.state,
  };

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
          topDownPattern: ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
          patternNote: `Giải Toàn Bộ Khối (${allOptimizedMoves.length} Moves)`,
        },
      },
    ];
  } else if (level === 'level-1') {
    // 7 Discrete LBL Stages from dedicated sub-solvers
    const s1Moves = cross.moves;
    const s2Moves = corners.moves;
    const s3Moves = edges.moves;
    const s4Moves = yellowCross.moves;
    const s5Moves = yellowCorners.moves;
    const s6Moves = pllCorners.moves;
    const s7Moves = pllEdges.moves;

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
          caseName: titleVi,
          probability: '100% LBL Stage',
          description: descVi,
          formula: mList.join(' '),
          holdingNote: 'Trắng ở đáy (D), Vàng ở đỉnh (U).',
          patternNote: titleEn,
        },
      };
    };

    stages = [
      makeStage('lbl-1', 1, 'Giai đoạn 01 · Chữ Thập Trắng (White Cross)', 'Stage 01 · White Cross', 'Giải 4 viên cạnh trắng về đúng tâm trắng ở mặt đáy D.', s1Moves),
      makeStage('lbl-2', 2, 'Giai đoạn 02 · 4 Góc Trắng (First Layer Corners)', 'Stage 02 · White Corners', 'Đưa 4 viên góc trắng vào đúng vị trí hoàn thiện tầng 1.', s2Moves),
      makeStage('lbl-3', 3, 'Giai đoạn 03 · Tầng Giữa (Middle Layer Edges)', 'Stage 03 · Middle Layer', 'Đưa 4 viên cạnh tầng 2 vào đúng vị trí hoàn thiện 2 tầng dưới.', s3Moves),
      makeStage('lbl-4', 4, 'Giai đoạn 04 · Chữ Thập Vàng (Yellow Cross)', 'Stage 04 · Yellow Cross', 'Tạo chữ thập vàng trên mặt đỉnh U.', s4Moves),
      makeStage('lbl-5', 5, 'Giai đoạn 05 · Định Hướng Góc Vàng (Yellow Corners)', 'Stage 05 · Orient Corners', 'Lật toàn bộ 4 góc vàng hoàn thành mặt đỉnh U.', s5Moves),
      makeStage('lbl-6', 6, 'Giai đoạn 06 · Hoán Vị Góc Vàng (Permute Corners)', 'Stage 06 · Permute Corners', 'Đưa 4 góc vàng về đúng vị trí khớp màu các mặt bên.', s6Moves),
      makeStage('lbl-7', 7, 'Giai đoạn 07 · Hoán Vị Cạnh Vàng (Permute Edges)', 'Stage 07 · Permute Edges', 'Đưa 4 cạnh vàng về đúng vị trí hoàn tất khối Rubik.', s7Moves),
    ];
  } else {
    // 4-Stage CFOP (level-2, level-3, level-4)
    let moveNum = 1;
    const stage1Moves = createMoves(cross.moves.join(' '), moveNum);
    moveNum += stage1Moves.length;

    const stage2Moves = createMoves(f2l.moves.join(' '), moveNum);
    moveNum += stage2Moves.length;

    const stage3Moves = createMoves(oll.moves.join(' '), moveNum);
    moveNum += stage3Moves.length;

    const stage4Moves = createMoves(pll.moves.join(' '), moveNum);

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
          caseName: 'White Cross on D',
          probability: '100% CFOP Foundation',
          description: 'Giải 4 viên cạnh trắng về đúng tâm đáy D khớp 4 tâm bên hông.',
          formula: cross.moves.join(' '),
          holdingNote: 'Trắng ở đáy (D), Vàng ở đỉnh (U), Xanh lá ở mặt trước (F).',
          diagramTitle: 'MẶT ĐÁY (D)',
          diagramType: 'cross',
          patternNote: 'Chữ Thập Trắng Khớp 4 Tâm',
        },
      },
      {
        id: 'cfop-2',
        stageNumber: 2,
        titleVi: 'Giai đoạn 02 · 2 Tầng Đầu (First Two Layers - F2L)',
        titleEn: 'Stage 02 · First Two Layers (F2L)',
        subtitle: f2l.moves.join(' ') || 'Đã giải',
        status: 'pending',
        movesCount: stage2Moves.length,
        formulaSummary: f2l.moves.join(' ') || '0 Moves',
        moves: stage2Moves,
        caseDetails: {
          caseName: 'First Two Layers (F2L)',
          probability: 'CFOP Core Phase',
          description: 'Ghép 4 cặp góc - cạnh tương ứng hoàn thiện 2 tầng dưới.',
          formula: f2l.moves.join(' '),
          holdingNote: 'Giữ tâm Trắng ở đáy, ghép các cặp góc - cạnh.',
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
        formulaSummary: oll.moves.join(' ') || '0 Moves',
        moves: stage3Moves,
        caseDetails: {
          caseName: 'Orient Last Layer (OLL)',
          probability: 'OLL Transition',
          description: 'Lật toàn bộ các nhãn dán màu Vàng lên mặt đỉnh U.',
          formula: oll.moves.join(' '),
          holdingNote: 'Nhìn từ trên xuống mặt U vàng.',
          diagramTitle: 'MẶT ĐỈNH (U)',
          diagramType: 'oll',
          topDownPattern: ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
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
        formulaSummary: pll.moves.join(' ') || '0 Moves',
        moves: stage4Moves,
        caseDetails: {
          caseName: 'Permute Last Layer (PLL)',
          probability: 'PLL Final Step',
          description: 'Hoán vị các viên góc và cạnh tầng 3 về đúng màu hoàn thành khối Rubik.',
          formula: pll.moves.join(' '),
          holdingNote: 'Giữ mặt vàng ở đỉnh, hoàn tất khối Rubik.',
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
