import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Book } from 'lucide-react';
import { glossaryTerms } from '../data/glossaryTerms';

const terms = glossaryTerms;

const Glossary = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Helmet>
        <title>Linguistic Glossary | EchoDrift Phonetic Atlas</title>
        <meta name="description" content="Definitions of phonetic processes and named sound laws: Grimm's Law, Verner's Law, Great Vowel Shift, Akan'ye, Ikan'ye, Iotacism, RUKI Law, Beged-Kefet, Grassmann's Law, and more." />
        <link rel="canonical" href="https://echodrift.pages.dev/glossary" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://echodrift.pages.dev/glossary" />
        <meta property="og:title" content="Linguistic Glossary | EchoDrift Phonetic Atlas" />
        <meta property="og:description" content="Key phonetic terminology: from Grimm's Law to Palatalization and Lenition." />
        <meta property="og:image" content="https://echodrift.pages.dev/og-preview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://echodrift.pages.dev/glossary" />
        <meta name="twitter:title" content="Linguistic Glossary" />
        <meta name="twitter:description" content="Glossary of phonetic processes and sound laws." />
        <meta name="twitter:image" content="https://echodrift.pages.dev/og-preview.png" />
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
