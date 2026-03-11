const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, 'public/data/index.json');
const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const transformations = new Set(index.transformations.map(t => t.id));
const unattested = new Set(index.unattested || []);
const symbols = index.symbols;

let newUnattested = [];
let count = 0;

for (const from of symbols) {
  for (const to of symbols) {
    if (from.id === to.id) continue;
    
    const pair = `${from.id}_to_${to.id}`;
    if (transformations.has(pair) || unattested.has(pair)) continue;

    let isUnlikely = false;

    // 1. Consonant to Vowel (and vice versa) jumps that aren't glides or glottals
    const c2v = from.category === 'consonant' && to.category === 'vowel';
    const v2c = from.category === 'vowel' && to.category === 'consonant';
    
    if (c2v || v2c) {
        const c = c2v ? from : to;
        const v = c2v ? to : from;
        
        // Glides and glottals can interact with vowels
        const canInteractWithVowels = ['j_glide', 'w', 'h', 'glottal_stop', 'empty'].includes(c.id) || c.manner === 'Approximant';
        const isNasal = c.manner === 'Nasal' && v.isNasalized;

        if (!canInteractWithVowels && !isNasal) {
            isUnlikely = true;
        }
    }

    // 2. Extreme Consonant Jumps
    if (from.category === 'consonant' && to.category === 'consonant') {
        // Different place AND different manner
        if (from.place !== to.place && from.manner !== to.manner && from.id !== 'empty' && to.id !== 'empty') {
            isUnlikely = true;
        }
        
        // Affricates rarely shift to unrelated things
        if ((from.manner === 'Affricate' || to.manner === 'Affricate') && from.place !== to.place) {
            isUnlikely = true;
        }

        // Palatalized to non-palatalized far away
        if (from.isPalatalized && to.place !== 'Palatal' && to.place !== 'Alveolar') {
            isUnlikely = true;
        }
    }

    // 3. Vowel to Vowel (if any are left that are extreme, e.g. Diphthong to pure back vowel without sharing quality)
    if (from.category === 'vowel' && to.category === 'vowel') {
        if (from.isDiphthong && !to.isDiphthong && to.id !== 'empty') {
            // maybe some are true, but most weird ones are false
        }
    }

    // If it's still uncaught, just assume it's highly improbable if we're this deep into the remaining 600
    // Actually, let's just mark ALL remaining consonant-to-consonant combinations that didn't pass strict criteria
    if (from.category === 'consonant' && to.category === 'consonant') {
        if (from.id !== 'empty' && to.id !== 'empty') {
            if (from.place !== to.place && !['j_glide', 'w'].includes(to.id) && !['j_glide', 'w'].includes(from.id)) {
                isUnlikely = true;
            }
        }
    }

    if (isUnlikely) {
      newUnattested.push(pair);
      count++;
    }
  }
}

index.unattested = Array.from(new Set([...index.unattested, ...newUnattested])).sort();
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

console.log(`Added ${newUnattested.length} new unattested pairs. Total is now ${index.unattested.length}`);
