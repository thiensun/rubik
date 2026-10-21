import * as THREE from 'three';

// 1. Math Net Model from cubeState.ts
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

// 2. 3D Model from ThreeCubeViewer.tsx
function parseMoveToRotation(moveStr, isReversed = false) {
  const m = moveStr.trim();
  if (!m) return null;

  const base = m[0];
  const isPrime = m.includes("'");
  const isDouble = m.includes('2');

  let axis = new THREE.Vector3(1, 0, 0);
  let baseAngle = -Math.PI / 2;
  let filter = (p) => true;

  switch (base) {
    case 'R':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.x > 0.5;
      break;
    case 'L':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x < -0.5;
      break;
    case 'U':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.y > 0.5;
      break;
    case 'D':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.y < -0.5;
      break;
    case 'F':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > 0.5;
      break;
    case 'B':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = Math.PI / 2;
      filter = (p) => p.z < -0.5;
      break;
    case 'M':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x > -0.5 && p.x < 0.5;
      break;
    default:
      return null;
  }

  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;
  if (isReversed) angle = -angle;

  return { axis, angleRad: angle, filter };
}

// Initial 2D net with unique identifiers on all 54 stickers to trace each sticker
function createNumberedCube() {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  const res = {};
  faces.forEach(f => {
    res[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  });
  return res;
}

// Map 3D cubelet position and normal to 2D net face and index
function posAndNormalToNetIndex(pos, normal) {
  const x = Math.round(pos.x);
  const y = Math.round(pos.y);
  const z = Math.round(pos.z);
  const nx = Math.round(normal.x);
  const ny = Math.round(normal.y);
  const nz = Math.round(normal.z);

  if (ny === 1) { // Up
    return { face: 'U', index: (z + 1) * 3 + (x + 1) };
  }
  if (ny === -1) { // Down
    return { face: 'D', index: (1 - z) * 3 + (x + 1) };
  }
  if (nz === 1) { // Front
    return { face: 'F', index: (1 - y) * 3 + (x + 1) };
  }
  if (nz === -1) { // Back
    return { face: 'B', index: (1 - y) * 3 + (1 - x) };
  }
  if (nx === -1) { // Left
    return { face: 'L', index: (1 - y) * 3 + (z + 1) };
  }
  if (nx === 1) { // Right
    return { face: 'R', index: (1 - y) * 3 + (1 - z) };
  }
  return null;
}

// Build 3D cubelets
function build3DCubelets(initialNet) {
  const cubelets = [];
  const faceNormals = [
    { face: 'R', norm: new THREE.Vector3(1, 0, 0), test: (x, y, z) => x === 1 },
    { face: 'L', norm: new THREE.Vector3(-1, 0, 0), test: (x, y, z) => x === -1 },
    { face: 'U', norm: new THREE.Vector3(0, 1, 0), test: (x, y, z) => y === 1 },
    { face: 'D', norm: new THREE.Vector3(0, -1, 0), test: (x, y, z) => y === -1 },
    { face: 'F', norm: new THREE.Vector3(0, 0, 1), test: (x, y, z) => z === 1 },
    { face: 'B', norm: new THREE.Vector3(0, 0, -1), test: (x, y, z) => z === -1 },
  ];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const stickers = [];
        for (const fn of faceNormals) {
          if (fn.test(x, y, z)) {
            const loc = posAndNormalToNetIndex({ x, y, z }, fn.norm);
            const val = initialNet[loc.face][loc.index];
            stickers.push({
              initialNormal: fn.norm.clone(),
              normal: fn.norm.clone(),
              value: val,
            });
          }
        }
        cubelets.push({
          position: new THREE.Vector3(x, y, z),
          quaternion: new THREE.Quaternion(),
          stickers,
        });
      }
    }
  }
  return cubelets;
}

function apply3DMove(cubelets, moveStr) {
  const parsed = parseMoveToRotation(moveStr);
  if (!parsed) return;
  const q = new THREE.Quaternion().setFromAxisAngle(parsed.axis, parsed.angleRad);

  cubelets.forEach((c) => {
    if (parsed.filter(c.position)) {
      c.position.applyQuaternion(q);
      c.position.x = Math.round(c.position.x);
      c.position.y = Math.round(c.position.y);
      c.position.z = Math.round(c.position.z);
      c.quaternion.premultiply(q);
      c.quaternion.normalize();
      c.stickers.forEach((st) => {
        st.normal.applyQuaternion(q);
        st.normal.x = Math.round(st.normal.x);
        st.normal.y = Math.round(st.normal.y);
        st.normal.z = Math.round(st.normal.z);
      });
    }
  });
}

function readNetFrom3DCubelets(cubelets) {
  const net = {
    U: Array(9).fill(null),
    D: Array(9).fill(null),
    F: Array(9).fill(null),
    B: Array(9).fill(null),
    L: Array(9).fill(null),
    R: Array(9).fill(null),
  };

  cubelets.forEach((c) => {
    c.stickers.forEach((st) => {
      const loc = posAndNormalToNetIndex(c.position, st.normal);
      if (loc) {
        net[loc.face][loc.index] = st.value;
      }
    });
  });

  return net;
}

function compareNets(net1, net2) {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  const mismatches = [];
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      if (net1[f][i] !== net2[f][i]) {
        mismatches.push(`Face ${f}[${i}]: Net=${net1[f][i]} vs 3D=${net2[f][i]}`);
      }
    }
  }
  return mismatches;
}

// RUN TESTS
const MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

console.log('--- TESTING SINGLE MOVES PARITY (3D vs 2D Net) ---');
let allPassed = true;

for (const m of MOVES) {
  const initialNet = createNumberedCube();
  const netAfter = applyMove(initialNet, m);

  const cubelets = build3DCubelets(initialNet);
  apply3DMove(cubelets, m);
  const net3D = readNetFrom3DCubelets(cubelets);

  const diffs = compareNets(netAfter, net3D);
  if (diffs.length === 0) {
    console.log(`[PASS] Move ${m.padEnd(3)}: 100% 54-sticker exact match`);
  } else {
    allPassed = false;
    console.error(`[FAIL] Move ${m.padEnd(3)}: ${diffs.length} mismatches!`);
    diffs.slice(0, 5).forEach((d) => console.error('   ', d));
  }
}

// TEST A FULL RANDOM 21-MOVE WCA SCRAMBLE SEQUENCE
console.log('\n--- TESTING FULL 21-MOVE WCA SCRAMBLE SEQUENCE ---');
const testScramble = "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R";
const scrambleTokens = testScramble.split(' ');

let curNet = createNumberedCube();
const cur3D = build3DCubelets(curNet);

for (const token of scrambleTokens) {
  curNet = applyMove(curNet, token);
  apply3DMove(cur3D, token);
}

const cur3DNet = readNetFrom3DCubelets(cur3D);
const scrambleDiffs = compareNets(curNet, cur3DNet);
if (scrambleDiffs.length === 0) {
  console.log(`[PASS] Full 21-move WCA scramble: 100% 54-sticker exact match across all faces!`);
} else {
  allPassed = false;
  console.error(`[FAIL] Full scramble: ${scrambleDiffs.length} mismatches!`);
  scrambleDiffs.slice(0, 10).forEach((d) => console.error('   ', d));
}

console.log(`\nOVERALL PARITY STATUS: ${allPassed ? 'VERIFIED 100% PERFECT' : 'DESYNC DETECTED'}`);
