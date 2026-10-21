const fs = require('fs');
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

function parseMoveToRotation(moveStr, isReversed = false) {
  const m = moveStr.trim();
  if (!m) return null;

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
    case 'Rw':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.x > -0.5;
      break;
    case 'l':
    case 'Lw':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x < 0.5;
      break;
    case 'u':
    case 'Uw':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.y > -0.5;
      break;
    case 'd':
    case 'Dw':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.y < 0.5;
      break;
    case 'f':
    case 'Fw':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > -0.5;
      break;
    case 'b':
    case 'Bw':
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
    default:
      return null;
  }

  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;
  if (isReversed) angle = -angle;

  return { axis, angleRad: angle, filter };
}

function apply3DMove(cubelets, moveStr) {
  const parsed = parseMoveToRotation(moveStr);
  if (!parsed) throw new Error(`Cannot parse move: ${moveStr}`);
  const q = new THREE.Quaternion().setFromAxisAngle(parsed.axis, parsed.angleRad);

  cubelets.forEach((c) => {
    if (parsed.filter(c.position)) {
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

function expandAlgorithmNotation(notation) {
  if (!notation) return '';
  let str = notation;
  str = str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    const repeated = [];
    for (let i = 0; i < times; i++) {
      repeated.push(inner.trim());
    }
    return ' ' + repeated.join(' ') + ' ';
  });
  str = str.replace(/[()[\]]/g, ' ');
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

// Read all algorithms
const content = fs.readFileSync('./src/utils/algorithmsData.ts', 'utf8');
const algRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?notation:\s*"([^"]+)"/g;
let match;
let total = 0;
let threeDSolvedCount = 0;

while ((match = algRegex.exec(content)) !== null) {
  total++;
  const id = match[1];
  const name = match[2];
  const notation = match[4];

  // 1. Build initial setup 3D cubelets from SOLVED_CUBE
  const cubelets = build3DCubelets(SOLVED_CUBE);

  // 2. Apply inverted moves in 3D to create setup state
  const inverted = invertMoves(notation);
  const invertedTokens = inverted.split(/\s+/).filter(Boolean);
  for (const m of invertedTokens) {
    apply3DMove(cubelets, m);
  }

  // Check setup state is scrambled
  const setupNet = readNetFrom3DCubelets(cubelets);
  if (isCubeSolved(setupNet)) {
    console.error(`SETUP NOT SCRAMBLED: [${id}] "${name}"`);
  }

  // 3. Now apply the algorithm moves in order in 3D
  const forwardMoves = expandAlgorithmNotation(notation).split(/\s+/).filter(Boolean);
  for (const m of forwardMoves) {
    apply3DMove(cubelets, m);
  }

  // 4. Verify 3D cubelets are solved
  const finalNet = readNetFrom3DCubelets(cubelets);
  if (isCubeSolved(finalNet)) {
    threeDSolvedCount++;
  } else {
    console.error(`3D FAILED TO SOLVE: [${id}] "${name}"`);
  }
}

console.log(`\n======================================================`);
console.log(`3D SIMULATION AUDIT OF ALL ${total} ALGORITHMS`);
console.log(`3D SOLVED TO 100%: ${threeDSolvedCount} / ${total}`);
console.log(`======================================================\n`);
