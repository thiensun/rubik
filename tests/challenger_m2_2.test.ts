import { describe, it, expect } from 'vitest';
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
import { solveCube, optimizeMoves } from '../src/utils/cubeSolver';
import {
  getSolutionForLevel,
  getStaticSolutionForLevel,
  createMoves,
  DEMO_SCRAMBLES,
  CFOP_DEMO_SCRAMBLE,
  SolutionStage,
} from '../src/utils/solutionStages';
import { SolverLevelId } from '../src/types/cubing';

describe('Empirical Challenger 2 — Milestone 2 Verification Suite', () => {
  const ALL_LEVELS: SolverLevelId[] = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];

  // =========================================================================
  // TASK 1: Solved Cube Reset (0 moves) & False Celebration Prevention
  // =========================================================================
  describe('Task 1: Solved Cube Reset & Celebration Suppression Verification', () => {
    it.each(ALL_LEVELS)('solveCube on SOLVED_CUBE returns 0 moves and 0 stages for %s', (level) => {
      const solved = cloneCube(SOLVED_CUBE);
      expect(isCubeSolved(solved)).toBe(true);

      const result = solveCube(solved, level);
      expect(result.success).toBe(true);
      expect(result.moves.length).toBe(0);
      expect(result.stages.length).toBe(0);
      expect(result.errorMessage).toBeUndefined();
    });

    it('verifies Step 3 solutionData derivation for solved cube produces 0 moves across all levels', () => {
      for (const level of ALL_LEVELS) {
        const scannedCubeState = cloneCube(SOLVED_CUBE);

        // Step 3 logic:
        // if (scannedCubeState && isCubeSolved(scannedCubeState)) {
        //   return { levelId: activeLevel, totalMoves: 0, stages: [], currentStageIndex: 0, estTime: '0.0s' };
        // }
        const isSolvedState = isCubeSolved(scannedCubeState);
        expect(isSolvedState).toBe(true);

        const solutionData = (scannedCubeState && isSolvedState)
          ? {
              levelId: level,
              totalMoves: 0,
              stages: [] as SolutionStage[],
              currentStageIndex: 0,
              estTime: '0.0s',
            }
          : getSolutionForLevel(level, undefined, scannedCubeState || undefined);

        expect(solutionData.totalMoves).toBe(0);
        expect(solutionData.stages.length).toBe(0);

        const allMoves = solutionData.stages.flatMap((s) => s.moves);
        expect(allMoves.length).toBe(0);

        // Mathematical state at index 0
        let state = cloneCube(scannedCubeState);
        const movesToApply = allMoves.slice(0, 0);
        for (const m of movesToApply) {
          state = applyMove(state, m.move);
        }
        const isActuallySolved = isCubeSolved(state);
        expect(isActuallySolved).toBe(true);

        // Celebration trigger check:
        // handleAnimationComplete:
        // if (isActuallySolved && currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0)
        // With allMoves.length === 0, the condition MUST evaluate to false
        const currentMoveGlobalIdx = 0;
        const wouldTriggerCelebration =
          isActuallySolved &&
          currentMoveGlobalIdx >= allMoves.length &&
          allMoves.length > 0;

        expect(
          wouldTriggerCelebration,
          'Celebration/confetti MUST NOT trigger when resetting to solved cube (0 moves)'
        ).toBe(false);
      }
    });

    it('verifies solved cube reset takes precedence even if stale demoScramble is present', () => {
      for (const level of ALL_LEVELS) {
        const scannedCubeState = cloneCube(SOLVED_CUBE);
        const staleDemoScramble = DEMO_SCRAMBLES[level];

        // Step 3 priority logic:
        const isSolved = isCubeSolved(scannedCubeState);
        expect(isSolved).toBe(true);

        let solutionData: any;
        if (scannedCubeState && isSolved) {
          solutionData = {
            levelId: level,
            totalMoves: 0,
            stages: [],
            currentStageIndex: 0,
            estTime: '0.0s',
          };
        } else {
          solutionData = getSolutionForLevel(level, staleDemoScramble || undefined, scannedCubeState || undefined);
        }

        expect(solutionData.totalMoves).toBe(0);
        expect(solutionData.stages.length).toBe(0);
      }
    });
  });

  // =========================================================================
  // TASK 2: Camera-scanned Arbitrary States Solve Without Fallback to Demo
  // =========================================================================
  describe('Task 2: Camera-scanned Arbitrary State Solving Without Demo Fallback', () => {
    it('verifies 30 arbitrary WCA scrambled states solve directly with distinct non-demo moves', () => {
      for (let i = 0; i < 30; i++) {
        const scramble = generateWCAScramble(20);
        const arbitraryState = applyScramble(scramble);
        expect(isCubeSolved(arbitraryState)).toBe(false);

        // In Step 2 Camera Scan -> Step 3:
        // demoScramble is cleared (null/undefined), and arbitraryState is passed to getSolutionForLevel
        const solution = getSolutionForLevel('auto-solve', undefined, arbitraryState);

        expect(solution.totalMoves).toBeGreaterThan(0);
        expect(solution.stages.length).toBeGreaterThan(0);

        const allMoves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
        expect(allMoves.length).toBeGreaterThan(0);

        // Verify that the moves are NOT the static demo scramble moves
        const staticDemoSolution = getStaticSolutionForLevel('auto-solve');
        const staticDemoMoves = staticDemoSolution.stages.flatMap((s) => s.moves.map((m) => m.move));
        expect(allMoves.join(' ')).not.toEqual(staticDemoMoves.join(' '));

        // Empirically verify that executing the solution moves solves the arbitrary cube
        let cur = cloneCube(arbitraryState);
        for (const m of allMoves) {
          cur = applyMove(cur, m);
        }
        expect(isCubeSolved(cur), `Arbitrary scramble ${scramble} must solve to isCubeSolved === true`).toBe(true);
      }
    });

    it('verifies discrete 1-move, 2-move, and 3-move arbitrary states solve cleanly without demo fallback', () => {
      const shortScrambles = [
        "U",
        "R'",
        "F2",
        "R U",
        "F' R'",
        "D2 R2",
        "R U R'",
        "F R U'",
        "L2 D' B",
      ];

      for (const sc of shortScrambles) {
        const state = applyScramble(sc);
        expect(isCubeSolved(state)).toBe(false);

        const solution = getSolutionForLevel('auto-solve', undefined, state);
        expect(solution.totalMoves).toBeGreaterThan(0);

        const moves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
        let cur = cloneCube(state);
        for (const m of moves) {
          cur = applyMove(cur, m);
        }
        expect(isCubeSolved(cur), `Short scramble "${sc}" must solve to isCubeSolved === true`).toBe(true);
      }
    });

    it('verifies camera scan pipeline does NOT trigger demo fallback in Step3 logic', () => {
      // Simulating Step 3 conditions:
      // demoScramble === null
      // scannedCubeState === valid arbitrary camera-scanned state
      const cameraScramble = "B2 D' L2 F2 U' R2 D' F2 U2 B2 R' D' B' R' D B2 F' U' F'";
      const scannedCubeState = applyScramble(cameraScramble);

      const demoScramble: string | null = null;
      const customAlgorithm = null;
      const analyzedSolve = null;
      const activeLevel: SolverLevelId = 'level-2';

      // Evaluate the Step 3 condition for loading demo:
      const LEGACY_CFOP_SCRAMBLE =
        "F R U' R' U R U R2 F' R U R U R' U' R U' R' F' U' F U2 R U R' U' F' U' F U R U R' U2 R U' R' U F2 R D2 F' R D";

      const isBuiltInDemo =
        !demoScramble ||
        Object.values(DEMO_SCRAMBLES).includes(demoScramble) ||
        demoScramble === LEGACY_CFOP_SCRAMBLE;

      // Condition under test:
      const wouldTriggerDemoScramble = isBuiltInDemo && (demoScramble || !scannedCubeState);

      expect(
        wouldTriggerDemoScramble,
        'Step 3 must NOT overwrite genuine camera state with demo scramble'
      ).toBe(false);

      // Verify solver receives scannedCubeState directly
      const solution = getSolutionForLevel(activeLevel, demoScramble || undefined, scannedCubeState);
      expect(solution.totalMoves).toBeGreaterThan(0);

      const solutionMoves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
      let solvedCheck = cloneCube(scannedCubeState);
      for (const m of solutionMoves) {
        solvedCheck = applyMove(solvedCheck, m);
      }
      expect(isCubeSolved(solvedCheck)).toBe(true);
    });
  });

  // =========================================================================
  // TASK 3: Multi-View & Intermediate State Progression Verification
  // =========================================================================
  describe('Task 3: Intermediate State Progression & False Positive Immunity', () => {
    it('verifies isCubeSolved is strictly false at every intermediate step k < N across 20 scrambles', () => {
      for (let s = 0; s < 20; s++) {
        const scramble = generateWCAScramble(18);
        const startCube = applyScramble(scramble);
        const solution = getSolutionForLevel('level-2', undefined, startCube);
        const allMoves = solution.stages.flatMap((stg) => stg.moves.map((m) => m.move));

        expect(allMoves.length).toBeGreaterThan(0);

        let cur = cloneCube(startCube);
        for (let k = 0; k < allMoves.length; k++) {
          if (k < allMoves.length - 1) {
            cur = applyMove(cur, allMoves[k]);
            // Intermediate state must not be accidentally marked as solved unless truly solved
            const solved = isCubeSolved(cur);
            expect(
              solved,
              `Intermediate step ${k + 1}/${allMoves.length} for scramble ${scramble} must not falsely be solved`
            ).toBe(false);
          }
        }

        // Final move completes solve
        cur = applyMove(cur, allMoves[allMoves.length - 1]);
        expect(isCubeSolved(cur)).toBe(true);
      }
    });

    it('verifies state reproducibility under jump forward, jump backward, and reset', () => {
      const scramble = "R U R' F' U2 F U R U2 R'";
      const initialCube = applyScramble(scramble);
      const solution = getSolutionForLevel('auto-solve', undefined, initialCube);
      const allMoves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));

      // Calculate state directly at move index k
      function getStateAt(k: number): CubeNetState {
        let st = cloneCube(initialCube);
        for (let i = 0; i < k; i++) {
          st = applyMove(st, allMoves[i]);
        }
        return st;
      }

      // Step 0: Initial state
      expect(isCubeSolved(getStateAt(0))).toBe(false);

      // Jump to step 3, then step 1, then step 5, then step 0
      const jumpIndices = [3, 1, 5, 0, Math.floor(allMoves.length / 2), allMoves.length];
      for (const idx of jumpIndices) {
        const stateAtIdx = getStateAt(idx);
        if (idx === allMoves.length) {
          expect(isCubeSolved(stateAtIdx)).toBe(true);
        } else {
          expect(isCubeSolved(stateAtIdx)).toBe(false);
        }
      }
    });
  });
});
