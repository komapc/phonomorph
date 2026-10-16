import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { usePagePayload } from '../contexts/PagePayloadContext';
import type { DirectoryPayload } from '../data/transformPayload';
import { ArrowLeft, ListTree } from 'lucide-react';

const Directory = () => {
  const { index: dataIndex, loading } = useData();

  const embedded = usePagePayload();
  const embeddedDir = embedded?.kind === 'directory' ? embedded : null;

  const groups = useMemo<DirectoryPayload['groups']>(() => {
    if (embeddedDir) return embeddedDir.groups;
    if (!dataIndex) return [];
    const byFrom = new Map<string, DirectoryPayload['groups'][number]>();
    const sym = (id: string) => dataIndex.symbols.find(s => s.id === id);
    dataIndex.transformations.forEach(t => {
      const [from, to] = t.id.split('_to_');
      if (!byFrom.has(from)) {
        const f = sym(from);
        byFrom.set(from, { fromId: from, symbol: f?.symbol || from, name: f?.name || '', shifts: [] });
      }
      byFrom.get(from)!.shifts.push({ id: t.id, name: t.name, toSymbol: sym(to)?.symbol || '' });
    });
    return [...byFrom.values()].sort((a, b) => a.fromId.localeCompare(b.fromId));
  }, [embeddedDir, dataIndex]);
  const total = embeddedDir?.total ?? dataIndex?.transformations.length;

  if (loading && !embeddedDir) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Directory...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <>
        <link rel="canonical" href="https://echodrift.lipu.dev/directory" />
        <title>Full Transformation Directory | EchoDrift Phonetic Atlas</title>
        <meta name="description" content="A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships in the EchoDrift atlas." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Full Transformation Directory | EchoDrift",
          "description": "A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships.",
          "url": "https://echodrift.lipu.dev/directory",
          "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://echodrift.lipu.dev/" },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://echodrift.lipu.dev/directory" }
          ]}
        })}</script>
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://echodrift.lipu.dev/directory" />
        <meta property="og:title" content="Full Transformation Directory | EchoDrift Phonetic Atlas" />
        <meta property="og:description" content="A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships in the EchoDrift atlas." />
        <meta property="og:image" content="https://echodrift.lipu.dev/og-preview.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Full Transformation Directory | EchoDrift Phonetic Atlas" />
        <meta name="twitter:description" content="A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships in the EchoDrift atlas." />
        <meta name="twitter:image" content="https://echodrift.lipu.dev/og-preview.png" />
      </>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '20px', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>
          <ListTree size={32} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Transformation Directory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Explore the complete collection of {total} documented phonetic shifts.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '3rem' }}>
        {groups.map(({ fromId, symbol, name, shifts }) => {
          return (
            <section key={fromId}>
              <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>[{symbol}]</span> 
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{name}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {shifts.map(t => {
                  const toId = t.id.split('_to_')[1];
                  return (
                    <Link 
                      key={t.id} 
                      to={`/transform/${fromId}/${toId}`}
                      style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--text-secondary)', 
                        textDecoration: 'none',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--surface-color)',
                        borderRadius: '8px',
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      [{symbol}] → [{t.toSymbol}] {t.name}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Directory;
