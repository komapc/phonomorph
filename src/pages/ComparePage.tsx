import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSymbol, fetchTransformation } from '../data/loader';
import type { IPASymbol, Transformation } from '../data/loader';
import { ArrowLeft, BookOpen, ShieldCheck, Tag, ExternalLink } from 'lucide-react';

const Wikilink = ({ children, type = 'wiki' }: { children: string, type?: 'wiki' | 'google' }) => {
  const url = type === 'wiki' 
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(children)}`
    : `https://www.google.com/search?q=${encodeURIComponent(children)}`;
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}>
      {children} <ExternalLink size={10} style={{ opacity: 0.5, verticalAlign: 'middle' }} />
    </a>
  );
};

interface SourceMeta {
  title: string;
  author?: string;
  year?: number;
  url?: string;
  unmapped?: boolean;
}

const SourceLink = ({ source, mappedSources }: { source: string, mappedSources: Record<string, SourceMeta> }) => {
  const isUrl = source.startsWith('http');
  const mapped = mappedSources[source];

  if (isUrl) {
    return (
      <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {source} <ExternalLink size={12} />
      </a>
    );
  }

  if (mapped && mapped.url) {
    return (
      <a href={mapped.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        {mapped.title} <ExternalLink size={12} style={{ opacity: 0.7 }} />
      </a>
    );
  }

  return <span>{source}</span>;
};

interface ShiftData {
  fromId: string;
  toId: string;
  fromSymbol: IPASymbol | null;
  toSymbol: IPASymbol | null;
  transformation: Transformation | null;
}

const CompareColumn = ({ data, mappedSources }: { data: ShiftData, mappedSources: Record<string, SourceMeta> }) => {
  const { fromSymbol, toSymbol, transformation } = data;

  if (!fromSymbol || !toSymbol) return <div>Symbol missing</div>;
  if (!transformation) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Shift data not yet documented.</div>;

  return (
    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>[{fromSymbol.symbol}]</div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>→</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>[{toSymbol.symbol}]</div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {transformation.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: '0.65rem', background: 'var(--surface-hover)', padding: '0.15rem 0.5rem', borderRadius: '100px', color: 'var(--text-secondary)' }}>
              <Tag size={10} style={{ verticalAlign: 'middle' }} /> {tag}
            </span>
          ))}
        </div>

        <p style={{ lineHeight: 1.5, fontSize: '0.95rem' }}>{transformation.preamble}</p>
      </div>

      <div className="section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
          <ShieldCheck size={16} /> Phonetic Effects
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>{transformation.phoneticEffects}</p>
      </div>

      <div className="section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
          <BookOpen size={16} /> Key Examples
        </h4>
        {transformation.languageExamples.slice(0, 3).map((lang, i) => (
          <div key={i} style={{ marginBottom: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{lang.language}</div>
            {lang.examples.slice(0, 2).map((ex, j) => (
              <div key={j} style={{ display: 'flex', gap: '0.5rem', opacity: 0.9 }}>
                <span>{ex.from} → {ex.to}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="section" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>References</h4>
        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {transformation.sources.slice(0, 3).map((src, i) => (
            <li key={i} style={{ marginBottom: '0.25rem' }}>
              <SourceLink source={src} mappedSources={mappedSources} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ComparePage = () => {
  const { shiftA, shiftB } = useParams<{ shiftA: string; shiftB: string }>();
  const [dataA, setDataA] = useState<ShiftData | null>(null);
  const [dataB, setDataB] = useState<ShiftData | null>(null);
  const [mappedSources, setMappedSources] = useState<Record<string, SourceMeta>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!shiftA || !shiftB) return;
      setLoading(true);
      try {
        const sourcesRes = await fetch(`${import.meta.env.BASE_URL}data/sources_mapped.json`).then(res => res.json());
        setMappedSources(sourcesRes);

        const [fromA, toA] = shiftA.split('_to_');
        const [fromB, toB] = shiftB.split('_to_');

        const [fSymA, tSymA, transA, fSymB, tSymB, transB] = await Promise.all([
          fetchSymbol(fromA),
          fetchSymbol(toA),
          fetchTransformation(fromA, toA),
          fetchSymbol(fromB),
          fetchSymbol(toB),
          fetchTransformation(fromB, toB)
        ]);

        setDataA({ fromId: fromA, toId: toA, fromSymbol: fSymA, toSymbol: tSymA, transformation: transA });
        setDataB({ fromId: fromB, toId: toB, fromSymbol: fSymB, toSymbol: tSymB, transformation: transB });
      } catch (err) {
        console.error("Failed to load comparison data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [shiftA, shiftB]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Comparison...</div>;
  if (!dataA || !dataB) return <div style={{ padding: '2rem', textAlign: 'center' }}>Data Error</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Evolution Comparison</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Analyzing parallel shifts and divergence: <Wikilink>{dataA.fromSymbol?.name || ''}</Wikilink> vs <Wikilink>{dataB.fromSymbol?.name || ''}</Wikilink>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <CompareColumn data={dataA} mappedSources={mappedSources} />
        <div style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch', opacity: 0.5 }} />
        <CompareColumn data={dataB} mappedSources={mappedSources} />
      </div>
    </div>
  );
};

export default ComparePage;
