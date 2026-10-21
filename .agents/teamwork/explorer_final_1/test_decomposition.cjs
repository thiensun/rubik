// Test equivalence of Wide moves and Rotations in terms of Face + Slice moves
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

function compareNets(netA, netB) {
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      if (netA[f][i] !== netB[f][i]) return false;
    }
  }
  return true;
}

// Check:
// r == R + M'
const c_r = build3DCubelets(createNumberedCube());
apply3DRotation(c_r, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > -0.5);
const net_r = readNetFrom3DCubelets(c_r);

const c_RMprime = build3DCubelets(createNumberedCube());
// R: axis (1, 0, 0), angle -Math.PI / 2, filter x > 0.5
apply3DRotation(c_RMprime, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > 0.5);
// M': M is +Math.PI / 2, so M' is -Math.PI / 2 on x in (-0.5, 0.5)
apply3DRotation(c_RMprime, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > -0.5 && p.x < 0.5);
const net_RMprime = readNetFrom3DCubelets(c_RMprime);
console.log('r == R + M\' ?', compareNets(net_r, net_RMprime));

// Check:
// l == L + M
const c_l = build3DCubelets(createNumberedCube());
apply3DRotation(c_l, new THREE.Vector3(1, 0, 0), Math.PI / 2, (p) => p.x < 0.5);
const net_l = readNetFrom3DCubelets(c_l);

const c_LM = build3DCubelets(createNumberedCube());
apply3DRotation(c_LM, new THREE.Vector3(1, 0, 0), Math.PI / 2, (p) => p.x < -0.5);
apply3DRotation(c_LM, new THREE.Vector3(1, 0, 0), Math.PI / 2, (p) => p.x > -0.5 && p.x < 0.5);
const net_LM = readNetFrom3DCubelets(c_LM);
console.log('l == L + M ?', compareNets(net_l, net_LM));

// Check:
// u == U + E'
// E in direction of D is angle +Math.PI / 2. E' is angle -Math.PI / 2.
// U is angle -Math.PI / 2 on y > 0.5.
const c_u = build3DCubelets(createNumberedCube());
apply3DRotation(c_u, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > -0.5);
const net_u = readNetFrom3DCubelets(c_u);

const c_UEprime = build3DCubelets(createNumberedCube());
apply3DRotation(c_UEprime, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > 0.5);
apply3DRotation(c_UEprime, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > -0.5 && p.y < 0.5);
const net_UEprime = readNetFrom3DCubelets(c_UEprime);
console.log('u == U + E\' ?', compareNets(net_u, net_UEprime));

// Check:
// d == D + E
const c_d = build3DCubelets(createNumberedCube());
apply3DRotation(c_d, new THREE.Vector3(0, 1, 0), Math.PI / 2, (p) => p.y < 0.5);
const net_d = readNetFrom3DCubelets(c_d);

const c_DE = build3DCubelets(createNumberedCube());
apply3DRotation(c_DE, new THREE.Vector3(0, 1, 0), Math.PI / 2, (p) => p.y < -0.5);
apply3DRotation(c_DE, new THREE.Vector3(0, 1, 0), Math.PI / 2, (p) => p.y > -0.5 && p.y < 0.5);
const net_DE = readNetFrom3DCubelets(c_DE);
console.log('d == D + E ?', compareNets(net_d, net_DE));

// Check:
// f == F + S
// S is in direction of F (-Math.PI / 2).
const c_f = build3DCubelets(createNumberedCube());
apply3DRotation(c_f, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > -0.5);
const net_f = readNetFrom3DCubelets(c_f);

const c_FS = build3DCubelets(createNumberedCube());
apply3DRotation(c_FS, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > 0.5);
apply3DRotation(c_FS, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > -0.5 && p.z < 0.5);
const net_FS = readNetFrom3DCubelets(c_FS);
console.log('f == F + S ?', compareNets(net_f, net_FS));

// Check:
// b == B + S'
// B is angle +Math.PI / 2 on z < -0.5.
// S' is angle +Math.PI / 2 on z in (-0.5, 0.5).
const c_b = build3DCubelets(createNumberedCube());
apply3DRotation(c_b, new THREE.Vector3(0, 0, 1), Math.PI / 2, (p) => p.z < 0.5);
const net_b = readNetFrom3DCubelets(c_b);

const c_BSprime = build3DCubelets(createNumberedCube());
apply3DRotation(c_BSprime, new THREE.Vector3(0, 0, 1), Math.PI / 2, (p) => p.z < -0.5);
apply3DRotation(c_BSprime, new THREE.Vector3(0, 0, 1), Math.PI / 2, (p) => p.z > -0.5 && p.z < 0.5);
const net_BSprime = readNetFrom3DCubelets(c_BSprime);
console.log('b == B + S\' ?', compareNets(net_b, net_BSprime));

// Check rotations:
// x == R + M' + L'
const c_x = build3DCubelets(createNumberedCube());
apply3DRotation(c_x, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (_p) => true);
const net_x = readNetFrom3DCubelets(c_x);

const c_x_decomp = build3DCubelets(createNumberedCube());
apply3DRotation(c_x_decomp, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > 0.5); // R
apply3DRotation(c_x_decomp, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > -0.5 && p.x < 0.5); // M'
apply3DRotation(c_x_decomp, new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x < -0.5); // L' (L is +Math.PI/2, so -Math.PI/2 is L')
const net_x_decomp = readNetFrom3DCubelets(c_x_decomp);
console.log('x == R + M\' + L\' ?', compareNets(net_x, net_x_decomp));

// y == U + E' + D'
const c_y = build3DCubelets(createNumberedCube());
apply3DRotation(c_y, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (_p) => true);
const net_y = readNetFrom3DCubelets(c_y);

const c_y_decomp = build3DCubelets(createNumberedCube());
apply3DRotation(c_y_decomp, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > 0.5); // U
apply3DRotation(c_y_decomp, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > -0.5 && p.y < 0.5); // E'
apply3DRotation(c_y_decomp, new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y < -0.5); // D' (D is +Math.PI/2, so -Math.PI/2 is D')
const net_y_decomp = readNetFrom3DCubelets(c_y_decomp);
console.log('y == U + E\' + D\' ?', compareNets(net_y, net_y_decomp));

// z == F + S + B'
const c_z = build3DCubelets(createNumberedCube());
apply3DRotation(c_z, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (_p) => true);
const net_z = readNetFrom3DCubelets(c_z);

const c_z_decomp = build3DCubelets(createNumberedCube());
apply3DRotation(c_z_decomp, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > 0.5); // F
apply3DRotation(c_z_decomp, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > -0.5 && p.z < 0.5); // S
apply3DRotation(c_z_decomp, new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z < -0.5); // B' (B is +Math.PI/2, so -Math.PI/2 is B')
const net_z_decomp = readNetFrom3DCubelets(c_z_decomp);
console.log('z == F + S + B\' ?', compareNets(net_z, net_z_decomp));
