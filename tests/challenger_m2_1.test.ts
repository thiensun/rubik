import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  CubeNetState,
  FaceKey,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  invertMoves,
  isCubeSolved,
  generateWCAScramble,
} from '../src/utils/cubeState';
import { ALGORITHMS_LIBRARY } from '../src/utils/algorithmsData';
import { createMoves, getSolutionForLevel } from '../src/utils/solutionStages';

// ============================================================================
// 3D SIMULATION HELPERS (Exact ThreeCubeViewer geometry & quaternion rotation)
// ============================================================================

function parseMoveToRotation(moveStr: string, isReversed = false): {
  axis: THREE.Vector3;
  angleRad: number;
  filter: (pos: THREE.Vector3) => boolean;
} | null {
  const m = moveStr.trim().replace(/[()[\]]/g, '');
  if (!m) return null;

  const isPrime = m.includes("'");
  const isDouble = m.includes('2');

  let base = m[0];
  if (m.length >= 2 && (m[1] === 'w' || m[1] === 'W')) {
    base = m[0].toLowerCase();
  }

  let axis = new THREE.Vector3(1, 0, 0);
  let baseAngle = -Math.PI / 2;
  let filter = (_p: THREE.Vector3) => true;

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
    // Slices
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
    // Wide moves
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
    // Cube Rotations
    case 'x':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = () => true;
      break;
    case 'y':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = () => true;
      break;
    case 'z':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = () => true;
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

function createNumberedCube(): Record<FaceKey, string[]> {
  const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const res = {} as Record<FaceKey, string[]>;
  faces.forEach((f) => {
    res[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  });
  return res;
}

function posAndNormalToNetIndex(
  pos: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number }
): { face: FaceKey; index: number } | null {
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

interface Simulated3DSticker {
  initialNormal: THREE.Vector3;
  normal: THREE.Vector3;
  value: string;
}

interface Simulated3DCubelet {
  position: THREE.Vector3;
  stickers: Simulated3DSticker[];
}

function build3DCubelets(initialNet: Record<FaceKey, string[]>): Simulated3DCubelet[] {
  const cubelets: Simulated3DCubelet[] = [];
  const faceNormals = [
    { face: 'R', norm: new THREE.Vector3(1, 0, 0), test: (x: number) => x === 1 },
    { face: 'L', norm: new THREE.Vector3(-1, 0, 0), test: (x: number) => x === -1 },
    { face: 'U', norm: new THREE.Vector3(0, 1, 0), test: (_x: number, y: number) => y === 1 },
    { face: 'D', norm: new THREE.Vector3(0, -1, 0), test: (_x: number, y: number) => y === -1 },
    { face: 'F', norm: new THREE.Vector3(0, 0, 1), test: (_x: number, _y: number, z: number) => z === 1 },
    { face: 'B', norm: new THREE.Vector3(0, 0, -1), test: (_x: number, _y: number, z: number) => z === -1 },
  ];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const stickers: Simulated3DSticker[] = [];
        for (const fn of faceNormals) {
          if (fn.test(x, y, z)) {
            const loc = posAndNormalToNetIndex({ x, y, z }, fn.norm);
            if (loc) {
              const val = initialNet[loc.face][loc.index];
              stickers.push({
                initialNormal: fn.norm.clone(),
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

function apply3DMoveToSimulated(cubelets: Simulated3DCubelet[], moveStr: string): void {
  const parsed = parseMoveToRotation(moveStr);
  if (!parsed) return;
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

function readNetFrom3DCubelets(cubelets: Simulated3DCubelet[]): Record<FaceKey, string[]> {
  const net = {} as Record<FaceKey, string[]>;
  (['U', 'D', 'F', 'B', 'L', 'R'] as FaceKey[]).forEach((f) => {
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

// ============================================================================
// CHALLENGER TEST SUITE
// ============================================================================

describe('Challenger 1 Empirical Verification: Milestone 2', () => {

  // --------------------------------------------------------------------------
  // Task 1: 3D Rotation Parity vs 2D Net State (Adversarial Multi-Move & Cycles)
  // --------------------------------------------------------------------------
  describe('Task 1: 3D Rotation Parity Stress Testing', () => {
    const ALL_18_MOVES = [
      'U', "U'", 'U2',
      'D', "D'", 'D2',
      'L', "L'", 'L2',
      'R', "R'", 'R2',
      'F', "F'", 'F2',
      'B', "B'", 'B2',
    ];

    it('verifies 4-cycle identity (X^4 = I) for all 6 faces in 3D vs 2D', () => {
      for (const face of ['U', 'D', 'L', 'R', 'F', 'B']) {
        const numberedNet = createNumberedCube();
        let expected2D = numberedNet as any;
        const cubelets = build3DCubelets(numberedNet);

        for (let i = 0; i < 4; i++) {
          expected2D = applyMove(expected2D, face);
          apply3DMoveToSimulated(cubelets, face);
        }

        const actual3D = readNetFrom3DCubelets(cubelets);
        const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
        for (const f of faces) {
          expect(actual3D[f]).toEqual(numberedNet[f]);
          expect(expected2D[f]).toEqual(numberedNet[f]);
        }
      }
    });

    it('verifies order-6 commutator cycle (R U R\' U\')^6 = I in 3D vs 2D', () => {
      const sexyMove = ['R', 'U', "R'", "U'"];
      const numberedNet = createNumberedCube();
      let expected2D = numberedNet as any;
      const cubelets = build3DCubelets(numberedNet);

      for (let rep = 0; rep < 6; rep++) {
        for (const m of sexyMove) {
          expected2D = applyMove(expected2D, m);
          apply3DMoveToSimulated(cubelets, m);
        }
      }

      const actual3D = readNetFrom3DCubelets(cubelets);
      const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
      for (const f of faces) {
        expect(actual3D[f]).toEqual(numberedNet[f]);
        expect(expected2D[f]).toEqual(numberedNet[f]);
      }
    });

    it('verifies 3D vs 2D parity across 30 random 25-move WCA scrambles', () => {
      for (let s = 0; s < 30; s++) {
        const scramble = generateWCAScramble(25);
        const moves = scramble.trim().split(/\s+/);
        const numberedNet = createNumberedCube();

        let expected2D = numberedNet as any;
        for (const m of moves) {
          expected2D = applyMove(expected2D, m);
        }

        const cubelets = build3DCubelets(numberedNet);
        for (const m of moves) {
          apply3DMoveToSimulated(cubelets, m);
        }
        const actual3D = readNetFrom3DCubelets(cubelets);

        const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
        for (const f of faces) {
          expect(actual3D[f]).toEqual(expected2D[f]);
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Task 2: Algorithm Library 3D Practice Setup & Execution
  // --------------------------------------------------------------------------
  describe('Task 2: Algorithm Library 3D Practice Inverted Setup & Execution', () => {
    it('audits all algorithms in ALGORITHMS_LIBRARY for token validity and setupState scramblings', () => {
      expect(ALGORITHMS_LIBRARY.length).toBe(46);

      const notScrambledAlgs: { name: string; notation: string }[] = [];
      const notSolvedAlgs: { name: string; notation: string }[] = [];

      for (const alg of ALGORITHMS_LIBRARY) {
        const moves = createMoves(alg.notation, 1);
        const inverted = invertMoves(alg.notation);
        const setupState = applyScramble(inverted);

        if (isCubeSolved(setupState)) {
          notScrambledAlgs.push({ name: alg.name, notation: alg.notation });
        }

        let curState = cloneCube(setupState);
        for (const m of moves) {
          curState = applyMove(curState, m.move);
        }

        if (!isCubeSolved(curState)) {
          notSolvedAlgs.push({ name: alg.name, notation: alg.notation });
        }
      }

      expect(notScrambledAlgs.length).toBe(0);
      expect(notSolvedAlgs.length).toBe(0);
    });

    it('empirically tests 3D viewer rotation parseability for all ALGORITHMS_LIBRARY moves', () => {
      const unparseableMovesByAlg: { name: string; unparseable: string[] }[] = [];

      for (const alg of ALGORITHMS_LIBRARY) {
        const moves = createMoves(alg.notation, 1);
        const unparseable: string[] = [];
        for (const m of moves) {
          const parsed = parseMoveToRotation(m.move);
          if (!parsed) {
            unparseable.push(m.move);
          }
        }
        if (unparseable.length > 0) {
          unparseableMovesByAlg.push({ name: alg.name, unparseable });
        }
      }

      expect(unparseableMovesByAlg.length).toBe(0);
    });

    it('tests end-to-end 3D practice setup + execution for all 46 ALGORITHMS_LIBRARY algorithms', () => {
      expect(ALGORITHMS_LIBRARY.length).toBe(46);

      for (const alg of ALGORITHMS_LIBRARY) {
        const moves = createMoves(alg.notation, 1);
        const inverted = invertMoves(alg.notation);
        const setupState = applyScramble(inverted);

        // 1. Initial setup state must NOT be solved (genuinely scrambled setup)
        expect(isCubeSolved(setupState)).toBe(false);

        // 2. Sequential applyMove brings cube to SOLVED_CUBE
        let state = cloneCube(setupState);
        for (const m of moves) {
          state = applyMove(state, m.move);
        }
        expect(isCubeSolved(state)).toBe(true);

        // 3. 3D simulation brings cube to SOLVED_CUBE
        const cubelets = build3DCubelets(setupState as any);
        for (const m of moves) {
          const parsed = parseMoveToRotation(m.move);
          expect(parsed).not.toBeNull();
          apply3DMoveToSimulated(cubelets, m.move);
        }
        const final3DNet = readNetFrom3DCubelets(cubelets);
        expect(isCubeSolved(final3DNet as any)).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Task 3: Stress Testing Step 3 State Tracking Under Rapid Jumping & Walk
  // --------------------------------------------------------------------------
  describe('Task 3: Step 3 State Tracking Stress Harness', () => {
    it('preserves exact mathematical state parity under non-linear random walk and jumping', () => {
      const scramble = generateWCAScramble(20);
      const initialCube = applyScramble(scramble);
      const solution = getSolutionForLevel('level-2', scramble);
      const allMoves = solution.stages.flatMap((s) => s.moves);
      expect(allMoves.length).toBeGreaterThan(0);

      // Precalculate ground truth state at every move index k (0 .. allMoves.length)
      const groundTruthStates: CubeNetState[] = [cloneCube(initialCube)];
      let st = cloneCube(initialCube);
      for (const m of allMoves) {
        st = applyMove(st, m.move);
        groundTruthStates.push(cloneCube(st));
      }

      expect(isCubeSolved(groundTruthStates[allMoves.length])).toBe(true);

      // Simulate Step3 state calculation function:
      // const currentCubeState = (targetIdx: number) => {
      //   let state = cloneCube(initialCube);
      //   const movesToApply = allMoves.slice(0, targetIdx);
      //   for (const m of movesToApply) state = applyMove(state, m.move);
      //   return state;
      // };
      function calcStep3State(targetIdx: number): CubeNetState {
        let state = cloneCube(initialCube);
        const movesToApply = allMoves.slice(0, targetIdx);
        for (const m of movesToApply) {
          state = applyMove(state, m.move);
        }
        return state;
      }

      // Simulate 100 rapid jumping operations (random jumps, forward steps, backward steps)
      let currentIdx = 0;
      for (let step = 0; step < 100; step++) {
        const actionType = Math.random();
        if (actionType < 0.3) {
          // Single step forward
          if (currentIdx < allMoves.length) currentIdx++;
        } else if (actionType < 0.6) {
          // Single step backward
          if (currentIdx > 0) currentIdx--;
        } else if (actionType < 0.8) {
          // Random jump across stages
          currentIdx = Math.floor(Math.random() * (allMoves.length + 1));
        } else {
          // Reset to beginning or jump to end
          currentIdx = Math.random() < 0.5 ? 0 : allMoves.length;
        }

        const calculated = calcStep3State(currentIdx);
        const expected = groundTruthStates[currentIdx];

        const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
        for (const f of faces) {
          expect(calculated[f]).toEqual(expected[f]);
        }

        // True solved condition: solved if and only if currentIdx === allMoves.length
        const isSolvedCalculated = isCubeSolved(calculated);
        const isSolvedExpected = isCubeSolved(expected);
        expect(isSolvedCalculated).toBe(isSolvedExpected);
      }
    });

    it('verifies Analyze Solve workflow loads exact solve scramble and solves to completion', () => {
      for (let s = 0; s < 10; s++) {
        const scramble = generateWCAScramble(21);
        const solveCubeState = applyScramble(scramble);

        // Step 3 receives analyzeSolve props
        const solution = getSolutionForLevel('level-3', scramble, solveCubeState);
        expect(solution.totalMoves).toBeGreaterThan(0);

        const allMoves = solution.stages.flatMap((stg) => stg.moves);
        let curState = cloneCube(solveCubeState);
        for (const m of allMoves) {
          curState = applyMove(curState, m.move);
        }
        expect(isCubeSolved(curState)).toBe(true);
      }
    });

    it('verifies Camera Scan arbitrary 54-sticker state solving without demo scramble', () => {
      for (let s = 0; s < 10; s++) {
        const arbitraryScramble = generateWCAScramble(18);
        const cameraScannedState = applyScramble(arbitraryScramble);

        // In Step 3, demoScramble is null
        const solution = getSolutionForLevel('auto-solve', undefined, cameraScannedState);
        expect(solution.totalMoves).toBeGreaterThan(0);

        const allMoves = solution.stages.flatMap((stg) => stg.moves);
        let curState = cloneCube(cameraScannedState);
        for (const m of allMoves) {
          curState = applyMove(curState, m.move);
        }
        expect(isCubeSolved(curState)).toBe(true);
      }
    });
  });
});

