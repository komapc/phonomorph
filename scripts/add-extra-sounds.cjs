const fs = require('fs');
const path = require('path');

const SYMBOLS_DIR = path.join(__dirname, '../public/data/symbols');

const extraSounds = [
  { id: 'q', symbol: 'q', name: 'Voiceless uvular plosive', category: 'consonant', manner: 'Plosive' },
  { id: 'g_uvular', symbol: 'ɢ', name: 'Voiced uvular plosive', category: 'consonant', manner: 'Plosive' },
  { id: 'n_uvular', symbol: 'ɴ', name: 'Uvular nasal', category: 'consonant', manner: 'Nasal' },
  { id: 't_palatal', symbol: 'c', name: 'Voiceless palatal plosive', category: 'consonant', manner: 'Plosive' },
  { id: 'd_palatal', symbol: 'ɟ', name: 'Voiced palatal plosive', category: 'consonant', manner: 'Plosive' },
  { id: 'n_palatal', symbol: 'ɲ', name: 'Palatal nasal', category: 'consonant', manner: 'Nasal' },
  { id: 'zh', symbol: 'ʒ', name: 'Voiced postalveolar fricative', category: 'consonant', manner: 'Fricative' },
  { id: 'j_affricate', symbol: 'dʒ', name: 'Voiced postalveolar affricate', category: 'consonant', manner: 'Affricate' },
  { id: 'ng', symbol: 'ŋ', name: 'Velar nasal', category: 'consonant', manner: 'Nasal' },
  { id: 'w', symbol: 'w', name: 'Voiced labio-velar approximant', category: 'consonant', manner: 'Approximant' },
  { id: 'l_fricative', symbol: 'ɬ', name: 'Voiceless alveolar lateral fricative', category: 'consonant', manner: 'Fricative' },
  { id: 'l_fricative_voiced', symbol: 'ɮ', name: 'Voiced alveolar lateral fricative', category: 'consonant', manner: 'Fricative' }
];

extraSounds.forEach(s => {
  const filePath = path.join(SYMBOLS_DIR, `${s.id}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(s, null, 2));
    console.log(`Created ${s.id}.json`);
  }
});
