const fs = require('fs');

const content = fs.readFileSync('./src/utils/algorithmsData.ts', 'utf8');

const algRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?notation:\s*"([^"]+)",\s*movesCount:\s*(\d+)/g;
const algs = [];
let match;
while ((match = algRegex.exec(content)) !== null) {
  algs.push({
    id: match[1],
    name: match[2],
    category: match[3],
    notation: match[4],
    movesCount: parseInt(match[5], 10)
  });
}

console.log(`Auditing all ${algs.length} algorithms:\n`);

algs.forEach((a, i) => {
  // Check if has repeat like (...)2 or (...)3
  const hasRepeat = /\)\d+/.test(a.notation);
  const hasParentheses = /[()]/.test(a.notation);
  const hasSlice = /[MESmes]/.test(a.notation);
  const hasWide = /[rludfb]/.test(a.notation) || /[RLUDFB]w/.test(a.notation);
  const hasRotation = /[xyzXYZ]/.test(a.notation);

  const tags = [];
  if (hasRepeat) tags.push('REPEAT_MULTIPLIER');
  if (hasParentheses) tags.push('PARENTHESES');
  if (hasSlice) tags.push('SLICE');
  if (hasWide) tags.push('WIDE');
  if (hasRotation) tags.push('ROTATION');

  console.log(`${(i+1).toString().padStart(2, ' ')}. [${a.category.padEnd(10, ' ')}] ${a.id.padEnd(12, ' ')} movesCount=${a.movesCount.toString().padStart(2, ' ')} | ${tags.length > 0 ? tags.join(', ') : 'STANDARD'}`);
  if (tags.length > 0) {
    console.log(`    Notation: "${a.notation}"`);
  }
});
