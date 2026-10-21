import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
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
} from '../src/utils/cubeSolver';
import { getSolutionForLevel, DEMO_SCRAMBLES } from '../src/utils/solutionStages';
import { SolverLevelId } from '../src/types/cubing';

function applyMoves(cube: CubeNetState, moves: string[]): CubeNetState {
  let cur = cube;
  for (const m of moves) {
    cur = applyMove(cur, m);
  }
  return cur;
}

describe('Cube Solver & Stage Decomposition Tests', () => {
  it('solves an already solved cube with 0 moves', () => {
    const res = solveCube(SOLVED_CUBE);
    expect(res.success).toBe(true);
    expect(res.moves.length).toBe(0);
  });

  const ALL_LEVELS: SolverLevelId[] = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];

  describe('Demo Scramble Correctness across all 5 Solver Levels', () => {
    it.each(ALL_LEVELS)('level %s demo scramble solves to isCubeSolved === true', (level) => {
      const demoScramble = DEMO_SCRAMBLES[level];
      expect(demoScramble).toBeDefined();

      const scrambled = applyScramble(demoScramble);
      expect(isCubeSolved(scrambled)).toBe(false);

      const solution = getSolutionForLevel(level, demoScramble);
      expect(solution.stages.length).toBeGreaterThan(0);

      const allMoves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
      expect(allMoves.length).toBeGreaterThan(0);

      const finalState = applyMoves(scrambled, allMoves);
      expect(isCubeSolved(finalState)).toBe(true);
    });
  });

  describe('Direct 54-Sticker CubeNetState Solving for 50+ WCA Scrambles', () => {
    it('solves 50 arbitrary scrambled 54-sticker states directly to isCubeSolved === true', () => {
      for (let i = 0; i < 50; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        // Solve directly from CubeNetState without passing any scramble string
        const result = solveCube(scrambled, 'level-2');
        expect(result.success).toBe(true);
        expect(result.moves.length).toBeGreaterThan(0);

        const solvedState = applyMoves(scrambled, result.moves);
        expect(isCubeSolved(solvedState)).toBe(true);
      }
    });

    it('verifies intermediate stages physically transform cube through Cross -> F2L -> OLL -> PLL', () => {
      for (let i = 0; i < 10; i++) {
        const scramble = generateWCAScramble(20);
        const scrambled = applyScramble(scramble);

        const result = solveCube(scrambled, 'level-2');
        expect(result.stages.length).toBe(4);

        // Stage 1: Cross
        const s1Moves = result.stages[0].moves.map((m) => m.move);
        const state1 = applyMoves(scrambled, s1Moves);
        expect(isCrossSolved(state1)).toBe(true);

        // Stage 2: F2L
        const s2Moves = result.stages[1].moves.map((m) => m.move);
        const state2 = applyMoves(state1, s2Moves);
        expect(isF2LSolved(state2)).toBe(true);

        // Stage 3: OLL
        const s3Moves = result.stages[2].moves.map((m) => m.move);
        const state3 = applyMoves(state2, s3Moves);
        expect(isOLLSolved(state3)).toBe(true);

        // Stage 4: PLL
        const s4Moves = result.stages[3].moves.map((m) => m.move);
        const state4 = applyMoves(state3, s4Moves);
        expect(isCubeSolved(state4)).toBe(true);
      }
    });
  });
});
