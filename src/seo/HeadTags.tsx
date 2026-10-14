import type { HeadTag } from './transformSeo';

/** Renders <title>/<meta>/<link>; React 19 hoists them into <head>. */
export function HeadTags({ tags }: { tags: HeadTag[] }) {
  return (
    <>
      {tags.map((t, i) =>
        t.tag === 'title' ? (
          <title key={i}>{t.text}</title>
        ) : t.tag === 'link' ? (
          <link key={i} {...t.attrs} />
        ) : (
          <meta key={i} {...t.attrs} />
        )
      )}
    </>
  );
}
