import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSymbol, fetchTransformation } from '../data/loader';
import type { IPASymbol, Transformation } from '../data/loader';
import { ArrowLeft, ArrowLeftRight, Edit3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GITHUB_REPO } from '../data/constants';
import { buildPayload } from '../data/transformPayload';
import type { SourceMeta, TransformPayload } from '../data/transformPayload';
import { usePagePayload } from '../contexts/PagePayloadContext';
import { TransformationView } from './TransformationView';

interface Loaded {
  key: string;
  fromSymbol: IPASymbol | null;
  toSymbol: IPASymbol | null;
  transformation: Transformation | null;
}

const TransformationPage = () => {
  const { fromId, toId } = useParams<{ fromId: string; toId: string }>();
  const { index: dataIndex } = useData();
  // Set when this page was prerendered (or hydrated from) static HTML.
  const embedded = usePagePayload();
  const preloaded = embedded?.kind === 'transform' ? embedded : null;
  const key = `${fromId}/${toId}`;
  const usePreloaded = !!preloaded && preloaded.fromId === fromId && preloaded.toId === toId;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [mappedSources, setMappedSources] = useState<Record<string, SourceMeta>>({});

  useEffect(() => {
    if (usePreloaded || !fromId || !toId) return;
    let cancelled = false;
    (async () => {
      let result: Loaded = { key, fromSymbol: null, toSymbol: null, transformation: null };
      try {
        const [fromSymbol, toSymbol, transformation] = await Promise.all([
          fetchSymbol(fromId),
          fetchSymbol(toId),
          fetchTransformation(fromId, toId),
        ]);
        result = { key, fromSymbol, toSymbol, transformation };
      } catch (err) {
        console.error('Failed to load transformation data:', err);
      }
      if (cancelled) return;
      setLoaded(result);
      fetch(`${import.meta.env.BASE_URL}data/sources_mapped.json`)
        .then((res) => (res.ok ? res.json() : {}))
        .then((data) => !cancelled && setMappedSources(data))
        .catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [key, fromId, toId, usePreloaded]);

  const current = loaded && loaded.key === key ? loaded : null;

  const payload: TransformPayload | null = useMemo(() => {
    if (usePreloaded) return preloaded;
    if (!current?.fromSymbol || !current.toSymbol || !current.transformation || !fromId || !toId) return null;
    return buildPayload(fromId, toId, current.fromSymbol, current.toSymbol, current.transformation, {
      catalog: dataIndex?.transformations ?? [],
      symbols: dataIndex?.symbols ?? [],
      families: dataIndex?.stats?.families ?? [],
      mappedSources,
    });
  }, [usePreloaded, preloaded, current, fromId, toId, dataIndex, mappedSources]);

  if (payload) return <TransformationView payload={payload} />;

  if (!current) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Details...</div>;
  }

  const { fromSymbol, toSymbol } = current;
  if (!fromSymbol || !toSymbol) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Symbol not found</h2>
        <Link to="/" style={{ color: 'var(--accent-color)' }}>Return to matrix</Link>
      </div>
    );
  }

  // Known symbols, but no documented shift for this pair.
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem' }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>[{fromSymbol.symbol}] → [{toSymbol.symbol}]</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>
        Information for this specific transformation has not been documented in the EchoDrift atlas yet.
      </p>
      <a
        href={`https://github.com/${GITHUB_REPO}/new/master/public/data/transformations?filename=${fromId}_to_${toId}.json`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ background: 'var(--accent-color)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Edit3 size={18} /> Contribute this Entry
      </a>
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
        <Link
          to={`/transform/${toId}/${fromId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.95rem' }}
        >
          <ArrowLeftRight size={16} /> View reverse: [{toSymbol.symbol}] → [{fromSymbol.symbol}]
        </Link>
        <Link to="/" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to Matrix</Link>
      </div>
    </div>
  );
};

export default TransformationPage;
