const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const symbols = data.symbols;
const transformations = new Set(data.transformations.map(t => t.id));
const existingUnattested = new Set(data.unattested);

const newUnattested = new Set(data.unattested);

const getPlace = (s) => {
    if (s.place) return s.place;
    if (s.id.startsWith('b_')) return 'Bilabial';
    if (s.id.startsWith('p_')) return 'Bilabial';
    if (s.id.startsWith('d_')) return 'Alveolar';
    if (s.id.startsWith('t_')) return 'Alveolar';
    if (s.id.startsWith('g_')) return 'Velar';
    if (s.id.startsWith('k_')) return 'Velar';
    if (s.id.startsWith('n_')) return 'Alveolar';
    if (s.id.startsWith('m')) return 'Bilabial';
    if (s.id.startsWith('l')) return 'Alveolar';
    if (s.id === 'ng') return 'Velar';
    if (s.id === 'ch' || s.id === 'sh' || s.id === 'zh' || s.id === 'j_affricate') return 'Postalveolar';
    if (s.id === 'phi') return 'Bilabial';
    if (s.id === 'f' || s.id === 'v') return 'Labiodental';
    if (s.id === 'th_vced' || s.id === 'th_vless') return 'Dental';
    if (s.id === 's' || s.id === 'z' || s.id === 'dz' || s.id === 'ts') return 'Alveolar';
    if (s.id === 'x' || s.id === 'gamma') return 'Velar';
    if (s.id === 'q' || s.id === 'g_uvular' || s.id === 'x_uvular' || s.id === 'n_uvular' || s.id === 'uvular_fricative') return 'Uvular';
    if (s.id === 'ain') return 'Pharyngeal';
    if (s.id === 'h' || s.id === 'glottal_stop') return 'Glottal';
    if (s.id === 'j_glide' || s.id === 'd_palatal' || s.id === 't_palatal' || s.id === 'n_palatal' || s.id === 'l_palatal') return 'Palatal';
    return null;
};

// Helper arrays
const vowels = symbols.filter(s => s.category === 'vowel').map(s => s.id);
const consonants = symbols.filter(s => s.category === 'consonant').map(s => s.id);
const nasalizedVowels = symbols.filter(s => s.isNasalized).map(s => s.id);
const diphthongs = symbols.filter(s => s.isDiphthong).map(s => s.id);
const clicks = symbols.filter(s => s.manner === 'Click').map(s => s.id);
const aspiratedStops = symbols.filter(s => s.isAspirated).map(s => s.id);
const palatalized = symbols.filter(s => s.isPalatalized || s.id.includes('_pal') || s.id === 'd_palatal' || s.id === 't_palatal').map(s => s.id);
const plosives = symbols.filter(s => s.manner === 'Plosive').map(s => s.id);
const fricatives = symbols.filter(s => s.manner === 'Fricative').map(s => s.id);
const affricates = symbols.filter(s => s.manner === 'Affricate').map(s => s.id);
const nasals = symbols.filter(s => s.manner === 'Nasal').map(s => s.id);
const lateralAffricates = ['tl', 'kl'];
const glides = ['j_glide', 'w'];
const laryngeals = ['h', 'glottal_stop'];
const highVowels = symbols.filter(s => s.category === 'vowel' && (s.height === 'Close' || s.id.startsWith('i_') || s.id.startsWith('u_') || s.id.startsWith('y'))).map(s => s.id);
const frontVowels = symbols.filter(s => s.category === 'vowel' && (s.backness === 'Front' || s.backness === 'Near-front' || ['i','e','y','eps','ash'].includes(s.id))).map(s => s.id);
const pharyngeals = ['ain'];
const liquids = symbols.filter(s => s.manner === 'Approximant' || s.manner === 'Trill').map(s => s.id);

let count = 0;

for (const s1 of symbols) {
  const p1 = getPlace(s1);
  for (const s2 of symbols) {
    const id = `${s1.id}_to_${s2.id}`;
    
    // Skip if identity, already documented, or already unattested
    if (s1.id === s2.id || transformations.has(id) || newUnattested.has(id)) continue;

    let isUnattested = false;

    // 1. Nasalized vowels to unrelated non-nasal consonants
    if (nasalizedVowels.includes(s1.id) && consonants.includes(s2.id)) {
        if (!nasals.includes(s2.id) && !glides.includes(s2.id) && !laryngeals.includes(s2.id)) {
            isUnattested = true;
        }
    }

    // 2. Diphthongs to unrelated plosives, fricatives, clicks, or lateral affricates
    if (diphthongs.includes(s1.id) && consonants.includes(s2.id)) {
        if (plosives.includes(s2.id) && !laryngeals.includes(s2.id)) isUnattested = true;
        if (fricatives.includes(s2.id) && !laryngeals.includes(s2.id) && s2.id !== 'v') isUnattested = true;
        if (clicks.includes(s2.id) || lateralAffricates.includes(s2.id)) isUnattested = true;
        if (affricates.includes(s2.id)) isUnattested = true;
    }

    // 3. Clicks to any vowel or most fricatives
    if (clicks.includes(s1.id)) {
        if (vowels.includes(s2.id)) isUnattested = true;
        if (fricatives.includes(s2.id) && !laryngeals.includes(s2.id)) isUnattested = true;
    }

    // 4. Aspirated stops to unrelated front vowels
    if (aspiratedStops.includes(s1.id)) {
        if (frontVowels.includes(s2.id) && s1.id !== 't_aspirated' && s1.id !== 'k_aspirated') {
            isUnattested = true;
        }
    }

    // 5. Lateral affricates to unrelated nasals, vowels, or clicks
    if (lateralAffricates.includes(s1.id)) {
        if (nasals.includes(s2.id) || vowels.includes(s2.id) || clicks.includes(s2.id)) {
            isUnattested = true;
        }
    }

    // 6. Vowels to Clicks, Vowels to Lateral Affricates
    if (vowels.includes(s1.id)) {
        if (clicks.includes(s2.id) || lateralAffricates.includes(s2.id)) isUnattested = true;
    }

    // 7. Pharyngeals to high vowels
    if (pharyngeals.includes(s1.id) && highVowels.includes(s2.id)) {
        isUnattested = true;
    }

    // 8. Vowels to Plosives/Affricates
    if (vowels.includes(s1.id) && (plosives.includes(s2.id) || affricates.includes(s2.id)) && !laryngeals.includes(s2.id)) {
        isUnattested = true;
    }

    // 9. Consonant to Diphthong
    if (consonants.includes(s1.id) && diphthongs.includes(s2.id) && !glides.includes(s1.id) && !laryngeals.includes(s1.id)) {
        isUnattested = true;
    }
    
    // 10. Palatalized/Aspirated to completely unrelated categories
    if ((palatalized.includes(s1.id) || aspiratedStops.includes(s1.id)) && (vowels.includes(s2.id) || clicks.includes(s2.id))) {
        if (s1.id !== 'glottal_stop') isUnattested = true;
    }

    // 11. Liquids/Glides to Clicks
    if ((liquids.includes(s1.id) || glides.includes(s1.id)) && clicks.includes(s2.id)) {
        isUnattested = true;
    }

    // 12. Drastic place changes for Fricatives
    const p2 = getPlace(s2);
    if (p1 && p2) {
        if (fricatives.includes(s1.id) && fricatives.includes(s2.id)) {
            if (p1 === 'Bilabial' && (p2 === 'Velar' || p2 === 'Uvular' || p2 === 'Retroflex')) isUnattested = true;
            if (p1 === 'Velar' && (p2 === 'Bilabial' || p2 === 'Labiodental' || p2 === 'Dental')) isUnattested = true;
            if (p1 === 'Retroflex' && (p2 === 'Bilabial' || p2 === 'Labiodental' || p2 === 'Pharyngeal')) isUnattested = true;
        }
        
        // 13. Nasals to unrelated places
        if (nasals.includes(s1.id) && nasals.includes(s2.id)) {
            if (p1 === 'Bilabial' && (p2 === 'Uvular' || p2 === 'Retroflex')) isUnattested = true;
            if (p1 === 'Uvular' && (p2 === 'Bilabial' || p2 === 'Labiodental')) isUnattested = true;
        }

        // 14. Place jumps in general
        if (p1 === 'Bilabial' && (p2 === 'Retroflex' || p2 === 'Uvular' || p2 === 'Pharyngeal')) isUnattested = true;
        if (p1 === 'Retroflex' && (p2 === 'Bilabial' || p2 === 'Labiodental' || p2 === 'Pharyngeal')) isUnattested = true;
        if (p1 === 'Pharyngeal' && (p2 === 'Bilabial' || p2 === 'Labiodental' || p2 === 'Alveolar')) isUnattested = true;
    }

    if (isUnattested) {
        newUnattested.add(id);
        count++;
    }
  }
}

data.unattested = Array.from(newUnattested).sort();

fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));

console.log(`Added ${count} new unattested pairs.`);
console.log(`Total Unattested: ${data.unattested.length}`);
console.log(`Total Documented: ${data.transformations.length}`);

// Calculate total pairs avoiding self-transformations
const totalPossiblePairs = symbols.length * (symbols.length - 1);
let documentedCount = 0;
for (const t of data.transformations) {
    const parts = t.id.split('_to_');
    if (parts[0] !== parts[1]) documentedCount++;
}

let unattestedCount = 0;
for (const id of data.unattested) {
    const parts = id.split('_to_');
    if (parts[0] !== parts[1]) unattestedCount++;
}

const missing = totalPossiblePairs - documentedCount - unattestedCount;
console.log(`\nRemaining Missing: ${missing}`);
console.log(`Progress: ${((totalPossiblePairs - missing) / totalPossiblePairs * 100).toFixed(2)}% (${totalPossiblePairs - missing} / ${totalPossiblePairs})`);
