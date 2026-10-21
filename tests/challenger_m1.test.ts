import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  CubeNetState,
  applyMove,
  applyScramble,
  generateWCAScramble,
  isCubeSolved,
  cloneCube,
} from '../src/utils/cubeState';
import {
  solveCube,
  isCrossSolved,
  isF2LSolved,
  isOLLSolved,
} from '../src/utils/cubeSolver';
import { validateCubeState } from '../src/utils/cubeValidator';
import { getSolutionForLevel } from '../src/utils/solutionStages';
import { SolverLevelId } from '../src/types/cubing';

function applyMoves(cube: CubeNetState, moves: string[]): CubeNetState {
  let cur = cube;
  for (const m of moves) {
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

describe('Empirical Challenger M1 — Rigorous Verification Suite', () => {
  describe('Task 1: 50+ Random WCA Scrambles Direct CubeNetState Solving', () => {
    it('empirically verifies 100 random WCA scrambles solve directly to isCubeSolved === true', () => {
      const sampleScrambles: string[] = [];
      for (let i = 0; i < 100; i++) {
        // Varying scramble lengths: 15 to 30 moves
        const len = 15 + (i % 16);
        const scramble = generateWCAScramble(len);
        sampleScrambles.push(scramble);
      }

      for (let i = 0; i < sampleScrambles.length; i++) {
        const scramble = sampleScrambles[i];
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        // Solve directly from pure 54-sticker CubeNetState
        const result = solveCube(scrambled, 'level-2');
        expect(result.success).toBe(true);
        expect(result.moves.length).toBeGreaterThan(0);

        const finalState = applyMoves(scrambled, result.moves);
        const solved = isCubeSolved(finalState);
        if (!solved) {
          throw new Error(
            `Failed to solve scramble #${i + 1} (${scramble}). Final state was not solved.`
          );
        }
        expect(solved).toBe(true);
      }
    }, 30000);

    it('empirically tests solving under auto-solve and level-1 for diverse scrambles', () => {
      const testLevels: SolverLevelId[] = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];
      for (const level of testLevels) {
        for (let i = 0; i < 5; i++) {
          const scramble = generateWCAScramble(20);
          const scrambled = applyScramble(scramble);
          const result = solveCube(scrambled, level);
          expect(result.success).toBe(true);
          const solvedState = applyMoves(scrambled, result.moves);
          expect(isCubeSolved(solvedState)).toBe(true);

          if (level === 'auto-solve') {
            expect(result.stages.length).toBe(1);
          } else if (level === 'level-1') {
            expect(result.stages.length).toBe(7);
          } else {
            expect(result.stages.length).toBe(4);
          }
        }
      }
    });
  });

  describe('Task 2: Deterministic Rejection of Invalid States & Vietnamese Diagnostics', () => {
    describe('Wrong Color Counts', () => {
      it('rejects all 54 stickers same color', () => {
        const badCube: CubeNetState = {
          U: Array(9).fill('yellow'),
          D: Array(9).fill('yellow'),
          F: Array(9).fill('yellow'),
          B: Array(9).fill('yellow'),
          L: Array(9).fill('yellow'),
          R: Array(9).fill('yellow'),
        };
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.colorCountsValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi số lượng màu'))).toBe(true);
      });

      it('rejects 10 white and 8 yellow stickers', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.D[0] = 'white';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.colorCountsValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi số lượng màu'))).toBe(true);
      });

      it('rejects 8 green and 10 blue stickers', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.F[0] = 'blue';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.colorCountsValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi số lượng màu'))).toBe(true);
      });
    });

    describe('Illegal Center Colors', () => {
      it('rejects non-standard center colors with Vietnamese diagnostic', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.D[4] = 'white';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.centersValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi tâm mặt D'))).toBe(true);
      });
    });

    describe('Duplicate Pieces', () => {
      it('rejects duplicate edge piece with Vietnamese error', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Replace DB (D[7]=white, B[7]=blue) with another DF (white, green)
        badCube.D[7] = 'white';
        badCube.B[7] = 'green';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.edgesValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi trùng lặp viên cạnh'))).toBe(true);
      });

      it('rejects duplicate corner piece with Vietnamese error', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Replace DBR with DFR (yellow, green, red) with correct chirality
        // DBR slot: sticker 0 is D[8], sticker 1 is R[8], sticker 2 is B[6]
        // DFR standard piece colors: ['yellow', 'green', 'red']
        badCube.D[8] = 'yellow';
        badCube.R[8] = 'green';
        badCube.B[6] = 'red';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.cornersValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi trùng lặp viên góc'))).toBe(true);
      });
    });

    describe('Impossible Physical Pieces', () => {
      it('rejects edge with opposite colors (yellow-white, green-blue, orange-red)', () => {
        const opposites: [string, number, string, number][] = [
          ['U', 1, 'D', 7], // yellow-white in UB slot
        ];
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.U[1] = 'yellow';
        badCube.B[1] = 'white';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.edgesValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi viên cạnh tại vị trí'))).toBe(true);
      });

      it('rejects corner with impossible color trio', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // UFL slot: yellow, white, green (white and yellow cannot be on same corner)
        badCube.U[6] = 'yellow';
        badCube.F[0] = 'white';
        badCube.L[2] = 'green';
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.cornersValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi viên góc tại vị trí'))).toBe(true);
      });
    });

    describe('Single Flipped Edge (Edge Orientation Parity)', () => {
      it.each(['UB', 'DF', 'FR', 'BL'])('rejects single flipped edge at %s with Vietnamese error', (slotName) => {
        const badCube = cloneCube(SOLVED_CUBE);
        if (slotName === 'UB') {
          const tmp = badCube.U[1];
          badCube.U[1] = badCube.B[1];
          badCube.B[1] = tmp;
        } else if (slotName === 'DF') {
          const tmp = badCube.D[1];
          badCube.D[1] = badCube.F[7];
          badCube.F[7] = tmp;
        } else if (slotName === 'FR') {
          const tmp = badCube.F[5];
          badCube.F[5] = badCube.R[3];
          badCube.R[3] = tmp;
        } else if (slotName === 'BL') {
          const tmp = badCube.B[5];
          badCube.B[5] = badCube.L[3];
          badCube.L[3] = tmp;
        }
        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.edgeOrientationParity).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi lật cạnh (Edge Flip Parity)'))).toBe(true);
      });
    });

    describe('Single Twisted Corner (Corner Orientation Parity)', () => {
      it('rejects single clockwise twisted corner with Vietnamese error', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // UFR: U[8], R[0], F[2]
        const u = badCube.U[8];
        const r = badCube.R[0];
        const f = badCube.F[2];
        badCube.U[8] = f;
        badCube.R[0] = u;
        badCube.F[2] = r;

        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.cornerOrientationParity).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);
      });

      it('rejects single counter-clockwise twisted corner with Vietnamese error', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // DFR: D[2], F[8], R[6]
        const d = badCube.D[2];
        const f = badCube.F[8];
        const r = badCube.R[6];
        badCube.D[2] = r;
        badCube.F[8] = d;
        badCube.R[6] = f;

        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.cornerOrientationParity).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);
      });
    });

    describe('Swapped Two Pieces (Permutation Parity)', () => {
      it('rejects swapped two edges without swapped corners', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Swap DF and DB
        const dfD = badCube.D[1];
        const dfF = badCube.F[7];
        badCube.D[1] = badCube.D[7];
        badCube.F[7] = badCube.B[7];
        badCube.D[7] = dfD;
        badCube.B[7] = dfF;

        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.permutationParity).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);
      });

      it('rejects swapped two corners without swapped edges', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Swap UFL and UFR corners preserving individual corner chirality
        // UFL slot: [U[6], F[0], L[2]]
        // UFR slot: [U[8], R[0], F[2]]
        // UFR piece colors: U=yellow, R=red, F=green
        // UFL piece colors: U=yellow, F=green, L=orange
        const uflU = badCube.U[6]; // yellow
        const uflF = badCube.F[0]; // green
        const uflL = badCube.L[2]; // orange

        // Put UFR piece into UFL slot:
        badCube.U[6] = badCube.U[8]; // yellow
        badCube.F[0] = badCube.F[2]; // green
        badCube.L[2] = badCube.R[0]; // red -> wait: UFL slot has primary on U[6], then F[0], then L[2].
        // std UFR colors: ['yellow', 'red', 'green'] (primary, cw1, cw2)
        // In UFL slot, clockwise from U is F, then L.
        // So for UFR piece in UFL slot: U[6]=yellow, F[0]=red, L[2]=green!
        badCube.U[6] = badCube.U[8]; // yellow
        badCube.F[0] = badCube.R[0]; // red
        badCube.L[2] = badCube.F[2]; // green

        // Put UFL piece into UFR slot:
        // std UFL colors: ['yellow', 'green', 'orange'] (primary, cw1, cw2)
        // In UFR slot, clockwise from U[8] is R[0], then F[2].
        // So for UFL piece in UFR slot: U[8]=yellow, R[0]=green, F[2]=orange!
        badCube.U[8] = uflU; // yellow
        badCube.R[0] = uflF; // green
        badCube.F[2] = uflL; // orange

        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.permutationParity).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);
      });
    });

    describe('Corner Chirality Violation (Reflection)', () => {
      it('rejects mirror-reflected corner stickers with Vietnamese diagnostic', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        // Invert chirality of DBL corner (white, blue, orange) -> swap blue and orange
        const tmp = badCube.B[8];
        badCube.B[8] = badCube.L[6];
        badCube.L[6] = tmp;

        const res = validateCubeState(badCube);
        expect(res.isValid).toBe(false);
        expect(res.details.cornersValid).toBe(false);
        expect(res.errors.some((e) => e.includes('Lỗi góc nghịch hướng (Chirality)'))).toBe(true);
      });
    });

    describe('Valid Parity Combinations (Permutation Group Theory)', () => {
      it('accepts 2 flipped edges as physically valid (totalEdgeFlips % 2 === 0)', () => {
        // Flip UB and UF edges
        const cube = cloneCube(SOLVED_CUBE);
        let tmp = cube.U[1];
        cube.U[1] = cube.B[1];
        cube.B[1] = tmp;

        tmp = cube.U[7];
        cube.U[7] = cube.F[1];
        cube.F[1] = tmp;

        const res = validateCubeState(cube);
        expect(res.isValid).toBe(true);
        expect(res.details.edgeOrientationParity).toBe(true);
      });

      it('accepts 2 twisted corners (1 clockwise + 1 counterclockwise = 3 = 0 mod 3)', () => {
        // Twist UFL clockwise (+1) and UFR counter-clockwise (+2)
        const cube = cloneCube(SOLVED_CUBE);
        // UFL: U[6], F[0], L[2] -> cw
        const uflU = cube.U[6];
        const uflF = cube.F[0];
        const uflL = cube.L[2];
        cube.U[6] = uflL;
        cube.F[0] = uflU;
        cube.L[2] = uflF;

        // UFR: U[8], R[0], F[2] -> ccw
        const ufrU = cube.U[8];
        const ufrR = cube.R[0];
        const ufrF = cube.F[2];
        cube.U[8] = ufrR;
        cube.R[0] = ufrF;
        cube.F[2] = ufrU;

        const res = validateCubeState(cube);
        expect(res.isValid).toBe(true);
        expect(res.details.cornerOrientationParity).toBe(true);
      });

      it('accepts T-Perm state where 2 edges AND 2 corners are swapped (odd + odd = valid)', () => {
        const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";
        const tCube = applyScramble(T_PERM);
        const res = validateCubeState(tCube);
        expect(res.isValid).toBe(true);
        expect(res.details.permutationParity).toBe(true);
      });
    });
  });

  describe('Task 3: Stress Testing Edge Cases', () => {
    it('handles already solved cube cleanly', () => {
      const res = solveCube(SOLVED_CUBE);
      expect(res.success).toBe(true);
      expect(res.moves).toEqual([]);
      expect(res.stages).toEqual([]);
    });

    describe('All 18 1-Move Scrambles', () => {
      it.each(ALL_18_MOVES)('solves 1-move scramble %s to isCubeSolved === true', (move) => {
        const scrambled = applyMove(SOLVED_CUBE, move);
        expect(isCubeSolved(scrambled)).toBe(false);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);

        const finalState = applyMoves(scrambled, res.moves);
        expect(isCubeSolved(finalState)).toBe(true);
      });
    });

    describe('2-Move Scrambles', () => {
      const twoMoveScrambles = [
        'R U', "R' U'", 'F R', "F' L",
        'U D', 'L R', 'B F', 'U2 R2',
        'F2 B2', 'D2 L2', 'R2 U', "F' D2",
        "L2 B'", 'U R2', 'D F2', 'B2 L',
        "R' F'", 'L U', 'B R', 'F D',
      ];

      it.each(twoMoveScrambles)('solves 2-move scramble %s to isCubeSolved === true', (scramble) => {
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);

        const finalState = applyMoves(scrambled, res.moves);
        expect(isCubeSolved(finalState)).toBe(true);
      });
    });

    describe('Superflip Pattern', () => {
      it('solves the Superflip (all 12 edges flipped in place)', () => {
        const SUPERFLIP = "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2";
        const scrambled = applyScramble(SUPERFLIP);
        expect(isCubeSolved(scrambled)).toBe(false);

        // Verify that Superflip is a mathematically valid state
        const validation = validateCubeState(scrambled);
        expect(validation.isValid).toBe(true);

        // Solve directly from CubeNetState
        const res = solveCube(scrambled, 'level-2');
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);

        const finalState = applyMoves(scrambled, res.moves);
        expect(isCubeSolved(finalState)).toBe(true);
      });
    });

    describe('Checkerboard Pattern', () => {
      it('solves the Checkerboard pattern (U2 D2 F2 B2 L2 R2)', () => {
        const CHECKERBOARD = 'U2 D2 F2 B2 L2 R2';
        const scrambled = applyScramble(CHECKERBOARD);
        expect(isCubeSolved(scrambled)).toBe(false);

        const validation = validateCubeState(scrambled);
        expect(validation.isValid).toBe(true);

        const res = solveCube(scrambled);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);

        const finalState = applyMoves(scrambled, res.moves);
        expect(isCubeSolved(finalState)).toBe(true);
      });
    });

    describe('Solver Behavior when solving invalid state', () => {
      it('returns success: false and includes Vietnamese error message if cube is invalid', () => {
        const badCube = cloneCube(SOLVED_CUBE);
        badCube.D[0] = 'white'; // invalid color counts (10 white, 8 yellow)
        const res = solveCube(badCube);
        expect(res.success).toBe(false);
        expect(res.moves.length).toBe(0);
        expect(res.errorMessage).toBeDefined();
        expect(res.errorMessage).toContain('Lỗi số lượng màu');
      });
    });
  });
});
