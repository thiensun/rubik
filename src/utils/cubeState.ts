// 3x3 Rubik's Cube mathematical model & WCA scramble engine

export type FaceKey = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red';

export type CubeFaceState = [
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor
];

export interface CubeNetState {
  U: CubeFaceState;
  D: CubeFaceState;
  F: CubeFaceState;
  B: CubeFaceState;
  L: CubeFaceState;
  R: CubeFaceState;
}

export const CUBE_HEX_COLORS: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FACC15',
  green: '#10B981',
  blue: '#3B82F6',
  orange: '#F97316',
  red: '#EF4444',
};

export const SOLVED_CUBE: CubeNetState = {
  U: Array(9).fill('yellow') as CubeFaceState,
  D: Array(9).fill('white') as CubeFaceState,
  F: Array(9).fill('green') as CubeFaceState,
  B: Array(9).fill('blue') as CubeFaceState,
  L: Array(9).fill('orange') as CubeFaceState,
  R: Array(9).fill('red') as CubeFaceState,
};

// Expand repetition groups like (R U R' U')3, strip brackets, and collapse extra spaces
export function expandAlgorithmNotation(notation: string): string {
  if (!notation) return '';
  let str = notation;
  // Expand repeated parenthesized groups, e.g. (R U R' U')3 or [R U R' U']2
  str = str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    const repeated: string[] = [];
    for (let i = 0; i < times; i++) {
      repeated.push(inner.trim());
    }
    return ' ' + repeated.join(' ') + ' ';
  });
  // Strip remaining parentheses and brackets
  str = str.replace(/[()[\]]/g, ' ');
  // Collapse whitespace
  return str.trim().replace(/\s+/g, ' ');
}

// Invert standard Rubik move (e.g. R -> R', R' -> R, R2 -> R2, r -> r', M -> M')
export function invertMove(move: string): string {
  const m = move.trim().replace(/[()[\]]/g, '');
  if (!m) return '';
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

// Invert full sequence of moves (e.g. Scramble -> Solution)
export function invertMoves(movesStr: string): string {
  const expanded = expandAlgorithmNotation(movesStr);
  const tokens = expanded.split(/\s+/).filter(Boolean);
  return tokens.slice().reverse().map(invertMove).join(' ');
}


export function cloneCube(cube: CubeNetState): CubeNetState {
  return {
    U: [...cube.U] as CubeFaceState,
    D: [...cube.D] as CubeFaceState,
    F: [...cube.F] as CubeFaceState,
    B: [...cube.B] as CubeFaceState,
    L: [...cube.L] as CubeFaceState,
    R: [...cube.R] as CubeFaceState,
  };
}

function rotateFaceClockwise(face: CubeFaceState): CubeFaceState {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

export function applyMove(cube: CubeNetState, move: string): CubeNetState {
  let m = move.trim().replace(/[()[\]]/g, '');
  if (!m) return cube;

  if (m.endsWith('2')) {
    const base = m.slice(0, -1);
    return applyMove(applyMove(cube, base), base);
  }
  if (m.endsWith("'")) {
    const base = m.slice(0, -1);
    return applyMove(applyMove(applyMove(cube, base), base), base);
  }

  // Normalize wide moves with 'w' suffix (e.g. Rw -> r, Lw -> l, Uw -> u, etc.)
  if (m.length === 2 && (m[1] === 'w' || m[1] === 'W')) {
    m = m[0].toLowerCase();
  }

  // Decompose wide moves into elementary outer + slice moves
  if (m === 'r') return applyMove(applyMove(cube, 'R'), "M'");
  if (m === 'l') return applyMove(applyMove(cube, 'L'), 'M');
  if (m === 'u') return applyMove(applyMove(cube, 'U'), "E'");
  if (m === 'd') return applyMove(applyMove(cube, 'D'), 'E');
  if (m === 'f') return applyMove(applyMove(cube, 'F'), 'S');
  if (m === 'b') return applyMove(applyMove(cube, 'B'), "S'");

  // Decompose cube rotations into outer + slice + outer moves
  if (m === 'x') return applyMove(applyMove(applyMove(cube, 'R'), "M'"), "L'");
  if (m === 'y') return applyMove(applyMove(applyMove(cube, 'U'), "E'"), "D'");
  if (m === 'z') return applyMove(applyMove(applyMove(cube, 'F'), 'S'), "B'");

  const c = cloneCube(cube);

  switch (m) {
    case 'U': {
      c.U = rotateFaceClockwise(c.U);
      const temp = [c.F[0], c.F[1], c.F[2]];
      c.F[0] = c.R[0]; c.F[1] = c.R[1]; c.F[2] = c.R[2];
      c.R[0] = c.B[0]; c.R[1] = c.B[1]; c.R[2] = c.B[2];
      c.B[0] = c.L[0]; c.B[1] = c.L[1]; c.B[2] = c.L[2];
      c.L[0] = temp[0]; c.L[1] = temp[1]; c.L[2] = temp[2];
      break;
    }
    case 'D': {
      c.D = rotateFaceClockwise(c.D);
      const temp = [c.F[6], c.F[7], c.F[8]];
      c.F[6] = c.L[6]; c.F[7] = c.L[7]; c.F[8] = c.L[8];
      c.L[6] = c.B[6]; c.L[7] = c.B[7]; c.L[8] = c.B[8];
      c.B[6] = c.R[6]; c.B[7] = c.R[7]; c.B[8] = c.R[8];
      c.R[6] = temp[0]; c.R[7] = temp[1]; c.R[8] = temp[2];
      break;
    }
    case 'F': {
      c.F = rotateFaceClockwise(c.F);
      const temp = [c.U[6], c.U[7], c.U[8]];
      c.U[6] = c.L[8]; c.U[7] = c.L[5]; c.U[8] = c.L[2];
      c.L[2] = c.D[0]; c.L[5] = c.D[1]; c.L[8] = c.D[2];
      c.D[0] = c.R[6]; c.D[1] = c.R[3]; c.D[2] = c.R[0];
      c.R[0] = temp[0]; c.R[3] = temp[1]; c.R[6] = temp[2];
      break;
    }
    case 'B': {
      c.B = rotateFaceClockwise(c.B);
      const temp = [c.U[0], c.U[1], c.U[2]];
      c.U[0] = c.R[2]; c.U[1] = c.R[5]; c.U[2] = c.R[8];
      c.R[2] = c.D[8]; c.R[5] = c.D[7]; c.R[8] = c.D[6];
      c.D[6] = c.L[0]; c.D[7] = c.L[3]; c.D[8] = c.L[6];
      c.L[0] = temp[2]; c.L[3] = temp[1]; c.L[6] = temp[0];
      break;
    }
    case 'R': {
      c.R = rotateFaceClockwise(c.R);
      const temp = [c.U[2], c.U[5], c.U[8]];
      c.U[2] = c.F[2]; c.U[5] = c.F[5]; c.U[8] = c.F[8];
      c.F[2] = c.D[2]; c.F[5] = c.D[5]; c.F[8] = c.D[8];
      c.D[2] = c.B[6]; c.D[5] = c.B[3]; c.D[8] = c.B[0];
      c.B[0] = temp[2]; c.B[3] = temp[1]; c.B[6] = temp[0];
      break;
    }
    case 'L': {
      c.L = rotateFaceClockwise(c.L);
      const temp = [c.U[0], c.U[3], c.U[6]];
      c.U[0] = c.B[8]; c.U[3] = c.B[5]; c.U[6] = c.B[2];
      c.B[2] = c.D[6]; c.B[5] = c.D[3]; c.B[8] = c.D[0];
      c.D[0] = c.F[0]; c.D[3] = c.F[3]; c.D[6] = c.F[6];
      c.F[0] = temp[0]; c.F[3] = temp[1]; c.F[6] = temp[2];
      break;
    }
    case 'M': {
      const temp = [c.U[1], c.U[4], c.U[7]];
      c.U[1] = c.B[7]; c.U[4] = c.B[4]; c.U[7] = c.B[1];
      c.B[1] = c.D[7]; c.B[4] = c.D[4]; c.B[7] = c.D[1];
      c.D[1] = c.F[1]; c.D[4] = c.F[4]; c.D[7] = c.F[7];
      c.F[1] = temp[0]; c.F[4] = temp[1]; c.F[7] = temp[2];
      break;
    }
    case 'E': {
      const temp = [c.F[3], c.F[4], c.F[5]];
      c.F[3] = c.L[3]; c.F[4] = c.L[4]; c.F[5] = c.L[5];
      c.L[3] = c.B[3]; c.L[4] = c.B[4]; c.L[5] = c.B[5];
      c.B[3] = c.R[3]; c.B[4] = c.R[4]; c.B[5] = c.R[5];
      c.R[3] = temp[0]; c.R[4] = temp[1]; c.R[5] = temp[2];
      break;
    }
    case 'S': {
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

export function applyScramble(scrambleStr: string): CubeNetState {
  const expanded = expandAlgorithmNotation(scrambleStr);
  const moves = expanded.split(/\s+/).filter(Boolean);
  let state = cloneCube(SOLVED_CUBE);
  for (const m of moves) {
    state = applyMove(state, m);
  }
  return state;
}

export function isCubeSolved(cube: CubeNetState): boolean {
  const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  return faces.every((f) => {
    const center = cube[f][4];
    return cube[f].every((st) => st === center);
  });
}

// WCA Scramble Generator (Official 3x3x3 WCA Rule 4b compliant)
const FACES: FaceKey[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];
const AXES: Record<FaceKey, number> = {
  U: 0,
  D: 0,
  L: 1,
  R: 1,
  F: 2,
  B: 2,
};

export function generateWCAScramble(length = 21): string {
  const moves: string[] = [];
  let lastFace: FaceKey | null = null;
  let secondLastFace: FaceKey | null = null;

  for (let i = 0; i < length; i++) {
    const allowedFaces = FACES.filter((f) => {
      if (f === lastFace) return false;
      // Cannot share same axis with last two if consecutive (e.g. R L R2 is redundant)
      if (
        secondLastFace &&
        AXES[f] === AXES[lastFace!] &&
        AXES[f] === AXES[secondLastFace]
      ) {
        return false;
      }
      return true;
    });

    const chosenFace = allowedFaces[Math.floor(Math.random() * allowedFaces.length)];
    const chosenMod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${chosenFace}${chosenMod}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return moves.join(' ');
}
