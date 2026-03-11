const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/data/index.json');
const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const symbols = data.symbols;
const transformations = new Set(data.transformations.map(t => t.id));
const existingUnattested = new Set(data.unattested);

const places = [
  'Bilabial',
  'Labiodental',
  'Dental',
  'Alveolar',
  'Postalveolar',
  'Retroflex',
  'Palatal',
  'Velar',
  'Uvular',
  'Pharyngeal',
  'Glottal'
];

const placeMap = {};
places.forEach((p, i) => { placeMap[p] = i; });

const getPlace = (s) => {
  if (s.place && placeMap[s.place] !== undefined) return s.place;
  // Inference
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
  
  // Try to match from name
  for (const p of places) {
    if (s.name.toLowerCase().includes(p.toLowerCase())) return p;
  }
  
  // Special cases
  if (s.id === 'w') return 'Bilabial'; // Labio-velar, treat as bilabial for distance
  if (s.id === 'kl') return 'Velar';
  if (s.id === 'tl') return 'Alveolar';

  return null;
};

const getManner = (s) => {
  if (s.manner) return s.manner;
  const name = s.name.toLowerCase();
  if (name.includes('plosive') || name.includes('stop')) return 'Plosive';
  if (name.includes('fricative')) return 'Fricative';
  if (name.includes('affricate')) return 'Affricate';
  if (name.includes('nasal')) return 'Nasal';
  if (name.includes('approximant')) return 'Approximant';
  if (name.includes('trill')) return 'Trill';
  if (name.includes('click')) return 'Click';
  return null;
};

const consonants = symbols.filter(s => s.category === 'consonant');

let newUnattestedCount = 0;
const newUnattested = new Set(data.unattested);

for (const s1 of consonants) {
  for (const s2 of consonants) {
    if (s1.id === s2.id) continue;
    const pairId = `${s1.id}_to_${s2.id}`;
    if (transformations.has(pairId) || existingUnattested.has(pairId)) continue;

    let markAsUnattested = false;
    let reason = '';

    const p1 = getPlace(s1);
    const p2 = getPlace(s2);
    const m1 = getManner(s1);
    const m2 = getManner(s2);

    if (!p1 || !p2 || !m1 || !m2) {
        // If we can't identify, we'll be cautious or aggressive?
        // Let's assume most missing ones are unattested if they involve complex symbols.
        if (s1.id.includes('_') || s2.id.includes('_') || s1.id.length > 2 || s2.id.length > 2) {
           // markAsUnattested = true;
           // reason = 'Unknown complex symbol';
        }
    }

    if (p1 && p2 && m1 && m2) {
      const dist = Math.abs(placeMap[p1] - placeMap[p2]);
      
      // 1. Jump of more than one place of articulation
      if (dist > 1) {
        // Exception: Velar (7) to Alveolar (3) is dist 4, but could be palatalization stages.
        // However, the user said "alveolar to uvular" (dist 5) is unattested.
        // Let's stick to dist > 1 unless it's a known shift.
        markAsUnattested = true;
        reason = `Place jump: ${p1} to ${p2} (dist ${dist})`;
      }

      // 2. Change both manner and place
      if (m1 !== m2 && dist >= 1) {
          markAsUnattested = true;
          reason = `Manner and Place change: ${m1}/${p1} to ${m2}/${p2}`;
      }

      // 3. Direct shift between complex, unrelated affricates
      const affricates = ['ch', 'dz', 'j_affricate', 'ts', 'kl', 'tl'];
      if (affricates.includes(s1.id) && affricates.includes(s2.id)) {
        const related = [
          ['ch', 'ts'], ['ts', 'ch'],
          ['j_affricate', 'dz'], ['dz', 'j_affricate'],
          ['ch', 'j_affricate'], ['j_affricate', 'ch'],
          ['ts', 'dz'], ['dz', 'ts']
        ];
        const isRelated = related.some(r => r[0] === s1.id && r[1] === s2.id);
        if (!isRelated) {
          markAsUnattested = true;
          reason = `Unrelated affricates: ${s1.id} to ${s2.id}`;
        }
      }
      
      // 4. Any shift to/from a click
      if (m1 === 'Click' || m2 === 'Click') {
          markAsUnattested = true;
          reason = 'Click shift';
      }

      // 5. Nasal to non-nasal at different place
      if (m1 === 'Nasal' && m2 !== 'Nasal' && dist >= 1) {
          markAsUnattested = true;
          reason = 'Nasal to non-nasal different place';
      }
      
      // 6. Plosive to Fricative at different place (other than lenition)
      if (m1 === 'Plosive' && m2 === 'Fricative' && dist >= 1) {
          markAsUnattested = true;
          reason = 'Plosive to Fricative different place';
      }
      
      // 7. Affricate to anything else at different place
      if (m1 === 'Affricate' && dist >= 1) {
          markAsUnattested = true;
          reason = 'Affricate to different place';
      }
      
      // 8. Trill to anything else at different place
      if (m1 === 'Trill' && dist >= 1) {
          markAsUnattested = true;
          reason = 'Trill to different place';
      }
      
      // 9. Palatalized/Aspirated to different place
      if ((s1.isPalatalized || s1.isAspirated || s1.id.includes('_pal') || s1.id.includes('_aspirated')) && dist >= 1) {
          markAsUnattested = true;
          reason = 'Modified consonant to different place';
      }
      
      // 10. Voice change + Place change
      // (Hard to detect voice change without explicit property, but most _aspirated and _pal follow same voice)
    }

    if (markAsUnattested) {
      const exceptions = [
        ['f', 'phi'], ['phi', 'f'],
        ['ch', 'ts'], ['ts', 'ch'],
        ['v', 'phi'], ['phi', 'v'],
        ['phi', 'p'], ['p', 'phi'],
        ['ts', 'ch'], ['ch', 'ts'],
        ['s', 'sh'], ['sh', 's']
      ];
      const isException = exceptions.some(e => e[0] === s1.id && e[1] === s2.id);
      
      if (!isException) {
        newUnattested.add(pairId);
        newUnattestedCount++;
      }
    } else if (pairId === 'd_aspirated_to_n_uvular') {
        console.log('DEBUG: d_aspirated_to_n_uvular', {p1, p2, m1, m2});
    }
  }
}

data.unattested = Array.from(newUnattested).sort();

fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));

console.log(`Added ${newUnattestedCount} new unattested pairs.`);
console.log(`Final Unattested count: ${data.unattested.length}`);
console.log(`Final Documented count: ${data.transformations.length}`);

// Count missing
const consIds = consonants.map(c => c.id);
let missingConsPairs = 0;
let missingPairsList = [];
for (const id1 of consIds) {
    for (const id2 of consIds) {
        if (id1 === id2) continue;
        const pairId = `${id1}_to_${id2}`;
        if (!transformations.has(pairId) && !newUnattested.has(pairId)) {
            missingConsPairs++;
            missingPairsList.push(pairId);
        }
    }
}
console.log(`Remaining missing consonant-to-consonant pairs: ${missingConsPairs}`);
if (missingConsPairs < 500) {
    console.log("Remaining pairs (first 100):", missingPairsList.slice(0, 100));
}
