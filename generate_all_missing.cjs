
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const symbols = indexData.symbols;
const symbolIds = symbols.map(s => s.id);
const transformations = new Set(indexData.transformations.map(t => t.id));
const unattested = new Set(indexData.unattested);

const missing = [];
for (const fromId of symbolIds) {
    for (const toId of symbolIds) {
        if (fromId === toId) continue;
        const pairId = `${fromId}_to_${toId}`;
        if (!transformations.has(pairId) && !unattested.has(pairId)) {
            missing.push(pairId);
        }
    }
}

console.log(`Total possible missing: ${missing.length}`);
fs.writeFileSync('missing_pairs.json', JSON.stringify(missing, null, 2));
