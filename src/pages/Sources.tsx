import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, BookOpen, Search } from 'lucide-react';

interface SourceMeta {
  title: string;
  author?: string;
  year?: number;
  url?: string;
  unmapped?: boolean;
}

const Sources = () => {
  const [sources, setSources] = useState<Record<string, SourceMeta>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/sources_mapped.json`)
      .then(res => res.json())
      .then(data => {
        setSources(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sources:", err);
        setLoading(false);
      });
  }, []);

  const filteredEntries = Object.entries(sources).filter(([key, meta]) => {
    const search = searchTerm.toLowerCase();
    return key.toLowerCase().includes(search) || 
           meta.title.toLowerCase().includes(search) || 
           (meta.author && meta.author.toLowerCase().includes(search));
  }).sort((a, b) => a[1].title.localeCompare(b[1].title));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Bibliography...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Helmet>
        <title>Bibliography | EchoDrift — Phonetic Transformation Sources</title>
        <meta name="description" content="Academic bibliography of peer-reviewed sources, historical grammars, and linguistic handbooks used to document phonetic transformations in the EchoDrift atlas." />
        <link rel="canonical" href="https://echodrift.pages.dev/sources" />
      </Helmet>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Bibliography</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Authoritative academic sources and linguistic handbooks used to document the phonetic transformations in the PhonoMorph atlas.
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
        <input 
          type="text" 
          placeholder="Search by author, title, or citation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem 1rem 1rem 3rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredEntries.map(([key, meta]) => (
          <div 
            key={key} 
            style={{ 
              background: 'var(--surface-color)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'transform 0.2s ease',
              cursor: meta.url ? 'pointer' : 'default'
            }}
            onClick={() => meta.url && window.open(meta.url, '_blank')}
            onMouseEnter={(e) => meta.url && (e.currentTarget.style.transform = 'translateX(5px)')}
            onMouseLeave={(e) => meta.url && (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <BookOpen size={18} color={meta.url ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{meta.title}</h3>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {meta.author && <span>{meta.author}</span>}
                {meta.author && meta.year && <span> • </span>}
                {meta.year && <span>{meta.year}</span>}
                {!meta.author && !meta.year && <span style={{ fontStyle: 'italic', opacity: 0.7 }}>General Citation</span>}
              </div>
            </div>
            {meta.url && (
              <ExternalLink size={20} color="var(--text-secondary)" style={{ marginLeft: '1rem', opacity: 0.5 }} />
            )}
          </div>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No sources found matching your search.
        </div>
      )}
    </div>
  );
};

export default Sources;
