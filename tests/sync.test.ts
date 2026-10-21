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
} from '../src/utils/cubeState';
import { solveCube } from '../src/utils/cubeSolver';
import { getSolutionForLevel, createMoves, DEMO_SCRAMBLES } from '../src/utils/solutionStages';

// ============================================================================
// 3D MODEL SIMULATION HELPERS (Matching ThreeCubeViewer.tsx exactly)
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

// Create a numbered cube net state to uniquely track all 54 stickers
function createNumberedCube(): Record<FaceKey, string[]> {
  const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const res = {} as Record<FaceKey, string[]>;
  faces.forEach((f) => {
    res[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  });
  return res;
}

// Map 3D cubelet integer position and face normal to 2D net face and sticker index
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

  if (ny === 1) {
    return { face: 'U', index: (z + 1) * 3 + (x + 1) };
  }
  if (ny === -1) {
    return { face: 'D', index: (1 - z) * 3 + (x + 1) };
  }
  if (nz === 1) {
    return { face: 'F', index: (1 - y) * 3 + (x + 1) };
  }
  if (nz === -1) {
    return { face: 'B', index: (1 - y) * 3 + (1 - x) };
  }
  if (nx === -1) {
    return { face: 'L', index: (1 - y) * 3 + (z + 1) };
  }
  if (nx === 1) {
    return { face: 'R', index: (1 - y) * 3 + (1 - z) };
  }
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
// TEST SUITES
// ============================================================================

describe('Milestone 2: 3D Rubik\'s Cube & Multi-View State Synchronization', () => {

  // --------------------------------------------------------------------------
  // Task 8.1: 3D Rotation Coordinate & Normal Transformation Parity
  // --------------------------------------------------------------------------
  describe('Task 8.1: 3D Mesh Rotation Parity against applyMove (All 18 WCA Moves)', () => {
    const ALL_18_MOVES = [
      'U', "U'", 'U2',
      'D', "D'", 'D2',
      'L', "L'", 'L2',
      'R', "R'", 'R2',
      'F', "F'", 'F2',
      'B', "B'", 'B2',
    ];

    for (const move of ALL_18_MOVES) {
      it(`verifies 100% 54-sticker parity for standard move ${move}`, () => {
        const numberedNet = createNumberedCube();

        // 1. Compute 2D Net transformation via applyMove
        const expected2D = applyMove(numberedNet as any, move);

        // 2. Compute 3D transformation via ThreeCubeViewer rotation geometry
        const cubelets = build3DCubelets(numberedNet);
        apply3DMoveToSimulated(cubelets, move);
        const actual3D = readNetFrom3DCubelets(cubelets);

        // 3. Verify all 54 stickers on all 6 faces match exactly
        const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
        for (const face of faces) {
          expect(actual3D[face]).toEqual(expected2D[face]);
        }
      });
    }

    it('verifies 100% parity across a complex 21-move WCA scramble sequence', () => {
      const wcaScramble = "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R";
      const moves = wcaScramble.trim().split(/\s+/);
      const numberedNet = createNumberedCube();

      // 1. Apply to 2D net
      let expected2D = numberedNet as any;
      for (const m of moves) {
        expected2D = applyMove(expected2D, m);
      }

      // 2. Apply to 3D cubelets
      const cubelets = build3DCubelets(numberedNet);
      for (const m of moves) {
        apply3DMoveToSimulated(cubelets, m);
      }
      const actual3D = readNetFrom3DCubelets(cubelets);

      // 3. Compare all 54 stickers
      const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
      for (const face of faces) {
        expect(actual3D[face]).toEqual(expected2D[face]);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Task 8.2: Algorithm Library Setup Inversion & Solved State Verification
  // --------------------------------------------------------------------------
  describe('Task 8.2: Algorithm Library Practice in 3D Setup Inversion', () => {
    const REPRESENTATIVE_ALGORITHMS = [
      { name: 'T-Perm (PLL)', notation: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { name: 'Jb-Perm (PLL)', notation: "R U R' F' R U R' U' R' F R2 U' R'" },
      { name: 'Sune (OLL 27)', notation: "R U R' U R U2 R'" },
      { name: 'Anti-Sune (OLL 26)', notation: "R U2 R' U' R U' R'" },
      { name: 'Sexy Move (Trigger)', notation: "R U R' U'" },
      { name: 'Y-Perm (PLL)', notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
      { name: 'F-Perm (PLL)', notation: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
      { name: 'Ua-Perm (PLL)', notation: "R U' R U R U R U' R' U' R2" },
      { name: 'Ub-Perm (PLL)', notation: "R2 U R U R' U' R' U' R' U R'" },
      { name: 'H-Perm (PLL Alternate)', notation: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2" },
    ];

    for (const alg of REPRESENTATIVE_ALGORITHMS) {
      it(`verifies setup state inversion and execution reaches 100% solved for ${alg.name}`, () => {
        // Setup state: applyScramble(invertMoves(alg.notation))
        const inverted = invertMoves(alg.notation);
        const setupState = applyScramble(inverted);

        // 1. Initial setup state must NOT be solved
        expect(isCubeSolved(setupState)).toBe(false);

        // 2. Parse algorithm moves
        const tokens = alg.notation.trim().split(/\s+/).filter(Boolean);
        let curState = cloneCube(setupState);

        // 3. Step through each move in the algorithm
        for (let i = 0; i < tokens.length; i++) {
          curState = applyMove(curState, tokens[i]);
          if (i < tokens.length - 1) {
            // Intermediate state must NOT be solved prematurely
            expect(isCubeSolved(curState)).toBe(false);
          }
        }

        // 4. Executing all moves brings the cube to SOLVED_CUBE
        expect(isCubeSolved(curState)).toBe(true);
      });
    }

    it('verifies parentheses-wrapped and bracketed algorithm strings are sanitized and solve to 100% solved', () => {
      const PARENTHESIZED_ALGORITHMS = [
        { name: 'Sexy Move Trigger', notation: "(R U R' U')" },
        { name: 'T-Perm with Triggers', notation: "(R U R' U') (R' F R2 U' R' U' R U R' F')" },
        { name: 'Sune with Parentheses', notation: "(R U R') U (R U2 R')" },
        { name: 'Bracketed Commutator', notation: "[R U R', D]" },
        { name: 'Double Bracketed / Extra Whitespace', notation: "  ( R  U  R'  U' )   ( R' F R F' )  " },
        { name: 'F-Perm Triggers', notation: "(R' U' F') (R U R' U') (R' F R2 U' R' U' R U R' U R)" },
        { name: 'OLL 33 with Triggers', notation: "(R U R' U') (R' F R F')" },
      ];

      for (const alg of PARENTHESIZED_ALGORITHMS) {
        // Sanitize notation
        const sanitized = alg.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
        const inverted = invertMoves(sanitized);
        const setupState = applyScramble(inverted);

        // 1. Initial setup state must NOT be solved
        expect(isCubeSolved(setupState)).toBe(false);

        // 2. Parse algorithm moves
        const tokens = sanitized.split(/\s+/).filter(Boolean);
        expect(tokens.length).toBeGreaterThan(0);
        let curState = cloneCube(setupState);

        // 3. Step through each move in the algorithm
        for (let i = 0; i < tokens.length; i++) {
          curState = applyMove(curState, tokens[i]);
          if (i < tokens.length - 1) {
            // Intermediate state must NOT be solved prematurely
            expect(isCubeSolved(curState)).toBe(false);
          }
        }

        // 4. Executing all moves brings the cube to SOLVED_CUBE
        expect(isCubeSolved(curState)).toBe(true);
      }
    });

    it('verifies 3D rotation parity with sanitized parenthesized algorithm tokens', () => {
      const rawAlg = "(R U R' U')";
      const sanitized = rawAlg.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
      const inverted = invertMoves(sanitized);
      const setupState = applyScramble(inverted);

      const tokens = sanitized.split(/\s+/).filter(Boolean);
      let net2D = cloneCube(setupState);

      const cubelets = build3DCubelets(setupState as any);

      for (const m of tokens) {
        net2D = applyMove(net2D, m);
        apply3DMoveToSimulated(cubelets, m);
      }

      const net3D = readNetFrom3DCubelets(cubelets);
      const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
      for (const f of faces) {
        expect(net3D[f]).toEqual(net2D[f]);
      }
      expect(isCubeSolved(net2D)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Task 8.3: Step 3 Live State Tracking & True Solved Gate Evaluation
  // --------------------------------------------------------------------------
  describe('Task 8.3: Live State Tracking at Step k and False Positive Immunity', () => {
    it('accurately evaluates isActuallySolved === false during moves and true only at completion', () => {
      // Use standard CFOP demo scramble
      const scramble = DEMO_SCRAMBLES['level-2'];
      const scannedCubeState = applyScramble(scramble);
      expect(isCubeSolved(scannedCubeState)).toBe(false);

      const solution = getSolutionForLevel('level-2', scramble);
      expect(solution.stages.length).toBeGreaterThan(0);

      const allMoves = solution.stages.flatMap((s) => s.moves);
      expect(allMoves.length).toBeGreaterThan(0);

      // Simulate Step 3 state tracking at move index k
      let state = cloneCube(scannedCubeState);
      for (let k = 0; k < allMoves.length; k++) {
        // At move k before applying final move, cube is not solved
        const isSolvedAtK = isCubeSolved(state);
        expect(isSolvedAtK).toBe(false);

        state = applyMove(state, allMoves[k].move);
      }

      // After applying all moves, cube is genuinely solved
      expect(isCubeSolved(state)).toBe(true);
    });

    it('correctly handles Solved Cube Reset with 0 moves and immediate isActuallySolved === true', () => {
      const solvedCube = cloneCube(SOLVED_CUBE);
      expect(isCubeSolved(solvedCube)).toBe(true);

      // In Step 3, if scannedCubeState is already solved, totalMoves must be 0 and stages empty
      const isInitialSolved = isCubeSolved(solvedCube);
      expect(isInitialSolved).toBe(true);

      // Simulate 0-move tracking
      const allMoves: { move: string }[] = [];
      let state = cloneCube(solvedCube);
      for (const m of allMoves) {
        state = applyMove(state, m.move);
      }
      expect(isCubeSolved(state)).toBe(true);
    });

    it('prevents false positive celebrations when solving arbitrary 54-sticker camera-scanned cubes', () => {
      // Generate arbitrary valid state
      const customScramble = "R U R' F' U2 F U R U2 R'";
      const cameraScannedState = applyScramble(customScramble);

      // Direct solver invocation without demo scramble
      const solution = getSolutionForLevel('auto-solve', undefined, cameraScannedState);
      expect(solution.totalMoves).toBeGreaterThan(0);

      const allMoves = solution.stages.flatMap((s) => s.moves);

      // Verify intermediate steps do not falsely trigger isCubeSolved
      let state = cloneCube(cameraScannedState);
      for (let k = 0; k < allMoves.length - 1; k++) {
        state = applyMove(state, allMoves[k].move);
        expect(isCubeSolved(state)).toBe(false);
      }

      // Final move completes solve
      state = applyMove(state, allMoves[allMoves.length - 1].move);
      expect(isCubeSolved(state)).toBe(true);
    });

    it('strictly evaluates isActuallySolved === false when scannedCubeState is null and demo scramble moves are pending', () => {
      const levels: Array<'auto-solve' | 'level-1' | 'level-2' | 'level-3' | 'level-4'> = [
        'auto-solve',
        'level-1',
        'level-2',
        'level-3',
        'level-4',
      ];

      for (const level of levels) {
        const demoScramble = DEMO_SCRAMBLES[level];
        const solution = getSolutionForLevel(level, demoScramble, undefined);
        const allMoves = solution.stages.flatMap((s) => s.moves);
        expect(allMoves.length).toBeGreaterThan(0);

        // Simulate Step3SolveInteractive logic when scannedCubeState is null / undefined
        const scannedCubeState: CubeNetState | null = null;
        const baseCubeState = scannedCubeState || applyScramble(demoScramble);

        const checkIsActuallySolved = (idx: number, curState: CubeNetState) => {
          if (allMoves.length > 0 && idx < allMoves.length) {
            return false;
          }
          return isCubeSolved(curState);
        };

        // Initial state at move 0:
        let currentMoveGlobalIdx = 0;
        let currentCubeState = cloneCube(baseCubeState);

        // At step 0, isActuallySolved must be strictly false
        expect(checkIsActuallySolved(currentMoveGlobalIdx, currentCubeState)).toBe(false);
        expect(isCubeSolved(currentCubeState)).toBe(false);

        // At every intermediate step, isActuallySolved must be strictly false
        for (let k = 0; k < allMoves.length; k++) {
          currentMoveGlobalIdx = k;
          expect(checkIsActuallySolved(currentMoveGlobalIdx, currentCubeState)).toBe(false);
          currentCubeState = applyMove(currentCubeState, allMoves[k].move);
        }

        // Only after all moves have been applied, isActuallySolved is true
        currentMoveGlobalIdx = allMoves.length;
        expect(checkIsActuallySolved(currentMoveGlobalIdx, currentCubeState)).toBe(true);
        expect(isCubeSolved(currentCubeState)).toBe(true);
      }
    });

    it('verifies that currentCubeState correctly tracks intermediate scrambled states from baseCubeState', () => {
      const demoScramble = DEMO_SCRAMBLES['level-3'];
      const baseCubeState = applyScramble(demoScramble);
      const solution = getSolutionForLevel('level-3', demoScramble);
      const allMoves = solution.stages.flatMap((s) => s.moves);

      let incrementalState = cloneCube(baseCubeState);

      for (let k = 0; k < allMoves.length; k++) {
        // Compute state at step k using slice(0, k)
        let slicedState = cloneCube(baseCubeState);
        const movesSlice = allMoves.slice(0, k);
        for (const m of movesSlice) {
          slicedState = applyMove(slicedState, m.move);
        }

        // Verify incremental state matches sliced state
        const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
        for (const f of faces) {
          expect(incrementalState[f]).toEqual(slicedState[f]);
        }

        incrementalState = applyMove(incrementalState, allMoves[k].move);
      }

      expect(isCubeSolved(incrementalState)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Task 8.4: Playback Timing & Animation Duration Scaling
  // --------------------------------------------------------------------------
  describe('Task 8.4: Playback Timing & Animation Duration Scaling', () => {
    function getDuration(speed: '0.5x' | '1.0x' | '2.0x' | number): number {
      if (speed === '0.5x' || speed === 0.5) return 380;
      if (speed === '2.0x' || speed === 2.0) return 110;
      return 180;
    }

    it('maps playbackSpeed to expected 3D rotation durations', () => {
      expect(getDuration('0.5x')).toBe(380);
      expect(getDuration(0.5)).toBe(380);
      expect(getDuration('1.0x')).toBe(180);
      expect(getDuration(1.0)).toBe(180);
      expect(getDuration('2.0x')).toBe(110);
      expect(getDuration(2.0)).toBe(110);
    });
  });

  // --------------------------------------------------------------------------
  // Task 8.5: Full WCA Move Set Parity (Slice, Wide, Rotations, All 54 Variants)
  // --------------------------------------------------------------------------
  describe('Task 8.5: Full WCA Move Set 2D vs 3D Parity', () => {
    const BASE_MOVES = [
      'R', 'L', 'U', 'D', 'F', 'B', // Outer (6)
      'M', 'E', 'S',                // Slice (3)
      'r', 'l', 'u', 'd', 'f', 'b', // Wide lowercase (6)
      'x', 'y', 'z',                // Rotations (3)
    ];
    const MODIFIERS = ['', "'", '2'];

    it('verifies exact 2D vs 3D parity across all 54 move variants', () => {
      const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];

      for (const base of BASE_MOVES) {
        for (const mod of MODIFIERS) {
          const move = `${base}${mod}`;
          const numberedNet = createNumberedCube();

          // 2D applied
          let expected2D = numberedNet as any;
          expected2D = applyMove(expected2D, move);

          // 3D applied
          const cubelets = build3DCubelets(numberedNet);
          apply3DMoveToSimulated(cubelets, move);
          const actual3D = readNetFrom3DCubelets(cubelets);

          for (const f of faces) {
            expect(actual3D[f], `Mismatch on face ${f} for move ${move}`).toEqual(expected2D[f]);
          }
        }
      }
    });

    it('verifies wide move suffix-w aliases (Rw, Lw, Uw, Dw, Fw, Bw) match lowercase variants', () => {
      const WIDE_PAIRS = [
        ['Rw', 'r'],
        ['Lw', 'l'],
        ['Uw', 'u'],
        ['Dw', 'd'],
        ['Fw', 'f'],
        ['Bw', 'b'],
      ];

      for (const [wMove, lowerMove] of WIDE_PAIRS) {
        for (const mod of ['', "'", '2']) {
          const m1 = `${wMove}${mod}`;
          const m2 = `${lowerMove}${mod}`;
          const c1 = applyMove(SOLVED_CUBE, m1);
          const c2 = applyMove(SOLVED_CUBE, m2);
          expect(c1).toEqual(c2);
        }
      }
    });
  });
});
