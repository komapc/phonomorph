export const glossaryTerms = [
  {
    term: "Lenition",
    definition: "A phonetic process where a consonant becomes 'weaker' or more sonorous. Typical paths include Plosive → Fricative → Approximant → Zero. For example, [p] shifting to [ɸ] or [v].",
    tags: ["Consonants", "Weakening"]
  },
  {
    term: "Fortition",
    definition: "The opposite of lenition; a process where a sound becomes 'stronger' or more constricted. For example, a fricative becoming a stop (e.g., [ɸ] → [p]) or a glide becoming a fricative.",
    tags: ["Consonants", "Strengthening"]
  },
  {
    term: "Palatalization",
    definition: "A sound change where a consonant's place of articulation moves toward the hard palate, often triggered by a following high front vowel like [i] or glide [j]. For example, [k] → [tʃ].",
    tags: ["Consonants", "Assimilation"]
  },
  {
    term: "Umlaut (i-mutation)",
    definition: "A type of vowel assimilation where a back vowel is pulled forward (fronted) due to a following high front sound in the next syllable. Characteristic of Germanic languages (e.g., German Maus → Mäuse).",
    tags: ["Vowels", "Assimilation"]
  },
  {
    term: "Debuccalization",
    definition: "A sound change where an oral consonant loses its place of articulation and moves to the glottis, typically becoming [h] or [ʔ]. For example, Spanish [s] → [h] in 'estos'.",
    tags: ["Consonants", "Weakening"]
  },
  {
    term: "Spirantization",
    definition: "A specific type of lenition where a stop consonant (plosive) becomes a fricative. For example, [b] → [v] or [k] → [x].",
    tags: ["Consonants", "Lenition"]
  },
  {
    term: "Nasalization",
    definition: "The production of a sound while lowering the soft palate, allowing air to escape through the nose. Often affects vowels adjacent to nasal consonants (e.g., [an] → [ã]).",
    tags: ["Assimilation"]
  },
  {
    term: "Rhotacism",
    definition: "A phonetic shift where a consonant (typically [s] or [z]) changes into a rhotic sound [r]. Famous in Latin (honos → honoris) and Germanic languages.",
    tags: ["Consonants"]
  },
  {
    term: "Lambdacism",
    definition: "A phonetic shift where a sound (often [r]) changes into a lateral [l]. The opposite of rhotacism.",
    tags: ["Consonants", "Liquids"]
  },
  {
    term: "Yeísmo",
    definition: "A widespread shift in Spanish dialects where the palatal lateral [ʎ] (ll) merges with the palatal glide [j] (y).",
    tags: ["Consonants", "Romance"]
  },
  {
    term: "Monophthongization",
    definition: "A sound change where a diphthong (a complex vowel like [ai]) simplifies into a single, pure vowel sound (like [e]).",
    tags: ["Vowels", "Simplification"]
  }
].sort((a, b) => a.term.localeCompare(b.term));

export const glossaryMap = Object.fromEntries(
  glossaryTerms.map(t => [t.term, t])
);
