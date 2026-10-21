const fs = require('fs');

function expandAlgorithmNotation(notation) {
  if (!notation) return '';
  let str = notation;
  // Replace repeated parenthesized groups, e.g. (R U R' U')3 or [R U R' U']2
  // Can handle with or without multiplier, e.g. (R U R' U')3 or (R U R' U')*3
  str = str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
    const times = parseInt(count, 10);
    const repeated = [];
    for (let i = 0; i < times; i++) {
      repeated.push(inner.trim());
    }
    return ' ' + repeated.join(' ') + ' ';
  });

  // Strip remaining parentheses and brackets
  str = str.replace(/[()[\]]/g, ' ');

  // Collapse whitespace
  return str.trim().replace(/\s+/g, ' ');
}

const content = fs.readFileSync('./src/utils/algorithmsData.ts', 'utf8');
const algRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?notation:\s*"([^"]+)",\s*movesCount:\s*(\d+)/g;
let match;
let count = 0;
while ((match = algRegex.exec(content)) !== null) {
  count++;
  const id = match[1];
  const name = match[2];
  const rawNotation = match[4];
  const expectedMovesCount = parseInt(match[5], 10);
  const expanded = expandAlgorithmNotation(rawNotation);
  const tokens = expanded.split(/\s+/).filter(Boolean);

  const countMatches = tokens.length === expectedMovesCount;
  if (!countMatches || rawNotation.includes('(') || rawNotation.includes('[')) {
    console.log(`[${id}] "${rawNotation}"`);
    console.log(`  -> Expanded: "${expanded}"`);
    console.log(`  -> Tokens (${tokens.length}) vs movesCount (${expectedMovesCount}): ${countMatches ? 'OK' : 'MISMATCH'}`);
  }
}
