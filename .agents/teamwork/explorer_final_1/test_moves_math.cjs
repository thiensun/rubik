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

function testMove(name, axis, angleRad, filter) {
  const net0 = createNumberedCube();
  const c = build3DCubelets(net0);
  apply3DRotation(c, axis, angleRad, filter);
  const result = readNetFrom3DCubelets(c);

  console.log(`\n=== MOVE ${name} ===`);
  ['U', 'D', 'F', 'B', 'L', 'R'].forEach(f => {
    const diffs = [];
    for (let i = 0; i < 9; i++) {
      if (result[f][i] !== net0[f][i]) {
        diffs.push(`${f}${i}<-${result[f][i]}`);
      }
    }
    if (diffs.length) console.log(`  ${f}: ${diffs.join(', ')}`);
  });
}

// Slice moves
testMove('M', new THREE.Vector3(1, 0, 0), Math.PI / 2, (p) => p.x > -0.5 && p.x < 0.5);
testMove('E', new THREE.Vector3(0, 1, 0), Math.PI / 2, (p) => p.y > -0.5 && p.y < 0.5);
testMove('S', new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > -0.5 && p.z < 0.5);

// Rotations
testMove('x', new THREE.Vector3(1, 0, 0), -Math.PI / 2, (_p) => true);
testMove('y', new THREE.Vector3(0, 1, 0), -Math.PI / 2, (_p) => true);
testMove('z', new THREE.Vector3(0, 0, 1), -Math.PI / 2, (_p) => true);

// Wide moves
testMove('r', new THREE.Vector3(1, 0, 0), -Math.PI / 2, (p) => p.x > -0.5);
testMove('l', new THREE.Vector3(1, 0, 0), Math.PI / 2, (p) => p.x < 0.5);
testMove('u', new THREE.Vector3(0, 1, 0), -Math.PI / 2, (p) => p.y > -0.5);
testMove('d', new THREE.Vector3(0, 1, 0), Math.PI / 2, (p) => p.y < 0.5);
testMove('f', new THREE.Vector3(0, 0, 1), -Math.PI / 2, (p) => p.z > -0.5);
testMove('b', new THREE.Vector3(0, 0, 1), Math.PI / 2, (p) => p.z < 0.5);
