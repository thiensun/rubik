// Test helper implementing cubeState logic in CommonJS
const FACES = ['U', 'D', 'F', 'B', 'L', 'R'];

const SOLVED_CUBE = {
  U: Array(9).fill('yellow'),
  D: Array(9).fill('white'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
};

function cloneCube(cube) {
  return {
    U: [...cube.U], D: [...cube.D], F: [...cube.F],
    B: [...cube.B], L: [...cube.L], R: [...cube.R],
  };
}

function rotateFaceClockwise(face) {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

function applyMove(cube, move) {
  const m = move.trim();
  if (!m) return cube;
  if (m.endsWith('2')) {
    const base = m.slice(0, -1);
    return applyMove(applyMove(cube, base), base);
  }
  if (m.endsWith("'")) {
    const base = m.slice(0, -1);
    return applyMove(applyMove(applyMove(cube, base), base), base);
  }

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
  }
  return c;
}

function applyScramble(scrambleStr) {
  const moves = scrambleStr.trim().split(/\s+/).filter(Boolean);
  let state = cloneCube(SOLVED_CUBE);
  for (const m of moves) {
    state = applyMove(state, m);
  }
  return state;
}

function isCubeSolved(cube) {
  return FACES.every((f) => {
    const center = cube[f][4];
    return cube[f].every((st) => st === center);
  });
}

function invertMove(move) {
  const m = move.trim();
  if (!m) return '';
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

function invertMoves(movesStr) {
  const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
  return tokens.slice().reverse().map(invertMove).join(' ');
}

module.exports = {
  FACES,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  isCubeSolved,
  invertMove,
  invertMoves
};
