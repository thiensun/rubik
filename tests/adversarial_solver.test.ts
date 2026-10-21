import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  CubeNetState,
  applyMove,
  applyScramble,
  generateWCAScramble,
  isCubeSolved,
  cloneCube,
  invertMove,
  invertMoves,
  FaceKey,
  CubeColor,
} from '../src/utils/cubeState';
import {
  solveCube,
  isCrossSolved,
  isF2LSolved,
  isOLLSolved,
} from '../src/utils/cubeSolver';
import { validateCubeState } from '../src/utils/cubeValidator';
import { SolverLevelId } from '../src/types/cubing';

function applyMovesSequence(cube: CubeNetState, moves: string[]): CubeNetState {
  let cur = cube;
  for (const m of moves) {
    if (!m) continue;
    cur = applyMove(cur, m);
  }
  return cur;
}

const ALL_18_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

const ALL_5_LEVELS: SolverLevelId[] = [
  'auto-solve',
  'level-1',
  'level-2',
  'level-3',
  'level-4',
];

describe('Tier 5 Adversarial Cube Mechanics & Solver Hardening Suite', () => {
  // =========================================================================
  // 1. CLASSIC RUBIK'S CUBE PATTERNS
  // =========================================================================
  describe('1. Classic Patterns Hardening', () => {
    const CLASSIC_PATTERNS: Record<string, string> = {
      Superflip: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
      Checkerboard: 'R2 L2 U2 D2 F2 B2',
      'Cube in a Cube': "F L F U' R U F2 L2 U' L' B D' B' L2 U",
      Wire: 'R L F B R L F B R L F B',
      Crosses: "R2 L' D F2 R' D' R' L U' D R D B2 R' U D2",
    };

    for (const [patternName, notation] of Object.entries(CLASSIC_PATTERNS)) {
      it(`validates and solves classic pattern '${patternName}'`, () => {
        const scrambled = applyScramble(notation);
        expect(isCubeSolved(scrambled)).toBe(false);

        // Mathematical validity check
        const validation = validateCubeState(scrambled);
        expect(validation.isValid, `Pattern ${patternName} must be mathematically valid`).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // Solve directly from CubeNetState
        const solveRes = solveCube(scrambled, 'level-2');
        expect(solveRes.success, `solveCube must succeed for ${patternName}`).toBe(true);
        expect(solveRes.moves.length).toBeGreaterThan(0);

        // Verify physical resolution
        const finalState = applyMovesSequence(scrambled, solveRes.moves);
        expect(isCubeSolved(finalState), `Final state for ${patternName} must be isCubeSolved === true`).toBe(true);
      });
    }

    it('solves Superflip and Checkerboard across all 5 solver levels', () => {
      const patterns = [
        { name: 'Superflip', alg: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2" },
        { name: 'Checkerboard', alg: 'R2 L2 U2 D2 F2 B2' },
      ];

      for (const { name, alg } of patterns) {
        const scrambled = applyScramble(alg);
        for (const level of ALL_5_LEVELS) {
          const res = solveCube(scrambled, level);
          expect(res.success, `${name} must succeed on ${level}`).toBe(true);
          const solvedState = applyMovesSequence(scrambled, res.moves);
          expect(isCubeSolved(solvedState), `${name} must reach solved state on ${level}`).toBe(true);

          if (level === 'auto-solve') {
            expect(res.stages).toHaveLength(1);
          } else if (level === 'level-1') {
            expect(res.stages).toHaveLength(7);
          } else {
            expect(res.stages).toHaveLength(4);
          }
        }
      }
    });
  });

  // =========================================================================
  // 2. BOUNDARY INPUTS & SHORT SCRAMBLES
  // =========================================================================
  describe('2. Boundary Inputs & Short Scrambles', () => {
    describe('Already Solved Cube', () => {
      it('returns 0 moves and success: true across all 5 solver levels', () => {
        expect(isCubeSolved(SOLVED_CUBE)).toBe(true);
        const val = validateCubeState(SOLVED_CUBE);
        expect(val.isValid).toBe(true);

        for (const level of ALL_5_LEVELS) {
          const res = solveCube(SOLVED_CUBE, level);
          expect(res.success).toBe(true);
          expect(res.moves).toEqual([]);
          expect(res.stages).toEqual([]);
          expect(res.errorMessage).toBeUndefined();
        }
      });
    });

    describe('All 18 Single Move Scrambles and Inverses', () => {
      it.each(ALL_18_MOVES)('solves 1-move scramble %s and confirms inverse cancellation', (move) => {
        const scrambled = applyMove(SOLVED_CUBE, move);
        expect(isCubeSolved(scrambled)).toBe(false);

        // 1. Inversion property verification
        const inv = invertMove(move);
        const restored = applyMove(scrambled, inv);
        expect(isCubeSolved(restored)).toBe(true);

        // 2. Real solver verification
        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);
        const solved = applyMovesSequence(scrambled, res.moves);
        expect(isCubeSolved(solved)).toBe(true);
      });
    });

    describe('2-Move Scrambles', () => {
      const twoMoveScrambles = [
        'R U', "R' U'", 'F R', "F' L", 'U D', 'L R', 'B F', 'U2 R2',
        'F2 B2', 'D2 L2', 'R2 U', "F' D2", "L2 B'", 'U R2', 'D F2',
        'B2 L', "R' F'", 'L U', 'B R', 'F D',
      ];

      it.each(twoMoveScrambles)('solves 2-move scramble %s', (scramble) => {
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);
        const solved = applyMovesSequence(scrambled, res.moves);
        expect(isCubeSolved(solved)).toBe(true);
      });
    });

    describe('3-Move Scrambles', () => {
      const threeMoveScrambles = [
        "R U R'", "F R U", "L' D2 B", "U F' R2", "B' U R",
        "D F2 L", "R2 D' F", "U' B2 L'", "F' U D", "L2 F B",
        "R' D R", "F U2 F'", "L U' L'", "B2 U2 B2", "D' R2 D",
      ];

      it.each(threeMoveScrambles)('solves 3-move scramble %s', (scramble) => {
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);
        const solved = applyMovesSequence(scrambled, res.moves);
        expect(isCubeSolved(solved)).toBe(true);
      });
    });

    describe('4-Move Scrambles', () => {
      const fourMoveScrambles = [
        "R U R' U'",       // Sexy Move
        "R' F R F'",       // Sledgehammer
        "U R U' R'",       // Inverse Sexy
        "F R U' R'",
        "R2 U2 R2 U2",
        "F2 U2 R2 D2",
        "L' U' L U",
        "B U B' U'",
        "D R D' R'",
        "R B' R' B",
        "U2 F2 D2 B2",
        "L2 R2 U2 D2",
        "F U R U'",
        "R' D' R D",
        "L F' L' F",
      ];

      it.each(fourMoveScrambles)('solves 4-move scramble %s', (scramble) => {
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);
        const solved = applyMovesSequence(scrambled, res.moves);
        expect(isCubeSolved(solved)).toBe(true);
      });
    });
  });

  // =========================================================================
  // 3. 50+ RANDOM WCA SCRAMBLES ACROSS ALL 5 SOLVER LEVELS
  // =========================================================================
  describe('3. 50+ Random WCA Scrambles Tested Across All 5 Solver Levels', () => {
    // Generate 50 unique scrambles with lengths 18 to 25
    const scrambles: string[] = [];
    for (let i = 0; i < 52; i++) {
      const length = 18 + (i % 8);
      scrambles.push(generateWCAScramble(length));
    }

    it(
      'solves 52 random WCA scrambles across all 5 solver levels with stage parity checks',
      { timeout: 90000 },
      () => {
        for (let i = 0; i < scrambles.length; i++) {
          const scramble = scrambles[i];
          const cube = applyScramble(scramble);
          expect(isCubeSolved(cube)).toBe(false);

          // Test on auto-solve
          const autoRes = solveCube(cube, 'auto-solve');
          expect(autoRes.success).toBe(true);
          expect(autoRes.stages).toHaveLength(1);
          const autoSolved = applyMovesSequence(cube, autoRes.moves);
          expect(isCubeSolved(autoSolved)).toBe(true);

          // Test on level-1 (7 discrete stages)
          const l1Res = solveCube(cube, 'level-1');
          expect(l1Res.success).toBe(true);
          expect(l1Res.stages).toHaveLength(7);
          const l1Solved = applyMovesSequence(cube, l1Res.moves);
          expect(isCubeSolved(l1Solved)).toBe(true);

          // Test on level-2 (CFOP 4 stages with physical stage progression checks)
          const l2Res = solveCube(cube, 'level-2');
          expect(l2Res.success).toBe(true);
          expect(l2Res.stages).toHaveLength(4);

          // Verify CFOP intermediate stage progression
          const crossMoves = l2Res.stages[0].moves.map((m) => m.move);
          const f2lMoves = l2Res.stages[1].moves.map((m) => m.move);
          const ollMoves = l2Res.stages[2].moves.map((m) => m.move);
          const pllMoves = l2Res.stages[3].moves.map((m) => m.move);

          const afterCross = applyMovesSequence(cube, crossMoves);
          expect(isCrossSolved(afterCross), `Cross must be solved at stage 1 for scramble #${i + 1}`).toBe(true);

          const afterF2L = applyMovesSequence(afterCross, f2lMoves);
          expect(isF2LSolved(afterF2L), `F2L must be solved at stage 2 for scramble #${i + 1}`).toBe(true);

          const afterOLL = applyMovesSequence(afterF2L, ollMoves);
          expect(isOLLSolved(afterOLL), `OLL must be solved at stage 3 for scramble #${i + 1}`).toBe(true);

          const afterPLL = applyMovesSequence(afterOLL, pllMoves);
          expect(isCubeSolved(afterPLL), `Cube must be 100% solved at stage 4 for scramble #${i + 1}`).toBe(true);

          // Test on level-3 and level-4
          const l3Res = solveCube(cube, 'level-3');
          expect(l3Res.success).toBe(true);
          expect(isCubeSolved(applyMovesSequence(cube, l3Res.moves))).toBe(true);

          const l4Res = solveCube(cube, 'level-4');
          expect(l4Res.success).toBe(true);
          expect(isCubeSolved(applyMovesSequence(cube, l4Res.moves))).toBe(true);
        }
      }
    );
  });

  // =========================================================================
  // 4. ADVERSARIAL INVALID STATES & VIETNAMESE DIAGNOSTICS
  // =========================================================================
  describe('4. Adversarial Invalid States & Localized Vietnamese Diagnostics', () => {
    describe('Corner Orientation Parity Violations (sum CO % 3 !== 0)', () => {
      it('rejects single clockwise twisted corner with Vietnamese diagnostic', () => {
        // Twist UFR clockwise: U[8], R[0], F[2]
        const badCube = cloneCube(SOLVED_CUBE);
        const u = badCube.U[8];
        const r = badCube.R[0];
        const f = badCube.F[2];
        badCube.U[8] = f;
        badCube.R[0] = u;
        badCube.F[2] = r;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.cornerOrientationParity).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);

        const solveRes = solveCube(badCube);
        expect(solveRes.success).toBe(false);
        expect(solveRes.errorMessage).toContain('Lỗi xoay góc (Corner Twist Parity)');
      });

      it('rejects single counter-clockwise twisted corner with Vietnamese diagnostic', () => {
        // Twist DFL counter-clockwise: D[0], L[8], F[6]
        const badCube = cloneCube(SOLVED_CUBE);
        const d = badCube.D[0];
        const l = badCube.L[8];
        const f = badCube.F[6];
        badCube.D[0] = f;
        badCube.L[8] = d;
        badCube.F[6] = l;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.cornerOrientationParity).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);

        const solveRes = solveCube(badCube);
        expect(solveRes.success).toBe(false);
        expect(solveRes.errorMessage).toContain('Lỗi xoay góc (Corner Twist Parity)');
      });

      it('rejects two clockwise twisted corners (sum = 2 = 2 mod 3 !== 0)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Twist UFR clockwise
        let u = badCube.U[8];
        let r = badCube.R[0];
        let f = badCube.F[2];
        badCube.U[8] = f;
        badCube.R[0] = u;
        badCube.F[2] = r;

        // Twist UFL clockwise: U[6], F[0], L[2]
        u = badCube.U[6];
        f = badCube.F[0];
        let l = badCube.L[2];
        badCube.U[6] = l;
        badCube.F[0] = u;
        badCube.L[2] = f;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.cornerOrientationParity).toBe(false);
      });
    });

    describe('Edge Orientation Parity Violations (sum EO % 2 !== 0)', () => {
      it.each(['UB', 'UL', 'UR', 'UF', 'FL', 'FR', 'BL', 'BR', 'DF', 'DL', 'DR', 'DB'])(
        'rejects single flipped edge at slot %s with Vietnamese diagnostic',
        (slot) => {
          const badCube = cloneCube(SOLVED_CUBE);
          switch (slot) {
            case 'UB': { const tmp = badCube.U[1]; badCube.U[1] = badCube.B[1]; badCube.B[1] = tmp; break; }
            case 'UL': { const tmp = badCube.U[3]; badCube.U[3] = badCube.L[1]; badCube.L[1] = tmp; break; }
            case 'UR': { const tmp = badCube.U[5]; badCube.U[5] = badCube.R[1]; badCube.R[1] = tmp; break; }
            case 'UF': { const tmp = badCube.U[7]; badCube.U[7] = badCube.F[1]; badCube.F[1] = tmp; break; }
            case 'FL': { const tmp = badCube.F[3]; badCube.F[3] = badCube.L[5]; badCube.L[5] = tmp; break; }
            case 'FR': { const tmp = badCube.F[5]; badCube.F[5] = badCube.R[3]; badCube.R[3] = tmp; break; }
            case 'BL': { const tmp = badCube.B[5]; badCube.B[5] = badCube.L[3]; badCube.L[3] = tmp; break; }
            case 'BR': { const tmp = badCube.B[3]; badCube.B[3] = badCube.R[5]; badCube.R[5] = tmp; break; }
            case 'DF': { const tmp = badCube.D[1]; badCube.D[1] = badCube.F[7]; badCube.F[7] = tmp; break; }
            case 'DL': { const tmp = badCube.D[3]; badCube.D[3] = badCube.L[7]; badCube.L[7] = tmp; break; }
            case 'DR': { const tmp = badCube.D[5]; badCube.D[5] = badCube.R[7]; badCube.R[7] = tmp; break; }
            case 'DB': { const tmp = badCube.D[7]; badCube.D[7] = badCube.B[7]; badCube.B[7] = tmp; break; }
          }

          const val = validateCubeState(badCube);
          expect(val.isValid).toBe(false);
          expect(val.details.edgeOrientationParity).toBe(false);
          expect(val.errors.some((e) => e.includes('Lỗi lật cạnh (Edge Flip Parity)'))).toBe(true);

          const solveRes = solveCube(badCube);
          expect(solveRes.success).toBe(false);
          expect(solveRes.errorMessage).toContain('Lỗi lật cạnh (Edge Flip Parity)');
        }
      );

      it('rejects 3 flipped edges (sum EO = 3 = 1 mod 2 !== 0)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Flip UB, UL, UR
        let tmp = badCube.U[1]; badCube.U[1] = badCube.B[1]; badCube.B[1] = tmp;
        tmp = badCube.U[3]; badCube.U[3] = badCube.L[1]; badCube.L[1] = tmp;
        tmp = badCube.U[5]; badCube.U[5] = badCube.R[1]; badCube.R[1] = tmp;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.edgeOrientationParity).toBe(false);
      });
    });

    describe('Permutation Parity Violations (sgn(EP) !== sgn(CP))', () => {
      it('rejects swapped 2 edges without swapped corners', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Swap DF and DB edges
        const dfD = badCube.D[1];
        const dfF = badCube.F[7];
        badCube.D[1] = badCube.D[7];
        badCube.F[7] = badCube.B[7];
        badCube.D[7] = dfD;
        badCube.B[7] = dfF;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.permutationParity).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);

        const solveRes = solveCube(badCube);
        expect(solveRes.success).toBe(false);
        expect(solveRes.errorMessage).toContain('Lỗi hoán vị (Permutation Parity)');
      });

      it('rejects swapped 2 corners without swapped edges', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Swap UFL and UFR corners preserving individual corner chirality
        // std UFL: ['yellow', 'green', 'orange']
        // std UFR: ['yellow', 'red', 'green']
        // In UFL slot (U[6], F[0], L[2]): put UFR piece -> U[6]=yellow, F[0]=red, L[2]=green
        // In UFR slot (U[8], R[0], F[2]): put UFL piece -> U[8]=yellow, R[0]=green, F[2]=orange
        badCube.U[6] = 'yellow';
        badCube.F[0] = 'red';
        badCube.L[2] = 'green';

        badCube.U[8] = 'yellow';
        badCube.R[0] = 'green';
        badCube.F[2] = 'orange';

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.permutationParity).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);

        const solveRes = solveCube(badCube);
        expect(solveRes.success).toBe(false);
        expect(solveRes.errorMessage).toContain('Lỗi hoán vị (Permutation Parity)');
      });
    });

    describe('Color Count Violations & Non-WCA Colors', () => {
      it('rejects skewed color counts (10 white, 8 yellow)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.U[0] = 'white';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.colorCountsValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi số lượng màu'))).toBe(true);
      });

      it('rejects monochrome cube (all 54 stickers yellow)', () => {
        const monoCube: CubeNetState = {
          U: Array(9).fill('yellow') as any,
          D: Array(9).fill('yellow') as any,
          F: Array(9).fill('yellow') as any,
          B: Array(9).fill('yellow') as any,
          L: Array(9).fill('yellow') as any,
          R: Array(9).fill('yellow') as any,
        };
        const val = validateCubeState(monoCube);
        expect(val.isValid).toBe(false);
        expect(val.details.colorCountsValid).toBe(false);
      });

      it('rejects invalid color name in sticker array', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        (badCube.F as any)[0] = 'purple';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.errors.some((e) => e.includes('không hợp lệ'))).toBe(true);
      });
    });

    describe('Duplicate & Misplaced Fixed Centers', () => {
      it('rejects duplicate center colors (e.g. D center is yellow instead of white)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.D[4] = 'yellow';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.centersValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi tâm mặt D'))).toBe(true);
      });

      it('rejects non-standard center arrangement (F center is blue)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.F[4] = 'blue';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.centersValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi tâm mặt F'))).toBe(true);
      });
    });

    describe('Impossible Pieces, Duplicate Pieces, and Chirality Violations', () => {
      it('rejects edge with physically opposite colors (yellow-white in UB slot)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.U[1] = 'yellow';
        badCube.B[1] = 'white';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.edgesValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi viên cạnh tại vị trí UB'))).toBe(true);
      });

      it('rejects duplicate edge piece (two DF pieces)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Put another DF (white, green) in DB slot (D[7], B[7])
        badCube.D[7] = 'white';
        badCube.B[7] = 'green';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.edgesValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi trùng lặp viên cạnh'))).toBe(true);
      });

      it('rejects duplicate corner piece (two DFR pieces)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // std DFR: ['white', 'green', 'red']
        // Put in DBR slot: D[8], R[8], B[6]
        badCube.D[8] = 'white';
        badCube.R[8] = 'green';
        badCube.B[6] = 'red';
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.cornersValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi trùng lặp viên góc'))).toBe(true);
      });

      it('rejects reflected corner chirality (mirror piece)', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Invert chirality of DBL corner (white, blue, orange) by swapping blue and orange
        const tmp = badCube.B[8];
        badCube.B[8] = badCube.L[6];
        badCube.L[6] = tmp;

        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.details.cornersValid).toBe(false);
        expect(val.errors.some((e) => e.includes('Lỗi góc nghịch hướng (Chirality)'))).toBe(true);
      });

      it('rejects face with fewer than 9 stickers', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        (badCube as any).U = ['yellow', 'yellow'];
        const val = validateCubeState(badCube);
        expect(val.isValid).toBe(false);
        expect(val.errors.some((e) => e.includes('không có đủ 9 ô nhãn dán'))).toBe(true);
      });
    });
  });

  // =========================================================================
  // 5. PERMUTATION GROUP THEORY INVARIANCE & NON-TRIVIAL PARITIES
  // =========================================================================
  describe('5. Permutation Group Theory Invariance', () => {
    it('accepts 2 flipped edges as physically solvable', () => {
      // Flip UB and UF edges
      const cube = cloneCube(SOLVED_CUBE);
      let tmp = cube.U[1]; cube.U[1] = cube.B[1]; cube.B[1] = tmp;
      tmp = cube.U[7]; cube.U[7] = cube.F[1]; cube.F[1] = tmp;

      const val = validateCubeState(cube);
      expect(val.isValid).toBe(true);
      expect(val.details.edgeOrientationParity).toBe(true);

      const solveRes = solveCube(cube);
      expect(solveRes.success).toBe(true);
      expect(isCubeSolved(applyMovesSequence(cube, solveRes.moves))).toBe(true);
    });

    it('accepts 3 twisted corners in the same direction (1 + 1 + 1 = 3 = 0 mod 3)', () => {
      const cube = cloneCube(SOLVED_CUBE);
      // Twist UFL, UFR, UBL clockwise
      // UFL: U[6], F[0], L[2]
      let u = cube.U[6]; let f = cube.F[0]; let l = cube.L[2];
      cube.U[6] = l; cube.F[0] = u; cube.L[2] = f;

      // UFR: U[8], R[0], F[2]
      u = cube.U[8]; let r = cube.R[0]; f = cube.F[2];
      cube.U[8] = f; cube.R[0] = u; cube.F[2] = r;

      // UBL: U[0], L[0], B[2]
      u = cube.U[0]; l = cube.L[0]; let b = cube.B[2];
      cube.U[0] = b; cube.L[0] = u; cube.B[2] = l;

      const val = validateCubeState(cube);
      expect(val.isValid).toBe(true);
      expect(val.details.cornerOrientationParity).toBe(true);

      const solveRes = solveCube(cube);
      expect(solveRes.success).toBe(true);
      expect(isCubeSolved(applyMovesSequence(cube, solveRes.moves))).toBe(true);
    });

    it('accepts T-Perm, J-Perm, and Y-Perm (swapped 2 edges AND 2 corners)', () => {
      const perms = [
        { name: 'T-Perm', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
        { name: 'Ja-Perm', alg: "R' U L' U2 R U' R' U2 R L" },
        { name: 'Y-Perm', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
      ];

      for (const { name, alg } of perms) {
        const cube = applyScramble(alg);
        const val = validateCubeState(cube);
        expect(val.isValid, `${name} must be valid`).toBe(true);
        expect(val.details.permutationParity).toBe(true);

        const solveRes = solveCube(cube);
        expect(solveRes.success, `${name} must solve`).toBe(true);
        expect(isCubeSolved(applyMovesSequence(cube, solveRes.moves))).toBe(true);
      }
    });

    it('accepts 3-cycle edge perms (U-Perms) and 3-cycle corner perms (A-Perms)', () => {
      const perms = [
        { name: 'Ua-Perm', alg: "R U' R U R U R U' R' U' R2" },
        { name: 'Ub-Perm', alg: "R2 U R U R' U' R' U' R' U R'" },
        { name: 'Aa-Perm', alg: "R' F R' B2 R F' R' B2 R2" },
        { name: 'Ab-Perm', alg: "R2 B2 R F R' B2 R F' R" },
      ];

      for (const { name, alg } of perms) {
        const cube = applyScramble(alg);
        const val = validateCubeState(cube);
        expect(val.isValid, `${name} must be valid`).toBe(true);

        const solveRes = solveCube(cube);
        expect(solveRes.success, `${name} must solve`).toBe(true);
        expect(isCubeSolved(applyMovesSequence(cube, solveRes.moves))).toBe(true);
      }
    });
  });
});
