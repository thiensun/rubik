import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  SCRAMBLE_SOLVED_CUBE,
  rotateWhiteToBottom,
  rotateWhiteToTop,
  applyScramble,
  applyScrambleForNet,
  generateWCAScramble,
  isCubeSolved,
  applyMove,
} from '../src/utils/cubeState';
import { validateCubeState } from '../src/utils/cubeValidator';
import { solveCube, isCrossSolved } from '../src/utils/cubeSolver';

describe('WCA Scramble (White-Top) to 3D White Cross Solver Integration Tests', () => {
  it('validates both SOLVED_CUBE (solving orientation) and SCRAMBLE_SOLVED_CUBE (scramble orientation)', () => {
    const valSolving = validateCubeState(SOLVED_CUBE);
    expect(valSolving.isValid).toBe(true);
    expect(valSolving.errors).toHaveLength(0);

    const valScramble = validateCubeState(SCRAMBLE_SOLVED_CUBE);
    expect(valScramble.isValid).toBe(true);
    expect(valScramble.errors).toHaveLength(0);
  });

  it('verifies rotateWhiteToBottom correctly swaps U and D while keeping F and B centers in place', () => {
    const rotated = rotateWhiteToBottom(SCRAMBLE_SOLVED_CUBE);
    expect(rotated.D[4]).toBe('white');
    expect(rotated.U[4]).toBe('yellow');
    expect(rotated.F[4]).toBe('green');
    expect(rotated.B[4]).toBe('blue');
    expect(rotated.R[4]).toBe('red');
    expect(rotated.L[4]).toBe('orange');
  });

  it('verifies csTimer scramble on SCRAMBLE_SOLVED_CUBE produces correct White-top 2D Net and solves via rotateWhiteToBottom', () => {
    const cstimerScramble = "B' R2 B2 U2 F2 D2 F2 R2 U' B2 F2 L2 D' L' U' L' R B' L' U' F'";
    const netCube = applyScrambleForNet(cstimerScramble);

    // Verify centers match WCA Scramble convention: White on top, Green in front
    expect(netCube.U[4]).toBe('white');
    expect(netCube.D[4]).toBe('yellow');
    expect(netCube.F[4]).toBe('green');
    expect(netCube.B[4]).toBe('blue');
    expect(netCube.R[4]).toBe('red');
    expect(netCube.L[4]).toBe('orange');

    // Validates directly as valid scramble
    const val = validateCubeState(netCube);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);

    // Solves directly via solveCube
    const solveRes = solveCube(netCube, 'level-2');
    expect(solveRes.success).toBe(true);
    expect(solveRes.moves.length).toBeGreaterThan(0);

    // Transitions to 3D: rotateWhiteToBottom brings White to bottom (D)
    const solvingCube = rotateWhiteToBottom(netCube);
    expect(solvingCube.D[4]).toBe('white');
    expect(solvingCube.U[4]).toBe('yellow');

    // Applying solution moves on solvingCube solves the White Cross on D first, then whole cube
    let state = solvingCube;
    for (const m of solveRes.stages[0].moves) {
      state = applyMove(state, m.move);
    }
    expect(isCrossSolved(state)).toBe(true);

    for (let i = 1; i < solveRes.stages.length; i++) {
      for (const m of solveRes.stages[i].moves) {
        state = applyMove(state, m.move);
      }
    }
    expect(isCubeSolved(state)).toBe(true);
  });

  it('empirically verifies 25 random WCA scrambles with White-top orientation solve 100% in 3D with White Cross on D', () => {
    for (let i = 0; i < 25; i++) {
      const sc = generateWCAScramble(20);
      const scrambledWhiteTop = applyScrambleForNet(sc);

      // Verify Scramble orientation
      expect(scrambledWhiteTop.U[4]).toBe('white');
      expect(scrambledWhiteTop.D[4]).toBe('yellow');

      // Validate
      const val = validateCubeState(scrambledWhiteTop);
      expect(val.isValid).toBe(true);

      // Solve
      const result = solveCube(scrambledWhiteTop, 'level-2');
      expect(result.success).toBe(true);

      // 3D transition
      const solvingCube = rotateWhiteToBottom(scrambledWhiteTop);
      let cur = solvingCube;

      // Stage 1: White Cross on bottom D
      for (const m of result.stages[0].moves) {
        cur = applyMove(cur, m.move);
      }
      expect(isCrossSolved(cur)).toBe(true);

      // Remaining stages
      for (let s = 1; s < result.stages.length; s++) {
        for (const m of result.stages[s].moves) {
          cur = applyMove(cur, m.move);
        }
      }
      expect(isCubeSolved(cur)).toBe(true);
    }
  });
});
