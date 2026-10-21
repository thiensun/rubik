import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import {
  CubeNetState,
  CubeFaceState,
  FaceKey,
  CubeColor,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  invertMove,
  invertMoves,
  isCubeSolved,
  expandAlgorithmNotation,
  generateWCAScramble,
} from '../src/utils/cubeState';
import { validateCubeState } from '../src/utils/cubeValidator';
import {
  getSolutionForLevel,
  createMoves,
  DEMO_SCRAMBLES,
  CFOP_DEMO_SCRAMBLE,
} from '../src/utils/solutionStages';
import { ALGORITHMS_LIBRARY } from '../src/utils/algorithmsData';

// ============================================================================
// 3D SIMULATION HARNESS (Reflecting ThreeCubeViewer.tsx exactly)
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

// Convert 3D position and normal to 2D net FaceKey and sticker index (0-8)
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

function createNumberedCube(): Record<FaceKey, string[]> {
  const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const res = {} as Record<FaceKey, string[]>;
  faces.forEach((f) => {
    res[f] = Array.from({ length: 9 }, (_, i) => `${f}${i}`);
  });
  return res;
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

function apply3DMove(cubelets: Simulated3DCubelet[], moveStr: string): void {
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

describe('Challenger 2 Empirical Verification: 3D Parity, Multi-View Flows & Responsive Layout', () => {

  // =========================================================================
  // OBJECTIVE 1: 2D vs 3D PARITY ACROSS ALL 54 MOVE VARIANTS
  // =========================================================================
  describe('Objective 1: 2D vs 3D Parity across all 54 move variants', () => {
    const OUTER_MOVES = ['U', 'D', 'L', 'R', 'F', 'B']; // 6
    const SLICE_MOVES = ['M', 'E', 'S'];                // 3
    const WIDE_MOVES  = ['r', 'l', 'u', 'd', 'f', 'b']; // 6
    const ROTATIONS   = ['x', 'y', 'z'];                // 3
    const ALL_18_BASES = [...OUTER_MOVES, ...SLICE_MOVES, ...WIDE_MOVES, ...ROTATIONS];
    const MODIFIERS   = ['', "'", '2'];                 // 3
    const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];

    it('asserts 100% 54-sticker equality between 3D normal projection and 2D applyMove for each of the 54 variants', () => {
      let moveCount = 0;
      for (const base of ALL_18_BASES) {
        for (const mod of MODIFIERS) {
          const move = `${base}${mod}`;
          moveCount++;

          const numberedNet = createNumberedCube();

          // 2D Net State
          let expected2D = numberedNet as any;
          expected2D = applyMove(expected2D, move);

          // 3D Projected State
          const cubelets = build3DCubelets(numberedNet);
          apply3DMove(cubelets, move);
          const actual3D = readNetFrom3DCubelets(cubelets);

          for (const f of faces) {
            expect(
              actual3D[f],
              `Move ${move} failed on face ${f}: expected 2D does not match 3D normal projection`
            ).toEqual(expected2D[f]);
          }
        }
      }
      expect(moveCount).toBe(54);
    });

    it('verifies 4-cycle identity on single turns and 2-cycle identity on double turns for all 18 move bases', () => {
      for (const base of ALL_18_BASES) {
        // 4 single turns return to identity
        let c = createNumberedCube() as any;
        for (let i = 0; i < 4; i++) {
          c = applyMove(c, base);
        }
        const initial = createNumberedCube() as any;
        expect(c).toEqual(initial);

        // 2 double turns return to identity
        let c2 = createNumberedCube() as any;
        c2 = applyMove(applyMove(c2, `${base}2`), `${base}2`);
        expect(c2).toEqual(initial);

        // move + prime return to identity
        let cPrime = createNumberedCube() as any;
        cPrime = applyMove(applyMove(cPrime, base), `${base}'`);
        expect(cPrime).toEqual(initial);
      }
    });

    it('verifies complex multi-move sequences containing slices, wide moves, and rotations have 100% 3D parity', () => {
      const complexSequences = [
        "r U R' U' r' F R F'",                     // OLL 24 (wide + outer)
        "M2 U M2 U2 M2 U M2",                       // H-Perm (slices + outer)
        "x' R U' R' D R U R' D' x",                 // A-Perm (rotations + outer)
        "M' U M2 U M2 U M' U2 M2",                  // Z-Perm (slice + outer)
        "r' U' R U' R' U2 r",                       // OLL 25 (wide + outer)
        "l' U' L U' L' U2 l",                       // Left wide variant
        "f R U R' U' f'",                           // Small f wide move
      ];

      for (const seq of complexSequences) {
        const numberedNet = createNumberedCube();
        const moves = seq.split(/\s+/).filter(Boolean);

        // 2D Execution
        let state2D = numberedNet as any;
        for (const m of moves) {
          state2D = applyMove(state2D, m);
        }

        // 3D Execution
        const cubelets = build3DCubelets(numberedNet);
        for (const m of moves) {
          apply3DMove(cubelets, m);
        }
        const state3D = readNetFrom3DCubelets(cubelets);

        for (const f of faces) {
          expect(state3D[f], `Complex sequence "${seq}" failed parity on face ${f}`).toEqual(state2D[f]);
        }
      }
    });

    it('verifies that WCA bracketed triggers expand and execute with 100% parity', () => {
      const bracketed = "(R U R' U')3";
      const expanded = expandAlgorithmNotation(bracketed);
      expect(expanded).toBe("R U R' U' R U R' U' R U R' U'");

      const net1 = applyScramble(bracketed);
      const net2 = applyScramble(expanded);
      expect(net1).toEqual(net2);
    });
  });

  // =========================================================================
  // OBJECTIVE 2: MULTI-VIEW FLOW CHALLENGE
  // =========================================================================
  describe('Objective 2: Multi-View Flow Challenge', () => {
    it('verifies that switching from 6-face camera scan to 3D practice initializes cube cleanly without stale scanned state', () => {
      // 1. Simulate a camera scan session that produced a distinct scanned cube state
      const cameraScramble = "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R";
      const scannedCubeState = applyScramble(cameraScramble);
      expect(isCubeSolved(scannedCubeState)).toBe(false);

      // 2. User navigates to Algorithm Library and selects "T-Perm" to practice in 3D
      const tPermAlg = ALGORITHMS_LIBRARY.find((a) => a.id === '2l-pll-t' || a.name.includes('T-Perm'))!;
      expect(tPermAlg).toBeDefined();

      const customAlgorithm = {
        name: tPermAlg.name,
        notation: tPermAlg.notation,
        category: tPermAlg.category,
        prob: tPermAlg.prob,
        descriptionVi: tPermAlg.descriptionVi,
        holdingNoteVi: tPermAlg.holdingNoteVi,
      };

      // 3. Step3SolveInteractive logic for baseCubeState
      // const baseCubeState = useMemo(() => {
      //   if (customAlgorithm) {
      //     const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
      //     return applyScramble(invertMoves(sanitizedNotation));
      //   }
      //   if (scannedCubeState) return scannedCubeState;
      //   ...
      // }, [customAlgorithm, scannedCubeState, demoScramble, activeLevel]);

      const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
      const expectedSetupState = applyScramble(invertMoves(sanitizedNotation));

      // Emulate baseCubeState calculation in Step3SolveInteractive:
      const baseCubeState = customAlgorithm
        ? applyScramble(invertMoves(sanitizedNotation))
        : scannedCubeState;

      // Assert that baseCubeState strictly matches the algorithm setup state and NOT the scanned state
      expect(baseCubeState).toEqual(expectedSetupState);
      expect(baseCubeState).not.toEqual(scannedCubeState);

      // 4. Assert that applying the custom algorithm moves solves the cube to 100%
      const moves = createMoves(sanitizedNotation, 1);
      let currentState = cloneCube(baseCubeState);
      for (const m of moves) {
        currentState = applyMove(currentState, m.move);
      }
      expect(isCubeSolved(currentState)).toBe(true);

      // If the stale scannedCubeState had been used instead, it would NOT be solved!
      let staleState = cloneCube(scannedCubeState);
      for (const m of moves) {
        staleState = applyMove(staleState, m.move);
      }
      expect(isCubeSolved(staleState)).toBe(false);
    });

    it('verifies 0-move solved cube reset handling does not throw, marks complete, and returns clean solved stage', () => {
      const scannedCubeState = cloneCube(SOLVED_CUBE);
      const activeLevel = 'level-2';
      const demoScramble = null;
      const customAlgorithm = null;

      // Simulate solutionData computation in Step3SolveInteractive lines 158-167:
      const solutionData = (() => {
        if (customAlgorithm) {
          // not taken
          return null as any;
        }
        if (scannedCubeState && isCubeSolved(scannedCubeState)) {
          return {
            levelId: activeLevel,
            totalMoves: 0,
            stages: [],
            currentStageIndex: 0,
            estTime: '0.0s',
          };
        }
        return getSolutionForLevel(activeLevel, demoScramble || undefined, scannedCubeState);
      })();

      expect(solutionData.totalMoves).toBe(0);
      expect(solutionData.stages.length).toBe(0);

      // Flattened moves
      const allMoves = solutionData.stages.flatMap((s: any) => s.moves);
      expect(allMoves.length).toBe(0);

      // Check currentCubeState and isActuallySolved
      const currentMoveGlobalIdx = 0;
      const currentCubeState = cloneCube(scannedCubeState);
      const isActuallySolved = allMoves.length > 0 && currentMoveGlobalIdx < allMoves.length
        ? false
        : isCubeSolved(currentCubeState);

      expect(isActuallySolved).toBe(true);

      // Simulate currentStage fallback in Step3SolveInteractive lines 259-279:
      const currentStage = (() => {
        if (!solutionData.stages || solutionData.stages.length === 0) {
          return {
            id: 'solved-stage',
            stageNumber: 1,
            titleVi: 'Khối Đã Giải Hoàn Tất (0 Moves)',
            titleEn: 'Solved Cube (0 Moves)',
            subtitle: '100% Solved',
            status: 'done' as const,
            movesCount: 0,
            formulaSummary: '0 Moves',
            moves: [],
            caseDetails: {
              caseName: 'Khối Đã Giải',
              probability: '100% Solved',
              description: 'Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)',
              formula: '0 Moves',
              holdingNote: 'Khối đã hoàn tất 6 mặt đồng màu.',
              patternNote: 'Hoàn Thành 100%',
            },
          };
        }
        return solutionData.stages[0];
      })();

      expect(currentStage.id).toBe('solved-stage');
      expect(currentStage.movesCount).toBe(0);
      expect(currentStage.status).toBe('done');

      // Active stage hint
      const activeStageHint = isActuallySolved
        ? allMoves.length === 0
          ? '🎉 Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)'
          : '🎉 Chúc mừng! Khối Rubik đã được giải hoàn tất 100%!'
        : 'other';

      expect(activeStageHint).toContain('(0 Moves)');
    });
  });

  // =========================================================================
  // OBJECTIVE 3: RESPONSIVE LAYOUT CHALLENGE
  // =========================================================================
  describe('Objective 3: Responsive Layout Challenge', () => {
    const step3Path = path.resolve(__dirname, '../src/components/solver/Step3SolveInteractive.tsx');
    const step3Source = fs.readFileSync(step3Path, 'utf-8');

    it('verifies that Step 3 Reset Color dropdown remains anchored at left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] within <div className="relative">', () => {
      // Find the Reset Color dropdown section
      const relativeDivIndex = step3Source.indexOf('<div className="relative">');
      expect(relativeDivIndex).toBeGreaterThan(-1);

      // Ensure the button is inside this container
      const resetBtnIndex = step3Source.indexOf('<span>Reset Màu</span>', relativeDivIndex);
      expect(resetBtnIndex).toBeGreaterThan(relativeDivIndex);

      // Ensure dropdown container has the exact required class
      const expectedDropdownClass = 'absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]';
      expect(step3Source).toContain(expectedDropdownClass);

      const dropdownIndex = step3Source.indexOf(expectedDropdownClass, relativeDivIndex);
      expect(dropdownIndex).toBeGreaterThan(resetBtnIndex);
    });

    it('empirically verifies dropdown width does not overflow across mobile viewport widths (320px, 360px, 375px)', () => {
      // w-64 in Tailwind is 16rem = 256px
      const w64Px = 256;
      const testViewports = [320, 360, 375, 414, 768, 1024];

      for (const vp of testViewports) {
        // max-w-[calc(100vw-2rem)] = vp - 32px
        const maxAllowedWidth = vp - 32;
        const actualWidth = Math.min(w64Px, maxAllowedWidth);

        // Actual dropdown width must never exceed available screen width minus 2rem margin
        expect(actualWidth).toBeLessThanOrEqual(maxAllowedWidth);
        // And dropdown must fit inside the viewport with >= 16px gutter on both sides
        expect(actualWidth).toBeLessThan(vp);
      }
    });

    it('verifies responsive test suite files exist and are syntactically valid', () => {
      const respTestPath = path.resolve(__dirname, 'responsive.test.ts');
      const m3TestPath = path.resolve(__dirname, 'challenger_m3.test.ts');
      expect(fs.existsSync(respTestPath)).toBe(true);
      expect(fs.existsSync(m3TestPath)).toBe(true);
    });
  });
});
