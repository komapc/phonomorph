// Single source of truth for everything in <head> (and JSON-LD) on a
// /transform/:from/:to page. Consumed by the React page (client), the build-time
// prerenderer (scripts/prerender.ts) and the crawler middleware
// (functions/_middleware.js), so the three can never drift apart.
import { transformTitle, transformDescription, hasExamples } from '../utils/transformMeta';

export const SITE_ORIGIN = 'https://echodrift.pages.dev';
export const SITE_NAME = 'EchoDrift';

interface SymbolLike {
  symbol: string;
  name: string;
}

interface TransformationLike {
  phoneticEffects?: string;
  preamble?: string;
  languageExamples?: { language?: string; examples?: unknown[] }[];
  sources?: string[];
  tags?: string[];
}

export interface TransformSeoInput {
  fromId: string;
  toId: string;
  fromSymbol: SymbolLike;
  toSymbol: SymbolLike;
  transformation: TransformationLike;
  /** Optional source-string -> { title } map, used for JSON-LD citations. */
  mappedSources?: Record<string, { title?: string } | undefined>;
}

export interface HeadTag {
  tag: 'title' | 'meta' | 'link';
  attrs: Record<string, string>;
  text?: string;
}

export interface TransformSeo {
  title: string;
  description: string;
  robots?: string;
  canonical: string;
  image: string;
  imageAlt: string;
  head: HeadTag[];
  jsonLd: Record<string, unknown>;
}

export function transformSeo(input: TransformSeoInput): TransformSeo {
  const { fromId, toId, fromSymbol, toSymbol, transformation, mappedSources } = input;
  const pair = `[${fromSymbol.symbol}] → [${toSymbol.symbol}]`;
  const effect = (transformation.phoneticEffects || '').split(',')[0].trim();
  const path = `/transform/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}`;
  const canonical = SITE_ORIGIN + path;
  const image = `${SITE_ORIGIN}/og/${encodeURIComponent(fromId)}/${encodeURIComponent(toId)}.png`;
  const imageAlt = `Phonetic shift ${pair}`;
  const title = transformTitle(pair, transformation);
  const description = transformDescription(pair, transformation);
  // A preamble with no language examples is thin; keep it linkable but out of the index.
  const robots = hasExamples(transformation) ? undefined : 'noindex, follow';
  const tags = transformation.tags || [];

  const meta = (key: 'name' | 'property', k: string, content: string): HeadTag => ({
    tag: 'meta',
    attrs: { [key]: k, content },
  });

  const head: HeadTag[] = [
    { tag: 'title', attrs: {}, text: title },
    meta('name', 'description', description),
    ...(robots ? [meta('name', 'robots', robots)] : []),
    meta('name', 'keywords', `phonetic shift, ${fromSymbol.name}, ${toSymbol.name}, ${tags.join(', ')}`),
    { tag: 'link', attrs: { rel: 'canonical', href: canonical } },
    meta('property', 'og:type', 'article'),
    meta('property', 'og:url', canonical),
    meta('property', 'og:title', `${pair}${effect ? ' ' + effect : ''}`),
    meta('property', 'og:description', `Linguistic details for the phonetic transformation from [${fromSymbol.symbol}] to [${toSymbol.symbol}]. Documented in the ${SITE_NAME} atlas.`),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', imageAlt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:url', canonical),
    meta('name', 'twitter:title', `Phonetic Shift: ${pair}`),
    meta('name', 'twitter:description', `Documented sound change from [${fromSymbol.symbol}] to [${toSymbol.symbol}]${effect ? ': ' + effect : ''}.`),
    meta('name', 'twitter:image', image),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ScholarlyArticle',
        headline: `Phonetic Shift: ${pair}${effect ? ` (${effect})` : ''}`,
        description: transformation.preamble || '',
        url: canonical,
        image,
        author: { '@type': 'Organization', name: 'EchoDrift Contributors' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/favicon.svg` },
        },
        about: [fromSymbol, toSymbol].map((s) => ({
          '@type': 'Thing',
          name: s.name,
          alternateName: s.symbol,
        })),
        keywords: tags.join(', '),
        citation: (transformation.sources || []).map((s) => mappedSources?.[s]?.title || s),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          ['Home', '/'],
          ['All transformations', '/directory'],
          [pair, path],
        ].map(([name, p], i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name,
          item: SITE_ORIGIN + p,
        })),
      },
    ],
  };

  return { title, description, robots, canonical, image, imageAlt, head, jsonLd };
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialises head tags to an HTML string (used outside React: prerender, middleware). */
export function headTagsToHtml(tags: HeadTag[]): string {
  return tags
    .map((t) => {
      if (t.tag === 'title') return `<title>${escapeAttr(t.text || '')}</title>`;
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(' ');
      return `<${t.tag} ${attrs}>`;
    })
    .join('\n    ');
}

/** `</script` inside JSON would end the tag early; escape `<`. */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
