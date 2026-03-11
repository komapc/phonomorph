import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, FolderTree } from 'lucide-react';

const Families = () => {
  const { index: dataIndex, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const families = useMemo(() => {
    return (dataIndex?.stats.families || []).sort();
  }, [dataIndex]);

  const filteredFamilies = useMemo(() => {
    return families.filter(f =>
      f.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [families, searchTerm]);

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Families...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Helmet>
        <title>Language Families | EchoDrift Phonetic Atlas</title>
        <meta name="description" content={`Browse ${families.length} language families and their phonetic sound shifts in the EchoDrift Atlas.`} />
      </Helmet>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '20px', color: 'var(--accent-color)', marginBottom: '1.5rem' }}>
          <FolderTree size={32} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Language Families</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          {families.length} families documented in the atlas
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search families..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredFamilies.map(family => (
          <Link
            key={family}
            to={`/family/${encodeURIComponent(family)}`}
            style={{
              background: 'var(--surface-color)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--surface-color)';
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
              📚
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>
              {family}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Explore shifts
            </p>
          </Link>
        ))}
      </div>

      {filteredFamilies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <p>No families match your search.</p>
        </div>
      )}
    </div>
  );
};

export default Families;
