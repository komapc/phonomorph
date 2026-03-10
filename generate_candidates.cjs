
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data/index.json');
const missingPairsPath = path.join(__dirname, 'missing_pairs.json');
const candidatesPath = path.join(__dirname, 'candidate_pairs.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const missingPairs = JSON.parse(fs.readFileSync(missingPairsPath, 'utf8'));

const unattestedPairs = new Set(data.unattested);

const candidates = missingPairs.filter(pair => !unattestedPairs.has(pair));

fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2));

console.log(`Generated ${candidates.length} candidate pairs in candidate_pairs.json`);
