import { useParams, Link } from 'react-router-dom';
import { symbols, transformations } from '../data/ipa';
import { ArrowLeft, BookOpen, ShieldCheck, Link as LinkIcon, Tag } from 'lucide-react';

const TransformationPage = () => {
  const { fromId, toId } = useParams<{ fromId: string; toId: string }>();
  const fromSymbol = symbols.find(s => s.id === fromId);
  const toSymbol = symbols.find(s => s.id === toId);
  const transformation = transformations.find(t => t.fromId === fromId && t.toId === toId);

  if (!fromSymbol || !toSymbol || !transformation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Transformation not found</h2>
        <Link to="/" style={{ color: 'var(--accent-color)' }}>Return to matrix</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Matrix
      </Link>

      <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800 }}>[{fromSymbol.symbol}]</div>
          <div style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>→</div>
          <div style={{ fontSize: '3rem', fontWeight: 800 }}>[{toSymbol.symbol}]</div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
             <span className={`badge ${transformation.certainty >= 4 ? 'badge-universal' : 'badge-common'}`}>
               Certainty: {transformation.certainty}/5
             </span>
             <span className={`badge badge-common`}>
               Commonality: {transformation.commonality}/5
             </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {transformation.tags.map(tag => (
            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'var(--surface-hover)', padding: '0.2rem 0.6rem', borderRadius: '100px', color: 'var(--text-secondary)' }}>
              <Tag size={12} /> {tag}
            </span>
          ))}
        </div>

        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          {fromSymbol.name} to {toSymbol.name}
        </h1>

        <div className="section" style={{ marginBottom: '2rem' }}>
          <p style={{ lineHeight: 1.6, fontSize: '1.1rem' }}>
            {transformation.preamble}
          </p>
        </div>

        <div className="section" style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
            <ShieldCheck size={20} /> Phonetic Effects
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {transformation.phoneticEffects}
          </p>
        </div>

        <div className="section" style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
            <BookOpen size={20} /> Language Examples
          </h3>
          {transformation.languageExamples.map((lang, i) => (
            <div key={i} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{lang.language}</span>
                {lang.languageFamily && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lang.languageFamily}</span>}
              </div>
              {lang.examples.map((ex, j) => (
                <div key={j} style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)', minWidth: '80px' }}>{ex.from}</span>
                  <span>→</span>
                  <span style={{ fontWeight: 500 }}>{ex.to}</span>
                  {ex.note && <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.8rem' }}>— {ex.note}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {transformation.related && transformation.related.length > 0 && (
          <div className="section" style={{ marginBottom: '2rem', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', marginTop: 0 }}>
              <LinkIcon size={20} /> Related Transformations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {transformation.related.map((rel, i) => {
                const targetSym = symbols.find(s => s.id === rel.toId);
                const sourceSym = symbols.find(s => s.id === rel.fromId);
                return (
                  <Link 
                    key={i} 
                    to={`/transform/${rel.fromId}/${rel.toId}`}
                    style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {rel.label} ({sourceSym?.symbol} → {targetSym?.symbol})
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sources & References</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {transformation.sources.map((src, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{src}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TransformationPage;
