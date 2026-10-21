const fs = require('fs');
const { applyScramble, applyMove, isCubeSolved } = require('./test_helper.cjs');

// Read solutionStages.ts
const content = fs.readFileSync('C:\\Users\\diamo\\.gemini\\antigravity\\worktrees\\rubik\\audit_and_refactor_code\\src\\utils\\solutionStages.ts', 'utf8');

// Let's extract the demo scrambles and solutions
// Level 1: LEVEL_1_LBL moves
// Level 2: LEVEL_2_CFOP moves
// Level 3: LEVEL_3_CFOP moves
// Level 4: LEVEL_4_ZBLL moves
// Auto-solve: OPTIMAL_AUTO_SOLVE moves

function extractMoves(blockName) {
  const startIdx = content.indexOf(`const ${blockName}: SolutionStage[] = [`);
  if (startIdx === -1) return null;
  const endIdx = content.indexOf('];', startIdx);
  const block = content.slice(startIdx, endIdx);
  const regex = /createMoves\((?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;
  let match;
  const allMoves = [];
  while ((match = regex.exec(block)) !== null) {
    const movesStr = match[1] || match[2] || match[3];
    allMoves.push(...movesStr.trim().split(/\s+/).filter(Boolean));
  }
  return allMoves;
}

// Check Auto-solve demo scramble
const autoSolveScrambleMatch = content.match(/const AUTO_SOLVE_DEMO_SCRAMBLE = ["']([^"']+)["']/);
const autoSolveScramble = autoSolveScrambleMatch ? autoSolveScrambleMatch[1] : null;

// CFOP demo scramble
const cfopScrambleMatch = content.match(/const CFOP_DEMO_SCRAMBLE = ["']([^"']+)["']/);
const cfopScramble = cfopScrambleMatch ? cfopScrambleMatch[1] : null;

const levels = [
  { name: 'auto-solve', block: 'OPTIMAL_AUTO_SOLVE', scramble: autoSolveScramble },
  { name: 'level-1', block: 'LEVEL_1_LBL', scramble: null },
  { name: 'level-2', block: 'LEVEL_2_CFOP', scramble: cfopScramble },
  { name: 'level-3', block: 'LEVEL_3_CFOP', scramble: null },
  { name: 'level-4', block: 'LEVEL_4_ZBLL', scramble: null },
];

const { invertMoves } = require('./test_helper.cjs');

console.log('Testing Demo Scramble + Solution Moves for all 5 levels:');

for (const lvl of levels) {
  const moves = extractMoves(lvl.block);
  if (!moves) {
    console.error(`Could not extract moves for ${lvl.name}`);
    continue;
  }
  const solutionStr = moves.join(' ');
  // If no explicit scramble constant, getScrambleForStages inverts full solution
  const scrambleStr = lvl.scramble || invertMoves(solutionStr);

  // Apply scramble to solved cube
  let state = applyScramble(scrambleStr);
  const scrambledSolved = isCubeSolved(state);

  // Now execute solution moves
  for (const m of moves) {
    state = applyMove(state, m);
  }
  const finalSolved = isCubeSolved(state);

  console.log(`Level: ${lvl.name.padEnd(11)} | Moves: ${String(moves.length).padStart(2)} | Scrambled: ${!scrambledSolved ? 'VALID' : 'ALREADY SOLVED'} | Solved after moves: ${finalSolved ? 'PASS (100%)' : 'FAIL'}`);
}
