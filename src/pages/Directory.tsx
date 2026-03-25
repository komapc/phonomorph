import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, ListTree } from 'lucide-react';

const Directory = () => {
  const { index: dataIndex, loading } = useData();

  const groupedShifts = useMemo(() => {
    if (!dataIndex) return {};
    
    const groups: Record<string, typeof dataIndex.transformations> = {};
    dataIndex.transformations.forEach(t => {
      const [from] = t.id.split('_to_');
      if (!groups[from]) groups[from] = [];
      groups[from].push(t);
    });
    return groups;
  }, [dataIndex]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Directory...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Helmet>
        <link rel="canonical" href="https://echodrift.pages.dev/directory" />
        <title>Full Transformation Directory | EchoDrift Phonetic Atlas</title>
        <meta name="description" content="A comprehensive directory of all documented phonetic transformations, sound shifts, and allophonic relationships in the EchoDrift atlas." />
      </Helmet>

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
          Explore the complete collection of {dataIndex?.transformations.length} documented phonetic shifts.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '3rem' }}>
        {Object.entries(groupedShifts).sort().map(([fromId, shifts]) => {
          const fromSymbol = dataIndex?.symbols.find(s => s.id === fromId);
          return (
            <section key={fromId}>
              <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>[{fromSymbol?.symbol || fromId}]</span> 
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{fromSymbol?.name}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {shifts.map(t => {
                  const toId = t.id.split('_to_')[1];
                  const toSymbol = dataIndex?.symbols.find(s => s.id === toId);
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
                      [{fromSymbol?.symbol}] → [{toSymbol?.symbol}] {t.name}
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
