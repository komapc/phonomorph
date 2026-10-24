import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, BookOpen, ShieldCheck, Link as LinkIcon, Tag, Edit3, ExternalLink } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { GlossaryTip } from '../components/GlossaryTip';
import { GITHUB_REPO } from '../data/constants';
import type { TransformPayload, SourceMeta } from '../data/transformPayload';
import { transformSeo, jsonForScript } from '../seo/transformSeo';
import { HeadTags } from '../seo/HeadTags';

const Wikilink = ({ children, type = 'wiki', showText = true }: { children: string, type?: 'wiki' | 'google', showText?: boolean }) => {
  const url = type === 'wiki' 
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(children)}`
    : `https://www.google.com/search?q=${encodeURIComponent(children)}`;
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: showText ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.2)' }}>
      {showText && children} <ExternalLink size={10} style={{ opacity: 0.5, verticalAlign: 'middle', marginLeft: showText ? '0.25rem' : 0 }} />
    </a>
  );
};

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

  const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(source)}`;
  return (
    <a href={searchUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}>
      {source} <ExternalLink size={12} style={{ opacity: 0.7 }} />
    </a>
  );
};

/**
 * Pure presentation of one transformation page. Used by the client page
 * (TransformationPage.tsx) and, at build time, by scripts/prerender.ts, so it
 * must not touch window/document or fetch anything.
 * `renderHead` defaults to false on the server (prerender): the head tags are
 * written into the static HTML <head> directly, and React 19 would otherwise
 * emit them inline in the body.
 */
export function TransformationView({
  payload,
  renderHead = typeof document !== 'undefined',
}: {
  payload: TransformPayload;
  renderHead?: boolean;
}) {
  const { fromId, toId, fromSymbol, toSymbol, transformation, moreLike, mappedSources } = payload;
  const familyNames = new Set(payload.familyNames);
  const githubEditUrl = `https://github.com/${GITHUB_REPO}/edit/master/public/data/transformations/${fromId}_to_${toId}.json`;
  const seo = transformSeo({ fromId, toId, fromSymbol, toSymbol, transformation, mappedSources });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(seo.jsonLd) }} />
      {renderHead && <HeadTags tags={seo.head} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Matrix
        </Link>
        <Link
          to={`/transform/${toId}/${fromId}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
        >
          <ArrowLeftRight size={16} /> [{toSymbol.symbol}] → [{fromSymbol.symbol}]
        </Link>
        <a
          href={githubEditUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
        >
          <GithubIcon size={16} /> Edit this Data
        </a>
      </div>

      <nav style={{ marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span style={{ opacity: 0.5 }}>&gt;</span>
        <Link to="/directory" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
        <span style={{ opacity: 0.5 }}>&gt;</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>[{fromSymbol.symbol}] to [{toSymbol.symbol}]</span>
      </nav>

      <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', margin: 0 }}>
          <span style={{ fontSize: '3rem', fontWeight: 800 }}>[{fromSymbol.symbol}]</span>
          <span style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>→</span>
          <span style={{ fontSize: '3rem', fontWeight: 800 }}>[{toSymbol.symbol}]</span>
          <span style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
             <span className={`badge ${transformation.certainty >= 4 ? 'badge-universal' : 'badge-common'}`}>
               Certainty: {transformation.certainty}/5
             </span>
             <span className={`badge badge-common`}>
               Commonality: {transformation.commonality}/5
             </span>
          </span>
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          {transformation.tags.map(tag => {
            const isFamily = familyNames.has(tag);
            const content = (
              <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'var(--surface-hover)', padding: '0.2rem 0.6rem', borderRadius: '100px', color: 'var(--text-secondary)' }}>
                <Tag size={12} /> {tag}
              </span>
            );

            if (isFamily) {
              return (
                <Link key={tag} to={`/family/${encodeURIComponent(tag)}`} style={{ textDecoration: 'none' }}>
                  {content}
                </Link>
              );
            }

            // Process tag (not a family) - make it clickable to /process/:tag
            return (
              <Link key={tag} to={`/process/${encodeURIComponent(tag)}`} style={{ textDecoration: 'none' }}>
                {content}
              </Link>
            );
          })}
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          <Wikilink>{fromSymbol.name}</ Wikilink> to <Wikilink>{toSymbol.name}</ Wikilink>
        </h2>

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
            {transformation.phoneticEffects.split(',').map((effect, i) => (
              <span key={i}>
                {i > 0 && ', '}
                <GlossaryTip term={effect.trim()} />
              </span>
            ))}
          </p>
        </div>

        <div className="section" style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
            <BookOpen size={20} /> Language Examples
          </h3>
          {transformation.languageExamples.map((lang, i) => (
            <div key={i} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Link to={`/language/${encodeURIComponent(lang.language)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {lang.language}
                  </Link>
                  <Wikilink type="google" showText={false}>{lang.language}</Wikilink>
                </span>
                {lang.languageFamily && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {familyNames.has(lang.languageFamily) ? (
                      <Link to={`/family/${encodeURIComponent(lang.languageFamily)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {lang.languageFamily}
                      </Link>
                    ) : (
                      lang.languageFamily
                    )}
                  </span>
                )}
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
                return (
                  <Link 
                    key={i} 
                    to={`/transform/${rel.fromId}/${rel.toId}`}
                    style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {rel.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {moreLike.items.length > 0 && (
          <div className="section" style={{ marginBottom: '2rem', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '8px', padding: '1rem', background: 'rgba(79, 70, 229, 0.02)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', marginTop: 0 }}>
              <LinkIcon size={20} /> More {moreLike.sharedTag} Shifts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {moreLike.items.map((rel) => (
                <Link
                  key={`${rel.fromId}_${rel.toId}`}
                  to={`/transform/${rel.fromId}/${rel.toId}`}
                  style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}
                >
                  [{rel.fromSymbol}] → [{rel.toSymbol}] — {rel.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sources & References</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {transformation.sources.map((src, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                <SourceLink source={src} mappedSources={mappedSources} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
         <h4 style={{ margin: '0 0 0.5rem 0' }}>Spotted a mistake or have a better example?</h4>
         <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
           EchoDrift is community-driven. You can suggest a change directly through GitHub.
         </p>
         <a 
          href={githubEditUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-color)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600 }}
         >
           <Edit3 size={18} /> Propose an Edit on GitHub
         </a>
      </div>
    </div>
  );
}
