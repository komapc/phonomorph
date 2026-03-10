const fs = require('fs');
const path = require('path');

const INDEX_FILE = '/home/mark/projects/a2a/public/data/index.json';
const MISSING_PAIRS_FILE = '/home/mark/projects/a2a/missing_pairs.json';

const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const missingPairs = JSON.parse(fs.readFileSync(MISSING_PAIRS_FILE, 'utf8'));

const nasalized = ['a_nas', 'e_nas', 'i_nas', 'o_nas', 'u_nas'];
const uvulars = ['ain', 'g_uvular', 'n_uvular', 'q', 'uvular_fricative', 'x_uvular'];
const diphthongs = ['ai', 'au', 'ei', 'ie', 'oi', 'ou', 'ue', 'ui', 'uo'];
const clicks = ['click_alveolar'];
const palatalized = ['b_pal', 'd_pal', 'g_pal', 'k_pal', 'p_pal', 't_pal'];
const latAffricates = ['kl', 'tl'];

const targeted = [];

// 1. Nasalized to uvulars
nasalized.forEach(n => {
  uvulars.forEach(u => targeted.push(`${n}_to_${u}`));
});

// 2. Diphthongs to clicks
diphthongs.forEach(d => {
  clicks.forEach(c => targeted.push(`${d}_to_${c}`));
});

// 3. Palatalized to lateral affricates
palatalized.forEach(p => {
  latAffricates.forEach(l => targeted.push(`${p}_to_${l}`));
});

const currentUnattested = new Set(index.unattested || []);
const currentTransformations = new Set((index.transformations || []).map(t => t.id));

let addedCount = 0;
targeted.forEach(p => {
  if (!currentUnattested.has(p) && !currentTransformations.has(p)) {
    index.unattested.push(p);
    currentUnattested.add(p);
    addedCount++;
  }
});

console.log(`Added ${addedCount} targeted pairs.`);

// Add more from missingPairs to reach ~200 new ones
let i = 0;
while (addedCount < 200 && i < missingPairs.length) {
  const p = missingPairs[i];
  if (!currentUnattested.has(p) && !currentTransformations.has(p)) {
    index.unattested.push(p);
    currentUnattested.add(p);
    addedCount++;
  }
  i++;
}

console.log(`Total new unattested pairs added: ${addedCount}`);

// Sort unattested
index.unattested.sort();

fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
console.log('Successfully updated index.json');
