import {
  applyScramble,
  applyMove,
  isCubeSolved,
  SOLVED_CUBE,
  invertMoves,
} from '../../../src/utils/cubeState.ts';
import {
  DEMO_SCRAMBLES,
  getStaticSolutionForLevel,
} from '../../../src/utils/solutionStages.ts';

const levels = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];

console.log('=== TESTING ALL 5 SOLVER LEVELS BUILT-IN DEMOS ===\n');

for (const lvl of levels) {
  const scramble = DEMO_SCRAMBLES[lvl];
  const solution = getStaticSolutionForLevel(lvl);
  const moves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));

  console.log(`Testing Level: ${lvl}`);
  console.log(`  Scramble (${scramble.split(' ').length} moves): ${scramble}`);
  console.log(`  Solution (${moves.length} moves): ${moves.join(' ')}`);

  // Start with solved cube, apply scramble
  let state = applyScramble(scramble);
  const scrambledSolved = isCubeSolved(state);

  // Apply all solution moves
  for (const m of moves) {
    state = applyMove(state, m);
  }

  const finallySolved = isCubeSolved(state);
  console.log(`  Scrambled initially solved? ${scrambledSolved}`);
  console.log(`  After solution solved? ${finallySolved ? 'PASS ✓' : 'FAIL ✗'}\n`);
}
