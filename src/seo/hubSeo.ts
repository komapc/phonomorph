// <head> + JSON-LD for /language|family|process/:name hub pages. Shared by the
// React page, the prerenderer and functions/_middleware.js.
import { SITE_ORIGIN, SITE_NAME } from './transformSeo';
import type { HeadTag } from './transformSeo';
import { clampText } from '../utils/transformMeta';
import { lawFor } from '../data/laws';

export type HubKind = 'language' | 'family' | 'process';

export interface HubSeo {
  title: string;
  description: string;
  robots?: string;
  canonical: string;
  head: HeadTag[];
  jsonLd: Record<string, unknown>;
}

const NOUN: Record<HubKind, string> = {
  process: 'phonetic process',
  family: 'language family',
  language: 'language',
};

const PARENT: Record<HubKind, string> = {
  language: '/directory',
  family: '/families',
  process: '/glossary',
};

export function hubSeo(mode: HubKind, name: string, count: number): HubSeo {
  const path = `/${mode}/${encodeURIComponent(name)}`;
  const canonical = SITE_ORIGIN + path;
  const law = mode === 'process' ? lawFor(name) : undefined;
  const title = law ? `${name}: Sound Changes and Examples | ${SITE_NAME}` : `${name} Sound Changes | ${SITE_NAME}`;
  const description = law
    ? clampText(law.intro, 158)
    : clampText(
        `${count} documented phonetic shifts and sound changes for the ${NOUN[mode]} ${name} — transformations, language examples and sources on the ${SITE_NAME} atlas.`,
        200
      );
  // Hubs with a single shift are thin near-duplicates: linkable, not indexed.
  const robots = count < 2 ? 'noindex, follow' : undefined;
  const image = `${SITE_ORIGIN}/og-preview.png`;
  const meta = (key: 'name' | 'property', k: string, content: string): HeadTag => ({
    tag: 'meta',
    attrs: { [key]: k, content },
  });

  const head: HeadTag[] = [
    { tag: 'title', attrs: {}, text: title },
    meta('name', 'description', description),
    ...(robots ? [meta('name', 'robots', robots)] : []),
    { tag: 'link', attrs: { rel: 'canonical', href: canonical } },
    meta('property', 'og:type', 'website'),
    meta('property', 'og:url', canonical),
    meta('property', 'og:title', title),
    meta('property', 'og:description', `List of all documented phonetic transformations in ${name}.`),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:url', canonical),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', `Explore ${count} documented phonetic transformations in ${name}.`),
    meta('name', 'twitter:image', image),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ['Home', '/'],
      law ? ['Sound laws', '/laws'] : [mode[0].toUpperCase() + mode.slice(1) + 's', PARENT[mode]],
      [name, path],
    ].map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE_ORIGIN + p })),
  };

  return { title, description, robots, canonical, head, jsonLd };
}
