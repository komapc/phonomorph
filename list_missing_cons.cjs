const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const symbols = data.symbols;
const transformations = new Set(data.transformations.map(t => t.id));
const existingUnattested = new Set(data.unattested);

const consonants = symbols.filter(s => s.category === 'consonant');
const consIds = consonants.map(c => c.id);

let missing = [];
for (const id1 of consIds) {
    for (const id2 of consIds) {
        if (id1 === id2) continue;
        const pairId = `${id1}_to_${id2}`;
        if (!transformations.has(pairId) && !existingUnattested.has(pairId)) {
            missing.push(pairId);
        }
    }
}
console.log(`Remaining missing consonant-to-consonant pairs: ${missing.length}`);
console.log(missing.slice(0, 50));
