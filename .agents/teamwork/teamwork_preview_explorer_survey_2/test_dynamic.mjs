import {
  applyScramble,
  applyMove,
  isCubeSolved,
  generateWCAScramble,
} from '../../../src/utils/cubeState.ts';
import {
  generateDynamicSolution,
} from '../../../src/utils/solutionStages.ts';

const levels = ['auto-solve', 'level-1', 'level-2', 'level-3', 'level-4'];

console.log('=== TESTING DYNAMIC SCRAMBLE DECOMPOSITION ===\n');

for (let i = 0; i < 5; i++) {
  const scramble = generateWCAScramble(21);
  console.log(`[Test ${i + 1}] Scramble: ${scramble}`);

  for (const lvl of levels) {
    const sol = generateDynamicSolution(lvl, scramble);
    const moves = sol.stages.flatMap((s) => s.moves.map((m) => m.move));

    let state = applyScramble(scramble);
    for (const m of moves) {
      state = applyMove(state, m);
    }
    const solved = isCubeSolved(state);
    if (!solved) {
      console.error(`  Level ${lvl}: FAILED to solve!`);
    } else {
      console.log(`  Level ${lvl}: PASS (${moves.length} moves)`);
    }
  }
  console.log('');
}
