import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Book } from 'lucide-react';

const terms = [
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

const Glossary = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Helmet>
        <title>Linguistic Glossary | EchoDrift Phonetic Atlas</title>
        <meta name="description" content="Definitions of key phonetic processes like Lenition, Palatalization, Umlaut, and Rhotacism documented in the EchoDrift atlas." />
      </Helmet>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '20px', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>
          <Book size={32} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Linguistic Glossary</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Key phonetic processes and terminology used to describe the evolution of sounds in the EchoDrift atlas.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {terms.map((item, i) => (
          <div 
            key={i} 
            id={item.term.toLowerCase().replace(/\s+/g, '-')}
            style={{ 
              background: 'var(--surface-color)', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color)',
              transition: 'border-color 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'white' }}>{item.term}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {item.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.7rem', background: 'var(--surface-hover)', padding: '0.2rem 0.6rem', borderRadius: '100px', color: 'var(--text-secondary)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>
              {item.definition}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Ready to see these in action?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Explore the interactive matrix to find hundreds of documented examples for these processes.</p>
        <Link 
          to="/" 
          style={{ background: 'var(--accent-color)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}
        >
          Explore the Sound Matrix
        </Link>
      </div>
    </div>
  );
};

export default Glossary;
