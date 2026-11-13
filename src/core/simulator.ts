import { CubeSize } from './types';
import { CubeColor, CubeNetState, FaceKey } from '../utils/cubeState';
import { ColorScheme, DEFAULT_COLOR_SCHEME } from '../engine/algSimulator';

export type ParametricCubeState = Record<FaceKey, CubeColor[]>;

export function createSolvedParametricCube(
  cubeSize: CubeSize,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
): ParametricCubeState {
  const count = cubeSize * cubeSize;
  return {
    U: Array(count).fill(colorScheme.U),
    D: Array(count).fill(colorScheme.D),
    F: Array(count).fill(colorScheme.F),
    B: Array(count).fill(colorScheme.B),
    L: Array(count).fill(colorScheme.L),
    R: Array(count).fill(colorScheme.R),
  };
}

export function cloneParametricCube(state: ParametricCubeState): ParametricCubeState {
  return {
    U: [...state.U],
    D: [...state.D],
    F: [...state.F],
    B: [...state.B],
    L: [...state.L],
    R: [...state.R],
  };
}

function rotateFaceCW(face: CubeColor[], n: number): CubeColor[] {
  const out = new Array<CubeColor>(n * n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[c * n + (n - 1 - r)] = face[r * n + c];
    }
  }
  return out;
}

function rotateFaceCCW(face: CubeColor[], n: number): CubeColor[] {
  return rotateFaceCW(rotateFaceCW(rotateFaceCW(face, n), n), n);
}

const OPPOSITE_FACE: Record<FaceKey, FaceKey> = {
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F',
  L: 'R',
  R: 'L',
};

/**
 * Rotate a single layer slice at depth `d` (0 = outer face, 1 = inner slice) clockwise 90 deg
 * around `faceKey` on an N x N x N cube.
 */
function rotateSliceCW(
  state: ParametricCubeState,
  faceKey: FaceKey,
  d: number,
  n: number,
): void {
  if (d < 0 || d >= n) return;
  if (d === 0) {
    state[faceKey] = rotateFaceCW(state[faceKey], n);
  }
  if (d === n - 1) {
    const opp = OPPOSITE_FACE[faceKey];
    state[opp] = rotateFaceCCW(state[opp], n);
  }

  const idx = (r: number, c: number) => r * n + c;

  switch (faceKey) {
    case 'U': {
      for (let i = 0; i < n; i++) {
        const tmp = state.F[idx(d, i)];
        state.F[idx(d, i)] = state.R[idx(d, i)];
        state.R[idx(d, i)] = state.B[idx(d, i)];
        state.B[idx(d, i)] = state.L[idx(d, i)];
        state.L[idx(d, i)] = tmp;
      }
      break;
    }
    case 'D': {
      const r = n - 1 - d;
      for (let i = 0; i < n; i++) {
        const tmp = state.F[idx(r, i)];
        state.F[idx(r, i)] = state.L[idx(r, i)];
        state.L[idx(r, i)] = state.B[idx(r, i)];
        state.B[idx(r, i)] = state.R[idx(r, i)];
        state.R[idx(r, i)] = tmp;
      }
      break;
    }
    case 'R': {
      const c = n - 1 - d;
      for (let i = 0; i < n; i++) {
        const tmp = state.U[idx(i, c)];
        state.U[idx(i, c)] = state.F[idx(i, c)];
        state.F[idx(i, c)] = state.D[idx(i, c)];
        state.D[idx(i, c)] = state.B[idx(n - 1 - i, d)];
        state.B[idx(n - 1 - i, d)] = tmp;
      }
      break;
    }
    case 'L': {
      const bc = n - 1 - d;
      for (let i = 0; i < n; i++) {
        const tmp = state.U[idx(i, d)];
        state.U[idx(i, d)] = state.B[idx(n - 1 - i, bc)];
        state.B[idx(n - 1 - i, bc)] = state.D[idx(i, d)];
        state.D[idx(i, d)] = state.F[idx(i, d)];
        state.F[idx(i, d)] = tmp;
      }
      break;
    }
    case 'F': {
      const ur = n - 1 - d;
      for (let i = 0; i < n; i++) {
        const tmp = state.U[idx(ur, i)];
        state.U[idx(ur, i)] = state.L[idx(n - 1 - i, ur)];
        state.L[idx(n - 1 - i, ur)] = state.D[idx(d, n - 1 - i)];
        state.D[idx(d, n - 1 - i)] = state.R[idx(i, d)];
        state.R[idx(i, d)] = tmp;
      }
      break;
    }
    case 'B': {
      const rc = n - 1 - d;
      for (let i = 0; i < n; i++) {
        const tmp = state.U[idx(d, i)];
        state.U[idx(d, i)] = state.R[idx(i, rc)];
        state.R[idx(i, rc)] = state.D[idx(rc, n - 1 - i)];
        state.D[idx(rc, n - 1 - i)] = state.L[idx(n - 1 - i, d)];
        state.L[idx(n - 1 - i, d)] = tmp;
      }
      break;
    }
  }
}

export function isWideOrSliceMove(move: string): boolean {
  const clean = move.trim().replace(/[()[\]]/g, '');
  if (!clean) return false;
  if (/^2[UDLRFB]/i.test(clean)) return true;
  if (/^[UDLRFB]w/i.test(clean)) return true;
  if (/^[udlrfb]['2]?$/.test(clean)) return true;
  if (/^[MES]['2]?$/.test(clean)) return true;
  return false;
}

/**
 * Invert an algorithm string strictly following `.agents/rules/rubik-math.md`:
 * - Strip parentheses and tokenize moves accurately (preserving `2R` and `Rw` prefixes)
 * - Reverse token order from last to first
 * - Flip `'`, keeping `2` self-inverse (`R2 -> R2`, `Rw2 -> Rw2`, `2R2 -> 2R2`)
 */
export function invertAlg(alg: string): string {
  if (!alg || !alg.trim()) return '';
  let expanded = alg.replace(/[’‘`´]/g, "'");
  expanded = expanded.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    return ' ' + Array(times).fill(inner.trim()).join(' ') + ' ';
  });
  expanded = expanded.replace(/[()[\]]/g, ' ').trim();
  if (!expanded) return '';

  const tokens = expanded.split(/\s+/).filter(Boolean);
  return tokens
    .reverse()
    .map((tok) => {
      if (tok.endsWith("2'")) return tok.slice(0, -1);
      if (tok.endsWith('2')) return tok;
      if (tok.endsWith("'")) return tok.slice(0, -1);
      return `${tok}'`;
    })
    .join(' ');
}

export function applyParametricMove(
  state: ParametricCubeState,
  moveStr: string,
  cubeSize: CubeSize,
): ParametricCubeState {
  const clean = moveStr.trim().replace(/[()[\]’‘`´]/g, (ch) => (ch === '’' || ch === '‘' ? "'" : ''));
  if (!clean || clean === '—') return state;

  const next = cloneParametricCube(state);
  const n = cubeSize;

  let baseFace: FaceKey = 'U';
  let depths: number[] = [0];
  let rest = '';

  if (/^2[UDLRFB]/i.test(clean)) {
    baseFace = clean[1].toUpperCase() as FaceKey;
    depths = [Math.min(1, n - 1)];
    rest = clean.slice(2);
  } else if (/^[UDLRFB]w/i.test(clean)) {
    baseFace = clean[0].toUpperCase() as FaceKey;
    depths = n >= 3 ? [0, 1] : [0];
    rest = clean.slice(2);
  } else if (/^[udlrfb]/.test(clean)) {
    baseFace = clean[0].toUpperCase() as FaceKey;
    depths = n >= 3 ? [0, 1] : [0];
    rest = clean.slice(1);
  } else if (/^[MES]/.test(clean)) {
    const sliceChar = clean[0];
    baseFace = sliceChar === 'M' ? 'L' : sliceChar === 'E' ? 'D' : 'F';
    depths = [Math.min(1, n - 1)];
    rest = clean.slice(1);
  } else if (/^[xyz]/.test(clean)) {
    const rotChar = clean[0];
    baseFace = rotChar === 'x' ? 'R' : rotChar === 'y' ? 'U' : 'F';
    depths = Array.from({ length: n }, (_, i) => i);
    rest = clean.slice(1);
  } else if (/^[UDLRFB]/.test(clean)) {
    baseFace = clean[0] as FaceKey;
    depths = [0];
    rest = clean.slice(1);
  } else {
    return next;
  }

  const turns = rest.includes('2') ? 2 : rest.includes("'") ? 3 : 1;

  for (let t = 0; t < turns; t++) {
    for (const d of depths) {
      rotateSliceCW(next, baseFace, d, n);
    }
  }

  return next;
}

export function applyParametricAlg(
  state: ParametricCubeState,
  alg: string,
  cubeSize: CubeSize,
): ParametricCubeState {
  if (!alg || !alg.trim()) return cloneParametricCube(state);
  let expanded = alg.replace(/[’‘`´]/g, "'");
  expanded = expanded.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    return ' ' + Array(times).fill(inner.trim()).join(' ') + ' ';
  });
  expanded = expanded.replace(/[()[\]]/g, ' ').trim();
  const tokens = expanded.split(/\s+/).filter(Boolean);
  let cur = cloneParametricCube(state);
  for (const tok of tokens) {
    cur = applyParametricMove(cur, tok, cubeSize);
  }
  return cur;
}

export function getPreExecutionParametricState(
  mainAlg: string,
  cubeSize: CubeSize,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
): ParametricCubeState {
  const solved = createSolvedParametricCube(cubeSize, colorScheme);
  const inv = invertAlg(mainAlg);
  return applyParametricAlg(solved, inv, cubeSize);
}

const SOLVED_CUBE_COLOR_SCHEME: ColorScheme = {
  U: 'yellow',
  D: 'white',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
};

export function getPreExecutionCubeNetState(
  mainAlg: string,
  cubeSize: CubeSize,
): CubeNetState {
  const solved = createSolvedParametricCube(cubeSize, SOLVED_CUBE_COLOR_SCHEME);
  const inv = invertAlg(mainAlg);
  return applyParametricAlg(solved, inv, cubeSize) as unknown as CubeNetState;
}

export function applyScrambleToParametricCubeNet(
  scramble: string,
  cubeSize: CubeSize,
): CubeNetState {
  const solved = createSolvedParametricCube(cubeSize, SOLVED_CUBE_COLOR_SCHEME);
  return applyParametricAlg(solved, scramble, cubeSize) as unknown as CubeNetState;
}

export function projectParametricTo3x3Net(
  state: ParametricCubeState,
  cubeSize: CubeSize,
): CubeNetState {
  const projectFace = (arr: CubeColor[]) => {
    if (cubeSize === 3) return [...arr] as any;
    if (cubeSize === 2) {
      const c0 = arr[0] || 'white';
      const c1 = arr[1] || c0;
      const c2 = arr[2] || c0;
      const c3 = arr[3] || c0;
      return [c0, c0, c1, c0, c0, c1, c2, c2, c3] as any;
    }
    // 4x4 -> 3x3 projection
    return [
      arr[0], arr[1], arr[3],
      arr[4], arr[5], arr[7],
      arr[12], arr[13], arr[15],
    ] as any;
  };

  return {
    U: projectFace(state.U),
    D: projectFace(state.D),
    F: projectFace(state.F),
    B: projectFace(state.B),
    L: projectFace(state.L),
    R: projectFace(state.R),
  };
}
