import { describe, it, expect } from 'vitest';
import {
  SOLVED_CUBE,
  CubeNetState,
  FaceKey,
  CubeColor,
  isCubeSolved,
  applyMove,
  applyScramble,
  invertMove,
  invertMoves,
  generateWCAScramble,
} from '../src/utils/cubeState';

const ALL_FACES: FaceKey[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const ALL_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

function countColors(cube: CubeNetState): Record<CubeColor, number> {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };
  for (const face of ALL_FACES) {
    for (const color of cube[face]) {
      counts[color] = (counts[color] || 0) + 1;
    }
  }
  return counts;
}

describe('Cube Mechanics Stress Test', () => {
  describe('Periodicity & Face Rotations for all 6 faces', () => {
    it.each(ALL_FACES)('4 clockwise turns on face %s restores solved cube', (face) => {
      let state = SOLVED_CUBE;
      for (let i = 0; i < 4; i++) {
        state = applyMove(state, face);
      }
      expect(isCubeSolved(state)).toBe(true);
    });

    it.each(ALL_FACES)('4 counterclockwise turns on face %s restores solved cube', (face) => {
      let state = SOLVED_CUBE;
      for (let i = 0; i < 4; i++) {
        state = applyMove(state, `${face}'`);
      }
      expect(isCubeSolved(state)).toBe(true);
    });

    it.each(ALL_FACES)('2 half turns on face %s restores solved cube', (face) => {
      let state = SOLVED_CUBE;
      state = applyMove(state, `${face}2`);
      state = applyMove(state, `${face}2`);
      expect(isCubeSolved(state)).toBe(true);
    });
  });

  describe('Move & Inverse Symmetry for all 18 moves', () => {
    it.each(ALL_MOVES)('move %s followed by its inverse restores solved cube', (move) => {
      const inv = invertMove(move);
      let state = applyMove(SOLVED_CUBE, move);
      expect(isCubeSolved(state)).toBe(false);
      state = applyMove(state, inv);
      expect(isCubeSolved(state)).toBe(true);
    });

    it.each(ALL_MOVES)('inverse of %s followed by %s restores solved cube', (move) => {
      const inv = invertMove(move);
      let state = applyMove(SOLVED_CUBE, inv);
      expect(isCubeSolved(state)).toBe(false);
      state = applyMove(state, move);
      expect(isCubeSolved(state)).toBe(true);
    });
  });

  describe('Group Commutators & Algorithm Orders', () => {
    it('repeating Sexy Move (R U R\' U\') 6 times restores solved state', () => {
      const sexyMove = "R U R' U'";
      let state = SOLVED_CUBE;
      for (let i = 0; i < 6; i++) {
        for (const m of sexyMove.split(' ')) {
          state = applyMove(state, m);
        }
      }
      expect(isCubeSolved(state)).toBe(true);
    });

    it('repeating (R\' F R F\') 6 times restores solved state', () => {
      const sledgehammer = "R' F R F'";
      let state = SOLVED_CUBE;
      for (let i = 0; i < 6; i++) {
        for (const m of sledgehammer.split(' ')) {
          state = applyMove(state, m);
        }
      }
      expect(isCubeSolved(state)).toBe(true);
    });

    it('repeating (R2 U2) 6 times restores solved state', () => {
      let state = SOLVED_CUBE;
      for (let i = 0; i < 6; i++) {
        state = applyMove(state, 'R2');
        state = applyMove(state, 'U2');
      }
      expect(isCubeSolved(state)).toBe(true);
    });
  });

  describe('Massive WCA Scramble Stress Test (50 distinct scrambles)', () => {
    it('verifies 50 random WCA scrambles of length 25 invert to solved state with strict color conservation', () => {
      for (let i = 0; i < 50; i++) {
        const scramble = generateWCAScramble(25);
        const scrambled = applyScramble(scramble);
        expect(isCubeSolved(scrambled)).toBe(false);

        // Invariant 1: Color conservation (9 of each color)
        const counts = countColors(scrambled);
        expect(counts.white).toBe(9);
        expect(counts.yellow).toBe(9);
        expect(counts.green).toBe(9);
        expect(counts.blue).toBe(9);
        expect(counts.orange).toBe(9);
        expect(counts.red).toBe(9);

        // Invariant 2: Centers never change in 3x3 model
        expect(scrambled.U[4]).toBe(SOLVED_CUBE.U[4]);
        expect(scrambled.D[4]).toBe(SOLVED_CUBE.D[4]);
        expect(scrambled.F[4]).toBe(SOLVED_CUBE.F[4]);
        expect(scrambled.B[4]).toBe(SOLVED_CUBE.B[4]);
        expect(scrambled.L[4]).toBe(SOLVED_CUBE.L[4]);
        expect(scrambled.R[4]).toBe(SOLVED_CUBE.R[4]);

        // Invariant 3: Inverting the scramble restores the solved state
        const solution = invertMoves(scramble);
        let restored = scrambled;
        for (const m of solution.split(' ')) {
          restored = applyMove(restored, m);
        }
        expect(isCubeSolved(restored)).toBe(true);
      }
    });
  });

  describe('Edge cases and string handling', () => {
    it('handles empty scramble without altering state', () => {
      const state = applyScramble('');
      expect(isCubeSolved(state)).toBe(true);
    });

    it('handles irregular whitespace in scramble strings', () => {
      const scramble = "   R2   U'    F2   D    ";
      const scrambled = applyScramble(scramble);
      expect(isCubeSolved(scrambled)).toBe(false);
      const inv = invertMoves(scramble);
      expect(inv).toBe("D' F2 U R2");
      let restored = scrambled;
      for (const m of inv.split(' ')) {
        restored = applyMove(restored, m);
      }
      expect(isCubeSolved(restored)).toBe(true);
    });

    it('handles no-op / invalid move token gracefully', () => {
      const state = applyMove(SOLVED_CUBE, '');
      expect(isCubeSolved(state)).toBe(true);
    });
  });
});
