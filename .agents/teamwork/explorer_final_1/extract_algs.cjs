const fs = require('fs');

const content = fs.readFileSync('./src/utils/algorithmsData.ts', 'utf8');

// The notation string is enclosed in double quotes: notation: "..."
const algRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?notation:\s*"([^"]+)"/g;
const algs = [];
let match;
while ((match = algRegex.exec(content)) !== null) {
  algs.push({
    id: match[1],
    name: match[2],
    category: match[3],
    notation: match[4]
  });
}

console.log('Total parsed algorithms:', algs.length);
algs.forEach((a, i) => {
  console.log(`${i + 1}. [${a.category}] id="${a.id}" name="${a.name}"\n   notation="${a.notation}"`);
});

// Check unique tokens across all algorithms
const allTokens = new Set();
const bracketTokens = new Set();
const nonStandardTokens = new Set();

algs.forEach(a => {
  // raw split by whitespace
  const rawTokens = a.notation.trim().split(/\s+/);
  rawTokens.forEach(t => {
    allTokens.add(t);
    if (/[()\[\]]/.test(t)) {
      bracketTokens.add(t);
    }
    const clean = t.replace(/[()\[\]]/g, '');
    if (!/^[UDFBLR][2']?$/.test(clean)) {
      nonStandardTokens.add(clean);
    }
  });
});

console.log('\n--- Bracket tokens ---');
console.log([...bracketTokens]);

console.log('\n--- Non-standard tokens (cleaned of brackets) ---');
console.log([...nonStandardTokens]);
