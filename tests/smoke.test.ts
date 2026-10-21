import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  isCubeSolved,
  applyMove,
  applyScramble,
  invertMove,
  invertMoves,
  generateWCAScramble,
} from '../src/utils/cubeState';

describe('Cube Mechanics Smoke Test', () => {
  it('identifies SOLVED_CUBE as solved', () => {
    expect(isCubeSolved(SOLVED_CUBE)).toBe(true);
  });

  it('determines that a single move leaves the cube unsolved', () => {
    const moved = applyMove(SOLVED_CUBE, 'R');
    expect(isCubeSolved(moved)).toBe(false);
  });

  it('restores solved state after 4 identical clockwise moves', () => {
    let state = SOLVED_CUBE;
    for (let i = 0; i < 4; i++) {
      state = applyMove(state, 'U');
    }
    expect(isCubeSolved(state)).toBe(true);
  });

  it('restores solved state after move and its inverse', () => {
    const move = 'F';
    const inv = invertMove(move);
    let state = applyMove(SOLVED_CUBE, move);
    expect(isCubeSolved(state)).toBe(false);
    state = applyMove(state, inv);
    expect(isCubeSolved(state)).toBe(true);
  });

  it('restores solved state by inverting a multi-move scramble', () => {
    const scramble = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const scrambledState = applyScramble(scramble);
    expect(isCubeSolved(scrambledState)).toBe(false);

    const solution = invertMoves(scramble);
    let state = scrambledState;
    for (const m of solution.split(' ')) {
      state = applyMove(state, m);
    }
    expect(isCubeSolved(state)).toBe(true);
  });

  it('generates a valid WCA scramble of expected length', () => {
    const scramble = generateWCAScramble(20);
    const tokens = scramble.trim().split(/\s+/);
    expect(tokens.length).toBe(20);

    const scrambledState = applyScramble(scramble);
    expect(isCubeSolved(scrambledState)).toBe(false);
  });
});
