import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  generateWCAScramble,
  CubeNetState,
} from '../src/utils/cubeState';
import { validateCubeState } from '../src/utils/cubeValidator';

describe('Cube State Validator & Parity Tests', () => {
  it('validates SOLVED_CUBE as 100% valid with 0 errors', () => {
    const res = validateCubeState(SOLVED_CUBE);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.details.colorCountsValid).toBe(true);
    expect(res.details.centersValid).toBe(true);
    expect(res.details.edgesValid).toBe(true);
    expect(res.details.cornersValid).toBe(true);
    expect(res.details.edgeOrientationParity).toBe(true);
    expect(res.details.cornerOrientationParity).toBe(true);
    expect(res.details.permutationParity).toBe(true);
  });

  it('validates 60 randomly generated WCA scrambles as 100% valid', () => {
    for (let i = 0; i < 60; i++) {
      const scramble = generateWCAScramble(22);
      const cube = applyScramble(scramble);
      const res = validateCubeState(cube);
      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.details.edgeOrientationParity).toBe(true);
      expect(res.details.cornerOrientationParity).toBe(true);
      expect(res.details.permutationParity).toBe(true);
    }
  });

  describe('Rejection of physically invalid cube states', () => {
    it('rejects wrong color counts with Vietnamese diagnostic message', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.U[0] = 'yellow'; // Now 10 yellow, 8 white
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.colorCountsValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi số lượng màu'))).toBe(true);
    });

    it('rejects illegal center colors with Vietnamese diagnostic message', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.U[4] = 'green';
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.centersValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi tâm'))).toBe(true);
    });

    it('rejects invalid edge containing opposite colors (yellow-white)', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      badCube.U[1] = 'yellow';
      badCube.B[1] = 'white'; // Yellow-White edge (impossible)
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.edgesValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi viên cạnh'))).toBe(true);
    });

    it('rejects duplicate edges with Vietnamese diagnostic message', () => {
      const badCube = cloneCube(SOLVED_CUBE);
      // Copy UF edge (yellow-green) to UB slot (overwriting yellow-blue)
      badCube.U[1] = 'yellow';
      badCube.B[1] = 'green';
      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.edgesValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi trùng lặp viên cạnh'))).toBe(true);
    });

    it('rejects single flipped edge (Edge Orientation Parity violation)', () => {
      // Flip single edge: UB (U[1] and B[1])
      const badCube = cloneCube(SOLVED_CUBE);
      const tmp = badCube.U[1];
      badCube.U[1] = badCube.B[1];
      badCube.B[1] = tmp;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.edgeOrientationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi lật cạnh (Edge Flip Parity)'))).toBe(true);
    });

    it('rejects single twisted corner (Corner Orientation Parity violation)', () => {
      // Twist UFL corner (U[6], F[0], L[2]) by 1 step clockwise
      const badCube = cloneCube(SOLVED_CUBE);
      const u = badCube.U[6]; // yellow
      const f = badCube.F[0]; // green
      const l = badCube.L[2]; // orange

      badCube.U[6] = l; // orange on U
      badCube.F[0] = u; // yellow on F
      badCube.L[2] = f; // green on L

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.cornerOrientationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi xoay góc (Corner Twist Parity)'))).toBe(true);
    });

    it('rejects swapped two edges (Permutation Parity violation)', () => {
      // Swap UB (U[1], B[1]) and UL (U[3], L[1]) edges without touching corners
      const badCube = cloneCube(SOLVED_CUBE);
      const ubU = badCube.U[1];
      const ubB = badCube.B[1];

      badCube.U[1] = badCube.U[3];
      badCube.B[1] = badCube.L[1];

      badCube.U[3] = ubU;
      badCube.L[1] = ubB;

      const res = validateCubeState(badCube);
      expect(res.isValid).toBe(false);
      expect(res.details.permutationParity).toBe(false);
      expect(res.errors.some((e) => e.includes('Lỗi hoán vị (Permutation Parity)'))).toBe(true);
    });

    it('rejects corner with inverted chirality (reflection)', () => {
      // UFL is standard yellow -> green -> orange. Swap green and orange on the corner!
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
});
