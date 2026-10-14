import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, Languages, FolderTree, Tag } from 'lucide-react';
import { usePagePayload } from '../contexts/PagePayloadContext';
import { hubSeo } from '../seo/hubSeo';
import { jsonForScript } from '../seo/transformSeo';
import { HeadTags } from '../seo/HeadTags';

interface HubPageProps {
  mode: 'language' | 'family' | 'process';
}

const HubPage: React.FC<HubPageProps> = ({ mode }) => {
  const { slug } = useParams<{ slug: string }>();
  const { index: dataIndex, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const targetName = slug ? decodeURIComponent(slug) : '';

  const relatedShifts = useMemo(() => {
    if (!dataIndex || !targetName) return [];

    return dataIndex.transformations.filter(t => {
      if (mode === 'language') {
        return t.languages?.includes(targetName);
      } else if (mode === 'process') {
        return t.tags?.includes(targetName);
      } else {
        // family mode: rebuild-index puts each transformation's language
        // families into `tags` (the substring-on-language-name approach missed
        // ~90% of shifts, e.g. Germanic showed 41 of 389).
        return t.tags?.includes(targetName);
      }
    });
  }, [dataIndex, targetName, mode]);

  const embedded = usePagePayload();
  const payload = embedded?.kind === 'hub' && embedded.mode === mode && embedded.name === targetName ? embedded : null;
  const shifts: { id: string; name: string }[] = payload
    ? payload.shifts
    : relatedShifts.map(t => ({ id: t.id, name: t.name }));

  if (!payload && loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Hub...</div>;
  if (!targetName) return <div style={{ padding: '4rem', textAlign: 'center' }}>Invalid Hub</div>;

  const seo = hubSeo(mode, targetName, shifts.length);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(seo.jsonLd) }} />
      {typeof document !== 'undefined' && <HeadTags tags={seo.head} />}

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '20px', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>
          {mode === 'language' ? <Languages size={32} /> : mode === 'family' ? <FolderTree size={32} /> : <Tag size={32} />}
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>{targetName}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          {shifts.length} documented transformations found for this {mode === 'process' ? 'phonetic process' : mode}.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder={`Filter ${targetName} shifts...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'white'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {shifts
          .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(t => {
            const [from, to] = t.id.split('_to_');
            return (
              <Link 
                key={t.id}
                to={`/transform/${from}/${to}`}
                style={{ 
                  background: 'var(--surface-color)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>[{from}] → [{to}]</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  →
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default HubPage;
