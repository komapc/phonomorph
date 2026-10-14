// Everything a /transform/:from/:to page needs to render, in one serialisable
// object. Built at build time by scripts/prerender.ts (and embedded in the
// static HTML) or in the browser after a client-side navigation.
import type { IPASymbol, Transformation, TransformationMeta } from './loader';

export interface SourceMeta {
  title: string;
  author?: string;
  year?: number;
  url?: string;
  unmapped?: boolean;
}

export interface MoreLikeItem {
  fromId: string;
  toId: string;
  fromSymbol: string;
  toSymbol: string;
  name: string;
}

export interface TransformPayload {
  kind: 'transform';
  fromId: string;
  toId: string;
  fromSymbol: IPASymbol;
  toSymbol: IPASymbol;
  transformation: Transformation;
  /** Tags / language families that are language families (link to /family/...). */
  familyNames: string[];
  moreLike: { items: MoreLikeItem[]; sharedTag?: string };
  /** Mapped source metadata, restricted to this page's sources. */
  mappedSources: Record<string, SourceMeta>;
}

export interface PayloadContext {
  catalog: TransformationMeta[];
  symbols: { id: string; symbol: string }[];
  families: string[];
  mappedSources: Record<string, SourceMeta>;
}

export function buildPayload(
  fromId: string,
  toId: string,
  fromSymbol: IPASymbol,
  toSymbol: IPASymbol,
  transformation: Transformation,
  ctx: PayloadContext
): TransformPayload {
  const id = `${fromId}_to_${toId}`;
  const tags = transformation.tags || [];
  const symbolOf = (sid: string) => ctx.symbols.find((s) => s.id === sid)?.symbol || sid;

  const similar = ctx.catalog
    .filter((t) => t.id !== id && t.tags?.some((tag) => tags.includes(tag)))
    .sort((a, b) => b.commonality - a.commonality)
    .slice(0, 5);

  const familySet = new Set(ctx.families);
  const used = new Set<string>([
    ...tags,
    ...transformation.languageExamples.map((l) => l.languageFamily).filter((f): f is string => !!f),
  ]);

  const mapped: Record<string, SourceMeta> = {};
  for (const src of transformation.sources || []) {
    if (ctx.mappedSources[src]) mapped[src] = ctx.mappedSources[src];
  }

  return {
    kind: 'transform',
    fromId,
    toId,
    fromSymbol,
    toSymbol,
    transformation,
    familyNames: [...used].filter((n) => familySet.has(n)),
    moreLike: {
      items: similar.map((t) => {
        const [f, to] = t.id.split('_to_');
        return { fromId: f, toId: to, fromSymbol: symbolOf(f), toSymbol: symbolOf(to), name: t.name };
      }),
      sharedTag: similar.length ? tags.find((tag) => similar[0].tags?.includes(tag)) : undefined,
    },
    mappedSources: mapped,
  };
}

export type HubMode = 'language' | 'family' | 'process';

/** Data of a /language|family|process/:name hub page. */
export interface HubPayload {
  kind: 'hub';
  mode: HubMode;
  name: string;
  shifts: { id: string; name: string }[];
}

/** Whatever a prerendered page embeds (see scripts/prerender.ts). */
export type PagePayload = TransformPayload | HubPayload;
