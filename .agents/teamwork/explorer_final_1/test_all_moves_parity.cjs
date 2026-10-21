const THREE = require('three');

function posAndNormalToNetIndex(pos, normal) {
  const x = Math.round(pos.x);
  const y = Math.round(pos.y);
  const z = Math.round(pos.z);
  const nx = Math.round(normal.x);
  const ny = Math.round(normal.y);
  const nz = Math.round(normal.z);

  if (ny === 1) return { face: 'U', index: (z + 1) * 3 + (x + 1) };
  if (ny === -1) return { face: 'D', index: (1 - z) * 3 + (x + 1) };
  if (nz === 1) return { face: 'F', index: (1 - y) * 3 + (x + 1) };
  if (nz === -1) return { face: 'B', index: (1 - y) * 3 + (1 - x) };
  if (nx === -1) return { face: 'L', index: (1 - y) * 3 + (z + 1) };
  if (nx === 1) return { face: 'R', index: (1 - y) * 3 + (1 - z) };
  return null;
}

function createNumberedCube() {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  const res = {};
  faces.forEach((f) => {
    res[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  });
  return res;
}

function build3DCubelets(initialNet) {
  const cubelets = [];
  const faceNormals = [
    { face: 'R', norm: new THREE.Vector3(1, 0, 0), test: (x) => x === 1 },
    { face: 'L', norm: new THREE.Vector3(-1, 0, 0), test: (x) => x === -1 },
    { face: 'U', norm: new THREE.Vector3(0, 1, 0), test: (_x, y) => y === 1 },
    { face: 'D', norm: new THREE.Vector3(0, -1, 0), test: (_x, y) => y === -1 },
    { face: 'F', norm: new THREE.Vector3(0, 0, 1), test: (_x, _y, z) => z === 1 },
    { face: 'B', norm: new THREE.Vector3(0, 0, -1), test: (_x, _y, z) => z === -1 },
  ];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const stickers = [];
        for (const fn of faceNormals) {
          if (fn.test(x, y, z)) {
            const loc = posAndNormalToNetIndex({ x, y, z }, fn.norm);
            if (loc) {
              const val = initialNet[loc.face][loc.index];
              stickers.push({
                normal: fn.norm.clone(),
                value: val,
              });
            }
          }
        }
        cubelets.push({
          position: new THREE.Vector3(x, y, z),
          stickers,
        });
      }
    }
  }
  return cubelets;
}

function readNetFrom3DCubelets(cubelets) {
  const net = {};
  ['U', 'D', 'F', 'B', 'L', 'R'].forEach((f) => {
    net[f] = new Array(9).fill('');
  });

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

function apply3DRotation(cubelets, axis, angleRad, filter) {
  const q = new THREE.Quaternion().setFromAxisAngle(axis, angleRad);
  cubelets.forEach((c) => {
    if (filter(c.position)) {
      c.position.applyQuaternion(q);
      c.position.x = Math.round(c.position.x);
      c.position.y = Math.round(c.position.y);
      c.position.z = Math.round(c.position.z);

      c.stickers.forEach((st) => {
        st.normal.applyQuaternion(q);
        st.normal.x = Math.round(st.normal.x);
        st.normal.y = Math.round(st.normal.y);
        st.normal.z = Math.round(st.normal.z);
      });
    }
  });
}

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

function rotateFaceCounterClockwise(face) {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6],
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

  // Handle Wide moves by decomposition
  if (m === 'r' || m === 'Rw') return applyMove2D(applyMove2D(cube, 'R'), "M'");
  if (m === 'l' || m === 'Lw') return applyMove2D(applyMove2D(cube, 'L'), 'M');
  if (m === 'u' || m === 'Uw') return applyMove2D(applyMove2D(cube, 'U'), "E'");
  if (m === 'd' || m === 'Dw') return applyMove2D(applyMove2D(cube, 'D'), 'E');
  if (m === 'f' || m === 'Fw') return applyMove2D(applyMove2D(cube, 'F'), 'S');
  if (m === 'b' || m === 'Bw') return applyMove2D(applyMove2D(cube, 'B'), "S'");

  // Handle Cube rotations by decomposition
  if (m === 'x') return applyMove2D(applyMove2D(applyMove2D(cube, 'R'), "M'"), "L'");
  if (m === 'y') return applyMove2D(applyMove2D(applyMove2D(cube, 'U'), "E'"), "D'");
  if (m === 'z') return applyMove2D(applyMove2D(applyMove2D(cube, 'F'), 'S'), "B'");

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

function compareNets(netA, netB) {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      if (netA[f][i] !== netB[f][i]) return false;
    }
  }
  return true;
}

// Test every single move in 2D vs 3D!
const testMovesList = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'M', "M'", 'M2',
  'E', "E'", 'E2',
  'S', "S'", 'S2',
  'r', "r'", 'r2',
  'l', "l'", 'l2',
  'u', "u'", 'u2',
  'd', "d'", 'd2',
  'f', "f'", 'f2',
  'b', "b'", 'b2',
  'x', "x'", 'x2',
  'y', "y'", 'y2',
  'z', "z'", 'z2',
];

function get3DRotation(m) {
  const isPrime = m.includes("'");
  const isDouble = m.includes('2');
  const base = m.replace(/[2']/g, '');

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
    case 'E':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.y > -0.5 && p.y < 0.5;
      break;
    case 'S':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > -0.5 && p.z < 0.5;
      break;
    case 'r':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.x > -0.5;
      break;
    case 'l':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x < 0.5;
      break;
    case 'u':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.y > -0.5;
      break;
    case 'd':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.y < 0.5;
      break;
    case 'f':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > -0.5;
      break;
    case 'b':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = Math.PI / 2;
      filter = (p) => p.z < 0.5;
      break;
    case 'x':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = (_p) => true;
      break;
    case 'y':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = (_p) => true;
      break;
    case 'z':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (_p) => true;
      break;
  }

  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;

  return { axis, angle, filter };
}

let allPassed = true;
testMovesList.forEach(m => {
  const net0 = createNumberedCube();
  const net2D = applyMove2D(net0, m);

  const c3D = build3DCubelets(net0);
  const rot = get3DRotation(m);
  apply3DRotation(c3D, rot.axis, rot.angle, rot.filter);
  const net3D = readNetFrom3DCubelets(c3D);

  const match = compareNets(net2D, net3D);
  if (!match) {
    console.error(`MISMATCH for move: ${m}`);
    allPassed = false;
  }
});

console.log(`Tested all ${testMovesList.length} moves across 2D vs 3D. All match? ${allPassed}`);
