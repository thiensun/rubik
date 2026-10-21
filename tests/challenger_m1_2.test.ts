import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  generateWCAScramble,
  isCubeSolved,
  CubeNetState,
} from '../src/utils/cubeState';
import {
  solveCube,
  isCrossSolved,
  isF2LSolved,
  isOLLSolved,
  optimizeMoves,
} from '../src/utils/cubeSolver';
import {
  getSolutionForLevel,
  getStaticSolutionForLevel,
  DEMO_SCRAMBLES,
} from '../src/utils/solutionStages';
import { validateCubeState } from '../src/utils/cubeValidator';
import { SolverLevelId } from '../src/types/cubing';

function applyMoves(cube: CubeNetState, moves: string[]): CubeNetState {
  let cur = cube;
  for (const m of moves) {
    if (!m) continue;
    cur = applyMove(cur, m);
  }
  return cur;
}

describe('Challenger 2 Empirical Verification: Milestone 1', () => {
  const ALL_LEVELS: SolverLevelId[] = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];

  // =========================================================================
  // TASK 2: Verify all 5 built-in demo levels still solve to isCubeSolved === true
  // =========================================================================
  describe('Task 2: Built-in Demo Levels Full Solve Verification', () => {
    it.each(ALL_LEVELS)('demo level %s solves to isCubeSolved === true', (level) => {
      const demoScramble = DEMO_SCRAMBLES[level];
      expect(demoScramble, `Demo scramble for ${level} must exist`).toBeDefined();
      expect(demoScramble.length).toBeGreaterThan(0);

      // Scramble from solved cube
      const scrambledState = applyScramble(demoScramble);
      expect(isCubeSolved(scrambledState)).toBe(false);

      // Verify the scrambled demo state is mathematically valid
      const validation = validateCubeState(scrambledState);
      expect(validation.isValid, `Demo scramble for ${level} must be valid`).toBe(true);

      // Retrieve solution for level using demo scramble
      const solution = getSolutionForLevel(level, demoScramble);
      expect(solution.stages.length).toBeGreaterThan(0);

      const allMoves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
      expect(allMoves.length).toBeGreaterThan(0);

      // Apply solution moves to scrambled cube
      const finalState = applyMoves(scrambledState, allMoves);
      expect(isCubeSolved(finalState), `Cube for ${level} must be 100% solved`).toBe(true);
    });

    it('verifies static solution helper getStaticSolutionForLevel directly for all 5 levels', () => {
      for (const level of ALL_LEVELS) {
        const staticSol = getStaticSolutionForLevel(level);
        expect(staticSol.stages.length).toBeGreaterThan(0);
        const moves = staticSol.stages.flatMap((s) => s.moves.map((m) => m.move));
        const scramble = DEMO_SCRAMBLES[level];
        const state = applyScramble(scramble);
        const solvedState = applyMoves(state, moves);
        expect(isCubeSolved(solvedState), `Static solution for ${level} must solve its demo scramble`).toBe(true);
      }
    });

    it('verifies getSolutionForLevel with cubeState passed in for all 5 demo levels', () => {
      for (const level of ALL_LEVELS) {
        const scramble = DEMO_SCRAMBLES[level];
        const state = applyScramble(scramble);
        const solution = getSolutionForLevel(level, undefined, state);
        expect(solution.stages.length).toBeGreaterThan(0);
        const moves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
        const solvedState = applyMoves(state, moves);
        expect(isCubeSolved(solvedState), `Dynamic solving of demo state for ${level} must solve to isCubeSolved === true`).toBe(true);
      }
    });
  });

  // =========================================================================
  // TASK 1: Verify solver stage progression
  // Confirm intermediate stages physically solve White Cross, F2L, OLL, PLL
  // =========================================================================
  describe('Task 1: Intermediate Solver Stage Progression Verification', () => {
    it('verifies CFOP demo level-2 intermediate stage progression physically solves each layer', () => {
      const demoScramble = DEMO_SCRAMBLES['level-2'];
      const scrambled = applyScramble(demoScramble);
      const solution = getSolutionForLevel('level-2', demoScramble);
      expect(solution.stages.length).toBe(4);

      // Stage 1: White Cross
      const s1Moves = solution.stages[0].moves.map((m) => m.move);
      const state1 = applyMoves(scrambled, s1Moves);
      expect(isCrossSolved(state1), 'Stage 1 must physically solve White Cross on D').toBe(true);

      // Stage 2: F2L
      const s2Moves = solution.stages[1].moves.map((m) => m.move);
      const state2 = applyMoves(state1, s2Moves);
      expect(isCrossSolved(state2), 'Stage 2 must preserve White Cross').toBe(true);
      expect(isF2LSolved(state2), 'Stage 2 must physically solve First Two Layers (F2L)').toBe(true);

      // Stage 3: OLL
      const s3Moves = solution.stages[2].moves.map((m) => m.move);
      const state3 = applyMoves(state2, s3Moves);
      expect(isF2LSolved(state3), 'Stage 3 must preserve F2L').toBe(true);
      expect(isOLLSolved(state3), 'Stage 3 must physically solve Yellow Face (OLL)').toBe(true);

      // Stage 4: PLL
      const s4Moves = solution.stages[3].moves.map((m) => m.move);
      const state4 = applyMoves(state3, s4Moves);
      expect(isCubeSolved(state4), 'Stage 4 must physically complete the cube (PLL)').toBe(true);
    });

    it('verifies CFOP demo level-3 intermediate stage progression physically solves each layer', () => {
      const demoScramble = DEMO_SCRAMBLES['level-3'];
      const scrambled = applyScramble(demoScramble);
      const solution = getSolutionForLevel('level-3', demoScramble);
      expect(solution.stages.length).toBe(4);

      // Stage 1: Cross
      const s1Moves = solution.stages[0].moves.map((m) => m.move);
      const state1 = applyMoves(scrambled, s1Moves);
      expect(isCrossSolved(state1), 'Stage 1 must physically solve White Cross on D').toBe(true);

      // Stage 2: F2L
      const s2Moves = solution.stages[1].moves.map((m) => m.move);
      const state2 = applyMoves(state1, s2Moves);
      expect(isF2LSolved(state2), 'Stage 2 must physically solve F2L').toBe(true);

      // Stage 3: OLL
      const s3Moves = solution.stages[2].moves.map((m) => m.move);
      const state3 = applyMoves(state2, s3Moves);
      expect(isOLLSolved(state3), 'Stage 3 must physically solve OLL').toBe(true);

      // Stage 4: PLL
      const s4Moves = solution.stages[3].moves.map((m) => m.move);
      const state4 = applyMoves(state3, s4Moves);
      expect(isCubeSolved(state4), 'Stage 4 must physically solve PLL to solved state').toBe(true);
    });

    it('verifies ZBLL demo level-4 intermediate stage progression physically solves VHLS then ZBLL', () => {
      const demoScramble = DEMO_SCRAMBLES['level-4'];
      const scrambled = applyScramble(demoScramble);
      const solution = getSolutionForLevel('level-4', demoScramble);
      expect(solution.stages.length).toBe(2);

      // Stage 1: Cross & F2L + EO
      const s1Moves = solution.stages[0].moves.map((m) => m.move);
      const state1 = applyMoves(scrambled, s1Moves);
      expect(isCrossSolved(state1), 'Stage 1 must physically solve White Cross').toBe(true);
      expect(isF2LSolved(state1), 'Stage 1 must physically solve F2L').toBe(true);
      expect(
        state1.U[1] === 'white' && state1.U[3] === 'white' && state1.U[5] === 'white' && state1.U[7] === 'white',
        'Stage 1 (VHLS) must orient white edges on U'
      ).toBe(true);

      // Stage 2: ZBLL 1-look
      const s2Moves = solution.stages[1].moves.map((m) => m.move);
      const state2 = applyMoves(state1, s2Moves);
      expect(isCubeSolved(state2), 'Stage 2 (ZBLL) must complete the solve').toBe(true);
    });

    it('verifies LBL demo level-1 intermediate stage progression physically solves each stage in sequence', () => {
      const demoScramble = DEMO_SCRAMBLES['level-1'];
      const scrambled = applyScramble(demoScramble);
      const solution = getSolutionForLevel('level-1', demoScramble);
      expect(solution.stages.length).toBe(7);

      let cur = scrambled;
      for (let i = 0; i < solution.stages.length; i++) {
        const moves = solution.stages[i].moves.map((m) => m.move);
        cur = applyMoves(cur, moves);
        if (i === 0) {
          expect(isCrossSolved(cur), 'LBL Stage 1 must solve White Cross').toBe(true);
        } else if (i === 1) {
          // First layer complete (Yellow face solved + side bottom row matches centers)
          expect(isCrossSolved(cur), 'LBL Stage 2 must preserve Yellow Cross').toBe(true);
          expect(cur.D.every((c) => c === 'yellow'), 'LBL Stage 2 must complete Yellow face').toBe(true);
          expect(cur.F[6] === 'green' && cur.F[7] === 'green' && cur.F[8] === 'green').toBe(true);
        } else if (i === 2) {
          expect(isF2LSolved(cur), 'LBL Stage 3 must solve F2L').toBe(true);
        } else if (i === 3) {
          expect(isF2LSolved(cur), 'LBL Stage 4 must preserve F2L').toBe(true);
          expect(
            cur.U[1] === 'white' && cur.U[3] === 'white' && cur.U[5] === 'white' && cur.U[7] === 'white',
            'LBL Stage 4 must solve White Cross'
          ).toBe(true);
        } else if (i === 4) {
          expect(isF2LSolved(cur), 'LBL Stage 5 must preserve F2L').toBe(true);
          expect(isOLLSolved(cur), 'LBL Stage 5 must solve OLL').toBe(true);
        } else if (i === 5) {
          expect(isOLLSolved(cur), 'LBL Stage 6 must preserve OLL').toBe(true);
          expect(cur.F[0] === 'green' && cur.F[2] === 'green', 'LBL Stage 6 must permute corners').toBe(true);
        } else if (i === 6) {
          expect(isCubeSolved(cur), 'LBL Stage 7 must solve Cube').toBe(true);
        }
      }
    });

    it('verifies real solveCube intermediate stage progression on 30 arbitrary WCA scrambles', () => {
      for (let i = 0; i < 30; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);

        const solveRes = solveCube(scrambled, 'level-2');
        expect(solveRes.success, 'solveCube must succeed').toBe(true);
        expect(solveRes.stages.length).toBe(4);

        // Stage 1: Cross
        const s1Moves = solveRes.stages[0].moves.map((m) => m.move);
        const state1 = applyMoves(scrambled, s1Moves);
        expect(isCrossSolved(state1), `Scramble ${i}: Stage 1 must solve White Cross`).toBe(true);

        // Stage 2: F2L
        const s2Moves = solveRes.stages[1].moves.map((m) => m.move);
        const state2 = applyMoves(state1, s2Moves);
        expect(isCrossSolved(state2), `Scramble ${i}: Stage 2 must preserve White Cross`).toBe(true);
        expect(isF2LSolved(state2), `Scramble ${i}: Stage 2 must solve F2L`).toBe(true);

        // Stage 3: OLL
        const s3Moves = solveRes.stages[2].moves.map((m) => m.move);
        const state3 = applyMoves(state2, s3Moves);
        expect(isF2LSolved(state3), `Scramble ${i}: Stage 3 must preserve F2L`).toBe(true);
        expect(isOLLSolved(state3), `Scramble ${i}: Stage 3 must solve OLL`).toBe(true);

        // Stage 4: PLL
        const s4Moves = solveRes.stages[3].moves.map((m) => m.move);
        const state4 = applyMoves(state3, s4Moves);
        expect(isCubeSolved(state4), `Scramble ${i}: Stage 4 must solve the entire cube`).toBe(true);
      }
    });

    it('verifies solveCube for level-1 partitions moves into 7 stages reaching solved state', () => {
      for (let i = 0; i < 10; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);

        const solveRes = solveCube(scrambled, 'level-1');
        expect(solveRes.success).toBe(true);
        expect(solveRes.stages.length).toBe(7);

        // Stage 1: Cross
        const s1Moves = solveRes.stages[0].moves.map((m) => m.move);
        const state1 = applyMoves(scrambled, s1Moves);
        expect(isCrossSolved(state1)).toBe(true);

        // Stage 3 (cumulative Cross + F2L): F2L solved
        const s2Moves = solveRes.stages[1].moves.map((m) => m.move);
        const s3Moves = solveRes.stages[2].moves.map((m) => m.move);
        const state3 = applyMoves(state1, [...s2Moves, ...s3Moves]);
        expect(isF2LSolved(state3)).toBe(true);

        // Stage 5 (cumulative Cross + F2L + OLL): OLL solved
        const s4Moves = solveRes.stages[3].moves.map((m) => m.move);
        const s5Moves = solveRes.stages[4].moves.map((m) => m.move);
        const state5 = applyMoves(state3, [...s4Moves, ...s5Moves]);
        expect(isOLLSolved(state5)).toBe(true);

        // Stage 7 (cumulative Cross + F2L + OLL + PLL): Cube solved
        const s6Moves = solveRes.stages[5].moves.map((m) => m.move);
        const s7Moves = solveRes.stages[6].moves.map((m) => m.move);
        const state7 = applyMoves(state5, [...s6Moves, ...s7Moves]);
        expect(isCubeSolved(state7)).toBe(true);
      }
    });

    it('verifies solveCube for level-1 discrete stage-by-stage progression on 20 arbitrary WCA scrambles', () => {
      for (let i = 0; i < 20; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);
        const solveRes = solveCube(scrambled, 'level-1');
        expect(solveRes.success).toBe(true);
        expect(solveRes.stages.length).toBe(7);

        let cur = scrambled;
        for (let s = 0; s < 7; s++) {
          const moves = solveRes.stages[s].moves.map((m) => m.move);
          cur = applyMoves(cur, moves);
          if (s === 0) {
            expect(isCrossSolved(cur), `Scramble ${i} Stage 1: Yellow Cross`).toBe(true);
          } else if (s === 1) {
            expect(isCrossSolved(cur), `Scramble ${i} Stage 2: Cross preserved`).toBe(true);
            expect(cur.D.every((c) => c === 'yellow'), `Scramble ${i} Stage 2: Yellow face`).toBe(true);
          } else if (s === 2) {
            expect(isF2LSolved(cur), `Scramble ${i} Stage 3: F2L`).toBe(true);
          } else if (s === 3) {
            expect(isF2LSolved(cur), `Scramble ${i} Stage 4: F2L preserved`).toBe(true);
            expect(
              cur.U[1] === 'white' && cur.U[3] === 'white' && cur.U[5] === 'white' && cur.U[7] === 'white',
              `Scramble ${i} Stage 4: White Cross`
            ).toBe(true);
          } else if (s === 4) {
            expect(isF2LSolved(cur), `Scramble ${i} Stage 5: F2L preserved`).toBe(true);
            expect(isOLLSolved(cur), `Scramble ${i} Stage 5: OLL`).toBe(true);
          } else if (s === 5) {
            expect(isOLLSolved(cur), `Scramble ${i} Stage 6: OLL preserved`).toBe(true);
            expect(cur.F[0] === 'green' && cur.F[2] === 'green', `Scramble ${i} Stage 6: Corners permuted`).toBe(true);
          } else if (s === 6) {
            expect(isCubeSolved(cur), `Scramble ${i} Stage 7: Cube solved`).toBe(true);
          }
        }
      }
    });
  });

  // =========================================================================
  // TASK 3: Check Step2CameraScan live validation banner behavior
  // =========================================================================
  describe('Task 3: Step2CameraScan Validation Banner Logic & State Transitions', () => {
    it('confirms valid cube state produces isValid === true and empty errors', () => {
      const validCube = SOLVED_CUBE;
      const res = validateCubeState(validCube);
      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
      // In Step2CameraScan:
      // validationResult.isValid === true renders green banner "Khối Rubik Hợp Lệ 100%"
      // Button disabled === false
    });

    it('confirms invalid sticker count triggers warning banner and disables action', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.D[0] = 'white'; // 10 white, 8 yellow
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain('Lỗi số lượng màu');
    });

    it('confirms wrong center color triggers warning banner with specific face error', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.F[4] = 'blue'; // F center is blue instead of green
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi tâm mặt F'))).toBe(true);
    });

    it('confirms single flipped edge triggers Edge Flip Parity warning', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      // Flip UB edge: U[1] <-> B[1]
      const tmp = badCube.U[1];
      badCube.U[1] = badCube.B[1];
      badCube.B[1] = tmp;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.edgeOrientationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi lật cạnh (Edge Flip Parity)'))).toBe(true);
    });

    it('confirms single twisted corner triggers Corner Twist Parity warning', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      // Twist UFL corner (U[6], F[0], L[2])
      const u = badCube.U[6];
      badCube.U[6] = badCube.L[2];
      badCube.L[2] = badCube.F[0];
      badCube.F[0] = u;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.cornerOrientationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);
    });

    it('confirms swapped two edges triggers Permutation Parity warning', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      // Swap UB (U[1], B[1]) and UL (U[3], L[1])
      const u1 = badCube.U[1];
      const b1 = badCube.B[1];
      badCube.U[1] = badCube.U[3];
      badCube.B[1] = badCube.L[1];
      badCube.U[3] = u1;
      badCube.L[1] = b1;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.permutationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);
    });

    it('confirms inverted corner chirality triggers reflection warning', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      const tmp = badCube.F[0];
      badCube.F[0] = badCube.L[2];
      badCube.L[2] = tmp;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.cornersValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi góc nghịch hướng (Chirality)'))).toBe(true);
    });
  });

  // =========================================================================
  // Stress Testing & Edge Cases
  // =========================================================================
  describe('Adversarial Stress Testing: Solver Robustness', () => {
    it('solves 70 consecutive arbitrary 20-move WCA scrambles with zero failures', () => {
      for (let i = 0; i < 70; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);
        const res = solveCube(scrambled, 'level-2');
        expect(res.success, `Scramble #${i} failed: ${res.errorMessage}`).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);

        const endState = applyMoves(scrambled, res.moves);
        expect(isCubeSolved(endState), `Scramble #${i} did not reach solved state`).toBe(true);
      }
    });

    it('optimizes move strings correctly without leaving redundant moves', () => {
      expect(optimizeMoves(["R", "R'"])).toEqual([]);
      expect(optimizeMoves(["R", "R"])).toEqual(["R2"]);
      expect(optimizeMoves(["R", "R2"])).toEqual(["R'"]);
      expect(optimizeMoves(["R2", "R2"])).toEqual([]);
      expect(optimizeMoves(["U", "D", "U'"])).toEqual(["U", "D", "U'"]); // D in between does not merge U
    });

    it('handles already solved cube cleanly across all levels', () => {
      for (const level of ALL_LEVELS) {
        const res = solveCube(SOLVED_CUBE, level);
        expect(res.success).toBe(true);
        expect(res.moves.length).toBe(0);
      }
    });

    it('gracefully rejects invalid cube state passed to solveCube', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.D[0] = 'white';
      const res = solveCube(badCube, 'level-2');
      expect(res.success).toBe(false);
      expect(res.errorMessage).toBeDefined();
      expect(res.errorMessage).toContain('Lỗi số lượng màu');
      expect(res.moves.length).toBe(0);
    });
  });
});
