
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const missingPath = path.join(__dirname, 'missing_pairs.json');

const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const missingPairs = JSON.parse(fs.readFileSync(missingPath, 'utf8'));
const currentUnattested = new Set(indexData.unattested || []);
const currentTransformations = new Set(indexData.transformations.map(t => t.id));

const symbols = indexData.symbols;
const symbolMap = symbols.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
}, {});

const trulyMissing = missingPairs.filter(p => !currentUnattested.has(p) && !currentTransformations.has(p));

console.log("Truly missing:", trulyMissing.length);

for (const pairId of trulyMissing.slice(0, 100)) {
    const [fromId, toId] = pairId.split('_to_');
    const from = symbolMap[fromId];
    const to = symbolMap[toId];
    if (!from || !to) continue;
    console.log(`${pairId}: ${from.category}/${from.manner || ''} -> ${to.category}/${to.manner || ''}`);
}
