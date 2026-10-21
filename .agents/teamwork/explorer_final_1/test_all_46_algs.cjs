const fs = require('fs');

function cloneCube(cube) {
  return {
    U: [...cube.U],
    D: [...cube.D],
    F: [...cube.F],
    B: [...cube.B],
    L: [...cube.L],
    R: [...cube.R],
  };
}

function rotateFaceClockwise(face) {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ];
}

const SOLVED_CUBE = {
  U: Array(9).fill('yellow'),
  D: Array(9).fill('white'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
};

function isCubeSolved(cube) {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  return faces.every((f) => {
    const center = cube[f][4];
    return cube[f].every((st) => st === center);
  });
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

  // Handle Wide moves by decomposition
  if (m === 'r' || m === 'Rw') return applyMove(applyMove(cube, 'R'), "M'");
  if (m === 'l' || m === 'Lw') return applyMove(applyMove(cube, 'L'), 'M');
  if (m === 'u' || m === 'Uw') return applyMove(applyMove(cube, 'U'), "E'");
  if (m === 'd' || m === 'Dw') return applyMove(applyMove(cube, 'D'), 'E');
  if (m === 'f' || m === 'Fw') return applyMove(applyMove(cube, 'F'), 'S');
  if (m === 'b' || m === 'Bw') return applyMove(applyMove(cube, 'B'), "S'");

  // Handle Cube rotations by decomposition
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

function expandAlgorithmNotation(notation) {
  if (!notation) return '';
  let str = notation;
  // Replace repeated parenthesized groups, e.g. (R U R' U')3
  str = str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    const repeated = [];
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

function invertMove(move) {
  const m = move.trim();
  if (!m) return '';
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

function invertMoves(movesStr) {
  const expanded = expandAlgorithmNotation(movesStr);
  const tokens = expanded.split(/\s+/).filter(Boolean);
  return tokens.slice().reverse().map(invertMove).join(' ');
}

function applyScramble(scrambleStr) {
  const expanded = expandAlgorithmNotation(scrambleStr);
  const moves = expanded.split(/\s+/).filter(Boolean);
  let state = cloneCube(SOLVED_CUBE);
  for (const m of moves) {
    state = applyMove(state, m);
  }
  return state;
}

// Now test all 46 algorithms in ALGORITHMS_LIBRARY
const content = fs.readFileSync('./src/utils/algorithmsData.ts', 'utf8');
const algRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?notation:\s*"([^"]+)"/g;
let match;
let total = 0;
let solvedCount = 0;
let setupScrambledCount = 0;

const results = [];

while ((match = algRegex.exec(content)) !== null) {
  total++;
  const id = match[1];
  const name = match[2];
  const notation = match[4];

  const inverted = invertMoves(notation);
  const setupState = applyScramble(inverted);
  const isSetupScrambled = !isCubeSolved(setupState);
  if (isSetupScrambled) setupScrambledCount++;

  const expanded = expandAlgorithmNotation(notation);
  const moves = expanded.split(/\s+/).filter(Boolean);

  let state = cloneCube(setupState);
  for (const m of moves) {
    state = applyMove(state, m);
  }

  const isFinalSolved = isCubeSolved(state);
  if (isFinalSolved) solvedCount++;

  results.push({
    id,
    name,
    notation,
    expanded,
    isSetupScrambled,
    isFinalSolved
  });
}

console.log(`\n======================================================`);
console.log(`TOTAL ALGORITHMS: ${total}`);
console.log(`SETUP STATE SCRAMBLED: ${setupScrambledCount} / ${total}`);
console.log(`FINAL SOLVED (100% SUCCESS): ${solvedCount} / ${total}`);
console.log(`======================================================\n`);

results.filter(r => !r.isFinalSolved || !r.isSetupScrambled).forEach(r => {
  console.log(`FAILED: [${r.id}] "${r.name}"`);
  console.log(`  Notation: "${r.notation}"`);
  console.log(`  Setup scrambled: ${r.isSetupScrambled}, Final solved: ${r.isFinalSolved}`);
});
