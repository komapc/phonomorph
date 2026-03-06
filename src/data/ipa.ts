export interface IPASymbol {
  id: string;
  symbol: string;
  name: string;
  category: 'vowel' | 'consonant';
  place?: string;
  manner?: string;
  height?: string;
  backness?: string;
  isExotic?: boolean; // For filtering
}

export interface RelatedTransformation {
  fromId: string;
  toId: string;
  label: string; // e.g., "Next in Grimm's Law", "Alternative Branch (before front vowels)"
  type: 'chain' | 'branch';
}

export interface Transformation {
  fromId: string;
  toId: string;
  preamble: string;
  phoneticEffects: string;
  languageExamples: {
    language: string;
    languageFamily?: string;
    examples: { from: string; to: string; note?: string }[];
  }[];
  period?: string;
  certainty: 1 | 2 | 3 | 4 | 5;
  commonality: 1 | 2 | 3 | 4 | 5;
  sources: string[];
  tags: string[]; // e.g., ["Indo-European", "Romance", "Grimm's Law"]
  related?: RelatedTransformation[];
}

export const symbols: IPASymbol[] = [
  // Consonants - Plosives
  { id: 'p', symbol: 'p', name: 'Voiceless bilabial plosive', category: 'consonant', place: 'Bilabial', manner: 'Plosive' },
  { id: 'b', symbol: 'b', name: 'Voiced bilabial plosive', category: 'consonant', place: 'Bilabial', manner: 'Plosive' },
  { id: 't', symbol: 't', name: 'Voiceless alveolar plosive', category: 'consonant', place: 'Alveolar', manner: 'Plosive' },
  { id: 'd', symbol: 'd', name: 'Voiced alveolar plosive', category: 'consonant', place: 'Alveolar', manner: 'Plosive' },
  { id: 'k', symbol: 'k', name: 'Voiceless velar plosive', category: 'consonant', place: 'Velar', manner: 'Plosive' },
  { id: 'g', symbol: 'g', name: 'Voiced velar plosive', category: 'consonant', place: 'Velar', manner: 'Plosive' },
  
  // Fricatives
  { id: 'f', symbol: 'f', name: 'Voiceless labiodental fricative', category: 'consonant', place: 'Labiodental', manner: 'Fricative' },
  { id: 'v', symbol: 'v', name: 'Voiced labiodental fricative', category: 'consonant', place: 'Labiodental', manner: 'Fricative' },
  { id: 'th_vless', symbol: 'θ', name: 'Voiceless dental fricative', category: 'consonant', place: 'Dental', manner: 'Fricative' },
  { id: 'th_vced', symbol: 'ð', name: 'Voiced dental fricative', category: 'consonant', place: 'Dental', manner: 'Fricative' },
  { id: 's', symbol: 's', name: 'Voiceless alveolar fricative', category: 'consonant', place: 'Alveolar', manner: 'Fricative' },
  { id: 'z', symbol: 'z', name: 'Voiced alveolar fricative', category: 'consonant', place: 'Alveolar', manner: 'Fricative' },
  { id: 'sh', symbol: 'ʃ', name: 'Voiceless postalveolar fricative', category: 'consonant', place: 'Postalveolar', manner: 'Fricative' },
  { id: 'h', symbol: 'h', name: 'Voiceless glottal fricative', category: 'consonant', place: 'Glottal', manner: 'Fricative' },
  { id: 'ain', symbol: 'ʕ', name: 'Voiced pharyngeal fricative', category: 'consonant', place: 'Pharyngeal', manner: 'Fricative', isExotic: true },

  // Others
  { id: 'm', symbol: 'm', name: 'Bilabial nasal', category: 'consonant', place: 'Bilabial', manner: 'Nasal' },
  { id: 'n', symbol: 'n', name: 'Alveolar nasal', category: 'consonant', place: 'Alveolar', manner: 'Nasal' },
  { id: 'l', symbol: 'l', name: 'Alveolar lateral approximant', category: 'consonant', place: 'Alveolar', manner: 'Approximant' },
  { id: 'r', symbol: 'r', name: 'Alveolar trill', category: 'consonant', place: 'Alveolar', manner: 'Trill' },
  { id: 'ch', symbol: 'tʃ', name: 'Voiceless postalveolar affricate', category: 'consonant', place: 'Postalveolar', manner: 'Affricate' },
  { id: 'empty', symbol: '∅', name: 'Empty sound / Zero', category: 'consonant' },
  
  // Vowels
  { id: 'i', symbol: 'i', name: 'Close front unrounded vowel', category: 'vowel', height: 'Close', backness: 'Front' },
  { id: 'e', symbol: 'e', name: 'Close-mid front unrounded vowel', category: 'vowel', height: 'Close-mid', backness: 'Front' },
  { id: 'eps', symbol: 'ε', name: 'Open-mid front unrounded vowel', category: 'vowel', height: 'Open-mid', backness: 'Front' },
  { id: 'a', symbol: 'a', name: 'Open front unrounded vowel', category: 'vowel', height: 'Open', backness: 'Front' },
  { id: 'u', symbol: 'u', name: 'Close back rounded vowel', category: 'vowel', height: 'Close', backness: 'Back' },
  { id: 'o', symbol: 'o', name: 'Close-mid back rounded vowel', category: 'vowel', height: 'Close-mid', backness: 'Back' },
  { id: 'schwa', symbol: 'ə', name: 'Mid central vowel', category: 'vowel', height: 'Mid', backness: 'Central' },
];

export const transformations: Transformation[] = [
  {
    fromId: 'p',
    toId: 'f',
    preamble: 'As part of Grimm\'s Law, Proto-Indo-European voiceless plosives became voiceless fricatives in Proto-Germanic.',
    phoneticEffects: 'Fricativization (Grimm\'s Law).',
    languageExamples: [
      {
        language: 'PIE to Germanic',
        languageFamily: 'Indo-European',
        examples: [
          { from: '*ph₂tḗr', to: 'father (English)', note: 'Latin pater, Greek patēr retain the [p].' },
          { from: '*pisk-', to: 'fish (English)', note: 'Latin piscis.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 5,
    sources: ['Campbell: Historical Linguistics'],
    tags: ['Indo-European', 'Germanic', 'Grimm\'s Law'],
    related: [
      { fromId: 't', toId: 'th_vless', label: 'Part of Grimm\'s Law (t → θ)', type: 'chain' },
      { fromId: 'k', toId: 'h', label: 'Part of Grimm\'s Law (k → h)', type: 'chain' },
    ]
  },
  {
    fromId: 't',
    toId: 'th_vless',
    preamble: 'The shift from [t] to [θ] is the second part of the first act of Grimm\'s Law.',
    phoneticEffects: 'Fricativization.',
    languageExamples: [
      {
        language: 'PIE to Germanic',
        languageFamily: 'Indo-European',
        examples: [
          { from: '*treyes', to: 'three (English)', note: 'Latin tres.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 5,
    sources: ['Campbell: Historical Linguistics'],
    tags: ['Indo-European', 'Germanic', 'Grimm\'s Law'],
    related: [
      { fromId: 'p', toId: 'f', label: 'Part of Grimm\'s Law (p → f)', type: 'chain' },
      { fromId: 'k', toId: 'h', label: 'Part of Grimm\'s Law (k → h)', type: 'chain' },
    ]
  },
  {
    fromId: 'k',
    toId: 'h',
    preamble: 'The voiceless velar plosive [k] shifted to the glottal fricative [h] (via [x]) in Germanic languages.',
    phoneticEffects: 'Debuccalization of the velar fricative [x].',
    languageExamples: [
      {
        language: 'PIE to Germanic',
        languageFamily: 'Indo-European',
        examples: [
          { from: '*ḱm̥tóm', to: 'hundred (English)', note: 'Latin centum [k], Greek hekaton.' },
          { from: '*kuon-', to: 'hound (English)', note: 'Latin canis.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 5,
    sources: ['Campbell: Historical Linguistics'],
    tags: ['Indo-European', 'Germanic', 'Grimm\'s Law'],
    related: [
      { fromId: 'p', toId: 'f', label: 'Part of Grimm\'s Law (p → f)', type: 'chain' },
      { fromId: 't', toId: 'th_vless', label: 'Part of Grimm\'s Law (t → θ)', type: 'chain' },
    ]
  },
  {
    fromId: 'k',
    toId: 'ch',
    preamble: 'Palatalization of [k] before front vowels (i, e) is one of the most frequent changes in human language, occurring independently in Romance, Slavic, and Indo-Iranian branches.',
    phoneticEffects: 'Palatalization and affrication.',
    languageExamples: [
      {
        language: 'Latin to Italian',
        languageFamily: 'Romance',
        examples: [
          { from: 'centum [k]', to: 'cento [tʃ]', note: 'Before front vowel /e/.' },
          { from: 'civitas [k]', to: 'città [tʃ]', note: 'Before front vowel /i/.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 5,
    sources: ['Alkire & Rosen: Romance Philology'],
    tags: ['Romance', 'Palatalization'],
    related: [
      { fromId: 'k', toId: 'h', label: 'Alternative: Grimm\'s Law (k → h)', type: 'branch' },
      { fromId: 'k', toId: 's', label: 'Alternative: French Palatalization (k → s)', type: 'branch' },
    ]
  },
  {
    fromId: 'b',
    toId: 'v',
    preamble: 'The [b] to [v] shift is a classic example of lenition (weakening).',
    phoneticEffects: 'Spirantization.',
    languageExamples: [
      {
        language: 'Spanish',
        languageFamily: 'Romance',
        examples: [
          { from: 'habere', to: 'haber [aβer]', note: 'Latin /b/ became Spanish /β/.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 5,
    sources: ['Penny: A History of the Spanish Language'],
    tags: ['Romance', 'Lenition']
  },
  {
    fromId: 'ain',
    toId: 'empty',
    preamble: 'The voiced pharyngeal fricative [ʕ] (Arabic "ain") is often lost in languages without pharyngeals.',
    phoneticEffects: 'Elision.',
    languageExamples: [
      {
        language: 'Hebrew',
        languageFamily: 'Semitic',
        examples: [
          { from: 'ʕolam', to: 'olam', note: 'Modern Hebrew treats it as zero or glottal stop.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 4,
    sources: ['Gesenius\' Hebrew Grammar'],
    tags: ['Semitic', 'Elision']
  },
  {
    fromId: 'e',
    toId: 'i',
    preamble: 'Vowel raising is common in unstressed positions.',
    phoneticEffects: 'Ikanie.',
    languageExamples: [
      {
        language: 'Russian',
        languageFamily: 'Slavic',
        examples: [
          { from: 'reka', to: 'ri-', note: 'Unstressed.' },
        ]
      }
    ],
    certainty: 5,
    commonality: 4,
    sources: ['Jones: The Phonetics of Russian'],
    tags: ['Slavic', 'Vowels']
  }
];
