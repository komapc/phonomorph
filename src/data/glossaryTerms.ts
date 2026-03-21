export const glossaryTerms = [
  // ── Process terms ──────────────────────────────────────────────────────────
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
    term: "Monophthongization",
    definition: "A sound change where a diphthong (a complex vowel like [ai]) simplifies into a single, pure vowel sound (like [e]).",
    tags: ["Vowels", "Simplification"]
  },
  {
    term: "Vowel Harmony",
    definition: "A phonological process in which vowels within a word must share certain features — typically frontness/backness or rounding. A suffix vowel assimilates to the root vowel. Highly characteristic of Turkic (Turkish), Uralic (Finnish, Hungarian), and Mongolic languages.",
    tags: ["Vowels", "Assimilation"]
  },
  {
    term: "Ablaut",
    definition: "Systematic vowel alternation within a root morpheme that encodes grammatical information, inherited from Proto-Indo-European. Classic example: English sing / sang / sung, or German bind / band / gebunden. Not a sound change per se, but a synchronic reflex of ancient vowel grades (e, o, zero).",
    tags: ["Vowels", "Indo-European", "Morphophonology"]
  },
  {
    term: "Compensatory Lengthening",
    definition: "The lengthening of a vowel to compensate for the loss of a following consonant, preserving syllable weight. For example, Latin hostem → Old French oste [oːst] after [h] deletion; Proto-Greek *esmén → Doric ἦμεν (hêmen) after [s] deletion.",
    tags: ["Vowels", "Deletion"]
  },
  {
    term: "Yod-Coalescence",
    definition: "The merging of a consonant with a following palatal glide [j] (yod) to produce an affricate or palatal consonant. In English: [t+j] → [tʃ] (nature), [d+j] → [dʒ] (soldier), [s+j] → [ʃ] (sure). Common in fast speech across many languages.",
    tags: ["Consonants", "Assimilation", "Germanic"]
  },
  {
    term: "Betacism",
    definition: "The merger of the sounds [b] and [v] (or [β]) into a single phoneme. Characteristic of Spanish and many Romance varieties, where Latin /b/ and /v/ merged — producing a single phoneme realized as [b] word-initially and [β] intervocalically.",
    tags: ["Consonants", "Romance", "Merger"]
  },

  // ── Named laws & historical phenomena ─────────────────────────────────────
  {
    term: "Grimm's Law",
    definition: "A set of consonant shifts that transformed Proto-Indo-European (PIE) stops into fricatives and fricatives into stops in Proto-Germanic (c. 500–200 BCE). Three chains: (1) voiceless stops fricativized: *p→f, *t→θ, *k→h; (2) voiced stops devoiced: *b→p, *d→t, *g→k; (3) voiced aspirates lost aspiration: *bʰ→b, *dʰ→d, *gʰ→g. Explains why Latin pater = English father, Latin tres = English three.",
    tags: ["Consonants", "Germanic", "Indo-European", "Named Law"]
  },
  {
    term: "Verner's Law",
    definition: "A refinement of Grimm's Law (formulated 1875) explaining exceptions: voiceless fricatives produced by Grimm's Law became voiced when the PIE accent fell on the preceding syllable, not on the syllable immediately before. Explains alternations like English was/were, lose/forlorn. Named after Karl Verner.",
    tags: ["Consonants", "Germanic", "Indo-European", "Named Law"]
  },
  {
    term: "Great Vowel Shift",
    definition: "A sweeping chain shift of long vowels in Middle English (c. 1400–1700) that reshaped the entire English vowel system. High vowels diphthongized: /iː/ → /aɪ/ (mice, once pronounced 'mees'), /uː/ → /aʊ/ (house, once 'hoose'). Mid vowels raised: /eː/ → /iː/ (meet), /oː/ → /uː/ (moon). Explains why English spelling (frozen pre-shift) diverges so wildly from pronunciation.",
    tags: ["Vowels", "Germanic", "Chain Shift", "Named Law"]
  },
  {
    term: "Akan'ye (аканье)",
    definition: "Vowel reduction in unstressed syllables in Russian and other East Slavic languages: /o/ and /a/ both reduce to [a] (or [ə]) when unstressed. The name comes from the letter 'а' that dominates unstressed syllables. Example: молоко (milk) is pronounced [məlɐˈko], not [moloˈko]. Standard Russian (Moscow dialect) is akan'ye-based; dialects that preserve /o/ are called okan'ye (оканье).",
    tags: ["Vowels", "Slavic", "Reduction", "Allophony"]
  },
  {
    term: "Ikan'ye (иканье)",
    definition: "A vowel reduction process in Russian where unstressed /e/ and /a/ (after soft consonants) reduce to [i] or [ɪ]. Example: несу (I carry) → [nʲɪˈsu]. Works in tandem with akan'ye to produce the characteristic reduction pattern of standard Russian: the vowel inventory in unstressed position collapses from 5–6 phonemes to 2–3.",
    tags: ["Vowels", "Slavic", "Reduction", "Allophony"]
  },
  {
    term: "Iotacism",
    definition: "The merger of multiple distinct Greek vowel sounds into [i] (iota). Over centuries, the vowels η (eta, originally [eː]), υ (upsilon, originally [y]), οι (originally [oi]), and ει (originally [ei]) all converged to [i] in Byzantine and Modern Greek — producing the famous 'spelling problem' where six different letters/digraphs represent the same sound [i].",
    tags: ["Vowels", "Greek", "Merger", "Named Law"]
  },
  {
    term: "RUKI Law",
    definition: "A sound change in Indo-Iranian and Balto-Slavic branches: PIE *s shifted to *š (retroflex or palatal sibilant) after the sounds r, u, k, i (the name is an acronym of these conditioning environments). Example: PIE *mus- (mouse) → Sanskrit mūṣ-, Avestan mūš-, with the retroflex sibilant — compare Latin mūs which preserves the original [s]. The law explains divergences between Western and Eastern Indo-European.",
    tags: ["Consonants", "Indo-European", "Slavic", "Named Law"]
  },
  {
    term: "Grassmann's Law",
    definition: "A dissimilation rule independently active in Ancient Greek and Sanskrit: when two aspirated stops appear in successive syllables, the first loses its aspiration. Greek *pʰepʰeuka → πέφευγα (pépheyga); Sanskrit *bʰibʰarmi → bíbharmi. This explains why Greek and Sanskrit sometimes appear to disagree with Grimm's Law — the aspiration was dissimilated before the data was recorded. Named after Hermann Grassmann (1863).",
    tags: ["Consonants", "Indo-European", "Dissimilation", "Named Law"]
  },
  {
    term: "Bartholomae's Law",
    definition: "An assimilation rule in Indo-Iranian: a voiced aspirate stop at the end of a root causes a following voiceless stop suffix to become voiced aspirated. E.g., Sanskrit labdha- (obtained) from √labh + -ta → labdha. The voicing and aspiration spread rightward across the morpheme boundary. Named after Christian Bartholomae.",
    tags: ["Consonants", "Indo-European", "Assimilation", "Named Law"]
  },

  // ── Named phenomena (language-specific) ───────────────────────────────────
  {
    term: "Yeísmo",
    definition: "A widespread shift in Spanish dialects where the palatal lateral [ʎ] (ll) merges with the palatal glide [j] (y). Common in Latin America and much of Spain — speakers say [ˈkaʝo] for both callo (I'm silent) and cayó (he fell).",
    tags: ["Consonants", "Romance", "Merger"]
  },
  {
    term: "Beged-Kefet",
    definition: "A set of six Hebrew consonants — ב (b), ג (g), ד (d), כ (k), פ (p), ת (t) — each of which historically had two allophones: a stop variant after a pause or consonant, and a fricative variant after a vowel. For example, ב is [b] word-initially but [v] intervocalically; פ is [p] vs [f]. The name is a mnemonic acronym of the six letters. This allophonic alternation, attested in Biblical Hebrew and Aramaic, is a classic example of post-vocalic spirantization (lenition) conditioned by syllable position.",
    tags: ["Consonants", "Allophony", "Semitic", "Lenition"]
  },
].sort((a, b) => a.term.localeCompare(b.term));

export const glossaryMap = Object.fromEntries(
  glossaryTerms.map(t => [t.term, t])
);
