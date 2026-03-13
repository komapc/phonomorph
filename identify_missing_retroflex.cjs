const fs = require('fs');
const path = require('path');

const symbolsDir = 'public/data/symbols';
const transformationsDir = 'public/data/transformations';
const indexPath = 'public/data/index.json';

const targetIds = ['n_retroflex', 'l_retroflex', 'retroflex_stop_voiced', 'retroflex_flap'];

const allSymbols = fs.readdirSync(symbolsDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(symbolsDir, f), 'utf8')));

const consonants = allSymbols.filter(s => s.category === 'consonant');
const consonantIds = consonants.map(s => s.id);

const transformations = fs.readdirSync(transformationsDir)
  .filter(f => f.endsWith('.json'))
  .map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(transformationsDir, f), 'utf8'));
    } catch (e) {
      console.error(`Error parsing ${f}`);
      return null;
    }
  })
  .filter(Boolean);

const existingPairs = new Set(transformations.map(t => `${t.fromId}_to_${t.toId}`));

const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const existingUnattested = new Set(indexData.unattested || []);

let newUnattested = [];

targetIds.forEach(targetId => {
  consonantIds.forEach(otherId => {
    if (targetId === otherId) return;

    // target -> other
    const pair1 = `${targetId}_to_${otherId}`;
    if (!existingPairs.has(pair1) && !existingUnattested.has(pair1)) {
      newUnattested.push(pair1);
    }

    // other -> target
    const pair2 = `${otherId}_to_${targetId}`;
    if (!existingPairs.has(pair2) && !existingUnattested.has(pair2)) {
      newUnattested.push(pair2);
    }
  });
});

// Also check between the 4 themselves
targetIds.forEach(id1 => {
  targetIds.forEach(id2 => {
    if (id1 === id2) return;
    const pair = `${id1}_to_${id2}`;
    if (!existingPairs.has(pair) && !existingUnattested.has(pair)) {
      if (!newUnattested.includes(pair)) newUnattested.push(pair);
    }
  });
});

console.log(`Found ${newUnattested.length} new unattested pairs involving retroflex symbols.`);
// console.log(JSON.stringify(newUnattested, null, 2));

// Update index.json
const updatedUnattested = Array.from(new Set([...(indexData.unattested || []), ...newUnattested])).sort();
indexData.unattested = updatedUnattested;
fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
console.log(`Updated ${indexPath} with total ${updatedUnattested.length} unattested pairs.`);
