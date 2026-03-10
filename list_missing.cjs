const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const symbols = data.symbols;
const transformations = new Set(data.transformations.map(t => t.id));
const unattested = new Set(data.unattested);

const missing = [];

for (const s1 of symbols) {
  for (const s2 of symbols) {
    const id = `${s1.id}_to_${s2.id}`;
    if (!transformations.has(id) && !unattested.has(id)) {
      missing.push(id);
    }
  }
}

console.log(`Total Missing: ${missing.length}`);
console.log('Sample Missing:');
console.log(missing.slice(0, 100));
