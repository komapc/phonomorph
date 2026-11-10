import { Link } from 'react-router-dom';

export interface AtlasStats {
  shifts: number;
  languages: number;
  families: number;
}

const lawPath = (name: string) => `/process/${encodeURIComponent(name)}`;

/**
 * Plain-language introduction under the home matrix. It is part of the
 * prerendered dist/index.html (scripts/prerender.ts), so it is readable
 * without JavaScript; `stats` comes from the embedded home payload there.
 */
export function HomeIntro({ stats }: { stats: AtlasStats | null }) {
  return (
    <section className="home-intro" aria-labelledby="home-intro-title">
      <h2 id="home-intro-title">What is EchoDrift?</h2>
      <p className="home-intro-lead">
        EchoDrift is an atlas of <strong>sound change</strong>: a record of how one speech sound turns into
        another as languages evolve. Each filled cell of the IPA matrix is a <strong>phonetic shift</strong> between
        two sounds, such as [p] → [f] or [k] → [tʃ], with word examples, the languages and families where it
        happened, and the sources that document it.
        {stats && stats.shifts > 0 && (
          <>
            {' '}The atlas holds {stats.shifts} shifts across {stats.languages} languages in {stats.families} language
            families and branches.
          </>
        )}
      </p>

      <div className="home-intro-grid">
        <div>
          <h3>Sound changes and allophones</h3>
          <p>
            A sound change is a regular change in pronunciation over time: a sound shifts in every word where it
            occurs in the same position. An <strong>allophone</strong> is a variant of one sound that depends on its
            surroundings, like the aspirated [pʰ] of English <em>pin</em> next to the plain [p] of <em>spin</em>.
            Many historical changes begin as allophones, and shifts attested as allophony carry an ALLO badge. The{' '}
            <Link to="/glossary">glossary</Link> explains terms such as lenition, palatalization and debuccalization.
          </p>
        </div>
        <div>
          <h3>Famous sound laws</h3>
          <p>
            Some changes are well known enough to have names. <Link to={lawPath("Grimm's Law")}>Grimm&apos;s Law</Link>{' '}
            turned the Proto-Indo-European voiceless stops *p *t *k into the Germanic fricatives *f *θ *x, which is
            why Latin <em>pater</em> matches English <em>father</em>. The{' '}
            <Link to={lawPath('Great Vowel Shift')}>Great Vowel Shift</Link> raised the long vowels of Middle English
            and turned /iː/ and /uː/ into diphthongs, so <em>bite</em> once sounded like modern <em>beet</em>. The{' '}
            <Link to="/laws">sound laws</Link> page collects these and other named changes.
          </p>
        </div>
        <div>
          <h3>Explore the atlas</h3>
          <p>
            Click any cell of the matrix to open a shift, or browse every shift by its starting sound in the{' '}
            <Link to="/directory">directory</Link>. The <Link to="/families">language families</Link> page lists the
            families and branches covered, each with its own sound changes. To see how the data is collected and
            scored, read <Link to="/about">about the atlas</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
