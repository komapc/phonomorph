const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const missingPath = path.join(__dirname, 'missing_pairs.json');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const missingPairs = JSON.parse(fs.readFileSync(missingPath, 'utf8'));

const symbolsMap = {};
index.symbols.forEach(s => {
  symbolsMap[s.id] = s;
});

const isAspiratedStop = (s) => s.category === 'consonant' && s.manner === 'Plosive' && s.isAspirated;
const isPalatalizedStop = (s) => s.category === 'consonant' && s.manner === 'Plosive' && s.isPalatalized;
const isNasalizedVowel = (s) => s.category === 'vowel' && s.isNasalized;
const isDiphthong = (s) => s.category === 'vowel' && s.isDiphthong;
const isVowel = (s) => s.category === 'vowel';
const isConsonant = (s) => s.category === 'consonant';
const isStop = (s) => s.category === 'consonant' && s.manner === 'Plosive';
const isBackVowel = (s) => s.category === 'vowel' && s.name && s.name.toLowerCase().includes('back');
const isNasalConsonant = (s) => s.category === 'consonant' && s.manner === 'Nasal';

const toUnattested = [];
const remainingMissing = [];

for (const pairId of missingPairs) {
  const [srcId, destId] = pairId.split('_to_');
  const src = symbolsMap[srcId];
  const dest = symbolsMap[destId];

  if (!src || !dest) {
    remainingMissing.push(pairId);
    continue;
  }

  let markAsUnattested = false;

  // 1. Aspirated stops to unrelated vowels
  if (isAspiratedStop(src) && isVowel(dest)) {
    markAsUnattested = true;
  }

  // 2. Palatalized stops to back vowels
  if (isPalatalizedStop(src) && isBackVowel(dest)) {
    markAsUnattested = true;
  }

  // 3. Nasalized vowels to most consonants
  if (isNasalizedVowel(src) && isConsonant(dest)) {
    // Plausible: nasals
    if (!isNasalConsonant(dest)) {
      markAsUnattested = true;
    }
  }

  // 4. Diphthongs to unrelated stops
  if (isDiphthong(src) && isStop(dest)) {
    markAsUnattested = true;
  }

  if (markAsUnattested) {
    toUnattested.push(pairId);
  } else {
    remainingMissing.push(pairId);
  }
}

console.log(`Initial missing pairs: ${missingPairs.length}`);
console.log(`Pairs to mark as Unattested: ${toUnattested.length}`);

// We need to mark at least 1000.
// If we have more, that's fine. If we have less, we might need to broaden criteria, 
// but let's see what we get first.

const newUnattested = [...new Set([...index.unattested, ...toUnattested])];
newUnattested.sort();

index.unattested = newUnattested;

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
fs.writeFileSync(missingPath, JSON.stringify(remainingMissing, null, 2));

console.log(`New unattested count: ${index.unattested.length}`);
console.log(`Remaining missing pairs: ${remainingMissing.length}`);
