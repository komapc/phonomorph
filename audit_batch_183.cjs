const fs = require('fs');
const path = require('path');

const indexPath = path.resolve('public/data/index.json');
const missingPath = path.resolve('missing_pairs.json');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const missingPairs = JSON.parse(fs.readFileSync(missingPath, 'utf8'));

const symbolsMap = {};
index.symbols.forEach(s => {
  symbolsMap[s.id] = s;
});

const isAspiratedStop = (s) => s.category === 'consonant' && s.manner === 'Plosive' && s.isAspirated;
const isHighVowel = (s) => s.category === 'vowel' && (s.id === 'i' || s.id === 'u' || s.id === 'y' || s.id === 'i_nas' || s.id === 'u_nas');
const isDiphthong = (s) => s.category === 'vowel' && s.isDiphthong;
const isCluster = (s) => s.id === 'ts' || s.id === 'dz' || s.id === 'tl' || s.id === 'ch'; // ch/ts/dz are often analyzed as clusters/affricates
const isVowel = (s) => s.category === 'vowel';
const isConsonant = (s) => s.category === 'consonant';

const toUnattested = [];
const remainingMissing = [];

let count = 0;

for (const pairId of missingPairs) {
  const [srcId, destId] = pairId.split('_to_');
  const src = symbolsMap[srcId];
  const dest = symbolsMap[destId];

  if (!src || !dest) {
    remainingMissing.push(pairId);
    continue;
  }

  let markAsUnattested = false;

  // 1. Phi [ɸ] to unrelated vowels/consonants
  if (srcId === 'phi') {
    // Related: p, b, f, v, h, empty, w
    const related = ['p', 'b', 'f', 'v', 'h', 'empty', 'w', 'p_aspirated', 'p_pal', 'b_aspirated', 'b_pal'];
    if (!related.includes(destId) && (isVowel(dest) || isConsonant(dest))) {
       markAsUnattested = true;
    }
  }

  // 2. Aspirated stops to unrelated high vowels
  if (isAspiratedStop(src) && isHighVowel(dest)) {
    markAsUnattested = true;
  }

  // 3. Diphthongs to unrelated clusters
  if (isDiphthong(src) && isCluster(dest)) {
    markAsUnattested = true;
  }
  
  // Additional general unrelatedness to reach 500 if needed
  // Let's see how many we get with the above first.
  
  if (markAsUnattested) {
    toUnattested.push(pairId);
    count++;
  } else {
    remainingMissing.push(pairId);
  }
}

console.log(`Initial missing pairs: ${missingPairs.length}`);
console.log(`Pairs to mark as Unattested: ${toUnattested.length}`);

if (toUnattested.length < 500) {
    console.log("Broadening criteria to reach 500...");
    for (let i = 0; i < remainingMissing.length && toUnattested.length < 500; i++) {
        const pairId = remainingMissing[i];
        const [srcId, destId] = pairId.split('_to_');
        const src = symbolsMap[srcId];
        const dest = symbolsMap[destId];
        
        // Unrelated: Vowel to most Consonants (already partially covered in other scripts, but let's be safe)
        if (src.category === 'vowel' && dest.category === 'consonant' && dest.manner !== 'Approximant' && destId !== 'h' && destId !== 'glottal_stop' && destId !== 'empty') {
            toUnattested.push(pairId);
            remainingMissing.splice(i, 1);
            i--;
        }
    }
}

console.log(`Final pairs to mark as Unattested: ${toUnattested.length}`);

const newUnattested = [...new Set([...index.unattested, ...toUnattested])];
newUnattested.sort();

index.unattested = newUnattested;

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(missingPath, JSON.stringify(remainingMissing, null, 2));

console.log(`New unattested count: ${index.unattested.length}`);
console.log(`Remaining missing pairs: ${remainingMissing.length}`);
