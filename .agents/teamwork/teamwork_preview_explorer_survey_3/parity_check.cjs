// Full 3D vs 2D Net Parity Verification Test
const ALL_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2'
];
const FACES = ['U', 'D', 'F', 'B', 'L', 'R'];

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

function applyMove2D(cube, move) {
  const m = move.trim();
  if (!m) return cube;
  if (m.endsWith('2')) {
    const base = m.slice(0, -1);
    return applyMove2D(applyMove2D(cube, base), base);
  }
  if (m.endsWith("'")) {
    const base = m.slice(0, -1);
    return applyMove2D(applyMove2D(applyMove2D(cube, base), base), base);
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

// 3D vector rotation around an axis (axis is unit X, Y, or Z; angle is k * pi/2)
function rotateVec(v, axis, angle) {
  const c = Math.round(Math.cos(angle));
  const s = Math.round(Math.sin(angle));
  // Rodrigues rotation formula for 90 degree multiples
  let { x, y, z } = v;
  if (axis.x === 1) {
    // around X
    return { x, y: y * c - z * s, z: y * s + z * c };
  } else if (axis.y === 1) {
    // around Y
    return { x: x * c + z * s, y, z: -x * s + z * c };
  } else if (axis.z === 1) {
    // around Z
    return { x: x * c - y * s, y: x * s + y * c, z };
  }
  throw new Error('Unsupported axis');
}

// Parse move to 3D rotation (matching ThreeCubeViewer.tsx)
function parseMove3D(m) {
  const base = m[0];
  const isPrime = m.includes("'");
  const isDouble = m.includes('2');

  let axis, baseAngle, filter;
  switch (base) {
    case 'R':
      axis = { x: 1, y: 0, z: 0 };
      baseAngle = -Math.PI / 2;
      filter = (p) => p.x > 0.5;
      break;
    case 'L':
      axis = { x: 1, y: 0, z: 0 };
      baseAngle = Math.PI / 2;
      filter = (p) => p.x < -0.5;
      break;
    case 'U':
      axis = { x: 0, y: 1, z: 0 };
      baseAngle = -Math.PI / 2;
      filter = (p) => p.y > 0.5;
      break;
    case 'D':
      axis = { x: 0, y: 1, z: 0 };
      baseAngle = Math.PI / 2;
      filter = (p) => p.y < -0.5;
      break;
    case 'F':
      axis = { x: 0, y: 0, z: 1 };
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > 0.5;
      break;
    case 'B':
      axis = { x: 0, y: 0, z: 1 };
      baseAngle = Math.PI / 2;
      filter = (p) => p.z < -0.5;
      break;
  }
  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;
  return { axis, angle, filter };
}

// Build initial 3D cube state with unique stickers
function init3DCube() {
  const cubelets = [];
  for (let x of [-1, 0, 1]) {
    for (let y of [-1, 0, 1]) {
      for (let z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const stickers = [];
        if (x === 1) stickers.push({ initialFace: 'R', normal: { x: 1, y: 0, z: 0 }, id: `R${(1-y)*3 + (1-z)}` });
        if (x === -1) stickers.push({ initialFace: 'L', normal: { x: -1, y: 0, z: 0 }, id: `L${(1-y)*3 + (z+1)}` });
        if (y === 1) stickers.push({ initialFace: 'U', normal: { x: 0, y: 1, z: 0 }, id: `U${(z+1)*3 + (x+1)}` });
        if (y === -1) stickers.push({ initialFace: 'D', normal: { x: 0, y: -1, z: 0 }, id: `D${(1-z)*3 + (x+1)}` });
        if (z === 1) stickers.push({ initialFace: 'F', normal: { x: 0, y: 0, z: 1 }, id: `F${(1-y)*3 + (x+1)}` });
        if (z === -1) stickers.push({ initialFace: 'B', normal: { x: 0, y: 0, z: -1 }, id: `B${(1-y)*3 + (1-x)}` });
        cubelets.push({ pos: { x, y, z }, stickers });
      }
    }
  }
  return cubelets;
}

// Convert 3D cube state back to 2D net state
function read3DNetState(cubelets) {
  const net = {
    U: Array(9).fill(''),
    D: Array(9).fill(''),
    F: Array(9).fill(''),
    B: Array(9).fill(''),
    L: Array(9).fill(''),
    R: Array(9).fill(''),
  };
  for (const c of cubelets) {
    const { x, y, z } = c.pos;
    for (const s of c.stickers) {
      const { x: nx, y: ny, z: nz } = s.normal;
      if (ny === 1 && y === 1) net.U[(z + 1) * 3 + (x + 1)] = s.id;
      if (ny === -1 && y === -1) net.D[(1 - z) * 3 + (x + 1)] = s.id;
      if (nz === 1 && z === 1) net.F[(1 - y) * 3 + (x + 1)] = s.id;
      if (nz === -1 && z === -1) net.B[(1 - y) * 3 + (1 - x)] = s.id;
      if (nx === 1 && x === 1) net.R[(1 - y) * 3 + (1 - z)] = s.id;
      if (nx === -1 && x === -1) net.L[(1 - y) * 3 + (z + 1)] = s.id;
    }
  }
  return net;
}

// Test individual moves
let allPassed = true;
const results = [];
for (const move of ALL_MOVES) {
  // 1. Compute via 2D net
  const initial2D = {};
  for (const f of FACES) {
    initial2D[f] = [];
    for (let i = 0; i < 9; i++) initial2D[f].push(`${f}${i}`);
  }
  const expected2D = applyMove2D(initial2D, move);

  // 2. Compute via 3D rotation
  const cubelets = init3DCube();
  const { axis, angle, filter } = parseMove3D(move);
  for (const c of cubelets) {
    if (filter(c.pos)) {
      c.pos = rotateVec(c.pos, axis, angle);
      for (const s of c.stickers) {
        s.normal = rotateVec(s.normal, axis, angle);
      }
    }
  }
  const actual2D = read3DNetState(cubelets);

  // 3. Compare
  let movePassed = true;
  for (const f of FACES) {
    for (let i = 0; i < 9; i++) {
      if (actual2D[f][i] !== expected2D[f][i]) {
        movePassed = false;
        allPassed = false;
        console.error(`MISMATCH on move ${move}, face ${f}, index ${i}: 3D produced ${actual2D[f][i]}, expected 2D ${expected2D[f][i]}`);
      }
    }
  }
  results.push({ move, pass: movePassed });
}

console.log('--- 3D ROTATION PARITY RESULTS ---');
console.table(results);
console.log('Overall Parity Pass:', allPassed);
