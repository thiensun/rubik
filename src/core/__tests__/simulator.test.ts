import { describe, it, expect } from 'vitest';
import {
  createSolvedParametricCube,
  applyParametricAlg,
  invertAlg,
  getPreExecutionParametricState,
  isWideOrSliceMove,
} from '../simulator';

describe('Parametric Multi-Cube Simulator (2x2x2 & 4x4x4)', () => {
  it('creates exact 24-sticker 2x2x2 and 96-sticker 4x4x4 solved states', () => {
    const solved2 = createSolvedParametricCube(2);
    const solved4 = createSolvedParametricCube(4);

    expect(solved2.U).toHaveLength(4);
    expect(solved2.D).toHaveLength(4);
    expect(Object.values(solved2).flat()).toHaveLength(24);

    expect(solved4.U).toHaveLength(16);
    expect(solved4.D).toHaveLength(16);
    expect(Object.values(solved4).flat()).toHaveLength(96);
  });

  it('correctly inverts algorithms and restores 2x2x2 and 4x4x4 to solved state', () => {
    const alg2x2 = "(R U R' U') (R' F) R2 (U' R' U') (R U R' F')";
    const pre2 = getPreExecutionParametricState(alg2x2, 2);
    const after2 = applyParametricAlg(pre2, alg2x2, 2);
    expect(after2).toEqual(createSolvedParametricCube(2));

    // 4x4x4 L2C wide move commutator
    const alg4x4L2C = "Rw U Rw' U Rw U2 Rw'";
    const pre4L2C = getPreExecutionParametricState(alg4x4L2C, 4);
    const after4L2C = applyParametricAlg(pre4L2C, alg4x4L2C, 4);
    expect(after4L2C).toEqual(createSolvedParametricCube(4));

    // 4x4x4 PLL Parity inner slice algorithm
    const alg4x4PllParity = '2R2 U2 2R2 Uw2 2R2 Uw2';
    const pre4Pll = getPreExecutionParametricState(alg4x4PllParity, 4);
    expect(pre4Pll).not.toEqual(createSolvedParametricCube(4));
    const after4Pll = applyParametricAlg(pre4Pll, alg4x4PllParity, 4);
    expect(after4Pll).toEqual(createSolvedParametricCube(4));

    // 4x4x4 Lucas OLL Parity with cube rotation x and wide moves
    const alg4x4Lucas = "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'";
    const invLucas = invertAlg(alg4x4Lucas);
    const pre4Oll = applyParametricAlg(createSolvedParametricCube(4), invLucas, 4);
    const after4Oll = applyParametricAlg(pre4Oll, alg4x4Lucas, 4);
    expect(after4Oll).toEqual(createSolvedParametricCube(4));
  });

  it('identifies wide and inner slice moves accurately', () => {
    expect(isWideOrSliceMove('Rw')).toBe(true);
    expect(isWideOrSliceMove("Uw'")).toBe(true);
    expect(isWideOrSliceMove('2R2')).toBe(true);
    expect(isWideOrSliceMove("2L'")).toBe(true);
    expect(isWideOrSliceMove('M2')).toBe(true);
    expect(isWideOrSliceMove('R')).toBe(false);
    expect(isWideOrSliceMove("U'")).toBe(false);
    expect(isWideOrSliceMove('F2')).toBe(false);
  });
});
