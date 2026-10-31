// 3x3x3 Facelet & Cubie Permutation Simulator, Inverse Generator & Automatic Arrow Vector Engine
import {
  CubeColor,
  CubeFaceState,
  CubeNetState,
  FaceKey,
  SOLVED_CUBE,
  cloneCube,
} from '../utils/cubeState';

export interface ColorScheme {
  U: CubeColor;
  D: CubeColor;
  F: CubeColor;
  B: CubeColor;
  L: CubeColor;
  R: CubeColor;
}

export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  U: 'yellow',
  D: 'white',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
};

export const PRESET_COLOR_SCHEMES: Record<string, ColorScheme> = {
  'white-bottom': {
    U: 'yellow',
    D: 'white',
    F: 'green',
    B: 'blue',
    L: 'orange',
    R: 'red',
  },
  'yellow-bottom': {
    U: 'white',
    D: 'yellow',
    F: 'green',
    B: 'blue',
    L: 'red',
    R: 'orange',
  },
  'green-bottom': {
    U: 'blue',
    D: 'green',
    F: 'white',
    B: 'yellow',
    L: 'orange',
    R: 'red',
  },
  'blue-bottom': {
    U: 'green',
    D: 'blue',
    F: 'yellow',
    B: 'white',
    L: 'orange',
    R: 'red',
  },
  'red-bottom': {
    U: 'orange',
    D: 'red',
    F: 'green',
    B: 'blue',
    L: 'white',
    R: 'yellow',
  },
  'orange-bottom': {
    U: 'red',
    D: 'orange',
    F: 'green',
    B: 'blue',
    L: 'yellow',
    R: 'white',
  },
};

export interface PermutationArrow {
  fromCell: number; // 0..8 on U face
  toCell: number;   // 0..8 on U face
  from: [number, number]; // SVG [x, y] on 100x100 canvas
  to: [number, number];   // SVG [x, y] on 100x100 canvas
  bidirectional: boolean; // true for double-headed swap arrow (<->), false for single-headed (->)
  pieceType: 'corner' | 'edge';
  curved?: 'cw' | 'ccw';
}

export interface CaseSimulationResult {
  cubeState: CubeNetState;
  topFaceColors: CubeColor[];
  topFaceMask: ('yellow' | 'gray' | 'white' | 'active')[];
  sideStickers: {
    top: [CubeColor, CubeColor, CubeColor];
    bottom: [CubeColor, CubeColor, CubeColor];
    left: [CubeColor, CubeColor, CubeColor];
    right: [CubeColor, CubeColor, CubeColor];
  };
  bars: {
    top: [boolean, boolean, boolean];
    bottom: [boolean, boolean, boolean];
    left: [boolean, boolean, boolean];
    right: [boolean, boolean, boolean];
  };
  arrows: PermutationArrow[];
  inverseAlg: string;
  moveCount: number;
}

// SVG Center Coordinates for the 9 cells on the 100x100 Top-Down ViewBox
export const U_CELL_SVG_COORDS: Record<number, [number, number]> = {
  0: [29, 29], // UBL
  1: [50, 29], // UB
  2: [71, 29], // UBR
  3: [29, 50], // UL
  4: [50, 50], // U Center
  5: [71, 50], // UR
  6: [29, 71], // UFL
  7: [50, 71], // UF
  8: [71, 71], // UFR
};

// Outer-border-offset coordinates for Corner permutation arrows so they stay along the outer perimeter
export const U_CORNER_ARROW_COORDS: Record<number, [number, number]> = {
  0: [24.5, 24.5], // UBL outer corner
  2: [75.5, 24.5], // UBR outer corner
  6: [24.5, 75.5], // UFL outer corner
  8: [75.5, 75.5], // UFR outer corner
};

// Inward-offset coordinates for Edge permutation arrows so they stay cleanly inside the cross
export const U_EDGE_ARROW_COORDS: Record<number, [number, number]> = {
  1: [50, 33.5], // UB inward edge
  3: [33.5, 50], // UL inward edge
  5: [66.5, 50], // UR inward edge
  7: [50, 66.5], // UF inward edge
};

function rotateFaceCW(face: CubeFaceState): CubeFaceState {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

/**
 * Expand repetition notation like `(R U R' U')3` or `[R U R' U']2`, strip parentheses/brackets,
 * normalize apostrophes, and return clean space-delimited move tokens.
 */
export function tokenizeAlg(alg: string): string[] {
  if (!alg) return [];
  let s = alg
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Iteratively expand parenthesized/bracketed repetition groups: e.g. (R U R' U')3
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner: string, countStr: string) => {
      const count = Math.min(24, Math.max(1, parseInt(countStr, 10) || 1));
      return ' ' + Array(count).fill(inner.trim()).join(' ') + ' ';
    });
  }

  // Strip remaining grouping parentheses and brackets
  s = s.replace(/[()[\]]/g, ' ').trim();
  if (!s) return [];

  return s.split(/\s+/).filter(Boolean);
}

/**
 * Invert a single WCA move token (e.g. R -> R', R' -> R, R2 -> R2, R2' -> R2, r -> r', M' -> M).
 */
export function invertSingleMove(move: string): string {
  const m = move.trim().replace(/[()[\]]/g, '');
  if (!m) return '';
  // Handle 180-degree turns such as U2, U2', Rw2, r2'
  if (m.endsWith("2'") || m.endsWith('2')) {
    return m.replace(/2'$/, '2');
  }
  if (m.endsWith("'")) {
    return m.slice(0, -1);
  }
  return `${m}'`;
}

/**
 * Strip parentheses/brackets and cleanly reverse any algorithm sequence.
 * Example: `(R U R' U')` -> `U R U' R'`
 */
export function invertAlg(alg: string): string {
  const tokens = tokenizeAlg(alg);
  return tokens
    .slice()
    .reverse()
    .map(invertSingleMove)
    .filter(Boolean)
    .join(' ');
}

/**
 * Apply a single elementary or composite WCA move to a 54-sticker CubeNetState.
 * Supports:
 * - Outer faces: U, D, L, R, F, B (with ', 2, 2' modifiers)
 * - Wide moves: u, d, l, r, f, b and Uw, Dw, Lw, Rw, Fw, Bw
 * - Slice moves: M (follows L), E (follows D), S (follows F)
 * - Cube rotations: x (follows R), y (follows U), z (follows F)
 */
export function applySimulatorMove(cube: CubeNetState, rawMove: string): CubeNetState {
  let m = rawMove.trim().replace(/[()[\]]/g, '');
  if (!m) return cube;

  // Normalize 2' (e.g. U2' -> U2)
  if (m.endsWith("2'")) {
    m = m.slice(0, -1);
  }

  if (m.endsWith('2')) {
    const base = m.slice(0, -1);
    return applySimulatorMove(applySimulatorMove(cube, base), base);
  }

  if (m.endsWith("'")) {
    const base = m.slice(0, -1);
    return applySimulatorMove(
      applySimulatorMove(applySimulatorMove(cube, base), base),
      base
    );
  }

  // Normalize wide moves Uw, Dw, Lw, Rw, Fw, Bw -> u, d, l, r, f, b
  if (m.length === 2 && (m[1] === 'w' || m[1] === 'W')) {
    m = m[0].toLowerCase();
  }

  // Wide moves decomposed into outer + slice moves:
  // M follows L, E follows D, S follows F
  switch (m) {
    case 'u':
      return applySimulatorMove(applySimulatorMove(cube, 'U'), "E'");
    case 'd':
      return applySimulatorMove(applySimulatorMove(cube, 'D'), 'E');
    case 'l':
      return applySimulatorMove(applySimulatorMove(cube, 'L'), 'M');
    case 'r':
      return applySimulatorMove(applySimulatorMove(cube, 'R'), "M'");
    case 'f':
      return applySimulatorMove(applySimulatorMove(cube, 'F'), 'S');
    case 'b':
      return applySimulatorMove(applySimulatorMove(cube, 'B'), "S'");
    case 'x':
      return applySimulatorMove(
        applySimulatorMove(applySimulatorMove(cube, 'R'), "M'"),
        "L'"
      );
    case 'y':
      return applySimulatorMove(
        applySimulatorMove(applySimulatorMove(cube, 'U'), "E'"),
        "D'"
      );
    case 'z':
      return applySimulatorMove(
        applySimulatorMove(applySimulatorMove(cube, 'F'), 'S'),
        "B'"
      );
  }

  const c = cloneCube(cube);

  switch (m) {
    case 'U': {
      c.U = rotateFaceCW(c.U);
      const temp = [c.F[0], c.F[1], c.F[2]];
      c.F[0] = c.R[0]; c.F[1] = c.R[1]; c.F[2] = c.R[2];
      c.R[0] = c.B[0]; c.R[1] = c.B[1]; c.R[2] = c.B[2];
      c.B[0] = c.L[0]; c.B[1] = c.L[1]; c.B[2] = c.L[2];
      c.L[0] = temp[0]; c.L[1] = temp[1]; c.L[2] = temp[2];
      break;
    }
    case 'D': {
      c.D = rotateFaceCW(c.D);
      const temp = [c.F[6], c.F[7], c.F[8]];
      c.F[6] = c.L[6]; c.F[7] = c.L[7]; c.F[8] = c.L[8];
      c.L[6] = c.B[6]; c.L[7] = c.B[7]; c.L[8] = c.B[8];
      c.B[6] = c.R[6]; c.B[7] = c.R[7]; c.B[8] = c.R[8];
      c.R[6] = temp[0]; c.R[7] = temp[1]; c.R[8] = temp[2];
      break;
    }
    case 'F': {
      c.F = rotateFaceCW(c.F);
      const temp = [c.U[6], c.U[7], c.U[8]];
      c.U[6] = c.L[8]; c.U[7] = c.L[5]; c.U[8] = c.L[2];
      c.L[2] = c.D[0]; c.L[5] = c.D[1]; c.L[8] = c.D[2];
      c.D[0] = c.R[6]; c.D[1] = c.R[3]; c.D[2] = c.R[0];
      c.R[0] = temp[0]; c.R[3] = temp[1]; c.R[6] = temp[2];
      break;
    }
    case 'B': {
      c.B = rotateFaceCW(c.B);
      const temp = [c.U[0], c.U[1], c.U[2]];
      c.U[0] = c.R[2]; c.U[1] = c.R[5]; c.U[2] = c.R[8];
      c.R[2] = c.D[8]; c.R[5] = c.D[7]; c.R[8] = c.D[6];
      c.D[6] = c.L[0]; c.D[7] = c.L[3]; c.D[8] = c.L[6];
      c.L[0] = temp[2]; c.L[3] = temp[1]; c.L[6] = temp[0];
      break;
    }
    case 'R': {
      c.R = rotateFaceCW(c.R);
      const temp = [c.U[2], c.U[5], c.U[8]];
      c.U[2] = c.F[2]; c.U[5] = c.F[5]; c.U[8] = c.F[8];
      c.F[2] = c.D[2]; c.F[5] = c.D[5]; c.F[8] = c.D[8];
      c.D[2] = c.B[6]; c.D[5] = c.B[3]; c.D[8] = c.B[0];
      c.B[0] = temp[2]; c.B[3] = temp[1]; c.B[6] = temp[0];
      break;
    }
    case 'L': {
      c.L = rotateFaceCW(c.L);
      const temp = [c.U[0], c.U[3], c.U[6]];
      c.U[0] = c.B[8]; c.U[3] = c.B[5]; c.U[6] = c.B[2];
      c.B[2] = c.D[6]; c.B[5] = c.D[3]; c.B[8] = c.D[0];
      c.D[0] = c.F[0]; c.D[3] = c.F[3]; c.D[6] = c.F[6];
      c.F[0] = temp[0]; c.F[3] = temp[1]; c.F[6] = temp[2];
      break;
    }
    case 'M': {
      // M follows L direction (U -> F -> D -> B -> U)
      const temp = [c.U[1], c.U[4], c.U[7]];
      c.U[1] = c.B[7]; c.U[4] = c.B[4]; c.U[7] = c.B[1];
      c.B[1] = c.D[7]; c.B[4] = c.D[4]; c.B[7] = c.D[1];
      c.D[1] = c.F[1]; c.D[4] = c.F[4]; c.D[7] = c.F[7];
      c.F[1] = temp[0]; c.F[4] = temp[1]; c.F[7] = temp[2];
      break;
    }
    case 'E': {
      // E follows D direction (F -> R -> B -> L -> F)
      const temp = [c.F[3], c.F[4], c.F[5]];
      c.F[3] = c.L[3]; c.F[4] = c.L[4]; c.F[5] = c.L[5];
      c.L[3] = c.B[3]; c.L[4] = c.B[4]; c.L[5] = c.B[5];
      c.B[3] = c.R[3]; c.B[4] = c.R[4]; c.B[5] = c.R[5];
      c.R[3] = temp[0]; c.R[4] = temp[1]; c.R[5] = temp[2];
      break;
    }
    case 'S': {
      // S follows F direction (U -> R -> D -> L -> U)
      const temp = [c.U[3], c.U[4], c.U[5]];
      c.U[3] = c.L[7]; c.U[4] = c.L[4]; c.U[5] = c.L[1];
      c.L[1] = c.D[3]; c.L[4] = c.D[4]; c.L[7] = c.D[5];
      c.D[3] = c.R[7]; c.D[4] = c.R[4]; c.D[5] = c.R[1];
      c.R[1] = temp[0]; c.R[4] = temp[1]; c.R[7] = temp[2];
      break;
    }
  }

  return c;
}

/**
 * Apply a full algorithm string to a given CubeNetState.
 */
export function applyAlg(cube: CubeNetState, alg: string): CubeNetState {
  const tokens = tokenizeAlg(alg);
  let state = cloneCube(cube);
  for (const token of tokens) {
    state = applySimulatorMove(state, token);
  }
  return state;
}

/**
 * Build a solved CubeNetState for a given ColorScheme (or preset key).
 */
export function createSolvedCubeForScheme(
  colorScheme?: Partial<ColorScheme> | string
): { solvedCube: CubeNetState; scheme: ColorScheme } {
  let scheme: ColorScheme = { ...DEFAULT_COLOR_SCHEME };

  if (typeof colorScheme === 'string') {
    if (PRESET_COLOR_SCHEMES[colorScheme]) {
      scheme = { ...PRESET_COLOR_SCHEMES[colorScheme] };
    }
  } else if (colorScheme && typeof colorScheme === 'object') {
    scheme = { ...DEFAULT_COLOR_SCHEME, ...colorScheme };
  }

  const solvedCube: CubeNetState = {
    U: Array(9).fill(scheme.U) as CubeFaceState,
    D: Array(9).fill(scheme.D) as CubeFaceState,
    F: Array(9).fill(scheme.F) as CubeFaceState,
    B: Array(9).fill(scheme.B) as CubeFaceState,
    L: Array(9).fill(scheme.L) as CubeFaceState,
    R: Array(9).fill(scheme.R) as CubeFaceState,
  };

  return { solvedCube, scheme };
}

/**
 * Re-orient the entire cube using 3D rotations (x, y, z) so that the D center matches scheme.D
 * and the F center matches scheme.F (handling algorithms that contain net rotations or wide moves).
 */
function realignCubeCenters(cube: CubeNetState, scheme: ColorScheme): CubeNetState {
  let c = cloneCube(cube);

  // 1. Bring scheme.D color center to D face
  if (c.D[4] !== scheme.D) {
    if (c.U[4] === scheme.D) c = applyAlg(c, 'x2');
    else if (c.F[4] === scheme.D) c = applyAlg(c, "x'");
    else if (c.B[4] === scheme.D) c = applyAlg(c, 'x');
    else if (c.L[4] === scheme.D) c = applyAlg(c, "z'");
    else if (c.R[4] === scheme.D) c = applyAlg(c, 'z');
  }

  // 2. Rotate around Y axis to bring scheme.F color center to F face
  for (let i = 0; i < 4; i++) {
    if (c.F[4] === scheme.F) break;
    c = applySimulatorMove(c, 'y');
  }

  return c;
}

/**
 * U-layer Corner and Edge slot definitions for automatic permutation arrow calculation.
 */
const U_CORNER_SLOTS: {
  cell: number;
  stickers: [{ face: FaceKey; idx: number }, { face: FaceKey; idx: number }, { face: FaceKey; idx: number }];
  homeFaces: [FaceKey, FaceKey];
}[] = [
  {
    cell: 0, // UBL
    stickers: [{ face: 'U', idx: 0 }, { face: 'B', idx: 2 }, { face: 'L', idx: 0 }],
    homeFaces: ['B', 'L'],
  },
  {
    cell: 2, // UBR
    stickers: [{ face: 'U', idx: 2 }, { face: 'B', idx: 0 }, { face: 'R', idx: 2 }],
    homeFaces: ['B', 'R'],
  },
  {
    cell: 6, // UFL
    stickers: [{ face: 'U', idx: 6 }, { face: 'F', idx: 0 }, { face: 'L', idx: 2 }],
    homeFaces: ['F', 'L'],
  },
  {
    cell: 8, // UFR
    stickers: [{ face: 'U', idx: 8 }, { face: 'F', idx: 2 }, { face: 'R', idx: 0 }],
    homeFaces: ['F', 'R'],
  },
];

const U_EDGE_SLOTS: {
  cell: number;
  stickers: [{ face: FaceKey; idx: number }, { face: FaceKey; idx: number }];
  homeFace: FaceKey;
}[] = [
  {
    cell: 1, // UB
    stickers: [{ face: 'U', idx: 1 }, { face: 'B', idx: 1 }],
    homeFace: 'B',
  },
  {
    cell: 3, // UL
    stickers: [{ face: 'U', idx: 3 }, { face: 'L', idx: 1 }],
    homeFace: 'L',
  },
  {
    cell: 5, // UR
    stickers: [{ face: 'U', idx: 5 }, { face: 'R', idx: 1 }],
    homeFace: 'R',
  },
  {
    cell: 7, // UF
    stickers: [{ face: 'U', idx: 7 }, { face: 'F', idx: 1 }],
    homeFace: 'F',
  },
];

/**
 * Automatically compute U-layer permutation vectors (arrows) by comparing where each U-layer
 * corner and edge in `beforeState` belongs in `afterState` (solved reference).
 * Emits double-headed arrows (`bidirectional: true`) for 2-cycle swaps and single-headed arrows
 * (`bidirectional: false`) for 3-cycles / 4-cycles.
 */
export function computePermutationArrows(cubeState: CubeNetState): PermutationArrow[] {
  const arrows: PermutationArrow[] = [];
  const uColor = cubeState.U[4];
  const centerColors: Record<FaceKey, CubeColor> = {
    U: cubeState.U[4],
    D: cubeState.D[4],
    F: cubeState.F[4],
    B: cubeState.B[4],
    L: cubeState.L[4],
    R: cubeState.R[4],
  };

  // Map fromCell -> toCell
  const cornerTargets = new Map<number, number>();
  for (const slot of U_CORNER_SLOTS) {
    const colors = slot.stickers.map((s) => cubeState[s.face][s.idx]);
    if (!colors.includes(uColor)) continue;
    const sideColors = colors.filter((c) => c !== uColor);
    if (sideColors.length !== 2) continue;

    // Find which U corner slot has these two side center colors
    for (const targetSlot of U_CORNER_SLOTS) {
      const c1 = centerColors[targetSlot.homeFaces[0]];
      const c2 = centerColors[targetSlot.homeFaces[1]];
      if (
        (sideColors[0] === c1 && sideColors[1] === c2) ||
        (sideColors[0] === c2 && sideColors[1] === c1)
      ) {
        if (slot.cell !== targetSlot.cell) {
          cornerTargets.set(slot.cell, targetSlot.cell);
        }
        break;
      }
    }
  }

  const edgeTargets = new Map<number, number>();
  for (const slot of U_EDGE_SLOTS) {
    const colors = slot.stickers.map((s) => cubeState[s.face][s.idx]);
    if (!colors.includes(uColor)) continue;
    const sideColors = colors.filter((c) => c !== uColor);
    if (sideColors.length !== 1) continue;

    for (const targetSlot of U_EDGE_SLOTS) {
      if (sideColors[0] === centerColors[targetSlot.homeFace]) {
        if (slot.cell !== targetSlot.cell) {
          edgeTargets.set(slot.cell, targetSlot.cell);
        }
        break;
      }
    }
  }

  // Process corners into arrows (collapsing 2-cycles into bidirectional swap arrows)
  const visitedCorners = new Set<number>();
  for (const [fromCell, toCell] of cornerTargets.entries()) {
    if (visitedCorners.has(fromCell)) continue;
    const isSwap = cornerTargets.get(toCell) === fromCell;
    if (isSwap) {
      visitedCorners.add(fromCell);
      visitedCorners.add(toCell);
      const start = Math.min(fromCell, toCell);
      const end = Math.max(fromCell, toCell);
      arrows.push({
        fromCell: start,
        toCell: end,
        from: U_CORNER_ARROW_COORDS[start] || U_CELL_SVG_COORDS[start],
        to: U_CORNER_ARROW_COORDS[end] || U_CELL_SVG_COORDS[end],
        bidirectional: true,
        pieceType: 'corner',
      });
    } else {
      visitedCorners.add(fromCell);
      arrows.push({
        fromCell,
        toCell,
        from: U_CORNER_ARROW_COORDS[fromCell] || U_CELL_SVG_COORDS[fromCell],
        to: U_CORNER_ARROW_COORDS[toCell] || U_CELL_SVG_COORDS[toCell],
        bidirectional: false,
        pieceType: 'corner',
      });
    }
  }

  // Process edges into arrows (collapsing 2-cycles into bidirectional swap arrows)
  const visitedEdges = new Set<number>();
  for (const [fromCell, toCell] of edgeTargets.entries()) {
    if (visitedEdges.has(fromCell)) continue;
    const isSwap = edgeTargets.get(toCell) === fromCell;
    if (isSwap) {
      visitedEdges.add(fromCell);
      visitedEdges.add(toCell);
      const start = Math.min(fromCell, toCell);
      const end = Math.max(fromCell, toCell);
      arrows.push({
        fromCell: start,
        toCell: end,
        from: U_EDGE_ARROW_COORDS[start] || U_CELL_SVG_COORDS[start],
        to: U_EDGE_ARROW_COORDS[end] || U_CELL_SVG_COORDS[end],
        bidirectional: true,
        pieceType: 'edge',
      });
    } else {
      visitedEdges.add(fromCell);
      arrows.push({
        fromCell,
        toCell,
        from: U_EDGE_ARROW_COORDS[fromCell] || U_CELL_SVG_COORDS[fromCell],
        to: U_EDGE_ARROW_COORDS[toCell] || U_CELL_SVG_COORDS[toCell],
        bidirectional: false,
        pieceType: 'edge',
      });
    }
  }

  return arrows;
}

/**
 * Takes a solved cube (defaulting to White=D, Yellow=U, Green=F, Red=R, Blue=B, Orange=L,
 * or customizable colorScheme), applies `invertAlg(mainAlg)`, and returns:
 * a) The exact 54-sticker state for the 3D Cube and 2D Top-Down SVG renderer.
 * b) Automatic Permutation Vectors (`arrows`) for PLL, CMLL, COLL, and ZBLL cases.
 */
export function getCaseState(
  mainAlg: string,
  colorScheme?: Partial<ColorScheme> | string
): CaseSimulationResult {
  const { solvedCube, scheme } = createSolvedCubeForScheme(colorScheme);
  const tokens = tokenizeAlg(mainAlg);
  const inverseAlg = invertAlg(mainAlg);

  const rawPreState = applyAlg(solvedCube, inverseAlg);
  const cubeState = realignCubeCenters(rawPreState, scheme);

  const topColor = cubeState.U[4];
  const topFaceColors = [...cubeState.U];
  const topFaceMask: ('yellow' | 'gray' | 'white' | 'active')[] = cubeState.U.map((c) => {
    if (c === topColor) {
      return topColor === 'white' ? 'white' : 'yellow';
    }
    return 'gray';
  });

  const sideStickers = {
    top: [cubeState.B[2], cubeState.B[1], cubeState.B[0]] as [CubeColor, CubeColor, CubeColor],
    bottom: [cubeState.F[0], cubeState.F[1], cubeState.F[2]] as [CubeColor, CubeColor, CubeColor],
    left: [cubeState.L[0], cubeState.L[1], cubeState.L[2]] as [CubeColor, CubeColor, CubeColor],
    right: [cubeState.R[2], cubeState.R[1], cubeState.R[0]] as [CubeColor, CubeColor, CubeColor],
  };

  const bars = {
    top: sideStickers.top.map((c) => c === topColor) as [boolean, boolean, boolean],
    bottom: sideStickers.bottom.map((c) => c === topColor) as [boolean, boolean, boolean],
    left: sideStickers.left.map((c) => c === topColor) as [boolean, boolean, boolean],
    right: sideStickers.right.map((c) => c === topColor) as [boolean, boolean, boolean],
  };

  const arrows = computePermutationArrows(cubeState);

  return {
    cubeState,
    topFaceColors,
    topFaceMask,
    sideStickers,
    bars,
    arrows,
    inverseAlg,
    moveCount: tokens.length,
  };
}
