import { Helmet } from 'react-helmet-async';

const About = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
      <Helmet>
        <title>About | EchoDrift — Universal Atlas of Phonetic Evolution</title>
        <meta name="description" content="The story behind EchoDrift: an attempt to prove that any speech sound can transform into any other — in some language, at some point in history. Nearly proven. One pair remains." />
        <link rel="canonical" href="https://echodrift.pages.dev/about" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://echodrift.pages.dev/about" />
        <meta property="og:title" content="About EchoDrift | The Universal Atlas of Phonetic Evolution" />
        <meta property="og:description" content="Why this exists, the hypothesis behind the matrix, and the search for the missing [ʌ]↔[y] shift." />
        <meta property="og:image" content="https://echodrift.pages.dev/og-preview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://echodrift.pages.dev/about" />
        <meta name="twitter:title" content="About EchoDrift" />
        <meta name="twitter:description" content="The story behind the universal atlas of phonetic evolution." />
        <meta name="twitter:image" content="https://echodrift.pages.dev/og-preview.png" />
      </Helmet>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>About EchoDrift</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        The Universal Atlas of Phonetic Evolution — an interactive map of how every human speech sound drifts, shifts, and mutates across languages and time.
      </p>

      {/* Origin Story */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          Why This Exists (A Confession)
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          It started as an argument. Or rather, as mild exasperation at the kind of amateur etymology that goes: <em>"Clearly, the English word <strong>bad</strong> and the Persian word <strong>bad</strong> (بد) are cognates — after all, [b] and [b] are the same sound!"</em> Or its cousin: <em>"[p] can shift to [f], and [f] can shift to [v], so obviously these two words are related."</em>
        </p>
        <p style={{ marginBottom: '1rem' }}>
          The logic is seductive. And it's also how you end up "proving" that every word in every language is related to every other word. Technically, you can chain sound shifts together across enough centuries, languages, and intermediary steps to get almost anywhere. Which raises the question: <strong>how far does "anywhere" actually go?</strong>
        </p>
        <p style={{ marginBottom: '1rem' }}>
          The original goal was to fill a matrix — every IPA sound against every other IPA sound — and see which pairs have a documented phonetic transformation in <em>at least one language, at some point in history</em>. The working hypothesis was <strong>"Any-to-Any"</strong>: that every sound can, in some language, become any other sound. (The repository is still named <code>a2a</code>, because the creator couldn't decide between "Any-to-Any" and "All-to-All" and asked an LLM — which promptly renamed it EchoDrift. So here we are.)
        </p>
        <p>
          The hypothesis turned out to be <em>nearly</em> correct. As you can see below.
        </p>
      </section>

      {/* The Vowel Matrix Image */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          The Vowel Matrix: Almost Full
        </h2>
        <figure style={{ margin: '0 0 1.5rem 0' }}>
          <img
            src="/vowel-matrix.png"
            alt="EchoDrift vowel-to-vowel transformation matrix showing nearly all cells filled, with only [y]↔[ʌ] unattested"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
          />
          <figcaption style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
            The vowel-to-vowel matrix. Filled cells have at least one documented language with that phonetic shift. The two dark "X" cells are [ʌ]↔[y] — the only vowel pair with no attested transformation found anywhere.
          </figcaption>
        </figure>
        <p style={{ marginBottom: '1rem' }}>
          For vowels, the Any-to-Any hypothesis is essentially proven. Every vowel phoneme in the matrix has a documented phonetic shift to every other vowel — <strong>except one pair: [ʌ] and [y]</strong>. The unrounded central-low vowel (as in English <em>strut</em>) and the rounded front high vowel (as in French <em>lune</em>) have stubbornly refused to shift into each other in any documented language.
        </p>
        <p style={{ fontStyle: 'italic', color: 'var(--accent-color)', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
          We dare you to find a language that has, or had, a [ʌ]→[y] or [y]→[ʌ] shift. If you do, please email us immediately.
        </p>
      </section>

      {/* What's in the Atlas */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          What's in the Atlas
        </h2>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>1600+ documented phonetic transformations</strong> across consonants, vowels, diphthongs, and allophones</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>90+ language families</strong> — Germanic, Romance, Semitic, Sino-Tibetan, Austronesian, Niger-Congo, Mayan, and more</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Allophone documentation</strong> with <strong>ALLO</strong> badges distinguishing synchronic variants from diachronic shifts</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Commonality heatmap</strong> — cell color intensity reflects how frequently each shift occurs cross-linguistically (scale 1–5)</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Unattested cells</strong> marked with "X" — researched and confirmed absent, not just missing</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Inverse detection</strong> — if A→B is documented, the B→A cell automatically links back</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Matrix modes</strong> — Symmetric, Vowel-to-Consonant (v2c), and Consonant-to-Vowel (c2v) views for complex cross-category shifts</li>
          <li><strong>Deep-linkable URLs</strong> — every transformation has a unique, citable address (e.g. <code>/transform/p/f</code>)</li>
        </ul>
      </section>

      {/* Primer */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          A Quick Primer: Shifts, Drifts, and Allophones
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Phonetic shifts</strong> (also called <em>sound changes</em> or <em>phonemic shifts</em>) are systematic changes in pronunciation that affect all speakers of a language over time. They follow rules — never random, always conditioned by phonetic environment, neighboring sounds, or social pressure. Grimm's Law, for instance, describes how Proto-Indo-European [p, t, k] shifted to Germanic [f, θ, h] — explaining why Latin <em>pater</em> corresponds to English <em>father</em>.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Phonetic drift</strong> is the gradual, cumulative direction of these changes across generations — the slow continental drift of a language's sound system. English vowels drifted dramatically during the Great Vowel Shift (1400–1700), turning Middle English <em>mees</em> [meːs] into modern <em>mice</em> [maɪs].
        </p>
        <p>
          <strong>Allophones</strong> are a different beast: not historical changes, but <em>synchronic variants</em> — pronunciations of the same phoneme that differ depending on context, without changing meaning. English speakers pronounce the [t] in <em>top</em> aspirated ([tʰ]) and the [t] in <em>stop</em> plain ([t]), without noticing. EchoDrift documents both types, with allophone cells clearly marked with an <strong>ALLO</strong> badge.
        </p>
      </section>

      {/* Methodology */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Methodology</h2>
        <p style={{ marginBottom: '1rem' }}>
          Every documented phonetic transformation in this atlas is backed by academic sources: peer-reviewed research, established historical sound laws, or systematic dialectal observations. The research process includes:
        </p>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>LLM-Assisted Research:</strong> Language models systematically search for academic sources on each phonetic shift across diverse language families, covering obscure dialects and under-documented languages.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Cross-Verification:</strong> Each shift is verified using independent sources. Shifts that appear only in AI-generated text without traceable academic backing are rejected.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Multilingual Documentation:</strong> Examples are drawn from multiple language families with transcriptions standardized to IPA, and original scripts preserved.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Source Databases:</strong> Google Scholar, Google Books, CyberLeninka, JSTOR, and specialized linguistic databases.</li>
          <li><strong>Unattested Cells:</strong> Pairs marked with an "X" have been researched and determined to lack any documented regular shift — distinguishing them from cells that simply haven't been researched yet.</li>
        </ul>
      </section>

      {/* Data Model */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Data Model</h2>
        <p style={{ marginBottom: '1rem' }}>
          EchoDrift uses a <strong>GitHub-as-Database</strong> architecture. Each cell in the matrix is a standalone JSON file containing:
        </p>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Preamble:</strong> A concise linguistic explanation of the shift and its phonetic motivation.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Phonetic Effects:</strong> Standardized process tags (Lenition, Fortition, Palatalization, Assimilation, Vowel Raising, Vowel Reduction, etc.).</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Language Examples:</strong> Documented cases from multiple language families, with native scripts alongside IPA transcriptions.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Scholarly Citations:</strong> Direct links to peer-reviewed sources, historical references, and academic databases.</li>
          <li><strong>Metadata:</strong> Certainty and commonality ratings (1–5), language family tags, allophone markers, and links to related transformations.</li>
        </ul>
      </section>

      {/* Contribute */}
      <section style={{ marginBottom: '4rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--success-color)' }}>Contribute</h3>
        <p>
          The atlas is a living document. If you find a missing transformation, a better academic source, or — please — a language with a [ʌ]→[y] shift, reach out at <strong>komapc@gmail.com</strong> or contribute directly via our <strong><a href="https://github.com/komapc/phonomorph" style={{ color: 'var(--accent-color)' }}>GitHub Repository</a></strong>. Click any empty cell in the matrix to get started.
        </p>
      </section>
    </div>
  );
};

export default About;
