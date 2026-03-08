const fs = require('fs');
const path = require('path');

const SYMBOLS_DIR = path.join(__dirname, '../public/data/symbols');

const newSounds = [
  // Palatalized Consonants
  { id: 'p_pal', symbol: 'pʲ', name: 'Palatalized voiceless bilabial plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  { id: 'b_pal', symbol: 'bʲ', name: 'Palatalized voiced bilabial plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  { id: 't_pal', symbol: 'tʲ', name: 'Palatalized voiceless alveolar plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  { id: 'd_pal', symbol: 'dʲ', name: 'Palatalized voiced alveolar plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  { id: 'k_pal', symbol: 'kʲ', name: 'Palatalized voiceless velar plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  { id: 'g_pal', symbol: 'ɡʲ', name: 'Palatalized voiced velar plosive', category: 'consonant', manner: 'Plosive', isPalatalized: true, isExotic: true },
  
  // Nasalized Vowels
  { id: 'a_nas', symbol: 'ã', name: 'Nasalized open front unrounded vowel', category: 'vowel', height: 'Open', backness: 'Front', isNasalized: true, isExotic: true },
  { id: 'e_nas', symbol: 'ẽ', name: 'Nasalized close-mid front unrounded vowel', category: 'vowel', height: 'Close-mid', backness: 'Front', isNasalized: true, isExotic: true },
  { id: 'i_nas', symbol: 'ĩ', name: 'Nasalized close front unrounded vowel', category: 'vowel', height: 'Close', backness: 'Front', isNasalized: true, isExotic: true },
  { id: 'o_nas', symbol: 'õ', name: 'Nasalized close-mid back rounded vowel', category: 'vowel', height: 'Close-mid', backness: 'Back', isNasalized: true, isExotic: true },
  { id: 'u_nas', symbol: 'ũ', name: 'Nasalized close back rounded vowel', category: 'vowel', height: 'Close', backness: 'Back', isNasalized: true, isExotic: true },

  // Diphthongs
  { id: 'ai', symbol: 'ai', name: 'Diphthong ai', category: 'vowel', isDiphthong: true, isExotic: true },
  { id: 'au', symbol: 'au', name: 'Diphthong au', category: 'vowel', isDiphthong: true, isExotic: true },
  { id: 'ei', symbol: 'ei', name: 'Diphthong ei', category: 'vowel', isDiphthong: true, isExotic: true },
  { id: 'oi', symbol: 'oi', name: 'Diphthong oi', category: 'vowel', isDiphthong: true, isExotic: true }
];

newSounds.forEach(s => {
  const filePath = path.join(SYMBOLS_DIR, `${s.id}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(s, null, 2));
    console.log(`Created ${s.id}.json`);
  }
});
