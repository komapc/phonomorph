import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { SOUND_LAWS } from '../data/laws';

const URL = 'https://echodrift.lipu.dev/laws';
const TITLE = 'Sound Laws: Grimm’s, Grassmann’s, Great Vowel Shift | EchoDrift';
const DESCRIPTION = 'Named sound laws of historical linguistics, each with every shift it covers in the EchoDrift atlas: Grimm’s Law, Grassmann’s Law, the High German Consonant Shift, the Great Vowel Shift, umlaut and ruki.';

const lawPath = (tag: string) => `/process/${encodeURIComponent(tag)}`;

const Laws = () => {
  const laws = Object.entries(SOUND_LAWS);
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <>
        <link rel="canonical" href={URL} />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Sound Laws | EchoDrift',
          description: DESCRIPTION,
          url: URL,
          hasPart: laws.map(([name, law]) => ({
            '@type': 'DefinedTerm',
            name,
            description: law.intro,
            url: `https://echodrift.lipu.dev${lawPath(name)}`,
          })),
          breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://echodrift.lipu.dev/' },
            { '@type': 'ListItem', position: 2, name: 'Sound laws', item: URL },
          ]},
        })}</script>
        <meta property="og:type" content="website" />
        <meta property="og:url" content={URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
      </>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2.5rem', marginBottom: '1rem' }}>
        <Scale size={32} /> Sound Laws
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
        A sound law is a regular change that affected every word with the right sound in the right position, in one
        language at one period. Each law below links to its page in the atlas, with every documented shift it covers and
        word examples from the languages involved.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {laws.map(([name, law]) => (
          <Link
            key={name}
            to={lawPath(name)}
            style={{ display: 'block', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'var(--text-primary)' }}
          >
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.25rem' }}>{name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: '0.75rem' }}>{law.scope}</div>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{law.intro}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Laws;
