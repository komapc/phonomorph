// Named sound laws. Each key is a process tag: its /process/<tag> hub becomes the
// law's page (intro + every tagged shift with its summary), and /laws lists them.
// Intros state the textbook formulation only; the examples come from the data.
export interface SoundLaw {
  /** Where and when the law applied, in a few words. */
  scope: string;
  intro: string;
}

export const SOUND_LAWS: Record<string, SoundLaw> = {
  "Grimm's Law": {
    scope: 'Proto-Indo-European to Proto-Germanic',
    intro:
      "Grimm's Law, the First Germanic Consonant Shift, describes how the Proto-Indo-European stops changed in Proto-Germanic: voiceless stops *p *t *k became fricatives *f *θ *x, plain voiced stops *b *d *g became voiceless *p *t *k, and voiced aspirates *bʰ *dʰ *gʰ lost their aspiration. It was described by Rasmus Rask (1818) and Jacob Grimm (1822), and explains pairs such as Latin pater and English father.",
  },
  "Grassmann's Law": {
    scope: 'Sanskrit and Ancient Greek',
    intro:
      "Grassmann's Law is a dissimilation of aspirates that happened independently in Sanskrit and Ancient Greek: when two aspirated consonants stood in successive syllables, the first lost its aspiration. It shows up in reduplicated verb forms such as Sanskrit babhūva 'has become' from bhū-, and was published by Hermann Grassmann in 1863.",
  },
  'High German Consonant Shift': {
    scope: 'Old High German, c. 6th–9th century',
    intro:
      'The High German Consonant Shift, or Second Germanic Consonant Shift, turned the Germanic voiceless stops *p *t *k into affricates (pf, ts, and kx in the far south) at the start of a word and after consonants, and into fricatives (f, s, x) after vowels. It separates High German from Low German, English and Dutch: German Apfel, Wasser and machen beside English apple, water and make.',
  },
  'Great Vowel Shift': {
    scope: 'English, c. 1400–1700',
    intro:
      'The Great Vowel Shift raised the long vowels of Middle English by one step and turned the two highest, /iː/ and /uː/, into diphthongs. It is why English spelling no longer matches its vowels: bite was once pronounced like modern beet, and house like modern hoose.',
  },
  Umlaut: {
    scope: 'Germanic languages and others',
    intro:
      'Umlaut is vowel fronting or raising triggered by a vowel or glide in the next syllable, most often i or j. In the Germanic languages it produced the alternations of English foot and feet and German Gast and Gäste, long after the triggering vowel itself had been lost.',
  },
  'I-Umlaut': {
    scope: 'Germanic languages',
    intro:
      'I-umlaut is the type of umlaut caused by a following i, ī or j: back vowels were fronted and low vowels raised in anticipation of the front vowel. It operated in all early Germanic languages except Gothic and is the source of English mouse and mice.',
  },
  Ruki: {
    scope: 'Indo-Iranian and Balto-Slavic',
    intro:
      'The ruki rule changed Proto-Indo-European *s into a hushing sibilant after r, u, k and i, the four sounds that give it its name. Its outcomes are ṣ in Sanskrit, š in Avestan, x in Slavic, and š in part of the Lithuanian vocabulary, and it was identified by Holger Pedersen in 1895.',
  },
};

export const lawFor = (processTag: string): SoundLaw | undefined => SOUND_LAWS[processTag];
